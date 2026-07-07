-- Workflow phase notes (separate from actions)

CREATE TABLE IF NOT EXISTS workflow_stage_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  performed_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES financing_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id),
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS customer_workflow_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  performed_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id),
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_workflow_stage_notes_request ON workflow_stage_notes(request_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_customer_workflow_notes_customer ON customer_workflow_notes(customer_id, stage_id);
