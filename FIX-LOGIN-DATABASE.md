# 🔧 إصلاح مشكلة تسجيل الدخول - قاعدة البيانات فارغة

## ⚠️ **المشكلة:**

```
❌ تسجيل الدخول لا يعمل على: https://tamweel-calc.com
✅ يعمل محلياً على: Sandbox
```

**السبب:** قاعدة البيانات على Cloudflare Pages (Production) **فارغة**!
- البيانات موجودة في قاعدة البيانات المحلية فقط
- لم يتم تشغيل Migrations على Production

---

## ✅ **الحل: إضافة البيانات إلى Production Database**

### **الطريقة 1: من Cloudflare Dashboard (الأسهل)**

#### **الخطوة 1: افتح D1 Database Console**

```
https://dash.cloudflare.com/946716fe2e725173ff521f80abd41e9e/workers/d1
```

أو:
1. اذهب إلى Cloudflare Dashboard
2. Workers & Pages → D1
3. اختر Database: **tamweel-production**
4. اضغط **"Console"** أو **"Query"**

---

#### **الخطوة 2: تشغيل Migration (إنشاء الجداول)**

في Console، شغّل هذا السكريبت:

```sql
-- إنشاء جدول users
CREATE TABLE IF NOT EXISTS users (
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
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول roles
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول tenants
CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    subdomain TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

#### **الخطوة 3: إضافة الأدوار**

```sql
-- إضافة الأدوار
INSERT INTO roles (id, name, name_ar, description, description_ar) VALUES
(11, 'SaaS Admin', 'مدير النظام SaaS', 'Full system administrator', 'مدير النظام الكامل'),
(12, 'Company Admin', 'مدير شركة', 'Company administrator', 'مدير الشركة'),
(13, 'HR Supervisor', 'مشرف موارد بشرية', 'HR department supervisor', 'مشرف قسم الموارد البشرية'),
(14, 'Employee', 'موظف', 'Regular employee', 'موظف عادي');
```

---

#### **الخطوة 4: إضافة مدير النظام**

```sql
-- إضافة مدير النظام SaaS
INSERT INTO users (id, username, password, full_name, email, role_id, tenant_id, is_active)
VALUES (11, 'saas_admin', 'SaaS@Admin2025', 'مدير النظام', 'admin@tamweel-calc.com', 11, NULL, 1);
```

---

#### **الخطوة 5: التحقق من البيانات**

```sql
-- التحقق من الأدوار
SELECT * FROM roles;

-- التحقق من المستخدمين
SELECT id, username, role_id FROM users;
```

**النتيجة المتوقعة:**
```
✅ 4 أدوار
✅ 1 مستخدم (saas_admin)
```

---

### **الطريقة 2: تشغيل Migrations (متقدمة)**

إذا أردت تشغيل جميع Migrations بالكامل:

#### **الخطوة 1: تحديث صلاحيات Token**

Token الحالي ينقصه صلاحيات D1. أضف الصلاحية:

```
https://dash.cloudflare.com/profile/api-tokens
```

تعديل Token: **GenSpark Deployment Token**

أضف:
```
➕ Account | D1 | Edit
```

---

#### **الخطوة 2: تشغيل Migrations**

```bash
cd /home/user/webapp

export CLOUDFLARE_API_TOKEN="F3Grpt9G_ughAQQR0tySYaQYo_ehx-am_91Zy8FD"
export CLOUDFLARE_ACCOUNT_ID="946716fe2e725173ff521f80abd41e9e"

# تشغيل جميع Migrations
npx wrangler d1 migrations apply tamweel-production --remote
```

---

### **الطريقة 3: سكريبت SQL كامل (نسخ ولصق)**

إذا أردت سكريبت واحد لإنشاء كل شيء:

```sql
-- ════════════════════════════════════════════════
-- 🔧 سكريبت إصلاح قاعدة البيانات - Production
-- ════════════════════════════════════════════════

