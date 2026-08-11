/**
 * Customer form notes carry-over tests.
 *
 * Two features are covered:
 *
 * 1. Regular form notes → customer_workflow_notes
 *    When a customer is created via the standard add form (no task_id), a
 *    non-empty "notes" field must be written to customer_workflow_notes under
 *    the pre_workflow stage so it appears on the customer's workflow timeline.
 *    The note must NOT carry an "ads" source — no إعلانات badge.
 *
 * 2. Task / ads notes → workflow timeline (read-time merge, source='ads')
 *    Notes written on follow-up tasks (company_contact_followup_task_notes)
 *    and on follow-ups themselves (company_contact_followup_notes) are merged
 *    into the workflow timeline at read time, tagged source='ads', so the
 *    workflow page renders the blue إعلانات badge for them.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const INDEX_SRC = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
const WORKFLOW_SRC = readFileSync(join(process.cwd(), 'src', 'workflow-page.ts'), 'utf8')

// ─── helpers ────────────────────────────────────────────────────────────────

function createDb(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE workflow_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_name TEXT NOT NULL UNIQUE,
      stage_name_ar TEXT,
      stage_order INTEGER DEFAULT 0,
      stage_color TEXT,
      stage_icon TEXT,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE customer_workflow_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      stage_id INTEGER NOT NULL,
      note_text TEXT NOT NULL,
      performed_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE company_contact_followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      customer_phone TEXT NOT NULL,
      is_archived INTEGER DEFAULT 0
    );
    CREATE TABLE company_contact_followup_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      followup_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending'
    );
    CREATE TABLE company_contact_followup_task_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_name TEXT,
      note_type TEXT DEFAULT 'followup_note',
      note_text TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE company_contact_followup_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      followup_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      note_text TEXT NOT NULL,
      created_by_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      full_name TEXT,
      tenant_id INTEGER
    );
  `)
  return db
}

function ensurePreWorkflowStage(db: Database.Database): number {
  db.prepare(`
    INSERT OR IGNORE INTO workflow_stages (stage_name, stage_name_ar, stage_order, stage_color, stage_icon, is_active)
    VALUES ('pre_workflow', 'قبل سير العمل', 0, '#94A3B8', 'fa-hourglass-start', 1)
  `).run()
  const row = db.prepare(`SELECT id FROM workflow_stages WHERE stage_name = 'pre_workflow'`).get() as { id: number }
  return row.id
}

// ─── source-code invariants ──────────────────────────────────────────────────

describe('customer form notes — source invariants', () => {
  it('regular-form notes are only written when there is no task_id (hasTaskEnrollId guard)', () => {
    assert.match(
      INDEX_SRC,
      /if \(!hasTaskEnrollId && notes && createdCustomerId\)/,
      'expected !hasTaskEnrollId guard around regular-form note insert'
    )
  })

  it('regular-form notes are written to customer_workflow_notes', () => {
    // Extract the block following the !hasTaskEnrollId guard.
    const guardIdx = INDEX_SRC.indexOf('if (!hasTaskEnrollId && notes && createdCustomerId)')
    assert.ok(guardIdx > 0, '!hasTaskEnrollId guard must exist')
    const slice = INDEX_SRC.slice(guardIdx, guardIdx + 500)
    assert.match(
      slice,
      /INSERT INTO customer_workflow_notes/,
      'the guard block must insert into customer_workflow_notes'
    )
  })

  it('regular-form note insert uses ensurePreWorkflowStage for the stage ID', () => {
    const guardIdx = INDEX_SRC.indexOf('if (!hasTaskEnrollId && notes && createdCustomerId)')
    const slice = INDEX_SRC.slice(guardIdx, guardIdx + 500)
    assert.match(
      slice,
      /ensurePreWorkflowStage/,
      'ensurePreWorkflowStage must be called inside the note carry-over block'
    )
  })

  it('regular-form note insert binds creatorUserId as performed_by', () => {
    const guardIdx = INDEX_SRC.indexOf('if (!hasTaskEnrollId && notes && createdCustomerId)')
    const slice = INDEX_SRC.slice(guardIdx, guardIdx + 500)
    assert.match(
      slice,
      /creatorUserId/,
      'performed_by must be bound from creatorUserId'
    )
  })

  it('regular-form note carry-over is wrapped in try/catch so it never aborts customer creation', () => {
    const guardIdx = INDEX_SRC.indexOf('if (!hasTaskEnrollId && notes && createdCustomerId)')
    const slice = INDEX_SRC.slice(guardIdx, guardIdx + 500)
    assert.match(slice, /try\s*\{/, 'note carry-over must be inside a try block')
    assert.match(slice, /catch/, 'note carry-over must have a catch handler')
  })

  it('task notes (ads) are fetched from followup_task_notes with source=ads', () => {
    assert.match(
      INDEX_SRC,
      /'ads' AS source[\s\S]{0,50}FROM company_contact_followup_task_notes/,
      "task notes query must tag rows with 'ads' AS source"
    )
  })

  it('followup notes (ads) are fetched from followup_notes with source=ads', () => {
    assert.match(
      INDEX_SRC,
      /'ads' AS source[\s\S]{0,50}FROM company_contact_followup_notes/,
      "followup notes query must tag rows with 'ads' AS source"
    )
  })

  it('ads notes are tagged with pre_workflow stage before merging into the timeline', () => {
    assert.match(
      INDEX_SRC,
      /stage_id:\s*preWorkflowStageId/,
      'ads notes must be tagged with preWorkflowStageId so timeline places them correctly'
    )
  })

  it('workflow page renders ads badge only when source === ads', () => {
    assert.match(
      WORKFLOW_SRC,
      /note\.source\s*===\s*'ads'/,
      "renderPhaseNoteRow must check note.source === 'ads'"
    )
    assert.match(
      WORKFLOW_SRC,
      /ads-note-badge/,
      'ads-note-badge CSS class must be used for the إعلانات badge'
    )
  })

  it('workflow page does NOT render ads badge for notes without source', () => {
    // The badge HTML is conditional — it must be inside a ternary/if on isAds.
    const badgeIdx = WORKFLOW_SRC.indexOf('ads-note-badge')
    assert.ok(badgeIdx > 0)
    // There must be a conditional expression before the badge span.
    const before = WORKFLOW_SRC.slice(Math.max(0, badgeIdx - 100), badgeIdx)
    assert.match(before, /isAds\s*\?/, 'ads badge must be guarded by isAds ternary')
  })
})

// ─── DB behaviour ────────────────────────────────────────────────────────────

describe('customer form notes — DB behaviour', () => {
  it('regular-form note is written to customer_workflow_notes under pre_workflow stage', () => {
    const db = createDb()
    const stageId = ensurePreWorkflowStage(db)

    db.prepare(`
      INSERT INTO customer_workflow_notes (customer_id, stage_id, note_text, performed_by)
      VALUES (?, ?, ?, ?)
    `).run(42, stageId, 'عميل مميز، يفضل التواصل صباحاً', 5)

    const row = db.prepare(
      `SELECT * FROM customer_workflow_notes WHERE customer_id = 42`
    ).get() as { stage_id: number; note_text: string; performed_by: number }

    assert.equal(row.stage_id, stageId)
    assert.equal(row.note_text, 'عميل مميز، يفضل التواصل صباحاً')
    assert.equal(row.performed_by, 5)
  })

  it('ensurePreWorkflowStage is idempotent — calling twice returns the same id', () => {
    const db = createDb()
    const id1 = ensurePreWorkflowStage(db)
    const id2 = ensurePreWorkflowStage(db)
    assert.equal(id1, id2)
    const count = (db.prepare(`SELECT COUNT(*) AS n FROM workflow_stages WHERE stage_name = 'pre_workflow'`).get() as { n: number }).n
    assert.equal(count, 1)
  })

  it('notes from two different customers are isolated', () => {
    const db = createDb()
    const stageId = ensurePreWorkflowStage(db)

    db.prepare(`INSERT INTO customer_workflow_notes (customer_id, stage_id, note_text) VALUES (?, ?, ?)`).run(1, stageId, 'ملاحظة العميل 1')
    db.prepare(`INSERT INTO customer_workflow_notes (customer_id, stage_id, note_text) VALUES (?, ?, ?)`).run(2, stageId, 'ملاحظة العميل 2')

    const c1 = db.prepare(`SELECT note_text FROM customer_workflow_notes WHERE customer_id = 1`).get() as { note_text: string }
    const c2 = db.prepare(`SELECT note_text FROM customer_workflow_notes WHERE customer_id = 2`).get() as { note_text: string }

    assert.equal(c1.note_text, 'ملاحظة العميل 1')
    assert.equal(c2.note_text, 'ملاحظة العميل 2')
  })

  it('task notes query returns source=ads rows matched by phone', () => {
    const db = createDb()
    const tenantId = 3
    const phone = '966512345678'

    const fu = db.prepare(`INSERT INTO company_contact_followups (tenant_id, customer_phone) VALUES (?, ?)`).run(tenantId, phone)
    const task = db.prepare(`INSERT INTO company_contact_followup_tasks (followup_id, tenant_id) VALUES (?, ?)`).run(Number(fu.lastInsertRowid), tenantId)
    db.prepare(`INSERT INTO company_contact_followup_task_notes (task_id, user_name, note_text) VALUES (?, ?, ?)`).run(Number(task.lastInsertRowid), 'أحمد', 'اتصل ولم يرد')

    // Mirror the workflow page query.
    const rows = db.prepare(`
      SELECT tn.note_text, tn.user_name AS performed_by_name, tn.note_type, tn.created_at,
             'ads' AS source
      FROM company_contact_followup_task_notes tn
      INNER JOIN company_contact_followup_tasks t ON t.id = tn.task_id
      INNER JOIN company_contact_followups f ON f.id = t.followup_id
      WHERE f.customer_phone = ?
        AND f.tenant_id = ?
    `).all(phone, tenantId) as { note_text: string; performed_by_name: string; source: string }[]

    assert.equal(rows.length, 1)
    assert.equal(rows[0].note_text, 'اتصل ولم يرد')
    assert.equal(rows[0].performed_by_name, 'أحمد')
    assert.equal(rows[0].source, 'ads')
  })

  it('followup notes query returns source=ads rows matched by phone', () => {
    const db = createDb()
    const tenantId = 3
    const phone = '966598765432'

    const fu = db.prepare(`INSERT INTO company_contact_followups (tenant_id, customer_phone) VALUES (?, ?)`).run(tenantId, phone)
    db.prepare(`
      INSERT INTO company_contact_followup_notes (followup_id, tenant_id, note_text, created_by_user_id)
      VALUES (?, ?, ?, ?)
    `).run(Number(fu.lastInsertRowid), tenantId, 'مهتم بالتمويل العقاري', 9)
    db.prepare(`INSERT INTO users (id, full_name, tenant_id) VALUES (?, ?, ?)`).run(9, 'سارة', tenantId)

    // Mirror the workflow page query (simplified: no LEFT JOIN users needed for this assertion).
    const rows = db.prepare(`
      SELECT n.note_text, 'ads' AS source
      FROM company_contact_followup_notes n
      INNER JOIN company_contact_followups f ON f.id = n.followup_id
      WHERE f.customer_phone = ?
        AND n.tenant_id = ?
    `).all(phone, tenantId) as { note_text: string; source: string }[]

    assert.equal(rows.length, 1)
    assert.equal(rows[0].note_text, 'مهتم بالتمويل العقاري')
    assert.equal(rows[0].source, 'ads')
  })

  it('task notes from a different tenant are not returned', () => {
    const db = createDb()
    const phone = '966512345678'

    // Seed task note in tenant 1.
    const fu = db.prepare(`INSERT INTO company_contact_followups (tenant_id, customer_phone) VALUES (?, ?)`).run(1, phone)
    const task = db.prepare(`INSERT INTO company_contact_followup_tasks (followup_id, tenant_id) VALUES (?, ?)`).run(Number(fu.lastInsertRowid), 1)
    db.prepare(`INSERT INTO company_contact_followup_task_notes (task_id, note_text) VALUES (?, ?)`).run(Number(task.lastInsertRowid), 'ملاحظة مستأجر 1')

    // Query from tenant 2 — must return nothing.
    const rows = db.prepare(`
      SELECT tn.note_text, 'ads' AS source
      FROM company_contact_followup_task_notes tn
      INNER JOIN company_contact_followup_tasks t ON t.id = tn.task_id
      INNER JOIN company_contact_followups f ON f.id = t.followup_id
      WHERE f.customer_phone = ?
        AND f.tenant_id = ?
    `).all(phone, 2 /* tenant 2 */) as { note_text: string }[]

    assert.equal(rows.length, 0, 'cross-tenant note must not be visible')
  })

  it('regular-form note has no source field — workflow renders it without ads badge', () => {
    const db = createDb()
    const stageId = ensurePreWorkflowStage(db)

    db.prepare(`INSERT INTO customer_workflow_notes (customer_id, stage_id, note_text) VALUES (?, ?, ?)`).run(10, stageId, 'ملاحظة عادية')

    const row = db.prepare(`SELECT * FROM customer_workflow_notes WHERE customer_id = 10`).get() as Record<string, unknown>

    // The table has no source column — the value must be undefined/absent.
    assert.equal(row.source, undefined, 'customer_workflow_notes has no source column — badge must not render')
  })

  it('ads badge renders for notes with source=ads', () => {
    // Simulate what renderPhaseNoteRow does.
    const isAds = (note: { source?: string }) => note.source === 'ads'

    assert.equal(isAds({ source: 'ads' }), true)
    assert.equal(isAds({ source: undefined }), false)
    assert.equal(isAds({ source: '' }), false)
    assert.equal(isAds({}), false)
  })
})
