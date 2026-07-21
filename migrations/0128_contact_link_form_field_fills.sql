-- Abandoned contact-form starts (initiated but never submitted), and which fields
-- were non-empty at abandon time. Values are never stored — keys only.
-- affiliate_link_id 0 = main company contact link.

CREATE TABLE IF NOT EXISTS contact_link_form_abandons (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id         INTEGER NOT NULL,
  affiliate_link_id INTEGER NOT NULL DEFAULT 0,
  abandon_date      TEXT NOT NULL,
  abandon_count     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, affiliate_link_id, abandon_date)
);

CREATE INDEX IF NOT EXISTS idx_contact_link_form_abandons_reporting
  ON contact_link_form_abandons (tenant_id, affiliate_link_id, abandon_date);

CREATE TABLE IF NOT EXISTS contact_link_form_field_fills (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id         INTEGER NOT NULL,
  affiliate_link_id INTEGER NOT NULL DEFAULT 0,
  field_key         TEXT NOT NULL,
  fill_date         TEXT NOT NULL,
  fill_count        INTEGER NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, affiliate_link_id, field_key, fill_date)
);

CREATE INDEX IF NOT EXISTS idx_contact_link_form_field_fills_reporting
  ON contact_link_form_field_fills (tenant_id, affiliate_link_id, fill_date);
