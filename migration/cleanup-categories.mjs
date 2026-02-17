/**
 * Limpieza de categorías duplicadas y vacías.
 *
 * Archiva (status=archived) las categorías antiguas vacías:
 * - Control de Plagas (id:1) → duplicada con CONTROL DE PLAGAS (id:17)
 * - Insecticidas (id:5) → duplicada con INSECTICIDA (id:18), 0 productos
 * - Raticidas (id:6) → 0 productos
 * - Limpieza Profesional (id:2) → 0 productos, no está en Excel
 * - Desinfectantes (id:3) → 0 productos, no está en Excel
 *
 * También mueve el producto de AGUA directa (1 producto) a la subcategoría
 * correcta si corresponde, y crea subcategoría COSMÉTICA > COSMÉTICA si falta.
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || "https://tienda.alcora.es";
const TOKEN = process.env.DIRECTUS_TOKEN || "migration-static-token-alcora-2026";

async function directus(endpoint, options = {}) {
  const res = await fetch(`${DIRECTUS_URL}${endpoint}`, {
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
  // Archive empty/duplicate categories
  const toArchive = [1, 2, 3, 5, 6];

  for (const id of toArchive) {
    try {
      await directus(`/items/categorias/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "archived" }),
      });
      console.log(`Archived category id:${id}`);
    } catch (err) {
      console.error(`Failed to archive id:${id}: ${err.message}`);
    }
  }

  // Check if AGUA (id:27) has a product directly assigned
  const aguaProducts = await directus(`/items/productos?filter[categoria][_eq]=27&fields=id,nombre,sku&limit=5`);
  if (aguaProducts.data?.length > 0) {
    console.log(`\nAGUA (id:27) has ${aguaProducts.data.length} product(s) directly assigned:`);
    for (const p of aguaProducts.data) {
      console.log(`  - ${p.sku}: ${p.nombre}`);
    }
    // Check in Excel what subcategory this should be
    const mod = await import("xlsx");
    const XLSX = mod.default || mod;
    const workbook = XLSX.readFile("Productos Tienda B2B Alcora 07102025.xlsx");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    for (const p of aguaProducts.data) {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if ((row[1] || "").toString().trim() === p.sku) {
          const sub = (row[5] || "").toString().trim();
          console.log(`    Excel says subcategory: "${sub}"`);

          // Find matching subcategory in Directus
          if (sub) {
            const catRes = await directus(`/items/categorias?filter[parent][_eq]=27&limit=-1&fields=id,nombre`);
            const matchCat = catRes.data.find(c => c.nombre.toUpperCase().trim() === sub.toUpperCase().trim());
            if (matchCat) {
              await directus(`/items/productos/${p.id}`, {
                method: "PATCH",
                body: JSON.stringify({ categoria: matchCat.id }),
              });
              console.log(`    → Moved to subcategory: ${matchCat.nombre} (id:${matchCat.id})`);
            } else {
              console.log(`    → Subcategory "${sub}" not found under AGUA`);
            }
          }
        }
      }
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
