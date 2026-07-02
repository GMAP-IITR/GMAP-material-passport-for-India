// ─── BOQ Normalization Pipeline ────────────────────────────────────────────────
//
// Orchestrates: raw Excel rows → BOQ chunks → Claude normalization
//               → RawRecord persistence → material extraction → NormalizedMaterial
//
// Called by the upload controller for every Excel / DSR-BOQ file upload.

import type { Types } from 'mongoose';
import { RawRecord } from '../../models/RawRecord';
import { buildBoqChunks } from './buildBoqChunks';
import { normalizeBoqChunk } from './boqStructureNormalizer';
import type { NormalizedBoqRow } from './boqStructureNormalizer';
import { normalizeExcelRecord } from './normalizeExcelRecord';
import type { MaterialSourceType } from '../../types';
import type { IRawRecordDocument } from '../../types/normalization';

// ─── Config ───────────────────────────────────────────────────────────────────

// Max Claude retries per chunk before giving up and moving to the next chunk
const MAX_RETRIES = 3;
// Base back-off between retries (doubles on each attempt)
const RETRY_BASE_MS = 2_000;

// ─── Result type ─────────────────────────────────────────────────────────────

export interface BoqPipelineResult {
  rawRecordsCreated: number;
  chunksTotal: number;
  chunksProcessed: number;
  normalizedMaterialsCreated: number;
  failed: number;
  errors: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls normalizeBoqChunk with exponential back-off retry.
 * Returns an empty array (rather than throwing) only after all retries are exhausted.
 */
async function normalizeChunkWithRetry(
  chunkRows: Record<string, unknown>[],
  chunkIndex: number,
  chunkTotal: number,
): Promise<NormalizedBoqRow[]> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(
      new Date().toISOString(),
      `[BOQ] Sending chunk ${chunkIndex + 1}/${chunkTotal} to Claude`,
      `(attempt ${attempt}/${MAX_RETRIES}, ${chunkRows.length} raw rows)`,
    );

