import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { Request } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

// Extensions accepted — used as the authoritative validator (MIME types for IFC vary wildly)
const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls', '.ifc']);

const storage = multer.diskStorage({
  destination(_req: Request, _file: Express.Multer.File, cb) {
    const dir = path.resolve(env.UPLOAD_DIR);
    fs.mkdirSync(dir, { recursive: true }); // no-op if already exists
    cb(null, dir);
  },
  filename(_req: Request, file: Express.Multer.File, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    // e.g. 1750000000000-a1b2c3d4-e5f6-....xlsx
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    cb(new ApiError(400, `File type "${ext}" is not allowed. Accepted formats: .xlsx, .xls, .ifc`));
    return;
  }
  cb(null, true);
}

// Export the configured multer middleware bound to the "file" field name
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
}).single('file');
