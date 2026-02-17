import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, 'node_modules') + '/');
const XLSX = require('xlsx');

const filePath = resolve(__dirname, '..', 'Productos Tienda B2B Alcora 07102025.xlsx');
const workbook = XLSX.readFile(filePath);

// 1. All sheet names
console.log('='.repeat(80));
console.log('1. SHEET NAMES');
console.log('='.repeat(80));
workbook.SheetNames.forEach((name, i) => {
  console.log(`  [${i}] ${name}`);
});

// 2. Column headers (first row) of each sheet
console.log('\n' + '='.repeat(80));
console.log('2. COLUMN HEADERS (first row) PER SHEET');
console.log('='.repeat(80));
for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const headers = rows[0] || [];
  console.log(`\n--- Sheet: "${sheetName}" (${headers.length} columns) ---`);
  headers.forEach((h, i) => {
    console.log(`  [${String.fromCharCode(65 + (i < 26 ? i : -1))}${i >= 26 ? ' col' + i : ''}] ${h}`);
  });
}

// 3. First 5 data rows from the MAIN sheet (first sheet)
console.log('\n' + '='.repeat(80));
console.log('3. FIRST 5 DATA ROWS (from main sheet: "' + workbook.SheetNames[0] + '")');
console.log('='.repeat(80));
{
  const mainSheet = workbook.Sheets[workbook.SheetNames[0]];
  const allRows = XLSX.utils.sheet_to_json(mainSheet);
  const sample = allRows.slice(0, 5);
  sample.forEach((row, i) => {
    console.log(`\n--- Row ${i + 1} ---`);
    for (const [key, value] of Object.entries(row)) {
      const display = String(value).length > 120 ? String(value).substring(0, 120) + '...' : value;
      console.log(`  ${key}: ${display}`);
    }
  });
}

// 4. Total row count per sheet
console.log('\n' + '='.repeat(80));
console.log('4. TOTAL ROW COUNT PER SHEET (excluding header)');
console.log('='.repeat(80));
for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const dataRows = XLSX.utils.sheet_to_json(sheet);
  console.log(`  "${sheetName}": ${dataRows.length} data rows`);
}
