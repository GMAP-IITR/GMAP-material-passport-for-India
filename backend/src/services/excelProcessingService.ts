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

export function parseExcelFile(filePath: string): ExcelParseResult {
  console.log('USING STANDARD EXCEL PARSER');
  console.log(`[parseExcelFile] file: ${filePath}`);

  const absolutePath = path.resolve(filePath);

  const workbook = XLSX.readFile(absolutePath, {
    cellDates: true,
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
    defval: null,
    blankrows: false,
    raw: true,
  });

  const nonEmptyRows = rawRows.filter((row) =>
    Object.values(row).some((v) => v !== null && v !== undefined && v !== ''),
  );

  const headers = nonEmptyRows.length > 0 ? Object.keys(nonEmptyRows[0]) : [];

  console.log(`[parseExcelFile] sheet: "${sheetName}" | headers (${headers.length}):`, headers);
  console.log(`[parseExcelFile] totalRows: ${nonEmptyRows.length} | first row:`, nonEmptyRows[0] ?? '(none)');

  return {
    rows: nonEmptyRows,
    headers,
    sheetName,
    totalRows: nonEmptyRows.length,
  };
}
