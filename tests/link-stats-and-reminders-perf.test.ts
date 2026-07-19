import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('link-stats overview batching', () => {
  it('avoids sequential per-link overview awaits as the primary path', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
    const idx = src.indexOf("app.get('/api/link-stats'")
    assert.ok(idx > 0)
    const slice = src.slice(idx, idx + 40_000)
    assert.match(slice, /Batched overview/)
    assert.match(slice, /GROUP BY \$\{pathKeyExpr\}|GROUP BY path_key|GROUP BY \$\{pathKeyExpr\}/)
    // Primary path must not loop with await buildLinkStats; catch fallback may.
    const primary = slice.slice(0, slice.indexOf('} catch {'))
    assert.doesNotMatch(primary, /for \(const item of links\) overview\.push\(await buildLinkStats/)
  })

  it('includes form initiations in overview and detail stats', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
    const idx = src.indexOf("app.get('/api/link-stats'")
    assert.ok(idx > 0)
    const slice = src.slice(idx, idx + 50_000)
    assert.match(slice, /contact_link_form_initiations/)
    assert.match(slice, /initiations/)
    assert.match(src, /contact-form-initiations/)
    assert.match(src, /recordContactLinkFormInitiationWithDedup/)
  })
})

describe('customer reminders batching', () => {
  it('batches reminder inserts instead of per-row SELECT+INSERT', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
    const idx = src.indexOf('async function processCustomerReminders')
    assert.ok(idx > 0)
    const slice = src.slice(idx, idx + 12_000)
    assert.match(slice, /db\.batch\(/)
    assert.doesNotMatch(slice, /ALTER TABLE customer_alarms/)
  })
})
