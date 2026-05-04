CREATE TABLE IF NOT EXISTS company_contact_followup_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  followup_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  task_title TEXT NOT NULL,
  scheduled_at_gregorian DATETIME NOT NULL,
  scheduled_at_hijri TEXT,
  assigned_user_id INTEGER,
  priority TEXT NOT NULL CHECK (priority IN ('regular', 'important')),
  status TEXT NOT NULL DEFAULT 'pending',
  created_by_user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (followup_id) REFERENCES company_contact_followups(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_followup_tasks_followup_created
  ON company_contact_followup_tasks (followup_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_followup_tasks_tenant_scheduled
  ON company_contact_followup_tasks (tenant_id, scheduled_at_gregorian);

CREATE INDEX IF NOT EXISTS idx_followup_tasks_assigned_status
  ON company_contact_followup_tasks (assigned_user_id, status);
