import type { Document, Types } from 'mongoose';
import type { MaterialSourceType } from './index';

// ─── Processing Status ────────────────────────────────────────────────────────

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ─── Raw Record ───────────────────────────────────────────────────────────────

export interface IRawRecord {
  projectId?: Types.ObjectId;
  sourceFileId: Types.ObjectId;
  sourceType: MaterialSourceType;

  // Row index within the source file (0-based for Excel, element index for IFC)
  rowIndex: number;

  // All columns as-is from the parsed source file
  rawData: Record<string, unknown>;

  // Normalization lifecycle
  normalized: boolean;
  normalizedAt?: Date;
  normalizationError?: string;
  processingStatus: ProcessingStatus;

  createdAt: Date;
  updatedAt: Date;
}

export interface IRawRecordDocument extends IRawRecord, Document {}

// ─── Normalized Material ──────────────────────────────────────────────────────

export interface INormalizedMaterial {
  projectId?: Types.ObjectId;
  sourceFileId: Types.ObjectId;
  sourceRecordId: Types.ObjectId;        // → RawRecord._id
  sourceType: MaterialSourceType;

  // Core identity
  materialName: string;
  standardizedMaterialName: string;      // cleaned, title-cased
  category: string;                      // top-level category (e.g. "Concrete")
  subcategory?: string;                  // finer grouping (e.g. "Ready Mix")
  materialType?: string;
  description?: string;

  // Physical properties (IFC or LLM-extracted)
  quantity?: number;
  unit?: string;
  volume?: number;
  area?: number;
  thickness?: number;
  mass?: number;
  density?: number;

  // Environmental
  embodiedCarbon?: number;

  // Building context (IFC)
  floor?: string;
  ifcClass?: string;
  classificationSystem?: string;
  classificationCode?: string;
  classificationName?: string;

  // DSR/BOQ
  dsrCode?: string;
  rate?: number;
  amount?: number;

  // Extraction metadata
  confidence: number;                    // 0.0–1.0
  extractionMethod: 'direct' | 'llm';   // IFC=direct, Excel/PDF=llm
  llmModel?: string;                     // which model was used (llm path only)

  // Any extra fields the LLM or mapper couldn't categorise
  rawData?: Record<string, unknown>;

  uploadDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INormalizedMaterialDocument extends INormalizedMaterial, Document {}

// ─── LLM Extraction Types ─────────────────────────────────────────────────────

export interface ExtractedMaterial {
  materialName: string;
  standardizedMaterialName: string;
  category: string;
  subcategory?: string;
  quantity?: number;
  unit?: string;
  confidence: number;
  notes?: string;
}

export interface LlmExtractionResult {
  materials: ExtractedMaterial[];
  rawDescription: string;
}

// ─── Normalization Result ─────────────────────────────────────────────────────

export interface NormalizationResult {
  rawRecordId: Types.ObjectId;
  normalizedCount: number;
  error?: string;
}
