-- Fair round-robin cursor for customer auto-assign (same idea as follow-up tasks).
-- Manual assignments do not update this table.
CREATE TABLE IF NOT EXISTS tenant_customer_auto_assign_state (
  tenant_id INTEGER PRIMARY KEY,
  last_auto_assigned_user_id INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (last_auto_assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
);
