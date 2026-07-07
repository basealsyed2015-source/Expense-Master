-- Banks: per-tenant unique bank_name / bank_code (not global).
-- D1 requires defer_foreign_keys (foreign_keys=OFF is ignored on remote).

PRAGMA defer_foreign_keys = on;

DROP TRIGGER IF EXISTS trg_users_role5_set_tenant_ins;
DROP TRIGGER IF EXISTS trg_users_role5_set_tenant_upd;
DROP TRIGGER IF EXISTS trg_banks_propagate_tenant;

-- Clean up a failed partial run when the original banks table still exists.
DROP TABLE IF EXISTS banks__tenant_unique;

CREATE TABLE banks__tenant_unique (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_name TEXT NOT NULL,
  bank_code TEXT,
  logo_url TEXT,
  is_active INTEGER DEFAULT 1,
  tenant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO banks__tenant_unique (id, bank_name, bank_code, logo_url, is_active, tenant_id, created_at)
SELECT id, bank_name, bank_code, logo_url, is_active, tenant_id, created_at
FROM banks;

DROP TABLE banks;

ALTER TABLE banks__tenant_unique RENAME TO banks;

CREATE INDEX IF NOT EXISTS idx_banks_tenant_id ON banks(tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_banks_tenant_bank_name
  ON banks (COALESCE(tenant_id, -1), bank_name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_banks_tenant_bank_code
  ON banks (COALESCE(tenant_id, -1), bank_code)
  WHERE bank_code IS NOT NULL AND TRIM(bank_code) != '';

INSERT OR REPLACE INTO sqlite_sequence (name, seq)
SELECT 'banks', COALESCE(MAX(id), 0) FROM banks;

PRAGMA defer_foreign_keys = off;
