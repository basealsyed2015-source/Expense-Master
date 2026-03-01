-- Tenants (companies)
CREATE TABLE tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subdomain TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#667eea',
  secondary_color TEXT DEFAULT '#764ba2',
  subscription_id INTEGER,
  status TEXT DEFAULT 'active',
  max_users INTEGER DEFAULT 5,
  max_customers INTEGER DEFAULT 100,
  max_requests INTEGER DEFAULT 1000,
  features_json TEXT,
  settings_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  trial_ends_at DATETIME,
  subscription_ends_at DATETIME,
  contact_email TEXT,
  contact_phone TEXT,
  total_users INTEGER DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0
);

-- Roles & permissions
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name TEXT NOT NULL UNIQUE,
  role_name_ar TEXT NOT NULL,
  description TEXT,
  is_system_role INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  permission_key TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  permission_name_ar TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role_id INTEGER,
  subscription_id INTEGER,
  is_active INTEGER DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  tenant_id INTEGER,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Packages & subscriptions
CREATE TABLE packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_name TEXT UNIQUE NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  duration_months INTEGER NOT NULL,
  max_calculations INTEGER,
  max_users INTEGER,
  features TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  package_id INTEGER,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  calculations_used INTEGER DEFAULT 0,
  tenant_id INTEGER,
  plan_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES packages(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE subscription_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  package_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  tenant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES packages(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Banks & financing types
CREATE TABLE banks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_name TEXT UNIQUE NOT NULL,
  bank_code TEXT UNIQUE,
  logo_url TEXT,
  is_active INTEGER DEFAULT 1,
  tenant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE financing_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_name TEXT UNIQUE NOT NULL,
  description TEXT,
  tenant_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE bank_financing_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_id INTEGER NOT NULL,
  financing_type_id INTEGER NOT NULL,
  rate REAL NOT NULL,
  min_amount REAL,
  max_amount REAL,
  min_salary REAL,
  max_salary REAL,
  min_duration INTEGER,
  max_duration INTEGER,
  is_active INTEGER DEFAULT 1,
  tenant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id),
  FOREIGN KEY (financing_type_id) REFERENCES financing_types(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Customers
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  national_id TEXT,
  birthdate DATE,
  employer_name TEXT,
  job_title TEXT,
  work_start_date DATE,
  city TEXT,
  monthly_salary REAL,
  financing_amount REAL DEFAULT 0,
  monthly_obligations REAL DEFAULT 0,
  financing_type_id INTEGER,
  financing_duration_months INTEGER,
  best_bank_id INTEGER,
  best_rate REAL,
  monthly_payment REAL,
  total_payment REAL,
  calculation_date DATETIME,
  first_calculation_date DATETIME,
  notes TEXT,
  assigned_to INTEGER,
  tenant_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (financing_type_id) REFERENCES financing_types(id),
  FOREIGN KEY (best_bank_id) REFERENCES banks(id)
);

-- Customer assignments
CREATE TABLE customer_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  assigned_by INTEGER NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(customer_id)
);

