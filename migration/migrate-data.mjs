/**
 * Migración de datos: Local → Producción
 * Importa categorías, productos, tarifas y archivos
 */

import { readFileSync } from "fs";

const PROD_URL = "https://tienda.alcora.es";
const LOCAL_URL = "http://localhost:8056";
const LOCAL_TOKEN = "zH7zNQCUU4EEV5Nh8I-yepbGw5vqTRWw";
const DIR = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/migration";

let PROD_TOKEN = "";

async function getToken() {
  const resp = await fetch(`${PROD_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@alcora.es", password: "AlcoraAdmin2026!" })
  });
  const json = await resp.json();
  return json.data.access_token;
}

async function importCollection(name) {
  const file = JSON.parse(readFileSync(`${DIR}/${name}.json`, "utf-8"));
  const items = file.data || [];

  if (items.length === 0) {
    console.log(`  ${name}: 0 items, skipping`);
    return;
  }

  console.log(`  ${name}: importing ${items.length} items...`);

  const batchSize = 10;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const resp = await fetch(`${PROD_URL}/items/${name}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PROD_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(batch)
    });

    if (resp.ok) {
      imported += batch.length;
    } else {
      const text = await resp.text();
      // Only show first error
      if (errors === 0) {
        console.log(`    First error: ${text.substring(0, 200)}`);
      }
      errors += batch.length;
    }
  }

  console.log(`  ✅ ${name}: ${imported} imported, ${errors} errors`);
}

async function migrateFiles() {
  console.log("\n=== MIGRANDO ARCHIVOS (856 files) ===");
  console.log("  Esto puede tardar varios minutos...");

  const filesData = JSON.parse(readFileSync(`${DIR}/files.json`, "utf-8"));
  const files = filesData.data || [];

  let success = 0;
  let errors = 0;
  let skipped = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      // Download from local Directus
      const dlResp = await fetch(`${LOCAL_URL}/assets/${file.id}`, {
        headers: { Authorization: `Bearer ${LOCAL_TOKEN}` }
      });

      if (!dlResp.ok) {
        errors++;
        continue;
      }

      const blob = await dlResp.blob();

      // Upload to production with same ID
      const formData = new FormData();
      formData.append("id", file.id);
      if (file.title) formData.append("title", file.title);
      if (file.folder) formData.append("folder", file.folder);
      formData.append("file", blob, file.filename_download || "file");

      const upResp = await fetch(`${PROD_URL}/files`, {
        method: "POST",
        headers: { Authorization: `Bearer ${PROD_TOKEN}` },
        body: formData
      });

      if (upResp.ok) {
        success++;
      } else {
        const status = upResp.status;
        if (status === 400) {
          skipped++; // Probably already exists
        } else {
          errors++;
        }
      }

      if ((i + 1) % 50 === 0 || i === files.length - 1) {
        console.log(`  Progress: ${i + 1}/${files.length} (${success} ok, ${skipped} skipped, ${errors} errors)`);
      }
    } catch (err) {
      errors++;
    }
  }

  console.log(`  ✅ Files done: ${success} uploaded, ${skipped} skipped, ${errors} errors`);
}

async function main() {
  console.log("Obteniendo token de producción...");
  PROD_TOKEN = await getToken();
  console.log("✅ Token obtenido\n");

  console.log("=== IMPORTANDO DATOS ===");
  // Order: parents first, then children
  await importCollection("categorias");
  await importCollection("productos");
  await importCollection("tarifas_especiales");

  // Files migration
  await migrateFiles();

  console.log("\n🎉 Migración de datos completada!");
}

main().catch(console.error);
