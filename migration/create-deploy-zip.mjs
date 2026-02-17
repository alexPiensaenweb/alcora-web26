/**
 * Creates a deploy ZIP for the frontend
 * Includes: app.js, package.json, .env.production, dist/
 * The server will run: npm ci --production && node app.js
 */

import { execSync } from "child_process";
import { cpSync, mkdirSync, writeFileSync, rmSync, existsSync } from "fs";

const FRONTEND = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/frontend";
const DEPLOY = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/deploy-frontend";

// Clean and create deploy dir
if (existsSync(DEPLOY)) rmSync(DEPLOY, { recursive: true });
mkdirSync(DEPLOY, { recursive: true });

// Copy dist (compiled Astro)
console.log("Copying dist/...");
cpSync(`${FRONTEND}/dist`, `${DEPLOY}/dist`, { recursive: true });

// Copy app.js (Plesk entry point)
console.log("Copying app.js...");
cpSync(`${FRONTEND}/app.js`, `${DEPLOY}/app.js`);

// Create production package.json (minimal, just for npm ci)
console.log("Creating package.json...");
const pkg = {
  name: "tienda-alcora",
  type: "module",
  version: "1.0.0",
  private: true,
  scripts: {
    start: "node app.js"
  },
  dependencies: {
    // Astro standalone bundles most deps, but we still need these for runtime
  }
};
writeFileSync(`${DEPLOY}/package.json`, JSON.stringify(pkg, null, 2));

// Create .env for production
console.log("Creating .env...");
const envContent = `# Directus (produccion)
DIRECTUS_URL=http://127.0.0.1:8055
PUBLIC_DIRECTUS_URL=https://tienda.alcora.es
DIRECTUS_ADMIN_TOKEN=migration-static-token-alcora-2026

# Redsys (Pasarela de pago) - TEST
REDSYS_SECRET=sq7HjrUOBfKmC576ILgskD5srU870gJ7
REDSYS_MERCHANT_CODE=999008881
REDSYS_TERMINAL=1
REDSYS_ENV=test

# Cloudflare Turnstile
PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Sitio publico
PUBLIC_SITE_URL=https://tienda.alcora.es
IBAN=ES12 3456 7890 1234 5678 9012

# Server (Plesk Node.js)
HOST=127.0.0.1
PORT=3000
`;
writeFileSync(`${DEPLOY}/.env`, envContent);

// Create ZIP
console.log("Creating ZIP...");
const zipPath = "C:/Users/Piensaenweb/Documents/Claude/alcora/web26/tienda-alcora-frontend.zip";
try {
  // Try PowerShell Compress-Archive
  execSync(
    `powershell -Command "Compress-Archive -Path '${DEPLOY}/*' -DestinationPath '${zipPath}' -Force"`,
    { stdio: "inherit" }
  );
  console.log(`\n✅ ZIP created: ${zipPath}`);
} catch (e) {
  console.log("PowerShell zip failed, trying tar...");
  execSync(`tar -czf "${zipPath.replace('.zip', '.tar.gz')}" -C "${DEPLOY}" .`, { stdio: "inherit" });
  console.log(`\n✅ TAR.GZ created: ${zipPath.replace('.zip', '.tar.gz')}`);
}

console.log("\nDeploy files ready!");
console.log(`Folder: ${DEPLOY}`);
