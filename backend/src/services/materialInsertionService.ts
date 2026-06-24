import type { Types } from 'mongoose';
import { MaterialRecord } from '../models/MaterialRecord';
import type { MaterialSourceType } from '../types';
import type { MappedMaterialRow } from './materialMappingService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MaterialRecordBase {
  projectId?: Types.ObjectId | string;
  sourceType: MaterialSourceType;
  sourceFileId: Types.ObjectId | string;
  uploadDate: Date;
}

// MongoDB BulkWriteError shape — driver version varies; we handle both
interface BulkWriteErrorLike {
  insertedCount?: number;
  result?: { nInserted?: number };
}

function isBulkWriteError(err: unknown): err is BulkWriteErrorLike {
  return (
    err !== null &&
    typeof err === 'object' &&
    ('insertedCount' in err || 'result' in err)
  );
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Bulk-inserts MaterialRecord documents assembled from mapped Excel rows
 * and the upload's base metadata (projectId, sourceType, sourceFileId, uploadDate).
 *
 * Uses ordered:false so a single bad row does not abort the entire batch.
 * Returns the number of documents that were actually persisted.
 */
export async function insertMaterialRecords(
  rows: MappedMaterialRow[],
  base: MaterialRecordBase,
): Promise<number> {
  if (rows.length === 0) return 0;

  const docs = rows.map(({ rawData, ...fields }) => ({
    ...base,
    ...fields,
    rawData: rawData ?? {},
  }));

  try {
    const inserted = await MaterialRecord.insertMany(docs, { ordered: false });
    return inserted.length;
  } catch (err: unknown) {
    // BulkWriteError: partial success — some docs were inserted
    if (isBulkWriteError(err)) {
      if (typeof err.insertedCount === 'number') return err.insertedCount;
      if (err.result && typeof err.result.nInserted === 'number') {
        return err.result.nInserted;
      }
    }
    throw err;
  }
}
