-- Add Performance Reviews and Promotions Data
-- Performance Reviews
INSERT OR IGNORE INTO hr_performance_reviews (tenant_id, employee_id, reviewer_id, review_period_start, review_period_end, review_date, overall_rating, attendance_punctuality, quality_of_work, teamwork, strengths, areas_for_improvement, goals, comments, status)
SELECT 1, e1.id, e2.id, date('now', '-90 days'), date('now', '-60 days'), date('now', '-30 days'), 4.5, 5, 4, 5, 'أداء ممتاز في البرمجة والتعاون مع الفريق', 'تحسين مهارات القيادة', 'إكمال مشروع النظام الجديد', 'موظف متميز', 'submitted'
FROM hr_employees e1, hr_employees e2 WHERE e1.employee_code = 'EMP001' AND e2.employee_code = 'EMP002';

INSERT OR IGNORE INTO hr_performance_reviews (tenant_id, employee_id, reviewer_id, review_period_start, review_period_end, review_date, overall_rating, attendance_punctuality, quality_of_work, teamwork, strengths, areas_for_improvement, goals, comments, status)
SELECT 1, e1.id, e2.id, date('now', '-90 days'), date('now', '-60 days'), date('now', '-30 days'), 4.8, 4, 5, 5, 'إدارة ممتازة للفريق', 'تحسين التواصل مع الإدارة العليا', 'تطوير استراتيجيات التوظيف', 'أداء استثنائي', 'submitted'
FROM hr_employees e1, hr_employees e2 WHERE e1.employee_code = 'EMP002' AND e2.employee_code = 'EMP001';

INSERT OR IGNORE INTO hr_performance_reviews (tenant_id, employee_id, reviewer_id, review_period_start, review_period_end, review_date, overall_rating, attendance_punctuality, quality_of_work, teamwork, strengths, areas_for_improvement, goals, comments, status)
SELECT 1, e1.id, e2.id, date('now', '-90 days'), date('now', '-60 days'), date('now', '-30 days'), 4.2, 5, 4, 4, 'دقة في العمل المحاسبي', 'تحسين سرعة الإنجاز', 'إكمال التدقيق المالي', 'أداء جيد', 'submitted'
FROM hr_employees e1, hr_employees e2 WHERE e1.employee_code = 'EMP003' AND e2.employee_code = 'EMP002';

INSERT OR IGNORE INTO hr_performance_reviews (tenant_id, employee_id, reviewer_id, review_period_start, review_period_end, review_date, overall_rating, attendance_punctuality, quality_of_work, teamwork, strengths, areas_for_improvement, goals, comments, status)
SELECT 1, e1.id, e2.id, date('now', '-90 days'), date('now', '-60 days'), date('now', '-30 days'), 3.8, 3, 4, 4, 'مهارات مبيعات جيدة', 'تحسين الحضور', 'زيادة المبيعات بنسبة 20%', 'يحتاج تحسين', 'draft'
FROM hr_employees e1, hr_employees e2 WHERE e1.employee_code = 'EMP004' AND e2.employee_code = 'EMP002';

INSERT OR IGNORE INTO hr_performance_reviews (tenant_id, employee_id, reviewer_id, review_period_start, review_period_end, review_date, overall_rating, attendance_punctuality, quality_of_work, teamwork, strengths, areas_for_improvement, goals, comments, status)
SELECT 1, e1.id, e2.id, date('now', '-90 days'), date('now', '-60 days'), date('now', '-30 days'), 4.0, 4, 4, 4, 'إبداع في التسويق', 'تحسين التخطيط', 'إطلاق حملة تسويقية جديدة', 'أداء مقبول', 'submitted'
FROM hr_employees e1, hr_employees e2 WHERE e1.employee_code = 'EMP005' AND e2.employee_code = 'EMP002';

-- Promotions
INSERT OR IGNORE INTO hr_promotions_transfers (tenant_id, employee_id, type, effective_date, old_department, old_job_title, new_department, new_job_title, old_salary, new_salary, reason, status)
SELECT 1, id, 'promotion', date('now', '+30 days'), department, job_title, department, 'مطور برمجيات أول', basic_salary, basic_salary + 2000, 'ترقية بسبب الأداء المتميز', 'pending'
FROM hr_employees WHERE employee_code = 'EMP001';

INSERT OR IGNORE INTO hr_promotions_transfers (tenant_id, employee_id, type, effective_date, old_department, old_job_title, new_department, new_job_title, old_salary, new_salary, reason, status)
SELECT 1, id, 'promotion', date('now', '-60 days'), department, job_title, department, 'محاسب أول', basic_salary, basic_salary + 1500, 'ترقية بعد إكمال التدريب', 'approved'
FROM hr_employees WHERE employee_code = 'EMP003';

INSERT OR IGNORE INTO hr_promotions_transfers (tenant_id, employee_id, type, effective_date, old_department, old_job_title, new_department, new_job_title, old_salary, new_salary, reason, status)
SELECT 1, id, 'promotion', date('now', '+45 days'), department, job_title, department, 'مدير تسويق', basic_salary, basic_salary + 4000, 'ترقية لشغل منصب إداري', 'pending'
FROM hr_employees WHERE employee_code = 'EMP005';
