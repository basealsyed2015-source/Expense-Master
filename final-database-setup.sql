-- ════════════════════════════════════════════════════════════════
-- 🎯 سكريبت إعادة بناء قاعدة البيانات - النسخة النهائية
-- ════════════════════════════════════════════════════════════════
-- الهدف: حل مشكلة تسجيل الدخول بإنشاء قاعدة بيانات كاملة
-- التاريخ: 2026-01-08
-- المشروع: tamweel-calc-prod
-- ════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 🗑️ الخطوة 1: حذف جميع الجداول القديمة
-- ═══════════════════════════════════════════════════════════════
-- ملاحظة: هذا آمن - يحذف فقط إذا كانت موجودة

DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS packages;
DROP TABLE IF EXISTS calculators;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS financing_requests;
DROP TABLE IF EXISTS rates;
DROP TABLE IF EXISTS banks;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;
DROP TABLE IF EXISTS roles;

-- ═══════════════════════════════════════════════════════════════
-- 🔨 الخطوة 2: إنشاء الجداول الأساسية
-- ═══════════════════════════════════════════════════════════════

-- جدول الأدوار (Roles)
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- جدول الشركات (Multi-Tenancy)
CREATE TABLE tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    subdomain TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- جدول المستخدمين (Users)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    role_id INTEGER NOT NULL,
    tenant_id INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- جدول العملاء (Customers)
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    id_number TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tenant_id INTEGER,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- جدول البنوك (Banks)
CREATE TABLE banks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT,
    tenant_id INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- جدول نسب التمويل (Rates)
