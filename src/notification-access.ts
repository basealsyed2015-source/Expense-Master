/**
 * Notification targeting and access checks (roles 4/5, financing requests, workflow alerts).
 */

export function parseRoleId(roleId: unknown): number | null {
  if (roleId == null || roleId === '') return null
  const n = typeof roleId === 'number' ? roleId : parseInt(String(roleId), 10)
  return Number.isNaN(n) ? null : n
}

export function normalizeRoleId(roleId: unknown): number | null {
  const n = parseRoleId(roleId)
  if (n === null) return null
  const legacyMap: Record<number, number> = {
    11: 1,
    12: 2,
    13: 3,
    14: 4,
    15: 5,
  }
  return legacyMap[n] ?? n
}

/** Role 6 is the dual-capability role: employee + bank agent in the same tenant. */
export function isDualRole(roleId: unknown): boolean {
  return normalizeRoleId(roleId) === 6
}

/** Roles that can appear in the employee assignment column. */
export function isEmployeeAssignableRole(roleId: unknown): boolean {
  const r = normalizeRoleId(roleId)
  return r === 4 || r === 6
}

/** Roles that can appear in the bank-agent assignment column (requires bank scope). */
export function isBankAgentAssignableRole(roleId: unknown): boolean {
  const r = normalizeRoleId(roleId)
  return r === 5 || r === 6
}

/** Roles allowed to add workflow phase notes (not actions). */
export function canAddWorkflowNote(roleId: unknown): boolean {
  const r = normalizeRoleId(roleId)
  return r === 2 || r === 4 || r === 5 || r === 6
}

/** Only role 2 (company admin, legacy 12) sees the inline assignment dropdown in customer/request tables. */
export function canInlineAssignCustomers(roleId: unknown): boolean {
  return normalizeRoleId(roleId) === 2
}

/** Roles that may open /admin/requests/new and POST /api/requests (same as legacy role 4/5 set + dual agent). */
export function canCreateFinancingRequest(roleId: unknown): boolean {
  const r = normalizeRoleId(roleId)
  return r === 1 || r === 2 || r === 3 || r === 4 || r === 5 || r === 6
}

/** Staff roles that own assigned follow-up tasks (/admin/my-tasks) — and company admin (role 2) who sees all tenant tasks. */
export function canAccessMyFollowupTasksPage(roleId: unknown): boolean {
  const r = normalizeRoleId(roleId)
  return r === 2 || r === 4 || r === 5 || r === 6
}

/** Marketing module (/admin/follow-ups + affiliates/stats) is admin/supervisor only. */
export function canAccessMarketingModule(roleId: unknown): boolean {
  const r = normalizeRoleId(roleId)
  return r === 1 || r === 2 || r === 3
}

export type UserInfo = {
  userId: number | null
  tenantId: number | null
  roleId: number | null
}

/**
 * Role 5 customer scope — matches admin customer list and chat @ picker:
 * created_by, assigned_bank_agent_id on customer, or financing-request assignment.
 */
export async function isRole5InCustomerScope(
  db: D1Database,
  userId: number,
  customerId: number,
  tenantId: number
): Promise<boolean> {
  const scopeFull = async () => {
    const row = await db
      .prepare(
        `SELECT 1 AS ok FROM customers c
         WHERE c.id = ? AND c.tenant_id = ? AND (
           NULLIF(c.created_by, 0) = ?
           OR NULLIF(c.assigned_bank_agent_id, 0) = ?
           OR EXISTS (
             SELECT 1 FROM financing_requests fr
             LEFT JOIN users fr_creator ON fr_creator.id = fr.created_by
             WHERE fr.customer_id = c.id
               AND (
                 NULLIF(fr.assigned_bank_agent_id, 0) = ?
                 OR (NULLIF(fr.created_by, 0) = ? AND fr_creator.role_id IN (5, 15))
               )
           )
         ) LIMIT 1`
      )
      .bind(customerId, tenantId, userId, userId, userId, userId)
      .first<{ ok: number }>()
    return Boolean(row?.ok)
  }
  try {
    return await scopeFull()
  } catch (e: unknown) {
    const msg = String((e as { message?: string })?.message || e || '')
    if (/no such column:\s*c\.created_by|no such column:\s*created_by/i.test(msg)) {
      return isBankAgentAssignedToCustomer(db, userId, customerId, tenantId)
    }
    if (/no such column:\s*c\.assigned_bank_agent_id|no such column:\s*assigned_bank_agent_id/i.test(msg)) {
      const row = await db
        .prepare(
          `SELECT 1 AS ok FROM customers c
           WHERE c.id = ? AND c.tenant_id = ? AND (
             NULLIF(c.created_by, 0) = ?
             OR EXISTS (
               SELECT 1 FROM financing_requests fr
               LEFT JOIN users fr_creator ON fr_creator.id = fr.created_by
               WHERE fr.customer_id = c.id
                 AND (
                   NULLIF(fr.assigned_bank_agent_id, 0) = ?
                   OR (NULLIF(fr.created_by, 0) = ? AND fr_creator.role_id IN (5, 15))
                 )
             )
           ) LIMIT 1`
        )
        .bind(customerId, tenantId, userId, userId, userId)
        .first<{ ok: number }>()
      return Boolean(row?.ok)
    }
    throw e
  }
}

