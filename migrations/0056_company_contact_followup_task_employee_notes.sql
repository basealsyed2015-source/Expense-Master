-- Employee notes on follow-up tasks (role 4 UI)
ALTER TABLE company_contact_followup_tasks ADD COLUMN employee_note_text TEXT;
ALTER TABLE company_contact_followup_tasks ADD COLUMN employee_note_updated_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_followup_tasks_employee_note_updated
  ON company_contact_followup_tasks (tenant_id, employee_note_updated_at DESC);
