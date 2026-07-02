import type { Types } from 'mongoose';
import { NormalizedMaterial } from '../../models/NormalizedMaterial';
import { extractMaterialsFromDescription } from './materialExtractor';
import type { IRawRecordDocument, INormalizedMaterialDocument } from '../../types/normalization';
import type { MaterialSourceType } from '../../types';

const LLM_MODEL = 'claude-opus-4-8';

// ─── Column name candidates ───────────────────────────────────────────────────
// Ordered by preference: BOQ-normalized fields first, then legacy column names.

const DESCRIPTION_COLS = [
  // BOQ pipeline outputs these standardized keys
  'Full Description',   // includes parent + child context — preferred for LLM extraction
  'Description',
  // Legacy / raw Excel column names
  'Item Description',
  'Work Item',
  'Item',
  'Particulars',
  'Work Description',
  'Material Description',
];

const QUANTITY_COLS = ['Quantity', 'Qty', 'Nos', 'Number'];
const UNIT_COLS     = ['Unit', 'UOM', 'Units'];
const RATE_COLS     = ['Rate', 'Rate (₹)', 'Unit Rate'];
const AMOUNT_COLS   = ['Amount', 'Amount (₹)', 'Total', 'Total Amount'];
const DSR_CODE_COLS = ['DSR Code', 'Code', 'Item Code', 'Sr.No', 'S.No'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickCol(
  data: Record<string, unknown>,
  candidates: string[],
): unknown {
  for (const col of candidates) {
    if (col in data && data[col] !== null && data[col] !== undefined) {
      return data[col];
    }
  }
  // Case-insensitive fallback
  const lower = candidates.map((c) => c.toLowerCase());
  for (const key of Object.keys(data)) {
    if (lower.includes(key.toLowerCase())) return data[key];
  }
  return undefined;
}

function toNumber(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

function toStr(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined;
  const s = String(val).trim();
  return s.length > 0 ? s : undefined;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Normalises a single RawRecord from an Excel (DSR/BOQ) source.
 *
 * When called after the BOQ pipeline the rawData already contains standardized
 * keys (Description, Full Description, Quantity, Unit, Rate, Amount, DSR Code).
 * When called on legacy raw records it falls back to case-insensitive column
 * matching against common BOQ header names.
 *
 * Uses Claude LLM to extract one or more materials from the description field.
 * Returns an empty array if the record has no description or yields no materials
 * (e.g. the line is a header or sub-total row that slipped through).
 */
export async function normalizeExcelRecord(
  rawRecord: IRawRecordDocument,
  sourceType: MaterialSourceType = 'excel',
): Promise<INormalizedMaterialDocument[]> {
  console.log(
    new Date().toISOString(),
    `[normalizeExcelRecord] started | record: ${String(rawRecord._id)} | sourceType: ${sourceType}`,
  );

  const d = rawRecord.rawData as Record<string, unknown>;

  const description = toStr(pickCol(d, DESCRIPTION_COLS));

  if (!description) {
    console.log(
      new Date().toISOString(),
      `[normalizeExcelRecord] no description found in record ${String(rawRecord._id)} — skipping LLM call`,
    );
    return [];
  }

  console.log(
    new Date().toISOString(),
    `[normalizeExcelRecord] description: "${description.slice(0, 120)}${description.length > 120 ? '…' : ''}"`,
  );
  console.log(
    new Date().toISOString(),
    `[normalizeExcelRecord] calling extractMaterialsFromDescription()...`,
  );

  const t0 = Date.now();
  const { materials } = await extractMaterialsFromDescription(description);

  console.log(
    new Date().toISOString(),
    `[normalizeExcelRecord] extractMaterialsFromDescription() returned ${materials.length} material(s) in ${Date.now() - t0}ms`,
  );

  if (materials.length === 0) {
    console.log(
      new Date().toISOString(),
      `[normalizeExcelRecord] no materials extracted — skipping save`,
    );
    return [];
  }

  const quantity = toNumber(pickCol(d, QUANTITY_COLS));
  const unit     = toStr(pickCol(d, UNIT_COLS));
  const rate     = toNumber(pickCol(d, RATE_COLS));
  const amount   = toNumber(pickCol(d, AMOUNT_COLS));
  const dsrCode  = toStr(pickCol(d, DSR_CODE_COLS));

  console.log(
    new Date().toISOString(),
    `[normalizeExcelRecord] saving ${materials.length} NormalizedMaterial doc(s)...`,
  );

  const docs = await Promise.all(
    materials.map(async (mat) => {
      const doc = new NormalizedMaterial({
        projectId:      rawRecord.projectId,
        sourceFileId:   rawRecord.sourceFileId,
        sourceRecordId: rawRecord._id as Types.ObjectId,
        sourceType,

        materialName:             mat.materialName,
        standardizedMaterialName: mat.standardizedMaterialName,
        category:    mat.category,
        subcategory: mat.subcategory,
        description,

        quantity: mat.quantity ?? quantity,
        unit:     mat.unit ?? unit,

        rate,
        amount,
        dsrCode,

        confidence:       mat.confidence,
        extractionMethod: 'llm',
        llmModel:         LLM_MODEL,

        rawData: d,
        uploadDate: rawRecord.createdAt,
      });
      return doc.save();
    }),
  );

  console.log(
    new Date().toISOString(),
    `[normalizeExcelRecord] saved ${docs.length} NormalizedMaterial doc(s) for record ${String(rawRecord._id)}`,
  );

  return docs;
}
