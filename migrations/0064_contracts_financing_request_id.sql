-- Link contracts to financing requests; enforced in contracts-module-api for role 4 creation and role 5 scoping.
ALTER TABLE contracts ADD COLUMN financing_request_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_contracts_financing_request ON contracts(financing_request_id);
