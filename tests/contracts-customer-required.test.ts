/**
 * Contract create must include customer_id — no free-text-only customers.
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { Hono } from 'hono'
import { registerContractsModuleApi } from '../src/contracts-module-api.ts'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'

const TENANT = 70
const U_ADMIN = 700
const U_EMP = 701
const U_AGENT = 702
const C = 7000
const FR = 7100

function seedSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      full_name TEXT,
      username TEXT,
      tenant_id INTEGER,
      role_id INTEGER,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER,
      full_name TEXT,
      assigned_bank_agent_id INTEGER
    );
    CREATE TABLE customer_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      employee_id INTEGER
    );
    CREATE TABLE financing_requests (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      tenant_id INTEGER,
      assigned_bank_agent_id INTEGER,
      is_completed INTEGER DEFAULT 0
    );
    CREATE TABLE contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER,
      customer_id INTEGER,
      created_by INTEGER,
      contract_number TEXT,
      template_id INTEGER,
      template_name TEXT,
      date_gregorian TEXT,
      day_name TEXT,
      party_one_name TEXT,
      party_one_phone TEXT,
      party_one_logo TEXT,
      party_two_name TEXT,
      party_two_id TEXT,
      party_two_phone TEXT,
      party_two_address TEXT,
      finance_type TEXT,
      finance_amount REAL,
      commission_amount REAL,
      commission_type TEXT,
      commission_rate REAL,
      note_order_number TEXT,
      note_due_date TEXT,
      status TEXT,
      property_description TEXT,
      property_location TEXT,
      bank_name TEXT,
      notes TEXT,
      is_archived INTEGER DEFAULT 0,
      bank_agent_approved_by INTEGER,
      admin_approved_by INTEGER,
      financing_request_id INTEGER,
      location_id INTEGER
    );
    CREATE TABLE contract_create_denials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      user_id INTEGER,
      role_id INTEGER,
      customer_id INTEGER,
      error_code TEXT NOT NULL,
      detail TEXT,
      party_two_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

type StubUser = { userId: number | null; tenantId: number | null; roleId: number | null }

function makeCaller(rawDb: Database.Database, user: StubUser) {
  const app = new Hono()
  const getUserInfo = async () => ({
    userId: user.userId,
    tenantId: user.tenantId,
    roleId: user.roleId,
    tokenRoleId: user.roleId,
  })
  registerContractsModuleApi(app as any, getUserInfo as any)
  const db = createSqliteD1(rawDb)
  return async (path: string, init?: RequestInit) => {
    const env = { DB: db } as any
    const executionCtx = { waitUntil: (p: Promise<unknown>) => { void p } } as any
    const url = new URL(path, 'http://test.local').toString()
    return app.fetch(new Request(url, init), env, executionCtx)
  }
}

describe('contract create requires customer_id', () => {
  let rawDb: Database.Database

  beforeEach(() => {
    rawDb = new Database(':memory:')
    seedSchema(rawDb)
    rawDb
      .prepare(
        `INSERT INTO users (id, full_name, username, tenant_id, role_id) VALUES
          (?, 'Admin', 'admin', ?, 2),
          (?, 'Emp', 'emp', ?, 4),
          (?, 'Agent', 'agent', ?, 5)`
      )
      .run(U_ADMIN, TENANT, U_EMP, TENANT, U_AGENT, TENANT)
    rawDb
      .prepare(`INSERT INTO customers (id, tenant_id, full_name, assigned_bank_agent_id) VALUES (?, ?, 'Cust', ?)`)
      .run(C, TENANT, U_AGENT)
    rawDb
      .prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?, ?)`)
      .run(C, U_EMP)
    rawDb
      .prepare(
        `INSERT INTO financing_requests (id, customer_id, tenant_id, assigned_bank_agent_id) VALUES (?, ?, ?, ?)`
      )
      .run(FR, C, TENANT, U_AGENT)
  })

  it('rejects create with null customer_id', async () => {
    const call = makeCaller(rawDb, { userId: U_EMP, tenantId: TENANT, roleId: 4 })
    const res = await call('/api/contract-tables/contracts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        party_two_name: 'Free Text Person',
        party_two_id: '1104678543',
        customer_id: null,
      }),
    })
    assert.equal(res.status, 400)
    const body = (await res.json()) as any
    assert.equal(body.error, 'customer_required')
    const row = rawDb
      .prepare(`SELECT error_code, party_two_name FROM contract_create_denials WHERE tenant_id = ?`)
      .get(TENANT) as { error_code: string; party_two_name: string }
    assert.equal(row.error_code, 'customer_required')
    assert.equal(row.party_two_name, 'Free Text Person')
  })

  it('lists create denials for admins', async () => {
    const empCall = makeCaller(rawDb, { userId: U_EMP, tenantId: TENANT, roleId: 4 })
    await empCall('/api/contract-tables/contracts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ party_two_name: 'X', customer_id: null }),
    })
    const adminCall = makeCaller(rawDb, { userId: U_ADMIN, tenantId: TENANT, roleId: 2 })
    const res = await adminCall('/api/contract-create-denials?days=3')
    assert.equal(res.status, 200)
    const body = (await res.json()) as any
    assert.ok(Array.isArray(body.data))
    assert.ok(body.data.length >= 1)
    assert.equal(body.data[0].error_code, 'customer_required')
  })

  it('rejects create with missing customer_id', async () => {
    const call = makeCaller(rawDb, { userId: U_ADMIN, tenantId: TENANT, roleId: 2 })
    const res = await call('/api/contract-tables/contracts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        party_two_name: 'Free Text Person',
      }),
    })
    assert.equal(res.status, 400)
    const body = (await res.json()) as any
    assert.equal(body.error, 'customer_required')
  })

  it('allows create when customer_id is provided', async () => {
    const call = makeCaller(rawDb, { userId: U_EMP, tenantId: TENANT, roleId: 4 })
    const res = await call('/api/contract-tables/contracts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        party_two_name: 'Cust',
        customer_id: C,
        finance_amount: 1000,
      }),
    })
    const body = (await res.json()) as any
    assert.equal(res.status, 200, JSON.stringify(body))
    assert.equal(Number(body.customer_id), C)
    assert.equal(Number(body.financing_request_id), FR)
  })
})
