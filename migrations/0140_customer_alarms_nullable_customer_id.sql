-- Allow workflow/contract alarms that are not tied to a customer row
-- (e.g. bank-agent contracts created with customer_id NULL awaiting admin approval).
-- SQLite cannot DROP NOT NULL in place — rebuild the table.

CREATE TABLE customer_alarms__nullable_cid (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  customer_name TEXT NOT NULL,
  alarm_date_gregorian TEXT,
  alarm_date_hijri TEXT,
  alarm_time TEXT,
  note TEXT,
  user_id INTEGER,
  tenant_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  alarm_type TEXT,
  link_url TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

INSERT INTO customer_alarms__nullable_cid (
  id, customer_id, customer_name, alarm_date_gregorian, alarm_date_hijri, alarm_time,
  note, user_id, tenant_id, is_read, created_at, alarm_type, link_url
)
SELECT
  id, customer_id, customer_name, alarm_date_gregorian, alarm_date_hijri, alarm_time,
  note, user_id, tenant_id, is_read, created_at, alarm_type, link_url
FROM customer_alarms;

DROP TABLE customer_alarms;
ALTER TABLE customer_alarms__nullable_cid RENAME TO customer_alarms;

CREATE INDEX IF NOT EXISTS idx_customer_alarms_customer_id ON customer_alarms(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_alarms_tenant_id ON customer_alarms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_alarms_user_id ON customer_alarms(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_alarms_is_read ON customer_alarms(is_read);
CREATE INDEX IF NOT EXISTS idx_customer_alarms_created_at ON customer_alarms(created_at DESC);
