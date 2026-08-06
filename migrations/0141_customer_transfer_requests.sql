CREATE TABLE IF NOT EXISTS customer_transfer_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('employee', 'bank_agent')),
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ctr_customer_status ON customer_transfer_requests(customer_id, assignment_type, status);
CREATE INDEX IF NOT EXISTS idx_ctr_to_user ON customer_transfer_requests(to_user_id, status);
