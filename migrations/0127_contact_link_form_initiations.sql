-- Tracks when a visitor starts typing in at least one field on the public contact form.
-- 0 identifies the main company contact link; affiliate links use their row ID.
CREATE TABLE IF NOT EXISTS contact_link_form_initiations (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id         INTEGER NOT NULL,
  affiliate_link_id INTEGER NOT NULL DEFAULT 0,
  initiation_date   TEXT NOT NULL,
  initiation_count  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, affiliate_link_id, initiation_date)
);

CREATE INDEX IF NOT EXISTS idx_contact_link_form_initiations_reporting
  ON contact_link_form_initiations (tenant_id, affiliate_link_id, initiation_date);
