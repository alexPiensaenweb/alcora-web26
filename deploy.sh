#!/bin/bash
# =============================================================
# Deploy script for Tienda Alcora - Run from LOCAL machine
# Usage: bash deploy.sh
# =============================================================

set -e

SERVER="root@185.14.57.159"
REMOTE_DIR="/var/www/vhosts/tienda.alcora.es/httpdocs"

echo "========================================="
echo " Tienda Alcora - Deploy to Production"
echo "========================================="

# Step 1: Build locally with production env vars
echo ""
echo "[1/5] Building Astro frontend..."
cd frontend
PUBLIC_DIRECTUS_URL=https://tienda.alcora.es PUBLIC_SITE_URL=https://tienda.alcora.es npm run build
cd ..

# Step 2: Clean remote (remove repo junk)
echo ""
echo "[2/5] Cleaning remote server..."
ssh "$SERVER" "cd $REMOTE_DIR && rm -rf .git .gitignore .mcp.json .env.example frontend directus scripts migration deploy-frontend docker-compose*.yml ecosystem.config.cjs AGENCY_STANDARD_2026.md deploy.sh deploy.ps1 logo-alcora.svg tienda-alcora-frontend.zip stderr.log 2>/dev/null; echo 'Cleaned'"

# Step 3: Upload files
echo ""
echo "[3/5] Uploading to server..."

# Upload runtime config from deploy-frontend
scp deploy-frontend/app.js "$SERVER:$REMOTE_DIR/app.js"
scp deploy-frontend/.env "$SERVER:$REMOTE_DIR/.env"
scp deploy-frontend/package.json "$SERVER:$REMOTE_DIR/package.json"

# Upload dist (atomic swap)
echo "  Uploading dist/..."
rsync -avz --delete frontend/dist/ "$SERVER:$REMOTE_DIR/dist/"

# Upload robots.txt
scp frontend/public/robots.txt "$SERVER:$REMOTE_DIR/dist/client/robots.txt"

# Step 4: Install runtime dependencies
echo ""
echo "[4/5] Installing runtime dependencies..."
ssh "$SERVER" "export PATH=/opt/plesk/node/20/bin:\$PATH && cd $REMOTE_DIR && rm -rf node_modules package-lock.json && npm install --production && chown -R \$(stat -c '%U' .) node_modules/"

# Step 5: Restart PM2
echo ""
echo "[5/5] Restarting Astro on server..."
ssh "$SERVER" "pm2 restart astro-alcora && sleep 2 && pm2 logs astro-alcora --lines 10 --nostream"

echo ""
echo "========================================="
echo " Deploy complete!"
echo " https://tienda.alcora.es"
echo "========================================="
