CREATE TABLE IF NOT EXISTS affiliate_link_employee_assignments (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  affiliate_link_id  INTEGER NOT NULL,
  user_id            INTEGER NOT NULL,
  role_context       TEXT NOT NULL CHECK (role_context IN ('employee', 'bank_agent')),
  assignment_limit   INTEGER NULL,
  assigned_count     INTEGER NOT NULL DEFAULT 0,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (affiliate_link_id, user_id, role_context),
  FOREIGN KEY (affiliate_link_id)
    REFERENCES tenant_contact_affiliate_links(id) ON DELETE CASCADE
);