CREATE TABLE rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_id INTEGER NOT NULL,
    product_type TEXT NOT NULL,
    rate REAL NOT NULL,
    min_amount REAL,
    max_amount REAL,
    min_duration INTEGER,
    max_duration INTEGER,
    tenant_id INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_id) REFERENCES banks(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- جدول طلبات التمويل (Financing Requests)
CREATE TABLE financing_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    bank_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    duration INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    tenant_id INTEGER,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (bank_id) REFERENCES banks(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- جدول الدفعات (Payments)
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_date TEXT,
    status TEXT DEFAULT 'pending',
    tenant_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES financing_requests(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- جدول الإشعارات (Notifications)
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read INTEGER DEFAULT 0,
    tenant_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- ═══════════════════════════════════════════════════════════════
-- 📊 الخطوة 3: إضافة البيانات الأساسية
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 👥 الأدوار (4 أدوار)
-- ────────────────────────────────────────────────────────────────
INSERT INTO roles (id, name, name_ar, description, description_ar) VALUES
(11, 'SaaS Admin', 'مدير النظام SaaS', 'Full system administrator with access to all tenants', 'مدير النظام الكامل مع صلاحيات على جميع الشركات'),
(12, 'Company Admin', 'مدير شركة', 'Company administrator with full access to tenant data', 'مدير الشركة مع صلاحيات كاملة على بيانات الشركة'),
(13, 'HR Supervisor', 'مشرف موارد بشرية', 'HR department supervisor', 'مشرف قسم الموارد البشرية'),
(14, 'Employee', 'موظف', 'Regular employee with limited access', 'موظف عادي مع صلاحيات محدودة');

-- ────────────────────────────────────────────────────────────────
-- 🏢 الشركات (3 شركات)
-- ────────────────────────────────────────────────────────────────
INSERT INTO tenants (id, name, subdomain, status) VALUES
(2, 'شركة التمويل الأولى', 'tamweel-1', 'active'),
(3, 'شركة التمويل الثانية', 'tamweel-2', 'active'),
(4, 'شركة التمويل الثالثة', 'tamweel-3', 'active');

-- ────────────────────────────────────────────────────────────────
-- 👤 المستخدمون (7 مستخدمين)
-- ────────────────────────────────────────────────────────────────

-- ⭐ مدير النظام SaaS (Super Admin)
INSERT INTO users (id, username, password, full_name, email, role_id, tenant_id, is_active) VALUES
(11, 'saas_admin', 'SaaS@Admin2025', 'مدير النظام', 'admin@tamweel-calc.com', 11, NULL, 1);

-- 🏢 مستخدمو شركة التمويل الأولى
INSERT INTO users (username, password, full_name, email, role_id, tenant_id, is_active) VALUES
('admin_tamweel1', 'demo123', 'أحمد محمد - مدير', 'admin1@tamweel.com', 12, 2, 1),
('emp_tamweel1', 'demo123', 'محمد علي - موظف', 'emp1@tamweel.com', 14, 2, 1);

-- 🏢 مستخدمو شركة التمويل الثانية
INSERT INTO users (username, password, full_name, email, role_id, tenant_id, is_active) VALUES
('admin_tamweel2', 'demo123', 'خالد حسن - مدير', 'admin2@tamweel.com', 12, 3, 1),
('emp_tamweel2', 'demo123', 'سعيد أحمد - موظف', 'emp2@tamweel.com', 14, 3, 1);

-- 🏢 مستخدمو شركة التمويل الثالثة
INSERT INTO users (username, password, full_name, email, role_id, tenant_id, is_active) VALUES
('admin_tamweel3', 'demo123', 'ياسر عبدالله - مدير', 'admin3@tamweel.com', 12, 4, 1),
('emp_tamweel3', 'demo123', 'فهد سالم - موظف', 'emp3@tamweel.com', 14, 4, 1);

-- ────────────────────────────────────────────────────────────────
-- 🏦 البنوك (6 بنوك - موزعة على الشركات)
-- ────────────────────────────────────────────────────────────────
INSERT INTO banks (name, code, tenant_id, is_active) VALUES
('البنك الأهلي', 'NCB', 2, 1),
('بنك الراجحي', 'RAJ', 2, 1),
('بنك الرياض', 'RIY', 3, 1),
('بنك ساب', 'SAB', 3, 1),
('البنك السعودي الفرنسي', 'BSF', 4, 1),
('البنك العربي', 'ARB', 4, 1);

-- ────────────────────────────────────────────────────────────────
-- 💰 نسب التمويل (6 نسب)
-- ────────────────────────────────────────────────────────────────
INSERT INTO rates (bank_id, product_type, rate, min_amount, max_amount, min_duration, max_duration, tenant_id, is_active) VALUES
(1, 'تمويل عقاري', 3.5, 100000, 5000000, 60, 300, 2, 1),
(1, 'تمويل شخصي', 5.0, 10000, 500000, 12, 60, 2, 1),
(2, 'تمويل عقاري', 3.8, 100000, 5000000, 60, 300, 2, 1),
(3, 'تمويل شخصي', 4.5, 10000, 500000, 12, 60, 3, 1),
(4, 'تمويل عقاري', 3.6, 100000, 5000000, 60, 300, 3, 1),
(5, 'تمويل سيارات', 4.0, 20000, 300000, 12, 60, 4, 1);

-- ────────────────────────────────────────────────────────────────
-- 👨‍💼 عملاء تجريبيون (5 عملاء)
-- ────────────────────────────────────────────────────────────────
INSERT INTO customers (name, id_number, phone, email, tenant_id, created_by) VALUES
('عبدالله أحمد', '1234567890', '0501234567', 'abdullah@example.com', 2, 12),
('فاطمة محمد', '2345678901', '0502345678', 'fatima@example.com', 2, 12),
('عمر خالد', '3456789012', '0503456789', 'omar@example.com', 3, 14),
('نورة سعيد', '4567890123', '0504567890', 'noura@example.com', 3, 14),
('يوسف علي', '5678901234', '0505678901', 'youssef@example.com', 4, 16);

-- ────────────────────────────────────────────────────────────────
-- 📄 طلبات تمويل تجريبية (5 طلبات)
-- ────────────────────────────────────────────────────────────────
INSERT INTO financing_requests (customer_id, bank_id, amount, duration, status, tenant_id, created_by) VALUES
(1, 1, 250000, 60, 'approved', 2, 12),
(2, 2, 150000, 36, 'pending', 2, 12),
(3, 3, 300000, 48, 'under_review', 3, 14),
(4, 4, 500000, 120, 'approved', 3, 14),
(5, 5, 80000, 24, 'rejected', 4, 16);

-- ═══════════════════════════════════════════════════════════════
-- ✅ الخطوة 4: التحقق من النجاح
-- ═══════════════════════════════════════════════════════════════

SELECT 
    '✅ الأدوار (Roles)' as البند, 
    COUNT(*) as العدد 
FROM roles
UNION ALL
SELECT '✅ الشركات (Tenants)', COUNT(*) FROM tenants
UNION ALL
SELECT '✅ المستخدمون (Users)', COUNT(*) FROM users
UNION ALL
SELECT '✅ البنوك (Banks)', COUNT(*) FROM banks
UNION ALL
SELECT '✅ العملاء (Customers)', COUNT(*) FROM customers
UNION ALL
SELECT '✅ نسب التمويل (Rates)', COUNT(*) FROM rates
UNION ALL
SELECT '✅ طلبات التمويل (Requests)', COUNT(*) FROM financing_requests;

-- ────────────────────────────────────────────────────────────────
-- 🔑 عرض بيانات مدير النظام
-- ────────────────────────────────────────────────────────────────
SELECT 
    '🎯 بيانات تسجيل الدخول' as '════════════════════',
    '' as '────────────────────';

SELECT 
    id as 'ID',
    username as 'اسم المستخدم',
    password as 'كلمة المرور',
    full_name as 'الاسم الكامل',
    role_id as 'الدور'
FROM users 
WHERE username = 'saas_admin';

SELECT 
    '🌐 رابط تسجيل الدخول' as 'البيان',
    'https://tamweel-calc.com/login' as 'القيمة'
UNION ALL
SELECT 'اسم المستخدم', 'saas_admin'
UNION ALL
SELECT 'كلمة المرور', 'SaaS@Admin2025';

-- ════════════════════════════════════════════════════════════════
-- 🎉 تم بنجاح!
-- ════════════════════════════════════════════════════════════════
-- الآن يمكنك تسجيل الدخول على:
-- https://tamweel-calc.com/login
-- 
-- اسم المستخدم: saas_admin
-- كلمة المرور: SaaS@Admin2025
-- ════════════════════════════════════════════════════════════════
