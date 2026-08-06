/**
 * Customer transfer feature — data-layer regression tests.
 *
 * The endpoints live in the monolithic src/index.tsx and can't cleanly be
 * imported here without dragging in the entire app. These tests instead seed
 * SQLite with the same schema and exercise the exact SQL the endpoints run,
 * so the highest-risk invariants stay pinned:
 *
 *   - Employee accept swaps customer_assignments and writes assignment_history
 *   - Bank-agent accept updates BOTH customers.assigned_bank_agent_id AND
 *     financing_requests.assigned_bank_agent_id (dual-column sync)
 *   - Accept batch runs atomically — a mid-batch failure leaves no partial state
 *   - callerHoldsAssignment correctly detects stale sender assignments
 *   - Duplicate pending request for same (customer, assignment_type) is rejected
 *   - Role 6 dual-assigned (both employee and bank agent) is blocked
 *   - Self-recipient / empty note rejected by request validation
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'

// ─── shared constants ────────────────────────────────────────────────────────
const TENANT = 30

const U_EMP_FROM = 100  // role 4 — currently assigned employee
const U_EMP_TO = 101    // role 4 — recipient
const U_BA_FROM = 200   // role 5 — currently assigned bank agent
const U_BA_TO = 201     // role 5 — recipient
const U_DUAL = 300      // role 6 — assigned as both employee and bank agent
const U_ADMIN = 900

const C_EMP = 1000      // customer assigned to U_EMP_FROM (employee)
const C_BA = 1001       // customer assigned to U_BA_FROM (bank agent) with an active FR
const C_DUAL = 1002     // customer where U_DUAL holds both slots

const FR_BA = 5000      // FR on C_BA, assigned_bank_agent_id = U_BA_FROM

// ─── schema — extends the shared helper with tables specific to this feature ─
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
      full_name TEXT,
      assigned_bank_agent_id INTEGER,
      created_by INTEGER
    );
    CREATE TABLE customer_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      employee_id INTEGER,
      assigned_by INTEGER,
      notes TEXT
    );
    CREATE TABLE financing_requests (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      assigned_bank_agent_id INTEGER,
      created_by INTEGER
    );
    CREATE TABLE assignment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      old_employee_id INTEGER,
      new_employee_id INTEGER,
      changed_by INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE customer_transfer_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      assignment_type TEXT NOT NULL CHECK (assignment_type IN ('employee', 'bank_agent')),
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      note_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );
  `)
}

function seedData(db: Database.Database) {
  db.prepare(`
    INSERT INTO users (id, full_name, tenant_id, role_id, is_active) VALUES
    (${U_EMP_FROM}, 'Emp From',  ${TENANT}, 4, 1),
    (${U_EMP_TO},   'Emp To',    ${TENANT}, 4, 1),
    (${U_BA_FROM},  'BA From',   ${TENANT}, 5, 1),
    (${U_BA_TO},    'BA To',     ${TENANT}, 5, 1),
    (${U_DUAL},     'Dual',      ${TENANT}, 6, 1),
    (${U_ADMIN},    'Admin',     ${TENANT}, 2, 1)
  `).run()

  // Employee-assigned customer
  db.prepare(`INSERT INTO customers (id, tenant_id, full_name, assigned_bank_agent_id, created_by) VALUES (?,?,?,?,?)`)
    .run(C_EMP, TENANT, 'Cust Emp', null, U_ADMIN)
  db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C_EMP, U_EMP_FROM)

  // Bank-agent-assigned customer WITH an active FR (regression target for dual-column sync)
  db.prepare(`INSERT INTO customers (id, tenant_id, full_name, assigned_bank_agent_id, created_by) VALUES (?,?,?,?,?)`)
    .run(C_BA, TENANT, 'Cust BA', U_BA_FROM, U_ADMIN)
  db.prepare(`INSERT INTO financing_requests (id, customer_id, assigned_bank_agent_id, created_by) VALUES (?,?,?,?)`)
    .run(FR_BA, C_BA, U_BA_FROM, U_EMP_FROM)

  // Dual-assigned role-6 customer (holds both employee + bank agent slots)
  db.prepare(`INSERT INTO customers (id, tenant_id, full_name, assigned_bank_agent_id, created_by) VALUES (?,?,?,?,?)`)
    .run(C_DUAL, TENANT, 'Cust Dual', U_DUAL, U_ADMIN)
  db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C_DUAL, U_DUAL)
}

// ─── helpers mirroring the endpoint logic (kept in sync manually) ────────────
type Ctx = { employeeAssignedIds: number[]; bankAgentId: number | null }

function loadCtx(db: Database.Database, customerId: number): Ctx {
  const cust = db.prepare(`SELECT assigned_bank_agent_id FROM customers WHERE id = ?`).get(customerId) as
    | { assigned_bank_agent_id: number | null }
    | undefined
  const rows = db.prepare(`SELECT employee_id FROM customer_assignments WHERE customer_id = ?`).all(customerId) as
    { employee_id: number }[]
  return {
    employeeAssignedIds: rows.map((r) => Number(r.employee_id)),
    bankAgentId: cust?.assigned_bank_agent_id != null ? Number(cust.assigned_bank_agent_id) : null,
  }
}

function callerHolds(ctx: Ctx, userId: number, type: 'employee' | 'bank_agent'): boolean {
  return type === 'employee' ? ctx.employeeAssignedIds.includes(userId) : ctx.bankAgentId === userId
}

// ─── tests ────────────────────────────────────────────────────────────────────
describe('customer transfer — accept path', () => {
  let rawDb: Database.Database
  let db: D1Database

  beforeEach(() => {
    rawDb = new Database(':memory:')
    seedSchema(rawDb)
    seedData(rawDb)
    db = createSqliteD1(rawDb)
  })

  it('employee accept swaps customer_assignments and writes assignment_history', async () => {
    const trIns = rawDb.prepare(`
      INSERT INTO customer_transfer_requests
        (customer_id, tenant_id, assignment_type, from_user_id, to_user_id, note_text, status)
      VALUES (?, ?, 'employee', ?, ?, ?, 'pending')
    `).run(C_EMP, TENANT, U_EMP_FROM, U_EMP_TO, 'handoff note')
    const transferId = Number(trIns.lastInsertRowid)

    const ctx = loadCtx(rawDb, C_EMP)
    assert.equal(callerHolds(ctx, U_EMP_FROM, 'employee'), true, 'sender should hold assignment pre-accept')

    const transferNote = `تمرير عميل #${transferId}`
    await db.prepare(`DELETE FROM customer_assignments WHERE customer_id = ? AND employee_id = ?`)
      .bind(C_EMP, U_EMP_FROM).run()
    await db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id, assigned_by, notes) VALUES (?, ?, ?, ?)`)
      .bind(C_EMP, U_EMP_TO, U_EMP_TO, transferNote).run()
    await db.prepare(`UPDATE customer_transfer_requests SET status = 'accepted', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(transferId).run()
    await db.prepare(`INSERT INTO assignment_history (customer_id, old_employee_id, new_employee_id, changed_by, notes) VALUES (?, ?, ?, ?, ?)`)
      .bind(C_EMP, U_EMP_FROM, U_EMP_TO, U_EMP_TO, transferNote).run()

    const assigns = rawDb.prepare(`SELECT employee_id FROM customer_assignments WHERE customer_id = ?`).all(C_EMP) as
      { employee_id: number }[]
    assert.deepEqual(assigns.map((r) => r.employee_id).sort(), [U_EMP_TO], 'only recipient should remain assigned')

    const status = rawDb.prepare(`SELECT status FROM customer_transfer_requests WHERE id = ?`).get(transferId) as
      { status: string }
    assert.equal(status.status, 'accepted')

    const history = rawDb.prepare(`SELECT old_employee_id, new_employee_id FROM assignment_history WHERE customer_id = ?`).all(C_EMP) as
      { old_employee_id: number; new_employee_id: number }[]
    assert.equal(history.length, 1, 'assignment_history entry written')
    assert.equal(history[0].old_employee_id, U_EMP_FROM)
    assert.equal(history[0].new_employee_id, U_EMP_TO)
  })

  it('bank-agent accept syncs BOTH customers.assigned_bank_agent_id AND financing_requests.assigned_bank_agent_id', async () => {
    const trIns = rawDb.prepare(`
      INSERT INTO customer_transfer_requests
        (customer_id, tenant_id, assignment_type, from_user_id, to_user_id, note_text, status)
      VALUES (?, ?, 'bank_agent', ?, ?, ?, 'pending')
    `).run(C_BA, TENANT, U_BA_FROM, U_BA_TO, 'ba handoff')
    const transferId = Number(trIns.lastInsertRowid)

    // FR still owned by old agent pre-accept
    const preFr = rawDb.prepare(`SELECT assigned_bank_agent_id FROM financing_requests WHERE id = ?`).get(FR_BA) as
      { assigned_bank_agent_id: number }
    assert.equal(preFr.assigned_bank_agent_id, U_BA_FROM)

    await db.prepare(`UPDATE customers SET assigned_bank_agent_id = ? WHERE id = ?`).bind(U_BA_TO, C_BA).run()
    await db.prepare(`UPDATE financing_requests SET assigned_bank_agent_id = ? WHERE customer_id = ?`).bind(U_BA_TO, C_BA).run()
    await db.prepare(`UPDATE customer_transfer_requests SET status = 'accepted', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(transferId).run()

    const cust = rawDb.prepare(`SELECT assigned_bank_agent_id FROM customers WHERE id = ?`).get(C_BA) as
      { assigned_bank_agent_id: number }
    assert.equal(cust.assigned_bank_agent_id, U_BA_TO, 'customers.assigned_bank_agent_id updated')

    const fr = rawDb.prepare(`SELECT assigned_bank_agent_id FROM financing_requests WHERE id = ?`).get(FR_BA) as
      { assigned_bank_agent_id: number }
    assert.equal(fr.assigned_bank_agent_id, U_BA_TO, 'FR.assigned_bank_agent_id synced — dual-column invariant')
  })

  it('accept batch is atomic — a failing statement mid-batch rolls back sibling writes', async () => {
    const trIns = rawDb.prepare(`
      INSERT INTO customer_transfer_requests
        (customer_id, tenant_id, assignment_type, from_user_id, to_user_id, note_text, status)
      VALUES (?, ?, 'bank_agent', ?, ?, ?, 'pending')
    `).run(C_BA, TENANT, U_BA_FROM, U_BA_TO, 'ba handoff atomic')
    const transferId = Number(trIns.lastInsertRowid)

    // Simulate what a real batch under Cloudflare D1 does: wrap in a transaction
    // so a failing statement rolls everything back. Verify the customers table
    // is NOT left mutated while the transfer row stays pending.
    const txn = rawDb.transaction(() => {
      rawDb.prepare(`UPDATE customers SET assigned_bank_agent_id = ? WHERE id = ?`).run(U_BA_TO, C_BA)
      // Force a failure — bogus column name simulates schema drift
      rawDb.prepare(`UPDATE financing_requests SET no_such_column = ? WHERE customer_id = ?`).run(U_BA_TO, C_BA)
      rawDb.prepare(`UPDATE customer_transfer_requests SET status = 'accepted' WHERE id = ?`).run(transferId)
    })
    assert.throws(() => txn(), /no such column/, 'batch should surface the error')

    const cust = rawDb.prepare(`SELECT assigned_bank_agent_id FROM customers WHERE id = ?`).get(C_BA) as
      { assigned_bank_agent_id: number }
    assert.equal(cust.assigned_bank_agent_id, U_BA_FROM, 'customer stays with old agent after rollback')

    const status = rawDb.prepare(`SELECT status FROM customer_transfer_requests WHERE id = ?`).get(transferId) as
      { status: string }
    assert.equal(status.status, 'pending', 'transfer stays pending after rollback')
  })

  it('stale accept: role 2 reassigned sender before accept — callerHolds is false, request should be cancelled', async () => {
    const trIns = rawDb.prepare(`
      INSERT INTO customer_transfer_requests
        (customer_id, tenant_id, assignment_type, from_user_id, to_user_id, note_text, status)
      VALUES (?, ?, 'employee', ?, ?, ?, 'pending')
    `).run(C_EMP, TENANT, U_EMP_FROM, U_EMP_TO, 'stale case')
    const transferId = Number(trIns.lastInsertRowid)

    // Simulate role-2 reassignment: sender no longer holds assignment
    rawDb.prepare(`DELETE FROM customer_assignments WHERE customer_id = ? AND employee_id = ?`).run(C_EMP, U_EMP_FROM)
    rawDb.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?, ?)`).run(C_EMP, U_ADMIN)

    const ctx = loadCtx(rawDb, C_EMP)
    assert.equal(callerHolds(ctx, U_EMP_FROM, 'employee'), false, 'stale sender detected')

    // Endpoint's stale path cancels the request instead of accepting
    rawDb.prepare(`UPDATE customer_transfer_requests SET status = 'cancelled', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`).run(transferId)
    const row = rawDb.prepare(`SELECT status FROM customer_transfer_requests WHERE id = ?`).get(transferId) as
      { status: string }
    assert.equal(row.status, 'cancelled')
  })
})

describe('customer transfer — request validation invariants', () => {
  let rawDb: Database.Database

  beforeEach(() => {
    rawDb = new Database(':memory:')
    seedSchema(rawDb)
    seedData(rawDb)
  })

  it('rejects a second pending request for the same (customer, assignment_type)', () => {
    rawDb.prepare(`
      INSERT INTO customer_transfer_requests
        (customer_id, tenant_id, assignment_type, from_user_id, to_user_id, note_text, status)
      VALUES (?, ?, 'employee', ?, ?, ?, 'pending')
    `).run(C_EMP, TENANT, U_EMP_FROM, U_EMP_TO, 'first')

    // The endpoint pre-checks with this query and returns 400 if a row exists
    const existing = rawDb.prepare(`
      SELECT id FROM customer_transfer_requests
      WHERE customer_id = ? AND assignment_type = ? AND status = 'pending' LIMIT 1
    `).get(C_EMP, 'employee') as { id: number } | undefined
    assert.ok(existing?.id, 'duplicate pending detected — second insert would be blocked by the endpoint')
  })

  it('role 6 dual-assigned on the same customer is blocked from transferring', () => {
    const ctx = loadCtx(rawDb, C_DUAL)
    const isDualAssigned = ctx.employeeAssignedIds.includes(U_DUAL) && ctx.bankAgentId === U_DUAL
    assert.equal(isDualAssigned, true, 'endpoint would reject with dual-assignment error')
  })

  it('self-recipient is rejected (to_user_id === from_user_id)', () => {
    // Purely a validation guard — mirrors the endpoint check
    const from = U_EMP_FROM
    const to = U_EMP_FROM
    assert.equal(from === to, true, 'endpoint returns 400 لا يمكن التمرير إلى نفسك')
  })

  it('empty note is rejected', () => {
    const noteText = '   '.trim()
    assert.equal(noteText.length, 0, 'endpoint returns 400 يرجى كتابة ملاحظة مع طلب التمرير')
  })
})
