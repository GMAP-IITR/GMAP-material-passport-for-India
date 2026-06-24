import type { Document, Types } from 'mongoose';

// ─── Shared Enums ────────────────────────────────────────────────────────────

export type SourceType = 'excel' | 'ifc' | 'pdf' | 'manual';
export type FileType = 'excel' | 'ifc' | 'pdf';
export type MaterialSourceType = 'excel' | 'dsr_boq' | 'ifc' | 'pdf' | 'manual';

// ─── Project ─────────────────────────────────────────────────────────────────

export interface IProject {
  name: string;
  description: string;
  sourceType: SourceType;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectDocument extends IProject, Document {}

// ─── UploadedFile ─────────────────────────────────────────────────────────────

export interface IUploadedFile {
  projectId?: Types.ObjectId;
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileType: FileType;
  fileSize: number;
  uploadedAt: Date;
  generatedExcelPath?: string;
}

export interface IUploadedFileDocument extends IUploadedFile, Document {}

// ─── MaterialRecord ───────────────────────────────────────────────────────────
//
// Supports two primary source formats:
//
// A) DSR/BOQ Excel  — serialNumber, dsrCode, rate, unit, quantity, amount
// B) IFC-derived    — materialName, volume, area, mass, density, embodiedCarbon,
//                     ifcClass, classificationCode, lifespanYears, …
//
// Any column that doesn't map to a structured field is stored in `rawData`.

export interface IMaterialRecord {
  projectId?: Types.ObjectId;
  sourceType: MaterialSourceType;
  sourceFileId?: Types.ObjectId;

  // Core Material Information
  materialName?: string;
  materialType?: string;
  materialCategory?: string;
  description?: string;

  // Physical Properties
  quantity?: number;
  unit?: string;
  volume?: number;
  area?: number;
  length?: number;
  width?: number;
  height?: number;
  thickness?: number;
  diameter?: number;
  mass?: number;
  density?: number;

  // Environmental Data
  embodiedCarbon?: number;
  carbonPerKg?: number;
  reusedPercentage?: number;
  reusePotentialPercentage?: number;
  constructionWastePercentage?: number;

  // Building Information
  buildingName?: string;
  floor?: string;
  elementName?: string;
  ifcClass?: string;

  // Classification
  classificationSystem?: string;
  classificationCode?: string;
  classificationName?: string;

  // Lifecycle
  lifespanYears?: number;
  installationDate?: Date;

  // DSR/BOQ-specific (maps: S.No → serialNumber, DSR Code → dsrCode)
  serialNumber?: string;
  dsrCode?: string;
  rate?: number;
  amount?: number;

  // Unmapped columns from source file
  rawData?: Record<string, unknown>;
  uploadDate: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface IMaterialRecordDocument extends IMaterialRecord, Document {}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiPaginatedResponse<T = unknown> {
  success: true;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  stack?: string;
}

export type ApiResponse<T = unknown> =
  | ApiSuccessResponse<T>
  | ApiPaginatedResponse<T>
  | ApiErrorResponse;
