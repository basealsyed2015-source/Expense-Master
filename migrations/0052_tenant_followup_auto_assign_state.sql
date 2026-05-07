-- Round-robin cursor for follow-up task auto-assign (company role-4 staff only).
-- Manual task assignments do not update this table.
CREATE TABLE IF NOT EXISTS tenant_followup_auto_assign_state (
  tenant_id INTEGER PRIMARY KEY,
  last_auto_assigned_user_id INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (last_auto_assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
);
