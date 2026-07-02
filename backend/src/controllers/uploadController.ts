import type { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import type { Types } from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { UploadedFile } from '../models/UploadedFile';
import { env } from '../config/env';
import type { FileType } from '../types';
import { parseExcelFile } from '../services/excelProcessingService';
import { parseIfcExcelFile } from '../services/ifcExcelParsingService';
import { mapExcelRows, detectExcelSourceType } from '../services/materialMappingService';
import { insertMaterialRecords } from '../services/materialInsertionService';
import { convertIfcToExcel } from '../services/ifcProcessingService';
import { runBoqPipeline } from '../services/normalization/boqPipeline';

const EXT_TO_FILE_TYPE: Record<string, FileType> = {
  '.xlsx': 'excel',
  '.xls':  'excel',
  '.ifc':  'ifc',
};

export const uploadFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw ApiError.badRequest('No file received. Send the file under the field name "file".');
  }

  const { projectId } = req.body as { projectId?: string };

  const ext      = path.extname(req.file.originalname).toLowerCase();
  const fileType = EXT_TO_FILE_TYPE[ext];

  if (!fileType) {
    throw ApiError.badRequest('Unsupported file extension.');
  }

  // ── 1. Persist upload metadata ──────────────────────────────────────────────

  console.log(
    new Date().toISOString(),
    `[upload] SERVER RECEIVED FILE | name: "${req.file.originalname}" | type: ${fileType} | size: ${req.file.size}B`,
  );

  const tCreate = Date.now();
  const uploadRecord = await UploadedFile.create({
    ...(projectId?.trim() ? { projectId } : {}),
    originalName: req.file.originalname,
    fileName:     req.file.filename,
    filePath:     `${env.UPLOAD_DIR}/${req.file.filename}`,
    mimeType:     req.file.mimetype,
    fileType,
    fileSize:     req.file.size,
    uploadedAt:   new Date(),
  });

  console.log(
    new Date().toISOString(),
    `[upload] UploadedFile created in ${Date.now() - tCreate}ms | id: ${String(uploadRecord._id)}`,
  );

  // ── 2. IFC: convert via Python → IFC Excel parser → MaterialRecord ──────────
  //    (unchanged — IFC does NOT go through the BOQ pipeline)

  if (fileType === 'ifc') {
    const xlsxOutputPath =
      `${env.UPLOAD_DIR}/${path.basename(uploadRecord.fileName, '.ifc')}-${crypto.randomUUID()}.xlsx`;

    let generatedXlsxPath: string;
    try {
      console.log(new Date().toISOString(), '[upload] IFC: starting convertIfcToExcel()...');
      const t0 = Date.now();
      generatedXlsxPath = await convertIfcToExcel(uploadRecord.filePath, xlsxOutputPath);
      console.log(
        new Date().toISOString(),
        `[upload] IFC: convertIfcToExcel() done in ${Date.now() - t0}ms | output: ${generatedXlsxPath}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'IFC conversion failed';
      throw new ApiError(500, `IFC conversion failed: ${msg}`);
    }

    await UploadedFile.findByIdAndUpdate(uploadRecord._id, { generatedExcelPath: generatedXlsxPath });

    console.log(
      new Date().toISOString(),
      `[upload] IFC: parsing generated Excel | path: ${generatedXlsxPath}`,
    );
    const t1 = Date.now();
    const { rows, headers, totalRows } = parseIfcExcelFile(generatedXlsxPath);
    console.log(
      new Date().toISOString(),
      `[upload] IFC: parseIfcExcelFile() done in ${Date.now() - t1}ms | totalRows: ${totalRows}`,
    );
    console.log('STAGE 1 - PARSED IFC FIRST ROW', JSON.stringify(rows[0], null, 2));

    if (totalRows === 0) {
      ApiResponse.success(
        res,
        { recordsInserted: 0, file: uploadRecord.toJSON(), generatedExcel: generatedXlsxPath },
        'IFC converted but no data rows were found in the output.',
      );
      return;
    }

    console.log('STAGE 2 - ROW ENTERING MAPPER', JSON.stringify(rows[0], null, 2));
    const t2 = Date.now();
    const mappedRows = mapExcelRows(rows, headers);
    console.log(
      new Date().toISOString(),
      `[upload] IFC: mapExcelRows() done in ${Date.now() - t2}ms | mappedRows: ${mappedRows.length}`,
    );

    const t3 = Date.now();
    const recordsInserted = await insertMaterialRecords(mappedRows, {
      ...(projectId?.trim() ? { projectId } : {}),
      sourceType:   'ifc',
      sourceFileId: uploadRecord._id as Types.ObjectId,
      uploadDate:   new Date(),
    });
    console.log(
      new Date().toISOString(),
      `[upload] IFC: insertMaterialRecords() done in ${Date.now() - t3}ms | inserted: ${recordsInserted}`,
    );

    ApiResponse.created(
      res,
      { recordsInserted, file: uploadRecord.toJSON(), generatedExcel: generatedXlsxPath },
      'IFC processed successfully',
    );
    return;
  }

  // ── 3. Excel / DSR-BOQ: full BOQ normalization pipeline ─────────────────────
  //
  //    Raw rows → buildBoqChunks() → normalizeBoqChunk() (Claude, with retry +
  //    timeout) → RawRecord.insertMany() → normalizeExcelRecord() (Claude) →
  //    NormalizedMaterial saved.
  //
  //    Replaces the old mapExcelRows → MaterialRecord.insertMany path which
  //    skipped LLM normalization entirely.

  console.log(
    new Date().toISOString(),
    `[upload] Excel: starting parseExcelFile() | path: ${uploadRecord.filePath}`,
  );
  const tParse = Date.now();
  const { rows, headers, totalRows } = parseExcelFile(uploadRecord.filePath);
  console.log(
    new Date().toISOString(),
    `[upload] Excel: parseExcelFile() done in ${Date.now() - tParse}ms | totalRows: ${totalRows}`,
  );

  if (totalRows === 0) {
    ApiResponse.success(
      res,
      { recordsInserted: 0, file: uploadRecord.toJSON() },
      'Excel file uploaded but no data rows were found.',
    );
    return;
  }

  // Use the header-based heuristic to tag records as 'dsr_boq' or 'excel'
  const sourceType = detectExcelSourceType(headers);
  console.log(
    new Date().toISOString(),
    `[upload] Excel: detected sourceType = "${sourceType}" | headers sample: ${headers.slice(0, 5).join(', ')}`,
  );

  console.log(
    new Date().toISOString(),
    `[upload] Excel: handing off ${rows.length} rows to runBoqPipeline()...`,
  );
  const tPipeline = Date.now();

  const pipelineResult = await runBoqPipeline(
    uploadRecord._id as Types.ObjectId,
    projectId,
    rows,
    sourceType,
  );

  console.log(
    new Date().toISOString(),
    `[upload] Excel: runBoqPipeline() complete in ${Date.now() - tPipeline}ms |`,
    JSON.stringify(pipelineResult),
  );

  ApiResponse.created(
    res,
    {
      file:                       uploadRecord.toJSON(),
      rawRecordsCreated:          pipelineResult.rawRecordsCreated,
      chunksTotal:                pipelineResult.chunksTotal,
      chunksProcessed:            pipelineResult.chunksProcessed,
      normalizedMaterialsCreated: pipelineResult.normalizedMaterialsCreated,
      failed:                     pipelineResult.failed,
      ...(pipelineResult.errors.length > 0 ? { errors: pipelineResult.errors } : {}),
    },
    'Excel BOQ processed successfully',
  );
});
