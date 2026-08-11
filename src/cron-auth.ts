/**
 * Shared auth for scheduled trigger endpoints.
 * Accepts either a CRON_SECRET bearer / X-Cron-Secret header, or an admin session (role 1/2).
 */

export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

export function extractCronSecretFromHeaders(headers: {
  get(name: string): string | null
}): string {
  const auth = headers.get('Authorization') || ''
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim()
  return (headers.get('X-Cron-Secret') || '').trim()
}

export function isValidCronSecret(provided: string, expected: string | undefined | null): boolean {
  if (!expected || !provided) return false
  return timingSafeEqualString(provided, expected)
}
