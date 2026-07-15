ALTER TABLE tenants ADD COLUMN contact_assignment_mode TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE tenants ADD COLUMN contact_unassigned_limit_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tenants ADD COLUMN contact_last_picked_roster_id INTEGER NULL;

CREATE TABLE IF NOT EXISTS tenant_contact_employee_assignments (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id         INTEGER NOT NULL,
  user_id           INTEGER NOT NULL,
  role_context      TEXT NOT NULL CHECK (role_context IN ('employee', 'bank_agent')),
  assignment_limit  INTEGER NULL,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, user_id, role_context),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_contact_employee_assignments_tenant
  ON tenant_contact_employee_assignments (tenant_id);
