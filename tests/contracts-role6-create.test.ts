/**
 * Role 4 / 6 contract create requires an active FR with an assigned bank agent.
 * Without that assignee, the contract would enter awaiting-bank-agent with nobody
 * able to approve.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  customerEligibleForContractCreate,
  explainContractCreateDenial,
} from '../src/notification-access.ts'
import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'

const TENANT = 30
const U6 = 60
const U4 = 40
const U_AGENT = 50
const C_EMP = 301
const C_BANK = 302
const C_NO_AGENT = 303
const FR_EMP = 701
const FR_BANK = 702
const FR_NO_AGENT = 703

const NO_AGENT_MSG =
  'لا يمكن إنشاء العقد: طلب التمويل النشط غير مُسند لممثل بنك. عيّن ممثل البنك على طلب التمويل أولاً'

function seed(db: ReturnType<typeof createTestDb>) {
  db.exec(`
    CREATE TABLE contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      tenant_id INTEGER,
      status TEXT,
      is_archived INTEGER DEFAULT 0
    );
    DROP TABLE IF EXISTS financing_requests;
    CREATE TABLE financing_requests (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      tenant_id INTEGER,
      assigned_bank_agent_id INTEGER,
      is_completed INTEGER DEFAULT 0
    );
  `)
  db.prepare(`INSERT INTO customers (id, tenant_id, assigned_bank_agent_id) VALUES (?,?,?)`).run(
    C_EMP,
    TENANT,
    null
  )
  db.prepare(`INSERT INTO customers (id, tenant_id, assigned_bank_agent_id) VALUES (?,?,?)`).run(
    C_BANK,
    TENANT,
    U6
  )
  db.prepare(`INSERT INTO customers (id, tenant_id, assigned_bank_agent_id) VALUES (?,?,?)`).run(
    C_NO_AGENT,
    TENANT,
    null
  )
  db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C_EMP, U6)
  db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C_NO_AGENT, U4)
  db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C_NO_AGENT, U6)
  // Employee-path FR must have a bank agent for create to be allowed
  db.prepare(
    `INSERT INTO financing_requests (id, customer_id, tenant_id, assigned_bank_agent_id) VALUES (?,?,?,?)`
  ).run(FR_EMP, C_EMP, TENANT, U_AGENT)
  db.prepare(
    `INSERT INTO financing_requests (id, customer_id, tenant_id, assigned_bank_agent_id) VALUES (?,?,?,?)`
  ).run(FR_BANK, C_BANK, TENANT, U6)
  db.prepare(
    `INSERT INTO financing_requests (id, customer_id, tenant_id, assigned_bank_agent_id) VALUES (?,?,?,?)`
  ).run(FR_NO_AGENT, C_NO_AGENT, TENANT, null)
}

describe('role 6 contract create eligibility', () => {
  it('allows employee-assigned customer when FR has a bank agent', async () => {
    const db = createTestDb()
    seed(db)
    const d1 = createSqliteD1(db)
    const ok = await customerEligibleForContractCreate(d1, {
      customerId: C_EMP,
      tenantId: TENANT,
      userId: U6,
      roleId: 6,
    })
    assert.equal(ok, true)
  })

  it('allows bank-agent-only customer without employee assignment row', async () => {
    const db = createTestDb()
    seed(db)
    const d1 = createSqliteD1(db)
    const ok = await customerEligibleForContractCreate(d1, {
      customerId: C_BANK,
      tenantId: TENANT,
      userId: U6,
      roleId: 6,
    })
    assert.equal(ok, true)
  })

  it('blocks role 6 when active FR has no bank agent', async () => {
    const db = createTestDb()
    seed(db)
    const d1 = createSqliteD1(db)
    const denial = await explainContractCreateDenial(d1, {
      customerId: C_NO_AGENT,
      tenantId: TENANT,
      userId: U6,
      roleId: 6,
    })
    assert.equal(denial, NO_AGENT_MSG)
  })
})

describe('role 4 contract create requires FR bank agent', () => {
  it('allows when active FR has a bank agent', async () => {
    const db = createTestDb()
    seed(db)
    db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C_EMP, U4)
    const d1 = createSqliteD1(db)
    const ok = await customerEligibleForContractCreate(d1, {
      customerId: C_EMP,
      tenantId: TENANT,
      userId: U4,
      roleId: 4,
    })
    assert.equal(ok, true)
  })

  it('blocks with clear message when active FR has no bank agent', async () => {
    const db = createTestDb()
    seed(db)
    const d1 = createSqliteD1(db)
    const denial = await explainContractCreateDenial(d1, {
      customerId: C_NO_AGENT,
      tenantId: TENANT,
      userId: U4,
      roleId: 4,
    })
    assert.equal(denial, NO_AGENT_MSG)
  })
})
