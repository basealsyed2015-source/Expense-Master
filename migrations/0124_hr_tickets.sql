-- HR Tickets table for employee ticket-raising feature
CREATE TABLE IF NOT EXISTS hr_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  ticket_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to INTEGER,
  resolution_notes TEXT,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_hr_tickets_tenant ON hr_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_tickets_employee ON hr_tickets(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_tickets_status ON hr_tickets(status);
