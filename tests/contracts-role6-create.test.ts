/**
 * Role 6 contract create eligibility — employee and bank-agent columns.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { customerEligibleForContractCreate } from '../src/notification-access.ts'
import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'

const TENANT = 30
const U6 = 60
const C_EMP = 301
const C_BANK = 302
const FR_EMP = 701
const FR_BANK = 702

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
  db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C_EMP, U6)
  db.prepare(
    `INSERT INTO financing_requests (id, customer_id, tenant_id, assigned_bank_agent_id) VALUES (?,?,?,?)`
  ).run(FR_EMP, C_EMP, TENANT, null)
  db.prepare(
    `INSERT INTO financing_requests (id, customer_id, tenant_id, assigned_bank_agent_id) VALUES (?,?,?,?)`
  ).run(FR_BANK, C_BANK, TENANT, U6)
}

describe('role 6 contract create eligibility', () => {
  it('allows employee-assigned customer', async () => {
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
})
