-- Performance indexes for hot list/stats paths.
-- Completed / alarm columns already exist in production (previously added via runtime ALTER).
-- This migration only registers safe indexes.

CREATE INDEX IF NOT EXISTS idx_customers_tenant_created ON customers(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_active ON customers(tenant_id, is_archived, is_completed);
CREATE INDEX IF NOT EXISTS idx_financing_requests_customer ON financing_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_financing_requests_tenant_created ON financing_requests(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_alarms_user_unread ON customer_alarms(user_id, is_read, customer_id);
CREATE INDEX IF NOT EXISTS idx_contact_link_visits_lookup ON contact_link_visits(tenant_id, affiliate_link_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_customer ON customer_assignments(customer_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_archived ON contracts(customer_id, is_archived, id DESC);
