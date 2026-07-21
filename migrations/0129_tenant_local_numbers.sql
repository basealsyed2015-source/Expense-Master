-- Tenant-local serial numbers for users and customers.
--
-- Global users.id / customers.id remain the internal PKs used by auth, routes,
-- and foreign keys. This migration adds a permanent tenant-scoped serial
-- (tenant_user_number, tenant_customer_number) that resets to 1 per tenant and
-- is never reused or renumbered.
--
-- The stability of these serials depends on the invariant that a user's tenant
-- and a bank's tenant never change. This migration also removes the legacy
-- "user follows bank tenant" triggers from 0079 and installs immutability
-- triggers instead. Bank agents are tenant-bound like employees; if a bank
-- ever needs to move tenants, that must be a deliberate schema-level operation,
-- not an implicit runtime side-effect.

-- 1) Drop the legacy triggers from 0079 that shuffle users.tenant_id.
DROP TRIGGER IF EXISTS trg_users_role5_set_tenant_ins;
DROP TRIGGER IF EXISTS trg_users_role5_set_tenant_upd;
DROP TRIGGER IF EXISTS trg_banks_propagate_tenant;

-- 2) One-time cleanup for any role-5 user still sitting at NULL tenant_id but
--    with an assigned bank in a real tenant. This is the same fix the deleted
--    insert trigger used to apply implicitly.
UPDATE users
SET tenant_id = (
  SELECT b.tenant_id
  FROM banks b
  WHERE b.id = users.assigned_bank_id
)
WHERE role_id = 5
  AND tenant_id IS NULL
  AND assigned_bank_id IS NOT NULL
  AND (SELECT b.tenant_id FROM banks b WHERE b.id = users.assigned_bank_id) IS NOT NULL;

-- 3) Add tenant-local serial columns. Nullable — super-admins without a tenant
--    do not receive a number and display as "—".
ALTER TABLE users ADD COLUMN tenant_user_number INTEGER;
ALTER TABLE customers ADD COLUMN tenant_customer_number INTEGER;

-- 4) Backfill per tenant from 1 in chronological (created_at, id) order.
UPDATE users
SET tenant_user_number = numbered.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY tenant_id
    ORDER BY created_at, id
  ) AS rn
  FROM users
  WHERE tenant_id IS NOT NULL
) AS numbered
WHERE users.id = numbered.id;

UPDATE customers
SET tenant_customer_number = numbered.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY tenant_id
    ORDER BY created_at, id
  ) AS rn
  FROM customers
  WHERE tenant_id IS NOT NULL
) AS numbered
WHERE customers.id = numbered.id;

-- 5) Partial unique indexes enforce per-tenant uniqueness while leaving
--    tenant-less rows (super-admins) unconstrained.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tenant_local_number
  ON users(tenant_id, tenant_user_number)
  WHERE tenant_id IS NOT NULL AND tenant_user_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_tenant_local_number
  ON customers(tenant_id, tenant_customer_number)
  WHERE tenant_id IS NOT NULL AND tenant_customer_number IS NOT NULL;

-- 6) Immutability triggers.
--    Once a user or bank has a tenant_id, it cannot be changed to a different
--    non-null value. Setting from NULL to a real tenant is allowed once (for
--    orphan rows). Clearing back to NULL is rejected too — losing a tenant
--    would orphan the row's serial number.

DROP TRIGGER IF EXISTS trg_users_tenant_id_immutable;
CREATE TRIGGER trg_users_tenant_id_immutable
BEFORE UPDATE OF tenant_id ON users
FOR EACH ROW
WHEN OLD.tenant_id IS NOT NULL AND (NEW.tenant_id IS NULL OR NEW.tenant_id != OLD.tenant_id)
BEGIN
  SELECT RAISE(ABORT, 'users.tenant_id is immutable once set');
END;

DROP TRIGGER IF EXISTS trg_banks_tenant_id_immutable;
CREATE TRIGGER trg_banks_tenant_id_immutable
BEFORE UPDATE OF tenant_id ON banks
FOR EACH ROW
WHEN OLD.tenant_id IS NOT NULL AND (NEW.tenant_id IS NULL OR NEW.tenant_id != OLD.tenant_id)
BEGIN
  SELECT RAISE(ABORT, 'banks.tenant_id is immutable once set');
END;

-- 7) HR employees: employee_code stays as USR{globalId} (the column is globally
--    UNIQUE and rebuilding the table to relax that is risky). employee_number
--    is the human-facing serial and gets the tenant-local user number so it
--    matches the users list, user detail page, and users-management-page.
--    Seed rows that were never linked to a user (employee_code NOT LIKE 'USR%')
--    keep their existing employee_number untouched.
UPDATE hr_employees
SET employee_number = CAST(
  (SELECT tenant_user_number FROM users WHERE users.id = CAST(SUBSTR(hr_employees.employee_code, 4) AS INTEGER))
  AS TEXT
)
WHERE hr_employees.employee_code LIKE 'USR%'
  AND (SELECT tenant_user_number FROM users WHERE users.id = CAST(SUBSTR(hr_employees.employee_code, 4) AS INTEGER)) IS NOT NULL;
