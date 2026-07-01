import type { MaterialSourceType } from '../types';
import type { RawExcelRow } from './excelProcessingService';

// ─── Mapped field names ───────────────────────────────────────────────────────
// Mirrors every optional field on IMaterialRecord that can come from a column.

type MappedField =
  | 'materialName' | 'materialType' | 'materialCategory' | 'description'
  | 'quantity' | 'unit' | 'volume' | 'area' | 'length' | 'width' | 'height'
  | 'thickness' | 'diameter' | 'mass' | 'density'
  | 'embodiedCarbon' | 'carbonPerKg'
  | 'reusedPercentage' | 'reusePotentialPercentage' | 'constructionWastePercentage'
  | 'buildingName' | 'floor' | 'elementName' | 'ifcClass'
  | 'classificationSystem' | 'classificationCode' | 'classificationName'
  | 'lifespanYears'
  | 'serialNumber' | 'dsrCode' | 'rate' | 'amount';

// ─── Output row type ──────────────────────────────────────────────────────────

export interface MappedMaterialRow {
  materialName?: string;
  materialType?: string;
  materialCategory?: string;
  description?: string;
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
  embodiedCarbon?: number;
  carbonPerKg?: number;
  reusedPercentage?: number;
  reusePotentialPercentage?: number;
  constructionWastePercentage?: number;
  buildingName?: string;
  floor?: string;
  elementName?: string;
  ifcClass?: string;
  classificationSystem?: string;
  classificationCode?: string;
  classificationName?: string;
  lifespanYears?: number;
  serialNumber?: string;
  dsrCode?: string;
  rate?: number;
  amount?: number;
  rawData: Record<string, unknown>;
}

// ─── Numeric field set ────────────────────────────────────────────────────────

const NUMERIC_FIELDS = new Set<MappedField>([
  'quantity', 'volume', 'area', 'length', 'width', 'height', 'thickness',
  'diameter', 'mass', 'density', 'embodiedCarbon', 'carbonPerKg',
  'reusedPercentage', 'reusePotentialPercentage', 'constructionWastePercentage',
  'lifespanYears', 'rate', 'amount',
]);

// ─── Column aliases ───────────────────────────────────────────────────────────
// All aliases are plain lowercase ASCII — normalizeHeader() converts actual
// headers to this form before matching.

const FIELD_ALIASES: Record<MappedField, string[]> = {
  // ── Core material info ─────────────────────────────────────────────────────
  materialName: [
    'material / product', 'material/product', 'material', 'material name',
    'product', 'product name', 'name',
  ],
  materialType:     ['material type'],
  materialCategory: ['material category', 'category'],
  description: [
    'description', 'item description', 'work description', 'particulars',
    'item', 'details', 'work item',
  ],

  // ── Physical properties ────────────────────────────────────────────────────
  quantity: ['qty', 'quantity', 'nos', 'nos.', 'no.', 'numbers'],
  unit:     ['unit', 'uom', 'units', 'unit of measurement', 'unit of measure'],
  volume:   ['volume (m3)', 'volume (m³)', 'volume', 'vol', 'vol.', 'vol (m3)'],
  area:     ['area (m2)', 'area (m²)', 'area', 'surface area'],
  length:   ['length (m)', 'length (mm)', 'length'],
  width:    ['width (m)', 'width (mm)', 'width'],
  height:   ['height (m)', 'height (mm)', 'height'],
  thickness:['thickness (m)', 'thickness (mm)', 'thickness'],
  diameter: ['diameter (m)', 'diameter (mm)', 'dia', 'diameter'],
  mass:     ['mass (kg)', 'mass', 'weight (kg)', 'weight'],
  density:  ['density (kg/m3)', 'density (kg/m³)', 'density'],

  // ── Environmental ──────────────────────────────────────────────────────────
  embodiedCarbon: [
    'embodied carbon a1-a3 (kg co2e)', 'embodied carbon a1-a3 (kg co₂e)',
    'embodied carbon a1-a3', 'embodied carbon',
    'gwp a1-a3 (kg co2e)', 'gwp a1-a3',
    'carbon (kg co2e)', 'co2e (kg)', 'ec (kg co2e)',
  ],
  carbonPerKg: [
    'gwp / kg (kg co2e/kg)', 'gwp / kg (kg co₂e/kg)',
    'gwp/kg', 'gwp / kg', 'carbon per kg', 'co2 per kg',
  ],
  reusedPercentage:             ['reused (%)', 'reused percentage', '% reused', 'reused', 'recycled (%)'],
  reusePotentialPercentage:     ['reuse potential (%)', 'reuse potential', '% reuse potential', '% available for reuse', 'available for reuse (%)'],
  constructionWastePercentage:  ['construction waste (%)', 'waste (%)', 'waste percentage', 'assumed construction waste'],

  // ── Building / IFC ────────────────────────────────────────────────────────
  buildingName: ['building', 'building name', 'structure'],
  floor: [
    'floor / storey', 'floor/storey', 'floor', 'storey',
    'level', 'level/storey',
  ],
  elementName: ['element', 'element name', 'component', 'building element', 'element type'],
  ifcClass:    ['ifc class', 'ifc_class', 'ifcclass', 'ifc entity'],

  // ── Classification ─────────────────────────────────────────────────────────
  classificationSystem: ['classification system', 'class. system'],
  classificationCode:   ['classification code', 'class. code', 'class code'],
  classificationName:   ['classification name', 'class. name', 'class name'],

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  lifespanYears: [
    'lifespan (years)', 'lifespan', 'design life (years)', 'design life',
    'service life (years)', 'service life',
  ],

  // ── DSR / BOQ ─────────────────────────────────────────────────────────────
  serialNumber: [
    's.no.', 's.no', 's. no.', 'sno', 'sr. no.', 'sr no', 'sl.no.', 'sl. no.',
    'serial no', 'serial number', 'item no', 'item no.', '#', 'no.', 'sno.',
  ],
  dsrCode: [
    'dsr code', 'dsr no.', 'dsr no', 'item code', 'spec code', 'code', 'dsr item code',
  ],
  rate: [
    'rate', 'unit rate', 'rate (rs)', 'rate (inr)', 'rate (rs.)',
    'unit rate (rs)', 'unit rate (rs.)', 'rate per unit',
  ],
  amount: ['amount', 'total amount', 'total', 'value', 'cost', 'total cost'],
};

