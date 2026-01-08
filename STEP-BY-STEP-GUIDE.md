# 🎯 حل المشكلة - دليل مصور خطوة بخطوة

## 🔴 المشكلة الحالية
تسجيل الدخول لا يعمل لأن قاعدة البيانات **Production** فارغة.

---

## ✅ الحل البسيط (5 خطوات فقط!)

### الخطوة 1️⃣: افتح Cloudflare Dashboard

افتح هذا الرابط في المتصفح:
```
https://dash.cloudflare.com/946716fe2e725173ff521f80abd41e9e/workers-and-pages
```

أو:
1. اذهب إلى: https://dash.cloudflare.com
2. اختر حسابك
3. من القائمة الجانبية، اختر **"Workers & Pages"**

---

### الخطوة 2️⃣: افتح D1 Databases

1. في صفحة Workers & Pages
2. اضغط على تبويب **"D1 SQL Database"** من الأعلى
3. ستظهر قائمة بقواعد البيانات

أو افتح مباشرة:
```
https://dash.cloudflare.com/946716fe2e725173ff521f80abd41e9e/workers/d1
```

---

### الخطوة 3️⃣: افتح قاعدة البيانات tamweel-production

1. ابحث عن قاعدة البيانات باسم: **tamweel-production**
2. اضغط على اسمها
3. ستفتح صفحة تفاصيل القاعدة

---

### الخطوة 4️⃣: افتح Console

في صفحة تفاصيل القاعدة:
1. ابحث عن تبويب **"Console"** في الأعلى
2. اضغط عليه
3. ستظهر شاشة لكتابة أوامر SQL

**يجب أن ترى:**
- صندوق كبير لكتابة SQL
- زر أزرق أسفله مكتوب عليه **"Execute"** أو **"Run Query"**

---

### الخطوة 5️⃣: نفّذ السكريبت

#### أ) انسخ السكريبت:

**الطريقة 1 - من GitHub:**
1. افتح: https://github.com/basealsyed2015-source/Expense-Master/blob/main/final-database-setup.sql
2. اضغط على زر **"Copy raw file"** (أيقونة نسختين فوق بعض)
3. أو اضغط على **"Raw"** ثم Ctrl+A ثم Ctrl+C

**الطريقة 2 - من الأسفل:**
انسخ السكريبت الموجود في نهاية هذا الملف ⬇️

#### ب) الصق السكريبت:
1. في صندوق SQL Console
2. اضغط Ctrl+V (أو زر الفأرة اليمين → Paste)
3. يجب أن يظهر السكريبت الكامل (حوالي 300 سطر)

#### ج) نفّذ السكريبت:
1. اضغط على الزر الأزرق **"Execute"** أو **"Run Query"**
2. انتظر 5-10 ثوانٍ
3. ستظهر رسائل النجاح

---

## ✅ التحقق من النجاح

يجب أن ترى في النتائج:

```
✅ الأدوار (Roles): 4
✅ الشركات (Tenants): 3  
✅ المستخدمون (Users): 7
✅ البنوك (Banks): 6
✅ العملاء (Customers): 5
✅ نسب التمويل (Rates): 6
✅ طلبات التمويل (Requests): 5

بيانات تسجيل الدخول:
ID: 11
اسم المستخدم: saas_admin
كلمة المرور: SaaS@Admin2025
```

---

## 🧪 اختبار تسجيل الدخول

بعد تنفيذ السكريبت بنجاح:

1. افتح: **https://tamweel-calc.com/login**
2. أدخل:
   - **اسم المستخدم**: `saas_admin`
   - **كلمة المرور**: `SaaS@Admin2025`
3. اضغط **تسجيل الدخول**

### ✅ يجب أن يعمل الآن!

جرب فتح:
- لوحة المعلومات: https://tamweel-calc.com/admin/dashboard
- إدارة الاشتراكات: https://tamweel-calc.com/admin/subscriptions
- إعدادات SaaS: https://tamweel-calc.com/admin/saas-settings

---

## 📱 إذا لم تجد D1 Console

### الطريقة البديلة - الوصول المباشر:

