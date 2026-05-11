-- Contracts role workflow: creator ownership plus two-step approvals.

ALTER TABLE contracts ADD COLUMN created_by INTEGER;
ALTER TABLE contracts ADD COLUMN bank_agent_approved_by INTEGER;
ALTER TABLE contracts ADD COLUMN bank_agent_approved_at TEXT;
ALTER TABLE contracts ADD COLUMN admin_approved_by INTEGER;
ALTER TABLE contracts ADD COLUMN admin_approved_at TEXT;

CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_approval_status ON contracts(status, created_by);
