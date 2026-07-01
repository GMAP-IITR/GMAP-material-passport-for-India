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
import { mapExcelRows } from '../services/materialMappingService';
import { insertMaterialRecords } from '../services/materialInsertionService';
import { convertIfcToExcel } from '../services/ifcProcessingService';

const EXT_TO_FILE_TYPE: Record<string, FileType> = {
  '.xlsx': 'excel',
  '.xls': 'excel',
  '.ifc': 'ifc',
};

export const uploadFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw ApiError.badRequest('No file received. Send the file under the field name "file".');
  }

  const { projectId } = req.body as { projectId?: string };

  const ext = path.extname(req.file.originalname).toLowerCase();
  const fileType = EXT_TO_FILE_TYPE[ext];

  if (!fileType) {
    throw ApiError.badRequest('Unsupported file extension.');
  }

  // ── 1. Persist upload metadata ──────────────────────────────────────────────
  const uploadRecord = await UploadedFile.create({
    ...(projectId?.trim() ? { projectId } : {}),
    originalName: req.file.originalname,
    fileName: req.file.filename,
    filePath: `${env.UPLOAD_DIR}/${req.file.filename}`,
    mimeType: req.file.mimetype,
    fileType,
    fileSize: req.file.size,
    uploadedAt: new Date(),
  });

  // ── 2. IFC: convert via Python → feed through Excel pipeline ────────────────
  if (fileType === 'ifc') {
    const xlsxOutputPath = `${env.UPLOAD_DIR}/${path.basename(uploadRecord.fileName, '.ifc')}-${crypto.randomUUID()}.xlsx`;

    let generatedXlsxPath: string;
    try {
      generatedXlsxPath = await convertIfcToExcel(uploadRecord.filePath, xlsxOutputPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'IFC conversion failed';
      throw new ApiError(500, `IFC conversion failed: ${msg}`);
    }

    // Store the generated Excel path against the upload record
    await UploadedFile.findByIdAndUpdate(uploadRecord._id, { generatedExcelPath: generatedXlsxPath });

    console.log(`[upload] fileType: ifc | parser: parseIfcExcelFile | xlsx: ${generatedXlsxPath}`);
    const { rows, headers, totalRows } = parseIfcExcelFile(generatedXlsxPath);
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
    const mappedRows = mapExcelRows(rows, headers);

    const recordsInserted = await insertMaterialRecords(mappedRows, {
      ...(projectId?.trim() ? { projectId } : {}),
      sourceType: 'ifc',
      sourceFileId: uploadRecord._id as Types.ObjectId,
      uploadDate: new Date(),
    });

    ApiResponse.created(
      res,
      { recordsInserted, file: uploadRecord.toJSON(), generatedExcel: generatedXlsxPath },
      'IFC processed successfully',
    );
    return;
  }

  // ── 3. Excel: parse → map → insert ─────────────────────────────────────────
  console.log(`[upload] fileType: ${fileType} | parser: parseExcelFile | path: ${uploadRecord.filePath}`);
  const { rows, headers, totalRows } = parseExcelFile(uploadRecord.filePath);

  if (totalRows === 0) {
    ApiResponse.success(
      res,
      { recordsInserted: 0 },
      'Excel file uploaded but no data rows were found.',
    );
    return;
  }

  const mappedRows = mapExcelRows(rows, headers);

  const recordsInserted = await insertMaterialRecords(mappedRows, {
    ...(projectId?.trim() ? { projectId } : {}),
    sourceType: 'excel',
    sourceFileId: uploadRecord._id as Types.ObjectId,
    uploadDate: new Date(),
  });

  ApiResponse.created(
    res,
    { recordsInserted },
    'Excel processed successfully',
  );
});
