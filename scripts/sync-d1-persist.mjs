/**
 * Wrangler CLI writes D1 to {persist}/v3/d1/... but vite dev (getPlatformProxy) reads {persist}/d1/...
 * After migrations, clone, or sqlite3 import, sync so npm run dev sees the same data.
 */
import fs from 'node:fs'
import path from 'node:path'

const persistRoot = process.env.WRANGLER_PERSIST_PATH || '.wrangler/docker-state'
const dbId = '37202af4a48e51a6f9bf1676145f85cdbaaf76a4a51b95f5120b328bf5460e72'

const srcDir = path.join(persistRoot, 'v3', 'd1', 'miniflare-D1DatabaseObject')
const dstDir = path.join(persistRoot, 'd1', 'miniflare-D1DatabaseObject')

if (!fs.existsSync(srcDir)) {
  console.log('[sync-d1] No v3 D1 data at', srcDir, '- nothing to sync')
  process.exit(0)
}

fs.mkdirSync(dstDir, { recursive: true })

for (const suffix of ['.sqlite', '.sqlite-shm', '.sqlite-wal']) {
  const name = dbId + suffix
  const src = path.join(srcDir, name)
  if (!fs.existsSync(src)) continue
  fs.copyFileSync(src, path.join(dstDir, name))
  console.log('[sync-d1] Copied', name)
}

console.log('[sync-d1] Local D1 ready for npm run dev')
