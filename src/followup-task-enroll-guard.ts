/**
 * Block manual customer create when an open follow-up task already exists
 * for the same phone — force enrollment via the task flow (task_id).
 */

export type OpenFollowupTaskMatch = {
  task_id: number
  customer_name: string | null
  customer_phone: string
  assigned_user_id: number | null
}

/** Phone variants used for matching customers / follow-ups (966 / local / 05…). */
export function phoneMatchVariants(normalized966: string): string[] {
  const digits = String(normalized966 || '').replace(/[^\d]/g, '')
  if (!digits) return []
  const local = digits.startsWith('966') ? digits.slice(3) : digits
  const legacy10 = local.startsWith('5') && local.length === 9 ? `0${local}` : ''
  const out = [digits, local]
  if (legacy10) out.push(legacy10)
  if (local.length === 9 && local.startsWith('5')) out.push(`966${local}`)
  return [...new Set(out.filter(Boolean))]
}

/** Prefill phone for /admin/customers/add (9 digits starting with 5). */
export function enrollPrefillPhone(rawPhone: string | null | undefined): string {
  const digits = String(rawPhone ?? '').replace(/[^\d]/g, '')
  if (!digits) return ''
  if (digits.startsWith('00966')) return digits.slice(5)
  if (digits.startsWith('966')) return digits.slice(3)
  if (digits.startsWith('05') && digits.length === 10) return digits.slice(1)
  return digits
}

export function buildCustomerEnrollFromTaskHref(task: {
  task_id: number
  customer_name?: string | null
  customer_phone?: string | null
}): string {
  const name = String(task.customer_name || '').trim()
  const phone = enrollPrefillPhone(task.customer_phone)
  let href =
    `/admin/customers/add?full_name=${encodeURIComponent(name)}` +
    `&phone=${encodeURIComponent(phone)}` +
    `&task_id=${encodeURIComponent(String(task.task_id))}`
  return href
}

/**
 * Find the newest non-archived, non-completed/cancelled follow-up task
 * whose follow-up phone matches any common Saudi mobile format of `normalizedPhone`.
 */
export async function findOpenFollowupTaskByPhone(
  db: D1Database,
  tenantId: number,
  normalizedPhone: string
): Promise<OpenFollowupTaskMatch | null> {
  const tid = Number(tenantId)
  if (!Number.isFinite(tid) || tid <= 0) return null
  const variants = phoneMatchVariants(normalizedPhone)
  if (!variants.length) return null

  const placeholders = variants.map(() => '?').join(', ')
  const row = await db
    .prepare(
      `SELECT t.id AS task_id, f.customer_name, f.customer_phone, t.assigned_user_id
       FROM company_contact_followup_tasks t
       INNER JOIN company_contact_followups f ON f.id = t.followup_id
       WHERE t.tenant_id = ?
         AND COALESCE(f.is_archived, 0) = 0
         AND f.customer_phone IN (${placeholders})
         AND (
           t.status IS NULL
           OR TRIM(t.status) = ''
           OR LOWER(TRIM(t.status)) NOT IN ('completed', 'cancelled')
         )
       ORDER BY t.id DESC
       LIMIT 1`
    )
    .bind(tid, ...variants)
    .first<OpenFollowupTaskMatch>()

  return row?.task_id ? row : null
}
