#!/bin/sh
set -e

CONFIG="${WRANGLER_CONFIG_PATH:-wrangler.docker.toml}"
DB_NAME="${D1_DATABASE_NAME:-tamweel-docker-local}"
PERSIST="${WRANGLER_PERSIST_PATH:-.wrangler/docker-state}"
MARKER="${PERSIST}/.d1-initialized"

if [ "${FORCE_DB_RESET:-0}" = "1" ]; then
  echo "[docker/db] FORCE_DB_RESET=1 - re-applying migrations."
  rm -f "$MARKER"
fi

if [ -f "$MARKER" ]; then
  echo "[docker/db] Local D1 already initialized - skipping migrations."
  exit 0
fi

mkdir -p "$PERSIST"

echo "[docker/db] Applying D1 migrations locally only (${DB_NAME})..."
echo "[docker/db] Config: ${CONFIG} - production Cloudflare is not modified."

npx wrangler d1 migrations apply "$DB_NAME" --local --config "$CONFIG" --persist-to "$PERSIST"

touch "$MARKER"
node scripts/sync-d1-persist.mjs
echo "[docker/db] Local D1 ready. Run the app on the host: npm run dev"