/** Role 5: explicitly assigned on customer or any financing request (not record creator). */
export async function isBankAgentAssignedToCustomer(
  db: D1Database,
  userId: number,
  customerId: number,
  tenantId: number
): Promise<boolean> {
  try {
    const row = await db
      .prepare(
        `SELECT 1 AS ok FROM customers c
         WHERE c.id = ? AND c.tenant_id = ? AND (
           NULLIF(c.assigned_bank_agent_id, 0) = ?
           OR EXISTS (
             SELECT 1 FROM financing_requests fr
             WHERE fr.customer_id = c.id AND NULLIF(fr.assigned_bank_agent_id, 0) = ?
           )
         ) LIMIT 1`
      )
      .bind(customerId, tenantId, userId, userId)
      .first<{ ok: number }>()
    return Boolean(row?.ok)
  } catch (e: unknown) {
    const msg = String((e as { message?: string })?.message || e || '')
    if (/no such column:\s*c\.assigned_bank_agent_id|no such column:\s*assigned_bank_agent_id/i.test(msg)) {
      const row = await db
        .prepare(
          `SELECT 1 AS ok FROM financing_requests
           WHERE customer_id = ? AND NULLIF(assigned_bank_agent_id, 0) = ?
           LIMIT 1`
        )
        .bind(customerId, userId)
        .first<{ ok: number }>()
      return Boolean(row?.ok)
    }
    throw e
  }
}

export function bankAgentOwnsFinancingRequestRow(
  userId: number,
  row: { assigned_bank_agent_id?: unknown }
): boolean {
  const n = Number(row.assigned_bank_agent_id)
  return Number.isFinite(n) && n > 0 && n === userId
}

export async function canRole5AccessFinancingRequest(
  db: D1Database,
  userInfo: UserInfo,
  row: {
    customer_id?: number | null
    customer_tenant_id?: number | null
    assigned_bank_agent_id?: number | null
    created_by?: number | null
  }
): Promise<boolean> {
  if (!userInfo.userId || userInfo.tenantId == null) return false
  const uid = Number(userInfo.userId)
  if (bankAgentOwnsFinancingRequestRow(uid, row)) return true
  const cid = row.customer_id != null ? Number(row.customer_id) : NaN
  if (Number.isNaN(cid)) return false
  const ctid = row.customer_tenant_id != null ? Number(row.customer_tenant_id) : Number(userInfo.tenantId)
  return isBankAgentAssignedToCustomer(db, uid, cid, ctid)
}

export async function canUserAccessCustomer(
  db: D1Database,
  userInfo: UserInfo,
  customer: { id: number; tenant_id: number | null } | null
): Promise<boolean> {
  if (!userInfo.userId || !customer) return false
  const rid = normalizeRoleId(userInfo.roleId)
  if (!rid) return false
  if (rid === 1) return true
  if (userInfo.tenantId == null || customer.tenant_id == null || customer.tenant_id !== userInfo.tenantId) {
    return false
  }
  if (rid === 4) {
    const assignment = await db
      .prepare('SELECT 1 as ok FROM customer_assignments WHERE customer_id = ? AND employee_id = ? LIMIT 1')
      .bind(customer.id, userInfo.userId)
      .first<{ ok: number }>()
    return Boolean(assignment?.ok)
  }
  if (rid === 5) {
    return isRole5InCustomerScope(db, Number(userInfo.userId), customer.id, Number(userInfo.tenantId))
  }
  if (rid === 6) {
    // Employee path: explicit assignment row
    const assignment = await db
      .prepare('SELECT 1 as ok FROM customer_assignments WHERE customer_id = ? AND employee_id = ? LIMIT 1')
      .bind(customer.id, userInfo.userId)
      .first<{ ok: number }>()
    if (assignment?.ok) return true
    // Bank-agent path: explicit assigned_bank_agent_id only — no created_by fallback,
    // because role 6 may have created records in employee context.
    return isBankAgentAssignedToCustomer(db, Number(userInfo.userId), customer.id, Number(userInfo.tenantId))
  }
  return rid === 2 || rid === 3
}

