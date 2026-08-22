// IP and device helpers for login restriction.
// Keep this file dependency-free so unit tests don't need the full Worker.

export function clientIp(c: any): string | null {
  // CF-Connecting-IP is set by Cloudflare and cannot be spoofed.
  const cf = c.req.header('CF-Connecting-IP')?.trim()
  if (cf) return cf
  // X-Forwarded-For fallback for local dev only — never trust in production.
  const xff = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()
  return xff || null
}

export function clientCity(c: any): string | null {
  return (c.req.raw as any).cf?.city ?? null
}

export function clientCountry(c: any): string | null {
  return (c.req.raw as any).cf?.country ?? null
}

export function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k.trim() === name) return v.join('=').trim() || null
  }
  return null
}

function ipToU32(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let n = 0
  for (const p of parts) {
    const v = parseInt(p, 10)
    if (isNaN(v) || v < 0 || v > 255) return null
    n = (n << 8) | v
  }
  return n >>> 0
}

// Matches an IPv4 address against an exact IP or CIDR range (e.g. '203.0.113.0/24').
// IPv6 addresses fall back to exact string match only.
export function matchesCidr(ip: string, cidr: string): boolean {
  if (!cidr.includes('/')) return ip === cidr
  const [base, bits] = cidr.split('/')
  const prefix = parseInt(bits, 10)
  if (isNaN(prefix) || prefix < 0 || prefix > 32) return false
  const ipNum = ipToU32(ip)
  const baseNum = ipToU32(base)
  if (ipNum === null || baseNum === null) return ip === base
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0
  return (ipNum & mask) === (baseNum & mask)
}

export function isValidIpOrCidr(value: string): boolean {
  const ipv4Re = /^(\d{1,3}\.){3}\d{1,3}$/
  const cidrRe = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/
  if (!ipv4Re.test(value) && !cidrRe.test(value)) return false
  const base = value.split('/')[0]
  return base.split('.').every((p) => {
    const n = parseInt(p, 10)
    return n >= 0 && n <= 255
  })
}

// Returns true if ip is in the tenant-level allowlist OR the user's verified IP
// (not expired). Either match is sufficient.
export async function isIpAllowed(
  ip: string,
  tenantId: number,
  userId: number,
  db: any
): Promise<boolean> {
  const tenantRows = await db
    .prepare('SELECT ip FROM tenant_login_allowed_ips WHERE tenant_id = ?')
    .bind(tenantId)
    .all<{ ip: string }>()
  for (const row of tenantRows.results ?? []) {
    if (matchesCidr(ip, row.ip)) return true
  }

  const userRow = await db
    .prepare('SELECT ip, expires_at FROM user_login_allowed_ips WHERE user_id = ?')
    .bind(userId)
    .first<{ ip: string; expires_at: string }>()
  if (userRow && new Date(userRow.expires_at) > new Date()) {
    if (matchesCidr(ip, userRow.ip)) return true
  }

  return false
}
