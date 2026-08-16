/**
 * Auth-token parsing + resolving current user info from request context.
 *
 * Cookie/Authorization header parsing, tenant scoping, and role normalization
 * are consumed by essentially every authenticated handler in the app.
 */
import { normalizeRoleId } from '../notification-access.ts'
import { EMPTY_USER_INFO, authDebugEnabled, type UserInfo } from '../perf-helpers.ts'

export function readAuthTokenFromCookieHeader(cookieHeader: string | undefined): string {
  if (!cookieHeader) return ''
  const cookies = cookieHeader.split(';').map((cookie: string) => cookie.trim())
  const authCookie = cookies.find((cookie: string) => cookie.startsWith('authToken='))
  if (!authCookie) return ''
  return authCookie.startsWith('authToken=') ? authCookie.slice('authToken='.length) : ''
}

export function normalizeAuthToken(rawToken: string): string | null {
  const trimmed = rawToken.trim()
  if (!trimmed) {
    return null
  }

  let decodedToken = trimmed
  try {
    decodedToken = decodeURIComponent(trimmed)
  } catch {
    // If the token isn't URI-encoded, use it as-is.
  }

  const base64 = decodedToken.replace(/-/g, '+').replace(/_/g, '/')
  const remainder = base64.length % 4
  if (remainder === 1) {
    return null
  }

  const padding = remainder === 0 ? '' : '='.repeat(4 - remainder)
  return base64 + padding
}

