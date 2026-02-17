import { writeFileSync } from "fs";

const BASE = "http://localhost:8056";
const TOKEN = "zH7zNQCUU4EEV5Nh8I-yepbGw5vqTRWw";
const DIR = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/migration";

const collections = ["categorias", "productos", "tarifas_especiales", "pedidos", "pedidos_items"];

for (const col of collections) {
  console.log(`Exporting ${col}...`);
  const resp = await fetch(`${BASE}/items/${col}?limit=-1&fields=*`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const json = await resp.json();
  writeFileSync(`${DIR}/${col}.json`, JSON.stringify(json, null, 2));
  console.log(`  → ${json.data?.length || 0} records`);
}

// Also export files/assets list
console.log("Exporting files list...");
const filesResp = await fetch(`${BASE}/files?limit=-1&fields=*`, {
  headers: { Authorization: `Bearer ${TOKEN}` }
});
const filesJson = await filesResp.json();
writeFileSync(`${DIR}/files.json`, JSON.stringify(filesJson, null, 2));
console.log(`  → ${filesJson.data?.length || 0} files`);

console.log("\nAll done!");
