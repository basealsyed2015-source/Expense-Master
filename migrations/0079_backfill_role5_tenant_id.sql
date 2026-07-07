-- Make users.tenant_id the single source of truth for tenancy, including for
-- role-5 bank agents. Historically agents had users.tenant_id = NULL and the
-- tenant was derived at query time via assigned_bank_id -> banks.tenant_id,
-- which forced every new feature to special-case role 5 (and frequently broke).
--
-- 1) Backfill: copy banks.tenant_id into users.tenant_id for role-5 agents
--    that are currently NULL but have an assigned_bank_id pointing to a bank
--    in a real tenant.
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

-- 2) Triggers keep agents in sync with their bank's tenant on insert/update
--    (and when a bank's own tenant changes). These run cheaply: zero rows for
--    non-agent operations because of the role_id guard.

DROP TRIGGER IF EXISTS trg_users_role5_set_tenant_ins;
CREATE TRIGGER trg_users_role5_set_tenant_ins
AFTER INSERT ON users
WHEN NEW.role_id = 5 AND NEW.tenant_id IS NULL AND NEW.assigned_bank_id IS NOT NULL
BEGIN
  UPDATE users
  SET tenant_id = (SELECT b.tenant_id FROM banks b WHERE b.id = NEW.assigned_bank_id)
  WHERE id = NEW.id;
END;

DROP TRIGGER IF EXISTS trg_users_role5_set_tenant_upd;
CREATE TRIGGER trg_users_role5_set_tenant_upd
AFTER UPDATE OF assigned_bank_id, role_id ON users
WHEN NEW.role_id = 5 AND NEW.tenant_id IS NULL AND NEW.assigned_bank_id IS NOT NULL
BEGIN
  UPDATE users
  SET tenant_id = (SELECT b.tenant_id FROM banks b WHERE b.id = NEW.assigned_bank_id)
  WHERE id = NEW.id;
END;

DROP TRIGGER IF EXISTS trg_banks_propagate_tenant;
CREATE TRIGGER trg_banks_propagate_tenant
AFTER UPDATE OF tenant_id ON banks
WHEN NEW.tenant_id IS NOT NULL
BEGIN
  UPDATE users
  SET tenant_id = NEW.tenant_id
  WHERE assigned_bank_id = NEW.id
    AND role_id = 5;
END;
