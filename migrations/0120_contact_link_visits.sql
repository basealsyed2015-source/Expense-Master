-- 0 identifies the main company contact link; affiliate links use their row ID.
CREATE TABLE IF NOT EXISTS contact_link_visits (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id         INTEGER NOT NULL,
  affiliate_link_id INTEGER NOT NULL DEFAULT 0,
  visit_date        TEXT NOT NULL,
  visit_count       INTEGER NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, affiliate_link_id, visit_date)
);

CREATE INDEX IF NOT EXISTS idx_contact_link_visits_reporting
  ON contact_link_visits (tenant_id, affiliate_link_id, visit_date);
