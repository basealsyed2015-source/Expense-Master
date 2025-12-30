-- إنشاء جداول نظام HR
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

CREATE TABLE IF NOT EXISTS hr_leaves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER DEFAULT 1,
  employee_id INTEGER NOT NULL,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by INTEGER,
  approved_at DATETIME,
  rejection_reason TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id)
);

CREATE TABLE IF NOT EXISTS hr_salaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER DEFAULT 1,
  employee_id INTEGER NOT NULL,
  salary_month DATE NOT NULL,
  basic_salary REAL NOT NULL,
  housing_allowance REAL DEFAULT 0,
  transportation_allowance REAL DEFAULT 0,
  other_allowances REAL DEFAULT 0,
  bonuses REAL DEFAULT 0,
  overtime_amount REAL DEFAULT 0,
  late_deductions REAL DEFAULT 0,
  absence_deductions REAL DEFAULT 0,
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
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id)
);

-- إدراج بيانات تجريبية
INSERT OR IGNORE INTO hr_employees (employee_number, full_name, national_id, email, phone, department, job_title, basic_salary, hire_date, status, tenant_id) VALUES
  ('EMP001', 'أحمد محمد الأحمد', '1234567890', 'ahmed@example.com', '0501234567', 'it', 'مطور برمجيات', 15000, '2023-01-15', 'active', 1),
  ('EMP002', 'فاطمة عبدالله السالم', '1234567891', 'fatima@example.com', '0501234568', 'hr', 'مدير موارد بشرية', 18000, '2022-06-01', 'active', 1),
  ('EMP003', 'محمد علي الخالد', '1234567892', 'mohammed@example.com', '0501234569', 'finance', 'محاسب مالي', 12000, '2023-03-10', 'active', 1),
  ('EMP004', 'سارة حسن العمري', '1234567893', 'sarah@example.com', '0501234570', 'sales', 'مندوبة مبيعات', 10000, '2024-01-01', 'active', 1),
  ('EMP005', 'خالد عبدالعزيز النجار', '1234567894', 'khaled@example.com', '0501234571', 'marketing', 'أخصائي تسويق', 11000, '2023-08-20', 'active', 1);

-- إدراج سجلات حضور تجريبية
INSERT OR IGNORE INTO hr_attendance (employee_id, employee_name, department, attendance_date, check_in_time, check_out_time, work_hours, status, tenant_id) VALUES
  (1, 'أحمد محمد الأحمد', 'it', '2024-12-30', '08:00', '17:00', '9', 'present', 1),
  (2, 'فاطمة عبدالله السالم', 'hr', '2024-12-30', '08:15', '17:00', '8.75', 'late', 1),
  (3, 'محمد علي الخالد', 'finance', '2024-12-30', '08:00', '17:00', '9', 'present', 1),
  (4, 'سارة حسن العمري', 'sales', '2024-12-30', NULL, NULL, NULL, 'absent', 1),
  (5, 'خالد عبدالعزيز النجار', 'marketing', '2024-12-30', '08:00', '17:00', '9', 'present', 1);
