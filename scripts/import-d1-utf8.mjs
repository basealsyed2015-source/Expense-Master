/**
 * Import D1 SQL dump with UTF-8 (Arabic-safe). Do not pipe SQL through PowerShell Get-Content.
 *
 * Usage (after remote-schema.sql is loaded into local D1):
 *   node scripts/import-d1-utf8.mjs [path/to/remote-data.sql]
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const persistRoot = process.env.WRANGLER_PERSIST_PATH || '.wrangler/docker-state'
const dbId = '37202af4a48e51a6f9bf1676145f85cdbaaf76a4a51b95f5120b328bf5460e72'
const dbDir = path.join(persistRoot, 'v3', 'd1', 'miniflare-D1DatabaseObject')
const dbPath = path.join(dbDir, `${dbId}.sqlite`)

const sourceSql = process.argv[2] || 'remote-data.sql'
if (!fs.existsSync(sourceSql)) {
  console.error(`[import-d1] Missing ${sourceSql}. Export first:`)
  console.error('  npx wrangler d1 export tamweel-production-v2 --remote --no-schema --output=./remote-data.sql --config=wrangler.toml')
  process.exit(1)
}

if (!fs.existsSync(dbPath)) {
  console.error(`[import-d1] Local DB not found at ${dbPath}. Import schema first (remote-schema.sql).`)
  process.exit(1)
}

const raw = fs.readFileSync(sourceSql, 'utf8')
const filtered = raw
  .split(/\r?\n/)
  .filter((line) => !line.includes('INSERT INTO "d1_migrations"'))
  .join('\n')

const filteredPath = path.join(process.cwd(), '.remote-data-utf8.sql')
fs.writeFileSync(filteredPath, filtered, 'utf8')

console.log('[import-d1] Importing', sourceSql, '→', dbPath)

const sqlBody = `PRAGMA foreign_keys=OFF;\nPRAGMA defer_foreign_keys=ON;\n${filtered}\n`
execSync(`sqlite3 "${dbPath}"`, {
  input: sqlBody,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
  env: { ...process.env, SQLITE_UTF8: '1' },
})
execSync(`sqlite3 "${dbPath}" "PRAGMA wal_checkpoint(TRUNCATE);"`, { encoding: 'utf8' })

fs.unlinkSync(filteredPath)

// Sync v3 → d1 for vite dev
execSync('node scripts/sync-d1-persist.mjs', { stdio: 'inherit' })

const sample = execSync(
  `sqlite3 "${dbPath}" "SELECT full_name FROM users WHERE id=1;"`,
  { encoding: 'utf8' }
).trim()
console.log('[import-d1] Sample (user 1 full_name):', sample)
if (sample.includes('?') && !sample.includes('ال')) {
  console.warn('[import-d1] Warning: Arabic may still be wrong — check terminal/console UTF-8.')
} else {
  console.log('[import-d1] Done. Restart npm run dev if it is running.')
}
