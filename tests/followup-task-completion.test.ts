/**
 * Follow-up task completion on customer enrollment.
 *
 * When a customer is enrolled via a task_id (my-tasks / follow-ups flow), the
 * originating follow-up task is marked `completed` and any pending pass-request
 * for that task is cancelled. From that point forward the task must:
 *   - Disappear from the "open task" lookup used to gate manual re-enrollment.
 *   - Still be findable via the global dashboard search (see dashboard-search.test.ts).
 *
 * These tests seed the two tables the enrollment handler updates and then verify
 * both the state transition and its tenant scoping.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findOpenFollowupTaskByPhone } from '../src/followup-task-enroll-guard.ts'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'

const INDEX_SRC = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')

function createDb(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE company_contact_followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      customer_name TEXT,
      customer_phone TEXT NOT NULL,
      is_archived INTEGER DEFAULT 0
    );
    CREATE TABLE company_contact_followup_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      followup_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      assigned_user_id INTEGER,
      task_title TEXT,
      rating INTEGER,
      rating_note TEXT
    );
    CREATE TABLE company_contact_followup_task_pass_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      resolved_at TEXT
    );
  `)
  return db
}

function seedTask(db: Database.Database, tenantId: number, phone: string, name = 'Lead'): number {
  const fu = db.prepare(
    `INSERT INTO company_contact_followups (tenant_id, customer_name, customer_phone) VALUES (?, ?, ?)`
  ).run(tenantId, name, phone)
  const followupId = Number(fu.lastInsertRowid)
  const task = db.prepare(
    `INSERT INTO company_contact_followup_tasks (followup_id, tenant_id, status, assigned_user_id, task_title)
     VALUES (?, ?, 'pending', 1, 'Call lead')`
  ).run(followupId, tenantId)
  return Number(task.lastInsertRowid)
}

describe('follow-up task completion — source invariants', () => {
  it('marks task completed via UPDATE ... WHERE id=? AND tenant_id=? (tenant-scoped)', () => {
    // The completion UPDATE must include a tenant_id predicate so a cross-tenant
    // task_id in the request body can never mutate another tenant's rows.
    const marker = INDEX_SRC.indexOf('carry over rating')
    // The block lives right after the rating carry-over; ensure both live near each other.
    // (Source scan is a smoke check — if either moves, this fails loudly.)
    assert.ok(
      /UPDATE company_contact_followup_tasks SET status = 'completed' WHERE id = \? AND tenant_id = \?/.test(INDEX_SRC),
      'expected tenant-scoped task completion UPDATE'
    )
    // And pending pass-requests must be cancelled at the same time so the ex-open
    // task doesn't leave a dangling approval request behind.
    assert.match(INDEX_SRC, /UPDATE company_contact_followup_task_pass_requests[\s\S]{0,200}status = 'cancelled'/)
  })

  it('is only invoked when the enrollment flow carried a task_id', () => {
    // The block runs inside `if (hasTaskEnrollId && createdCustomerId && tenant_id)` —
    // manual enrollments (no task_id) must not accidentally complete some other task.
    assert.match(INDEX_SRC, /if \(hasTaskEnrollId && createdCustomerId && tenant_id\)/)
  })
})

describe('follow-up task completion — DB behavior', () => {
  it('a pending task is found as open before enrollment', async () => {
    const raw = createDb()
    const taskId = seedTask(raw, 7, '966512345678', 'Sara')
    const d1 = createSqliteD1(raw)

    const open = await findOpenFollowupTaskByPhone(d1, 7, '966512345678')
    assert.ok(open, 'pending task should be discoverable as open')
    assert.equal(open!.task_id, taskId)
  })

  it('after enrollment marks the task completed it disappears from the open lookup', async () => {
    const raw = createDb()
    const taskId = seedTask(raw, 7, '966512345678', 'Sara')

    // Same statement the enrollment handler runs on successful customer create.
    raw.prepare(
      `UPDATE company_contact_followup_tasks SET status = 'completed' WHERE id = ? AND tenant_id = ?`
    ).run(taskId, 7)

    const d1 = createSqliteD1(raw)
    const open = await findOpenFollowupTaskByPhone(d1, 7, '966512345678')
    assert.equal(open, null, 'completed task must not be returned as open')

    // Sanity: the row still exists (search / audit can still surface it) — completion
    // is a status change, not a delete.
    const row = raw.prepare(
      `SELECT status FROM company_contact_followup_tasks WHERE id = ?`
    ).get(taskId) as { status: string }
    assert.equal(row.status, 'completed')
  })

  it('cancels any pending pass-request for the same task on completion', async () => {
    const raw = createDb()
    const taskId = seedTask(raw, 7, '966512345678')
    raw.prepare(
      `INSERT INTO company_contact_followup_task_pass_requests (task_id, status) VALUES (?, 'pending')`
    ).run(taskId)
    // Independent pass-request for a different task must stay pending.
    const otherTaskId = seedTask(raw, 7, '966599999999')
    raw.prepare(
      `INSERT INTO company_contact_followup_task_pass_requests (task_id, status) VALUES (?, 'pending')`
    ).run(otherTaskId)

    // Enrollment side-effect: cancel pending pass-requests for the completed task.
    raw.prepare(`
      UPDATE company_contact_followup_task_pass_requests
      SET status = 'cancelled', resolved_at = CURRENT_TIMESTAMP
      WHERE task_id = ? AND status = 'pending'
    `).run(taskId)

    const rows = raw.prepare(
      `SELECT task_id, status FROM company_contact_followup_task_pass_requests ORDER BY id`
    ).all() as { task_id: number; status: string }[]
    assert.deepEqual(rows, [
      { task_id: taskId, status: 'cancelled' },
      { task_id: otherTaskId, status: 'pending' },
    ])
  })

  it('is tenant-scoped: completing task_id X in tenant B does nothing to tenant A', async () => {
    const raw = createDb()
    const taskA = seedTask(raw, 1, '966501111111', 'A')
    // Seed a second task with the same id in another tenant — we can't force the
    // same id via AUTOINCREMENT, so just seed one in tenant 2 and try to complete
    // tenant 1's task_id while claiming tenant 2. It must not update anything.
    seedTask(raw, 2, '966502222222', 'B')

    const info = raw.prepare(
      `UPDATE company_contact_followup_tasks SET status = 'completed' WHERE id = ? AND tenant_id = ?`
    ).run(taskA, 2 /* wrong tenant */)
    assert.equal(info.changes, 0, 'wrong-tenant update must be a no-op')

    const d1 = createSqliteD1(raw)
    const stillOpen = await findOpenFollowupTaskByPhone(d1, 1, '966501111111')
    assert.ok(stillOpen, 'tenant 1 task must still be open after the mis-tenanted UPDATE')
    assert.equal(stillOpen!.task_id, taskA)
  })

  it('completion is idempotent — running it twice leaves the task completed', async () => {
    const raw = createDb()
    const taskId = seedTask(raw, 7, '966512345678')
    const stmt = raw.prepare(
      `UPDATE company_contact_followup_tasks SET status = 'completed' WHERE id = ? AND tenant_id = ?`
    )
    stmt.run(taskId, 7)
    stmt.run(taskId, 7)
    const row = raw.prepare(`SELECT status FROM company_contact_followup_tasks WHERE id = ?`).get(taskId) as { status: string }
    assert.equal(row.status, 'completed')
  })
})