// ─── Header normalization ─────────────────────────────────────────────────────

function normalizeHeader(raw: unknown): string {
  return String(raw)
    .toLowerCase()
    .trim()
    .replace(/\r?\n|\r/g, ' ')  // line breaks → space
    .replace(/\s+/g, ' ')       // collapse whitespace
    .replace(/²/g, '2')    // ² → 2
    .replace(/³/g, '3')    // ³ → 3
    .replace(/₂/g, '2')    // ₂ → 2
    .replace(/₃/g, '3')    // ₃ → 3
    .replace(/₹/g, 'rs')   // ₹ → rs
    .trim();
}

// ─── Header → field map builder ───────────────────────────────────────────────

function buildHeaderMap(headers: string[]): Map<string, MappedField> {
  // Pre-compute normalized alias sets once
  const aliasLookup = (
    Object.entries(FIELD_ALIASES) as Array<[MappedField, string[]]>
  ).map(([field, aliases]) => ({
    field,
    aliasSet: new Set(aliases.map(normalizeHeader)),
  }));

  const map = new Map<string, MappedField>();

  for (const rawHeader of headers) {
    const norm = normalizeHeader(rawHeader);
    for (const { field, aliasSet } of aliasLookup) {
      if (aliasSet.has(norm)) {
        map.set(rawHeader, field);
        break;
      }
    }
    // Unmapped headers remain in the map's absence → they'll go to rawData
  }

  return map;
}

// ─── Value coercion ───────────────────────────────────────────────────────────

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(/,/g, '').trim());
    return isFinite(n) ? n : undefined;
  }
  return undefined;
}

function toStr(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const s = String(value).trim();
  return s.length > 0 ? s : undefined;
}

// ─── Single row mapper ────────────────────────────────────────────────────────

function mapRow(
  row: RawExcelRow,
  headerMap: Map<string, MappedField>,
): MappedMaterialRow | null {
  const mapped: Record<string, unknown> = {};
  const rawData: Record<string, unknown> = {};

  for (const [col, value] of Object.entries(row)) {
    if (value === null || value === undefined || value === '') continue;

    const field = headerMap.get(col);

    if (!field) {
      rawData[col] = value;
      continue;
    }

    const coerced = NUMERIC_FIELDS.has(field) ? toNumber(value) : toStr(value);
    if (coerced !== undefined) mapped[field] = coerced;
  }

  if (Object.keys(mapped).length === 0 && Object.keys(rawData).length === 0) {
    return null; // entirely empty row after coercion
  }

  console.log('STAGE 3 - MAPPED ROW', JSON.stringify({ mapped, rawData }, null, 2));
  return { ...(mapped as Omit<MappedMaterialRow, 'rawData'>), rawData };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Detects whether the sheet looks like DSR/BOQ format by scanning for
 * DSR-specific column names.  Returns 'dsr_boq' or 'excel'.
 */
export function detectExcelSourceType(headers: string[]): MaterialSourceType {
  const normed = new Set(headers.map(normalizeHeader));
  const dsrSignals = ['dsr code', 'dsr no', 'dsr no.', 'rate', 'amount', 'unit rate'];
  return dsrSignals.some((s) => normed.has(s)) ? 'dsr_boq' : 'excel';
}

/**
 * Maps an array of raw Excel rows (keyed by their original header strings)
 * to structured MaterialRecord-compatible objects.  Any column that does not
 * match a known alias ends up in the row's `rawData` map.
 */
export function mapExcelRows(
  rows: RawExcelRow[],
  headers: string[],
): MappedMaterialRow[] {
  const headerMap = buildHeaderMap(headers);

  return rows.reduce<MappedMaterialRow[]>((acc, row) => {
    const mapped = mapRow(row, headerMap);
    if (mapped) acc.push(mapped);
    return acc;
  }, []);
}

console.log('Excel mapping service loaded.');