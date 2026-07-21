/**
 * Round-robin distribution helpers used by POST /api/customers/import-csv.
 * Extracted as a separate module so they can be unit-tested without importing
 * the full Hono application bundle.
 */

/**
 * Insert or replace a customer assignment row. Mirrors the inline logic in
 * assignNewCustomerToEmployee from index.tsx (duplicated here to avoid
 * importing the full bundle in tests).
 */
async function insertCustomerAssignment(
  db: D1Database,
  customerId: number,
  employeeId: number,
  assignedBy: number
): Promise<void> {
  try {
    await db.prepare(
      `INSERT INTO customer_assignments (customer_id, employee_id, assigned_by, notes)
       VALUES (?, ?, ?, '')
       ON CONFLICT(customer_id) DO UPDATE SET
         employee_id = excluded.employee_id,
         assigned_by = excluded.assigned_by,
         notes = excluded.notes`
    ).bind(customerId, employeeId, assignedBy).run()
  } catch {
    await db.prepare(
      `INSERT OR REPLACE INTO customer_assignments (customer_id, employee_id, assigned_by, notes)
       VALUES (?, ?, ?, '')`
    ).bind(customerId, employeeId, assignedBy).run()
  }
  try {
    await db.prepare(
      `INSERT INTO assignment_history (customer_id, old_employee_id, new_employee_id, changed_by, notes)
       VALUES (?, NULL, ?, ?, '')`
    ).bind(customerId, employeeId, assignedBy).run()
  } catch { /* history table may be missing */ }
}

/**
 * Distribute customerIds to role-4/6 employees using the tenant's fair
 * round-robin cursor, respecting per-employee customer_limit.
 *
 * Rules (mirrors /api/customer-assignment/auto-distribute):
 *  - Only active employees (role_id IN (4,6), tenant_id = tenantId)
 *  - Employees at their customer_limit are skipped
 *  - Cursor from tenant_customer_auto_assign_state determines start position
 *  - Cursor is persisted after distribution
 *  - Role 6 (dual agent) counts as an employee
 */
export async function distributeCustomersToEmployees(
  db: D1Database,
  tenantId: number,
  customerIds: number[],
  assignedBy: number
): Promise<number> {
  if (!customerIds.length) return 0

  const { results: staffRows } = await db.prepare(
    `SELECT id, customer_limit FROM users
     WHERE role_id IN (4, 6) AND tenant_id = ? AND is_active = 1
     ORDER BY id ASC`
  ).bind(tenantId).all<{ id: number; customer_limit: number | null }>()

  const staff = (staffRows ?? []) as { id: number; customer_limit: number | null }[]
  if (!staff.length) return 0

  const staffIds = staff.map((s) => s.id)
  const placeholders = staffIds.map(() => '?').join(',')

  const { results: countRows } = await db.prepare(
    `SELECT employee_id, COUNT(*) AS cnt FROM customer_assignments
     WHERE employee_id IN (${placeholders}) GROUP BY employee_id`
  ).bind(...staffIds).all<{ employee_id: number; cnt: number }>()

  const assignmentCounts = new Map<number, number>()
  for (const row of (countRows ?? [])) assignmentCounts.set(row.employee_id, row.cnt)

  const remaining = new Map<number, number | null>()
  for (const s of staff) {
    const current = assignmentCounts.get(s.id) ?? 0
    remaining.set(s.id, s.customer_limit == null ? null : Math.max(0, s.customer_limit - current))
  }

  let eligibleIds = staffIds.filter((id) => { const r = remaining.get(id); return r === null || r > 0 })
  if (!eligibleIds.length) return 0

  const stateRow = await db.prepare(
    `SELECT last_auto_assigned_user_id FROM tenant_customer_auto_assign_state
     WHERE tenant_id = ? LIMIT 1`
  ).bind(tenantId).first<{ last_auto_assigned_user_id: number | null }>()
  let lastId: number | null = stateRow?.last_auto_assigned_user_id ?? null

  function pickNext(eligible: number[]): number | null {
    if (!eligible.length) return null
    if (lastId == null) return eligible[0]
    const lastIdx = staffIds.indexOf(lastId)
    for (let i = 1; i <= staffIds.length; i++) {
      const candidate = staffIds[(lastIdx + i) % staffIds.length]
      if (eligible.includes(candidate)) return candidate
    }
    return eligible[0]
  }

  let assigned = 0
  for (const customerId of customerIds) {
    if (!eligibleIds.length) break
    const employeeId = pickNext(eligibleIds)
    if (employeeId === null) break
    try {
      await insertCustomerAssignment(db, customerId, employeeId, assignedBy)
      lastId = employeeId
      assigned++
      const r = remaining.get(employeeId)
      if (r !== null && r !== undefined) {
        const newR = r - 1
        remaining.set(employeeId, newR)
        if (newR <= 0) eligibleIds = eligibleIds.filter((id) => id !== employeeId)
      }
    } catch { /* best-effort per customer */ }
  }

  if (assigned > 0) {
    try {
      await db.prepare(
        `INSERT INTO tenant_customer_auto_assign_state (tenant_id, last_auto_assigned_user_id, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(tenant_id) DO UPDATE SET
           last_auto_assigned_user_id = excluded.last_auto_assigned_user_id,
           updated_at = CURRENT_TIMESTAMP`
      ).bind(tenantId, lastId).run()
    } catch { /* table may not exist on very old DBs */ }
  }

  return assigned
}

/**
 * Distribute customerIds to bank agents (roles 5/6/15) using simple
 * round-robin. No customer_limit concept exists for bank agents.
 *
 *  - Agents scoped by tenant_id OR assigned_bank_id pointing to a tenant bank
 *  - Role 6 (dual agent) counts as a bank agent
 *  - Only active agents included
 */
export async function distributeCustomersToBankAgents(
  db: D1Database,
  tenantId: number,
  customerIds: number[]
): Promise<number> {
  if (!customerIds.length) return 0

  const { results: agentRows } = await db.prepare(
    `SELECT u.id FROM users u
     WHERE u.role_id IN (5, 6, 15) AND u.is_active = 1
       AND (u.tenant_id = ? OR EXISTS (
         SELECT 1 FROM banks b WHERE b.id = u.assigned_bank_id AND b.tenant_id = ?
       ))
     ORDER BY u.id ASC`
  ).bind(tenantId, tenantId).all<{ id: number }>()

  const agents = (agentRows ?? []).map((r) => r.id)
  if (!agents.length) return 0

  let assigned = 0
  for (let i = 0; i < customerIds.length; i++) {
    const agentId = agents[i % agents.length]
    try {
      await db.prepare(
        `UPDATE customers SET assigned_bank_agent_id = ? WHERE id = ?`
      ).bind(agentId, customerIds[i]).run()
      assigned++
    } catch { /* best-effort */ }
  }
  return assigned
}
