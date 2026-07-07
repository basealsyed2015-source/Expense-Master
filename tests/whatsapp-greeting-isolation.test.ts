/**
 * WhatsApp greeting tenant isolation: a greeting saved by company A must never
 * be returned to users scoped to company B (read API or DB fetch by tenant id).
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { Hono } from 'hono'
import {
  fetchTenantWhatsappSettings,
  updateTenantWhatsappGreeting,
} from '../src/tenant-whatsapp-settings.ts'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'

const TENANT_A = 10
const TENANT_B = 20
const GREETING_A = 'السلام عليكم {{customer_name}} — رسالة خاصة بشركة أ'
const GREETING_B = 'مرحباً {{customer_name}} — رسالة خاصة بشركة ب'
const COMPANY_A = 'شركة أ للتمويل'
const COMPANY_B = 'شركة ب للتمويل'

function createTenantsDb(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE tenants (
      id INTEGER PRIMARY KEY,
      company_name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      whatsapp_greeting TEXT
    );
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER,
      role_id INTEGER,
      is_active INTEGER DEFAULT 1
    );
  `)
  db.prepare(
    `INSERT INTO tenants (id, company_name, slug, whatsapp_greeting) VALUES (?, ?, ?, ?)`
  ).run(TENANT_A, COMPANY_A, 'company-a', GREETING_A)
  db.prepare(
    `INSERT INTO tenants (id, company_name, slug, whatsapp_greeting) VALUES (?, ?, ?, ?)`
  ).run(TENANT_B, COMPANY_B, 'company-b', GREETING_B)
  db.prepare(`INSERT INTO users (id, tenant_id, role_id, is_active) VALUES (1, ?, 2, 1)`).run(TENANT_A)
  db.prepare(`INSERT INTO users (id, tenant_id, role_id, is_active) VALUES (2, ?, 2, 1)`).run(TENANT_B)
  db.prepare(`INSERT INTO users (id, tenant_id, role_id, is_active) VALUES (3, ?, 4, 1)`).run(TENANT_A)
  return db
}

function makeWhatsappGreetingApp(opts: {
  db: D1Database
  user: { userId: number | null; tenantId: number | null; roleId?: number | null }
}) {
  const app = new Hono()
  app.get('/api/tenant/whatsapp-greeting', async (c) => {
    const info = opts.user
    if (!info.userId) {
      return c.json({ success: false, error: 'غير مصرح' }, 401)
    }
    if (!info.tenantId) {
      return c.json({ success: true, data: { whatsapp_greeting: '', company_name: '' } })
    }
    const settings = await fetchTenantWhatsappSettings(c.env.DB, info.tenantId)
    return c.json({
      success: true,
      data: {
        whatsapp_greeting: settings.greeting,
        company_name: settings.companyName,
      },
    })
  })

  return async (path: string) => {
    const env = { DB: opts.db }
    const url = new URL(path, 'http://test.local').toString()
    return app.fetch(new Request(url), env)
  }
}

describe('WhatsApp greeting tenant isolation', () => {
  let rawDb: Database.Database
  let db: D1Database

  beforeEach(() => {
    rawDb = createTenantsDb()
    db = createSqliteD1(rawDb)
  })

  it('fetchTenantWhatsappSettings returns each tenant’s own greeting only', async () => {
    const settingsA = await fetchTenantWhatsappSettings(db, TENANT_A)
    const settingsB = await fetchTenantWhatsappSettings(db, TENANT_B)

    assert.equal(settingsA.greeting, GREETING_A)
    assert.equal(settingsA.companyName, COMPANY_A)
    assert.equal(settingsB.greeting, GREETING_B)
    assert.equal(settingsB.companyName, COMPANY_B)

    assert.notEqual(settingsA.greeting, settingsB.greeting)
    assert.doesNotMatch(settingsA.greeting, /شركة ب/)
    assert.doesNotMatch(settingsB.greeting, /شركة أ/)
  })

  it('fetchTenantWhatsappSettings with null tenant id returns empty (no cross-tenant default)', async () => {
    const settings = await fetchTenantWhatsappSettings(db, null)
    assert.equal(settings.greeting, '')
    assert.equal(settings.companyName, '')
  })

  it('updateTenantWhatsappGreeting for tenant B does not change tenant A greeting', async () => {
    const leakedBefore = await fetchTenantWhatsappSettings(db, TENANT_A)
    assert.equal(leakedBefore.greeting, GREETING_A)

    await updateTenantWhatsappGreeting(db, TENANT_B, 'رسالة محدّثة لشركة ب فقط')

    const afterA = await fetchTenantWhatsappSettings(db, TENANT_A)
    const afterB = await fetchTenantWhatsappSettings(db, TENANT_B)

    assert.equal(afterA.greeting, GREETING_A, 'tenant A greeting must be unchanged')
    assert.equal(afterB.greeting, 'رسالة محدّثة لشركة ب فقط')
    assert.notEqual(afterB.greeting, afterA.greeting)
  })

  it('GET /api/tenant/whatsapp-greeting never leaks company A greeting to tenant B user', async () => {
    const tenantBUser = makeWhatsappGreetingApp({
      db,
      user: { userId: 2, tenantId: TENANT_B, roleId: 2 },
    })
    const res = await tenantBUser('/api/tenant/whatsapp-greeting')
    assert.equal(res.status, 200)

    const body = (await res.json()) as {
      success: boolean
      data: { whatsapp_greeting: string; company_name: string }
    }
    assert.equal(body.success, true)
    assert.equal(body.data.whatsapp_greeting, GREETING_B)
    assert.equal(body.data.company_name, COMPANY_B)
    assert.notEqual(body.data.whatsapp_greeting, GREETING_A)
    assert.doesNotMatch(body.data.whatsapp_greeting, /شركة أ/)
  })

  it('GET /api/tenant/whatsapp-greeting never leaks company B greeting to tenant A user', async () => {
    const tenantAEmployee = makeWhatsappGreetingApp({
      db,
      user: { userId: 3, tenantId: TENANT_A, roleId: 4 },
    })
    const res = await tenantAEmployee('/api/tenant/whatsapp-greeting')
    const body = (await res.json()) as {
      success: boolean
      data: { whatsapp_greeting: string; company_name: string }
    }

    assert.equal(body.data.whatsapp_greeting, GREETING_A)
    assert.notEqual(body.data.whatsapp_greeting, GREETING_B)
    assert.doesNotMatch(body.data.whatsapp_greeting, /شركة ب/)
  })

  it('unknown tenant id returns empty greeting (no fallback to another tenant)', async () => {
    const settings = await fetchTenantWhatsappSettings(db, 9999)
    assert.equal(settings.greeting, '')
    assert.equal(settings.companyName, '')
  })
})
