import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const filePath = String.raw`C:\Users\Piensaenweb\Documents\Claude\alcora\web26\Productos Tienda B2B Alcora 07102025.xlsx`;
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
const headers = rawData[0];
const rows = rawData.slice(1).filter(r => r.some(cell => cell !== undefined && cell !== null && cell !== ''));

const SEP = '='.repeat(80);
const DASH = '-'.repeat(60);

console.log('\n' + SEP);
console.log('EXCEL ANALYSIS: Productos Tienda B2B Alcora');
console.log(SEP);
console.log(`Total data rows (excluding header): ${rows.length}`);

const colIdx = {};
headers.forEach((h, i) => { if (h) colIdx[h] = i; });
const getVal = (row, name) => row[colIdx[name]];
const getColA = (row) => row[0];

// 1. CARPETA PRINCIPAL
console.log('\n' + SEP);
console.log('1. CARPETA PRINCIPAL - All unique values with product count');
console.log(SEP);
const carpetaMap = {};
rows.forEach(r => {
  const val = getVal(r, 'CARPETA PRINCIPAL') || '(vacio)';
  carpetaMap[val] = (carpetaMap[val] || 0) + 1;
});
const carpetaSorted = Object.entries(carpetaMap).sort((a, b) => b[1] - a[1]);
let carpetaTotal = 0;
carpetaSorted.forEach(([name, count]) => {
  console.log(`  ${name.padEnd(50)} ${String(count).padStart(5)} products`);
  carpetaTotal += count;
});
console.log(`  ${DASH}`);
console.log(`  ${'TOTAL'.padEnd(50)} ${String(carpetaTotal).padStart(5)} products`);
console.log(`  Unique CARPETA PRINCIPAL values: ${carpetaSorted.length}`);

// 2. SUBCARPETA
console.log('\n' + SEP);
console.log('2. SUBCARPETA - unique values grouped by CARPETA PRINCIPAL');
console.log(SEP);
const subMap = {};
rows.forEach(r => {
  const cp = getVal(r, 'CARPETA PRINCIPAL') || '(vacio)';
  const sub = getVal(r, 'SUBCARPETA') || '(vacio)';
  const key = cp + '|||' + sub;
  subMap[key] = (subMap[key] || 0) + 1;
});
const subSorted = Object.entries(subMap).sort((a, b) => {
  const ca = a[0].split('|||')[0];
  const cb = b[0].split('|||')[0];
  if (ca !== cb) return ca.localeCompare(cb);
  return b[1] - a[1];
});
let curCp = '';
let subCount = 0;
subSorted.forEach(([key, count]) => {
  const parts = key.split('|||');
  const cp = parts[0];
  const sub = parts[1];
  if (cp !== curCp) {
    if (curCp) console.log('');
    console.log(`  [${cp}]`);
    curCp = cp;
  }
  console.log(`    ${sub.padEnd(50)} ${String(count).padStart(5)} products`);
  subCount++;
});
console.log(`\n  Unique SUBCARPETA combos: ${subCount}`);

// 3. Column A (brand/supplier)
console.log('\n' + SEP);
console.log('3. Column A (Brand/Supplier) - unique values with count');
console.log(SEP);
const brandMap = {};
rows.forEach(r => {
  const val = getColA(r) || '(vacio)';
  brandMap[val] = (brandMap[val] || 0) + 1;
});
const brandSorted = Object.entries(brandMap).sort((a, b) => b[1] - a[1]);
brandSorted.forEach(([name, count]) => {
  console.log(`  ${String(name).padEnd(40)} ${String(count).padStart(5)} products`);
});
console.log(`  ${DASH}`);
console.log(`  Unique brands/suppliers: ${brandSorted.length}`);

