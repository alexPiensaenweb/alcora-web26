/**
 * Fix: Import categorias y productos en orden correcto
 * - Categorias: primero las raíz (parent=null), luego las hijas
 * - Productos: uno a uno para evitar batch errors
 */

import { readFileSync } from "fs";

const PROD_URL = "https://tienda.alcora.es";
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

// Use static admin token instead of JWT to avoid expiration
// First we need to create one via the API
let ADMIN_TOKEN = "";

async function ensureStaticToken() {
  if (ADMIN_TOKEN) return;
  // Generate a static token for the admin user
  const token = await getToken();
  // Get current user info
  const meResp = await fetch(`${PROD_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const me = await meResp.json();
  const userId = me.data.id;

  // Set a static token
  ADMIN_TOKEN = "migration-static-token-alcora-2026";
  const updateResp = await fetch(`${PROD_URL}/users/${userId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token: ADMIN_TOKEN })
  });
  if (updateResp.ok) {
    console.log("✅ Static token configurado");
    PROD_TOKEN = ADMIN_TOKEN;
  } else {
    console.log("⚠️  No se pudo configurar static token, usando JWT");
    PROD_TOKEN = token;
  }
}

async function postItem(collection, item) {
  const resp = await fetch(`${PROD_URL}/items/${collection}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PROD_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(item)
  });

  // If 403, refresh token and retry
  if (resp.status === 403) {
    const newToken = await getToken();
    PROD_TOKEN = newToken;
    return fetch(`${PROD_URL}/items/${collection}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PROD_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(item)
    });
  }

  return resp;
}

async function importCategorias() {
  console.log("\n=== IMPORTANDO CATEGORIAS ===");
  const file = JSON.parse(readFileSync(`${DIR}/categorias.json`, "utf-8"));
  const items = file.data || [];

  // Remove alias/relational fields that cause 403 issues
  const cleanItems = items.map(c => {
    const clean = { ...c };
    delete clean.subcategorias; // O2M alias
    delete clean.productos;     // O2M alias if present
    return clean;
  });

  // First: categories without parent (root)
  const roots = cleanItems.filter(c => c.parent === null || c.parent === undefined);
  const children = cleanItems.filter(c => c.parent !== null && c.parent !== undefined);

  console.log(`  Raiz: ${roots.length}, Hijas: ${children.length}`);

  let imported = 0;
  let errors = 0;

  // Import roots first
  for (const cat of roots) {
    const resp = await postItem("categorias", cat);
    if (resp.ok) {
      imported++;
    } else {
      const text = await resp.text();
      if (errors < 3) console.log(`    Error (${cat.nombre}): ${text.substring(0, 150)}`);
      errors++;
    }
  }
  console.log(`  Raiz: ${imported} imported, ${errors} errors`);

  // Import children
  let childImported = 0;
  let childErrors = 0;
  for (const cat of children) {
    const resp = await postItem("categorias", cat);
    if (resp.ok) {
      childImported++;
    } else {
      const text = await resp.text();
      if (childErrors < 3) console.log(`    Error (${cat.nombre}): ${text.substring(0, 150)}`);
      childErrors++;
    }
  }
  console.log(`  Hijas: ${childImported} imported, ${childErrors} errors`);
  console.log(`  ✅ Total categorias: ${imported + childImported}/${items.length}`);
}

async function importProductos() {
  console.log("\n=== IMPORTANDO PRODUCTOS ===");
  const file = JSON.parse(readFileSync(`${DIR}/productos.json`, "utf-8"));
  const items = file.data || [];

  let imported = 0;
  let errors = 0;

  for (let i = 0; i < items.length; i++) {
    const prod = items[i];

    // Remove fields that might cause FK issues if file doesn't exist yet
    const cleanProd = { ...prod };
    // Keep imagen_principal, ficha_tecnica, ficha_seguridad as they should exist from file migration

    const resp = await postItem("productos", cleanProd);
    if (resp.ok) {
      imported++;
    } else {
      const text = await resp.text();
      if (errors < 5) console.log(`    Error (${prod.nombre?.substring(0, 40)}): ${text.substring(0, 150)}`);
      errors++;
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${items.length} (${imported} ok, ${errors} errors)`);
    }
  }

  console.log(`  ✅ Productos: ${imported}/${items.length} imported, ${errors} errors`);
}

async function main() {
  console.log("Configurando autenticación...");
  await ensureStaticToken();

  await importCategorias();
  await importProductos();

  console.log("\n🎉 Migración de datos completada!");
}

main().catch(console.error);
