CREATE TABLE IF NOT EXISTS tenant_contact_affiliate_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  path_segment TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE (tenant_id, path_segment)
);

CREATE INDEX IF NOT EXISTS idx_tenant_contact_affiliate_links_tenant
  ON tenant_contact_affiliate_links (tenant_id);

ALTER TABLE company_contact_followups ADD COLUMN affiliate_path_segment TEXT;
ALTER TABLE company_contact_followups ADD COLUMN affiliate_label TEXT;
