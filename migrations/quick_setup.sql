-- إنشاء جدول المستخدمين أولاً
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT,
  role_id INTEGER DEFAULT 4,
  tenant_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول الشركات
CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول الأدوار
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- إضافة الأدوار الأساسية
INSERT OR IGNORE INTO roles (id, role_name, description) VALUES
  (1, 'Super Admin', 'مدير النظام الكامل'),
  (2, 'Company Admin', 'مدير الشركة'),
  (3, 'Supervisor', 'مشرف'),
  (4, 'Employee', 'موظف');

-- إضافة شركة تجريبية
INSERT OR IGNORE INTO tenants (id, company_name, slug, is_active) VALUES
  (1, 'شركة التمويل الأولى', 'tamweel-1', 1);

-- إضافة مستخدم admin
INSERT OR IGNORE INTO users (username, email, password, full_name, role_id, tenant_id) VALUES
  ('admin', 'admin@tamweel.sa', 'admin123', 'مدير النظام', 1, 1);

-- إنشاء جدول البنوك
CREATE TABLE IF NOT EXISTS banks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_name TEXT NOT NULL,
  bank_code TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  is_active INTEGER DEFAULT 1,
  tenant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- إنشاء جدول أنواع التمويل
CREATE TABLE IF NOT EXISTS financing_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- إضافة أنواع التمويل
INSERT OR IGNORE INTO financing_types (id, type_name, description) VALUES
  (1, 'شخصي', 'تمويل شخصي'),
  (2, 'عقاري', 'تمويل عقاري'),
  (3, 'سيارات', 'تمويل سيارات');

-- إضافة بنوك تجريبية
INSERT OR IGNORE INTO banks (id, bank_name, bank_code, is_active, tenant_id) VALUES
  (1, 'الراجحي', 'RAJ', 1, 1),
  (2, 'الأهلي', 'AHL', 1, 1),
  (3, 'الإنماء', 'INM', 1, 1);

-- إنشاء جدول نسب التمويل
CREATE TABLE IF NOT EXISTS bank_financing_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_id INTEGER NOT NULL,
  financing_type_id INTEGER NOT NULL,
  rate REAL NOT NULL,
  min_amount REAL,
  max_amount REAL,
  min_duration INTEGER,
  max_duration INTEGER,
  tenant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id),
  FOREIGN KEY (financing_type_id) REFERENCES financing_types(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- إضافة نسب تجريبية
INSERT OR IGNORE INTO bank_financing_rates (bank_id, financing_type_id, rate, min_amount, max_amount, min_duration, max_duration, tenant_id) VALUES
  (1, 1, 5.5, 10000, 500000, 12, 60, 1),
  (2, 1, 5.8, 10000, 500000, 12, 60, 1),
  (3, 1, 5.3, 10000, 500000, 12, 60, 1);

-- إنشاء جدول العملاء
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  national_id TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  birthdate DATE,
  monthly_salary REAL,
  financing_amount REAL,
  monthly_obligations REAL,
  financing_type_id INTEGER,
  tenant_id INTEGER,
  assigned_to INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (financing_type_id) REFERENCES financing_types(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- إنشاء جدول طلبات التمويل
CREATE TABLE IF NOT EXISTS financing_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  requested_amount REAL NOT NULL,
  financing_type_id INTEGER NOT NULL,
  duration_months INTEGER NOT NULL,
  selected_bank_id INTEGER,
  status TEXT DEFAULT 'pending',
  tenant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (financing_type_id) REFERENCES financing_types(id),
  FOREIGN KEY (selected_bank_id) REFERENCES banks(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- إنشاء جداول HR
CREATE TABLE IF NOT EXISTS hr_employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER DEFAULT 1,
  employee_number TEXT,
  full_name TEXT NOT NULL,
  national_id TEXT,
  email TEXT,
  phone TEXT,
  birthdate DATE,
  gender TEXT,
  department TEXT,
  job_title TEXT,
  basic_salary REAL DEFAULT 0,
  housing_allowance REAL DEFAULT 0,
  transportation_allowance REAL DEFAULT 0,
  hire_date DATE,
  contract_start_date DATE,
  contract_end_date DATE,
  direct_manager TEXT,
  employment_type TEXT DEFAULT 'full_time',
  work_schedule TEXT DEFAULT 'regular',
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER DEFAULT 1,
  employee_id INTEGER NOT NULL,
  employee_name TEXT,
  department TEXT,
  attendance_date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  work_hours TEXT,
  status TEXT DEFAULT 'present',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id)
);

-- إضافة موظفين تجريبيين
INSERT OR IGNORE INTO hr_employees (employee_number, full_name, national_id, email, phone, department, job_title, basic_salary, hire_date, status, tenant_id) VALUES
  ('EMP001', 'أحمد محمد الأحمد', '1234567890', 'ahmed@example.com', '0501234567', 'it', 'مطور برمجيات', 15000, '2023-01-15', 'active', 1),
  ('EMP002', 'فاطمة عبدالله السالم', '1234567891', 'fatima@example.com', '0501234568', 'hr', 'مدير موارد بشرية', 18000, '2022-06-01', 'active', 1),
  ('EMP003', 'محمد علي الخالد', '1234567892', 'mohammed@example.com', '0501234569', 'finance', 'محاسب مالي', 12000, '2023-03-10', 'active', 1),
  ('EMP004', 'سارة حسن العمري', '1234567893', 'sarah@example.com', '0501234570', 'sales', 'مندوبة مبيعات', 10000, '2024-01-01', 'active', 1),
  ('EMP005', 'خالد عبدالعزيز النجار', '1234567894', 'khaled@example.com', '0501234571', 'marketing', 'أخصائي تسويق', 11000, '2023-08-20', 'active', 1);

-- إضافة سجلات حضور تجريبية
INSERT OR IGNORE INTO hr_attendance (employee_id, employee_name, department, attendance_date, check_in_time, check_out_time, work_hours, status, tenant_id) VALUES
  (1, 'أحمد محمد الأحمد', 'it', '2024-12-31', '08:00', '17:00', '9', 'present', 1),
  (2, 'فاطمة عبدالله السالم', 'hr', '2024-12-31', '08:15', '17:00', '8.75', 'late', 1),
  (3, 'محمد علي الخالد', 'finance', '2024-12-31', '08:00', '17:00', '9', 'present', 1),
  (4, 'سارة حسن العمري', 'sales', '2024-12-31', NULL, NULL, NULL, 'absent', 1),
  (5, 'خالد عبدالعزيز النجار', 'marketing', '2024-12-31', '08:00', '17:00', '9', 'present', 1);
