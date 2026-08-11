/**
 * Tenant-scoped no-response auto-transfers (employee pool only: roles 4/6/14).
 * Only tasks with no_response_at <= now-48h are transferred.
 *
 * Usage: node scripts/run-no-response-transfers-tenant.mjs <tenant_id>
 */
import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const tenantId = Number(process.argv[2] || 0)
if (!Number.isFinite(tenantId) || tenantId <= 0) {
  console.error('Usage: node scripts/run-no-response-transfers-tenant.mjs <tenant_id>')
  process.exit(1)
}

const tmpDir = mkdtempSync(join(tmpdir(), 'nr-xfer-'))
const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx'

function d1Select(sql) {
  const oneLine = String(sql).replace(/\s+/g, ' ').trim().replace(/;$/, '')
  const r = spawnSync(
    npxBin,
    ['wrangler', 'd1', 'execute', 'tamweel-production-v2', '--remote', '--json', '--command', oneLine],
    { encoding: 'utf8', shell: false, maxBuffer: 40 * 1024 * 1024 },
  )
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout)
    throw new Error(`wrangler select failed: ${oneLine.slice(0, 160)}`)
  }
  const out = String(r.stdout || '')
  const start = out.indexOf('[')
  if (start < 0) throw new Error(`no JSON in output: ${out.slice(0, 300)}`)
  const parsed = JSON.parse(out.slice(start))
  const block = Array.isArray(parsed) ? parsed[0] : parsed
  if (!block?.success) throw new Error(JSON.stringify(block))
  return block.results || []
}

function d1ApplyFile(sql) {
  const file = join(tmpDir, `apply-${Date.now()}.sql`)
  writeFileSync(file, sql, 'utf8')
  const r = spawnSync(
    npxBin,
    ['wrangler', 'd1', 'execute', 'tamweel-production-v2', '--remote', '--file', file],
    { encoding: 'utf8', shell: false, maxBuffer: 40 * 1024 * 1024 },
  )
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout)
    throw new Error('wrangler apply failed')
  }
  return String(r.stdout || '')
}

