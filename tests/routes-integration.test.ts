/**
 * End-to-end integration tests for the extracted route modules.
 *
 * Uses a real in-memory SQLite (via better-sqlite3) wrapped in the D1Database
 * shape, mounts the sub-router into a parent Hono app that mirrors index.tsx's
 * middleware setup, and hits actual HTTP paths.
 *
 * Purpose: verify that byte-preserving moves into src/routes/*.ts produce
 * identical runtime behavior to the original monolithic index.tsx handlers.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'
import { authRoutes } from '../src/routes/auth.ts'
import { ratesRoutes } from '../src/routes/rates.ts'
import type { AppEnv } from '../src/shared/context.ts'

// ---------------------------------------------------------------------------
// Test DB setup — creates just the tables the extracted routes touch.
// ---------------------------------------------------------------------------
function buildRatesTestDb(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT,
      password TEXT,
      full_name TEXT,
      email TEXT,
      phone TEXT,
      role_id INTEGER,
      subscription_id INTEGER,
      tenant_id INTEGER,
      assigned_bank_id INTEGER,
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      updated_at TEXT
    );
    CREATE TABLE roles (
      id INTEGER PRIMARY KEY,
      role_name TEXT,
      description TEXT
    );
    CREATE TABLE subscriptions (
      id INTEGER PRIMARY KEY,
      company_name TEXT
    );
    CREATE TABLE tenants (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      slug TEXT
    );
    CREATE TABLE banks (
      id INTEGER PRIMARY KEY,
      bank_name TEXT,
      tenant_id INTEGER,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE financing_types (
      id INTEGER PRIMARY KEY,
      type_name TEXT
    );
    CREATE TABLE bank_financing_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_id INTEGER,
      financing_type_id INTEGER,
      rate REAL,
      min_amount REAL,
      max_amount REAL,
      min_salary REAL,
      max_salary REAL,
      min_duration INTEGER,
      max_duration INTEGER,
      is_active INTEGER DEFAULT 1,
      tenant_id INTEGER,
      notes TEXT
    );
    CREATE TABLE password_change_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      verification_code TEXT,
      expires_at TEXT,
      is_used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO tenants (id, company_name, slug) VALUES (1, 'Acme', 'acme');
    INSERT INTO roles (id, role_name, description) VALUES (1, 'super_admin', 'root');
    INSERT INTO roles (id, role_name, description) VALUES (2, 'company_admin', 'company');
    INSERT INTO banks (id, bank_name, tenant_id, is_active) VALUES
      (10, 'AlRajhi', 1, 1),
      (11, 'SNB',     1, 1);
    INSERT INTO financing_types (id, type_name) VALUES (100, 'شخصي'), (101, 'عقاري');
    INSERT INTO bank_financing_rates
      (bank_id, financing_type_id, rate, min_amount, max_amount, min_duration, max_duration, is_active, tenant_id)
      VALUES
      (10, 100, 4.5, 10000, 500000, 12, 60, 1, 1),
      (11, 101, 3.9, 50000, 900000, 24, 96, 1, 1);
    INSERT INTO users (id, username, password, full_name, email, role_id, subscription_id, tenant_id, is_active)
      VALUES (1, 'admin', 'pw', 'The Admin', 'admin@a.com', 1, NULL, 1, 1);
  `)
  return db
}

function mountLikeIndex(sub: Hono<AppEnv>, opts: { middlewareTag?: { hit: boolean } } = {}): Hono<AppEnv> {
  const app = new Hono<AppEnv>()
  // Mirror src/index.tsx: CORS + a marker /api/* middleware, both registered
  // BEFORE app.route(...), so the sub-router should inherit them.
  app.use('*', cors())
  if (opts.middlewareTag) {
    app.use('/api/*', async (c, next) => {
      opts.middlewareTag!.hit = true
      await next()
    })
  }
  app.route('/', sub)
  return app
}

// ---------------------------------------------------------------------------
// Auth route integration
// ---------------------------------------------------------------------------
describe('routes/auth.ts — integration', () => {
  let db: Database.Database
  let env: { DB: D1Database; RESEND_API_KEY?: string; EMAIL_FROM?: string }

  beforeEach(() => {
    db = buildRatesTestDb()
    env = { DB: createSqliteD1(db) }
  })

  it('POST /api/auth/login with correct credentials returns success + cookie + token', async () => {
    const app = mountLikeIndex(authRoutes)
    const res = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'pw' }),
      },
      env,
    )
    assert.equal(res.status, 200)
    const body = (await res.json()) as any
    assert.equal(body.success, true)
    assert.equal(body.redirect, '/admin/panel')
    assert.equal(body.user.username, 'admin')
    assert.equal(body.user.role_id, 1)
    assert.equal(body.user.tenant_id, 1)
    assert.ok(body.token, 'token should be present')
    const setCookie = res.headers.get('set-cookie') ?? ''
    assert.match(setCookie, /authToken=[^;]+;/)
    assert.match(setCookie, /Max-Age=604800/) // 7 days
    // last_login should be updated after successful login
    const updated = db.prepare('SELECT last_login FROM users WHERE id = 1').get() as { last_login: string }
    assert.ok(updated.last_login, 'last_login should be set')
  })

  it('POST /api/auth/login with wrong password returns 401', async () => {
    const app = mountLikeIndex(authRoutes)
    const res = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'nope' }),
      },
      env,
    )
    assert.equal(res.status, 401)
    const body = (await res.json()) as any
    assert.equal(body.success, false)
  })

  it('POST /api/auth/login returns 500 with debug dump when DB binding missing', async () => {
    const app = mountLikeIndex(authRoutes)
    const res = await app.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'pw' }),
      },
      // Explicitly missing DB
      { RESEND_API_KEY: undefined } as any,
    )
    assert.equal(res.status, 500)
    const body = (await res.json()) as any
    assert.equal(body.success, false)
  })

  it('POST /api/auth/logout clears authToken cookie in two variants', async () => {
    const app = mountLikeIndex(authRoutes)
    const res = await app.request('/api/auth/logout', { method: 'POST' }, env)
    assert.equal(res.status, 200)
    const cookies = res.headers.get('set-cookie') ?? ''
    // Both Secure and non-Secure variants sent to clear across environments
    assert.match(cookies, /Max-Age=0/)
    assert.ok(cookies.includes('Secure'), 'Should include Secure variant')
  })

  it('POST /api/auth/forgot-password returns 503 when RESEND_API_KEY is missing', async () => {
    const app = mountLikeIndex(authRoutes)
    const res = await app.request(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@a.com' }),
      },
      env, // no RESEND_API_KEY
    )
    assert.equal(res.status, 503)
    const body = (await res.json()) as any
    assert.equal(body.success, false)
  })

  it('POST /api/auth/forgot-password returns 404 for unknown user', async () => {
    const app = mountLikeIndex(authRoutes)
    const res = await app.request(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@nowhere.com' }),
      },
      { ...env, RESEND_API_KEY: 'test-key' },
    )
    assert.equal(res.status, 404)
  })

  it('POST /api/auth/verify-reset-code returns 400 on bad code', async () => {
    db.prepare(
      "INSERT INTO password_change_notifications (user_id, verification_code, expires_at, is_used) VALUES (1, '123456', ?, 0)",
    ).run(new Date(Date.now() + 60_000).toISOString())
    const app = mountLikeIndex(authRoutes)
    const res = await app.request(
      '/api/auth/verify-reset-code',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@a.com', code: '000000' }),
      },
      env,
    )
    assert.equal(res.status, 400)
  })

  it('POST /api/auth/verify-reset-code returns 200 with token on valid code', async () => {
    db.prepare(
      "INSERT INTO password_change_notifications (user_id, verification_code, expires_at, is_used) VALUES (1, '123456', ?, 0)",
    ).run(new Date(Date.now() + 60_000).toISOString())
    const app = mountLikeIndex(authRoutes)
    const res = await app.request(
      '/api/auth/verify-reset-code',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@a.com', code: '123456' }),
      },
      env,
    )
    assert.equal(res.status, 200)
    const body = (await res.json()) as any
    assert.equal(body.success, true)
    assert.ok(body.token)
  })

  it('POST /api/auth/reset-password rejects short passwords', async () => {
    const app = mountLikeIndex(authRoutes)
    const res = await app.request(
      '/api/auth/reset-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@a.com', token: 'x', newPassword: 'short' }),
      },
      env,
    )
    assert.equal(res.status, 400)
  })

  it('POST /api/auth/reset-password updates password on success', async () => {
    const app = mountLikeIndex(authRoutes)
    const res = await app.request(
      '/api/auth/reset-password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@a.com', token: 'x', newPassword: 'a-brand-new-secure-password' }),
      },
      env,
    )
    assert.equal(res.status, 200)
    const row = db.prepare('SELECT password FROM users WHERE id = 1').get() as { password: string }
    assert.equal(row.password, 'a-brand-new-secure-password')
  })
})

// ---------------------------------------------------------------------------
// Rates route integration
// ---------------------------------------------------------------------------
describe('routes/rates.ts — integration', () => {
  let db: Database.Database
  let env: { DB: D1Database }

  beforeEach(() => {
    db = buildRatesTestDb()
    env = { DB: createSqliteD1(db) }
  })

  it('GET /api/rates returns all rates when no tenant filter', async () => {
    const app = mountLikeIndex(ratesRoutes)
    const res = await app.request('/api/rates', {}, env)
    assert.equal(res.status, 200)
    const body = (await res.json()) as any
    assert.equal(body.success, true)
    assert.equal(body.data.length, 2)
    assert.ok(body.data[0].bank_name)
    assert.ok(body.data[0].financing_type_name)
  })

  it('GET /api/rates?tenant_id=1 filters by tenant', async () => {
    // Add a rate for a different tenant
    db.prepare(
      "INSERT INTO banks (id, bank_name, tenant_id, is_active) VALUES (99, 'OtherBank', 2, 1)",
    ).run()
    db.prepare(
      'INSERT INTO bank_financing_rates (bank_id, financing_type_id, rate, tenant_id) VALUES (99, 100, 9.9, 2)',
    ).run()
    const app = mountLikeIndex(ratesRoutes)
    const res = await app.request('/api/rates?tenant_id=1', {}, env)
    const body = (await res.json()) as any
    assert.equal(body.data.length, 2)
    for (const r of body.data) assert.equal(r.tenant_id, 1)
  })

  it('POST /api/rates inserts a new rate', async () => {
    const app = mountLikeIndex(ratesRoutes)
    const res = await app.request(
      '/api/rates',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_id: 10,
          financing_type_id: 100,
          rate: 5.5,
          min_amount: 1000,
          max_amount: 100000,
          min_duration: 12,
          max_duration: 60,
          is_active: 1,
          tenant_id: 1,
        }),
      },
      env,
    )
    assert.equal(res.status, 200)
    const body = (await res.json()) as any
    assert.equal(body.success, true)
    assert.ok(body.id, 'should return inserted id')
    const row = db.prepare('SELECT * FROM bank_financing_rates WHERE id = ?').get(body.id) as any
    assert.equal(row.rate, 5.5)
    assert.equal(row.tenant_id, 1)
  })

  it('PUT /api/rates/:id updates a rate', async () => {
    const app = mountLikeIndex(ratesRoutes)
    const res = await app.request(
      '/api/rates/1',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bank_id: 10,
          financing_type_id: 100,
          rate: 7.7,
          min_amount: 1,
          max_amount: 2,
          min_salary: 3,
          max_salary: 4,
          min_duration: 5,
          max_duration: 6,
          is_active: 1,
        }),
      },
      env,
    )
    assert.equal(res.status, 200)
    const row = db.prepare('SELECT rate FROM bank_financing_rates WHERE id = 1').get() as any
    assert.equal(row.rate, 7.7)
  })

  it('DELETE /api/rates/:id (first-registered, tenant-scoped handler) fires and deletes', async () => {
    const app = mountLikeIndex(ratesRoutes)
    const res = await app.request('/api/rates/1', { method: 'DELETE' }, env)
    assert.equal(res.status, 200)
    const rows = db.prepare('SELECT * FROM bank_financing_rates WHERE id = 1').all() as any[]
    assert.equal(rows.length, 0)
    // Verify the response shape matches the FIRST (authenticated) handler,
    // not the duplicate handler which returns `{ success, message }`.
    const body = (await res.json()) as any
    assert.equal(body.success, true)
    assert.equal(body.message, undefined, 'first handler returns bare {success:true}, not with message')
  })

  it('GET /api/rates/sample-csv returns a spreadsheet download', async () => {
    const app = mountLikeIndex(ratesRoutes)
    const res = await app.request('/api/rates/sample-csv?tenant_id=1', {}, env)
    assert.equal(res.status, 200)
    const cd = res.headers.get('content-disposition') ?? ''
    assert.match(cd, /attachment/)
    const text = await res.text()
    assert.ok(text.length > 0, 'body should have content')
  })
})

// ---------------------------------------------------------------------------
// Middleware inheritance — the risk we flagged.
// ---------------------------------------------------------------------------
describe('sub-router middleware inheritance', () => {
  it('/api/* middleware registered on parent app fires for sub-routed auth handlers', async () => {
    const tag = { hit: false }
    const db = buildRatesTestDb()
    const env = { DB: createSqliteD1(db) }
    const app = mountLikeIndex(authRoutes, { middlewareTag: tag })
    const res = await app.request('/api/auth/logout', { method: 'POST' }, env)
    assert.equal(res.status, 200)
    assert.equal(tag.hit, true, 'parent app.use(/api/*) MUST fire on sub-routed handler')
  })

  it('/api/* middleware fires for sub-routed rates handlers too', async () => {
    const tag = { hit: false }
    const db = buildRatesTestDb()
    const env = { DB: createSqliteD1(db) }
    const app = mountLikeIndex(ratesRoutes, { middlewareTag: tag })
    const res = await app.request('/api/rates', {}, env)
    assert.equal(res.status, 200)
    assert.equal(tag.hit, true, 'parent app.use(/api/*) MUST fire on sub-routed handler')
  })
})
