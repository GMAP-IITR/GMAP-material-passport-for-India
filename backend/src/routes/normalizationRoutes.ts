import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  triggerFileNormalization,
  triggerRecordNormalization,
  getFileNormalizationStatus,
  getNormalizedMaterials,
  getRawRecords,
} from '../controllers/normalizationController';

const router = Router();

// POST /normalization/files/:fileId/trigger        — normalize all records in a file
router.post('/files/:fileId/trigger', asyncHandler(triggerFileNormalization));

// POST /normalization/records/:recordId/trigger    — normalize a single raw record
router.post('/records/:recordId/trigger', asyncHandler(triggerRecordNormalization));

// GET  /normalization/files/:fileId/status         — normalization progress for a file
router.get('/files/:fileId/status', asyncHandler(getFileNormalizationStatus));

// GET  /normalization/files/:fileId/materials      — paginated normalized materials
router.get('/files/:fileId/materials', asyncHandler(getNormalizedMaterials));

// GET  /normalization/files/:fileId/raw            — paginated raw records
router.get('/files/:fileId/raw', asyncHandler(getRawRecords));

export default router;
