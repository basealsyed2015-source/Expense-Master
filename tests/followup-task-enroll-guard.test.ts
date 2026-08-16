/**
 * Open follow-up task blocks manual customer enrollment (must use task_id flow).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  buildCustomerEnrollFromTaskHref,
  enrollPrefillPhone,
  findOpenFollowupTaskByPhone,
  phoneMatchVariants,
} from '../src/followup-task-enroll-guard.ts'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'

const INDEX_SRC = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')

function createFollowupDb(): Database.Database {
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
      task_title TEXT
    );
  `)
  return db
}

function seedOpenTask(
  db: Database.Database,
  opts: {
    tenantId: number
    phone: string
    name?: string
    status?: string
    archived?: number
  }
): number {
  const fu = db
    .prepare(
      `INSERT INTO company_contact_followups (tenant_id, customer_name, customer_phone, is_archived)
       VALUES (?, ?, ?, ?)`
    )
    .run(opts.tenantId, opts.name ?? 'Lead', opts.phone, opts.archived ?? 0)
  const followupId = Number(fu.lastInsertRowid)
  const task = db
    .prepare(
      `INSERT INTO company_contact_followup_tasks (followup_id, tenant_id, status, assigned_user_id, task_title)
       VALUES (?, ?, ?, 1, 'Follow up')`
    )
    .run(followupId, opts.tenantId, opts.status ?? 'pending')
  return Number(task.lastInsertRowid)
}

describe('followup task enroll guard', () => {
  it('builds phone match variants for 966 / local / 05', () => {
    const v = phoneMatchVariants('966512345678')
    assert.ok(v.includes('966512345678'))
    assert.ok(v.includes('512345678'))
    assert.ok(v.includes('0512345678'))
  })

  it('builds enroll href with task_id and local phone', () => {
    const href = buildCustomerEnrollFromTaskHref({
      task_id: 42,
      customer_name: 'أحمد',
      customer_phone: '966512345678',
    })
    assert.match(href, /^\/admin\/customers\/add\?/)
    assert.match(href, /task_id=42/)
    assert.match(href, /phone=512345678/)
    assert.equal(enrollPrefillPhone('966512345678'), '512345678')
  })

  it('finds open task by phone for same tenant', async () => {
    const raw = createFollowupDb()
    const taskId = seedOpenTask(raw, { tenantId: 7, phone: '966512345678', name: 'Sara' })
    const d1 = createSqliteD1(raw)

    const hit = await findOpenFollowupTaskByPhone(d1, 7, '966512345678')
    assert.ok(hit)
    assert.equal(hit!.task_id, taskId)
    assert.equal(hit!.customer_name, 'Sara')

    const viaLocal = await findOpenFollowupTaskByPhone(d1, 7, '966512345678')
    assert.equal(viaLocal?.task_id, taskId)

    const otherTenant = await findOpenFollowupTaskByPhone(d1, 8, '966512345678')
    assert.equal(otherTenant, null)
  })

  it('ignores completed, cancelled, and archived follow-ups', async () => {
    const raw = createFollowupDb()
    seedOpenTask(raw, { tenantId: 1, phone: '966511111111', status: 'completed' })
    seedOpenTask(raw, { tenantId: 1, phone: '966522222222', status: 'cancelled' })
    seedOpenTask(raw, { tenantId: 1, phone: '966533333333', archived: 1 })
    const openId = seedOpenTask(raw, { tenantId: 1, phone: '966544444444', status: 'pending' })
    const d1 = createSqliteD1(raw)

    assert.equal(await findOpenFollowupTaskByPhone(d1, 1, '966511111111'), null)
    assert.equal(await findOpenFollowupTaskByPhone(d1, 1, '966522222222'), null)
    assert.equal(await findOpenFollowupTaskByPhone(d1, 1, '966533333333'), null)
    const open = await findOpenFollowupTaskByPhone(d1, 1, '966544444444')
    assert.equal(open?.task_id, openId)
  })

  it('matches legacy 05 phone stored on follow-up', async () => {
    const raw = createFollowupDb()
    const taskId = seedOpenTask(raw, { tenantId: 3, phone: '0512345678' })
    const d1 = createSqliteD1(raw)
    const hit = await findOpenFollowupTaskByPhone(d1, 3, '966512345678')
    assert.equal(hit?.task_id, taskId)
  })

  it('exposes rating modal helpers globally on the my-tasks enrollment add page', () => {
    // Inline onclick on the add-customer rating popup requires window.* helpers.
    // They are defined inside the page IIFE, so they must also be assigned globally.
    const addIdx = INDEX_SRC.indexOf("app.get('/admin/customers/add'")
    assert.ok(addIdx > 0, 'add-customer route must exist')
    const nextIdx = INDEX_SRC.indexOf("app.get('/admin/customer-assignment'", addIdx)
    const slice = INDEX_SRC.slice(addIdx, nextIdx > addIdx ? nextIdx : addIdx + 20000)
    assert.match(slice, /onclick="toggleTaskRatingDropdown\(event\)"/)
    assert.match(slice, /onclick="selectTaskRating\(5\)"/)
    assert.match(slice, /onclick="saveTaskReview\(\)"/)
    assert.match(slice, /window\.toggleTaskRatingDropdown\s*=\s*toggleTaskRatingDropdown/)
    assert.match(slice, /window\.selectTaskRating\s*=\s*selectTaskRating/)
    assert.match(slice, /window\.closeTaskReviewModal\s*=\s*closeTaskReviewModal/)
    assert.match(slice, /window\.saveTaskReview\s*=\s*saveTaskReview/)
  })
})