export function parseOptionalInt(value?: string): number | null {
  if (!value || value === 'null' || value === 'undefined') {
    return null
  }
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export function parseLoginTimestampToMs(value?: string | null): number | null {
  if (!value) {
    return null
  }
  // SQLite timestamps are commonly stored as "YYYY-MM-DD HH:MM:SS[.SSS]".
  // Normalize to ISO-8601 UTC to compare against token issue time.
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const withTimezone = /Z$|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`
  const ms = Date.parse(withTimezone)
  return Number.isNaN(ms) ? null : ms
}

export function cacheUserInfo(c: any, info: UserInfo): UserInfo {
  try {
    if (typeof c?.set === 'function') c.set('userInfo', info)
  } catch {
    /* context may be unavailable outside request handlers */
  }
  return info
}

export async function resolveUserInfoFromAuthToken(
  c: any,
  rawToken: string,
  log: (...args: unknown[]) => void
): Promise<UserInfo | null> {
  const normalizedToken = normalizeAuthToken(rawToken)
  if (!normalizedToken) return null

  const decoded = atob(normalizedToken)
  const parts = decoded.split(':')
  const userId = parseOptionalInt(parts[0])
  if (!userId) return null

  const tenantIdFromToken = parseOptionalInt(parts[1])
  const tokenRoleId = normalizeRoleId(parseOptionalInt(parts[2]))
  const tokenIssuedAtMs = parseOptionalInt(parts[3])
  if (!tokenIssuedAtMs) return null
  log('🔍 [getUserInfo] Parsed:', { userId, tenantIdFromToken, tokenRoleId, tokenIssuedAtMs })

  if (!c.env?.DB) {
    console.error('❌ [getUserInfo] DB binding not available')
    return { ...EMPTY_USER_INFO, tokenRoleId: tokenRoleId ?? null }
  }

  const user = await c.env.DB.prepare(`
    SELECT id, tenant_id, role_id, last_login, assigned_bank_id FROM users WHERE id = ?
  `).bind(userId).first()

  if (!user) return { ...EMPTY_USER_INFO, tokenRoleId }

  const userLastLoginMs = parseLoginTimestampToMs((user as { last_login?: string | null }).last_login ?? null)
  if (userLastLoginMs && tokenIssuedAtMs < userLastLoginMs) {
    log('❌ [getUserInfo] Token invalidated by a newer login', {
      tokenIssuedAtMs,
      userLastLoginMs,
    })
    return null
  }

  const normalizedRoleId = normalizeRoleId(user.role_id)
  const assignedBankFromRow = (user as { assigned_bank_id?: number | null }).assigned_bank_id
  const assignedBankId =
    assignedBankFromRow != null && !Number.isNaN(Number(assignedBankFromRow))
      ? Number(assignedBankFromRow)
      : null

  if (normalizedRoleId === 1) {
    const queryTenantId = c.req.query('tenant_id')
    return {
      userId: user.id,
      tenantId: queryTenantId ? parseInt(queryTenantId) : null,
      roleId: 1,
      tokenRoleId,
      assignedBankId: null,
    }
  }

  const dbTenantId = (user as { tenant_id?: number | null }).tenant_id
  let tenantIdResolved: number | null = dbTenantId != null ? dbTenantId : tenantIdFromToken

  if (
    tenantIdResolved == null &&
    (normalizedRoleId === 5 || normalizedRoleId === 6) &&
    assignedBankId != null &&
    c.env?.DB
  ) {
    try {
      const bankRow = await c.env.DB.prepare('SELECT tenant_id FROM banks WHERE id = ? LIMIT 1')
        .bind(assignedBankId)
        .first<{ tenant_id: number | null }>()
      if (bankRow?.tenant_id != null && !Number.isNaN(Number(bankRow.tenant_id))) {
        tenantIdResolved = Number(bankRow.tenant_id)
      }
    } catch (_) {
      /* ignore */
    }
  }

  return {
    userId: user.id,
    tenantId: tenantIdResolved,
    roleId: normalizedRoleId,
    tokenRoleId,
    assignedBankId: normalizedRoleId === 5 || normalizedRoleId === 6 ? assignedBankId : null,
  }
}

// Get tenant_id for current user (for multi-tenancy filtering)
export async function getUserInfo(c: any): Promise<UserInfo> {
  try {
    try {
      const cached = typeof c?.get === 'function' ? (c.get('userInfo') as UserInfo | undefined) : undefined
      if (cached) return cached
    } catch {
      /* ignore */
    }

    const dbg = authDebugEnabled(c.env)
    const log = (...args: unknown[]) => { if (dbg) console.log(...args) }

    log('🔍 [getUserInfo] Starting user info retrieval...')
    const headerToken = (c.req.header('Authorization')?.replace(/^Bearer\s+/i, '') || '').trim()
    const cookieToken = readAuthTokenFromCookieHeader(c.req.header('Cookie'))
    log('🔍 [getUserInfo] Token from header:', headerToken ? 'Found' : 'Not found')
    log('🔍 [getUserInfo] Token from cookie:', cookieToken ? 'Found' : 'Not found')

    const tokenCandidates: string[] = []
    if (headerToken) tokenCandidates.push(headerToken)
    // Stale localStorage tokens are often sent in Authorization while the browser
    // still holds a fresh authToken cookie — try the cookie when the header fails.
    if (cookieToken && cookieToken !== headerToken) tokenCandidates.push(cookieToken)

    if (!tokenCandidates.length) {
      log('❌ [getUserInfo] No token found in header or cookie')
      const queryTenantId = c.req.query('tenant_id')
      return cacheUserInfo(c, {
        userId: null,
        tenantId: queryTenantId ? parseInt(queryTenantId) : null,
        roleId: null,
        tokenRoleId: null,
        assignedBankId: null,
      })
    }

    for (const rawToken of tokenCandidates) {
      const resolved = await resolveUserInfoFromAuthToken(c, rawToken, log)
      if (resolved?.userId) return cacheUserInfo(c, resolved)
    }

    return cacheUserInfo(c, EMPTY_USER_INFO)
  } catch (error: any) {
    if (authDebugEnabled(c?.env)) {
      console.error('❌ [getUserInfo] ERROR:', error?.message || error)
    }
    return cacheUserInfo(c, EMPTY_USER_INFO)
  }
}
