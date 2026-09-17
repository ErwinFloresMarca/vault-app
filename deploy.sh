#!/usr/bin/env bash
set -euo pipefail

# Deploy manual en la VPS: descarga el último release de GitHub y reinicia PM2.
# Uso: pnpm deploy   (o bash deploy.sh)
REPO="ErwinFloresMarca/vault-app"
APP_DIR="/var/www/vault-app"
CURRENT="$APP_DIR/current"
APP_NAME="vault-app"

TAG=$(gh release list --repo "$REPO" --limit 1 --json tagName --jq '.[0].tagName')
echo "> Desplegando release: $TAG"

cd "$APP_DIR"
gh release download "$TAG" --repo "$REPO" --pattern 'vault-app-*.tar.gz' --clobber

ARCHIVE=$(ls -t vault-app-*.tar.gz | head -1)
echo "> Usando artifact: $ARCHIVE"

rm -rf "$CURRENT/.output"
tar -xzf "$ARCHIVE" -C "$CURRENT"

pm2 restart "$APP_NAME" || pm2 start "$CURRENT/ecosystem.config.cjs"
pm2 save

echo "> Deploy OK: $TAG"
