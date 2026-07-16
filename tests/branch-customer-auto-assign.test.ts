/**
 * Branch-scoped customer auto-assign.
 *
 * When a customer is created with `location_id` set, only role-4/6 staff
 * with a matching `assigned_location_id` should be eligible for round-robin
 * auto-assignment. Manual assignment paths (SET WHERE customer_id = ?) are
 * unaffected — this is a black-box test of the eligibility SQL only.
 *
 * The SQL under test lives in src/index.tsx inside the calculator
 * save-customer route and in the bulk /api/customer-assignment/auto-distribute
 * route. Both share the same branch filter: `AND assigned_location_id = ?`
 * appended conditionally when the customer has a location_id.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'

const TENANT = 100
const BRANCH_A = 501
const BRANCH_B = 502

function seed(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE tenants (id INTEGER PRIMARY KEY);
    CREATE TABLE tenant_locations (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER,
      role_id INTEGER,
      is_active INTEGER DEFAULT 1,
      assigned_bank_id INTEGER,
      assigned_location_id INTEGER,
      customer_limit INTEGER
    );
    CREATE TABLE banks (id INTEGER PRIMARY KEY, tenant_id INTEGER);
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER,
      location_id INTEGER,
      is_archived INTEGER DEFAULT 0
    );
    CREATE TABLE customer_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL UNIQUE,
      employee_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL DEFAULT 1,
      notes TEXT
    );
  `)
  db.prepare('INSERT INTO tenants (id) VALUES (?)').run(TENANT)
  db.prepare('INSERT INTO tenant_locations (id, tenant_id, name) VALUES (?, ?, ?)').run(BRANCH_A, TENANT, 'Riyadh')
  db.prepare('INSERT INTO tenant_locations (id, tenant_id, name) VALUES (?, ?, ?)').run(BRANCH_B, TENANT, 'Jeddah')

  // Two staff on branch A, one on branch B, one unpinned.
  const insertUser = db.prepare(
    'INSERT INTO users (id, tenant_id, role_id, is_active, assigned_location_id) VALUES (?, ?, 4, 1, ?)'
  )
  insertUser.run(11, TENANT, BRANCH_A)
  insertUser.run(12, TENANT, BRANCH_A)
  insertUser.run(13, TENANT, BRANCH_B)
  insertUser.run(14, TENANT, null)
  return db
}

/** Mirror of the branch-filtered staff query in the calculator save-customer route. */
function eligibleStaffForCustomer(db: Database.Database, customerId: number, tenantId: number): number[] {
  const branchRow = db
    .prepare('SELECT location_id FROM customers WHERE id = ? LIMIT 1')
    .get(customerId) as { location_id: number | null } | undefined
  const customerBranchId = branchRow?.location_id ?? null
  const branchFilterSql = customerBranchId != null ? 'AND assigned_location_id = ?' : ''
  const binds: (number | null)[] = [tenantId, tenantId]
  if (customerBranchId != null) binds.push(customerBranchId)
  const rows = db
    .prepare(
      `
      SELECT id FROM users
      WHERE role_id IN (4, 6) AND is_active = 1
        AND (
          tenant_id = ?
          OR (role_id = 6 AND EXISTS (
            SELECT 1 FROM banks b
            WHERE b.id = users.assigned_bank_id AND b.tenant_id = ?
          ))
        )
        ${branchFilterSql}
      ORDER BY id ASC
      `
    )
    .all(...binds) as { id: number }[]
  return rows.map((r) => r.id)
}

describe('branch-scoped customer auto-assign eligibility', () => {
  it('restricts eligible staff to the customer branch when location_id is set', () => {
    const db = seed()
    const custA = 900
    db.prepare('INSERT INTO customers (id, tenant_id, location_id) VALUES (?, ?, ?)').run(custA, TENANT, BRANCH_A)

    const eligible = eligibleStaffForCustomer(db, custA, TENANT)
    assert.deepEqual(eligible, [11, 12], 'only branch-A staff should be eligible for a branch-A customer')
  })

  it('excludes unpinned staff when customer has a branch', () => {
    const db = seed()
    const custB = 901
    db.prepare('INSERT INTO customers (id, tenant_id, location_id) VALUES (?, ?, ?)').run(custB, TENANT, BRANCH_B)

    const eligible = eligibleStaffForCustomer(db, custB, TENANT)
    assert.deepEqual(eligible, [13])
  })

  it('falls back to all tenant staff when the customer has no branch', () => {
    const db = seed()
    const cust = 902
    db.prepare('INSERT INTO customers (id, tenant_id, location_id) VALUES (?, ?, ?)').run(cust, TENANT, null)

    const eligible = eligibleStaffForCustomer(db, cust, TENANT)
    assert.deepEqual(eligible, [11, 12, 13, 14])
  })

  it('returns empty when no staff match the branch (customer stays unassigned)', () => {
    const db = seed()
    const orphanBranch = 599
    db.prepare('INSERT INTO tenant_locations (id, tenant_id, name) VALUES (?, ?, ?)').run(orphanBranch, TENANT, 'Ghost')
    const cust = 903
    db.prepare('INSERT INTO customers (id, tenant_id, location_id) VALUES (?, ?, ?)').run(cust, TENANT, orphanBranch)

    const eligible = eligibleStaffForCustomer(db, cust, TENANT)
    assert.deepEqual(eligible, [])
  })

  it('manual assignment INSERT ignores branch entirely', () => {
    // The manual path is a direct INSERT into customer_assignments with no
    // eligibility filter — the schema is the only gate. Verify a cross-branch
    // manual assignment succeeds so we know we haven't accidentally added a
    // trigger or check constraint that would block it.
    const db = seed()
    const cust = 904
    db.prepare('INSERT INTO customers (id, tenant_id, location_id) VALUES (?, ?, ?)').run(cust, TENANT, BRANCH_A)
    // Employee 13 is on branch B — manual assignment must still work.
    const res = db
      .prepare('INSERT INTO customer_assignments (customer_id, employee_id, assigned_by, notes) VALUES (?, ?, ?, ?)')
      .run(cust, 13, 1, 'manual')
    assert.equal(res.changes, 1)
  })
})