-- 1️⃣ إنشاء الجداول الأساسية
CREATE TABLE IF NOT EXISTS users (
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
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    subdomain TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2️⃣ إضافة الأدوار
INSERT INTO roles (id, name, name_ar, description, description_ar) VALUES
(11, 'SaaS Admin', 'مدير النظام SaaS', 'Full system administrator', 'مدير النظام الكامل'),
(12, 'Company Admin', 'مدير شركة', 'Company administrator', 'مدير الشركة'),
(13, 'HR Supervisor', 'مشرف موارد بشرية', 'HR department supervisor', 'مشرف قسم الموارد البشرية'),
(14, 'Employee', 'موظف', 'Regular employee', 'موظف عادي');

-- 3️⃣ إضافة مدير النظام
INSERT INTO users (id, username, password, full_name, email, role_id, tenant_id, is_active)
VALUES (11, 'saas_admin', 'SaaS@Admin2025', 'مدير النظام', 'admin@tamweel-calc.com', 11, NULL, 1);

-- 4️⃣ إضافة شركات تجريبية
INSERT INTO tenants (id, name, subdomain, status) VALUES
(2, 'شركة التمويل الأولى', 'tamweel-1', 'active'),
(3, 'شركة التمويل الثانية', 'tamweel-2', 'active'),
(4, 'شركة التمويل الثالثة', 'tamweel-3', 'active');

-- 5️⃣ إضافة مستخدمين تجريبيين
INSERT INTO users (username, password, full_name, email, role_id, tenant_id, is_active) VALUES
('admin_tamweel1', 'demo123', 'مدير شركة التمويل الأولى', 'admin1@tamweel.com', 12, 2, 1),
('emp_tamweel1', 'demo123', 'موظف شركة التمويل الأولى', 'emp1@tamweel.com', 14, 2, 1),
('admin_tamweel2', 'demo123', 'مدير شركة التمويل الثانية', 'admin2@tamweel.com', 12, 3, 1),
('emp_tamweel2', 'demo123', 'موظف شركة التمويل الثانية', 'emp2@tamweel.com', 14, 3, 1),
('admin_tamweel3', 'demo123', 'مدير شركة التمويل الثالثة', 'admin3@tamweel.com', 12, 4, 1),
('emp_tamweel3', 'demo123', 'موظف شركة التمويل الثالثة', 'emp3@tamweel.com', 14, 4, 1);

-- ✅ تم! الآن قاعدة البيانات جاهزة
```

---

## 🧪 **التحقق من الإصلاح:**

### **من Cloudflare Dashboard:**

```sql
-- عدد المستخدمين
SELECT COUNT(*) as total_users FROM users;
-- النتيجة المتوقعة: 7

-- عرض جميع المستخدمين
SELECT id, username, role_id, tenant_id FROM users;
```

---

### **من المتصفح:**

```bash
curl -X POST https://tamweel-calc.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"saas_admin","password":"SaaS@Admin2025"}'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "token": "base64_token_here",
  "user": {
    "id": 11,
    "username": "saas_admin",
    "role_id": 11
  }
}
```

---

## 📋 **Checklist:**

```
□ فتحت D1 Database Console
□ شغّلت سكريبت إنشاء الجداول
□ أضفت الأدوار (4 أدوار)
□ أضفت مدير النظام (saas_admin)
□ أضفت الشركات التجريبية (3 شركات)
□ أضفت المستخدمين التجريبيين (6 مستخدمين)
□ اختبرت تسجيل الدخول
□ نجح! ✅
```

---

## 🎯 **الخطوة التالية:**

بعد تشغيل السكريبت:

1. **افتح:** https://tamweel-calc.com/login
2. **أدخل:**
   - Username: `saas_admin`
   - Password: `SaaS@Admin2025`
3. **اضغط "تسجيل الدخول"**
4. **✅ يجب أن يعمل الآن!**

---

## 🔗 **الروابط المهمة:**

| الخدمة | الرابط |
|--------|--------|
| **D1 Console** | https://dash.cloudflare.com/946716fe2e725173ff521f80abd41e9e/workers/d1 |
| **تسجيل الدخول** | https://tamweel-calc.com/login |
| **API Token** | https://dash.cloudflare.com/profile/api-tokens |

---

## 💡 **نصيحة:**

**أسهل طريقة:**
1. افتح D1 Console
2. انسخ "سكريبت SQL كامل" أعلاه
3. الصقه في Console
4. اضغط "Execute"
5. ✅ جاهز!

---

## 📞 **بعد التنفيذ:**

أخبرني:
- **"نفّذت السكريبت"** ← سأختبر معك
- **"واجهت مشكلة"** ← أرسل رسالة الخطأ
- **"نجح!"** ← مبروك! 🎉

---

**🚀 جاهز للإصلاح؟ ابدأ الآن!**
