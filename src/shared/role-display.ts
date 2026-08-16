import { normalizeRoleId } from '../notification-access'

export function getRoleDisplayName(roleId: unknown, roleName: string | null | undefined): string {
  const normalizedRoleId = normalizeRoleId(roleId)
  const raw = (roleName || '').trim()
  const rn = raw.toLowerCase()

  if (normalizedRoleId === 1) return 'مدير النظام'
  // Prefer DB label (e.g. حساب شركة) for company accounts
  if (normalizedRoleId === 2) return raw || 'حساب شركة'
  // Numeric 3 = sales supervisor (even if an old migration relabeled the roles row as "employee"/موظف)
  if (normalizedRoleId === 3) return 'مشرف المبيعات'
  if (normalizedRoleId === 4) return 'موظف'
  if (normalizedRoleId === 5) return 'موظف التمويل'
  if (normalizedRoleId === 6) return 'موظف مزدوج'

  // Legacy English keys from older seeds / custom role rows (when role_id is missing or non-standard)
  if (rn === 'supervisor') return 'مشرف المبيعات'
  if (rn === 'employee') return 'موظف'
  if (rn === 'dual_agent') return 'موظف مزدوج'
  if (rn === 'company_admin') return 'حساب شركة'
  if (rn === 'super_admin') return 'مدير النظام'
  if (raw === 'موظف') return 'موظف'
  if (raw === 'مشرف' || raw.includes('مشرف')) return 'مشرف المبيعات'

  return raw || 'غير محدد'
}
