/**
 * Shared performance helpers for request timing, pagination, and debug gates.
 */

export type UserInfo = {
  userId: number | null
  tenantId: number | null
  roleId: number | null
  tokenRoleId: number | null
  assignedBankId: number | null
}

export const EMPTY_USER_INFO: UserInfo = {
  userId: null,
  tenantId: null,
  roleId: null,
  tokenRoleId: null,
  assignedBankId: null,
}

export function envFlagEnabled(env: Record<string, unknown> | undefined, key: string): boolean {
  const v = env?.[key]
  return v === '1' || v === 'true' || v === true || v === 1
}

export function authDebugEnabled(env: Record<string, unknown> | undefined): boolean {
  return envFlagEnabled(env, 'DEBUG_AUTH')
}

export function perfDebugEnabled(env: Record<string, unknown> | undefined): boolean {
  return envFlagEnabled(env, 'PERF_DEBUG')
}

export function inlineTailwindEnabled(env: Record<string, unknown> | undefined): boolean {
  return envFlagEnabled(env, 'INLINE_TAILWIND')
}

export function perfLog(env: Record<string, unknown> | undefined, label: string, ms: number, extra?: Record<string, unknown>): void {
  if (!perfDebugEnabled(env)) return
  if (extra) console.log(`[perf] ${label}: ${ms.toFixed(1)}ms`, extra)
  else console.log(`[perf] ${label}: ${ms.toFixed(1)}ms`)
}

export async function withPerfTiming<T>(
  env: Record<string, unknown> | undefined,
  label: string,
  fn: () => Promise<T>,
  extra?: Record<string, unknown>
): Promise<T> {
  const start = Date.now()
  try {
    return await fn()
  } finally {
    perfLog(env, label, Date.now() - start, extra)
  }
}

export function parsePageParams(
  query: { page?: string | null; pageSize?: string | null },
  defaults: { page?: number; pageSize?: number; maxPageSize?: number } = {}
): { page: number; pageSize: number; offset: number } {
  const defaultPage = defaults.page ?? 1
  const defaultPageSize = defaults.pageSize ?? 15
  const maxPageSize = defaults.maxPageSize ?? 100
  let page = Number.parseInt(String(query.page ?? ''), 10)
  let pageSize = Number.parseInt(String(query.pageSize ?? ''), 10)
  if (!Number.isFinite(page) || page < 1) page = defaultPage
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = defaultPageSize
  if (pageSize > maxPageSize) pageSize = maxPageSize
  return { page, pageSize, offset: (page - 1) * pageSize }
}

export function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 1) return 1
  if (page < 1) return 1
  if (page > totalPages) return totalPages
  return page
}

/** Soft bundle-size budget for dist/_worker.js (bytes). Used by tests. */
export const WORKER_BUNDLE_SOFT_BUDGET_BYTES = 4_500_000
