/**
 * Script para crear el campo "marca" en la colección productos
 * y poblar los datos desde el Excel.
 *
 * Uso: node migration/add-marca-field.mjs
 *
 * Requiere:
 *  - DIRECTUS_URL (default: http://localhost:8055)
 *  - DIRECTUS_TOKEN (static admin token)
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const TOKEN = process.env.DIRECTUS_TOKEN || "migration-static-token-alcora-2026";

// Brand-SKU mapping extracted from the Excel
const brandMap = {};

// We'll read brands from the Excel using xlsx
async function loadBrandsFromExcel() {
  // Use dynamic import
  let XLSX;
  try {
    const mod = await import("xlsx");
    XLSX = mod.default || mod;
  } catch {
    console.log("xlsx not installed, using hardcoded brand map");
    return false;
  }

  const workbook = XLSX.readFile("Productos Tienda B2B Alcora 07102025.xlsx");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const brand = (row[0] || "").toString().trim();
    const sku = (row[1] || "").toString().trim();
    if (brand && sku) {
      brandMap[sku] = brand;
    }
  }
  console.log(`Loaded ${Object.keys(brandMap).length} brand mappings from Excel`);
  return true;
}

async function directus(endpoint, options = {}) {
  const url = `${DIRECTUS_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${endpoint}: ${text}`);
  }
  return res.json();
}

async function main() {
  // 1. Create the "marca" field in productos collection
  console.log("Creating 'marca' field in productos collection...");
  try {
    await directus("/fields/productos/marca");
    console.log("Field 'marca' already exists, skipping creation.");
  } catch {
    // Field doesn't exist, create it
    await directus("/fields/productos", {
      method: "POST",
      body: JSON.stringify({
        field: "marca",
        type: "string",
        schema: {
          max_length: 100,
          is_nullable: true,
        },
        meta: {
          interface: "input",
          display: "raw",
          display_options: null,
          sort: 5,
          width: "half",
          note: "Marca o fabricante del producto",
          group: null,
        },
      }),
    });
    console.log("Field 'marca' created successfully.");
  }

  // 2. Load brands from Excel
  await loadBrandsFromExcel();

  if (Object.keys(brandMap).length === 0) {
    console.log("No brand mappings found. Exiting.");
    return;
  }

  // 3. Get all products
  let page = 1;
  let allProducts = [];
  while (true) {
    const res = await directus(
      `/items/productos?fields=id,sku,marca&limit=100&offset=${(page - 1) * 100}`
    );
    if (!res.data || res.data.length === 0) break;
    allProducts = allProducts.concat(res.data);
    page++;
  }
  console.log(`Found ${allProducts.length} products in Directus`);

  // 4. Update products with brand
  let updated = 0;
  let skipped = 0;
  for (const product of allProducts) {
    const brand = brandMap[product.sku];
    if (brand && brand !== product.marca) {
      await directus(`/items/productos/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ marca: brand }),
      });
      updated++;
      if (updated % 20 === 0) console.log(`  Updated ${updated}...`);
    } else {
      skipped++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
