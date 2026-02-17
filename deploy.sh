#!/bin/bash
# =============================================================
# Deploy script for Tienda Alcora - Run from LOCAL machine
# Usage: bash deploy.sh
# =============================================================

set -e

SERVER="root@185.14.57.159"
REMOTE_DIR="/var/www/vhosts/tienda.alcora.es/httpdocs"
LOCAL_FRONTEND="frontend"

echo "========================================="
echo " Tienda Alcora - Deploy to Production"
echo "========================================="

# Step 1: Build locally
echo ""
echo "[1/4] Building Astro frontend..."
cd "$LOCAL_FRONTEND"
npm run build
cd ..

# Step 2: Create deploy package
echo ""
echo "[2/4] Creating deploy package..."
rm -rf deploy-frontend
mkdir -p deploy-frontend

# Copy built output
cp -r frontend/dist deploy-frontend/
cp frontend/app.js deploy-frontend/
cp frontend/package.json deploy-frontend/
cp frontend/package-lock.json deploy-frontend/

# Step 3: Sync to server
echo ""
echo "[3/4] Syncing to server..."
rsync -avz --delete \
  deploy-frontend/dist/ "$SERVER:$REMOTE_DIR/dist/"

rsync -avz \
  deploy-frontend/app.js \
  deploy-frontend/package.json \
  deploy-frontend/package-lock.json \
  "$SERVER:$REMOTE_DIR/"

# Step 4: Restart Astro on server
echo ""
echo "[4/4] Restarting Astro on server..."
ssh "$SERVER" "export PATH=/opt/plesk/node/20/bin:\$PATH && cd $REMOTE_DIR && npm install --production && pm2 restart astro-alcora"

echo ""
echo "========================================="
echo " Deploy complete!"
echo " https://tienda.alcora.es"
echo "========================================="
