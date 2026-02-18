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

# Step 1: Build frontend
echo ""
echo "[1/4] Installing build dependencies..."
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
echo "[2/4] Setting up runtime files..."

# Copy dist from frontend build
rm -rf "$HTTPDOCS/dist"
cp -r "$HTTPDOCS/frontend/dist" "$HTTPDOCS/dist"

# Copy runtime config from deploy-frontend
cp "$HTTPDOCS/deploy-frontend/app.js" "$HTTPDOCS/app.js"
cp "$HTTPDOCS/deploy-frontend/package.json" "$HTTPDOCS/package.json"

# .env should already exist, but copy if missing
if [ ! -f "$HTTPDOCS/.env" ] || [ "$HTTPDOCS/deploy-frontend/.env" -nt "$HTTPDOCS/.env" ]; then
  cp "$HTTPDOCS/deploy-frontend/.env" "$HTTPDOCS/.env"
  echo "  Updated .env from deploy-frontend"
fi

# Step 3: Install runtime dependencies
echo ""
echo "[3/4] Installing runtime dependencies..."
rm -rf "$HTTPDOCS/node_modules" "$HTTPDOCS/package-lock.json"
npm install --production

# Fix ownership
OWNER=$(stat -c '%U' "$HTTPDOCS")
chown -R "$OWNER:psaserv" "$HTTPDOCS/node_modules"
chown -R "$OWNER:psaserv" "$HTTPDOCS/dist"

# Step 4: Restart PM2
echo ""
echo "[4/4] Restarting PM2..."
pm2 restart astro-alcora 2>/dev/null || pm2 start "$HTTPDOCS/app.js" --name astro-alcora
sleep 2
pm2 logs astro-alcora --lines 15 --nostream

echo ""
echo "========================================="
echo " Deploy complete!"
echo " https://tienda.alcora.es"
echo "========================================="
