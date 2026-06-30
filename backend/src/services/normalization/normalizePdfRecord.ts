import type { IRawRecordDocument, INormalizedMaterialDocument } from '../../types/normalization';
import { normalizeExcelRecord } from './normalizeExcelRecord';

/**
 * PDF records share the same BOQ/schedule structure as Excel after OCR.
 * Delegates directly to the Excel normaliser with sourceType='pdf'.
 */
export async function normalizePdfRecord(
  rawRecord: IRawRecordDocument,
): Promise<INormalizedMaterialDocument[]> {
  return normalizeExcelRecord(rawRecord, 'pdf');
}
