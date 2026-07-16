import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Worker bundle budget check lives in tests/worker-bundle-budget.test.ts.

describe('customers list performance patterns', () => {
  it('uses static Tailwind and server-side LIMIT for /admin/customers', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
    // Prefer the live route handler, not the comment that mentions the same path.
    const customersIdx = src.lastIndexOf("app.get('/admin/customers'")
    assert.ok(customersIdx > 0)
    const slice = src.slice(customersIdx, customersIdx + 120_000)
    assert.match(slice, /LIMIT \? OFFSET \?/)
    assert.match(slice, /href="\/tailwind\.css"/)
    assert.match(slice, /\/api\/customers\/export-csv|exportCustomersCsv/)
    // Success page head (after auth gate) should prefer /tailwind.css over CDN JIT
    const successTitle = slice.indexOf('<title>العملاء</title>')
    assert.ok(successTitle > 0)
    const headSlice = slice.slice(successTitle, successTitle + 500)
    assert.match(headSlice, /href="\/tailwind\.css"/)
    assert.doesNotMatch(headSlice, /cdn\.tailwindcss\.com/)
  })
})