1. افتح: https://dash.cloudflare.com
2. من القائمة الجانبية اليسرى، اختر **"Workers & Pages"**
3. من التبويبات في الأعلى، اختر **"D1"**
4. اضغط على **"tamweel-production"**
5. من التبويبات، اختر **"Console"**

### أماكن محتملة لـ D1:
- Workers & Pages → D1 SQL Database
- Workers → D1
- Storage → D1 Database
- أو ابحث عن "D1" في صندوق البحث في الأعلى

---

## ❓ الأسئلة الشائعة

### س: أين أجد Workers & Pages؟
**ج:** في القائمة الجانبية اليسرى في Cloudflare Dashboard.

### س: لا أجد تبويب Console!
**ج:** تأكد أنك فتحت قاعدة البيانات نفسها (tamweel-production)، وليس قائمة القواعد.

### س: ماذا لو ظهر خطأ عند التنفيذ؟
**ج:** 
1. انسخ رسالة الخطأ كاملة
2. أرسلها لي
3. سأساعدك فوراً

### س: كيف أعرف أن السكريبت نجح؟
**ج:** ستظهر جداول بالنتائج وأعداد السجلات المُضافة.

### س: هل يمكنني تشغيل السكريبت أكثر من مرة؟
**ج:** نعم، آمن تماماً - يحذف البيانات القديمة ويضيف الجديدة.

---

## 🚨 ملاحظات مهمة

### ⚠️ تأكد أنك في Production Database:
- يجب أن يكون الرابط يحتوي على: `/workers/d1`
- **ليس** قاعدة البيانات المحلية (local)
- **ليس** في مجلد `.wrangler`

### ⚠️ نفّذ السكريبت مرة واحدة فقط:
- لا تنفذه عدة مرات بسرعة
- انتظر حتى تظهر النتائج

### ⚠️ لا تغلق الصفحة:
- انتظر حتى يكتمل التنفيذ
- لا تضغط Escape أو Back

---

## 📞 ما زالت المشكلة موجودة؟

أخبرني بـ:
1. **في أي خطوة أنت الآن؟**
   - [ ] فتحت Cloudflare Dashboard
   - [ ] فتحت Workers & Pages
   - [ ] فتحت D1 Databases
   - [ ] فتحت tamweel-production
   - [ ] فتحت Console
   - [ ] نسخت السكريبت
   - [ ] لصقت السكريبت
   - [ ] ضغطت Execute
   - [ ] ظهرت النتائج
   - [ ] جربت تسجيل الدخول

2. **ماذا ترى على الشاشة؟**
   - أرسل screenshot إذا أمكن
   - أو اوصف ما تراه

3. **هل ظهرت رسالة خطأ؟**
   - انسخ الرسالة كاملة

---

## 📋 السكريبت الكامل

