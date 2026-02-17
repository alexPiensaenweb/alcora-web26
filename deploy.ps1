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

# Step 1: Build locally
Write-Host ""
Write-Host "[1/4] Building Astro frontend..." -ForegroundColor Yellow
Set-Location "$PROJECT_ROOT\frontend"

# Set production env for build
$env:PUBLIC_DIRECTUS_URL = "https://tienda.alcora.es"
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed!" }

Set-Location $PROJECT_ROOT

# Step 2: Create deploy package
Write-Host ""
Write-Host "[2/4] Creating deploy package..." -ForegroundColor Yellow
if (Test-Path "deploy-frontend") { Remove-Item -Recurse -Force "deploy-frontend" }
New-Item -ItemType Directory -Path "deploy-frontend" | Out-Null
Copy-Item -Recurse "frontend\dist" "deploy-frontend\dist"
Copy-Item "frontend\app.js" "deploy-frontend\"
Copy-Item "frontend\package.json" "deploy-frontend\"
Copy-Item "frontend\package-lock.json" "deploy-frontend\"

# Step 3: Create ZIP and upload
Write-Host ""
Write-Host "[3/4] Uploading to server..." -ForegroundColor Yellow

# Sync dist folder
Write-Host "  Syncing dist/..." -ForegroundColor Gray
scp -r "deploy-frontend\dist" "${SERVER}:${REMOTE_DIR}/dist_new"
ssh $SERVER "rm -rf ${REMOTE_DIR}/dist && mv ${REMOTE_DIR}/dist_new ${REMOTE_DIR}/dist"

# Sync config files
Write-Host "  Syncing config files..." -ForegroundColor Gray
scp "deploy-frontend\app.js" "${SERVER}:${REMOTE_DIR}/app.js"
scp "deploy-frontend\package.json" "${SERVER}:${REMOTE_DIR}/package.json"
scp "deploy-frontend\package-lock.json" "${SERVER}:${REMOTE_DIR}/package-lock.json"

# Step 4: Install deps and restart
Write-Host ""
Write-Host "[4/4] Restarting Astro on server..." -ForegroundColor Yellow
ssh $SERVER "export PATH=/opt/plesk/node/20/bin:`$PATH && cd ${REMOTE_DIR} && npm install --production && pm2 restart astro-alcora"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " Deploy complete!" -ForegroundColor Green
Write-Host " https://tienda.alcora.es" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
