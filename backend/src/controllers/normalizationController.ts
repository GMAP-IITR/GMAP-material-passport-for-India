import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { RawRecord } from '../models/RawRecord';
import { NormalizedMaterial } from '../models/NormalizedMaterial';
import {
  normalizeFile,
  normalizeRecord,
  getNormalizationStatus,
} from '../services/normalization/index';
import type { IRawRecordDocument } from '../types/normalization';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function param(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── Trigger normalization for an entire file ─────────────────────────────────

export async function triggerFileNormalization(req: Request, res: Response): Promise<void> {
  const fileId = param(req, 'fileId');

  if (!fileId || !isValidObjectId(fileId)) {
    res.status(400).json({ success: false, message: 'Invalid fileId' });
    return;
  }

  const objectId = new mongoose.Types.ObjectId(fileId);
  const result = await normalizeFile(objectId);

  res.status(200).json({
    success: true,
    message: `Normalization completed: ${result.succeeded}/${result.total} records processed`,
    data: result,
  });
}

// ─── Trigger normalization for a single raw record ────────────────────────────

export async function triggerRecordNormalization(req: Request, res: Response): Promise<void> {
  const recordId = param(req, 'recordId');

  if (!recordId || !isValidObjectId(recordId)) {
    res.status(400).json({ success: false, message: 'Invalid recordId' });
    return;
  }

  const rawRecord = await RawRecord.findById(recordId);
  if (!rawRecord) {
    res.status(404).json({ success: false, message: 'RawRecord not found' });
    return;
  }

  const result = await normalizeRecord(rawRecord as IRawRecordDocument);

  const status = result.error ? 400 : 200;
  res.status(status).json({
    success: !result.error,
    message: result.error
      ? `Normalization failed: ${result.error}`
      : `Normalized ${result.normalizedCount} material(s)`,
    data: result,
  });
}

// ─── Get normalization status for a file ─────────────────────────────────────

export async function getFileNormalizationStatus(req: Request, res: Response): Promise<void> {
  const fileId = param(req, 'fileId');

  if (!fileId || !isValidObjectId(fileId)) {
    res.status(400).json({ success: false, message: 'Invalid fileId' });
    return;
  }

  const objectId = new mongoose.Types.ObjectId(fileId);
  const status = await getNormalizationStatus(objectId);

  res.status(200).json({
    success: true,
    message: 'Normalization status retrieved',
    data: status,
  });
}

// ─── Get normalized materials for a file ─────────────────────────────────────

export async function getNormalizedMaterials(req: Request, res: Response): Promise<void> {
  const fileId = param(req, 'fileId');

  if (!fileId || !isValidObjectId(fileId)) {
    res.status(400).json({ success: false, message: 'Invalid fileId' });
    return;
  }

  const page  = Math.max(1, parseInt(String(req.query['page']  ?? '1'),  10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? '50'), 10)));
  const skip  = (page - 1) * limit;

  const objectId = new mongoose.Types.ObjectId(fileId);

  const [materials, total] = await Promise.all([
    NormalizedMaterial.find({ sourceFileId: objectId })
      .sort({ category: 1, standardizedMaterialName: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    NormalizedMaterial.countDocuments({ sourceFileId: objectId }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    message: 'Normalized materials retrieved',
    data: materials,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}

// ─── Get raw records for a file ───────────────────────────────────────────────

export async function getRawRecords(req: Request, res: Response): Promise<void> {
  const fileId = param(req, 'fileId');

  if (!fileId || !isValidObjectId(fileId)) {
    res.status(400).json({ success: false, message: 'Invalid fileId' });
    return;
  }

  const page  = Math.max(1, parseInt(String(req.query['page']  ?? '1'),  10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? '50'), 10)));
  const skip  = (page - 1) * limit;

  const objectId = new mongoose.Types.ObjectId(fileId);

  const [records, total] = await Promise.all([
    RawRecord.find({ sourceFileId: objectId })
      .sort({ rowIndex: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    RawRecord.countDocuments({ sourceFileId: objectId }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    message: 'Raw records retrieved',
    data: records,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}
