// ─── BOQ Chunk Builder ────────────────────────────────────────────────────────
//
// Groups raw Excel rows into logical BOQ chunks that preserve section context
// and parent-child relationships for downstream LLM normalization.
// No external dependencies; pure TypeScript.

// ─── Public interface ─────────────────────────────────────────────────────────

export interface BoqChunk {
  section: string | null;
  subsection: string | null;
  parentItem: string | null;
  parentDsrCode: string | null;
  parentDescription: string | null;
  rows: Record<string, unknown>[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SLIDING_WINDOW_SIZE = 30;
const SLIDING_WINDOW_OVERLAP = 5;

// ─── Regular expressions ──────────────────────────────────────────────────────

// Section header patterns:
//   "Sub Head - I, Earth Work"
//   "Sub Head - II, Concrete Work"
//   "Earth Work", "Concrete Work", "Finishing Work"
//   "PART A - CIVIL WORKS", "CHAPTER 1 - FOUNDATIONS"
const RE_SECTION = /^(?:sub\s*head\s*[-–]\s*[IVXLCDM\d]+\s*[,:]?\s*|part\s+\w+\s*[-–:]\s*|chapter\s+\w+\s*[-–:]\s*)?([A-Z][A-Za-z0-9\s/()&,.-]{3,})$/;

// Subsection header: "1. Earth Work", "A. Excavation", "i. Ordinary Soil"
const RE_SUBSECTION = /^(?:[A-Za-z]|\d{1,2})[.)]\s+([A-Z][A-Za-z0-9\s/()&,.-]{3,})$/;

// Parent item number: "1", "1.1", "2.3", "5.4"  (exactly 1 or 2 numeric segments)
const RE_PARENT_ITEM = /^\d+(?:\.\d+)?$/;

// Child item number: "1.1.1", "1.1.2", "2.3.1", "4.2.5" (3+ numeric segments)
const RE_CHILD_ITEM = /^\d+(?:\.\d+){2,}$/;

// DSR code: "2.6", "2.6.1", "DSR-2.6", "DSR 2.6" — a secondary numbering column
const RE_DSR_CODE = /^(?:DSR[-\s]?)?\d+(?:\.\d+){1,3}$/i;

// Subtotal / grand total sentinel words
const RE_TOTAL = /\b(?:sub[\s-]?total|grand[\s-]?total|total|carried\s+over|brought\s+forward|c\/o|b\/f)\b/i;

// Pure numeric strings (page numbers, amounts, quantities) — NOT item numbers
const RE_PURE_NUMBER = /^[\d,.()\s]+$/;

// ─── Row-value helpers ────────────────────────────────────────────────────────

/** Collect all non-empty string/number values from a row. */
function rowValues(row: Record<string, unknown>): string[] {
  return Object.values(row)
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
    .map((v) => String(v).trim());
}

/** Return the first non-empty string value in the row. */
function firstValue(row: Record<string, unknown>): string | null {
  const vals = rowValues(row);
  return vals.length > 0 ? (vals[0] ?? null) : null;
}

/** True if the row contains zero non-empty values. */
function isBlank(row: Record<string, unknown>): boolean {
  return rowValues(row).length === 0;
}

// ─── Row classification ───────────────────────────────────────────────────────

type RowKind =
  | 'blank'
  | 'section'
  | 'subsection'
  | 'parent'
  | 'child'
  | 'total'
  | 'continuation';

interface ClassifiedRow {
  kind: RowKind;
  row: Record<string, unknown>;
  itemNumber: string | null;
  dsrCode: string | null;
  description: string | null;
  sectionLabel: string | null;
}

/**
 * Scan row values for an item-number-like token that matches the given regex.
 * Prefers the first column value, falls back to scanning all values.
 */
function findItemToken(
  row: Record<string, unknown>,
  re: RegExp,
): string | null {
  const vals = rowValues(row);
  for (const v of vals) {
    if (re.test(v)) return v;
  }
  return null;
}

/**
 * Given a classified parent or child row, try to identify a DSR code.
 * A DSR code is a secondary item-number-like token distinct from itemNumber.
 */
function findDsrCode(
  row: Record<string, unknown>,
  itemNumber: string | null,
): string | null {
  const vals = rowValues(row);
  for (const v of vals) {
    if (v === itemNumber) continue;
    if (RE_DSR_CODE.test(v) && RE_PARENT_ITEM.test(v)) return v;
  }
  return null;
}

/**
 * Extract the human-readable description from a row.
 * Skips item numbers, DSR codes, pure numbers, and very short tokens.
 */
function findDescription(
  row: Record<string, unknown>,
  itemNumber: string | null,
  dsrCode: string | null,
): string | null {
  const vals = rowValues(row);
  for (const v of vals) {
    if (v === itemNumber || v === dsrCode) continue;
    if (RE_PURE_NUMBER.test(v)) continue;
    if (RE_PARENT_ITEM.test(v) || RE_CHILD_ITEM.test(v)) continue;
    if (v.length < 4) continue;
    return v;
  }
  return null;
}

/**
 * Classify a single row into one of the RowKind categories.
 */
function classifyRow(row: Record<string, unknown>): ClassifiedRow {
  if (isBlank(row)) {
    return { kind: 'blank', row, itemNumber: null, dsrCode: null, description: null, sectionLabel: null };
  }

  const vals = rowValues(row);
  const first = vals[0] ?? '';

  // ── Total rows ──────────────────────────────────────────────────────────────
  if (vals.some((v) => RE_TOTAL.test(v))) {
    return { kind: 'total', row, itemNumber: null, dsrCode: null, description: null, sectionLabel: null };
  }

  // ── Section header ──────────────────────────────────────────────────────────
  // Typically a single long text spanning the full row width, no numeric item number
  const singleText = vals.length === 1 || (vals.length <= 3 && !vals.some((v) => RE_PURE_NUMBER.test(v) && v.length > 4));
  if (singleText && RE_SECTION.test(first)) {
    const match = RE_SECTION.exec(first);
    return {
      kind: 'section',
      row,
      itemNumber: null,
      dsrCode: null,
      description: null,
      sectionLabel: match ? (match[1] ?? first).trim() : first.trim(),
    };
  }

  // ── Subsection header ───────────────────────────────────────────────────────
  if (singleText && RE_SUBSECTION.test(first)) {
    const match = RE_SUBSECTION.exec(first);
    return {
      kind: 'subsection',
      row,
      itemNumber: null,
      dsrCode: null,
      description: null,
      sectionLabel: match ? (match[1] ?? first).trim() : first.trim(),
    };
  }

  // ── Child item ──────────────────────────────────────────────────────────────
  const childItem = findItemToken(row, RE_CHILD_ITEM);
  if (childItem) {
    const dsr = findDsrCode(row, childItem);
    const desc = findDescription(row, childItem, dsr);
    return { kind: 'child', row, itemNumber: childItem, dsrCode: dsr, description: desc, sectionLabel: null };
  }

  // ── Parent item ─────────────────────────────────────────────────────────────
  const parentItem = findItemToken(row, RE_PARENT_ITEM);
  if (parentItem) {
    const dsr = findDsrCode(row, parentItem);
    const desc = findDescription(row, parentItem, dsr);
    return { kind: 'parent', row, itemNumber: parentItem, dsrCode: dsr, description: desc, sectionLabel: null };
  }

  // ── Continuation row ────────────────────────────────────────────────────────
  // Has descriptive text but no item number — continuation of the previous row
  return { kind: 'continuation', row, itemNumber: null, dsrCode: null, description: first, sectionLabel: null };
}

// ─── Hierarchy-aware chunking ─────────────────────────────────────────────────

/**
 * Build chunks by detecting BOQ hierarchy.
 * Each chunk groups a parent item with its child items under the current
 * section/subsection context.
 */
function buildHierarchyChunks(classified: ClassifiedRow[]): BoqChunk[] {
  const chunks: BoqChunk[] = [];

  let currentSection: string | null = null;
  let currentSubsection: string | null = null;
  let currentChunk: BoqChunk | null = null;

  const flushChunk = (): void => {
    if (currentChunk && currentChunk.rows.length > 0) {
      chunks.push(currentChunk);
      currentChunk = null;
    }
  };

  for (const cr of classified) {
    switch (cr.kind) {
      case 'blank':
      case 'total':
        // Skip; do not flush chunk — continuation rows may still follow
        break;

      case 'section':
        flushChunk();
        currentSection = cr.sectionLabel;
        currentSubsection = null;
        break;

      case 'subsection':
        flushChunk();
        currentSubsection = cr.sectionLabel;
        break;

      case 'parent':
        flushChunk();
        currentChunk = {
          section: currentSection,
          subsection: currentSubsection,
          parentItem: cr.itemNumber,
          parentDsrCode: cr.dsrCode,
          parentDescription: cr.description,
          rows: [cr.row],
        };
        break;

      case 'child':
        if (currentChunk) {
          currentChunk.rows.push(cr.row);
        } else {
          // Orphaned child — create an anonymous parent chunk
          currentChunk = {
            section: currentSection,
            subsection: currentSubsection,
            parentItem: null,
            parentDsrCode: null,
            parentDescription: null,
            rows: [cr.row],
          };
        }
        break;

      case 'continuation':
        if (currentChunk) {
          currentChunk.rows.push(cr.row);
        } else {
          // Orphaned continuation — start a new chunk
          currentChunk = {
            section: currentSection,
            subsection: currentSubsection,
            parentItem: null,
            parentDsrCode: null,
            parentDescription: cr.description,
            rows: [cr.row],
          };
        }
        break;
    }
  }

  flushChunk();
  return chunks;
}

// ─── Sliding-window fallback ──────────────────────────────────────────────────

/**
 * Fall back to fixed-size sliding windows when no hierarchy was detected.
 * Produces overlapping chunks of SLIDING_WINDOW_SIZE rows with
 * SLIDING_WINDOW_OVERLAP rows of overlap between consecutive chunks.
 */
function buildSlidingWindowChunks(rows: Record<string, unknown>[]): BoqChunk[] {
  const chunks: BoqChunk[] = [];
  const step = SLIDING_WINDOW_SIZE - SLIDING_WINDOW_OVERLAP;

  for (let i = 0; i < rows.length; i += step) {
    const slice = rows.slice(i, i + SLIDING_WINDOW_SIZE);
    if (slice.length === 0) break;
    chunks.push({
      section: null,
      subsection: null,
      parentItem: null,
      parentDsrCode: null,
      parentDescription: null,
      rows: slice,
    });
  }

  return chunks;
}

// ─── Hierarchy detection heuristic ───────────────────────────────────────────

/**
 * Returns true when the classified rows contain at least one parent-level
 * item number, indicating that hierarchy-aware chunking is appropriate.
 */
function hasHierarchy(classified: ClassifiedRow[]): boolean {
  return classified.some((cr) => cr.kind === 'parent' || cr.kind === 'child' || cr.kind === 'section');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Groups raw BOQ Excel rows into logical chunks that preserve section context
 * and parent-child relationships for downstream LLM normalization.
 *
 * When the sheet contains a detectable hierarchy (section headers, numbered
 * parent/child items) each parent item and its children form one chunk.
 *
 * When no hierarchy is detected the function falls back to overlapping
 * sliding-window chunks of at most 30 rows with a 5-row overlap.
 *
 * Original row objects are never mutated.
 */
export function buildBoqChunks(rows: Record<string, unknown>[]): BoqChunk[] {
  if (rows.length === 0) return [];

  try {
    const classified = rows.map(classifyRow);

    if (hasHierarchy(classified)) {
      const chunks = buildHierarchyChunks(classified);
      if (chunks.length > 0) return chunks;
    }

    // Fallback: sliding-window over non-blank rows
    const nonBlank = rows.filter((r) => !isBlank(r));
    return buildSlidingWindowChunks(nonBlank.length > 0 ? nonBlank : rows);
  } catch (err: unknown) {
    // Defensive fallback — never crash the upload pipeline
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[buildBoqChunks] Error during chunking, falling back to sliding window: ${msg}`);
    return buildSlidingWindowChunks(rows);
  }
}
