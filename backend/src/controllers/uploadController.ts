import type { Request, Response } from 'express';
import path from 'path';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { UploadedFile } from '../models/UploadedFile';
import { env } from '../config/env';
import type { FileType } from '../types';

const EXT_TO_FILE_TYPE: Record<string, FileType> = {
  '.xlsx': 'excel',
  '.xls': 'excel',
  '.ifc': 'ifc',
};

export const uploadFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Multer places the file on req.file if one was provided and passed the filter
  if (!req.file) {
    throw ApiError.badRequest('No file received. Send the file under the field name "file".');
  }

  const { projectId } = req.body as { projectId?: string };

  const ext = path.extname(req.file.originalname).toLowerCase();
  const fileType = EXT_TO_FILE_TYPE[ext];

  // Defensive — fileFilter already blocks unknown extensions, but guard anyway
  if (!fileType) {
    throw ApiError.badRequest('Unsupported file extension.');
  }

  const record = await UploadedFile.create({
    ...(projectId?.trim() ? { projectId } : {}),
    originalName: req.file.originalname,
    fileName: req.file.filename,
    filePath: `${env.UPLOAD_DIR}/${req.file.filename}`,
    mimeType: req.file.mimetype,
    fileType,
    fileSize: req.file.size,
    uploadedAt: new Date(),
  });

  ApiResponse.created(res, record.toJSON(), 'File uploaded successfully');
});
