/**
 * Build tenant-3 transfer SQL from exported wrangler JSON dumps.
 * Reads: scripts/_t3_staff.json, _t3_cursor.json, _t3_expired.json, _t3_notyet.json
 * Writes: scripts/_t3_transfers.sql and scripts/_t3_summary.txt
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const TENANT = 3
const dir = join(process.cwd(), 'scripts')

function loadResults(name) {
  const raw = readFileSync(join(dir, name), 'utf8')
  const start = raw.indexOf('[')
  if (start < 0) throw new Error(`no JSON in ${name}`)
  const parsed = JSON.parse(raw.slice(start))
  const block = Array.isArray(parsed) ? parsed[0] : parsed
  if (!block?.success) throw new Error(`${name}: ${JSON.stringify(block)}`)
  return block.results || []
}

function esc(s) {
  return String(s ?? '').replace(/'/g, "''")
}

const staffRows = loadResults('_t3_staff.json')
const seen = new Set()
const staff = []
for (const s of staffRows) {
  const id = Number(s.id)
  if (!Number.isFinite(id) || seen.has(id)) continue
  seen.add(id)
  staff.push({ id, full_name: String(s.full_name || '') })
}
const nameById = new Map(staff.map((s) => [s.id, s.full_name || String(s.id)]))
const staffIds = staff.map((s) => s.id)
if (!staffIds.length) throw new Error('no staff')

const cursorRows = loadResults('_t3_cursor.json')
let lastId = cursorRows[0]?.last_auto_assigned_user_id != null
  ? Number(cursorRows[0].last_auto_assigned_user_id)
  : null

const expired = loadResults('_t3_expired.json')
const notYet = Number(loadResults('_t3_notyet.json')[0]?.c) || 0

console.log(`staff=${staff.length}`)
console.log(`cursor=${lastId}`)
console.log(`expired_eligible=${expired.length}`)
console.log(`skipped_still_in_countdown=${notYet}`)

function pickNext(currentAssigneeId) {
  const preferred = staffIds.filter((id) => id !== currentAssigneeId)
  const eligible = preferred.length ? preferred : staffIds
  const lastIdx = lastId != null ? staffIds.indexOf(lastId) : -1
  for (let i = 1; i <= staffIds.length; i++) {
    const candidate = staffIds[(lastIdx + i) % staffIds.length]
    if (eligible.includes(candidate)) return candidate
  }
  return eligible[0]
}

const stmts = []
const summary = []

for (const row of expired) {
  const taskId = Number(row.task_id)
  const followupId = Number(row.followup_id)
  const assigned = Number(row.assigned_user_id)
  if (![taskId, followupId, assigned].every((n) => Number.isFinite(n) && n > 0)) {
    console.warn('skip', row)
    continue
  }

  const nextId = pickNext(assigned)
  const fromName = nameById.get(assigned) || String(assigned)
  const toName = nameById.get(nextId) || String(nextId)
  // If assignee was a bank agent not in name map, keep numeric fallback
  const fromLabel = nameById.has(assigned) ? fromName : `user#${assigned}`
  const taskLabel = String(row.task_title || row.customer_name || '').trim() || `مهمة #${taskId}`
  const noteText = `تم تحويل المهمة تلقائياً من ${fromLabel} إلى ${toName} بسبب عدم الرد خلال 48 ساعة`

  stmts.push(`UPDATE company_contact_followup_tasks SET assigned_user_id = ${nextId} WHERE id = ${taskId} AND tenant_id = ${TENANT};`)
  stmts.push(`UPDATE company_contact_followups SET is_no_response = 1, no_response_at = CURRENT_TIMESTAMP WHERE id = ${followupId} AND tenant_id = ${TENANT};`)
  stmts.push(`INSERT INTO company_contact_followup_task_notes (task_id, tenant_id, user_id, user_name, note_text, note_type) VALUES (${taskId}, ${TENANT}, 0, 'النظام', '${esc(noteText)}', 'auto_transfer');`)
  stmts.push(`INSERT INTO notifications (user_id, tenant_id, title, message, type, category, is_read) VALUES (${assigned}, ${TENANT}, 'تم تحويل مهمة (عدم رد)', '${esc(`تم تحويل مهمة "${taskLabel}" تلقائياً إلى ${toName} بسبب عدم الرد خلال 48 ساعة`)}', 'info', 'followup_no_response_transfer_out', 0);`)
  stmts.push(`INSERT INTO notifications (user_id, tenant_id, title, message, type, category, is_read) VALUES (${nextId}, ${TENANT}, 'مهمة جديدة (عدم رد)', '${esc(`تم إسناد مهمة "${taskLabel}" إليك تلقائياً من ${fromLabel} بسبب عدم الرد خلال 48 ساعة`)}', 'warning', 'followup_no_response_transfer_in', 0);`)
  stmts.push(`INSERT INTO customer_alarms (customer_id, customer_name, alarm_date_gregorian, alarm_time, note, user_id, tenant_id, alarm_type, link_url, is_read) VALUES (NULL, 'تم تحويل مهمة (عدم رد)', date('now'), time('now'), '${esc(`تم تحويل مهمة "${taskLabel}" تلقائياً إلى ${toName} بسبب عدم الرد خلال 48 ساعة`)}', ${assigned}, ${TENANT}, 'task_pass', '/admin/my-no-response-tasks', 0);`)
  stmts.push(`INSERT INTO customer_alarms (customer_id, customer_name, alarm_date_gregorian, alarm_time, note, user_id, tenant_id, alarm_type, link_url, is_read) VALUES (NULL, 'مهمة جديدة (عدم رد)', date('now'), time('now'), '${esc(`تم إسناد مهمة "${taskLabel}" إليك تلقائياً من ${fromLabel} بسبب عدم الرد خلال 48 ساعة`)}', ${nextId}, ${TENANT}, 'task_pass', '/admin/my-no-response-tasks', 0);`)

  lastId = nextId
  summary.push(`#${taskId} ${fromLabel} → ${toName} (${row.customer_name || ''}) [was ${row.no_response_at}]`)
}

stmts.push(`INSERT INTO tenant_followup_auto_assign_state (tenant_id, last_auto_assigned_user_id, updated_at) VALUES (${TENANT}, ${lastId}, CURRENT_TIMESTAMP) ON CONFLICT(tenant_id) DO UPDATE SET last_auto_assigned_user_id = excluded.last_auto_assigned_user_id, updated_at = CURRENT_TIMESTAMP;`)

writeFileSync(join(dir, '_t3_transfers.sql'), stmts.join('\n'), 'utf8')
writeFileSync(join(dir, '_t3_summary.txt'), summary.join('\n') + `\n\ndone transferred=${summary.length} cursor_now=${lastId}\n`, 'utf8')
console.log(`wrote _t3_transfers.sql (${summary.length} transfers, ${stmts.length} statements)`)
