-- Note history for follow-up tasks: stores all notes from all users (employee notes + pass request notes)
CREATE TABLE IF NOT EXISTS company_contact_followup_task_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES company_contact_followup_tasks(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  note_text TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'employee_note' CHECK(note_type IN ('employee_note', 'pass_note')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_notes_task_created
  ON company_contact_followup_task_notes(task_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_notes_tenant_created
  ON company_contact_followup_task_notes(tenant_id, created_at DESC);