/** Role 4/5 user assigned to this customer — cross-party workflow alerts (not all staff in tenant). */
export async function resolveWorkflowNotifyTargetUserIds(
  db: D1Database,
  customerId: number,
  targetRole: 4 | 5,
  tenantId: number | null,
  requestId?: number | null
): Promise<number[]> {
  if (!customerId || tenantId == null) return []

  if (targetRole === 4) {
    const row = await db
      .prepare(
        `SELECT u.id
         FROM customer_assignments ca
         INNER JOIN users u ON u.id = ca.employee_id
         WHERE ca.customer_id = ?
           AND u.tenant_id = ?
           AND u.is_active = 1
           AND u.role_id IN (4, 14, 6)
         LIMIT 1`
      )
      .bind(customerId, tenantId)
      .first<{ id: number }>()
    return row?.id ? [Number(row.id)] : []
  }

  let agentId: number | null = null
  const pickAgentId = (raw: unknown): number | null => {
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  if (requestId) {
    try {
      const reqRow = await db
        .prepare(
          `SELECT assigned_bank_agent_id FROM financing_requests WHERE id = ? AND customer_id = ? LIMIT 1`
        )
        .bind(requestId, customerId)
        .first<{ assigned_bank_agent_id?: number | null }>()
      agentId = pickAgentId(reqRow?.assigned_bank_agent_id)
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message || e || '')
      if (!/no such column:\s*assigned_bank_agent_id/i.test(msg)) throw e
    }
  }

  if (!agentId) {
    try {
      const custRow = await db
        .prepare(`SELECT assigned_bank_agent_id FROM customers WHERE id = ? AND tenant_id = ? LIMIT 1`)
        .bind(customerId, tenantId)
        .first<{ assigned_bank_agent_id?: number | null }>()
      agentId = pickAgentId(custRow?.assigned_bank_agent_id)
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message || e || '')
      if (!/no such column:\s*assigned_bank_agent_id/i.test(msg)) throw e
    }
  }

  if (!agentId) {
    try {
      const frRow = await db
        .prepare(
          `SELECT assigned_bank_agent_id FROM financing_requests
           WHERE customer_id = ?
             AND assigned_bank_agent_id IS NOT NULL
             AND assigned_bank_agent_id != 0
           ORDER BY created_at DESC
           LIMIT 1`
        )
        .bind(customerId)
        .first<{ assigned_bank_agent_id?: number | null }>()
      agentId = pickAgentId(frRow?.assigned_bank_agent_id)
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message || e || '')
      if (!/no such column:\s*assigned_bank_agent_id/i.test(msg)) throw e
    }
  }

  if (!agentId) return []

  const user = await db
    .prepare(
      `SELECT id FROM users
       WHERE id = ? AND tenant_id = ? AND is_active = 1 AND role_id IN (5, 15, 6)
       LIMIT 1`
    )
    .bind(agentId, tenantId)
    .first<{ id: number }>()
  return user?.id ? [Number(user.id)] : []
}

/** Cross-party workflow targets (role 4 ↔ 5), excluding the actor. */
export async function resolveWorkflowCrossPartyNotifyTargetUserIds(
  db: D1Database,
  customerId: number,
  actorUserId: number | null,
  actorRoleId: unknown,
  tenantId: number | null,
  requestId?: number | null
): Promise<number[]> {
  const actorRole = normalizeRoleId(actorRoleId)
  // Role 6 acts as both employee and bank agent; treat cross-party notification like role 4
  const targetRole: 4 | 5 | null = (actorRole === 5 || actorRole === 6) ? 4 : actorRole === 4 ? 5 : null
  if (!targetRole) return []
  const ids = await resolveWorkflowNotifyTargetUserIds(db, customerId, targetRole, tenantId, requestId)
  if (actorUserId == null || actorUserId <= 0) return ids
  return ids.filter((id) => id !== actorUserId)
}

export function formatWorkflowActionTimestamp(when: Date = new Date()): {
  gregorianDate: string
  hijriDate: string
  time: string
  label: string
} {
  // Workers run in UTC by default. Notifications are shown to Saudi users, so
  // always format the stored display timestamp in Riyadh time (UTC+3).
  const timeZone = 'Asia/Riyadh'
  const gregorianDate = when.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory',
    timeZone,
  })
  let hijriDate = ''
  try {
    hijriDate = when.toLocaleDateString('ar-SA-u-ca-islamic', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone,
    })
  } catch {
    hijriDate = ''
  }
  const time = when.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone,
  })
  const label = hijriDate ? `${gregorianDate} — ${time} (${hijriDate} هـ)` : `${gregorianDate} — ${time}`
  return { gregorianDate, hijriDate, time, label }
}

