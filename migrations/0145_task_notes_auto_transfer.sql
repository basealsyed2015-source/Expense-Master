-- Allow auto_transfer notes for no-response 48h task forwards.
-- SQLite cannot ALTER CHECK constraints — rebuild the table.

CREATE TABLE company_contact_followup_task_notes__xfer (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES company_contact_followup_tasks(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  note_text TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'employee_note'
    CHECK(note_type IN ('employee_note', 'pass_note', 'auto_transfer')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO company_contact_followup_task_notes__xfer (
  id, task_id, tenant_id, user_id, user_name, note_text, note_type, created_at
)
SELECT
  id, task_id, tenant_id, user_id, user_name, note_text, note_type, created_at
FROM company_contact_followup_task_notes;

DROP TABLE company_contact_followup_task_notes;
ALTER TABLE company_contact_followup_task_notes__xfer RENAME TO company_contact_followup_task_notes;

CREATE INDEX IF NOT EXISTS idx_task_notes_task_created
  ON company_contact_followup_task_notes(task_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_notes_tenant_created
  ON company_contact_followup_task_notes(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_notes_type_task
  ON company_contact_followup_task_notes(note_type, task_id, created_at ASC);