CREATE TABLE assignment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  old_employee_id INTEGER,
  new_employee_id INTEGER NOT NULL,
  changed_by INTEGER NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (old_employee_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (new_employee_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Financing requests
CREATE TABLE financing_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  financing_type_id INTEGER,
  selected_bank_id INTEGER,
  requested_amount REAL NOT NULL,
  approved_amount REAL,
  salary_at_request REAL,
  duration_months INTEGER,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  tenant_id INTEGER,
  created_by INTEGER,
  id_attachment_url TEXT,
  bank_statement_attachment_url TEXT,
  salary_attachment_url TEXT,
  additional_attachment_url TEXT,
  current_stage_id INTEGER,
  stage_entered_at TIMESTAMP,
  pending_at TIMESTAMP,
  under_review_at TIMESTAMP,
  processing_at TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (financing_type_id) REFERENCES financing_types(id),
  FOREIGN KEY (selected_bank_id) REFERENCES banks(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (current_stage_id) REFERENCES workflow_stages(id)
);

CREATE TABLE financing_request_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES financing_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Workflow system
CREATE TABLE workflow_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stage_name TEXT UNIQUE NOT NULL,
  stage_name_ar TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  stage_color TEXT DEFAULT '#3B82F6',
  stage_icon TEXT DEFAULT 'fa-circle',
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflow_stage_transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  from_stage_id INTEGER,
  to_stage_id INTEGER NOT NULL,
  transitioned_by INTEGER,
  notes TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES financing_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (from_stage_id) REFERENCES workflow_stages(id),
  FOREIGN KEY (to_stage_id) REFERENCES workflow_stages(id),
  FOREIGN KEY (transitioned_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE workflow_stage_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  action_data TEXT,
  performed_by INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES financing_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id),
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE workflow_stage_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  stage_id INTEGER NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  assigned_to INTEGER,
  due_date TIMESTAMP,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMP,
  completed_by INTEGER,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES financing_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES workflow_stages(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Trigger to log stage transitions
CREATE TRIGGER after_stage_change
AFTER UPDATE OF current_stage_id ON financing_requests
WHEN NEW.current_stage_id IS NOT NULL AND (OLD.current_stage_id IS NULL OR OLD.current_stage_id != NEW.current_stage_id)
BEGIN
  INSERT INTO workflow_stage_transitions (request_id, from_stage_id, to_stage_id, created_at)
  VALUES (NEW.id, OLD.current_stage_id, NEW.current_stage_id, CURRENT_TIMESTAMP);
END;

-- Views
CREATE VIEW v_requests_with_stage AS
SELECT 
  fr.id,
  fr.customer_id,
  fr.requested_amount,
  fr.status,
  fr.current_stage_id,
  ws.stage_name,
  ws.stage_name_ar,
  ws.stage_color,
  ws.stage_icon,
  fr.stage_entered_at,
  fr.created_at
FROM financing_requests fr
LEFT JOIN workflow_stages ws ON fr.current_stage_id = ws.id;

CREATE VIEW v_latest_stage_actions AS
SELECT 
  wsa.*,
  ws.stage_name_ar,
  u.full_name as performed_by_name
FROM workflow_stage_actions wsa
INNER JOIN (
  SELECT request_id, MAX(created_at) as max_date
  FROM workflow_stage_actions
  GROUP BY request_id
) latest ON wsa.request_id = latest.request_id AND wsa.created_at = latest.max_date
LEFT JOIN workflow_stages ws ON wsa.stage_id = ws.id
LEFT JOIN users u ON wsa.performed_by = u.id;

-- Payments
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  financing_request_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  employee_id INTEGER,
  amount REAL NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  receipt_number TEXT,
  notes TEXT,
  created_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (financing_request_id) REFERENCES financing_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  tenant_id INTEGER,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  category TEXT DEFAULT 'general',
  related_request_id INTEGER,
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (related_request_id) REFERENCES financing_requests(id) ON DELETE CASCADE
);

-- Calculations
CREATE TABLE calculations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  subscription_id INTEGER,
  financing_type_id INTEGER NOT NULL,
  bank_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  duration_months INTEGER NOT NULL,
  salary REAL NOT NULL,
  rate REAL NOT NULL,
  monthly_payment REAL NOT NULL,
  total_payment REAL NOT NULL,
  total_interest REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  FOREIGN KEY (financing_type_id) REFERENCES financing_types(id),
  FOREIGN KEY (bank_id) REFERENCES banks(id)
);

-- Conversions (optional)
CREATE TABLE conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_ip TEXT,
  page_url TEXT,
  conversion_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Password reset notifications
CREATE TABLE password_change_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  verification_code TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- HR departments
CREATE TABLE hr_departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  department_name TEXT NOT NULL,
  department_code TEXT NOT NULL,
  manager_id INTEGER,
  description TEXT,
  budget REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES hr_employees(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- HR employees (combined fields)
CREATE TABLE hr_employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_code TEXT UNIQUE,
  employee_number TEXT,
  full_name_ar TEXT,
  full_name_en TEXT,
  full_name TEXT,
  national_id TEXT,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  birthdate DATE,
  gender TEXT,
  marital_status TEXT,
  nationality TEXT,
  religion TEXT,
  military_status TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  address TEXT,
  city TEXT,
  department TEXT,
  job_title TEXT,
  employment_type TEXT,
  hire_date DATE,
  hire_date_hijri TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  direct_manager_id INTEGER,
  direct_manager TEXT,
  basic_salary REAL DEFAULT 0,
  allowances REAL DEFAULT 0,
  housing_allowance REAL DEFAULT 0,
  transport_allowance REAL DEFAULT 0,
  transportation_allowance REAL DEFAULT 0,
  insurance_number TEXT,
  iban TEXT,
  bank_name TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  work_permit_number TEXT,
  work_permit_expiry DATE,
  iqama_number TEXT,
  iqama_expiry DATE,
  work_schedule TEXT,
  status TEXT DEFAULT 'active',
  termination_date DATE,
  termination_reason TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (direct_manager_id) REFERENCES hr_employees(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- HR attendance
CREATE TABLE hr_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  employee_name TEXT,
  department TEXT,
  attendance_date DATE NOT NULL,
  attendance_date_hijri TEXT,
  check_in_time TIME,
  check_out_time TIME,
  work_hours TEXT,
  working_hours REAL,
  status TEXT DEFAULT 'present',
  late_minutes INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- HR leave types
CREATE TABLE hr_leave_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  type_code TEXT UNIQUE,
  type_name_ar TEXT,
  type_name_en TEXT,
  default_days INTEGER,
  is_paid INTEGER DEFAULT 1,
  requires_approval INTEGER DEFAULT 1,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- HR leaves
CREATE TABLE hr_leaves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  leave_type TEXT,
  leave_type_id INTEGER,
  start_date DATE NOT NULL,
  start_date_hijri TEXT,
  end_date DATE NOT NULL,
  end_date_hijri TEXT,
  days_count INTEGER,
  total_days INTEGER,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by INTEGER,
  approved_at DATETIME,
  rejected_by INTEGER,
  rejected_at DATETIME,
  rejection_reason TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES hr_leave_types(id),
  FOREIGN KEY (approved_by) REFERENCES hr_employees(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- HR leave balances
CREATE TABLE hr_leave_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  hijri_year INTEGER,
  leave_type_id INTEGER NOT NULL,
  total_days INTEGER NOT NULL,
  used_days INTEGER DEFAULT 0,
  remaining_days INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES hr_leave_types(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- HR salaries
CREATE TABLE hr_salaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  salary_month DATE NOT NULL,
  salary_month_hijri TEXT,
  basic_salary REAL NOT NULL,
  housing_allowance REAL DEFAULT 0,
  transportation_allowance REAL DEFAULT 0,
  other_allowances REAL DEFAULT 0,
  bonuses REAL DEFAULT 0,
  overtime_amount REAL DEFAULT 0,
  late_deductions REAL DEFAULT 0,
  absence_deductions REAL DEFAULT 0,
  gosi_deduction REAL DEFAULT 0,
  other_deductions REAL DEFAULT 0,
  gross_salary REAL NOT NULL,
  total_deductions REAL NOT NULL,
  net_salary REAL NOT NULL,
  payment_date DATE,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- HR performance reviews
CREATE TABLE hr_performance_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  review_date DATE NOT NULL,
  review_date_hijri TEXT,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  reviewer_id INTEGER NOT NULL,
  quality_of_work INTEGER,
  productivity INTEGER,
  communication INTEGER,
  teamwork INTEGER,
  initiative INTEGER,
  problem_solving INTEGER,
  attendance_punctuality INTEGER,
  commitment INTEGER,
  overall_rating REAL,
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  comments TEXT,
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES hr_employees(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- HR promotions and transfers
CREATE TABLE hr_promotions_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  effective_date DATE NOT NULL,
  effective_date_hijri TEXT,
  old_department TEXT,
  old_job_title TEXT,
  old_salary REAL,
  new_department TEXT,
  new_job_title TEXT,
  new_salary REAL,
  reason TEXT,
  approved_by INTEGER,
  approved_at DATETIME,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES hr_employees(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- HR document alerts (expiry tracking)
CREATE TABLE hr_document_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE,
  issue_date_hijri TEXT,
  expiry_date DATE NOT NULL,
  expiry_date_hijri TEXT,
  alert_days_before INTEGER DEFAULT 30,
  status TEXT DEFAULT 'valid',
  last_alert_sent DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- HR documents (simple CRUD used by API)
CREATE TABLE hr_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Indexes (core)
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_requests_tenant ON financing_requests(tenant_id);
CREATE INDEX idx_rates_tenant ON bank_financing_rates(tenant_id);
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_request ON payments(financing_request_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_employee ON payments(employee_id);
CREATE INDEX idx_calculations_user ON calculations(user_id);
CREATE INDEX idx_calculations_subscription ON calculations(subscription_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

