-- Migration: Create customer_alarms table
-- Date: 2026-04-08
-- Description: Customer alarm/reminder system with Gregorian and Hijri dates

CREATE TABLE IF NOT EXISTS customer_alarms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  alarm_date_gregorian TEXT,
  alarm_date_hijri TEXT,
  alarm_time TEXT,
  note TEXT,
  user_id INTEGER,
  tenant_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customer_alarms_customer_id ON customer_alarms(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_alarms_tenant_id ON customer_alarms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_alarms_user_id ON customer_alarms(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_alarms_is_read ON customer_alarms(is_read);
CREATE INDEX IF NOT EXISTS idx_customer_alarms_created_at ON customer_alarms(created_at DESC);
