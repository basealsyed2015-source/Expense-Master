/**
 * Clone remote D1 → local docker DB with correct UTF-8 (Arabic names, etc.)
 */
import { execSync } from 'node:child_process'

const run = (cmd) => {
  console.log('\n>', cmd)
  execSync(cmd, { stdio: 'inherit', shell: true })
}

console.log('[clone] Exporting remote schema + data...')
run('npx wrangler d1 export tamweel-production-v2 --remote --no-data --output=./remote-schema.sql --config=wrangler.toml')
run('npx wrangler d1 export tamweel-production-v2 --remote --no-schema --output=./remote-data.sql --config=wrangler.toml')

console.log('[clone] Wiping local persist (docker-state)...')
execSync('node -e "const fs=require(\'fs\');const p=\'.wrangler/docker-state\';for (const d of [\'v3/d1\',\'d1\']) { const x=p+\'/\'+d; if(fs.existsSync(x)) fs.rmSync(x,{recursive:true,force:true}); }"', {
  stdio: 'inherit',
})

console.log('[clone] Creating schema locally...')
run(
  'npx wrangler d1 execute tamweel-docker-local --local --file=./remote-schema.sql --config=wrangler.docker.toml --persist-to=.wrangler/docker-state --yes'
)

console.log('[clone] Importing data (UTF-8)...')
run('node scripts/import-d1-utf8.mjs ./remote-data.sql')

console.log('[clone] Finished. Run: npm run dev')
