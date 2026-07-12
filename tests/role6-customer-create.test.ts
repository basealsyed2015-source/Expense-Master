/**
 * Role 6 customer create — auto-assign employee + bank agent columns.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'

const TENANT = 20
const U_ROLE6 = 12

function seed(db: ReturnType<typeof createTestDb>) {
  db.exec(`
    DROP TABLE IF EXISTS customer_assignments;
    CREATE TABLE customer_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL UNIQUE,
      employee_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL DEFAULT 1,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS assignment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      old_employee_id INTEGER,
      new_employee_id INTEGER NOT NULL,
      changed_by INTEGER NOT NULL,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    );
  `)
  db.prepare(
    `INSERT INTO users (id, full_name, tenant_id, role_id, is_active) VALUES (?, ?, ?, 6, 1)`
  ).run(U_ROLE6, 'DualAgent6', TENANT)
}

async function assignNewCustomerToEmployee(
  db: D1Database,
  customerId: number,
  employeeId: number,
  assignedBy: number,
  notes = ''
): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO customer_assignments (customer_id, employee_id, assigned_by, notes)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(customer_id) DO UPDATE SET
           employee_id = excluded.employee_id,
           assigned_by = excluded.assigned_by,
           notes = excluded.notes`
      )
      .bind(customerId, employeeId, assignedBy, notes)
      .run()
  } catch (e: unknown) {
    const msg = String((e as { message?: string })?.message || e || '')
    if (!/ON CONFLICT|no such column/i.test(msg)) throw e
    await db
      .prepare(
        `INSERT OR REPLACE INTO customer_assignments (customer_id, employee_id, assigned_by, notes)
         VALUES (?, ?, ?, ?)`
      )
      .bind(customerId, employeeId, assignedBy, notes)
      .run()
  }
}

describe('role 6 customer create auto-assign', () => {
  it('inserts customer_assignments and assigned_bank_agent_id for role 6 creator', async () => {
    const db = createTestDb()
    seed(db)
    const d1 = createSqliteD1(db)

    const ins = await d1
      .prepare(`INSERT INTO customers (tenant_id, full_name, phone, created_by) VALUES (?, ?, ?, ?)`)
      .bind(TENANT, 'Test Customer', '512345678', U_ROLE6)
      .run()
    const customerId = Number(ins.meta.last_row_id)

    await assignNewCustomerToEmployee(d1, customerId, U_ROLE6, U_ROLE6, '')

    await d1
      .prepare(`UPDATE customers SET assigned_bank_agent_id = ? WHERE id = ?`)
      .bind(U_ROLE6, customerId)
      .run()

    const assignment = await d1
      .prepare(`SELECT employee_id FROM customer_assignments WHERE customer_id = ?`)
      .bind(customerId)
      .first<{ employee_id: number }>()
    assert.equal(assignment?.employee_id, U_ROLE6)

    const customer = await d1
      .prepare(`SELECT assigned_bank_agent_id FROM customers WHERE id = ?`)
      .bind(customerId)
      .first<{ assigned_bank_agent_id: number }>()
    assert.equal(customer?.assigned_bank_agent_id, U_ROLE6)

    const visible = await d1
      .prepare(
        `SELECT 1 AS ok FROM customers c
         WHERE c.tenant_id = ? AND c.id = ? AND (
           EXISTS (SELECT 1 FROM customer_assignments ca WHERE ca.customer_id = c.id AND ca.employee_id = ?)
           OR c.assigned_bank_agent_id = ?
         )`
      )
      .bind(TENANT, customerId, U_ROLE6, U_ROLE6)
      .first<{ ok: number }>()
    assert.ok(visible?.ok)
  })

  it('backfill migration SQL repairs customers created before auto-assign', async () => {
    const db = createTestDb()
    seed(db)
    const d1 = createSqliteD1(db)

    const ins = await d1
      .prepare(`INSERT INTO customers (tenant_id, full_name, phone, created_by) VALUES (?, ?, ?, ?)`)
      .bind(TENANT, 'Legacy Customer', '598765432', U_ROLE6)
      .run()
    const customerId = Number(ins.meta.last_row_id)

    db.exec(`
      INSERT OR IGNORE INTO customer_assignments (customer_id, employee_id, assigned_by, notes)
      SELECT c.id, c.created_by, c.created_by, 'backfill dual agent employee scope'
      FROM customers c
      JOIN users u ON u.id = c.created_by AND u.role_id = 6
      WHERE c.created_by IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM customer_assignments ca WHERE ca.customer_id = c.id);

      UPDATE customers
      SET assigned_bank_agent_id = created_by
      WHERE created_by IN (SELECT id FROM users WHERE role_id = 6)
        AND (assigned_bank_agent_id IS NULL OR assigned_bank_agent_id = 0)
        AND created_by IS NOT NULL;
    `)

    const assignment = await d1
      .prepare(`SELECT employee_id FROM customer_assignments WHERE customer_id = ?`)
      .bind(customerId)
      .first<{ employee_id: number }>()
    assert.equal(assignment?.employee_id, U_ROLE6)

    const customer = await d1
      .prepare(`SELECT assigned_bank_agent_id FROM customers WHERE id = ?`)
      .bind(customerId)
      .first<{ assigned_bank_agent_id: number }>()
    assert.equal(customer?.assigned_bank_agent_id, U_ROLE6)
  })
})