// 4. Sample rows with role-based pricing
console.log('\n' + SEP);
console.log('4. Sample rows WITH role-based pricing (precio normal vs role prices)');
console.log(SEP);
const roleCols = [
  'Meta: product_role_based_price_distribuidor',
  'Meta: product_role_based_price_empresa',
  'Meta: product_role_based_price_hospital',
  'Meta: product_role_based_price_horeca'
];
const hasRole = rows.filter(r => roleCols.some(col => {
  const v = getVal(r, col);
  return v !== undefined && v !== null && v !== '';
}));
console.log(`\n  Total rows with ANY role pricing: ${hasRole.length} / ${rows.length}`);
roleCols.forEach(col => {
  const cnt = rows.filter(r => {
    const v = getVal(r, col);
    return v !== undefined && v !== null && v !== '';
  }).length;
  const sn = col.replace('Meta: product_role_based_price_', '');
  console.log(`    - ${sn.padEnd(20)} ${cnt} rows have a value`);
});
console.log('\n  Sample 3 rows:');
hasRole.slice(0, 3).forEach((r, idx) => {
  console.log(`\n  --- Row ${idx + 1} ---`);
  console.log(`  SKU:            ${getVal(r, 'SKU')}`);
  console.log(`  Nombre:         ${getVal(r, 'Nombre')}`);
  console.log(`  Precio normal:  ${getVal(r, 'Precio normal')}`);
  roleCols.forEach(col => {
    const sn = col.replace('Meta: product_role_based_price_', '');
    const v = getVal(r, col);
    console.log(`  ${sn.padEnd(16)}  ${v !== undefined && v !== null ? v : '(vacio)'}`);
  });
});

// 5. Image URLs, ficha_tecnica, ficha_seguridad
console.log('\n' + SEP);
console.log('5. Image URLs, ficha_tecnica, ficha_seguridad');
console.log(SEP);
const cntNE = (cn) => rows.filter(r => {
  const v = getVal(r, cn);
  return v !== undefined && v !== null && v !== '';
}).length;
const ic = cntNE('Im\u00e1genes');
const ft = cntNE('Meta: ficha_tecnica');
const fs2 = cntNE('Meta: ficha_seguridad');
console.log(`  Products with image URLs:      ${ic} / ${rows.length} (${(ic/rows.length*100).toFixed(1)}%)`);
console.log(`  Products with ficha_tecnica:   ${ft} / ${rows.length} (${(ft/rows.length*100).toFixed(1)}%)`);
console.log(`  Products with ficha_seguridad: ${fs2} / ${rows.length} (${(fs2/rows.length*100).toFixed(1)}%)`);
const si = rows.find(r => {
  const v = getVal(r, 'Im\u00e1genes');
  return v !== undefined && v !== null && v !== '';
});
if (si) {
  const iv = String(getVal(si, 'Im\u00e1genes'));
  console.log(`\n  Sample image URL: ${iv.substring(0, 120)}${iv.length > 120 ? '...' : ''}`);
}

// 6. Tipo column
console.log('\n' + SEP);
console.log('6. Tipo column - values other than "simple"?');
console.log(SEP);
const tipoMap = {};
rows.forEach(r => {
  const v = getVal(r, 'Tipo') || '(vacio)';
  tipoMap[v] = (tipoMap[v] || 0) + 1;
});
Object.entries(tipoMap).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
  const marker = name !== 'simple' ? ' <--- NOT simple' : '';
  console.log(`  ${String(name).padEnd(30)} ${String(count).padStart(5)} rows${marker}`);
});
const ns = rows.filter(r => {
  const v = getVal(r, 'Tipo');
  return v && v !== 'simple';
});
if (ns.length > 0) {
  console.log(`\n  YES - ${ns.length} rows have Tipo != "simple". Sample:`);
  ns.slice(0, 5).forEach(r => {
    console.log(`    SKU: ${getVal(r, 'SKU')}, Tipo: ${getVal(r, 'Tipo')}, Nombre: ${getVal(r, 'Nombre')}`);
  });
} else {
  console.log(`\n  NO - All ${rows.length} rows have Tipo = "simple".`);
}

console.log('\n' + SEP);
console.log('END OF ANALYSIS');
console.log(SEP + '\n');
