/**
 * Cron companion auth + Worker wiring invariants.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  extractCronSecretFromHeaders,
  isValidCronSecret,
  timingSafeEqualString,
} from '../src/cron-auth.ts'

const INDEX_SRC = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
const CRON_WORKER_SRC = readFileSync(join(process.cwd(), 'src', 'cron-worker.ts'), 'utf8')
const CRON_TOML = readFileSync(join(process.cwd(), 'wrangler.cron.toml'), 'utf8')
const ROOT_TOML = readFileSync(join(process.cwd(), 'wrangler.toml'), 'utf8')

describe('cron-auth helpers', () => {
  it('compares secrets in a length-safe way', () => {
    assert.equal(timingSafeEqualString('abc', 'abc'), true)
    assert.equal(timingSafeEqualString('abc', 'abd'), false)
    assert.equal(timingSafeEqualString('abc', 'ab'), false)
    assert.equal(isValidCronSecret('secret', 'secret'), true)
    assert.equal(isValidCronSecret('secret', 'other'), false)
    assert.equal(isValidCronSecret('', 'secret'), false)
    assert.equal(isValidCronSecret('secret', ''), false)
    assert.equal(isValidCronSecret('secret', null), false)
  })

  it('reads Bearer or X-Cron-Secret headers', () => {
    assert.equal(
      extractCronSecretFromHeaders({ get: (n) => (n === 'Authorization' ? 'Bearer tok123' : null) }),
      'tok123',
    )
    assert.equal(
      extractCronSecretFromHeaders({ get: (n) => (n === 'X-Cron-Secret' ? 'hdr-secret' : null) }),
      'hdr-secret',
    )
    assert.equal(
      extractCronSecretFromHeaders({ get: () => null }),
      '',
    )
  })
})

describe('cron companion wiring', () => {
  it('trigger endpoints accept cron secret via authorizeCronOrAdmin', () => {
    assert.match(INDEX_SRC, /async function authorizeCronOrAdmin/)
    assert.match(INDEX_SRC, /CRON_SECRET\?: string/)
    const remindersIdx = INDEX_SRC.indexOf("app.post('/api/customer-reminders/trigger'")
    const noRespIdx = INDEX_SRC.indexOf("app.post('/api/followup-no-response/trigger'")
    assert.ok(remindersIdx >= 0)
    assert.ok(noRespIdx >= 0)
    assert.match(INDEX_SRC.slice(remindersIdx, remindersIdx + 400), /authorizeCronOrAdmin/)
    assert.match(INDEX_SRC.slice(noRespIdx, noRespIdx + 400), /authorizeCronOrAdmin/)
  })

  it('companion Worker posts both trigger paths on a cron schedule', () => {
    assert.match(CRON_WORKER_SRC, /\/api\/followup-no-response\/trigger/)
    assert.match(CRON_WORKER_SRC, /\/api\/customer-reminders\/trigger/)
    assert.match(CRON_WORKER_SRC, /async scheduled/)
    assert.match(CRON_TOML, /name = "tamweel-cron"/)
    assert.match(CRON_TOML, /crons = \["0 6 \* \* \*"\]/)
    assert.match(ROOT_TOML, /crons = \[\]/)
  })
})
