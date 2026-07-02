import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';

const MODEL = 'claude-opus-4-8';

// Abort a Claude stream if it has not resolved within this window.
const CLAUDE_TIMEOUT_MS = 90_000; // 90 seconds

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    console.log(
      new Date().toISOString(),
      'ANTHROPIC_API_KEY exists:',
      !!env.ANTHROPIC_API_KEY,
    );
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Add it to backend/.env to enable BOQ structure normalization.',
      );
    }
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NormalizedBoqRow {
  Description: string | null;
  'Full Description': string | null;
  Quantity: number | null;
  Unit: string | null;
  Rate: number | null;
  Amount: number | null;
  'DSR Code': string | null;
  'Item Number': string | null;
  Section: string | null;
  Subsection: string | null;
  'Parent Description': string | null;
  'Parent Item Number': string | null;
}

// ─── Tool definition ──────────────────────────────────────────────────────────

const NORMALIZE_BOQ_TOOL: Anthropic.Tool = {
  name: 'normalize_boq_rows',
  description:
    'Normalize a chunk of raw Bill of Quantities (BOQ) rows into a clean, ' +
    'standardized structure. Each output row corresponds to one line-item material ' +
    'or work item. Skip header rows, title rows, section banners, project metadata, ' +
    'page numbers, subtotals, grand totals, and empty rows — those must never appear ' +
    'in the output. For every genuine line item, preserve the full description verbatim ' +
    '(do not shorten, summarize, or remove technical specifications). Never invent ' +
    'values; use null for any field that is absent or indeterminate.',
  input_schema: {
    type: 'object' as const,
    properties: {
      rows: {
        type: 'array',
        description: 'Normalized line-item rows. One entry per genuine material / work item.',
        items: {
          type: 'object',
          properties: {
            Description: {
              type: ['string', 'null'],
              description:
                'The verbatim item description exactly as it appears in the source. ' +
                'Never shorten or paraphrase. Null if the row has no description.',
            },
            'Full Description': {
              type: ['string', 'null'],
              description:
                'Complete description formed by concatenating the parent item description ' +
                '(if any) with this item\'s own description, separated by " — ". ' +
                'If there is no parent, this equals Description. Never null when Description is set.',
            },
            Quantity: {
              type: ['number', 'null'],
              description: 'Numeric quantity. Null if absent.',
            },
            Unit: {
              type: ['string', 'null'],
              description: 'Unit of measurement, e.g. m³, m², kg, m, nos. Null if absent.',
            },
            Rate: {
              type: ['number', 'null'],
              description: 'Unit rate (cost per unit). Null if absent.',
            },
            Amount: {
              type: ['number', 'null'],
              description: 'Total amount (Quantity × Rate). Null if absent.',
            },
            'DSR Code': {
              type: ['string', 'null'],
              description:
                'DSR (Delhi Schedule of Rates) item code or any equivalent spec/item code. Null if absent.',
            },
            'Item Number': {
              type: ['string', 'null'],
              description:
                'Serial number or item number for this line (e.g. "1", "1.1", "A-3"). Null if absent.',
            },
            Section: {
              type: ['string', 'null'],
              description:
                'Top-level section heading under which this item falls, inherited from the ' +
                'nearest preceding section header row. Null if no section header was encountered.',
            },
            Subsection: {
              type: ['string', 'null'],
              description:
                'Subsection heading under which this item falls, inherited from the nearest ' +
                'preceding subsection header row. Null if absent.',
            },
            'Parent Description': {
              type: ['string', 'null'],
              description:
                'Verbatim description of the parent item when this row is a child/sub-item. ' +
                'Null for top-level items.',
            },
            'Parent Item Number': {
              type: ['string', 'null'],
              description:
                'Item number of the parent row when this row is a child/sub-item. Null for top-level items.',
            },
          },
          required: [
            'Description',
            'Full Description',
            'Quantity',
            'Unit',
            'Rate',
            'Amount',
            'DSR Code',
            'Item Number',
            'Section',
            'Subsection',
            'Parent Description',
            'Parent Item Number',
          ],
        },
      },
    },
    required: ['rows'],
  },
};

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(chunk: Record<string, unknown>[]): string {
  return (
    'You are an expert quantity surveyor and construction cost analyst. ' +
    'You will receive a chunk of raw rows from a Bill of Quantities (BOQ) or ' +
    'DSR (Delhi Schedule of Rates) Excel export. The data may be irregular in ' +
    'several ways:\n\n' +
    '  • Merged cells resolved to __EMPTY or blank in one row, actual value in another\n' +
    '  • Column headers absent, misnamed, or stored in a row instead of a column\n' +
    '  • Columns shifted or re-ordered across sections\n' +
    '  • Keys named __EMPTY, __EMPTY_1, __EMPTY_2, etc. instead of real headers\n' +
    '  • Vendor-specific layouts with non-standard column arrangements\n' +
    '  • Parent items followed by indented child items without explicit parent reference\n' +
    '  • Section and subsection headings interspersed as plain rows with no numeric columns\n' +
    '  • DSR references in footnote-style rows below the item they annotate\n' +
    '  • Continuation rows where the description spans multiple rows\n' +
    '  • Subtotal rows, grand total rows, and page-header/footer rows\n\n' +
    'Rules:\n' +
    '  1. Extract only genuine line items (materials, work items). Skip everything else.\n' +
    '  2. Preserve descriptions verbatim — never shorten, paraphrase, or remove specs.\n' +
    '  3. Never invent numeric values; use null for any absent field.\n' +
    '  4. Propagate section/subsection context downward to child items.\n' +
    '  5. For child items, set Parent Description and Parent Item Number from the ' +
    'immediately preceding parent row.\n' +
    '  6. Full Description = (Parent Description + " — " + Description) when a parent ' +
    'exists; otherwise Full Description = Description.\n' +
    '  7. Continuation rows: merge them into the Description of the item they continue.\n' +
    '  8. DSR footnotes: attach the DSR code to the item they annotate.\n\n' +
    'Raw rows (JSON):\n' +
    JSON.stringify(chunk, null, 2)
  );
}

