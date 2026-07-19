-- Per-tenant leave allocation policy
CREATE TABLE IF NOT EXISTS hr_leave_policy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  leave_type TEXT NOT NULL,
  leave_name_ar TEXT NOT NULL,
  allocated_days INTEGER NOT NULL DEFAULT 0,
  is_paid INTEGER DEFAULT 1,
  UNIQUE(tenant_id, leave_type)
);
