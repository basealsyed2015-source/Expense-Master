export const TENANT_WHATSAPP_GREETING_MAX_LEN = 2000

export async function fetchTenantWhatsappSettings(
  db: D1Database,
  tenantId: number | null | undefined
): Promise<{ greeting: string; companyName: string }> {
  if (!tenantId) return { greeting: '', companyName: '' }
  try {
    const row = await db
      .prepare('SELECT whatsapp_greeting, company_name FROM tenants WHERE id = ? LIMIT 1')
      .bind(tenantId)
      .first<{ whatsapp_greeting: string | null; company_name: string | null }>()
    return {
      greeting: String(row?.whatsapp_greeting ?? '').trim(),
      companyName: String(row?.company_name ?? '').trim(),
    }
  } catch {
    return { greeting: '', companyName: '' }
  }
}

export function buildWaGreetingClientScript(greeting: string, companyName: string): string {
  return `const waGreetingTemplate = ${JSON.stringify(greeting)};
          const waCompanyName = ${JSON.stringify(companyName)};
          function applyWaGreetingTemplate(customerName) {
            if (!waGreetingTemplate) return '';
            return String(waGreetingTemplate)
              .replace(/\\{\\{customer_name\\}\\}/g, String(customerName || ''))
              .replace(/\\{\\{company_name\\}\\}/g, waCompanyName || '');
          }`
}

export function normalizeTenantWhatsappGreetingField(
  raw: unknown
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null) return { ok: true, value: null }
  const trimmed = String(raw).trim()
  if (trimmed === '') return { ok: true, value: null }
  if (trimmed.length > TENANT_WHATSAPP_GREETING_MAX_LEN) {
    return {
      ok: false,
      error: `رسالة واتساب طويلة جداً (الحد الأقصى ${TENANT_WHATSAPP_GREETING_MAX_LEN} حرفاً)`,
    }
  }
  return { ok: true, value: trimmed }
}

/** Persist greeting for one tenant only (used by company admin PATCH). */
export async function updateTenantWhatsappGreeting(
  db: D1Database,
  tenantId: number,
  greeting: string | null
): Promise<void> {
  await db
    .prepare('UPDATE tenants SET whatsapp_greeting = ? WHERE id = ?')
    .bind(greeting, tenantId)
    .run()
}
