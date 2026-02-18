/**
 * Crea campos adicionales en directus_users para el registro B2B completo:
 * - direccion_envio (ya existe)
 * - cargo (puesto en la empresa)
 * - tipo_negocio (tipo de empresa/actividad)
 * - ciudad, provincia, codigo_postal, pais (campos de direccion desglosados)
 *
 * Uso: node migration/add-user-fields.mjs
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

async function createFieldIfNotExists(collection, field, config) {
  try {
    await directus(`/fields/${collection}/${field}`);
    console.log(`  Field '${field}' already exists, skipping`);
  } catch {
    await directus(`/fields/${collection}`, {
      method: "POST",
      body: JSON.stringify(config),
    });
    console.log(`  Field '${field}' created`);
  }
}

async function main() {
  console.log("Creating additional user fields for B2B registration...\n");

  await createFieldIfNotExists("directus_users", "cargo", {
    field: "cargo",
    type: "string",
    schema: { max_length: 100, is_nullable: true },
    meta: {
      interface: "input",
      display: "raw",
      note: "Cargo o puesto en la empresa",
      width: "half",
    },
  });

  await createFieldIfNotExists("directus_users", "tipo_negocio", {
    field: "tipo_negocio",
    type: "string",
    schema: { max_length: 100, is_nullable: true },
    meta: {
      interface: "select-dropdown",
      display: "raw",
      note: "Tipo de negocio/actividad",
      width: "half",
      options: {
        choices: [
          { text: "Control de plagas", value: "control_plagas" },
          { text: "Limpieza profesional", value: "limpieza" },
          { text: "Hosteleria/HORECA", value: "horeca" },
          { text: "Sanidad/Hospital", value: "sanidad" },
          { text: "Industria alimentaria", value: "alimentaria" },
          { text: "Gestion ambiental", value: "ambiental" },
          { text: "Distribucion", value: "distribucion" },
          { text: "Otro", value: "otro" },
        ],
      },
    },
  });

  await createFieldIfNotExists("directus_users", "numero_roesb", {
    field: "numero_roesb",
    type: "string",
    schema: { max_length: 50, is_nullable: true },
    meta: {
      interface: "input",
      display: "raw",
      note: "Numero en el Registro Oficial de Establecimientos y Servicios Biocidas",
      width: "half",
    },
  });

  await createFieldIfNotExists("directus_users", "ciudad", {
    field: "ciudad",
    type: "string",
    schema: { max_length: 100, is_nullable: true },
    meta: { interface: "input", display: "raw", width: "half" },
  });

  await createFieldIfNotExists("directus_users", "provincia", {
    field: "provincia",
    type: "string",
    schema: { max_length: 100, is_nullable: true },
    meta: { interface: "input", display: "raw", width: "half" },
  });

  await createFieldIfNotExists("directus_users", "codigo_postal", {
    field: "codigo_postal",
    type: "string",
    schema: { max_length: 10, is_nullable: true },
    meta: { interface: "input", display: "raw", width: "half" },
  });

  await createFieldIfNotExists("directus_users", "acepta_proteccion_datos", {
    field: "acepta_proteccion_datos",
    type: "boolean",
    schema: { default_value: false, is_nullable: false },
    meta: {
      interface: "boolean",
      display: "boolean",
      note: "Ha aceptado la politica de proteccion de datos",
      width: "half",
    },
  });

  await createFieldIfNotExists("directus_users", "acepta_comunicaciones", {
    field: "acepta_comunicaciones",
    type: "boolean",
    schema: { default_value: false, is_nullable: false },
    meta: {
      interface: "boolean",
      display: "boolean",
      note: "Desea recibir comunicaciones comerciales",
      width: "half",
    },
  });

  console.log("\nDone!");
}

main().catch(console.error);
