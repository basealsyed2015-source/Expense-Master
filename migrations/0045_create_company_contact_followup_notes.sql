CREATE TABLE IF NOT EXISTS company_contact_followup_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  followup_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  created_by_user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (followup_id) REFERENCES company_contact_followups(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_followup_notes_followup_created
  ON company_contact_followup_notes (followup_id, created_at DESC);
