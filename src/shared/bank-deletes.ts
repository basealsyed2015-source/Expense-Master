/** Schema has no ON DELETE CASCADE from banks; clear dependents so DELETE FROM banks succeeds. */
export async function deleteBankAndDependents(db: D1Database, bankId: string | number) {
  await db.batch([
    db.prepare('DELETE FROM bank_financing_rates WHERE bank_id = ?').bind(bankId),
    db.prepare('UPDATE customers SET best_bank_id = NULL WHERE best_bank_id = ?').bind(bankId),
    db.prepare('UPDATE financing_requests SET selected_bank_id = NULL WHERE selected_bank_id = ?').bind(bankId),
    db.prepare('DELETE FROM calculations WHERE bank_id = ?').bind(bankId),
    db.prepare('DELETE FROM banks WHERE id = ?').bind(bankId),
  ])
}

/** Same as deleteBankAndDependents for all banks with tenant_id IS NULL (super-admin bulk delete). */
export async function deleteGlobalBanksAndDependents(db: D1Database) {
  return db.batch([
    db.prepare(
      'DELETE FROM bank_financing_rates WHERE bank_id IN (SELECT id FROM banks WHERE tenant_id IS NULL)'
    ),
    db.prepare(
      'UPDATE customers SET best_bank_id = NULL WHERE best_bank_id IN (SELECT id FROM banks WHERE tenant_id IS NULL)'
    ),
    db.prepare(
      'UPDATE financing_requests SET selected_bank_id = NULL WHERE selected_bank_id IN (SELECT id FROM banks WHERE tenant_id IS NULL)'
    ),
    db.prepare(
      'DELETE FROM calculations WHERE bank_id IN (SELECT id FROM banks WHERE tenant_id IS NULL)'
    ),
    db.prepare('DELETE FROM banks WHERE tenant_id IS NULL'),
  ])
}
