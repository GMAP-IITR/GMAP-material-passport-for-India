import mongoose, { Schema, type Model } from 'mongoose';
import type { IRawRecordDocument } from '../types/normalization';

const PROCESSING_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
const MATERIAL_SOURCE_TYPES = ['excel', 'dsr_boq', 'ifc', 'pdf', 'manual'] as const;

const rawRecordSchema = new Schema<IRawRecordDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    sourceFileId: {
      type: Schema.Types.ObjectId,
      ref: 'UploadedFile',
      required: [true, 'sourceFileId is required'],
      index: true,
    },
    sourceType: {
      type: String,
      enum: { values: MATERIAL_SOURCE_TYPES, message: 'Invalid source type' },
      required: [true, 'sourceType is required'],
      index: true,
    },
    rowIndex: {
      type: Number,
      required: [true, 'rowIndex is required'],
      min: 0,
    },
    rawData: {
      type: Schema.Types.Mixed,
      required: [true, 'rawData is required'],
      default: {},
    },
    normalized: {
      type: Boolean,
      default: false,
      index: true,
    },
    normalizedAt: { type: Date },
    normalizationError: { type: String, trim: true },
    processingStatus: {
      type: String,
      enum: { values: PROCESSING_STATUSES, message: 'Invalid processing status' },
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound indexes for common query patterns
rawRecordSchema.index({ sourceFileId: 1, rowIndex: 1 }, { unique: true });
rawRecordSchema.index({ projectId: 1, sourceType: 1 });
rawRecordSchema.index({ projectId: 1, normalized: 1 });
rawRecordSchema.index({ processingStatus: 1, normalized: 1 });

export const RawRecord: Model<IRawRecordDocument> =
  mongoose.model<IRawRecordDocument>('RawRecord', rawRecordSchema);
