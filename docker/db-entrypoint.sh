#!/bin/sh
set -e

if [ ! -f node_modules/wrangler/package.json ]; then
  echo "[docker/db] Installing dependencies (first run)..."
  npm ci
fi

exec sh docker/init-local-d1.sh
