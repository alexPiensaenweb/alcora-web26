import { readFileSync } from "fs";

const DIR = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/migration";
const PROD_URL = "https://tienda.alcora.es";

const file = JSON.parse(readFileSync(`${DIR}/categorias.json`, "utf-8"));
const cats = file.data;

// Show root categories
const roots = cats.filter(c => c.parent === null || c.parent === undefined);
console.log("=== ROOT CATEGORIES ===");
for (const c of roots) {
  console.log(`  id=${c.id} | parent=${c.parent} | status=${c.status} | nombre="${c.nombre}"`);
}

console.log("\n=== CHILD CATEGORIES ===");
const children = cats.filter(c => c.parent !== null && c.parent !== undefined);
for (const c of children) {
  console.log(`  id=${c.id} | parent=${c.parent} | status=${c.status} | nombre="${c.nombre}"`);
}

// Now test importing one root via fresh JWT token
console.log("\n=== TEST IMPORT ===");
const tokenResp = await fetch(`${PROD_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@alcora.es", password: "AlcoraAdmin2026!" })
});
const tokenData = await tokenResp.json();
const token = tokenData.data.access_token;

// Try the first failing root
const failCat = roots.find(c => c.nombre === "Control de Plagas");
if (failCat) {
  console.log(`\nTrying to import: ${JSON.stringify(failCat).substring(0, 200)}`);
  const resp = await fetch(`${PROD_URL}/items/categorias`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(failCat)
  });
  console.log(`Status: ${resp.status}`);
  const text = await resp.text();
  console.log(`Response: ${text.substring(0, 300)}`);
}
