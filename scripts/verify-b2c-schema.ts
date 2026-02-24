/**
 * Verify B2C Schema Changes - Tienda Alcora
 *
 * Validates that all Directus schema changes required by Phase 1 plans
 * (01-01, 01-02) have been applied correctly.
 *
 * Run: npx tsx verify-b2c-schema.ts
 *
 * Requires: Directus running at DIRECTUS_URL with DIRECTUS_ADMIN_TOKEN
 * (reads from ../frontend/.env or environment variables)
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load env from frontend/.env (where the tokens live)
config({ path: resolve(import.meta.dirname ?? __dirname, "../frontend/.env") });

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8056";
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || "";

if (!ADMIN_TOKEN) {
  console.error(
    "ERROR: DIRECTUS_ADMIN_TOKEN not found. Set it in frontend/.env or environment."
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${ADMIN_TOKEN}`,
  "Content-Type": "application/json",
};

interface CheckResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: CheckResult[] = [];

async function api(path: string): Promise<any> {
  const res = await fetch(`${DIRECTUS_URL}${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${path} -> ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Check 1: productos.segmento_venta and tipo_iva fields ───
async function checkProductosFields() {
  const name = "productos: segmento_venta & tipo_iva fields";
  try {
    const data = await api("/fields/productos");
    const fields = data.data.map((f: any) => f.field);
    const required = ["segmento_venta", "tipo_iva"];
    const missing = required.filter((f) => !fields.includes(f));

    if (missing.length === 0) {
      results.push({ name, passed: true, details: "Both fields exist" });
    } else {
      results.push({
        name,
        passed: false,
        details: `Missing: ${missing.join(", ")}`,
      });
    }
  } catch (e: any) {
    results.push({ name, passed: false, details: `API error: ${e.message}` });
  }
}

// ─── Check 2: pedidos guest fields ───
async function checkPedidosFields() {
  const name = "pedidos: guest checkout fields";
  try {
    const data = await api("/fields/pedidos");
    const fields = data.data.map((f: any) => f.field);
    const required = [
      "tipo_cliente",
      "guest_email",
      "guest_nombre",
      "guest_telefono",
      "guest_direccion",
    ];
    const missing = required.filter((f) => !fields.includes(f));

    if (missing.length === 0) {
      results.push({
        name,
        passed: true,
        details: `All 5 guest fields exist`,
      });
    } else {
      results.push({
        name,
        passed: false,
        details: `Missing: ${missing.join(", ")}`,
      });
    }
  } catch (e: any) {
    results.push({ name, passed: false, details: `API error: ${e.message}` });
  }
}

// ─── Check 3: pedidos.user_created nullable ───
async function checkUserCreatedNullable() {
  const name = "pedidos: user_created nullable";
  try {
    const data = await api("/fields/pedidos/user_created");
    const field = data.data;
    const isNullable = field?.schema?.is_nullable ?? false;

    if (isNullable) {
      results.push({ name, passed: true, details: "user_created is nullable" });
    } else {
      results.push({
        name,
        passed: false,
        details:
          "user_created is NOT nullable - must be nullable for guest checkout",
      });
    }
  } catch (e: any) {
    results.push({ name, passed: false, details: `API error: ${e.message}` });
  }
}

// ─── Check 4: articulos collection exists ───
async function checkArticulosCollection() {
  const name = "articulos: collection exists";
  try {
    const data = await api("/collections/articulos");
    if (data.data?.collection === "articulos") {
      results.push({ name, passed: true, details: "Collection exists" });
    } else {
      results.push({ name, passed: false, details: "Collection NOT FOUND" });
    }
  } catch (e: any) {
    results.push({ name, passed: false, details: `NOT FOUND: ${e.message}` });
  }
}

// ─── Check 5: articulos required fields ───
async function checkArticulosFields() {
  const name = "articulos: required fields";
  try {
    const data = await api("/fields/articulos");
    const fields = data.data.map((f: any) => f.field);
    const required = [
      "slug",
      "titulo",
      "contenido",
      "imagen_principal",
      "categoria_blog",
      "fecha_publicacion",
      "meta_description",
      "productos_relacionados",
    ];
    const missing = required.filter((f) => !fields.includes(f));

    if (missing.length === 0) {
      results.push({
        name,
        passed: true,
        details: `All ${required.length} required fields exist`,
      });
    } else {
      results.push({
        name,
        passed: false,
        details: `Missing: ${missing.join(", ")}`,
      });
    }
  } catch (e: any) {
    results.push({ name, passed: false, details: `API error: ${e.message}` });
  }
}

// ─── Check 6: segmento_venta defaults on existing products ───
async function checkSegmentoDefaults() {
  const name = "productos: all existing records have segmento_venta=b2b";
  try {
    const data = await api(
      "/items/productos?fields=id,segmento_venta&limit=5&filter[segmento_venta][_neq]=b2b"
    );
    const count = data.data?.length || 0;

    if (count === 0) {
      results.push({
        name,
        passed: true,
        details: "0 products with non-b2b segmento_venta",
      });
    } else {
      results.push({
        name,
        passed: false,
        details: `${count} products have segmento_venta != 'b2b'`,
      });
    }
  } catch (e: any) {
    // If the field doesn't exist, Directus returns 400 — that means it's missing
    results.push({ name, passed: false, details: `API error: ${e.message}` });
  }
}

// ─── Check 7: articulos public read permission ───
async function checkArticulosPublicPermission() {
  const name = "articulos: public role has read permission";
  try {
    const data = await api("/permissions?filter[collection][_eq]=articulos&filter[action][_eq]=read");
    const permissions = data.data || [];
    // Public role permissions have role = null
    const publicPerm = permissions.find(
      (p: any) => p.role === null || p.role === ""
    );

    if (publicPerm) {
      results.push({
        name,
        passed: true,
        details: "Public role can read articulos",
      });
    } else {
      results.push({
        name,
        passed: false,
        details:
          "No public read permission found for articulos. Add in Settings > Access Control > Public.",
      });
    }
  } catch (e: any) {
    results.push({ name, passed: false, details: `API error: ${e.message}` });
  }
}

// ─── Run all checks ───
async function main() {
  console.log("=== B2C Schema Verification ===");
  console.log(`Directus URL: ${DIRECTUS_URL}`);
  console.log("");

  // Check connectivity first
  try {
    await fetch(`${DIRECTUS_URL}/server/health`, {
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    console.error(
      `ERROR: Cannot reach Directus at ${DIRECTUS_URL}`
    );
    console.error(
      "Make sure Docker is running: docker compose up -d"
    );
    process.exit(1);
  }

  await checkProductosFields();
  await checkPedidosFields();
  await checkUserCreatedNullable();
  await checkArticulosCollection();
  await checkArticulosFields();
  await checkSegmentoDefaults();
  await checkArticulosPublicPermission();

  console.log("Results:");
  console.log("─".repeat(60));

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${r.name}`);
    console.log(`         ${r.details}`);
    if (!r.passed) allPassed = false;
  }

  console.log("─".repeat(60));

  if (allPassed) {
    console.log("");
    console.log("ALL CHECKS PASSED - Schema matches TypeScript expectations");
    process.exit(0);
  } else {
    console.log("");
    console.log("SOME CHECKS FAILED - Review and fix in Directus admin UI");
    process.exit(1);
  }
}

main();