/** Request id from workflow deep-link, if present. */
export function parseRequestIdFromWorkflowLink(linkUrl: string): number | null {
  const m = String(linkUrl || '').match(/\/admin\/requests\/(\d+)\/workflow/)
  if (!m) return null
  const id = parseInt(m[1], 10)
  return Number.isFinite(id) ? id : null
}

/**
 * Look up the real customer display name for workflow notifications.
 * Falls back to "#<id>" when the row is missing or the name column is unavailable.
 */
async function resolveCustomerDisplayName(
  db: D1Database,
  customerId: number | null
): Promise<string> {
  if (customerId == null) return ''
  try {
    const row = await db
      .prepare(`SELECT full_name FROM customers WHERE id = ? LIMIT 1`)
      .bind(customerId)
      .first<{ full_name?: string | null }>()
    const name = String(row?.full_name ?? '').trim()
    return name || `#${customerId}`
  } catch {
    return `#${customerId}`
  }
}

/** Task pass request/response — mirrors workflow alerts (customer_alarms + notifications). */
export async function insertTaskPassNotification(
  db: D1Database,
  opts: {
    recipientUserId: number
    tenantId: number | null
    title: string
    message: string
    notifType: 'info' | 'warning' | 'success'
    category: 'task_pass_request' | 'task_pass_response'
    passRequestId: number
    linkUrl?: string
  }
): Promise<void> {
  const { recipientUserId, tenantId, title, message, notifType, category, passRequestId } = opts
  const linkUrl =
    opts.linkUrl ??
    (category === 'task_pass_request' ? '/admin/my-tasks#passes' : '/admin/my-tasks')
  const ts = formatWorkflowActionTimestamp(new Date())
  const note = message.includes('وقت الإجراء') ? message : `${message}\nوقت الإجراء: ${ts.label}`

  await db.prepare(`ALTER TABLE customer_alarms ADD COLUMN alarm_type TEXT`).run().catch(() => {})
  await db.prepare(`ALTER TABLE customer_alarms ADD COLUMN link_url TEXT`).run().catch(() => {})
  await db.prepare(`ALTER TABLE notifications ADD COLUMN tenant_id INTEGER`).run().catch(() => {})
  await db.prepare(`ALTER TABLE notifications ADD COLUMN related_pass_request_id INTEGER`).run().catch(() => {})

  try {
    await db
      .prepare(
        `INSERT INTO customer_alarms (customer_id, customer_name, alarm_date_gregorian, alarm_date_hijri, alarm_time, note, user_id, tenant_id, alarm_type, link_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        null,
        title,
        ts.gregorianDate,
        ts.hijriDate || null,
        ts.time,
        note,
        recipientUserId,
        tenantId,
        'task_pass',
        linkUrl
      )
      .run()
  } catch (e: unknown) {
    const msg = String((e as { message?: string })?.message || e || '')
    if (!/NOT NULL constraint failed:\s*customer_alarms\.customer_id/i.test(msg)) {
      throw e
    }
    console.warn('[alarms] skipped customer_alarms insert for task pass (null customer_id); apply migration 0140', {
      userId: recipientUserId,
      tenantId,
      passRequestId,
    })
  }

  await db
    .prepare(
      `INSERT INTO notifications (user_id, tenant_id, title, message, type, category, related_pass_request_id, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
    )
    .bind(recipientUserId, tenantId, title, note, notifType, category, passRequestId)
    .run()
}

/** Auto-transfer after 48 h on no-response tab — notifies both previous and new assignee. */
export async function insertFollowupNoResponseTransferNotification(
  db: D1Database,
  opts: {
    recipientUserId: number
    tenantId: number | null
    title: string
    message: string
    notifType: 'info' | 'warning' | 'success'
    category: 'followup_no_response_transfer_out' | 'followup_no_response_transfer_in'
    taskId: number
    linkUrl?: string
  }
): Promise<void> {
  const { recipientUserId, tenantId, title, message, notifType, category, taskId } = opts
  const linkUrl = opts.linkUrl ?? '/admin/my-no-response-tasks'
  const ts = formatWorkflowActionTimestamp(new Date())
  const note = message.includes('وقت الإجراء') ? message : `${message}\nوقت الإجراء: ${ts.label}`

  await db.prepare(`ALTER TABLE customer_alarms ADD COLUMN alarm_type TEXT`).run().catch(() => {})
  await db.prepare(`ALTER TABLE customer_alarms ADD COLUMN link_url TEXT`).run().catch(() => {})
  await db.prepare(`ALTER TABLE notifications ADD COLUMN tenant_id INTEGER`).run().catch(() => {})
  await db
    .prepare(`ALTER TABLE notifications ADD COLUMN related_followup_task_id INTEGER`)
    .run()
    .catch(() => {})

  try {
    await db
      .prepare(
        `INSERT INTO customer_alarms (customer_id, customer_name, alarm_date_gregorian, alarm_date_hijri, alarm_time, note, user_id, tenant_id, alarm_type, link_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        null,
        title,
        ts.gregorianDate,
        ts.hijriDate || null,
        ts.time,
        note,
        recipientUserId,
        tenantId,
        'task_pass',
        linkUrl
      )
      .run()
  } catch (e: unknown) {
    const msg = String((e as { message?: string })?.message || e || '')
    if (!/NOT NULL constraint failed:\s*customer_alarms\.customer_id/i.test(msg)) {
      throw e
    }
    console.warn('[alarms] skipped customer_alarms insert for no-response transfer (null customer_id); apply migration 0140', {
      userId: recipientUserId,
      tenantId,
      taskId,
    })
  }

  await db
    .prepare(
      `INSERT INTO notifications (user_id, tenant_id, title, message, type, category, related_followup_task_id, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
    )
    .bind(recipientUserId, tenantId, title, note, notifType, category, taskId)
    .run()
}

/** Customer transfer request/response — mirrors task-pass notification shape. */
export async function insertCustomerTransferNotification(
  db: D1Database,
  opts: {
    recipientUserId: number
    tenantId: number | null
    customerId: number | null
    title: string
    message: string
    notifType: 'info' | 'warning' | 'success'
    category: 'customer_transfer_request' | 'customer_transfer_response'
    transferRequestId: number
    linkUrl?: string
  }
): Promise<void> {
  const {
    recipientUserId,
    tenantId,
    customerId,
    title,
    message,
    notifType,
    category,
    transferRequestId,
  } = opts
  const linkUrl =
    opts.linkUrl ??
    (category === 'customer_transfer_request'
      ? `/admin/customers?customer_transfer=${transferRequestId}`
      : `/admin/customers?requestsFilter=all`)
  const ts = formatWorkflowActionTimestamp(new Date())
  const note = message.includes('وقت الإجراء') ? message : `${message}\nوقت الإجراء: ${ts.label}`

  await db.prepare(`ALTER TABLE customer_alarms ADD COLUMN alarm_type TEXT`).run().catch(() => {})
  await db.prepare(`ALTER TABLE customer_alarms ADD COLUMN link_url TEXT`).run().catch(() => {})
  await db.prepare(`ALTER TABLE notifications ADD COLUMN tenant_id INTEGER`).run().catch(() => {})
  await db
    .prepare(`ALTER TABLE notifications ADD COLUMN related_transfer_request_id INTEGER`)
    .run()
    .catch(() => {})

  try {
    await db
      .prepare(
        `INSERT INTO customer_alarms (customer_id, customer_name, alarm_date_gregorian, alarm_date_hijri, alarm_time, note, user_id, tenant_id, alarm_type, link_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        customerId,
        title,
        ts.gregorianDate,
        ts.hijriDate || null,
        ts.time,
        note,
        recipientUserId,
        tenantId,
        'customer_transfer',
        linkUrl
      )
      .run()
  } catch (e: unknown) {
    const msg = String((e as { message?: string })?.message || e || '')
    if (!/NOT NULL constraint failed:\s*customer_alarms\.customer_id/i.test(msg)) {
      throw e
    }
    console.warn('[alarms] skipped customer_alarms insert for customer transfer (null customer_id); apply migration 0140', {
      userId: recipientUserId,
      tenantId,
      transferRequestId,
    })
  }

  await db
    .prepare(
      `INSERT INTO notifications (user_id, tenant_id, title, message, type, category, related_transfer_request_id, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
    )
    .bind(recipientUserId, tenantId, title, note, notifType, category, transferRequestId)
    .run()
}

export async function insertWorkflowCrossPartyAlarms(
  db: D1Database,
  opts: {
    customerId: number | null
    tenantId: number | null
    targetUserIds: number[]
    /** Event label (e.g. "تحديث مرحلة: ...") — used as the notification title. */
    customerName: string
    note: string
    linkUrl: string
    actionAt?: Date
    /**
     * Optional explicit customer display name. If omitted, resolved from
     * `customers.full_name` so the notification body always references the
     * real customer, never just the numeric id.
     */
    customerDisplayName?: string
  }
): Promise<void> {
  const { customerId, tenantId, targetUserIds, customerName, linkUrl } = opts
  if (!targetUserIds.length) return
  const actionAt = opts.actionAt ?? new Date()
  const ts = formatWorkflowActionTimestamp(actionAt)
  const displayName =
    (opts.customerDisplayName && opts.customerDisplayName.trim()) ||
    (await resolveCustomerDisplayName(db, customerId))
  // Prepend "العميل: <name>" to the body so the notification template always
  // identifies the customer, regardless of what the call site placed in `note`.
  const hasNamePrefix = displayName && opts.note.includes(displayName)
  const bodyWithCustomer = !displayName || hasNamePrefix
    ? opts.note
    : `العميل: ${displayName}\n${opts.note}`
  const note = bodyWithCustomer.includes('وقت الإجراء')
    ? bodyWithCustomer
    : `${bodyWithCustomer}\nوقت الإجراء: ${ts.label}`
  await db.prepare(`ALTER TABLE customer_alarms ADD COLUMN alarm_type TEXT`).run().catch(() => {})
  await db.prepare(`ALTER TABLE customer_alarms ADD COLUMN link_url TEXT`).run().catch(() => {})
  await db.prepare(`ALTER TABLE notifications ADD COLUMN tenant_id INTEGER`).run().catch(() => {})
  const relatedRequestId = parseRequestIdFromWorkflowLink(linkUrl)
  for (const uid of targetUserIds) {
    try {
      await db
        .prepare(
          `INSERT INTO customer_alarms (customer_id, customer_name, alarm_date_gregorian, alarm_date_hijri, alarm_time, note, user_id, tenant_id, alarm_type, link_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          customerId,
          customerName,
          ts.gregorianDate,
          ts.hijriDate || null,
          ts.time,
          note,
          uid,
          tenantId,
          'workflow',
          linkUrl
        )
        .run()
    } catch (e: unknown) {
      // Pre-0140 schemas reject NULL customer_id — still deliver the notifications row.
      const msg = String((e as { message?: string })?.message || e || '')
      if (!(customerId == null && /NOT NULL constraint failed:\s*customer_alarms\.customer_id/i.test(msg))) {
        throw e
      }
      console.warn('[alarms] skipped customer_alarms insert (null customer_id); apply migration 0140', {
        userId: uid,
        tenantId,
      })
    }
    await db
      .prepare(
        `INSERT INTO notifications (user_id, tenant_id, title, message, type, category, related_request_id, is_read)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
      )
      .bind(
        uid,
        tenantId,
        customerName,
        note,
        'warning',
        'workflow_action',
        relatedRequestId
      )
      .run()
  }
}

/** Active FR + no blocking contract — role 4/6 contract create gate. */
export async function customerEligibleForContractCreate(
  db: D1Database,
  opts: { customerId: number; tenantId: number; userId: number; roleId: number }
): Promise<boolean> {
  return (await explainContractCreateDenial(db, opts)) == null
}

/** Arabic reason when contract create is denied for roles 4/5/6; null if allowed. */
export async function explainContractCreateDenial(
  db: D1Database,
  opts: { customerId: number; tenantId: number; userId: number; roleId: number }
): Promise<string | null> {
  const { customerId, tenantId, userId, roleId } = opts

  const customer = await db
    .prepare('SELECT id, tenant_id FROM customers WHERE id = ?')
    .bind(customerId)
    .first<{ id: number; tenant_id: number | null }>()
  if (!customer || Number(customer.tenant_id) !== Number(tenantId)) {
    return 'العميل غير موجود أو لا يتبع شركتك'
  }

  const blocking = await db
    .prepare(
      `SELECT 1 AS ok FROM contracts
       WHERE customer_id = ? AND tenant_id = ?
         AND COALESCE(is_archived, 0) = 0
         AND status NOT IN ('مكتمل', 'مؤرشف')
       LIMIT 1`
    )
    .bind(customerId, tenantId)
    .first<{ ok: number }>()
  if (blocking) {
    return 'يوجد عقد نشط لهذا العميل بالفعل. أكمل أو أرشف العقد السابق قبل إنشاء عقد جديد'
  }

  const hasActiveFr = async (agentOnly: boolean): Promise<boolean> => {
    const run = async (frActiveSql: string) => {
      if (agentOnly) {
        return await db
          .prepare(
            `SELECT 1 AS ok FROM financing_requests
             WHERE customer_id = ? AND tenant_id = ? AND assigned_bank_agent_id = ?
               AND ${frActiveSql}
             LIMIT 1`
          )
          .bind(customerId, tenantId, userId)
          .first<{ ok: number }>()
      }
      return await db
        .prepare(
          `SELECT 1 AS ok FROM financing_requests
           WHERE customer_id = ? AND tenant_id = ?
             AND ${frActiveSql}
           LIMIT 1`
        )
        .bind(customerId, tenantId)
        .first<{ ok: number }>()
    }
    try {
      return (await run('COALESCE(is_completed, 0) = 0')) != null
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message || e || '')
      if (/no such column:\s*is_completed/i.test(msg)) {
        return (await run('1=1')) != null
      }
      throw e
    }
  }

  if (roleId === 5) {
    if (!(await hasActiveFr(true))) {
      return 'لا يوجد طلب تمويل نشط مُسند إليك كممثل بنك لهذا العميل'
    }
    return null
  }

  if (roleId === 4) {
    const assigned = await db
      .prepare(
        `SELECT 1 AS ok FROM customer_assignments
         WHERE customer_id = ? AND employee_id = ? LIMIT 1`
      )
      .bind(customerId, userId)
      .first<{ ok: number }>()
    if (!assigned) {
      return 'هذا العميل غير مُسند إليك'
    }
    if (!(await hasActiveFr(false))) {
      return 'لا يوجد طلب تمويل نشط لهذا العميل'
    }
    return null
  }

  if (roleId === 6) {
    const inScope = await db
      .prepare(
        `SELECT 1 AS ok FROM customers
         WHERE id = ? AND tenant_id = ?
           AND (
             EXISTS (
               SELECT 1 FROM customer_assignments ca
               WHERE ca.customer_id = customers.id AND ca.employee_id = ?
             )
             OR customers.assigned_bank_agent_id = ?
             OR EXISTS (
               SELECT 1 FROM financing_requests fr0
               WHERE fr0.customer_id = customers.id AND fr0.assigned_bank_agent_id = ?
             )
           )
         LIMIT 1`
      )
      .bind(customerId, tenantId, userId, userId, userId)
      .first<{ ok: number }>()
    if (!inScope) {
      return 'غير مصرح لك بإنشاء عقد لهذا العميل (غير مُسند إليك كموظف أو ممثل بنك)'
    }
    if (!(await hasActiveFr(false))) {
      return 'لا يوجد طلب تمويل نشط لهذا العميل'
    }
    return null
  }

  return null
}

export async function canUserAccessCustomerWorkflow(
  db: D1Database,
  userInfo: UserInfo,
  customerId: number
): Promise<boolean> {
  const customer = await db
    .prepare('SELECT id, tenant_id FROM customers WHERE id = ?')
    .bind(customerId)
    .first<{ id: number; tenant_id: number | null }>()
  if (!customer) return false
  return canUserAccessCustomer(db, userInfo, customer)
}

export async function canUserAccessRequestWorkflow(
  db: D1Database,
  userInfo: UserInfo,
  requestId: number
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT fr.customer_id, fr.assigned_bank_agent_id, fr.created_by, c.tenant_id AS customer_tenant_id
       FROM financing_requests fr
       LEFT JOIN customers c ON fr.customer_id = c.id
       WHERE fr.id = ?`
    )
    .bind(requestId)
    .first<{
      customer_id?: number | null
      assigned_bank_agent_id?: number | null
      created_by?: number | null
      customer_tenant_id?: number | null
    }>()
  if (!row) return false
  const rid = normalizeRoleId(userInfo.roleId)
  if (rid === 1) return true

  const frScope = {
    customer_id: row.customer_id != null ? Number(row.customer_id) : null,
    customer_tenant_id: row.customer_tenant_id != null ? Number(row.customer_tenant_id) : null,
    assigned_bank_agent_id: row.assigned_bank_agent_id,
    created_by: row.created_by,
  }

  if (rid === 5) {
    return canRole5AccessFinancingRequest(db, userInfo, frScope)
  }
  if (rid === 6) {
    if (await canRole5AccessFinancingRequest(db, userInfo, frScope)) return true
    if (!row.customer_id) return false
    return canUserAccessCustomer(db, userInfo, {
      id: Number(row.customer_id),
      tenant_id: row.customer_tenant_id != null ? Number(row.customer_tenant_id) : null,
    })
  }
  if (row.customer_id) {
    return canUserAccessCustomer(db, userInfo, {
      id: Number(row.customer_id),
      tenant_id: row.customer_tenant_id != null ? Number(row.customer_tenant_id) : null,
    })
  }
  return false
}

/** Users in tenant with role 4 or 5 who must NOT receive customer-scoped alerts. */
export async function listUnauthorizedStaffForCustomerAlerts(
  db: D1Database,
  customer: { id: number; tenant_id: number | null },
  allowedTargetUserIds: number[]
): Promise<number[]> {
  if (customer.tenant_id == null) return []
  const { results } = await db
    .prepare(
      `SELECT id, role_id FROM users
       WHERE tenant_id = ? AND is_active = 1 AND role_id IN (4, 5, 6, 14, 15)`
    )
    .bind(customer.tenant_id)
    .all<{ id: number; role_id: number }>()
  const allowed = new Set(allowedTargetUserIds)
  const leaked: number[] = []
  for (const u of results || []) {
    if (allowed.has(u.id)) continue
    const rid = normalizeRoleId(u.role_id)
    const hasAccess = await canUserAccessCustomer(db, { userId: u.id, tenantId: customer.tenant_id, roleId: rid }, customer)
    if (!hasAccess) leaked.push(u.id)
  }
  return leaked
}

/** Employee-column assignment (customer_assignments). */
export async function hasEmployeeColumnAssignments(db: D1Database, userId: number): Promise<boolean> {
  const row = await db
    .prepare(`SELECT 1 AS ok FROM customer_assignments WHERE employee_id = ? LIMIT 1`)
    .bind(userId)
    .first<{ ok: number }>()
  return Boolean(row?.ok)
}

/** Bank-agent-column assignment on customers or financing requests. */
export async function hasBankAgentColumnAssignments(db: D1Database, userId: number): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS ok
       WHERE EXISTS (
         SELECT 1 FROM customers c WHERE NULLIF(c.assigned_bank_agent_id, 0) = ?
       ) OR EXISTS (
         SELECT 1 FROM financing_requests fr WHERE NULLIF(fr.assigned_bank_agent_id, 0) = ?
       )`
    )
    .bind(userId, userId)
    .first<{ ok: number }>()
  return Boolean(row?.ok)
}

/** Role 6 assigned as both employee and bank agent on the same customer/request. */
export async function hasDualAgentAssignments(db: D1Database, userId: number): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS ok
       FROM customer_assignments ca
       WHERE ca.employee_id = ?
         AND (
           EXISTS (
             SELECT 1 FROM customers c
             WHERE c.id = ca.customer_id
               AND NULLIF(c.assigned_bank_agent_id, 0) = ?
           )
           OR EXISTS (
             SELECT 1 FROM financing_requests fr
             WHERE fr.customer_id = ca.customer_id
               AND NULLIF(fr.assigned_bank_agent_id, 0) = ?
           )
         )
       LIMIT 1`
    )
    .bind(userId, userId, userId)
    .first<{ ok: number }>()
  return Boolean(row?.ok)
}

export type StaffRoleChangeResult =
  | { ok: true }
  | { ok: false; error: string; errorAr: string }

/**
 * Validates role changes for staff roles 4/5/6.
 * - Promotion to role 6 is always allowed.
 * - Role 6 cannot demote to 4/5 while dual-assigned on the same customer/request.
 * - Role 4 ↔ 5 cannot switch when the user has assignments in the current column.
 */
export async function validateStaffRoleChange(
  db: D1Database,
  userId: number,
  currentRoleId: unknown,
  requestedRoleId: unknown
): Promise<StaffRoleChangeResult> {
  const current = normalizeRoleId(currentRoleId)
  const requested = normalizeRoleId(requestedRoleId)
  if (current === requested) return { ok: true }
  if (requested == null) {
    return { ok: false, error: 'Invalid role', errorAr: 'دور غير صحيح' }
  }

  if (requested === 6) return { ok: true }

  if (current === 6 && (requested === 4 || requested === 5)) {
    if (await hasDualAgentAssignments(db, userId)) {
      return {
        ok: false,
        error:
          'Cannot change a dual-role user back to role 4 or 5 while they are assigned as both employee and bank agent.',
        errorAr:
          'لا يمكن تحويل المستخدم المزدوج إلى دور 4 أو 5 بعد تعيينه كموظف وموظف تمويل لنفس العميل أو الطلب.',
      }
    }
    return { ok: true }
  }

  if (current === 4 && requested === 5) {
    if (await hasEmployeeColumnAssignments(db, userId)) {
      return {
        ok: false,
        error: 'Cannot change an employee to bank agent while they are assigned to customers.',
        errorAr: 'لا يمكن تحويل الموظف إلى موظف تمويل بعد تعيينه على عملاء أو طلبات.',
      }
    }
  }

  if (current === 5 && requested === 4) {
    if (await hasBankAgentColumnAssignments(db, userId)) {
      return {
        ok: false,
        error:
          'Cannot change a bank agent to employee while they are assigned to customers or financing requests.',
        errorAr: 'لا يمكن تحويل موظف التمويل إلى موظف بعد تعيينه على عملاء أو طلبات.',
      }
    }
  }

  return { ok: true }
}
