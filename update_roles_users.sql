-- تحديث الأدوار والمستخدمين
-- Update Roles and Users

-- =====================================================
-- الخطوة 1: تحديث الأدوار
-- =====================================================

-- تحديث الأدوار الموجودة
UPDATE roles SET role_name = 'superadmin', description = 'مدير عام - صلاحيات كاملة' WHERE id = 1;
UPDATE roles SET role_name = 'companyadmin', description = 'مدير شركة - إدارة الشركة' WHERE id = 2;
UPDATE roles SET role_name = 'supervisor', description = 'مشرف - عرض ومراقبة' WHERE id = 3;

-- إضافة دور employee إذا لم يكن موجوداً
INSERT OR IGNORE INTO roles (id, role_name, description, created_at) VALUES
  (4, 'employee', 'موظف - صلاحيات أساسية', datetime('now'));

-- =====================================================
-- الخطوة 2: حذف وإعادة ربط الصلاحيات
-- =====================================================

DELETE FROM role_permissions;

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
-- الخطوة 3: تحديث المستخدمين الموجودين
-- =====================================================

-- المستخدم 1: superadmin (تحويل admin القديم إلى superadmin)
UPDATE users SET 
  username = 'superadmin',
  password = 'Super@2025',
  full_name = 'المدير العام',
  email = 'superadmin@system.sa',
  phone = '0500000001',
  role_id = 1,
  user_type = 'superadmin',
  is_active = 1
WHERE id = 1;

-- المستخدم 2: companyadmin (تحديث superadmin القديم)
UPDATE users SET 
  username = 'companyadmin',
  password = 'Company@2025',
  full_name = 'مدير الشركة',
  email = 'company@tamweel.sa',
  phone = '0500000002',
  role_id = 2,
  user_type = 'admin',
  is_active = 1
WHERE id = 2;

-- المستخدم 3: supervisor
UPDATE users SET 
  username = 'supervisor',
  password = 'Supervisor@2025',
  full_name = 'المشرف',
  email = 'supervisor@tamweel.sa',
  phone = '0500000003',
  role_id = 3,
  user_type = 'supervisor',
  is_active = 1
WHERE id = 3;

-- المستخدم 4: employee
UPDATE users SET 
  username = 'employee',
  password = 'Employee@2025',
  full_name = 'الموظف',
  email = 'employee@tamweel.sa',
  phone = '0500000004',
  role_id = 4,
  user_type = 'employee',
  is_active = 1
WHERE id = 4;

-- المستخدم 5: إبقاء كما هو أو تحديثه (اختياري)
UPDATE users SET 
  username = 'admin',
  password = 'Admin@2025',
  full_name = 'مدير النظام',
  phone = '0500000005',
  role_id = 2,
  user_type = 'admin',
  is_active = 1
WHERE id = 5;