// ─── Output validation ────────────────────────────────────────────────────────

function toNullableString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function toNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/,/g, '').trim());
    return isFinite(n) ? n : null;
  }
  return null;
}

function validateRow(raw: unknown): NormalizedBoqRow | null {
  if (raw === null || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const description = toNullableString(r['Description']);
  if (description === null) return null;

  const fullDescription = toNullableString(r['Full Description']) ?? description;

  return {
    Description: description,
    'Full Description': fullDescription,
    Quantity: toNullableNumber(r['Quantity']),
    Unit: toNullableString(r['Unit']),
    Rate: toNullableNumber(r['Rate']),
    Amount: toNullableNumber(r['Amount']),
    'DSR Code': toNullableString(r['DSR Code']),
    'Item Number': toNullableString(r['Item Number']),
    Section: toNullableString(r['Section']),
    Subsection: toNullableString(r['Subsection']),
    'Parent Description': toNullableString(r['Parent Description']),
    'Parent Item Number': toNullableString(r['Parent Item Number']),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sends a chunk of raw BOQ rows to Claude (claude-opus-4-8) and returns
 * them normalized into a consistent schema. Rows that represent headers,
 * totals, metadata, or empty lines are dropped from the output.
 *
 * Uses an AbortController to enforce a 90-second hard timeout on the stream.
 * Throws if Claude does not respond within the window (caller should retry).
 */
export async function normalizeBoqChunk(
  chunk: Record<string, unknown>[],
): Promise<NormalizedBoqRow[]> {
  console.log(new Date().toISOString(), '========== normalizeBoqChunk CALLED ==========');
  console.log(new Date().toISOString(), 'Chunk size:', chunk.length);

  if (chunk.length === 0) return [];

  const client = getClient();
  const prompt = buildPrompt(chunk);

  // AbortController lets us cancel the in-flight HTTP request on timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error(
      new Date().toISOString(),
      `[BOQ] Claude stream timeout after ${CLAUDE_TIMEOUT_MS / 1000}s — aborting request`,
    );
    controller.abort();
  }, CLAUDE_TIMEOUT_MS);

  console.log(new Date().toISOString(), 'Starting Claude stream...');
  const stream = client.messages.stream(
    {
      model: MODEL,
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      tools: [NORMALIZE_BOQ_TOOL],
      tool_choice: { type: 'any' },
      messages: [{ role: 'user', content: prompt }],
    },
    { signal: controller.signal },
  );

  let response: Anthropic.Message;
  try {
    console.log(new Date().toISOString(), 'Waiting for stream.finalMessage()...');
    const t0 = Date.now();
    response = await stream.finalMessage();
    clearTimeout(timeoutId);
    console.log(
      new Date().toISOString(),
      `stream.finalMessage() returned in ${Date.now() - t0}ms`,
    );
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : String(err);
    console.error(new Date().toISOString(), `Claude stream error: ${msg}`);
    throw err;
  }

  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  );

  console.log(new Date().toISOString(), 'Tool block found:', !!toolUseBlock);
  console.log(new Date().toISOString(), 'Tool name:', toolUseBlock?.name);

  if (!toolUseBlock || toolUseBlock.name !== 'normalize_boq_rows') {
    console.warn(new Date().toISOString(), 'No normalize_boq_rows tool call in response — returning []');
    return [];
  }

  const toolInput = toolUseBlock.input as { rows?: unknown[] };
  const rawRows = Array.isArray(toolInput.rows) ? toolInput.rows : [];

  console.log(new Date().toISOString(), 'Rows returned by Claude:', rawRows.length);

  return rawRows.reduce<NormalizedBoqRow[]>((acc, rawRow) => {
    const validated = validateRow(rawRow);
    if (validated) acc.push(validated);
    return acc;
  }, []);
}
