// Allocation helpers for tenant-local serial numbers on users and customers.
//
// Each helper runs as a single UPDATE that computes MAX(existing)+1 for the
// row's tenant in the same statement. On D1 writes serialize at the primary,
// so a per-tenant unique index (idx_users_tenant_local_number /
// idx_customers_tenant_local_number) is the fallback safety net rather than
// the primary correctness mechanism.
//
// Callers must invoke these immediately after INSERT. Rows without a tenant
// (SaaS super-admins) are skipped by design.

type D1Like = {
  prepare: (sql: string) => {
    bind: (...args: unknown[]) => { run: () => Promise<unknown> }
  }
}

export async function allocateTenantUserNumber(
  db: D1Like,
  userId: number | bigint | null | undefined,
  tenantId: number | null | undefined,
): Promise<void> {
  const uid = Number(userId)
  const tid = tenantId == null ? null : Number(tenantId)
  if (!uid || Number.isNaN(uid) || tid == null || Number.isNaN(tid) || tid <= 0) return
  await db
    .prepare(
      `UPDATE users
       SET tenant_user_number = (
         SELECT COALESCE(MAX(tenant_user_number), 0) + 1
         FROM users
         WHERE tenant_id = ?
       )
       WHERE id = ? AND tenant_user_number IS NULL`,
    )
    .bind(tid, uid)
    .run()
}

export async function allocateTenantCustomerNumber(
  db: D1Like,
  customerId: number | bigint | null | undefined,
  tenantId: number | null | undefined,
): Promise<void> {
  const cid = Number(customerId)
  const tid = tenantId == null ? null : Number(tenantId)
  if (!cid || Number.isNaN(cid) || tid == null || Number.isNaN(tid) || tid <= 0) return
  await db
    .prepare(
      `UPDATE customers
       SET tenant_customer_number = (
         SELECT COALESCE(MAX(tenant_customer_number), 0) + 1
         FROM customers
         WHERE tenant_id = ?
       )
       WHERE id = ? AND tenant_customer_number IS NULL`,
    )
    .bind(tid, cid)
    .run()
}
