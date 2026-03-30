-- Lookup table for customer obligation categories (monthly commitments)
CREATE TABLE IF NOT EXISTS obligation_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  tenant_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_obligation_types_tenant ON obligation_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_obligation_types_active ON obligation_types(is_active);

-- Global defaults (tenant_id NULL = available to all tenants)
INSERT OR IGNORE INTO obligation_types (id, type_name, sort_order, tenant_id, is_active) VALUES
(1, 'قرض شخصي', 10, NULL, 1),
(2, 'قرض عقاري', 20, NULL, 1),
(3, 'تمويل سيارة قائم', 30, NULL, 1),
(4, 'بطاقة ائتمان', 40, NULL, 1),
(5, 'تمويل تعاوني', 50, NULL, 1),
(6, 'تقسيط / شراء بالأقساط', 60, NULL, 1),
(7, 'سلفة راتب', 70, NULL, 1),
(8, 'التزامات أخرى', 80, NULL, 1);
