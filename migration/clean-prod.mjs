/**
 * Limpia datos parcialmente migrados de producción
 */
const PROD_URL = "https://tienda.alcora.es";

async function getToken() {
  const resp = await fetch(`${PROD_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@alcora.es", password: "AlcoraAdmin2026!" })
  });
  const json = await resp.json();
  return json.data.access_token;
}

async function deleteAll(token, collection) {
  // Get all IDs
  const resp = await fetch(`${PROD_URL}/items/${collection}?limit=-1&fields=id`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resp.ok) {
    console.log(`  ${collection}: could not fetch (${resp.status})`);
    return;
  }
  const data = await resp.json();
  const ids = (data.data || []).map(i => i.id);

  if (ids.length === 0) {
    console.log(`  ${collection}: empty, skipping`);
    return;
  }

  // Delete all
  const delResp = await fetch(`${PROD_URL}/items/${collection}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(ids)
  });

  if (delResp.ok || delResp.status === 204) {
    console.log(`  ${collection}: ${ids.length} items deleted`);
  } else {
    const text = await delResp.text();
    console.log(`  ${collection}: error deleting - ${text.substring(0, 100)}`);
  }
}

async function main() {
  const token = await getToken();

  console.log("Limpiando datos de producción...");
  // Delete in reverse order (children first)
  await deleteAll(token, "tarifas_especiales");
  await deleteAll(token, "productos");
  await deleteAll(token, "categorias");

  console.log("✅ Limpieza completada");
}

main().catch(console.error);
