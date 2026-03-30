-- Link contracts to existing customers for relational reporting/filtering
ALTER TABLE contracts ADD COLUMN customer_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
