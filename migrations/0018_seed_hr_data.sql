-- ==========================================
-- Seed HR Test Data
-- Migration 0018: Comprehensive HR Test Data
-- Matches ACTUAL existing database schema
-- ==========================================

-- Insert Employees (matching existing schema with employee_code, full_name_ar, etc.)
INSERT OR IGNORE INTO hr_employees (employee_code, full_name_ar, national_id, email, phone, department, job_title, basic_salary, housing_allowance, transportation_allowance, hire_date, status, tenant_id) VALUES
  ('EMP001', 'أحمد محمد الأحمد', '1234567890', 'ahmed@example.com', '0501234567', 'it', 'مطور برمجيات', 15000, 2000, 500, '2023-01-15', 'active', 1),
  ('EMP002', 'فاطمة عبدالله السالم', '1234567891', 'fatima@example.com', '0501234568', 'hr', 'مدير موارد بشرية', 18000, 2500, 500, '2022-06-01', 'active', 1),
  ('EMP003', 'محمد علي الخالد', '1234567892', 'mohammed@example.com', '0501234569', 'finance', 'محاسب مالي', 12000, 1500, 500, '2023-03-10', 'active', 1),
  ('EMP004', 'سارة حسن العمري', '1234567893', 'sarah@example.com', '0501234570', 'sales', 'مندوبة مبيعات', 10000, 1000, 500, '2024-01-01', 'active', 1),
  ('EMP005', 'خالد عبدالعزيز النجار', '1234567894', 'khaled@example.com', '0501234571', 'marketing', 'أخصائي تسويق', 11000, 1200, 500, '2023-08-20', 'active', 1),
  ('EMP006', 'نورا سعد الدوسري', '1234567895', 'nora@example.com', '0501234572', 'hr', 'أخصائية توظيف', 9000, 1000, 500, '2024-02-01', 'active', 1),
  ('EMP007', 'عبدالرحمن يوسف الحربي', '1234567896', 'abdulrahman@example.com', '0501234573', 'it', 'مهندس أنظمة', 16000, 2200, 500, '2022-11-15', 'active', 1);

-- Insert Attendance Records (matching actual schema: no employee_name, no department, working_hours not work_hours)
INSERT OR IGNORE INTO hr_attendance (employee_id, attendance_date, check_in_time, check_out_time, working_hours, status, tenant_id)
SELECT id, date('now', '-1 days'), '08:00', '17:00', 9.0, 'present', 1 FROM hr_employees WHERE employee_code = 'EMP001';

INSERT OR IGNORE INTO hr_attendance (employee_id, attendance_date, check_in_time, check_out_time, working_hours, status, tenant_id)
SELECT id, date('now', '-2 days'), '08:05', '17:00', 8.92, 'present', 1 FROM hr_employees WHERE employee_code = 'EMP001';

INSERT OR IGNORE INTO hr_attendance (employee_id, attendance_date, check_in_time, check_out_time, working_hours, status, tenant_id)
SELECT id, date('now', '-1 days'), '08:15', '17:00', 8.75, 'late', 1 FROM hr_employees WHERE employee_code = 'EMP002';

INSERT OR IGNORE INTO hr_attendance (employee_id, attendance_date, check_in_time, check_out_time, working_hours, status, tenant_id)
SELECT id, date('now', '-2 days'), '08:00', '17:00', 9.0, 'present', 1 FROM hr_employees WHERE employee_code = 'EMP002';

INSERT OR IGNORE INTO hr_attendance (employee_id, attendance_date, check_in_time, check_out_time, working_hours, status, tenant_id)
SELECT id, date('now', '-1 days'), '08:00', '17:00', 9.0, 'present', 1 FROM hr_employees WHERE employee_code = 'EMP003';

INSERT OR IGNORE INTO hr_attendance (employee_id, attendance_date, check_in_time, check_out_time, working_hours, status, tenant_id)
SELECT id, date('now', '-1 days'), NULL, NULL, 0, 'absent', 1 FROM hr_employees WHERE employee_code = 'EMP004';

INSERT OR IGNORE INTO hr_attendance (employee_id, attendance_date, check_in_time, check_out_time, working_hours, status, tenant_id)
SELECT id, date('now', '-1 days'), '08:00', '17:00', 9.0, 'present', 1 FROM hr_employees WHERE employee_code = 'EMP005';

-- Insert Leave Requests (matching actual schema: total_days not days_count)
INSERT OR IGNORE INTO hr_leaves (employee_id, leave_type, start_date, end_date, total_days, reason, status, tenant_id)
SELECT id, 'annual', date('now', '+5 days'), date('now', '+7 days'), 3, 'إجازة سنوية', 'pending', 1 FROM hr_employees WHERE employee_code = 'EMP001';

INSERT OR IGNORE INTO hr_leaves (employee_id, leave_type, start_date, end_date, total_days, reason, status, tenant_id)
SELECT id, 'sick', date('now', '-3 days'), date('now', '-3 days'), 1, 'إجازة مرضية', 'approved', 1 FROM hr_employees WHERE employee_code = 'EMP002';

INSERT OR IGNORE INTO hr_leaves (employee_id, leave_type, start_date, end_date, total_days, reason, status, tenant_id)
SELECT id, 'annual', date('now', '+10 days'), date('now', '+14 days'), 5, 'إجازة سنوية', 'pending', 1 FROM hr_employees WHERE employee_code = 'EMP003';

INSERT OR IGNORE INTO hr_leaves (employee_id, leave_type, start_date, end_date, total_days, reason, status, tenant_id)
SELECT id, 'emergency', date('now', '-5 days'), date('now', '-5 days'), 1, 'إجازة طارئة', 'approved', 1 FROM hr_employees WHERE employee_code = 'EMP004';

INSERT OR IGNORE INTO hr_leaves (employee_id, leave_type, start_date, end_date, total_days, reason, status, tenant_id)
SELECT id, 'annual', date('now', '+20 days'), date('now', '+25 days'), 6, 'إجازة سنوية', 'pending', 1 FROM hr_employees WHERE employee_code = 'EMP005';

INSERT OR IGNORE INTO hr_leaves (employee_id, leave_type, start_date, end_date, total_days, reason, status, tenant_id)
SELECT id, 'sick', date('now', '-1 days'), date('now', '-1 days'), 1, 'إجازة مرضية', 'rejected', 1 FROM hr_employees WHERE employee_code = 'EMP006';
