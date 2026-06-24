import mongoose, { Schema, type Model } from 'mongoose';
import type { IMaterialRecordDocument } from '../types';

const MATERIAL_SOURCE_TYPES = ['dsr_boq', 'ifc', 'pdf', 'manual'] as const;

const materialRecordSchema = new Schema<IMaterialRecordDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    sourceType: {
      type: String,
      enum: {
        values: MATERIAL_SOURCE_TYPES,
        message: `Source type must be one of: ${MATERIAL_SOURCE_TYPES.join(', ')}`,
      },
      required: [true, 'Source type is required'],
      index: true,
    },
    sourceFileId: {
      type: Schema.Types.ObjectId,
      ref: 'UploadedFile',
    },

    // ─── Core Material Information ────────────────────────────────────────────
    materialName:     { type: String, trim: true },
    materialType:     { type: String, trim: true },
    materialCategory: { type: String, trim: true },
    description:      { type: String, trim: true },

    // ─── Physical Properties ──────────────────────────────────────────────────
    quantity:  { type: Number, min: 0 },
    unit:      { type: String, trim: true },
    volume:    { type: Number, min: 0 },
    area:      { type: Number, min: 0 },
    length:    { type: Number, min: 0 },
    width:     { type: Number, min: 0 },
    height:    { type: Number, min: 0 },
    thickness: { type: Number, min: 0 },
    diameter:  { type: Number, min: 0 },
    mass:      { type: Number, min: 0 },
    density:   { type: Number, min: 0 },

    // ─── Environmental Data ───────────────────────────────────────────────────
    embodiedCarbon:               { type: Number },
    carbonPerKg:                  { type: Number },
    reusedPercentage:             { type: Number, min: 0, max: 100 },
    reusePotentialPercentage:     { type: Number, min: 0, max: 100 },
    constructionWastePercentage:  { type: Number, min: 0, max: 100 },

    // ─── Building / IFC Information ───────────────────────────────────────────
    buildingName: { type: String, trim: true },
    floor:        { type: String, trim: true },
    elementName:  { type: String, trim: true },
    ifcClass:     { type: String, trim: true },

    // ─── Classification ───────────────────────────────────────────────────────
    classificationSystem: { type: String, trim: true },
    classificationCode:   { type: String, trim: true },
    classificationName:   { type: String, trim: true },

    // ─── Lifecycle ────────────────────────────────────────────────────────────
    lifespanYears:    { type: Number, min: 0 },
    installationDate: { type: Date },

    // ─── DSR/BOQ-specific ─────────────────────────────────────────────────────
    // Excel column mapping: S.No → serialNumber | DSR Code → dsrCode
    serialNumber: { type: String, trim: true },
    dsrCode:      { type: String, trim: true },
    rate:         { type: Number },
    amount:       { type: Number },

    // ─── Unmapped Columns ─────────────────────────────────────────────────────
    // Any source-file column that doesn't map to a structured field above
    rawData: {
      type: Schema.Types.Mixed,
      default: {},
    },

    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound indexes for common query patterns
materialRecordSchema.index({ projectId: 1, sourceType: 1 });
materialRecordSchema.index({ projectId: 1, uploadDate: -1 });
materialRecordSchema.index({ sourceFileId: 1 });
materialRecordSchema.index({ dsrCode: 1 });
materialRecordSchema.index({ projectId: 1, materialName: 'text', description: 'text' });

export const MaterialRecord: Model<IMaterialRecordDocument> =
  mongoose.model<IMaterialRecordDocument>('MaterialRecord', materialRecordSchema);
