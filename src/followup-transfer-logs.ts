/**
 * No-response auto-transfer audit logs (stored as task notes with note_type = auto_transfer).
 */

export type TransferLogEntry = {
  from_name: string
  to_name: string
  created_at: string
  task_id?: number
  followup_id?: number
}

export type TransferSummary = {
  initial_name: string
  latest_to_name: string
  latest_at: string
  chain: string[]
  hops: TransferLogEntry[]
}

/** Employees eligible for auto no-response transfers (bank agents 5/15 excluded). */
export const NO_RESPONSE_TRANSFER_STAFF_SQL = `
  SELECT u.id, u.full_name
  FROM users u
  WHERE u.is_active = 1
    AND u.role_id IN (4, 6, 14)
    AND u.tenant_id = ?
  ORDER BY COALESCE(NULLIF(TRIM(u.full_name), ''), u.username) ASC
`

export async function listNoResponseTransferStaff(
  db: D1Database,
  tenantId: number,
): Promise<{ id: number; full_name: string }[]> {
  const { results } = await db
    .prepare(NO_RESPONSE_TRANSFER_STAFF_SQL)
    .bind(tenantId)
    .all<{ id: number; full_name: string }>()

  const seen = new Set<number>()
  const out: { id: number; full_name: string }[] = []
  for (const s of results || []) {
    const id = Number(s.id)
    if (!Number.isFinite(id) || seen.has(id)) continue
    seen.add(id)
    out.push({ id, full_name: String(s.full_name || '') })
  }
  return out
}

/**
 * Round-robin next assignee from the employee pool, skipping the current holder when possible.
 */
export function pickNextNoResponseAssignee(
  staffIds: number[],
  currentAssigneeId: number,
  lastAutoAssignedUserId: number | null,
): number | null {
  if (!staffIds.length) return null
  const preferred = staffIds.filter((id) => id !== currentAssigneeId)
  const eligible = preferred.length ? preferred : staffIds
  if (!eligible.length) return null

  const lastIdx = lastAutoAssignedUserId != null ? staffIds.indexOf(lastAutoAssignedUserId) : -1
  for (let i = 1; i <= staffIds.length; i++) {
    const candidate = staffIds[(lastIdx + i) % staffIds.length]
    if (eligible.includes(candidate)) return candidate
  }
  return eligible[0]
}

/** Parses the Arabic system note written by processNoResponseTransfers. */
export function parseAutoTransferNote(noteText: string): { from_name: string; to_name: string } | null {
  const m = String(noteText || '').match(/من\s+(.+?)\s+إلى\s+(.+?)\s+بسبب/)
  if (!m) return null
  const from_name = m[1].trim()
  const to_name = m[2].trim()
  if (!from_name || !to_name) return null
  return { from_name, to_name }
}

export function buildTransferSummary(logs: TransferLogEntry[]): TransferSummary | null {
  if (!logs.length) return null
  const hops = logs.slice()
  const chain = [hops[0].from_name]
  for (const h of hops) chain.push(h.to_name)
  const last = hops[hops.length - 1]
  return {
    initial_name: hops[0].from_name,
    latest_to_name: last.to_name,
    latest_at: last.created_at,
    chain,
    hops,
  }
}

/**
 * Batch-load auto_transfer notes and attach `transfer_logs` + `transfer_summary`
 * onto each row. `idKey` is the row field that matches notes (`id` for tasks,
 * `id` for follow-ups when matching via followup_id).
 */
export async function attachNoResponseTransferLogs(
  db: D1Database,
  rows: Record<string, unknown>[],
  mode: 'task' | 'followup',
): Promise<void> {
  if (!rows.length) return

  const idSet = new Set<number>()
  for (const row of rows) {
    const id = Number(row.id)
    if (Number.isFinite(id) && id > 0) idSet.add(id)
  }
  const ids = Array.from(idSet)
  if (!ids.length) return

  const placeholders = ids.map(() => '?').join(',')
  const sql =
    mode === 'task'
      ? `SELECT tn.task_id AS map_id, tn.task_id, tn.note_text, tn.created_at, t.followup_id
         FROM company_contact_followup_task_notes tn
         INNER JOIN company_contact_followup_tasks t ON t.id = tn.task_id
         WHERE tn.note_type = 'auto_transfer' AND tn.task_id IN (${placeholders})
         ORDER BY tn.created_at ASC, tn.id ASC`
      : `SELECT t.followup_id AS map_id, tn.task_id, tn.note_text, tn.created_at, t.followup_id
         FROM company_contact_followup_task_notes tn
         INNER JOIN company_contact_followup_tasks t ON t.id = tn.task_id
         WHERE tn.note_type = 'auto_transfer' AND t.followup_id IN (${placeholders})
         ORDER BY tn.created_at ASC, tn.id ASC`

  let noteRows: Array<{
    map_id: number
    task_id: number
    note_text: string
    created_at: string
    followup_id: number
  }> = []
  try {
    const r = await db.prepare(sql).bind(...ids).all<{
      map_id: number
      task_id: number
      note_text: string
      created_at: string
      followup_id: number
    }>()
    noteRows = (r.results || []) as typeof noteRows
  } catch {
    // note_type may not allow auto_transfer until migration 0145 is applied
    return
  }

  const byId = new Map<number, TransferLogEntry[]>()
  for (const n of noteRows) {
    const parsed = parseAutoTransferNote(n.note_text)
    if (!parsed) continue
    const mapId = Number(n.map_id)
    if (!byId.has(mapId)) byId.set(mapId, [])
    byId.get(mapId)!.push({
      from_name: parsed.from_name,
      to_name: parsed.to_name,
      created_at: String(n.created_at || ''),
      task_id: Number(n.task_id),
      followup_id: Number(n.followup_id),
    })
  }

  for (const row of rows) {
    const id = Number(row.id)
    const logs = byId.get(id) || []
    row.transfer_logs = logs
    row.transfer_summary = buildTransferSummary(logs)
  }
}