function esc(s) {
  return String(s ?? '').replace(/'/g, "''")
}

console.log(`Loading staff (roles 4/6/14 only) for tenant ${tenantId}...`)
const staffRows = d1Select(`
SELECT u.id, u.full_name
FROM users u
WHERE u.is_active = 1
  AND u.role_id IN (4, 6, 14)
  AND u.tenant_id = ${tenantId}
ORDER BY COALESCE(NULLIF(TRIM(u.full_name), ''), u.username) ASC
`)

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
console.log(`staff=${staff.length}: ${staff.map((s) => `${s.id}:${s.full_name}`).join(', ')}`)

if (!staffIds.length) {
  console.error('No eligible employees — aborting')
  process.exit(1)
}

const stateRows = d1Select(
  `SELECT last_auto_assigned_user_id FROM tenant_followup_auto_assign_state WHERE tenant_id = ${tenantId} LIMIT 1`,
)
let lastId = stateRows[0]?.last_auto_assigned_user_id != null
  ? Number(stateRows[0].last_auto_assigned_user_id)
  : null
console.log(`cursor last_auto_assigned_user_id=${lastId}`)

console.log('Loading expired no-response tasks (only >= 48h)...')
const expired = d1Select(`
SELECT t.id AS task_id, t.assigned_user_id, t.followup_id, t.task_title, f.customer_name, f.no_response_at
FROM company_contact_followup_tasks t
INNER JOIN company_contact_followups f ON f.id = t.followup_id
WHERE f.tenant_id = ${tenantId}
  AND COALESCE(f.is_no_response, 0) = 1
  AND f.no_response_at IS NOT NULL
  AND datetime(f.no_response_at) <= datetime('now', '-48 hours')
  AND COALESCE(f.is_archived, 0) = 0
ORDER BY f.no_response_at ASC
LIMIT 500
`)
console.log(`expired_eligible=${expired.length}`)

const notYet = d1Select(`
SELECT COUNT(*) AS c
FROM company_contact_followup_tasks t
INNER JOIN company_contact_followups f ON f.id = t.followup_id
WHERE f.tenant_id = ${tenantId}
  AND COALESCE(f.is_no_response, 0) = 1
  AND f.no_response_at IS NOT NULL
  AND datetime(f.no_response_at) > datetime('now', '-48 hours')
  AND COALESCE(f.is_archived, 0) = 0
`)
console.log(`skipped_still_in_countdown=${Number(notYet[0]?.c) || 0}`)

if (!expired.length) {
  console.log('Nothing to transfer.')
  process.exit(0)
}

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
  if (![taskId, followupId].every((n) => Number.isFinite(n) && n > 0)) {
    console.warn('skip bad row', row)
    continue
  }
  if (!Number.isFinite(assigned) || assigned <= 0) {
    console.warn(`skip task ${taskId}: no assignee`)
    continue
  }

  const nextId = pickNext(assigned)
  const fromName = nameById.get(assigned) || String(assigned)
  const toName = nameById.get(nextId) || String(nextId)
  const taskLabel = String(row.task_title || row.customer_name || '').trim() || `مهمة #${taskId}`
  const noteText = `تم تحويل المهمة تلقائياً من ${fromName} إلى ${toName} بسبب عدم الرد خلال 48 ساعة`

  stmts.push(`UPDATE company_contact_followup_tasks SET assigned_user_id = ${nextId} WHERE id = ${taskId} AND tenant_id = ${tenantId};`)
  stmts.push(`UPDATE company_contact_followups SET is_no_response = 1, no_response_at = CURRENT_TIMESTAMP WHERE id = ${followupId} AND tenant_id = ${tenantId};`)
  stmts.push(`INSERT INTO company_contact_followup_task_notes (task_id, tenant_id, user_id, user_name, note_text, note_type) VALUES (${taskId}, ${tenantId}, 0, 'النظام', '${esc(noteText)}', 'auto_transfer');`)
  stmts.push(`INSERT INTO notifications (user_id, tenant_id, title, message, type, category, is_read) VALUES (${assigned}, ${tenantId}, 'تم تحويل مهمة (عدم رد)', '${esc(`تم تحويل مهمة "${taskLabel}" تلقائياً إلى ${toName} بسبب عدم الرد خلال 48 ساعة`)}', 'info', 'followup_no_response_transfer_out', 0);`)
  stmts.push(`INSERT INTO notifications (user_id, tenant_id, title, message, type, category, is_read) VALUES (${nextId}, ${tenantId}, 'مهمة جديدة (عدم رد)', '${esc(`تم إسناد مهمة "${taskLabel}" إليك تلقائياً من ${fromName} بسبب عدم الرد خلال 48 ساعة`)}', 'warning', 'followup_no_response_transfer_in', 0);`)
  stmts.push(`INSERT INTO customer_alarms (customer_id, customer_name, alarm_date_gregorian, alarm_time, note, user_id, tenant_id, alarm_type, link_url, is_read) VALUES (NULL, 'تم تحويل مهمة (عدم رد)', date('now'), time('now'), '${esc(`تم تحويل مهمة "${taskLabel}" تلقائياً إلى ${toName} بسبب عدم الرد خلال 48 ساعة`)}', ${assigned}, ${tenantId}, 'task_pass', '/admin/my-no-response-tasks', 0);`)
  stmts.push(`INSERT INTO customer_alarms (customer_id, customer_name, alarm_date_gregorian, alarm_time, note, user_id, tenant_id, alarm_type, link_url, is_read) VALUES (NULL, 'مهمة جديدة (عدم رد)', date('now'), time('now'), '${esc(`تم إسناد مهمة "${taskLabel}" إليك تلقائياً من ${fromName} بسبب عدم الرد خلال 48 ساعة`)}', ${nextId}, ${tenantId}, 'task_pass', '/admin/my-no-response-tasks', 0);`)

  lastId = nextId
  summary.push(`#${taskId} ${fromName} → ${toName} (${row.customer_name || ''}) [was ${row.no_response_at}]`)
}

stmts.push(`
INSERT INTO tenant_followup_auto_assign_state (tenant_id, last_auto_assigned_user_id, updated_at)
VALUES (${tenantId}, ${lastId}, CURRENT_TIMESTAMP)
ON CONFLICT(tenant_id) DO UPDATE SET
  last_auto_assigned_user_id = excluded.last_auto_assigned_user_id,
  updated_at = CURRENT_TIMESTAMP;
`)

console.log(`Executing ${summary.length} transfers (${stmts.length} SQL statements)...`)
console.log(d1ApplyFile(stmts.join('\n')))

for (const line of summary) console.log(line)
console.log(`done: transferred=${summary.length} cursor_now=${lastId}`)
