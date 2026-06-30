import XLSX from 'xlsx';
import path from 'path';
import type { ExcelParseResult, RawExcelRow } from './excelProcessingService';

// ─── IFC Export Layout ────────────────────────────────────────────────────────
//
// Row 0 (index 0): Project / schema metadata banner
//   e.g. "GMAP Material Passport · Project Metadata · IFC Schema information"
// Row 1 (index 1): Section group headings (IDENTIFICATION | ELEMENT | …)
// Row 2 (index 2): ← ACTUAL column headers ("GMAP Id", "IFC Class", …)
// Row 3+           ← Data rows
//
// Using sheet_to_json with header:1 gives us raw arrays so we can pick the
// header row by index before building the keyed objects.

const HEADER_ROW_INDEX = 2; // 0-based
const DATA_START_INDEX = 3; // 0-based

/**
 * Parses the first worksheet of an IFC-derived Excel export.
 *
 * IFC exports produced by ifc_to_excel.py have three header rows before the
 * first data row.  This parser reads the sheet as a raw 2-D array, treats
 * row index 2 as the column-header row, and converts every subsequent row into
 * a plain object keyed by those headers.  Columns whose header cell is empty
 * or null are silently dropped from every output object.
 *
 * The return value is the same ExcelParseResult shape as parseExcelFile() so
 * the rest of the pipeline (mapExcelRows → insertMaterialRecords) is unchanged.
 *
 * @throws Error if the file is missing, has no worksheets, or the header row
 *   is empty (which would indicate an unexpected file structure).
 */
export function parseIfcExcelFile(filePath: string): ExcelParseResult {
  console.log('USING IFC EXCEL PARSER');
  console.log(`[parseIfcExcelFile] file: ${filePath}`);

  const absolutePath = path.resolve(filePath);

  const workbook = XLSX.readFile(absolutePath, {
    cellDates: true,   // convert Excel date serials → JS Date objects
    cellNF: false,
    cellText: false,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('IFC Excel file contains no worksheets.');
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Worksheet "${sheetName}" could not be read from IFC Excel file.`);
  }

  // Pull the entire sheet as a 2-D array of raw values.
  // defval: null ensures every cell is present (no gaps in arrays).
  // blankrows: false removes rows where every cell resolved to null.
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: null,
    blankrows: false,
    raw: true,
  });

  // ── Extract header row ────────────────────────────────────────────────────

  const headerRow = allRows[HEADER_ROW_INDEX];
  if (!headerRow || headerRow.length === 0) {
    throw new Error(
      `IFC Excel file has no header row at index ${HEADER_ROW_INDEX}. ` +
      `Expected the column names ("GMAP Id", "IFC Class", …) at row ${HEADER_ROW_INDEX + 1}.`,
    );
  }

  // Map column position → header string; positions with empty/null headers are
  // recorded as null so data cells in those columns are dropped later.
  const headerByIndex: (string | null)[] = headerRow.map((cell) => {
    if (cell === null || cell === undefined) return null;
    const s = String(cell).trim();
    return s.length > 0 ? s : null;
  });

  // The ordered list of non-empty header strings (used to drive mapExcelRows).
  const headers = headerByIndex.filter((h): h is string => h !== null);

  if (headers.length === 0) {
    throw new Error(
      'IFC Excel header row (index 2) contains no readable column names. ' +
      'Verify the file was produced by ifc_to_excel.py.',
    );
  }

  // ── Convert data rows to objects ──────────────────────────────────────────

  const dataArrayRows = allRows.slice(DATA_START_INDEX);

  const rows: RawExcelRow[] = [];

  for (const arrayRow of dataArrayRows) {
    const obj: RawExcelRow = {};
    let hasValue = false;

    for (let colIdx = 0; colIdx < headerByIndex.length; colIdx++) {
      const header = headerByIndex[colIdx];
      if (header === null) continue;          // skip columns with empty header

      const value = arrayRow[colIdx] ?? null;
      if (value !== null && value !== undefined && value !== '') {
        obj[header] = value;
        hasValue = true;
      } else {
        obj[header] = null;
      }
    }

    // Any columns beyond the header range are ignored (no header to name them).

    if (hasValue) {
      rows.push(obj);
    }
  }

  console.log(`[parseIfcExcelFile] sheet: "${sheetName}" | headers (${headers.length}):`, headers);
  console.log(`[parseIfcExcelFile] totalRows: ${rows.length} | first row:`, rows[0] ?? '(none)');

  return {
    rows,
    headers,
    sheetName,
    totalRows: rows.length,
  };
}