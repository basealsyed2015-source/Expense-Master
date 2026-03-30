-- Contracts module: brokerage contracts, promissory notes, and contract templates (per tenant)

CREATE TABLE IF NOT EXISTS contract_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  template_name TEXT NOT NULL,
  template_type TEXT,
  header_content TEXT,
  body_content TEXT,
  footer_content TEXT,
  variables_list TEXT,
  is_active INTEGER DEFAULT 1,
  court_city TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_tenant ON contract_templates(tenant_id);

CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  contract_number TEXT,
  template_id INTEGER,
  template_name TEXT,
  date_gregorian TEXT,
  date_hijri TEXT,
  day_name TEXT,
  party_two_name TEXT,
  party_two_id TEXT,
  party_two_phone TEXT,
  party_two_address TEXT,
  finance_type TEXT,
  finance_amount REAL,
  commission_amount REAL,
  commission_type TEXT,
  commission_rate REAL,
  note_order_number TEXT,
  note_due_date TEXT,
  status TEXT,
  property_description TEXT,
  property_location TEXT,
  bank_name TEXT,
  notes TEXT,
  is_archived INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES contract_templates(id)
);

CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created ON contracts(created_at);

CREATE TABLE IF NOT EXISTS promissory_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  note_number TEXT NOT NULL,
  contract_id INTEGER NOT NULL,
  debtor_name TEXT,
  debtor_id TEXT,
  amount REAL,
  due_date TEXT,
  issue_date TEXT,
  payment_place TEXT,
  status TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  UNIQUE (tenant_id, note_number)
);

CREATE INDEX IF NOT EXISTS idx_promissory_tenant ON promissory_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promissory_contract ON promissory_notes(contract_id);
