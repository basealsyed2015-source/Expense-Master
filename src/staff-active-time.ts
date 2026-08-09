/**
 * Staff active-time tracking helpers (roles 4/5/6).
 * See docs/plan_staff_active_time.md and migration 0142.
 */

import { normalizeRoleId } from './notification-access.ts'

export const HEARTBEAT_MAX_DELTA_S = 90
export const HEARTBEAT_MIN_DELTA_S = 5

/** Roles allowed to accrue active-time (staff only; legacy 14/15 map to 4/5). */
export function isStaffRoleForActivity(roleId: unknown): boolean {
  const r = normalizeRoleId(roleId)
  return r === 4 || r === 5 || r === 6
}

/**
 * Compute how many seconds to credit for a heartbeat.
 * - No previous heartbeat → 0 (first ping just seeds the marker).
 * - Delta < HEARTBEAT_MIN_DELTA_S → 0 (noise).
 * - Otherwise → min(HEARTBEAT_MAX_DELTA_S, delta).
 * Never trusts client-sent totals.
 */
export function computeHeartbeatCredit(
  lastHeartbeatIso: string | null | undefined,
  nowMs: number
): number {
  if (!lastHeartbeatIso) return 0
  const last = Date.parse(lastHeartbeatIso)
  if (!Number.isFinite(last)) return 0
  const delta = Math.floor((nowMs - last) / 1000)
  if (delta < HEARTBEAT_MIN_DELTA_S) return 0
  return Math.min(HEARTBEAT_MAX_DELTA_S, delta)
}

export type HeartbeatResult =
  | { ok: true; credited: number }
  | { ok: false; status: 401 | 403; error: string }

/**
 * Persist a heartbeat: upsert the per-user marker, then add credited seconds
 * to the daily rollup. Returns { ok, credited } for callers.
 */
export async function recordHeartbeat(
  db: D1Database,
  userInfo: { userId: number | null; tenantId: number | null; roleId: unknown },
  nowMs: number = Date.now()
): Promise<HeartbeatResult> {
  if (!userInfo.userId || userInfo.tenantId == null) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  if (!isStaffRoleForActivity(userInfo.roleId)) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  const userId = Number(userInfo.userId)
  const tenantId = Number(userInfo.tenantId)
  const nowIso = new Date(nowMs).toISOString()
  const activityDate = nowIso.slice(0, 10)

  const state = await db
    .prepare('SELECT last_heartbeat_at FROM user_active_time_state WHERE user_id = ?')
    .bind(userId)
    .first<{ last_heartbeat_at: string }>()

  const credited = computeHeartbeatCredit(state?.last_heartbeat_at ?? null, nowMs)

  await db
    .prepare(
      `INSERT INTO user_active_time_state (user_id, tenant_id, last_heartbeat_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         tenant_id = excluded.tenant_id,
         last_heartbeat_at = excluded.last_heartbeat_at`
    )
    .bind(userId, tenantId, nowIso)
    .run()

  if (credited > 0) {
    await db
      .prepare(
        `INSERT INTO user_active_time_daily (user_id, tenant_id, activity_date, active_seconds)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, activity_date) DO UPDATE SET
           active_seconds = active_seconds + excluded.active_seconds,
           tenant_id = excluded.tenant_id`
      )
      .bind(userId, tenantId, activityDate, credited)
      .run()
  }

  return { ok: true, credited }
}

export type StaffActiveTimeRow = {
  user_id: number
  full_name: string
  role_id: number
  total_active_seconds: number
  days_active: number
}

export type StaffActiveTimeReport =
  | { ok: true; start_date: string; end_date: string; rows: StaffActiveTimeRow[] }
  | { ok: false; status: 401 | 403; error: string }

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function defaultDate(offsetDays: number, nowMs: number): string {
  return new Date(nowMs + offsetDays * 86400000).toISOString().slice(0, 10)
}

/**
 * Aggregate active seconds per staff user in a tenant for the given date range.
 * Role 2 (company admin) only; enforces tenant scope on the DB side.
 */
export async function getStaffActiveTimeReport(
  db: D1Database,
  userInfo: { userId: number | null; tenantId: number | null; roleId: unknown },
  query: { start_date?: string | null; end_date?: string | null },
  nowMs: number = Date.now()
): Promise<StaffActiveTimeReport> {
  if (!userInfo.userId || userInfo.tenantId == null) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  if (normalizeRoleId(userInfo.roleId) !== 2) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }

  const tenantId = Number(userInfo.tenantId)
  const rawStart = String(query.start_date || '').slice(0, 10)
  const rawEnd = String(query.end_date || '').slice(0, 10)
  const startDate = ISO_DATE_RE.test(rawStart) ? rawStart : defaultDate(-30, nowMs)
  const endDate = ISO_DATE_RE.test(rawEnd) ? rawEnd : defaultDate(0, nowMs)

  const { results } = await db
    .prepare(
      `SELECT u.id AS user_id, u.full_name, u.role_id,
              COALESCE(SUM(d.active_seconds), 0) AS total_active_seconds,
              COUNT(DISTINCT CASE WHEN d.active_seconds > 0 THEN d.activity_date END) AS days_active
       FROM users u
       LEFT JOIN user_active_time_daily d
         ON d.user_id = u.id
        AND d.tenant_id = u.tenant_id
        AND d.activity_date BETWEEN ? AND ?
       WHERE u.tenant_id = ?
         AND u.role_id IN (4, 5, 6, 14, 15)
         AND COALESCE(u.is_active, 1) = 1
       GROUP BY u.id, u.full_name, u.role_id
       ORDER BY total_active_seconds DESC, u.full_name ASC`
    )
    .bind(startDate, endDate, tenantId)
    .all<{
      user_id: number
      full_name: string
      role_id: number
      total_active_seconds: number
      days_active: number
    }>()

  return {
    ok: true,
    start_date: startDate,
    end_date: endDate,
    rows: (results || []).map((r) => ({
      user_id: Number(r.user_id),
      full_name: String(r.full_name || ''),
      role_id: normalizeRoleId(r.role_id) ?? Number(r.role_id),
      total_active_seconds: Number(r.total_active_seconds || 0),
      days_active: Number(r.days_active || 0),
    })),
  }
}
