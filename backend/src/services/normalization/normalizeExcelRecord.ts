import type { Types } from 'mongoose';
import { NormalizedMaterial } from '../../models/NormalizedMaterial';
import { extractMaterialsFromDescription } from './materialExtractor';
import type { IRawRecordDocument, INormalizedMaterialDocument } from '../../types/normalization';
import type { MaterialSourceType } from '../../types';

const LLM_MODEL = 'claude-opus-4-8';

// Common DSR/BOQ column names (case-insensitive search is done at runtime)
const DESCRIPTION_COLS = [
  'Description',
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

/**
 * Normalises a single RawRecord from an Excel (DSR/BOQ) source.
 * Uses the Claude LLM to extract one or more materials from the description field.
 * Returns an array because one BOQ line can reference multiple distinct materials.
 *
 * If the LLM returns no materials (e.g. the line is a header or sub-total),
 * an empty array is returned — the caller should mark the raw record as
 * normalized=true with normalizedCount=0.
 */
export async function normalizeExcelRecord(
  rawRecord: IRawRecordDocument,
  sourceType: MaterialSourceType = 'excel',
): Promise<INormalizedMaterialDocument[]> {
  const d = rawRecord.rawData as Record<string, unknown>;

  const description = toStr(pickCol(d, DESCRIPTION_COLS));

  // No meaningful description — skip LLM call
  if (!description) return [];

  const { materials } = await extractMaterialsFromDescription(description);

  if (materials.length === 0) return [];

  const quantity = toNumber(pickCol(d, QUANTITY_COLS));
  const unit     = toStr(pickCol(d, UNIT_COLS));
  const rate     = toNumber(pickCol(d, RATE_COLS));
  const amount   = toNumber(pickCol(d, AMOUNT_COLS));
  const dsrCode  = toStr(pickCol(d, DSR_CODE_COLS));

  const docs = await Promise.all(
    materials.map(async (mat) => {
      const doc = new NormalizedMaterial({
        projectId:     rawRecord.projectId,
        sourceFileId:  rawRecord.sourceFileId,
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

  return docs;
}
