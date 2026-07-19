-- Columns is_archived, archived_at, archived_by, is_completed were already applied
-- manually to production; this migration only adds the indexes.

CREATE INDEX IF NOT EXISTS idx_customers_is_archived ON customers(is_archived);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_active ON customers(tenant_id, is_archived, is_completed);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_archived ON contracts(customer_id, is_archived, id DESC);