    try {
      const t0 = Date.now();
      const rows = await normalizeBoqChunk(chunkRows);
      console.log(
        new Date().toISOString(),
        `[BOQ] Claude returned ${rows.length} normalized rows for chunk ${chunkIndex + 1}/${chunkTotal}`,
        `in ${Date.now() - t0}ms`,
      );
      return rows;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        new Date().toISOString(),
        `[BOQ] Chunk ${chunkIndex + 1}/${chunkTotal} attempt ${attempt}/${MAX_RETRIES} failed:`,
        lastError.message,
      );

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * attempt;
        console.log(new Date().toISOString(), `[BOQ] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new Error('normalizeBoqChunk failed after all retries');
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

/**
 * Full BOQ normalization pipeline for one uploaded Excel file.
 *
 * Steps:
 *   1. buildBoqChunks() — groups raw rows into parent/child context windows
 *   2. normalizeBoqChunk() — Claude standardizes each chunk (with retry + timeout)
 *   3. RawRecord.insertMany() — persists standardized rows as raw records
 *   4. normalizeExcelRecord() — LLM material extraction per record → NormalizedMaterial
 *
 * Sequential chunk processing avoids Anthropic rate-limit errors.
 * Individual failures are logged and counted but do not abort the pipeline.
 */
export async function runBoqPipeline(
  sourceFileId: Types.ObjectId,
  projectId: string | undefined,
  rawRows: Record<string, unknown>[],
  sourceType: MaterialSourceType,
): Promise<BoqPipelineResult> {
  const result: BoqPipelineResult = {
    rawRecordsCreated: 0,
    chunksTotal: 0,
    chunksProcessed: 0,
    normalizedMaterialsCreated: 0,
    failed: 0,
    errors: [],
  };

  console.log(
    new Date().toISOString(),
    `[BOQ] ═══ Pipeline started ═══ | file: ${sourceFileId} | sourceType: ${sourceType} | raw rows: ${rawRows.length}`,
  );

  // ── Step 1: Build BOQ chunks ─────────────────────────────────────────────────

  console.log(new Date().toISOString(), '[BOQ] Calling buildBoqChunks()...');
  const t1 = Date.now();

  let chunks: ReturnType<typeof buildBoqChunks>;
  try {
    chunks = buildBoqChunks(rawRows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(new Date().toISOString(), `[BOQ] buildBoqChunks() threw: ${msg}`);
    throw err;
  }

  console.log(
    new Date().toISOString(),
    `[BOQ] buildBoqChunks() produced ${chunks.length} chunks in ${Date.now() - t1}ms`,
  );

  result.chunksTotal = chunks.length;

  if (chunks.length === 0) {
    console.log(new Date().toISOString(), '[BOQ] No chunks produced — pipeline complete (empty file)');
    return result;
  }

  // ── Step 2: Normalize each chunk with Claude ─────────────────────────────────

  const allNormalizedRows: NormalizedBoqRow[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;

    console.log(
      new Date().toISOString(),
      `[BOQ] Processing chunk ${i + 1}/${chunks.length}`,
      `| section: "${chunk.section ?? '—'}"`,
      `| parentItem: "${chunk.parentItem ?? '—'}"`,
      `| rows: ${chunk.rows.length}`,
    );

    try {
      const normalized = await normalizeChunkWithRetry(chunk.rows, i, chunks.length);
      allNormalizedRows.push(...normalized);
      result.chunksProcessed++;

      console.log(
        new Date().toISOString(),
        `[BOQ] Chunk ${i + 1}/${chunks.length} done`,
        `| normalized rows this chunk: ${normalized.length}`,
        `| cumulative total: ${allNormalizedRows.length}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        new Date().toISOString(),
        `[BOQ] Chunk ${i + 1}/${chunks.length} failed after ${MAX_RETRIES} retries: ${msg}`,
      );
      result.failed++;
      result.errors.push(`chunk[${i + 1}]: ${msg}`);
      // Continue processing remaining chunks
    }
  }

  console.log(
    new Date().toISOString(),
    `[BOQ] All chunks processed | total normalized rows: ${allNormalizedRows.length}`,
  );

  if (allNormalizedRows.length === 0) {
    console.log(new Date().toISOString(), '[BOQ] No normalized rows returned — pipeline complete (no line items found)');
    return result;
  }

  // ── Step 3: Persist normalized rows as RawRecord documents ──────────────────

  console.log(
    new Date().toISOString(),
    `[BOQ] Creating ${allNormalizedRows.length} RawRecord documents...`,
  );

  const docs = allNormalizedRows.map((row, idx) => ({
    ...(projectId?.trim() ? { projectId } : {}),
    sourceFileId,
    sourceType,
    rowIndex: idx,
    rawData: row as unknown as Record<string, unknown>,
    normalized: false,
    processingStatus: 'pending' as const,
  }));

  let savedRecords: IRawRecordDocument[];

  const t3 = Date.now();
  try {
    const inserted = await RawRecord.insertMany(docs, { ordered: false });
    savedRecords = inserted as unknown as IRawRecordDocument[];
  } catch (err: unknown) {
    // Mongoose BulkWriteError: partial inserts may have succeeded
    const bulkErr = err as { insertedDocs?: unknown[] };
    if (Array.isArray(bulkErr.insertedDocs) && bulkErr.insertedDocs.length > 0) {
      console.warn(
        new Date().toISOString(),
        `[BOQ] insertMany partial success: ${bulkErr.insertedDocs.length}/${docs.length} inserted`,
      );
      savedRecords = bulkErr.insertedDocs as IRawRecordDocument[];
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(new Date().toISOString(), `[BOQ] RawRecord insertMany failed: ${msg}`);
      throw err;
    }
  }

  result.rawRecordsCreated = savedRecords.length;
  console.log(
    new Date().toISOString(),
    `[BOQ] ${savedRecords.length} RawRecords inserted in ${Date.now() - t3}ms`,
  );

  // ── Step 4: Material extraction per RawRecord → NormalizedMaterial ───────────

  console.log(
    new Date().toISOString(),
    `[BOQ] Starting material extraction for ${savedRecords.length} records...`,
  );

  for (let i = 0; i < savedRecords.length; i++) {
    const record = savedRecords[i]!;

    console.log(
      new Date().toISOString(),
      `[BOQ] normalizeExcelRecord ${i + 1}/${savedRecords.length} | rowIndex: ${record.rowIndex}`,
      `| description: "${String((record.rawData as Record<string, unknown>)?.['Description'] ?? '').slice(0, 80)}..."`,
    );

    const t4 = Date.now();
    try {
      await RawRecord.findByIdAndUpdate(record._id as Types.ObjectId, {
        processingStatus: 'processing',
      });

      const materialDocs = await normalizeExcelRecord(record, sourceType);

      await RawRecord.findByIdAndUpdate(record._id as Types.ObjectId, {
        normalized: true,
        normalizedAt: new Date(),
        processingStatus: 'completed',
        $unset: { normalizationError: '' },
      });

      result.normalizedMaterialsCreated += materialDocs.length;

      console.log(
        new Date().toISOString(),
        `[BOQ] Record ${i + 1}/${savedRecords.length}: ${materialDocs.length} materials saved`,
        `in ${Date.now() - t4}ms | running total: ${result.normalizedMaterialsCreated}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        new Date().toISOString(),
        `[BOQ] normalizeExcelRecord ${i + 1}/${savedRecords.length} failed: ${msg}`,
      );

      // Best-effort status update — don't propagate Mongo errors here
      await RawRecord.findByIdAndUpdate(record._id as Types.ObjectId, {
        processingStatus: 'failed',
        normalizationError: msg,
      }).catch(() => undefined);

      result.failed++;
      result.errors.push(`record[${i + 1}]: ${msg}`);
    }
  }

  console.log(
    new Date().toISOString(),
    `[BOQ] ═══ Pipeline complete ═══`,
    `| rawRecords: ${result.rawRecordsCreated}`,
    `| chunks: ${result.chunksProcessed}/${result.chunksTotal}`,
    `| materials: ${result.normalizedMaterialsCreated}`,
    `| failed: ${result.failed}`,
  );

  return result;
}
