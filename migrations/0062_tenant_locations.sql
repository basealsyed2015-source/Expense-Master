-- Company locations (branches) per tenant; primary location mirrors legacy tenant contact fields.
CREATE TABLE IF NOT EXISTS tenant_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  logo_url TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_locations_tenant_slug
  ON tenant_locations (tenant_id, slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_locations_one_primary_per_tenant
  ON tenant_locations (tenant_id)
  WHERE is_primary = 1;

CREATE INDEX IF NOT EXISTS idx_tenant_locations_tenant_active
  ON tenant_locations (tenant_id, is_active, slug);

-- Enrollment / marketing attribution (nullable for backwards compatibility)
ALTER TABLE customers ADD COLUMN location_id INTEGER REFERENCES tenant_locations(id);

CREATE INDEX IF NOT EXISTS idx_customers_location_id ON customers (location_id);

ALTER TABLE company_contact_followups ADD COLUMN location_id INTEGER REFERENCES tenant_locations(id);

CREATE INDEX IF NOT EXISTS idx_followups_location_id ON company_contact_followups (location_id);

-- Backfill: one primary location per existing tenant
INSERT INTO tenant_locations (
  tenant_id, name, slug, city, address, contact_phone, contact_email, logo_url,
  is_primary, is_active, created_at, updated_at
)
SELECT
  t.id,
  t.company_name,
  t.slug,
  COALESCE(NULLIF(TRIM(t.city), ''), 'الرياض'),
  COALESCE(NULLIF(TRIM(t.address), ''), '-'),
  t.contact_phone,
  t.contact_email,
  t.logo_url,
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_locations tl WHERE tl.tenant_id = t.id AND tl.is_primary = 1
);

-- Optional: attach existing customers to their tenant's primary location
UPDATE customers
SET location_id = (
  SELECT tl.id FROM tenant_locations tl
  WHERE tl.tenant_id = customers.tenant_id AND tl.is_primary = 1
  LIMIT 1
)
WHERE location_id IS NULL;
