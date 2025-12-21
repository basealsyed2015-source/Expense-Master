-- إعادة هيكلة نظام الصلاحيات (4 أدوار)
-- تاريخ الإنشاء: 2025-12-21

-- 1. حذف Role 2 (غير مستخدم)
DELETE FROM role_permissions WHERE role_id = 2;

-- 2. إضافة Role 5: مشرف/مدير موظفين (Supervisor)
INSERT OR IGNORE INTO roles (id, role_name, description) VALUES
(5, 'مشرف موظفين', 'مشرف يرى جميع عملاء وطلبات الشركة بصلاحيات قراءة فقط');

-- 3. تحديث أوصاف الأدوار
UPDATE roles SET 
    role_name = 'Super Admin',
    description = 'مدير النظام الكامل - يرى جميع الشركات وبيانات SaaS'
WHERE id = 1;

UPDATE roles SET 
    role_name = 'مدير شركة',
    description = 'مدير الشركة - يرى جميع بيانات شركته (عدا SaaS)'
WHERE id = 4;

UPDATE roles SET 
    role_name = 'موظف',
    description = 'موظف - يرى العملاء والطلبات المخصصة له فقط'
WHERE id = 3;

-- 4. منح صلاحيات Super Admin (Role 1) - كل شيء
DELETE FROM role_permissions WHERE role_id = 1;
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- 5. منح صلاحيات مدير الشركة (Role 4) - كل شيء عدا SaaS
DELETE FROM role_permissions WHERE role_id = 4;
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE permission_key IN (
    -- لوحة التحكم
    'dashboard.view',
    'dashboard.stats',
    
    -- العملاء (كامل)
    'customers.view',
    'customers.create',
    'customers.edit',
    'customers.delete',
    
    -- طلبات التمويل (كامل)
    'requests.view',
    'requests.create',
    'requests.edit',
    'requests.delete',
    'requests.approve',
    'requests.reject',
    
    -- البنوك (كامل)
    'banks.view',
    'banks.create',
    'banks.edit',
    'banks.delete',
    
    -- النسب (كامل)
    'rates.view',
    'rates.create',
    'rates.edit',
    'rates.delete',
    
    -- المستخدمين (كامل - داخل شركته)
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'users.permissions',
    
    -- الحاسبة
    'calculator.use',
    'calculator.export',
    
    -- التقارير
    'reports.view',
    'reports.export'
    
    -- ملاحظة: لا يوجد صلاحيات packages, subscriptions (SaaS)
);

-- 6. منح صلاحيات مشرف الموظفين (Role 5) - قراءة جميع بيانات الشركة
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions WHERE permission_key IN (
    -- لوحة التحكم
    'dashboard.view',
    'dashboard.stats',
    
    -- العملاء (قراءة فقط)
    'customers.view',
    
    -- طلبات التمويل (قراءة + تعديل حالة)
    'requests.view',
    'requests.edit',
    'requests.approve',
    'requests.reject',
    
    -- البنوك والنسب (قراءة)
    'banks.view',
    'rates.view',
    
    -- المستخدمين (قراءة فقط)
    'users.view',
    
    -- الحاسبة
    'calculator.use',
    'calculator.export',
    
    -- التقارير
    'reports.view',
    'reports.export'
);

-- 7. منح صلاحيات الموظف (Role 3) - بياناته فقط
DELETE FROM role_permissions WHERE role_id = 3;
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE permission_key IN (
    -- لوحة التحكم (بياناته)
    'dashboard.view',
    
    -- العملاء (المخصصين له فقط)
    'customers.view',
    'customers.create',
    'customers.edit',
    
    -- طلبات التمويل (المخصصة له فقط)
    'requests.view',
    'requests.create',
    'requests.edit',
    
    -- البنوك والنسب (قراءة)
    'banks.view',
    'rates.view',
    
    -- الحاسبة
    'calculator.use',
    'calculator.export',
    
    -- التقارير (بياناته فقط)
    'reports.view'
);
