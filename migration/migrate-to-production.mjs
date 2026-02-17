/**
 * Script de migración: Local → Producción
 *
 * Ejecutar desde local: node migration/migrate-to-production.mjs
 *
 * IMPORTANTE: Primero necesitas un admin token de producción.
 * Genera uno en el servidor:
 *   curl -s -X POST http://127.0.0.1:8055/auth/login \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"admin@alcora.es","password":"AlcoraAdmin2026!"}'
 */

import { readFileSync } from "fs";

// === CONFIGURACIÓN ===
const PROD_URL = "https://tienda.alcora.es";
// Token se obtiene dinámicamente
let PROD_TOKEN = process.env.PROD_TOKEN || "";
const DIR = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/migration";
const LOCAL_URL = "http://localhost:8056";
const LOCAL_TOKEN = "zH7zNQCUU4EEV5Nh8I-yepbGw5vqTRWw";

async function applySchema() {
  console.log("\n=== 1. APLICANDO SCHEMA ===");

  // Get schema snapshot from local
  const snapshot = JSON.parse(
    readFileSync(`${DIR}/../directus/snapshots/schema-production.json`, "utf-8")
  );

  // Get diff from production
  console.log("Calculando diff...");
  const diffResp = await fetch(`${PROD_URL}/schema/diff`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PROD_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(snapshot),
  });

  if (diffResp.status === 204) {
    console.log("Schema ya está actualizado, no hay cambios.");
    return;
  }

  if (!diffResp.ok) {
    const text = await diffResp.text();
    console.error("Error getting diff:", diffResp.status, text);
    return;
  }

  const diff = await diffResp.json();
  console.log("Aplicando cambios...");

  const applyResp = await fetch(`${PROD_URL}/schema/apply`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PROD_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(diff.data),
  });

  if (applyResp.ok || applyResp.status === 204) {
    console.log("✅ Schema aplicado correctamente");
  } else {
    const text = await applyResp.text();
    console.error("Error applying schema:", applyResp.status, text);
  }
}

async function importCollection(name) {
  const file = JSON.parse(readFileSync(`${DIR}/${name}.json`, "utf-8"));
  const items = file.data || [];

  if (items.length === 0) {
    console.log(`  ${name}: 0 items, skipping`);
    return;
  }

  console.log(`  ${name}: importing ${items.length} items...`);

  // Import in batches of 25
  const batchSize = 25;
  let imported = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const resp = await fetch(`${PROD_URL}/items/${name}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PROD_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });

    if (resp.ok) {
      imported += batch.length;
    } else {
      const text = await resp.text();
      console.error(`    Error batch ${i}: ${resp.status} - ${text.substring(0, 200)}`);
    }
  }

  console.log(`  ✅ ${name}: ${imported}/${items.length} imported`);
}

async function importData() {
  console.log("\n=== 2. IMPORTANDO DATOS ===");

  // Order matters! Parent collections first
  await importCollection("categorias");
  await importCollection("productos");
  await importCollection("tarifas_especiales");
}

async function migrateFiles() {
  console.log("\n=== 3. MIGRANDO ARCHIVOS ===");

  const filesData = JSON.parse(readFileSync(`${DIR}/files.json`, "utf-8"));
  const files = filesData.data || [];

  console.log(`  Total files to migrate: ${files.length}`);
  console.log("  Downloading from local and uploading to production...");

  let success = 0;
  let errors = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      // Download from local
      const downloadResp = await fetch(`${LOCAL_URL}/assets/${file.id}`, {
        headers: { Authorization: `Bearer ${LOCAL_TOKEN}` }
      });

      if (!downloadResp.ok) {
        errors++;
        continue;
      }

      const blob = await downloadResp.blob();

      // Upload to production with same ID
      const formData = new FormData();
      formData.append("id", file.id);
      formData.append("title", file.title || "");
      formData.append("folder", file.folder || "");
      formData.append("file", blob, file.filename_download || "file");

      const uploadResp = await fetch(`${PROD_URL}/files`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PROD_TOKEN}`,
        },
        body: formData,
      });

      if (uploadResp.ok) {
        success++;
      } else {
        errors++;
      }

      // Progress every 50 files
      if ((i + 1) % 50 === 0) {
        console.log(`  Progress: ${i + 1}/${files.length} (${success} ok, ${errors} errors)`);
      }
    } catch (err) {
      errors++;
    }
  }

  console.log(`  ✅ Files: ${success} uploaded, ${errors} errors`);
}

async function main() {
  // Get token automatically
  if (!PROD_TOKEN) {
    console.log("Obteniendo token de producción...");
    const loginResp = await fetch(`${PROD_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@alcora.es", password: "AlcoraAdmin2026!" })
    });
    const loginData = await loginResp.json();
    PROD_TOKEN = loginData.data.access_token;
    console.log("✅ Token obtenido");
  }

  await applySchema();
  await importData();
  await migrateFiles();

  console.log("\n🎉 Migración completada!");
}

main().catch(console.error);
