-- Branch-based assignment fields.
--
-- 1. Employees can be pinned to a single tenant_locations branch.
-- 2. Marketing (contact) links and the tenant-wide company link gain a
--    `branch` assignment mode that restricts auto-assign to employees of a
--    specific branch. `assignment_branch_id` names that branch.

ALTER TABLE users ADD COLUMN assigned_location_id INTEGER REFERENCES tenant_locations(id);

ALTER TABLE tenant_contact_affiliate_links ADD COLUMN assignment_branch_id INTEGER REFERENCES tenant_locations(id);

ALTER TABLE tenants ADD COLUMN contact_assignment_branch_id INTEGER REFERENCES tenant_locations(id);

CREATE INDEX IF NOT EXISTS idx_users_assigned_location ON users(tenant_id, assigned_location_id) WHERE assigned_location_id IS NOT NULL;
