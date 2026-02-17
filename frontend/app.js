/**
 * Entry point para Plesk Node.js
 *
 * Plesk busca app.js como archivo de inicio.
 * Astro SSR (standalone) genera dist/server/entry.mjs
 * Este wrapper lo importa y arranca el servidor.
 */

// Variables de entorno necesarias para Astro SSR
process.env.HOST = process.env.HOST || "127.0.0.1";
process.env.PORT = process.env.PORT || "3000";

import("./dist/server/entry.mjs").catch((err) => {
  console.error("Error starting Astro SSR:", err);
  process.exit(1);
});
