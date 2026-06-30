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

// ─── ORIGINAL IMPLEMENTATION (BOQ Excel / standard first-row headers) ─────────
// Restore this block and delete the TEMP block below when debugging is done.
//
// export function parseExcelFile(filePath: string): ExcelParseResult {
//   console.log('USING STANDARD EXCEL PARSER');
//   console.log(`[parseExcelFile] file: ${filePath}`);
//
//   const absolutePath = path.resolve(filePath);
//
//   const workbook = XLSX.readFile(absolutePath, {
//     cellDates: true,   // parse Excel date serials → JS Date
//     cellNF: false,
//     cellText: false,
//   });
//
//   const sheetName = workbook.SheetNames[0];
//   if (!sheetName) {
//     throw new Error('Excel file contains no worksheets.');
//   }
//
//   const worksheet = workbook.Sheets[sheetName];
//   if (!worksheet) {
//     throw new Error(`Worksheet "${sheetName}" could not be read.`);
//   }
//
//   const rawRows = XLSX.utils.sheet_to_json<RawExcelRow>(worksheet, {
//     defval: null,      // include empty cells as null (not omitted)
//     blankrows: false,
//     raw: true,         // keep native JS types (numbers as numbers, etc.)
//   });
//
//   // Drop rows where every cell is null / undefined / empty string
//   const nonEmptyRows = rawRows.filter((row) =>
//     Object.values(row).some((v) => v !== null && v !== undefined && v !== ''),
//   );
//
//   const headers = nonEmptyRows.length > 0 ? Object.keys(nonEmptyRows[0]) : [];
//
//   console.log(`[parseExcelFile] sheet: "${sheetName}" | headers (${headers.length}):`, headers);
//   console.log(`[parseExcelFile] totalRows: ${nonEmptyRows.length} | first row:`, nonEmptyRows[0] ?? '(none)');
//
//   return {
//     rows: nonEmptyRows,
//     headers,
//     sheetName,
//     totalRows: nonEmptyRows.length,
//   };
// }

// ─── TEMP: IFC HEADER MODE (debug only — row 2 = headers, row 3+ = data) ─────
// Remove this block and uncomment the ORIGINAL block above when debugging is done.

export function parseExcelFile(filePath: string): ExcelParseResult {
  console.log('TEMP IFC HEADER MODE ENABLED');
  console.log(`[parseExcelFile] file: ${filePath}`);
  console.log('Header row index:', 2);

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

  // Read the entire sheet as a 2-D array so we can pick the header row by index.
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: null,
    blankrows: false,
    raw: true,          // preserve numbers as numbers, dates as dates
  });

  // Row index 2 (3rd row in Excel) holds the actual column headers.
  const headerRow = allRows[2] ?? [];
  const headerByIndex: (string | null)[] = headerRow.map((cell) => {
    if (cell === null || cell === undefined) return null;
    const s = String(cell).trim();
    return s.length > 0 ? s : null;
  });

  const headers = headerByIndex.filter((h): h is string => h !== null);

  // Rows from index 3 onwards are data rows.
  const dataArrayRows = allRows.slice(3);

  const rows: RawExcelRow[] = [];

  for (const arrayRow of dataArrayRows) {
    const obj: RawExcelRow = {};
    let hasValue = false;

    for (let i = 0; i < headerByIndex.length; i++) {
      const header = headerByIndex[i];
      if (header === null) continue;             // skip columns with no header

      const value = (arrayRow as unknown[])[i] ?? null;
      obj[header] = value;
      if (value !== null && value !== undefined && value !== '') hasValue = true;
    }

    if (hasValue) rows.push(obj);
  }

  console.log('Headers:', headers);
  console.log('First parsed row:', rows[0] ?? '(none)');

  return {
    rows,
    headers,
    sheetName,
    totalRows: rows.length,
  };
}
