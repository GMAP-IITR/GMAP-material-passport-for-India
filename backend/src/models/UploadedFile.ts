import mongoose, { Schema, type Model } from 'mongoose';
import type { IUploadedFileDocument } from '../types';

const FILE_TYPES = ['excel', 'ifc', 'pdf'] as const;

const uploadedFileSchema = new Schema<IUploadedFileDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    fileName: {
      type: String,
      required: [true, 'Stored file name is required'],
      unique: true,
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    fileType: {
      type: String,
      enum: {
        values: FILE_TYPES,
        message: `File type must be one of: ${FILE_TYPES.join(', ')}`,
      },
      required: [true, 'File type is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    generatedExcelPath: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

uploadedFileSchema.index({ projectId: 1, uploadedAt: -1 });
uploadedFileSchema.index({ fileType: 1 });

export const UploadedFile: Model<IUploadedFileDocument> =
  mongoose.model<IUploadedFileDocument>('UploadedFile', uploadedFileSchema);
