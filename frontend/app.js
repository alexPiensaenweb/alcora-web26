/**
 * Entry point para Plesk Node.js / PM2
 *
 * Plesk busca app.js como archivo de inicio.
 * Astro SSR (standalone) genera dist/server/entry.mjs
 * Este wrapper carga las variables de entorno y arranca el servidor.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// PM2 doesn't auto-load .env files. Load .env.production manually
// so process.env.* is available before Astro SSR starts.
try {
  const envFile = resolve(__dirname, ".env.production");
  const content = readFileSync(envFile, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    // Don't override existing env vars (allows PM2 env_production to take precedence)
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
  console.log("[app.js] Loaded .env.production");
} catch (err) {
  console.log("[app.js] No .env.production found, using existing env vars");
}

// Defaults
process.env.HOST = process.env.HOST || "127.0.0.1";
process.env.PORT = process.env.PORT || "3000";

console.log(`[app.js] Starting Astro SSR on ${process.env.HOST}:${process.env.PORT}`);
console.log(`[app.js] DIRECTUS_URL=${process.env.DIRECTUS_URL || "(not set)"}`);
console.log(`[app.js] PUBLIC_DIRECTUS_URL=${process.env.PUBLIC_DIRECTUS_URL || "(not set)"}`);

import("./dist/server/entry.mjs").catch((err) => {
  console.error("Error starting Astro SSR:", err);
  process.exit(1);
});
