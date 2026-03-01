-- Normalize auth + tenant consistency for fresh databases
-- Goal: avoid token/tenant context issues in getUserInfo flow.

-- Ensure baseline tenant exists for non-superadmin fallback assignment.
INSERT OR IGNORE INTO tenants (id, company_name, slug, subdomain, status, max_users, max_customers, max_requests)
VALUES (1, 'شركة التمويل الأولى', 'tamweel-1', 'tamweel1', 'active', 50, 5000, 10000);

-- If any users have invalid or missing role_id, map them safely.
UPDATE users
SET role_id = 4
WHERE role_id IS NULL OR role_id NOT IN (1, 2, 3, 4);

-- Super admins should not be scoped to a tenant.
UPDATE users
SET tenant_id = NULL
WHERE role_id = 1;

-- Non-superadmin users must always have tenant context.
UPDATE users
SET tenant_id = 1
WHERE role_id != 1 AND tenant_id IS NULL;

-- Helpful index for auth/user lookups by tenant + role.
CREATE INDEX IF NOT EXISTS idx_users_role_tenant ON users(role_id, tenant_id);

