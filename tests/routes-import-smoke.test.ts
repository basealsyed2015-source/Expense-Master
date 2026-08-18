/**
 * Import-smoke test for extracted route modules.
 *
 * Simply importing each src/routes/*.ts file exercises:
 *   - TS type-checks pass (via --experimental-strip-types)
 *   - All named imports resolve (no broken paths, no missing exports)
 *   - No circular-dependency crashes at module init
 *   - The exported sub-router is a Hono instance with the expected route paths
 *
 * If a future extraction breaks any of the above, this test fails immediately
 * instead of at first prod request.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { authRoutes } from '../src/routes/auth.ts'
import { ratesRoutes } from '../src/routes/rates.ts'
import { banksRoutes } from '../src/routes/banks.ts'

function extractRoutePaths(router: unknown): string[] {
  // Hono exposes `.routes` on the app instance — array of { method, path, handler }
  const arr = (router as { routes?: Array<{ method: string; path: string }> }).routes
  assert.ok(Array.isArray(arr), 'Expected router.routes to be an array')
  return arr.map((r) => `${r.method} ${r.path}`).sort()
}

describe('routes/auth.ts', () => {
  it('exports authRoutes as a Hono instance', () => {
    assert.ok(authRoutes, 'authRoutes should be defined')
    assert.equal(typeof (authRoutes as { fetch?: unknown }).fetch, 'function')
  })

  it('registers exactly the 5 auth endpoints', () => {
    const paths = extractRoutePaths(authRoutes)
    assert.deepEqual(paths, [
      'POST /api/auth/forgot-password',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'POST /api/auth/reset-password',
      'POST /api/auth/verify-reset-code',
    ])
  })

  it('logout endpoint responds with success and expires the auth cookie', async () => {
    const res = await authRoutes.request('/api/auth/logout', { method: 'POST' })
    assert.equal(res.status, 200)
    const body = (await res.json()) as { success: boolean }
    assert.equal(body.success, true)
    const cookies = res.headers.get('set-cookie') ?? ''
    assert.match(cookies, /authToken=;/)
    assert.match(cookies, /Max-Age=0/)
  })
})

describe('routes/rates.ts', () => {
  it('exports ratesRoutes as a Hono instance', () => {
    assert.equal(typeof (ratesRoutes as { fetch?: unknown }).fetch, 'function')
  })

  it('registers all rates endpoints (8 unique paths + 1 preserved duplicate DELETE)', () => {
    const paths = extractRoutePaths(ratesRoutes)
    // Duplicate DELETE preserved verbatim — see comment in rates.ts.
    assert.deepEqual(paths, [
      'DELETE /api/rates/:id',
      'DELETE /api/rates/:id',
      'GET /api/rates',
      'GET /api/rates/export-csv',
      'GET /api/rates/sample-csv',
      'POST /api/rates',
      'POST /api/rates/import-csv',
      'POST /api/rates/upload-excel',
      'PUT /api/rates/:id',
    ])
  })
})

describe('routes/banks.ts', () => {
  it('exports banksRoutes as a Hono instance', () => {
    assert.equal(typeof (banksRoutes as { fetch?: unknown }).fetch, 'function')
  })

  it('registers all banks endpoints (6 handlers)', () => {
    const paths = extractRoutePaths(banksRoutes)
    assert.deepEqual(paths, [
      'DELETE /api/banks/:id',
      'DELETE /api/banks/global/all',
      'GET /api/banks',
      'POST /api/banks',
      'POST /api/banks/:id',
      'PUT /api/banks/:id',
    ])
  })
})
