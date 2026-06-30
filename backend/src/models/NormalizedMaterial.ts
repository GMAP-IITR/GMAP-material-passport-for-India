import mongoose, { Schema, type Model } from 'mongoose';
import type { INormalizedMaterialDocument } from '../types/normalization';

const MATERIAL_SOURCE_TYPES = ['excel', 'dsr_boq', 'ifc', 'pdf', 'manual'] as const;
const EXTRACTION_METHODS = ['direct', 'llm'] as const;

const normalizedMaterialSchema = new Schema<INormalizedMaterialDocument>(
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
    sourceRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'RawRecord',
      required: [true, 'sourceRecordId is required'],
      index: true,
    },
    sourceType: {
      type: String,
      enum: { values: MATERIAL_SOURCE_TYPES, message: 'Invalid source type' },
      required: [true, 'sourceType is required'],
      index: true,
    },

    // ─── Core Identity ────────────────────────────────────────────────────────
    materialName: {
      type: String,
      trim: true,
      required: [true, 'materialName is required'],
    },
    standardizedMaterialName: {
      type: String,
      trim: true,
      required: [true, 'standardizedMaterialName is required'],
    },
    category: {
      type: String,
      trim: true,
      required: [true, 'category is required'],
      index: true,
    },
    subcategory:  { type: String, trim: true, index: true },
    materialType: { type: String, trim: true },
    description:  { type: String, trim: true },

    // ─── Physical Properties ──────────────────────────────────────────────────
    quantity:  { type: Number, min: 0 },
    unit:      { type: String, trim: true },
    volume:    { type: Number, min: 0 },
    area:      { type: Number, min: 0 },
    thickness: { type: Number, min: 0 },
    mass:      { type: Number, min: 0 },
    density:   { type: Number, min: 0 },

    // ─── Environmental ────────────────────────────────────────────────────────
    embodiedCarbon: { type: Number },

    // ─── Building Context ─────────────────────────────────────────────────────
    floor:                { type: String, trim: true },
    ifcClass:             { type: String, trim: true },
    classificationSystem: { type: String, trim: true },
    classificationCode:   { type: String, trim: true, index: true },
    classificationName:   { type: String, trim: true },

    // ─── DSR / BOQ ────────────────────────────────────────────────────────────
    dsrCode: { type: String, trim: true, index: true },
    rate:    { type: Number },
    amount:  { type: Number },

    // ─── Extraction Metadata ──────────────────────────────────────────────────
    confidence: {
      type: Number,
      required: [true, 'confidence is required'],
      min: [0, 'confidence must be ≥ 0'],
      max: [1, 'confidence must be ≤ 1'],
    },
    extractionMethod: {
      type: String,
      enum: { values: EXTRACTION_METHODS, message: 'Invalid extraction method' },
      required: [true, 'extractionMethod is required'],
    },
    llmModel: { type: String, trim: true },

    rawData: { type: Schema.Types.Mixed, default: {} },

    uploadDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound indexes for common query patterns
normalizedMaterialSchema.index({ projectId: 1, category: 1 });
normalizedMaterialSchema.index({ projectId: 1, sourceType: 1 });
normalizedMaterialSchema.index({ projectId: 1, uploadDate: -1 });
// normalizedMaterialSchema.index({ sourceRecordId: 1 });
normalizedMaterialSchema.index({ confidence: -1 });
normalizedMaterialSchema.index(
  { projectId: 1, materialName: 'text', standardizedMaterialName: 'text', category: 'text' },
  { name: 'normalized_material_text' },
);

export const NormalizedMaterial: Model<INormalizedMaterialDocument> =
  mongoose.model<INormalizedMaterialDocument>('NormalizedMaterial', normalizedMaterialSchema);
