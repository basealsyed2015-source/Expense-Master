import { normalizeRoleId } from './notification-access.ts'

/** Admin HTML route for financing-request follow-up report. */
export const REQUESTS_FOLLOWUP_REPORT_ADMIN_PATH = '/admin/reports/requests-followup'

/**
 * Requests follow-up report: super admin (1), company admin (2), sales supervisor (3) only.
 * Roles 4, 5, 6 (and legacy 14–15) must not access page or API.
 */
export function canAccessRequestsFollowupReport(roleId: unknown): boolean {
  const r = normalizeRoleId(roleId)
  return r === 1 || r === 2 || r === 3
}

export function isRequestsFollowupReportAdminPath(pathname: string): boolean {
  return (
    pathname === REQUESTS_FOLLOWUP_REPORT_ADMIN_PATH ||
    pathname.startsWith(REQUESTS_FOLLOWUP_REPORT_ADMIN_PATH + '/')
  )
}
