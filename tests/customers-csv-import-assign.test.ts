/**
 * CSV import auto-assignment — employee and bank-agent distribution.
 *
 * Tests the two exported helpers used by POST /api/customers/import-csv:
 *   - distributeCustomersToEmployees: mirrors auto-distribute rules (customer_limit, cursor)
 *   - distributeCustomersToBankAgents: simple round-robin across roles 5/6/15
 *
 * Key invariants:
 *   - Employees at their customer_limit are skipped
 *   - The tenant_customer_auto_assign_state cursor is read and updated
 *   - Role 6 (dual agent) appears in BOTH employee and bank-agent pools
 *   - Inactive users are excluded from both pools
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'
import { distributeCustomersToEmployees, distributeCustomersToBankAgents } from '../src/csv-import-assign.ts'

const TENANT = 1
const OTHER_TENANT = 2

function seed(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE tenants (id INTEGER PRIMARY KEY);
    CREATE TABLE banks (id INTEGER PRIMARY KEY, tenant_id INTEGER);
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER,
      role_id INTEGER,
      is_active INTEGER DEFAULT 1,
      assigned_bank_id INTEGER,
      customer_limit INTEGER
    );
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER,
      assigned_bank_agent_id INTEGER
    );
    CREATE TABLE customer_assignments (
      customer_id INTEGER NOT NULL UNIQUE,
      employee_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL DEFAULT 1,
      notes TEXT
    );
    CREATE TABLE assignment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      old_employee_id INTEGER,
      new_employee_id INTEGER,
      changed_by INTEGER,
      notes TEXT
    );
    CREATE TABLE financing_requests (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      assigned_bank_agent_id INTEGER
    );
    CREATE TABLE tenant_customer_auto_assign_state (
      tenant_id INTEGER PRIMARY KEY,
      last_auto_assigned_user_id INTEGER,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
  db.prepare('INSERT INTO tenants (id) VALUES (?)').run(TENANT)
  db.prepare('INSERT INTO tenants (id) VALUES (?)').run(OTHER_TENANT)
  return db
}

function addUser(db: Database.Database, id: number, roleId: number, opts: {
  tenantId?: number
  isActive?: number
  customerLimit?: number | null
  assignedBankId?: number | null
} = {}) {
  db.prepare(`
    INSERT INTO users (id, tenant_id, role_id, is_active, customer_limit, assigned_bank_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, opts.tenantId ?? TENANT, roleId, opts.isActive ?? 1, opts.customerLimit ?? null, opts.assignedBankId ?? null)
}

function addCustomer(db: Database.Database, id: number) {
  db.prepare('INSERT INTO customers (id, tenant_id) VALUES (?, ?)').run(id, TENANT)
}

function getAssignedEmployee(db: Database.Database, customerId: number): number | null {
  const row = db.prepare('SELECT employee_id FROM customer_assignments WHERE customer_id = ?').get(customerId) as { employee_id: number } | undefined
  return row?.employee_id ?? null
}

function getBankAgent(db: Database.Database, customerId: number): number | null {
  const row = db.prepare('SELECT assigned_bank_agent_id FROM customers WHERE id = ?').get(customerId) as { assigned_bank_agent_id: number | null } | undefined
  return row?.assigned_bank_agent_id ?? null
}

function getCursor(db: Database.Database): number | null {
  const row = db.prepare('SELECT last_auto_assigned_user_id FROM tenant_customer_auto_assign_state WHERE tenant_id = ?').get(TENANT) as { last_auto_assigned_user_id: number | null } | undefined
  return row?.last_auto_assigned_user_id ?? null
}

// ─── Employee distribution ────────────────────────────────────────────────────

describe('distributeCustomersToEmployees', () => {
  it('round-robins across role-4 employees in id order', async () => {
    const db = seed()
    addUser(db, 10, 4)
    addUser(db, 11, 4)
    addCustomer(db, 101)
    addCustomer(db, 102)
    addCustomer(db, 103)

    const count = await distributeCustomersToEmployees(createSqliteD1(db), TENANT, [101, 102, 103], 1)
    assert.equal(count, 3)
    assert.equal(getAssignedEmployee(db, 101), 10)
    assert.equal(getAssignedEmployee(db, 102), 11)
    assert.equal(getAssignedEmployee(db, 103), 10)
  })

  it('skips employees at their customer_limit', async () => {
    const db = seed()
    addUser(db, 10, 4, { customerLimit: 1 })
    addUser(db, 11, 4, { customerLimit: 999 })
    // Pre-fill employee 10 to their limit
    db.prepare('INSERT INTO customer_assignments (customer_id, employee_id, assigned_by) VALUES (?, ?, 1)').run(999, 10)
    addCustomer(db, 101)
    addCustomer(db, 102)

    await distributeCustomersToEmployees(createSqliteD1(db), TENANT, [101, 102], 1)
    // Employee 10 is full — both should go to employee 11
    assert.equal(getAssignedEmployee(db, 101), 11)
    assert.equal(getAssignedEmployee(db, 102), 11)
  })

  it('resumes from cursor — starts after last assigned user', async () => {
    const db = seed()
    addUser(db, 10, 4)
    addUser(db, 11, 4)
    addUser(db, 12, 4)
    // Cursor says last assigned was user 11, so next should be 12
    db.prepare('INSERT INTO tenant_customer_auto_assign_state (tenant_id, last_auto_assigned_user_id) VALUES (?, ?)').run(TENANT, 11)
    addCustomer(db, 101)
    addCustomer(db, 102)

    await distributeCustomersToEmployees(createSqliteD1(db), TENANT, [101, 102], 1)
    assert.equal(getAssignedEmployee(db, 101), 12)
    assert.equal(getAssignedEmployee(db, 102), 10) // wraps around past 11
  })

  it('updates cursor after distribution', async () => {
    const db = seed()
    addUser(db, 10, 4)
    addUser(db, 11, 4)
    addCustomer(db, 101)
    addCustomer(db, 102)

    await distributeCustomersToEmployees(createSqliteD1(db), TENANT, [101, 102], 1)
    // Last assigned was user 11
    assert.equal(getCursor(db), 11)
  })

  it('excludes inactive employees', async () => {
    const db = seed()
    addUser(db, 10, 4, { isActive: 0 })
    addUser(db, 11, 4, { isActive: 1 })
    addCustomer(db, 101)

    await distributeCustomersToEmployees(createSqliteD1(db), TENANT, [101], 1)
    assert.equal(getAssignedEmployee(db, 101), 11)
  })

  it('returns 0 and assigns nothing when no eligible employees', async () => {
    const db = seed()
    // No employees at all
    addCustomer(db, 101)

    const count = await distributeCustomersToEmployees(createSqliteD1(db), TENANT, [101], 1)
    assert.equal(count, 0)
    assert.equal(getAssignedEmployee(db, 101), null)
  })

  it('role-6 dual agent counts as employee', async () => {
    const db = seed()
    addUser(db, 10, 4) // regular employee
    addUser(db, 11, 6) // dual agent
    addCustomer(db, 101)
    addCustomer(db, 102)

    await distributeCustomersToEmployees(createSqliteD1(db), TENANT, [101, 102], 1)
    // Both should be assigned — role 6 is eligible
    assert.notEqual(getAssignedEmployee(db, 101), null)
    assert.notEqual(getAssignedEmployee(db, 102), null)
    const assigned = [getAssignedEmployee(db, 101), getAssignedEmployee(db, 102)]
    assert.ok(assigned.includes(11), 'dual agent (role 6) should receive customers as employee')
  })

  it('does not assign employees from a different tenant', async () => {
    const db = seed()
    addUser(db, 10, 4, { tenantId: OTHER_TENANT })
    addUser(db, 11, 4, { tenantId: TENANT })
    addCustomer(db, 101)

    await distributeCustomersToEmployees(createSqliteD1(db), TENANT, [101], 1)
    assert.equal(getAssignedEmployee(db, 101), 11)
  })

  it('stops distributing once all employees are at limit', async () => {
    const db = seed()
    addUser(db, 10, 4, { customerLimit: 1 })
    addUser(db, 11, 4, { customerLimit: 1 })
    // Pre-fill both
    db.prepare('INSERT INTO customer_assignments (customer_id, employee_id, assigned_by) VALUES (?, ?, 1)').run(998, 10)
    db.prepare('INSERT INTO customer_assignments (customer_id, employee_id, assigned_by) VALUES (?, ?, 1)').run(999, 11)
    addCustomer(db, 101)
    addCustomer(db, 102)

    const count = await distributeCustomersToEmployees(createSqliteD1(db), TENANT, [101, 102], 1)
    assert.equal(count, 0)
  })
})

// ─── Bank agent distribution ──────────────────────────────────────────────────

describe('distributeCustomersToBankAgents', () => {
  it('round-robins across role-5 agents in id order', async () => {
    const db = seed()
    addUser(db, 20, 5)
    addUser(db, 21, 5)
    addCustomer(db, 101)
    addCustomer(db, 102)
    addCustomer(db, 103)

    await distributeCustomersToBankAgents(createSqliteD1(db), TENANT, [101, 102, 103])
    assert.equal(getBankAgent(db, 101), 20)
    assert.equal(getBankAgent(db, 102), 21)
    assert.equal(getBankAgent(db, 103), 20)
  })

  it('role-6 dual agent counts as bank agent', async () => {
    const db = seed()
    addUser(db, 20, 5)  // bank agent
    addUser(db, 21, 6)  // dual agent
    addCustomer(db, 101)
    addCustomer(db, 102)

    await distributeCustomersToBankAgents(createSqliteD1(db), TENANT, [101, 102])
    const agents = [getBankAgent(db, 101), getBankAgent(db, 102)]
    assert.ok(agents.includes(21), 'dual agent (role 6) should receive customers as bank agent')
  })

  it('includes bank agents scoped by assigned_bank_id to tenant bank', async () => {
    const db = seed()
    db.prepare('INSERT INTO banks (id, tenant_id) VALUES (?, ?)').run(5, TENANT)
    // Agent assigned to bank 5 which belongs to TENANT — should be included
    addUser(db, 20, 5, { tenantId: null, assignedBankId: 5 })
    addCustomer(db, 101)

    await distributeCustomersToBankAgents(createSqliteD1(db), TENANT, [101])
    assert.equal(getBankAgent(db, 101), 20)
  })

  it('excludes inactive bank agents', async () => {
    const db = seed()
    addUser(db, 20, 5, { isActive: 0 })
    addUser(db, 21, 5, { isActive: 1 })
    addCustomer(db, 101)

    await distributeCustomersToBankAgents(createSqliteD1(db), TENANT, [101])
    assert.equal(getBankAgent(db, 101), 21)
  })

  it('syncs financing_requests.assigned_bank_agent_id when customer has FRs', async () => {
    const db = seed()
    addUser(db, 20, 5)
    addCustomer(db, 101)
    // Pre-existing FR pointing at a stale agent
    db.prepare('INSERT INTO financing_requests (id, customer_id, assigned_bank_agent_id) VALUES (?, ?, ?)').run(500, 101, 99)
    db.prepare('INSERT INTO financing_requests (id, customer_id, assigned_bank_agent_id) VALUES (?, ?, ?)').run(501, 101, 99)

    await distributeCustomersToBankAgents(createSqliteD1(db), TENANT, [101])

    assert.equal(getBankAgent(db, 101), 20)
    const frRows = db.prepare('SELECT id, assigned_bank_agent_id FROM financing_requests WHERE customer_id = ? ORDER BY id').all(101) as { id: number; assigned_bank_agent_id: number }[]
    assert.deepEqual(frRows.map((r) => r.assigned_bank_agent_id), [20, 20], 'all FRs for the customer synced to new agent')
  })

  it('returns 0 and assigns nothing when no agents available', async () => {
    const db = seed()
    addCustomer(db, 101)

    const count = await distributeCustomersToBankAgents(createSqliteD1(db), TENANT, [101])
    assert.equal(count, 0)
    assert.equal(getBankAgent(db, 101), null)
  })
})

// ─── Dual agent appears in both pools ────────────────────────────────────────

describe('dual agent (role 6) — appears in both pools', () => {
  it('single role-6 user receives customer as both employee AND bank agent', async () => {
    const db = seed()
    addUser(db, 30, 6)
    addCustomer(db, 101)

    await distributeCustomersToEmployees(createSqliteD1(db), TENANT, [101], 1)
    await distributeCustomersToBankAgents(createSqliteD1(db), TENANT, [101])

    assert.equal(getAssignedEmployee(db, 101), 30, 'dual agent assigned as employee')
    assert.equal(getBankAgent(db, 101), 30, 'dual agent assigned as bank agent')
  })
})
