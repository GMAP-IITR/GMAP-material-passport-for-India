import { RawRecord } from '../../models/RawRecord';
import { NormalizedMaterial } from '../../models/NormalizedMaterial';
import type { IRawRecordDocument, NormalizationResult } from '../../types/normalization';
import type { Types } from 'mongoose';
import { normalizeIfcRecord } from './normalizeIfcRecord';
import { normalizeExcelRecord } from './normalizeExcelRecord';
import { normalizePdfRecord } from './normalizePdfRecord';

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Routes a single RawRecord to the correct normaliser based on sourceType.
 * Updates the RawRecord's processingStatus and normalized flag in place.
 */
export async function normalizeRecord(
  rawRecord: IRawRecordDocument,
): Promise<NormalizationResult> {
  const id = rawRecord._id as Types.ObjectId;

  await RawRecord.findByIdAndUpdate(id, { processingStatus: 'processing' });

  try {
    let count = 0;

    switch (rawRecord.sourceType) {
      case 'ifc': {
        await normalizeIfcRecord(rawRecord);
        count = 1;
        break;
      }
      case 'excel':
      case 'dsr_boq': {
        const docs = await normalizeExcelRecord(rawRecord, rawRecord.sourceType);
        count = docs.length;
        break;
      }
      case 'pdf': {
        const docs = await normalizePdfRecord(rawRecord);
        count = docs.length;
        break;
      }
      default: {
        throw new Error(`No normaliser for sourceType: ${rawRecord.sourceType as string}`);
      }
    }

    await RawRecord.findByIdAndUpdate(id, {
      normalized: true,
      normalizedAt: new Date(),
      processingStatus: 'completed',
      $unset: { normalizationError: '' },
    });

    return { rawRecordId: id, normalizedCount: count };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await RawRecord.findByIdAndUpdate(id, {
      processingStatus: 'failed',
      normalizationError: message,
    });
    return { rawRecordId: id, normalizedCount: 0, error: message };
  }
}

// ─── Batch (file-level) ───────────────────────────────────────────────────────

export interface BatchNormalizationResult {
  total: number;
  succeeded: number;
  failed: number;
  normalizedCount: number;
  errors: Array<{ rawRecordId: string; error: string }>;
}

/**
 * Normalises all pending RawRecords that belong to the given source file.
 * Processes records sequentially to avoid hammering the LLM API.
 */
export async function normalizeFile(
  sourceFileId: Types.ObjectId | string,
): Promise<BatchNormalizationResult> {
  const records = await RawRecord.find({
    sourceFileId,
    processingStatus: { $in: ['pending', 'failed'] },
  }).lean(false);

  const result: BatchNormalizationResult = {
    total: records.length,
    succeeded: 0,
    failed: 0,
    normalizedCount: 0,
    errors: [],
  };

  for (const record of records) {
    const r = await normalizeRecord(record as IRawRecordDocument);
    if (r.error) {
      result.failed++;
      result.errors.push({ rawRecordId: String(r.rawRecordId), error: r.error });
    } else {
      result.succeeded++;
      result.normalizedCount += r.normalizedCount;
    }
  }

  return result;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export async function getNormalizationStatus(
  sourceFileId: Types.ObjectId | string,
): Promise<{
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  normalizedMaterials: number;
}> {
  const [statusCounts, materialCount] = await Promise.all([
    RawRecord.aggregate<{ _id: string; count: number }>([
      { $match: { sourceFileId } },
      { $group: { _id: '$processingStatus', count: { $sum: 1 } } },
    ]),
    NormalizedMaterial.countDocuments({ sourceFileId }),
  ]);

  const byStatus = Object.fromEntries(
    statusCounts.map(({ _id, count }) => [_id, count]),
  ) as Record<string, number>;

  const total =
    (byStatus['pending'] ?? 0) +
    (byStatus['processing'] ?? 0) +
    (byStatus['completed'] ?? 0) +
    (byStatus['failed'] ?? 0);

  return {
    total,
    pending:    byStatus['pending']    ?? 0,
    processing: byStatus['processing'] ?? 0,
    completed:  byStatus['completed']  ?? 0,
    failed:     byStatus['failed']     ?? 0,
    normalizedMaterials: materialCount,
  };
}
