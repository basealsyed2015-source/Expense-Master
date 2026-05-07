-- Pending pass of a follow-up task to another employee; assignee stays until accept.
CREATE TABLE IF NOT EXISTS company_contact_followup_task_pass_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (task_id) REFERENCES company_contact_followup_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_followup_task_pass_to_pending
  ON company_contact_followup_task_pass_requests (to_user_id, tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_followup_task_pass_from_pending
  ON company_contact_followup_task_pass_requests (from_user_id, tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_followup_task_pass_task_status
  ON company_contact_followup_task_pass_requests (task_id, status);

-- At most one pending pass per task (SQLite partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_followup_task_pass_one_pending_per_task
  ON company_contact_followup_task_pass_requests (task_id)
  WHERE status = 'pending';
