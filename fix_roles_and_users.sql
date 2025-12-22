-- تصحيح الأدوار والمستخدمين
-- Fix Roles and Users

-- تعطيل فحص Foreign Keys مؤقتاً
PRAGMA foreign_keys = OFF;

-- =====================================================
-- الخطوة 1: حذف البيانات القديمة
-- =====================================================

-- حذف المستخدمين القدامى أولاً
DELETE FROM users;

-- حذف ربط الصلاحيات
DELETE FROM role_permissions;

-- حذف الأدوار
DELETE FROM roles;

-- =====================================================
-- الخطوة 2: إضافة الأدوار الجديدة
-- =====================================================

INSERT INTO roles (id, role_name, description, created_at) VALUES
  (1, 'superadmin', 'مدير عام - صلاحيات كاملة', datetime('now')),
  (2, 'companyadmin', 'مدير شركة - إدارة الشركة', datetime('now')),
  (3, 'supervisor', 'مشرف - عرض ومراقبة', datetime('now')),
  (4, 'employee', 'موظف - صلاحيات أساسية', datetime('now'));

-- =====================================================
-- الخطوة 3: ربط الصلاحيات بالأدوار
-- =====================================================

-- 1️⃣ المدير العام (superadmin) - كل الصلاحيات
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- 2️⃣ مدير الشركة (companyadmin) - إدارة الشركة
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE 
  permission_key LIKE 'dashboard%' OR
  permission_key LIKE 'customers%' OR
  permission_key LIKE 'requests%' OR
  permission_key = 'banks.view' OR
  permission_key = 'rates.view' OR
  permission_key LIKE 'reports%' OR
  permission_key LIKE 'calculator%' OR
  permission_key = 'users.view' OR
  permission_key = 'users.create' OR
  permission_key = 'users.edit';

-- 3️⃣ المشرف (supervisor) - عرض ومراقبة فقط
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE 
  permission_key LIKE '%.view' OR
  permission_key LIKE 'dashboard%' OR
  permission_key = 'reports.view' OR
  permission_key = 'calculator.use';

-- 4️⃣ الموظف (employee) - صلاحيات أساسية
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE 
  permission_key IN (
    'dashboard.view',
    'customers.view',
    'customers.create',
    'customers.edit',
    'requests.view',
    'requests.create',
    'requests.edit',
    'banks.view',
    'rates.view',
    'calculator.use'
  );

-- =====================================================
-- الخطوة 4: إضافة المستخدمين الجدد
-- =====================================================

INSERT INTO users (id, username, password, full_name, email, phone, role_id, user_type, tenant_id, is_active, created_at) VALUES
  -- 1. المدير العام
  (1, 'superadmin', 'Super@2025', 'المدير العام', 'superadmin@tamweel.sa', '0500000001', 1, 'superadmin', 1, 1, datetime('now')),
  
  -- 2. مدير الشركة
  (2, 'companyadmin', 'Company@2025', 'مدير الشركة', 'company@tamweel.sa', '0500000002', 2, 'admin', 1, 1, datetime('now')),
  
  -- 3. المشرف
  (3, 'supervisor', 'Supervisor@2025', 'المشرف', 'supervisor@tamweel.sa', '0500000003', 3, 'supervisor', 1, 1, datetime('now')),
  
  -- 4. الموظف
  (4, 'employee', 'Employee@2025', 'الموظف', 'employee@tamweel.sa', '0500000004', 4, 'employee', 1, 1, datetime('now'));

-- إعادة تفعيل فحص Foreign Keys
PRAGMA foreign_keys = ON;
