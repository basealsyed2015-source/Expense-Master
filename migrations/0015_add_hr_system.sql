-- ==========================================
-- إضافة نظام الموارد البشرية (HR)
-- Migration 0015: HR System Tables
-- ==========================================

-- ==========================================
-- جدول الموظفين (29 حقل شامل)
-- ==========================================
CREATE TABLE IF NOT EXISTS hr_employees (
  -- المعلومات الأساسية
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_code TEXT UNIQUE NOT NULL,
  national_id TEXT UNIQUE NOT NULL,
  
  -- البيانات الشخصية
  full_name_ar TEXT NOT NULL,
  full_name_en TEXT,
  birth_date DATE NOT NULL,
  gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL,
  marital_status TEXT CHECK(marital_status IN ('single', 'married', 'divorced', 'widowed')) NOT NULL,
  nationality TEXT NOT NULL DEFAULT 'سعودي',
  religion TEXT DEFAULT 'مسلم',
  military_status TEXT CHECK(military_status IN ('completed', 'exempted', 'postponed', 'not_applicable')),
  
  -- معلومات الاتصال
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  emergency_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  
  -- معلومات الوظيفية
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  employment_type TEXT CHECK(employment_type IN ('full_time', 'part_time', 'contract', 'temporary')) NOT NULL,
  hire_date DATE NOT NULL,
  hire_date_hijri TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  direct_manager_id INTEGER,
  
  -- المعلومات المالية (بالريال السعودي)
  basic_salary REAL NOT NULL,
  allowances REAL DEFAULT 0,
  housing_allowance REAL DEFAULT 0,
  transport_allowance REAL DEFAULT 0,
  insurance_number TEXT,
  iban TEXT,
  bank_name TEXT,
  
  -- المستندات
  passport_number TEXT,
  passport_expiry DATE,
  work_permit_number TEXT,
  work_permit_expiry DATE,
  iqama_number TEXT,
  iqama_expiry DATE,
  
  -- الحالة والتتبع
  status TEXT CHECK(status IN ('active', 'inactive', 'terminated', 'on_leave')) DEFAULT 'active',
  termination_date DATE,
  termination_reason TEXT,
  notes TEXT,
  
  -- التواريخ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (direct_manager_id) REFERENCES hr_employees(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- ==========================================
-- جدول الحضور والغياب
-- ==========================================
CREATE TABLE IF NOT EXISTS hr_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  attendance_date DATE NOT NULL,
  attendance_date_hijri TEXT,
  check_in_time TIME,
  check_out_time TIME,
  status TEXT CHECK(status IN ('present', 'absent', 'late', 'half_day', 'remote', 'sick', 'vacation')) NOT NULL,
  late_minutes INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(employee_id, attendance_date)
);

-- ==========================================
-- جدول أنواع الإجازات السعودية
-- ==========================================
CREATE TABLE IF NOT EXISTS hr_leave_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  type_code TEXT UNIQUE NOT NULL,
  type_name_ar TEXT NOT NULL,
  type_name_en TEXT,
  default_days INTEGER NOT NULL,
  is_paid INTEGER DEFAULT 1,
  requires_approval INTEGER DEFAULT 1,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- إدراج أنواع الإجازات السعودية الرسمية
INSERT OR IGNORE INTO hr_leave_types (type_code, type_name_ar, type_name_en, default_days, is_paid) VALUES
  ('annual', 'إجازة سنوية', 'Annual Leave', 21, 1),
  ('sick', 'إجازة مرضية', 'Sick Leave', 30, 1),
  ('emergency', 'إجازة طارئة', 'Emergency Leave', 5, 1),
  ('unpaid', 'إجازة بدون راتب', 'Unpaid Leave', 0, 0),
  ('maternity', 'إجازة أمومة', 'Maternity Leave', 70, 1),
  ('paternity', 'إجازة أبوة', 'Paternity Leave', 3, 1),
  ('hajj', 'إجازة حج', 'Hajj Leave', 10, 1),
  ('marriage', 'إجازة زواج', 'Marriage Leave', 5, 1),
  ('death', 'إجازة وفاة', 'Bereavement Leave', 5, 1),
  ('exam', 'إجازة امتحانات', 'Exam Leave', 5, 1);

-- ==========================================
-- جدول الإجازات
-- ==========================================
CREATE TABLE IF NOT EXISTS hr_leaves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  leave_type_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  start_date_hijri TEXT,
  end_date DATE NOT NULL,
  end_date_hijri TEXT,
  days_count INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  approved_by INTEGER,
  approved_at DATETIME,
  rejection_reason TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES hr_leave_types(id),
  FOREIGN KEY (approved_by) REFERENCES hr_employees(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- ==========================================
-- جدول رصيد الإجازات
-- ==========================================
CREATE TABLE IF NOT EXISTS hr_leave_balances (
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
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(employee_id, year, leave_type_id)
);

-- ==========================================
-- جدول الرواتب (بالريال السعودي)
-- ==========================================
CREATE TABLE IF NOT EXISTS hr_salaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  salary_month DATE NOT NULL,
  salary_month_hijri TEXT,
  
  -- المستحقات
  basic_salary REAL NOT NULL,
  housing_allowance REAL DEFAULT 0,
  transport_allowance REAL DEFAULT 0,
  other_allowances REAL DEFAULT 0,
  bonuses REAL DEFAULT 0,
  overtime_amount REAL DEFAULT 0,
  
  -- الخصومات
  late_deductions REAL DEFAULT 0,
  absence_deductions REAL DEFAULT 0,
  gosi_deduction REAL DEFAULT 0,
  other_deductions REAL DEFAULT 0,
  
  -- الإجمالي
  gross_salary REAL NOT NULL,
  total_deductions REAL NOT NULL,
  net_salary REAL NOT NULL,
  
  payment_date DATE,
  payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
  payment_method TEXT CHECK(payment_method IN ('bank_transfer', 'cash', 'cheque')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(employee_id, salary_month)
);

-- ==========================================
-- جدول تقييم الأداء
-- ==========================================
CREATE TABLE IF NOT EXISTS hr_performance_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  review_date DATE NOT NULL,
  review_date_hijri TEXT,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  reviewer_id INTEGER NOT NULL,
  
  -- معايير التقييم (من 1 إلى 5)
  quality_of_work INTEGER CHECK(quality_of_work BETWEEN 1 AND 5),
  productivity INTEGER CHECK(productivity BETWEEN 1 AND 5),
  communication INTEGER CHECK(communication BETWEEN 1 AND 5),
  teamwork INTEGER CHECK(teamwork BETWEEN 1 AND 5),
  initiative INTEGER CHECK(initiative BETWEEN 1 AND 5),
  problem_solving INTEGER CHECK(problem_solving BETWEEN 1 AND 5),
  attendance_punctuality INTEGER CHECK(attendance_punctuality BETWEEN 1 AND 5),
  commitment INTEGER CHECK(commitment BETWEEN 1 AND 5),
  
  overall_rating REAL,
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  comments TEXT,
  
  status TEXT CHECK(status IN ('draft', 'submitted', 'acknowledged')) DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES hr_employees(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- ==========================================
-- جدول الترقيات والنقل
-- ==========================================
CREATE TABLE IF NOT EXISTS hr_promotions_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  type TEXT CHECK(type IN ('promotion', 'transfer', 'demotion')) NOT NULL,
  effective_date DATE NOT NULL,
  effective_date_hijri TEXT,
  
  -- البيانات القديمة
  old_department TEXT NOT NULL,
  old_job_title TEXT NOT NULL,
  old_salary REAL NOT NULL,
  
  -- البيانات الجديدة
  new_department TEXT NOT NULL,
  new_job_title TEXT NOT NULL,
  new_salary REAL NOT NULL,
  
  reason TEXT NOT NULL,
  approved_by INTEGER,
  approved_at DATETIME,
  notes TEXT,
  status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'implemented')) DEFAULT 'pending',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES hr_employees(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- ==========================================
-- جدول المستندات وتتبع الصلاحيات
-- ==========================================
CREATE TABLE IF NOT EXISTS hr_document_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  employee_id INTEGER NOT NULL,
  document_type TEXT CHECK(document_type IN ('passport', 'iqama', 'work_permit', 'contract', 'health_insurance', 'driving_license', 'other')) NOT NULL,
  document_name TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE,
  issue_date_hijri TEXT,
  expiry_date DATE NOT NULL,
  expiry_date_hijri TEXT,
  alert_days_before INTEGER DEFAULT 30,
  status TEXT CHECK(status IN ('valid', 'expiring_soon', 'expired')) DEFAULT 'valid',
  last_alert_sent DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employee_id) REFERENCES hr_employees(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- ==========================================
-- إنشاء الفهارس لتحسين الأداء
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_hr_employees_tenant ON hr_employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_email ON hr_employees(email);
CREATE INDEX IF NOT EXISTS idx_hr_employees_employee_code ON hr_employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_hr_employees_department ON hr_employees(department);
CREATE INDEX IF NOT EXISTS idx_hr_employees_status ON hr_employees(status);

CREATE INDEX IF NOT EXISTS idx_hr_attendance_tenant ON hr_attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_employee_date ON hr_attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_hr_attendance_date ON hr_attendance(attendance_date);

CREATE INDEX IF NOT EXISTS idx_hr_leaves_tenant ON hr_leaves(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_leaves_employee ON hr_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_leaves_status ON hr_leaves(status);
CREATE INDEX IF NOT EXISTS idx_hr_leaves_dates ON hr_leaves(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_hr_salaries_tenant ON hr_salaries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_salaries_employee ON hr_salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_salaries_month ON hr_salaries(salary_month);
CREATE INDEX IF NOT EXISTS idx_hr_salaries_status ON hr_salaries(payment_status);

CREATE INDEX IF NOT EXISTS idx_hr_performance_tenant ON hr_performance_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_performance_employee ON hr_performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_performance_reviewer ON hr_performance_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_hr_promotions_tenant ON hr_promotions_transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_promotions_employee ON hr_promotions_transfers(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_promotions_status ON hr_promotions_transfers(status);

CREATE INDEX IF NOT EXISTS idx_hr_documents_tenant ON hr_document_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_documents_employee ON hr_document_alerts(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_documents_expiry ON hr_document_alerts(expiry_date);
CREATE INDEX IF NOT EXISTS idx_hr_documents_status ON hr_document_alerts(status);
