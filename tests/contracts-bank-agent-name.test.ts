/**
 * Contracts list/detail must resolve bank_agent_name for awaiting-bank-agent
 * rows even when contracts.financing_request_id is null and
 * customers.assigned_bank_agent_id is unset — using the customer's FR assignment.
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { Hono } from 'hono'
import { registerContractsModuleApi } from '../src/contracts-module-api.ts'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'

const TENANT = 50
const U_ADMIN = 500
const U_AGENT = 501
const C = 5000
const FR = 5100
const CONTRACT_NO_LINK = 5200
const CONTRACT_LINKED = 5201
const STATUS_AWAITING = 'بانتظار موافقة ممثل البنك'

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

describe('contracts bank_agent_name enrichment', () => {
  let rawDb: Database.Database

  beforeEach(() => {
    rawDb = new Database(':memory:')
    seedSchema(rawDb)
    rawDb
      .prepare(
        `INSERT INTO users (id, full_name, username, tenant_id, role_id) VALUES
          (?, 'Admin', 'admin', ?, 2),
          (?, 'Bank Agent Nora', 'nora', ?, 5)`
      )
      .run(U_ADMIN, TENANT, U_AGENT, TENANT)
    // Customer has no assigned_bank_agent_id — agent lives only on the FR
    rawDb
      .prepare(`INSERT INTO customers (id, tenant_id, full_name, assigned_bank_agent_id) VALUES (?, ?, 'Cust', NULL)`)
      .run(C, TENANT)
    rawDb
      .prepare(
        `INSERT INTO financing_requests (id, customer_id, tenant_id, assigned_bank_agent_id) VALUES (?, ?, ?, ?)`
      )
      .run(FR, C, TENANT, U_AGENT)
  })

  it('resolves agent from customer FR when financing_request_id is null', async () => {
    rawDb
      .prepare(
        `INSERT INTO contracts (id, tenant_id, customer_id, created_by, contract_number, status, is_archived, financing_request_id)
         VALUES (?, ?, ?, ?, 'K-nolink', ?, 0, NULL)`
      )
      .run(CONTRACT_NO_LINK, TENANT, C, U_ADMIN, STATUS_AWAITING)

    const call = makeCaller(rawDb, { userId: U_ADMIN, tenantId: TENANT, roleId: 2 })
    const listRes = await call('/api/contract-tables/contracts')
    assert.equal(listRes.status, 200)
    const listBody = (await listRes.json()) as any
    const row = (listBody.data || []).find((r: any) => r.id === CONTRACT_NO_LINK)
    assert.ok(row, 'contract present in list')
    assert.equal(row.bank_agent_name, 'Bank Agent Nora')

    const getRes = await call(`/api/contract-tables/contracts/${CONTRACT_NO_LINK}`)
    assert.equal(getRes.status, 200)
    const getBody = (await getRes.json()) as any
    assert.equal(getBody.bank_agent_name, 'Bank Agent Nora')
  })

  it('prefers linked financing_request assignment over customer FR fallback', async () => {
    const otherAgent = 502
    rawDb
      .prepare(
        `INSERT INTO users (id, full_name, username, tenant_id, role_id) VALUES (?, 'Linked Agent', 'linked', ?, 5)`
      )
      .run(otherAgent, TENANT)
    const linkedFr = 5101
    rawDb
      .prepare(
        `INSERT INTO financing_requests (id, customer_id, tenant_id, assigned_bank_agent_id) VALUES (?, ?, ?, ?)`
      )
      .run(linkedFr, C, TENANT, otherAgent)
    rawDb
      .prepare(
        `INSERT INTO contracts (id, tenant_id, customer_id, created_by, contract_number, status, is_archived, financing_request_id)
         VALUES (?, ?, ?, ?, 'K-linked', ?, 0, ?)`
      )
      .run(CONTRACT_LINKED, TENANT, C, U_ADMIN, STATUS_AWAITING, linkedFr)

    const call = makeCaller(rawDb, { userId: U_ADMIN, tenantId: TENANT, roleId: 2 })
    const getRes = await call(`/api/contract-tables/contracts/${CONTRACT_LINKED}`)
    assert.equal(getRes.status, 200)
    const getBody = (await getRes.json()) as any
    assert.equal(getBody.bank_agent_name, 'Linked Agent')
  })

  it('falls back to username when full_name is blank', async () => {
    rawDb.prepare(`UPDATE users SET full_name = '' WHERE id = ?`).run(U_AGENT)
    rawDb
      .prepare(
        `INSERT INTO contracts (id, tenant_id, customer_id, created_by, contract_number, status, is_archived, financing_request_id)
         VALUES (?, ?, ?, ?, 'K-user', ?, 0, NULL)`
      )
      .run(CONTRACT_NO_LINK, TENANT, C, U_ADMIN, STATUS_AWAITING)

    const call = makeCaller(rawDb, { userId: U_ADMIN, tenantId: TENANT, roleId: 2 })
    const getRes = await call(`/api/contract-tables/contracts/${CONTRACT_NO_LINK}`)
    assert.equal(getRes.status, 200)
    const getBody = (await getRes.json()) as any
    assert.equal(getBody.bank_agent_name, 'nora')
  })
})
