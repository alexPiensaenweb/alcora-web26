/**
 * Migración de schema: PostgreSQL local → MySQL producción
 * Usa la API de Directus schema diff/apply con vendor corregido
 */

const PROD_URL = "https://tienda.alcora.es";
const LOCAL_URL = "http://localhost:8056";
const LOCAL_TOKEN = "zH7zNQCUU4EEV5Nh8I-yepbGw5vqTRWw";

async function getToken() {
  const resp = await fetch(`${PROD_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@alcora.es", password: "AlcoraAdmin2026!" })
  });
  const json = await resp.json();
  return json.data.access_token;
}

async function main() {
  console.log("1. Obteniendo token de producción...");
  const token = await getToken();
  console.log("   ✅ Token obtenido");

  // Get snapshot from local (source of truth)
  console.log("2. Obteniendo schema de local...");
  const snapResp = await fetch(`${LOCAL_URL}/schema/snapshot`, {
    headers: { Authorization: `Bearer ${LOCAL_TOKEN}` }
  });
  const snapshot = await snapResp.json();

  // Change vendor from postgres to mysql for compatibility
  snapshot.data.vendor = "mysql";

  // Fix postgres-specific default values
  for (const field of snapshot.data.fields) {
    if (field.schema) {
      // Remove postgres sequence defaults like nextval('xxx_id_seq'::regclass)
      if (field.schema.default_value && typeof field.schema.default_value === "string"
          && field.schema.default_value.includes("nextval(")) {
        field.schema.default_value = null;
        field.schema.has_auto_increment = true;
      }
      // Fix postgres data types to MySQL equivalents
      if (field.schema.data_type === "character varying") {
        field.schema.data_type = "varchar";
      }
      if (field.schema.data_type === "timestamp with time zone") {
        field.schema.data_type = "timestamp";
      }
      if (field.schema.data_type === "numeric") {
        field.schema.data_type = "decimal";
      }
    }
  }

  // Remove fields not accepted by production Directus
  delete snapshot.data.systemFields;

  console.log(`   Schema: ${snapshot.data.collections.length} collections, ${snapshot.data.fields.length} fields, ${snapshot.data.relations.length} relations`);

  // Get diff
  console.log("3. Calculando diff contra producción...");
  const diffResp = await fetch(`${PROD_URL}/schema/diff?force=true`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(snapshot.data)
  });

  if (diffResp.status === 204) {
    console.log("   ✅ Schema ya está al día, no hay cambios");
    return;
  }

  if (!diffResp.ok) {
    const text = await diffResp.text();
    console.error("   ❌ Error calculando diff:", diffResp.status, text);
    return;
  }

  const diff = await diffResp.json();
  console.log("   ✅ Diff calculado");

  // Apply diff
  console.log("4. Aplicando schema...");
  const applyResp = await fetch(`${PROD_URL}/schema/apply`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(diff.data)
  });

  if (applyResp.ok || applyResp.status === 204) {
    console.log("   ✅ Schema aplicado correctamente!");
  } else {
    const text = await applyResp.text();
    console.error("   ❌ Error aplicando schema:", applyResp.status, text);
  }
}

main().catch(console.error);
