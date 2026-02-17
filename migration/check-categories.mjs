/**
 * Script para verificar asignación de categorías comparando
 * el Excel con lo que hay en Directus.
 *
 * Uso: node migration/check-categories.mjs
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || "https://tienda.alcora.es";
const TOKEN = process.env.DIRECTUS_TOKEN || "migration-static-token-alcora-2026";

async function directus(endpoint) {
  const res = await fetch(`${DIRECTUS_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${endpoint}`);
  return res.json();
}

async function main() {
  // Load Excel
  const mod = await import("xlsx");
  const XLSX = mod.default || mod;
  const workbook = XLSX.readFile("Productos Tienda B2B Alcora 07102025.xlsx");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Build Excel mapping: SKU → { carpetaPrincipal, subcarpeta }
  const excelMap = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const sku = (row[1] || "").toString().trim();
    const carpetaPrincipal = (row[4] || "").toString().trim();
    const subcarpeta = (row[5] || "").toString().trim();
    if (sku) {
      excelMap[sku] = { carpetaPrincipal, subcarpeta };
    }
  }

  // Load categories from Directus
  const catRes = await directus("/items/categorias?fields=id,nombre,slug,parent&limit=-1");
  const cats = catRes.data;
  const catById = {};
  cats.forEach(c => { catById[c.id] = c; });

  // Load products from Directus
  let allProducts = [];
  let page = 1;
  while (true) {
    const res = await directus(`/items/productos?fields=id,sku,nombre,categoria&limit=100&offset=${(page-1)*100}`);
    if (!res.data || res.data.length === 0) break;
    allProducts = allProducts.concat(res.data);
    page++;
  }

  // Compare
  let mismatches = [];
  let matched = 0;
  let notInExcel = 0;

  for (const prod of allProducts) {
    const excelData = excelMap[prod.sku];
    if (!excelData) {
      notInExcel++;
      continue;
    }

    const catId = typeof prod.categoria === "object" ? prod.categoria?.id : prod.categoria;
    const cat = catId ? catById[catId] : null;

    if (!cat) {
      mismatches.push({
        sku: prod.sku,
        nombre: prod.nombre,
        directusCat: "NONE",
        excelCat: `${excelData.carpetaPrincipal} > ${excelData.subcarpeta}`,
      });
      continue;
    }

    // Get parent category
    const parentId = typeof cat.parent === "object" ? cat.parent?.id : cat.parent;
    const parentCat = parentId ? catById[parentId] : null;

    // Expected: subcarpeta should match cat name, carpetaPrincipal should match parent
    const catName = cat.nombre.toUpperCase().trim();
    const parentName = parentCat ? parentCat.nombre.toUpperCase().trim() : "";

    const excelSub = excelData.subcarpeta.toUpperCase().trim();
    const excelMain = excelData.carpetaPrincipal.toUpperCase().trim();

    let isMatch = false;

    if (excelSub) {
      // Product should be in subcategory
      if (catName === excelSub && parentName === excelMain) {
        isMatch = true;
      } else if (catName === excelSub) {
        // Subcategory matches but parent might differ
        isMatch = true;
      }
    } else {
      // Product is in main category (no subcategory)
      if (catName === excelMain) {
        isMatch = true;
      } else if (parentName === excelMain) {
        // Might be in a subcategory when Excel says main
        isMatch = false;
      }
    }

    if (isMatch) {
      matched++;
    } else {
      mismatches.push({
        sku: prod.sku,
        nombre: prod.nombre,
        directusCat: parentCat ? `${parentCat.nombre} > ${cat.nombre}` : cat.nombre,
        excelCat: excelSub ? `${excelData.carpetaPrincipal} > ${excelData.subcarpeta}` : excelData.carpetaPrincipal,
      });
    }
  }

  console.log(`\n=== Category Assignment Report ===`);
  console.log(`Total products: ${allProducts.length}`);
  console.log(`Matched: ${matched}`);
  console.log(`Mismatches: ${mismatches.length}`);
  console.log(`Not in Excel: ${notInExcel}`);

  if (mismatches.length > 0) {
    console.log(`\n--- Mismatches ---`);
    for (const m of mismatches) {
      console.log(`  SKU: ${m.sku}`);
      console.log(`    Name: ${m.nombre}`);
      console.log(`    Directus: ${m.directusCat}`);
      console.log(`    Excel:    ${m.excelCat}`);
      console.log();
    }
  }

  // Check for duplicate categories
  console.log(`\n=== Duplicate Category Names ===`);
  const nameMap = {};
  for (const cat of cats) {
    const norm = cat.nombre.toUpperCase().trim();
    if (!nameMap[norm]) nameMap[norm] = [];
    nameMap[norm].push(cat);
  }
  for (const [name, entries] of Object.entries(nameMap)) {
    if (entries.length > 1) {
      console.log(`  "${name}" appears ${entries.length} times:`);
      for (const e of entries) {
        const parent = e.parent ? catById[e.parent]?.nombre || `id:${e.parent}` : "ROOT";
        console.log(`    - id:${e.id}, slug:${e.slug}, parent:${parent}`);
      }
    }
  }

  // List categories with product counts
  console.log(`\n=== Categories with Product Counts ===`);
  const catCounts = {};
  for (const prod of allProducts) {
    const catId = typeof prod.categoria === "object" ? prod.categoria?.id : prod.categoria;
    if (catId) {
      catCounts[catId] = (catCounts[catId] || 0) + 1;
    }
  }

  // Group by parent
  const rootCats = cats.filter(c => !c.parent);
  for (const root of rootCats.sort((a,b) => a.nombre.localeCompare(b.nombre))) {
    const count = catCounts[root.id] || 0;
    const children = cats.filter(c => {
      const pid = typeof c.parent === "object" ? c.parent?.id : c.parent;
      return pid === root.id;
    });
    const totalInTree = count + children.reduce((sum, ch) => sum + (catCounts[ch.id] || 0), 0);

    if (totalInTree > 0 || children.length > 0) {
      console.log(`\n  ${root.nombre} (id:${root.id}, slug:${root.slug}) - ${count} products directly`);
      for (const child of children.sort((a,b) => a.nombre.localeCompare(b.nombre))) {
        const childCount = catCounts[child.id] || 0;
        console.log(`    └─ ${child.nombre} (id:${child.id}) - ${childCount} products`);
      }
    }
  }
}

main().catch(console.error);
