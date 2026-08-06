/**
 * Role 4 / role 6 contract access follows current customer_assignments.
 *
 * When a customer is transferred (customer_assignments row moves from U_A to
 * U_B), the new employee should be able to list, GET, PATCH, and DELETE any
 * contract that references that customer — and the old employee should not,
 * even if they were the original creator.
 *
 * Bank-agent approval logic is intentionally out of scope here; role 5 access
 * still keys off financing_requests.assigned_bank_agent_id and is unchanged.
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { Hono } from 'hono'
import { registerContractsModuleApi } from '../src/contracts-module-api.ts'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'

const TENANT = 40
const U_EMP_OLD = 400
const U_EMP_NEW = 401
const U_R6 = 402
const U_ADMIN = 499
const C = 4000
const CONTRACT_ID = 8000

function seedSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      full_name TEXT,
      tenant_id INTEGER,
      role_id INTEGER,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER,
      full_name TEXT
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
      assigned_bank_agent_id INTEGER
    );
    CREATE TABLE contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER,
      customer_id INTEGER,
      created_by INTEGER,
      contract_number TEXT,
      status TEXT,
      is_archived INTEGER DEFAULT 0,
      party_one_name TEXT,
      bank_agent_approved_by INTEGER,
      admin_approved_by INTEGER,
      financing_request_id INTEGER
    );
  `)
}

function seedData(db: Database.Database) {
  db.prepare(`INSERT INTO users (id, full_name, tenant_id, role_id) VALUES
    (${U_EMP_OLD}, 'Old Emp', ${TENANT}, 4),
    (${U_EMP_NEW}, 'New Emp', ${TENANT}, 4),
    (${U_R6},      'Role6',   ${TENANT}, 6),
    (${U_ADMIN},   'Admin',   ${TENANT}, 2)`).run()

  db.prepare(`INSERT INTO customers (id, tenant_id, full_name) VALUES (?, ?, ?)`).run(C, TENANT, 'Cust')
  db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?, ?)`).run(C, U_EMP_OLD)

  // Contract created by U_EMP_OLD for customer C
  db.prepare(`
    INSERT INTO contracts (id, tenant_id, customer_id, created_by, contract_number, status, is_archived)
    VALUES (?, ?, ?, ?, 'K-1', 'بانتظار موافقة ممثل البنك', 0)
  `).run(CONTRACT_ID, TENANT, C, U_EMP_OLD)
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

describe('contracts scope follows current customer_assignments (role 4)', () => {
  let rawDb: Database.Database

  beforeEach(() => {
    rawDb = new Database(':memory:')
    seedSchema(rawDb)
    seedData(rawDb)
  })

  it('creator (old employee) sees contract before transfer', async () => {
    const call = makeCaller(rawDb, { userId: U_EMP_OLD, tenantId: TENANT, roleId: 4 })
    const res = await call('/api/contract-tables/contracts')
    const body = await res.json() as any
    assert.equal(res.status, 200)
    const ids = (body.data || []).map((r: any) => r.id)
    assert.deepEqual(ids, [CONTRACT_ID], 'old employee sees contract while still assigned')
  })

  it('after transfer: old employee loses access; new employee gains it', async () => {
    // Simulate transfer accept: swap customer_assignments row
    rawDb.prepare(`DELETE FROM customer_assignments WHERE customer_id = ? AND employee_id = ?`).run(C, U_EMP_OLD)
    rawDb.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?, ?)`).run(C, U_EMP_NEW)

    const oldCall = makeCaller(rawDb, { userId: U_EMP_OLD, tenantId: TENANT, roleId: 4 })
    const oldList = await (await oldCall('/api/contract-tables/contracts')).json() as any
    assert.deepEqual((oldList.data || []).map((r: any) => r.id), [], 'old employee no longer lists the contract')

    const oldGet = await oldCall(`/api/contract-tables/contracts/${CONTRACT_ID}`)
    assert.equal(oldGet.status, 404, 'old employee cannot GET single contract')

    const newCall = makeCaller(rawDb, { userId: U_EMP_NEW, tenantId: TENANT, roleId: 4 })
    const newList = await (await newCall('/api/contract-tables/contracts')).json() as any
    assert.deepEqual((newList.data || []).map((r: any) => r.id), [CONTRACT_ID], 'new employee sees contract')

    const newGet = await newCall(`/api/contract-tables/contracts/${CONTRACT_ID}`)
    assert.equal(newGet.status, 200, 'new employee can GET single contract')
  })

  it('after transfer: new employee can PATCH form fields; old employee gets 403', async () => {
    rawDb.prepare(`DELETE FROM customer_assignments WHERE customer_id = ? AND employee_id = ?`).run(C, U_EMP_OLD)
    rawDb.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?, ?)`).run(C, U_EMP_NEW)

    const oldCall = makeCaller(rawDb, { userId: U_EMP_OLD, tenantId: TENANT, roleId: 4 })
    const oldPatch = await oldCall(`/api/contract-tables/contracts/${CONTRACT_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ party_one_name: 'hacked by old' }),
    })
    assert.equal(oldPatch.status, 403, 'old employee blocked by row guard')

    const newCall = makeCaller(rawDb, { userId: U_EMP_NEW, tenantId: TENANT, roleId: 4 })
    const newPatch = await newCall(`/api/contract-tables/contracts/${CONTRACT_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ party_one_name: 'set by new employee' }),
    })
    assert.equal(newPatch.status, 200, 'new employee can PATCH form fields')

    const row = rawDb.prepare(`SELECT party_one_name FROM contracts WHERE id = ?`).get(CONTRACT_ID) as
      { party_one_name: string }
    assert.equal(row.party_one_name, 'set by new employee')
  })

  it('after transfer: new employee can DELETE; old employee cannot', async () => {
    rawDb.prepare(`DELETE FROM customer_assignments WHERE customer_id = ? AND employee_id = ?`).run(C, U_EMP_OLD)
    rawDb.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?, ?)`).run(C, U_EMP_NEW)

    const oldCall = makeCaller(rawDb, { userId: U_EMP_OLD, tenantId: TENANT, roleId: 4 })
    const oldDel = await oldCall(`/api/contract-tables/contracts/${CONTRACT_ID}`, { method: 'DELETE' })
    assert.equal(oldDel.status, 403)

    const newCall = makeCaller(rawDb, { userId: U_EMP_NEW, tenantId: TENANT, roleId: 4 })
    const newDel = await newCall(`/api/contract-tables/contracts/${CONTRACT_ID}`, { method: 'DELETE' })
    assert.equal(newDel.status, 204)

    const row = rawDb.prepare(`SELECT id FROM contracts WHERE id = ?`).get(CONTRACT_ID)
    assert.equal(row, undefined, 'contract deleted')
  })
})

describe('contracts scope for role 6 (employee path)', () => {
  let rawDb: Database.Database

  beforeEach(() => {
    rawDb = new Database(':memory:')
    seedSchema(rawDb)
    seedData(rawDb)
    // Reassign customer to role 6 as employee to exercise the role 6 employee branch
    rawDb.prepare(`DELETE FROM customer_assignments WHERE customer_id = ?`).run(C)
    rawDb.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?, ?)`).run(C, U_R6)
    // Contract still has created_by = U_EMP_OLD to prove the scope no longer keys off created_by
  })

  it('role 6 sees contract via employee assignment even when not the creator', async () => {
    const call = makeCaller(rawDb, { userId: U_R6, tenantId: TENANT, roleId: 6 })
    const res = await call('/api/contract-tables/contracts')
    const body = await res.json() as any
    assert.deepEqual((body.data || []).map((r: any) => r.id), [CONTRACT_ID])

    const single = await call(`/api/contract-tables/contracts/${CONTRACT_ID}`)
    assert.equal(single.status, 200)
  })

  it('role 6 without employee assignment and without FR bank-agent link is blocked', async () => {
    rawDb.prepare(`DELETE FROM customer_assignments WHERE customer_id = ?`).run(C)
    const call = makeCaller(rawDb, { userId: U_R6, tenantId: TENANT, roleId: 6 })
    const res = await call(`/api/contract-tables/contracts/${CONTRACT_ID}`)
    assert.equal(res.status, 404, 'no assignment, no FR bank-agent link → not visible')
  })
})
