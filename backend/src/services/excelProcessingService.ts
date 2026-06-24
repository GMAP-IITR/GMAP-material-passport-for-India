import XLSX from 'xlsx';
import path from 'path';

export interface RawExcelRow {
  [columnName: string]: unknown;
}

export interface ExcelParseResult {
  rows: RawExcelRow[];
  headers: string[];
  sheetName: string;
  totalRows: number;
}

/**
 * Reads the first worksheet of an Excel file and returns its rows as plain
 * objects, keyed by the header row values.  Empty / blank rows are dropped.
 *
 * @param filePath  Relative or absolute path to the .xlsx/.xls file.
 */
export function parseExcelFile(filePath: string): ExcelParseResult {
  const absolutePath = path.resolve(filePath);

  const workbook = XLSX.readFile(absolutePath, {
    cellDates: true,   // parse Excel date serials → JS Date
    cellNF: false,
    cellText: false,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel file contains no worksheets.');
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Worksheet "${sheetName}" could not be read.`);
  }

  const rawRows = XLSX.utils.sheet_to_json<RawExcelRow>(worksheet, {
    defval: null,      // include empty cells as null (not omitted)
    blankrows: false,
    raw: true,         // keep native JS types (numbers as numbers, etc.)
  });

  // Drop rows where every cell is null / undefined / empty string
  const nonEmptyRows = rawRows.filter((row) =>
    Object.values(row).some((v) => v !== null && v !== undefined && v !== ''),
  );

  const headers = nonEmptyRows.length > 0 ? Object.keys(nonEmptyRows[0]) : [];

  return {
    rows: nonEmptyRows,
    headers,
    sheetName,
    totalRows: nonEmptyRows.length,
  };
}
