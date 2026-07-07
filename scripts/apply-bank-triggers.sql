DROP TRIGGER IF EXISTS trg_users_role5_set_tenant_ins;
DROP TRIGGER IF EXISTS trg_users_role5_set_tenant_upd;
DROP TRIGGER IF EXISTS trg_banks_propagate_tenant;

CREATE TRIGGER trg_users_role5_set_tenant_ins
AFTER INSERT ON users
WHEN NEW.role_id = 5 AND NEW.tenant_id IS NULL AND NEW.assigned_bank_id IS NOT NULL
BEGIN
  UPDATE users
  SET tenant_id = (SELECT b.tenant_id FROM banks b WHERE b.id = NEW.assigned_bank_id)
  WHERE id = NEW.id;
END;

CREATE TRIGGER trg_users_role5_set_tenant_upd
AFTER UPDATE OF assigned_bank_id, role_id ON users
WHEN NEW.role_id = 5 AND NEW.tenant_id IS NULL AND NEW.assigned_bank_id IS NOT NULL
BEGIN
  UPDATE users
  SET tenant_id = (SELECT b.tenant_id FROM banks b WHERE b.id = NEW.assigned_bank_id)
  WHERE id = NEW.id;
END;

CREATE TRIGGER trg_banks_propagate_tenant
AFTER UPDATE OF tenant_id ON banks
WHEN NEW.tenant_id IS NOT NULL
BEGIN
  UPDATE users
  SET tenant_id = NEW.tenant_id
  WHERE assigned_bank_id = NEW.id
    AND role_id = 5;
END;
