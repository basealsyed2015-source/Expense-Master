/**
 * Single source of truth for writing a customer's bank-agent assignment.
 *
 * Any code path that mutates customers.assigned_bank_agent_id must go through
 * assignBankAgentToCustomer so financing_requests.assigned_bank_agent_id stays
 * aligned. Direct UPDATE customers SET assigned_bank_agent_id lets the FR
 * column drift and silently breaks role 5/6 scope, contract bank-agent
 * approval, and transfer accept assumptions.
 *
 * Legacy schema note: some environments still lack the FR column. The sync
 * helper swallows only "no such column: assigned_bank_agent_id" — everything
 * else propagates so callers (e.g. transfer accept batch) fail cleanly.
 */

export async function setCustomerAssignedBankAgent(
  db: D1Database,
  customerId: number,
  agentId: number | null
): Promise<{ ok: boolean; missingColumn?: boolean }> {
  try {
    await db
      .prepare(`UPDATE customers SET assigned_bank_agent_id = ? WHERE id = ?`)
      .bind(agentId, customerId)
      .run()
    return { ok: true }
  } catch (e: unknown) {
    const msg = String((e as { message?: string })?.message || e || '')
    if (/no such column:\s*assigned_bank_agent_id/i.test(msg)) {
      return { ok: false, missingColumn: true }
    }
    throw e
  }
}

/** Keep financing_requests.assigned_bank_agent_id aligned with the customer record. */
export async function syncFinancingRequestsBankAgentForCustomer(
  db: D1Database,
  customerId: number,
  agentId: number | null
): Promise<void> {
  try {
    await db
      .prepare(
        `UPDATE financing_requests SET assigned_bank_agent_id = ? WHERE customer_id = ?`
      )
      .bind(agentId, customerId)
      .run()
  } catch (e: unknown) {
    const msg = String((e as { message?: string })?.message || e || '')
    if (/no such column:\s*assigned_bank_agent_id/i.test(msg)) return
    throw e
  }
}

/**
 * Canonical entry point for every customer-level bank-agent write. Updates
 * customers first, then syncs all FRs for that customer. If the customers
 * update reports the legacy missing-column state, the FR sync is skipped
 * (nothing to align to) and the caller still learns via the return value.
 */
export async function assignBankAgentToCustomer(
  db: D1Database,
  customerId: number,
  agentId: number | null
): Promise<{ ok: boolean; missingColumn?: boolean }> {
  const persisted = await setCustomerAssignedBankAgent(db, customerId, agentId)
  if (persisted.ok) {
    await syncFinancingRequestsBankAgentForCustomer(db, customerId, agentId)
  }
  return persisted
}
