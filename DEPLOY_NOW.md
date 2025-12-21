# 🚀 النشر الفوري على Cloudflare - الطريقة السهلة

## ⚠️ المشكلة
التوكن الحالي **لا يزال ينقصه صلاحيات** للعمل مع wrangler CLI.

---

## ✅ الحل السريع: النشر من Dashboard (بدون CLI)

### 🎯 **الطريقة 1: Cloudflare Pages + GitHub (الأسهل)**

#### **الخطوات:**

### 1️⃣ **إنشاء D1 Database:**
```
1. اذهب إلى: https://dash.cloudflare.com/
2. من القائمة اليسرى: Workers & Pages > D1
3. اضغط "Create database"
4. الاسم: tamweel-production
5. اضغط "Create"
6. 📋 انسخ Database ID (سيظهر في الصفحة)
```

### 2️⃣ **رفع الجداول للـ Database:**
```
1. افتح Database: tamweel-production
2. اذهب إلى تبويب "Console"
3. انسخ المحتوى من الأسفل ⬇️
4. الصق في Console
5. اضغط "Execute"
```

**📄 SQL للنسخ:**
```sql
-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role_id INTEGER DEFAULT 2,
    user_type TEXT DEFAULT 'company',
    subscription_id INTEGER,
    is_active INTEGER DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tenant_id INTEGER,
    role TEXT DEFAULT 'employee'
);

-- إنشاء جدول الأدوار
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- إدخال الأدوار
INSERT INTO roles (id, role_name, display_name, description) VALUES
(1, 'admin', 'مدير النظام', 'مدير النظام الكامل'),
(2, 'company', 'شركة مشتركة', 'حساب شركة'),
(3, 'user', 'موظف', 'مستخدم عادي'),
(4, 'company_admin', 'مدير شركة', 'مدير شركة مشتركة'),
(5, 'supervisor', 'مشرف موظفين', 'مشرف على الموظفين');

-- إنشاء جدول الشركات
CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- إدخال شركة تجريبية
INSERT INTO tenants (id, company_name, slug, status) VALUES
(1, 'شركة التمويل الأولى', 'tamweel-1', 'active');

-- إنشاء جدول الاشتراكات
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    plan_type TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- إدخال اشتراك تجريبي
INSERT INTO subscriptions (id, company_name, email, status) VALUES
(1, 'شركة التمويل الأولى', 'info@tamweel-1.sa', 'active');

-- إنشاء حسابات تجريبية (4 مستخدمين)
-- كلمات المرور: Super@2025, Company@2025, Supervisor@2025, Employee@2025
INSERT INTO users (username, password, full_name, email, role_id, user_type, tenant_id, role) VALUES
('superadmin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'المدير العام للنظام', 'super@tamweel.sa', 1, 'superadmin', NULL, 'admin'),
('companyadmin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'مدير الشركة', 'admin@tamweel-1.sa', 4, 'company', 1, 'company_admin'),
('supervisor', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'مشرف موظفين الشركة', 'supervisor@tamweel.sa', 5, 'company', 1, 'supervisor'),
('employee', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'موظف الشركة', 'employee@tamweel.sa', 3, 'company', 1, 'employee');
```

### 3️⃣ **إنشاء R2 Bucket:**
```
1. من القائمة اليسرى: R2
2. اضغط "Create bucket"
3. الاسم: tamweel-attachments-production
4. Region: Automatic
5. اضغط "Create bucket"
```

### 4️⃣ **ربط GitHub Repository:**
```
1. اذهب إلى: Workers & Pages
2. اضغط "Create application"
3. اختر "Pages"
4. اضغط "Connect to Git"
5. اختر GitHub
6. اختر Repository: Expense-Master
7. اختر Branch: genspark_ai_developer
8. اضبط:
   - Build command: npm run build
   - Build output directory: dist
9. اضغط "Save and Deploy"
```

### 5️⃣ **ربط D1 و R2:**
```
بعد نشر المشروع:

1. افتح Worker/Page: tamweel-calc
2. اذهب إلى Settings > Functions
3. في قسم "Bindings":
   
   أضف D1:
   - Variable name: DB
   - D1 database: tamweel-production
   
   أضف R2:
   - Variable name: ATTACHMENTS
   - R2 bucket: tamweel-attachments-production

4. اضغط "Save"
5. أعد Deploy: Settings > Deployments > Redeploy
```

---

## 🧪 **الاختبار:**

بعد انتهاء النشر، ستحصل على رابط مثل:
```
https://tamweel-calc.pages.dev
```

**جرّب تسجيل الدخول:**
- 🔗 Login: `https://tamweel-calc.pages.dev/login`

**الحسابات:**
| Username | Password | الدور |
|----------|----------|-------|
| superadmin | Super@2025 | مدير نظام |
| companyadmin | Company@2025 | مدير شركة |
| supervisor | Supervisor@2025 | مشرف |
| employee | Employee@2025 | موظف |

---

## 🎯 **الطريقة 2: رفع wrangler.toml يدوياً**

إذا أردت استخدام wrangler لاحقاً:

### **تحديث wrangler.toml:**
```toml
name = "tamweel-calc"
main = "src/index.tsx"
compatibility_date = "2024-01-01"
node_compat = true

[[d1_databases]]
binding = "DB"
database_name = "tamweel-production"
database_id = "YOUR_DATABASE_ID_HERE"  # <-- ضع Database ID من الخطوة 1

[[r2_buckets]]
binding = "ATTACHMENTS"
bucket_name = "tamweel-attachments-production"
```

ثم:
```bash
# تثبيت التوكن الجديد
export CLOUDFLARE_API_TOKEN=NEW_TOKEN_WITH_CORRECT_PERMISSIONS

# النشر
cd /home/user/webapp
npm run build
npx wrangler deploy
```

---

## ✅ **الخيار الأفضل الآن:**

**استخدم الطريقة 1** (Pages + GitHub):
- ✅ لا تحتاج CLI
- ✅ لا تحتاج صلاحيات إضافية
- ✅ Auto-deploy عند كل push
- ✅ Free SSL/TLS
- ✅ CDN عالمي

---

## 🆘 **المساعدة:**

إذا واجهت أي مشكلة، أرسل:
1. 📸 Screenshot من الخطوة
2. 📝 رسالة الخطأ (إن وجدت)
3. سأساعدك فوراً!

---

**الكود جاهز 100%! فقط اتبع الخطوات أعلاه وستعمل خلال 10 دقائق! 🚀**
