#!/bin/bash
# =============================================================
# Server-side deploy script for Tienda Alcora
# Run this ON THE SERVER after: git pull
#
# Usage (as root):
#   cd /var/www/vhosts/tienda.alcora.es/httpdocs
#   bash server-deploy.sh
# =============================================================

set -e

HTTPDOCS="/var/www/vhosts/tienda.alcora.es/httpdocs"
NODE_BIN="/opt/plesk/node/20/bin"
export PATH="$NODE_BIN:$PATH"

echo "========================================="
echo " Tienda Alcora - Server Deploy"
echo "========================================="

cd "$HTTPDOCS"

# Step 1: Build frontend (npm ci installs ALL deps including build tools)
echo ""
echo "[1/3] Installing dependencies and building..."
cd frontend
npm ci
echo ""
echo "  Building Astro with production env..."
PUBLIC_DIRECTUS_URL=https://tienda.alcora.es \
PUBLIC_SITE_URL=https://tienda.alcora.es \
npm run build
cd "$HTTPDOCS"

# Step 2: Copy runtime files to httpdocs root
echo ""
echo "[2/3] Setting up runtime files..."

# Copy dist from frontend build
rm -rf "$HTTPDOCS/dist"
cp -r "$HTTPDOCS/frontend/dist" "$HTTPDOCS/dist"

# Copy app.js from deploy-frontend
cp "$HTTPDOCS/deploy-frontend/app.js" "$HTTPDOCS/app.js"

# Symlink node_modules from frontend (has all deps the SSR server needs)
rm -rf "$HTTPDOCS/node_modules"
ln -s "$HTTPDOCS/frontend/node_modules" "$HTTPDOCS/node_modules"

# .env: only copy if it doesn't exist yet (never overwrite production secrets)
if [ ! -f "$HTTPDOCS/.env" ]; then
  if [ -f "$HTTPDOCS/deploy-frontend/.env" ]; then
    cp "$HTTPDOCS/deploy-frontend/.env" "$HTTPDOCS/.env"
    echo "  Copied .env from deploy-frontend"
  else
    cp "$HTTPDOCS/deploy-frontend/.env.example" "$HTTPDOCS/.env"
    echo "  WARNING: Created .env from .env.example - edit with real values!"
  fi
fi

# Fix ownership
OWNER=$(stat -c '%U' "$HTTPDOCS")
chown -R "$OWNER:psaserv" "$HTTPDOCS/dist"
chown -R "$OWNER:psaserv" "$HTTPDOCS/frontend/node_modules"

# Step 3: Restart PM2
echo ""
echo "[3/3] Restarting PM2..."
pm2 restart astro-alcora 2>/dev/null || pm2 start "$HTTPDOCS/app.js" --name astro-alcora
sleep 2
pm2 logs astro-alcora --lines 15 --nostream

echo ""
echo "========================================="
echo " Deploy complete!"
echo " https://tienda.alcora.es"
echo "========================================="