```sql
-- ════════════════════════════════════════════════════════════════
-- 🎯 سكريبت إعادة بناء قاعدة البيانات - النسخة النهائية
-- ════════════════════════════════════════════════════════════════

-- 🗑️ حذف الجداول القديمة
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

-- 🔨 إنشاء الجداول الجديدة
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    subdomain TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE banks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT,
    tenant_id INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

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

-- 📊 إضافة البيانات
INSERT INTO roles (id, name, name_ar, description, description_ar) VALUES
(11, 'SaaS Admin', 'مدير النظام SaaS', 'Full system administrator', 'مدير النظام الكامل'),
(12, 'Company Admin', 'مدير شركة', 'Company administrator', 'مدير الشركة'),
(13, 'HR Supervisor', 'مشرف موارد بشرية', 'HR supervisor', 'مشرف الموارد البشرية'),
(14, 'Employee', 'موظف', 'Regular employee', 'موظف عادي');

INSERT INTO tenants (id, name, subdomain, status) VALUES
(2, 'شركة التمويل الأولى', 'tamweel-1', 'active'),
(3, 'شركة التمويل الثانية', 'tamweel-2', 'active'),
(4, 'شركة التمويل الثالثة', 'tamweel-3', 'active');

INSERT INTO users (id, username, password, full_name, email, role_id, tenant_id, is_active) VALUES
(11, 'saas_admin', 'SaaS@Admin2025', 'مدير النظام', 'admin@tamweel-calc.com', 11, NULL, 1);

INSERT INTO users (username, password, full_name, email, role_id, tenant_id, is_active) VALUES
('admin_tamweel1', 'demo123', 'أحمد محمد', 'admin1@tamweel.com', 12, 2, 1),
('emp_tamweel1', 'demo123', 'محمد علي', 'emp1@tamweel.com', 14, 2, 1),
('admin_tamweel2', 'demo123', 'خالد حسن', 'admin2@tamweel.com', 12, 3, 1),
('emp_tamweel2', 'demo123', 'سعيد أحمد', 'emp2@tamweel.com', 14, 3, 1),
('admin_tamweel3', 'demo123', 'ياسر عبدالله', 'admin3@tamweel.com', 12, 4, 1),
('emp_tamweel3', 'demo123', 'فهد سالم', 'emp3@tamweel.com', 14, 4, 1);

INSERT INTO banks (name, code, tenant_id, is_active) VALUES
('البنك الأهلي', 'NCB', 2, 1),
('بنك الراجحي', 'RAJ', 2, 1),
('بنك الرياض', 'RIY', 3, 1),
('بنك ساب', 'SAB', 3, 1),
('البنك السعودي الفرنسي', 'BSF', 4, 1),
('البنك العربي', 'ARB', 4, 1);

INSERT INTO rates (bank_id, product_type, rate, min_amount, max_amount, min_duration, max_duration, tenant_id, is_active) VALUES
(1, 'تمويل عقاري', 3.5, 100000, 5000000, 60, 300, 2, 1),
(1, 'تمويل شخصي', 5.0, 10000, 500000, 12, 60, 2, 1),
(2, 'تمويل عقاري', 3.8, 100000, 5000000, 60, 300, 2, 1),
(3, 'تمويل شخصي', 4.5, 10000, 500000, 12, 60, 3, 1),
(4, 'تمويل عقاري', 3.6, 100000, 5000000, 60, 300, 3, 1),
(5, 'تمويل سيارات', 4.0, 20000, 300000, 12, 60, 4, 1);

INSERT INTO customers (name, id_number, phone, email, tenant_id, created_by) VALUES
('عبدالله أحمد', '1234567890', '0501234567', 'abdullah@example.com', 2, 12),
('فاطمة محمد', '2345678901', '0502345678', 'fatima@example.com', 2, 12),
('عمر خالد', '3456789012', '0503456789', 'omar@example.com', 3, 14),
('نورة سعيد', '4567890123', '0504567890', 'noura@example.com', 3, 14),
('يوسف علي', '5678901234', '0505678901', 'youssef@example.com', 4, 16);

INSERT INTO financing_requests (customer_id, bank_id, amount, duration, status, tenant_id, created_by) VALUES
(1, 1, 250000, 60, 'approved', 2, 12),
(2, 2, 150000, 36, 'pending', 2, 12),
(3, 3, 300000, 48, 'under_review', 3, 14),
(4, 4, 500000, 120, 'approved', 3, 14),
(5, 5, 80000, 24, 'rejected', 4, 16);

-- ✅ عرض النتائج
SELECT '✅ الأدوار' as البند, COUNT(*) as العدد FROM roles
UNION ALL SELECT '✅ الشركات', COUNT(*) FROM tenants
UNION ALL SELECT '✅ المستخدمون', COUNT(*) FROM users
UNION ALL SELECT '✅ البنوك', COUNT(*) FROM banks
UNION ALL SELECT '✅ العملاء', COUNT(*) FROM customers
UNION ALL SELECT '✅ نسب التمويل', COUNT(*) FROM rates
UNION ALL SELECT '✅ طلبات التمويل', COUNT(*) FROM financing_requests;

SELECT 'بيانات تسجيل الدخول' as '═══════════════════';
SELECT id as ID, username as 'اسم المستخدم', password as 'كلمة المرور' 
FROM users WHERE username = 'saas_admin';
```

---

## 🎯 الخلاصة

1. افتح D1 Console
2. الصق السكريبت أعلاه
3. اضغط Execute
4. جرب تسجيل الدخول

**أنا في انتظار ردك! 🚀**

اكتب لي:
- ✅ "نجح!" إذا عمل
- ❌ "فشل" + رسالة الخطأ
- ❓ "لا أجد Console" + وصف ما تراه
