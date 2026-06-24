import mongoose, { Schema, type Model } from 'mongoose';
import type { IProjectDocument } from '../types';

const SOURCE_TYPES = ['excel', 'ifc', 'pdf', 'manual'] as const;

const projectSchema = new Schema<IProjectDocument>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [200, 'Project name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    sourceType: {
      type: String,
      enum: {
        values: SOURCE_TYPES,
        message: `Source type must be one of: ${SOURCE_TYPES.join(', ')}`,
      },
      required: [true, 'Source type is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

projectSchema.index({ name: 'text', description: 'text' });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ sourceType: 1 });

export const Project: Model<IProjectDocument> = mongoose.model<IProjectDocument>(
  'Project',
  projectSchema,
);
