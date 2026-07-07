/**
 * Staff role change restrictions (roles 4, 5, 6).
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  validateStaffRoleChange,
  hasEmployeeColumnAssignments,
  hasBankAgentColumnAssignments,
  hasDualAgentAssignments,
} from '../src/notification-access.ts'
import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'

const TENANT = 30
const U4 = 40
const U5 = 41
const U6 = 42
const C1 = 301
const FR1 = 701

function seedBase(db: ReturnType<typeof createTestDb>) {
  db.prepare(`
    INSERT INTO users (id, full_name, tenant_id, role_id, is_active) VALUES
    (${U4}, 'Employee', ${TENANT}, 4, 1),
    (${U5}, 'BankAgent', ${TENANT}, 5, 1),
    (${U6}, 'Dual', ${TENANT}, 6, 1)
  `).run()
  db.prepare(
    `INSERT INTO customers (id, tenant_id, assigned_bank_agent_id, created_by) VALUES (?,?,?,?)`
  ).run(C1, TENANT, null, U4)
}

describe('validateStaffRoleChange — role 4 ↔ 5', () => {
  it('blocks role 4 → 5 when employee assignments exist', async () => {
    const db = createTestDb()
    seedBase(db)
    db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C1, U4)
    const d1 = createSqliteD1(db)
    const result = await validateStaffRoleChange(d1, U4, 4, 5)
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.error, /employee/i)
  })

  it('allows role 4 → 5 with no assignments', async () => {
    const db = createTestDb()
    seedBase(db)
    const d1 = createSqliteD1(db)
    const result = await validateStaffRoleChange(d1, U4, 4, 5)
    assert.equal(result.ok, true)
  })

  it('blocks role 5 → 4 when bank-agent assignments exist', async () => {
    const db = createTestDb()
    seedBase(db)
    db.prepare(`UPDATE customers SET assigned_bank_agent_id = ? WHERE id = ?`).run(U5, C1)
    const d1 = createSqliteD1(db)
    const result = await validateStaffRoleChange(d1, U5, 5, 4)
    assert.equal(result.ok, false)
    if (!result.ok) assert.match(result.error, /bank agent/i)
  })

  it('allows role 5 → 4 with no bank-agent assignments', async () => {
    const db = createTestDb()
    seedBase(db)
    const d1 = createSqliteD1(db)
    const result = await validateStaffRoleChange(d1, U5, 5, 4)
    assert.equal(result.ok, true)
  })

  it('blocks role 5 → 4 when only financing_requests has bank-agent assignment', async () => {
    const db = createTestDb()
    seedBase(db)
    db.prepare(
      `INSERT INTO financing_requests (id, customer_id, assigned_bank_agent_id, created_by) VALUES (?,?,?,?)`
    ).run(FR1, C1, U5, U4)
    const d1 = createSqliteD1(db)
    assert.equal(await hasBankAgentColumnAssignments(d1, U5), true)
    const result = await validateStaffRoleChange(d1, U5, 5, 4)
    assert.equal(result.ok, false)
  })
})

describe('validateStaffRoleChange — promotion to role 6', () => {
  it('allows role 4 → 6 even with employee assignments', async () => {
    const db = createTestDb()
    seedBase(db)
    db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C1, U4)
    const d1 = createSqliteD1(db)
    const result = await validateStaffRoleChange(d1, U4, 4, 6)
    assert.equal(result.ok, true)
  })

  it('allows role 5 → 6 even with bank-agent assignments', async () => {
    const db = createTestDb()
    seedBase(db)
    db.prepare(`UPDATE customers SET assigned_bank_agent_id = ? WHERE id = ?`).run(U5, C1)
    const d1 = createSqliteD1(db)
    const result = await validateStaffRoleChange(d1, U5, 5, 6)
    assert.equal(result.ok, true)
  })
})

describe('validateStaffRoleChange — role 6 demotion', () => {
  it('blocks role 6 → 4 when dual-assigned on same customer', async () => {
    const db = createTestDb()
    seedBase(db)
    db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C1, U6)
    db.prepare(`UPDATE customers SET assigned_bank_agent_id = ? WHERE id = ?`).run(U6, C1)
    const d1 = createSqliteD1(db)
    assert.equal(await hasDualAgentAssignments(d1, U6), true)
    const result = await validateStaffRoleChange(d1, U6, 6, 4)
    assert.equal(result.ok, false)
  })

  it('allows role 6 → 4 when only employee-assigned', async () => {
    const db = createTestDb()
    seedBase(db)
    db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C1, U6)
    const d1 = createSqliteD1(db)
    assert.equal(await hasDualAgentAssignments(d1, U6), false)
    const result = await validateStaffRoleChange(d1, U6, 6, 4)
    assert.equal(result.ok, true)
  })

  it('allows role 6 → 5 when only bank-agent-assigned', async () => {
    const db = createTestDb()
    seedBase(db)
    db.prepare(`UPDATE customers SET assigned_bank_agent_id = ? WHERE id = ?`).run(U6, C1)
    const d1 = createSqliteD1(db)
    const result = await validateStaffRoleChange(d1, U6, 6, 5)
    assert.equal(result.ok, true)
  })
})

describe('validateStaffRoleChange — legacy role ids', () => {
  it('normalizes legacy 14 → 15 as 4 → 5', async () => {
    const db = createTestDb()
    seedBase(db)
    db.prepare(`UPDATE users SET role_id = 14 WHERE id = ?`).run(U4)
    db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C1, U4)
    const d1 = createSqliteD1(db)
    const result = await validateStaffRoleChange(d1, U4, 14, 15)
    assert.equal(result.ok, false)
  })
})
