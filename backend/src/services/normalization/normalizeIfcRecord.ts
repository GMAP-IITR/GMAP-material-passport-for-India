import type { Types } from 'mongoose';
import { NormalizedMaterial } from '../../models/NormalizedMaterial';
import type { IRawRecordDocument, INormalizedMaterialDocument } from '../../types/normalization';

// IFC Excel column names produced by ifc_to_excel.py
const COL = {
  material:        'Material / Product',
  category:        'Material Category',
  volume:          'Volume (m³)',
  geomVolume:      'Geom Volume (m³)',
  thickness:       'Thickness (m)',
  density:         'Density (kg/m³)',
  embodiedCarbon:  'Embodied Carbon A1-A3 (kg CO₂e)',
  floor:           'Floor / Storey',
  ifcClass:        'IFC Class',
  mass:            'Mass (kg)',
  area:            'Area (m²)',
  classCode:       'Classification Code',
  className:       'Classification Name',
} as const;

function toNumber(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

function toStr(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined;
  const s = String(val).trim();
  return s.length > 0 ? s : undefined;
}

function toPositiveNumber(val: unknown): number | undefined {
  const n = toNumber(val);
  return n !== undefined && n > 0 ? n : undefined;
}

/**
 * Converts a single RawRecord (sourceType='ifc') to one NormalizedMaterial.
 * All field mappings are deterministic — no LLM call is made.
 * Confidence is always 1.0 for IFC records.
 */
export async function normalizeIfcRecord(
  rawRecord: IRawRecordDocument,
): Promise<INormalizedMaterialDocument> {
  const d = rawRecord.rawData as Record<string, unknown>;

  const materialName = toStr(d[COL.material]) ?? 'Unknown Material';
  const category = toStr(d[COL.category]) ?? 'Other';

  // Standardised name = title-cased material name (strip extra whitespace)
  const standardizedMaterialName = materialName
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const volume = toPositiveNumber(d[COL.volume]) ?? toPositiveNumber(d[COL.geomVolume]);

  const doc = new NormalizedMaterial({
    projectId:   rawRecord.projectId,
    sourceFileId: rawRecord.sourceFileId,
    sourceRecordId: rawRecord._id as Types.ObjectId,
    sourceType: 'ifc',

    materialName,
    standardizedMaterialName,
    category,

    volume,
    area:           toPositiveNumber(d[COL.area]),
    thickness:      toPositiveNumber(d[COL.thickness]),
    mass:           toPositiveNumber(d[COL.mass]),
    density:        toPositiveNumber(d[COL.density]),
    embodiedCarbon: toNumber(d[COL.embodiedCarbon]),

    floor:              toStr(d[COL.floor]),
    ifcClass:           toStr(d[COL.ifcClass]),
    classificationCode: toStr(d[COL.classCode]),
    classificationName: toStr(d[COL.className]),

    confidence: 1.0,
    extractionMethod: 'direct',

    uploadDate: rawRecord.createdAt,
  });

  return doc.save();
}
