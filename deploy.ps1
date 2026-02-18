# =============================================================
# Deploy script for Tienda Alcora - PowerShell version
# Usage: .\deploy.ps1
# Requires: ssh, scp (comes with Windows 10+)
# =============================================================

$ErrorActionPreference = "Stop"

$SERVER = "root@185.14.57.159"
$REMOTE_DIR = "/var/www/vhosts/tienda.alcora.es/httpdocs"
$PROJECT_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Tienda Alcora - Deploy to Production" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Step 1: Build locally with production env vars
Write-Host ""
Write-Host "[1/5] Building Astro frontend..." -ForegroundColor Yellow
Set-Location "$PROJECT_ROOT\frontend"

$env:PUBLIC_DIRECTUS_URL = "https://tienda.alcora.es"
$env:PUBLIC_SITE_URL = "https://tienda.alcora.es"
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed!" }

Set-Location $PROJECT_ROOT

# Step 2: Clean remote (remove repo junk, keep only what we need)
Write-Host ""
Write-Host "[2/5] Cleaning remote server..." -ForegroundColor Yellow
ssh $SERVER @"
cd $REMOTE_DIR
# Remove repo files that should NOT be on the server
rm -rf .git .gitignore .mcp.json .env.example frontend directus scripts migration deploy-frontend docker-compose*.yml ecosystem.config.cjs AGENCY_STANDARD_2026.md deploy.sh deploy.ps1 logo-alcora.svg tienda-alcora-frontend.zip stderr.log 2>/dev/null
echo 'Cleaned repo artifacts from httpdocs'
"@

# Step 3: Upload deploy-frontend config + built dist
Write-Host ""
Write-Host "[3/5] Uploading to server..." -ForegroundColor Yellow

# Upload app.js and .env from deploy-frontend (runtime config)
Write-Host "  Uploading app.js + .env + package.json..." -ForegroundColor Gray
scp "deploy-frontend\app.js" "${SERVER}:${REMOTE_DIR}/app.js"
scp "deploy-frontend\.env" "${SERVER}:${REMOTE_DIR}/.env"
scp "deploy-frontend\package.json" "${SERVER}:${REMOTE_DIR}/package.json"

# Upload dist (atomic swap)
Write-Host "  Uploading dist/..." -ForegroundColor Gray
scp -r "frontend\dist" "${SERVER}:${REMOTE_DIR}/dist_new"
ssh $SERVER "rm -rf ${REMOTE_DIR}/dist && mv ${REMOTE_DIR}/dist_new ${REMOTE_DIR}/dist"

# Upload robots.txt to dist/client (static file)
Write-Host "  Uploading robots.txt..." -ForegroundColor Gray
scp "frontend\public\robots.txt" "${SERVER}:${REMOTE_DIR}/dist/client/robots.txt"

# Step 4: Install runtime dependencies
Write-Host ""
Write-Host "[4/5] Installing runtime dependencies..." -ForegroundColor Yellow
ssh $SERVER "export PATH=/opt/plesk/node/20/bin:`$PATH && cd ${REMOTE_DIR} && rm -rf node_modules package-lock.json && npm install --production && chown -R `$(stat -c '%U' .) node_modules/"

# Step 5: Restart PM2
Write-Host ""
Write-Host "[5/5] Restarting Astro on server..." -ForegroundColor Yellow
ssh $SERVER "pm2 restart astro-alcora && sleep 2 && pm2 logs astro-alcora --lines 10 --nostream"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " Deploy complete!" -ForegroundColor Green
Write-Host " https://tienda.alcora.es" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
