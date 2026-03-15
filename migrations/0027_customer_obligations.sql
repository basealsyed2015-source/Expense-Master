-- Customer financial obligations (type, total, monthly, due date)
CREATE TABLE IF NOT EXISTS customer_obligations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  obligation_type TEXT,
  total_amount REAL NOT NULL,
  monthly_installment REAL NOT NULL,
  due_date TEXT,
  tenant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_customer_obligations_customer_id ON customer_obligations(customer_id);
