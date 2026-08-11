-- Cheap audit trail for blocked contract creates (one small D1 row per denial).
-- Used to investigate create failures without relying on Cloudflare console logs.

CREATE TABLE IF NOT EXISTS contract_create_denials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER,
  role_id INTEGER,
  customer_id INTEGER,
  error_code TEXT NOT NULL,
  detail TEXT,
  party_two_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contract_create_denials_tenant_created
  ON contract_create_denials (tenant_id, created_at DESC);
