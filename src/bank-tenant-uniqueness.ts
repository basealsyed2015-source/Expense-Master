export function bankTenantScopeKey(tenantId: number | null | undefined): number {
  return tenantId == null ? -1 : tenantId
}

export async function findBankDuplicate(
  db: D1Database,
  opts: { tenantId: number | null; bankName?: string; bankCode?: string; excludeId?: number }
): Promise<'name' | 'code' | null> {
  const scope = bankTenantScopeKey(opts.tenantId)
  if (opts.bankName != null && String(opts.bankName).trim() !== '') {
    const nameRow = await db.prepare(`
      SELECT id FROM banks
      WHERE COALESCE(tenant_id, -1) = ?
        AND LOWER(TRIM(bank_name)) = LOWER(TRIM(?))
        ${opts.excludeId != null ? 'AND id != ?' : ''}
      LIMIT 1
    `).bind(
      scope,
      opts.bankName,
      ...(opts.excludeId != null ? [opts.excludeId] : [])
    ).first()
    if (nameRow) return 'name'
  }
  const code = opts.bankCode != null ? String(opts.bankCode).trim() : ''
  if (code !== '') {
    const codeRow = await db.prepare(`
      SELECT id FROM banks
      WHERE COALESCE(tenant_id, -1) = ?
        AND LOWER(TRIM(bank_code)) = LOWER(?)
        ${opts.excludeId != null ? 'AND id != ?' : ''}
      LIMIT 1
    `).bind(
      scope,
      code,
      ...(opts.excludeId != null ? [opts.excludeId] : [])
    ).first()
    if (codeRow) return 'code'
  }
  return null
}

export function bankDuplicateMessage(kind: 'name' | 'code'): string {
  if (kind === 'code') {
    return 'يوجد بنك بنفس الكود في شركتك. الرجاء اختيار كود آخر.'
  }
  return 'يوجد بنك بنفس الاسم في شركتك. الرجاء اختيار اسم آخر.'
}

export function mapBankDbError(error: unknown): string | null {
  const msg = String((error as { message?: string })?.message || '')
  if (!msg.includes('UNIQUE constraint')) return null
  if (/bank_code|idx_banks_tenant_bank_code/i.test(msg)) {
    return bankDuplicateMessage('code')
  }
  return bankDuplicateMessage('name')
}
