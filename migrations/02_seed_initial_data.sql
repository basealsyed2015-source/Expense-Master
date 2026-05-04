-- Seed initial data matching the complete schema
-- Run this after 01_create_all_tables.sql

-- Insert roles (matching schema with role_name_ar)
INSERT OR IGNORE INTO roles (id, role_name, role_name_ar, description, is_system_role) VALUES
(1, 'super_admin', 'سوبر أدمن', 'مدير النظام الكامل - يرى جميع الشركات وبيانات SaaS', 1),
(2, 'company_admin', 'مدير شركة', 'إدارة كاملة للشركة (عدا SaaS)', 1),
(3, 'supervisor', 'مشرف', 'عرض جميع بيانات الشركة (قراءة فقط)', 1),
(4, 'employee', 'موظف', 'إدارة العملاء والطلبات المخصصة فقط', 1),
(5, 'bank_agent', 'موظف التمويل', 'عرض طلبات التمويل المرتبطة بالبنك المخصص فقط', 1);

-- Insert tenant
INSERT OR IGNORE INTO tenants (id, company_name, slug, subdomain, status, max_users, max_customers, max_requests) VALUES
(1, 'شركة التمويل الأولى', 'tamweel-1', 'tamweel1', 'active', 50, 5000, 10000);

-- Insert users (matching schema)
INSERT OR IGNORE INTO users (id, username, password, full_name, email, phone, role_id, tenant_id, is_active) VALUES
(1, 'superadmin', 'Super@2025', 'المدير العام للنظام', 'super@tamweel.sa', '0500000001', 1, NULL, 1),
(2, 'companyadmin', 'Company@2025', 'مدير شركة التمويل الأولى', 'company@tamweel.sa', '0500000002', 2, 1, 1),
(3, 'supervisor', 'Supervisor@2025', 'مشرف موظفين الشركة', 'supervisor@tamweel.sa', '0500000003', 3, 1, 1),
(4, 'employee', 'Employee@2025', 'موظف الشركة الأولى', 'employee@tamweel.sa', '0500000004', 4, 1, 1);

-- Insert financing types (using type_name, not name)
INSERT OR IGNORE INTO financing_types (id, type_name, description, tenant_id, is_active) VALUES
(1, 'تمويل سيارة', 'تمويل لشراء سيارة', 1, 1),
(2, 'تمويل عقاري', 'تمويل لشراء عقار', 1, 1),
(3, 'تمويل شخصي', 'تمويل شخصي للأغراض العامة', 1, 1),
(4, 'تمويل تجاري', 'تمويل للمشاريع التجارية', 1, 1);

-- Insert banks
INSERT OR IGNORE INTO banks (id, bank_name, bank_code, is_active, tenant_id) VALUES
(1, 'مصرف الراجحي', 'RAJ', 1, 1),
(2, 'البنك الأهلي السعودي', 'NCB', 1, 1),
(3, 'بنك الرياض', 'RYD', 1, 1),
(4, 'البنك السعودي للاستثمار', 'SIB', 1, 1),
(5, 'بنك ساب', 'SAB', 1, 1);

-- Insert sample customers (using full_name, not name)
INSERT OR IGNORE INTO customers (id, full_name, phone, email, city, assigned_to, tenant_id, status) VALUES
(1, 'أحمد محمد العلي', '0501234567', 'ahmed@email.com', 'الرياض', 3, 1, 'active'),
(2, 'فاطمة عبدالله السالم', '0509876543', 'fatima@email.com', 'الرياض', 3, 1, 'active'),
(3, 'خالد سعيد الغامدي', '0551234567', 'khalid@email.com', 'جدة', 4, 1, 'active'),
(4, 'نورة حسن الشمري', '0559876543', 'noura@email.com', 'الدمام', 3, 1, 'active'),
(5, 'محمد عمر القحطاني', '0561234567', 'mohammed@email.com', 'الرياض', 4, 1, 'active'),
(6, 'سارة علي المطيري', '0569876543', 'sara@email.com', 'جدة', 3, 1, 'active'),
(7, 'عبدالرحمن ناصر الدوسري', '0571234567', 'abdulrahman@email.com', 'الخبر', 4, 1, 'active'),
(8, 'مريم يوسف الزهراني', '0579876543', 'mariam@email.com', 'الرياض', 3, 1, 'active');

-- Insert sample financing requests
INSERT OR IGNORE INTO financing_requests (id, customer_id, financing_type_id, requested_amount, approved_amount, status, tenant_id, created_by) VALUES
(1, 1, 1, 150000, 145000, 'approved', 1, 3),
(2, 2, 3, 50000, NULL, 'pending', 1, 3),
(3, 3, 2, 500000, 480000, 'approved', 1, 4),
(4, 4, 1, 120000, NULL, 'pending', 1, 3),
(5, 5, 4, 300000, 280000, 'approved', 1, 4),
(6, 6, 3, 75000, 70000, 'approved', 1, 3),
(7, 7, 1, 180000, NULL, 'under_review', 1, 4),
(8, 8, 2, 600000, NULL, 'pending', 1, 3);
