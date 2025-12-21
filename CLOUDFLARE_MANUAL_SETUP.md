# 🚀 دليل النشر اليدوي على Cloudflare (من Dashboard)

## 📌 نظرة عامة
هذا دليل مبسط للنشر على Cloudflare **بدون استخدام CLI**.

---

## ✅ الخطوة 1: إنشاء D1 Database

### من Cloudflare Dashboard:
1. اذهب إلى: **https://dash.cloudflare.com/**
2. من القائمة اليسرى اختر: **Workers & Pages** → **D1**
3. اضغط **"Create database"**
4. ادخل الاسم: `tamweel-production`
5. اضغط **"Create"**
6. ✅ **انسخ Database ID** (ستحتاجه لاحقاً)

---

## ✅ الخطوة 2: رفع الجداول للـ Database

### من Console:
1. افتح Database: `tamweel-production`
2. اذهب إلى تبويب **"Console"**
3. انسخ محتوى الملف التالي:

**📄 ملف الإعداد السريع: `migrations/quick_cloudflare_setup.sql`**

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
INSERT INTO users (username, password, full_name, email, role_id, user_type, tenant_id, role) VALUES
('superadmin', '$2a$10$YourHashedPassword1', 'المدير العام للنظام', 'super@tamweel.sa', 1, 'superadmin', NULL, 'admin'),
('companyadmin', '$2a$10$YourHashedPassword2', 'مدير الشركة', 'admin@tamweel-1.sa', 4, 'company', 1, 'company_admin'),
('supervisor', '$2a$10$YourHashedPassword3', 'مشرف موظفين الشركة', 'supervisor@tamweel.sa', 5, 'company', 1, 'supervisor'),
('employee', '$2a$10$YourHashedPassword4', 'موظف الشركة', 'employee@tamweel.sa', 3, 'company', 1, 'employee');
```

4. الصق الكود في **Console**
5. اضغط **"Execute"**
6. ✅ تأكد من ظهور رسالة النجاح

---

## ✅ الخطوة 3: إنشاء R2 Bucket

### من Cloudflare Dashboard:
1. من القائمة اليسرى اختر: **R2**
2. اضغط **"Create bucket"**
3. ادخل الاسم: `tamweel-attachments-production`
4. اختر Region: **Automatic**
5. اضغط **"Create bucket"**
6. ✅ انتهى!

---

## ✅ الخطوة 4: تحديث wrangler.toml

### في ملف `wrangler.toml`:
```toml
name = "tamweel-calc"
main = "src/index.tsx"
compatibility_date = "2024-01-01"
node_compat = true

[[d1_databases]]
binding = "DB"
database_name = "tamweel-production"
database_id = "YOUR_DATABASE_ID_HERE"  # <-- ضع Database ID هنا

[[r2_buckets]]
binding = "ATTACHMENTS"
bucket_name = "tamweel-attachments-production"
```

**استبدل `YOUR_DATABASE_ID_HERE` بـ Database ID الذي نسخته في الخطوة 1.**

---

## ✅ الخطوة 5: النشر

### من Terminal:
```bash
cd /home/user/webapp

# بناء المشروع
npm install
npm run build

# النشر على Cloudflare
export CLOUDFLARE_API_TOKEN=YOUR_TOKEN_HERE
npx wrangler deploy
```

**أو من Cloudflare Dashboard:**
1. اذهب إلى **Workers & Pages** → **Create application**
2. اختر **Pages** → **Connect to Git**
3. اختر Repository: `Expense-Master`
4. Branch: `genspark_ai_developer`
5. Build command: `npm run build`
6. Build output directory: `dist`
7. اضغط **"Save and Deploy"**

---

## ✅ الخطوة 6: ربط الموارد بالـ Worker

### من Dashboard:
1. افتح Worker: `tamweel-calc`
2. اذهب إلى **Settings** → **Bindings**
3. أضف D1 Database:
   - Variable name: `DB`
   - Database: `tamweel-production`
4. أضف R2 Bucket:
   - Variable name: `ATTACHMENTS`
   - Bucket: `tamweel-attachments-production`
5. اضغط **"Save"**

---

## ✅ الخطوة 7: تعيين Custom Domain (اختياري)

### إذا كنت تريد استخدام `tamweel.sa`:
1. اذهب إلى Worker → **Settings** → **Domains & Routes**
2. اضغط **"Add Custom Domain"**
3. ادخل: `app.tamweel.sa` (أو أي subdomain)
4. اضغط **"Add Domain"**
5. ✅ Cloudflare ستضبط DNS تلقائياً

---

## 🧪 اختبار النظام

### حسابات الاختبار:
| المستخدم | Username | Password | الصلاحيات |
|----------|----------|----------|-----------|
| **Super Admin** | `superadmin` | `Super@2025` | كل الصلاحيات |
| **Company Admin** | `companyadmin` | `Company@2025` | إدارة الشركة |
| **Supervisor** | `supervisor` | `Supervisor@2025` | الإشراف فقط |
| **Employee** | `employee` | `Employee@2025` | موظف عادي |

### روابط الاختبار:
- 🔗 **Login**: `https://tamweel-calc.pages.dev/login`
- 🔗 **Admin Panel**: `https://tamweel-calc.pages.dev/admin/panel`
- 🔗 **Users**: `https://tamweel-calc.pages.dev/admin/users`

---

## 📊 التكاليف

### Cloudflare Free Tier:
| الخدمة | الحد المجاني | التكلفة الإضافية |
|--------|--------------|------------------|
| **Workers** | 100,000 requests/day | $0.15 / مليون |
| **D1** | 5 GB storage + 5M reads | $0.001 / 1000 reads |
| **R2** | 10 GB storage + 1M writes | $0.015 / GB/month |
| **Pages** | غير محدود | مجاني تماماً |

✅ **للمشاريع الصغيرة: FREE تماماً!**

---

## ❓ استكشاف الأخطاء

### مشكلة: "Database not found"
**الحل:**
- تأكد من `database_id` في `wrangler.toml`
- تحقق من Bindings في Worker Settings

### مشكلة: "R2 bucket not accessible"
**الحل:**
- تأكد من اسم Bucket: `tamweel-attachments-production`
- تحقق من Bindings: Variable = `ATTACHMENTS`

### مشكلة: "Login fails"
**الحل:**
- تحقق من رفع الجداول بنجاح
- افتح D1 Console وتأكد من وجود `users` table
- جرّب Query: `SELECT * FROM users LIMIT 5;`

---

## 🎯 الخلاصة

✅ **أنت الآن جاهز!** 

**الخطوات المطلوبة:**
1. ✅ إنشاء D1 Database
2. ✅ رفع الجداول (SQL)
3. ✅ إنشاء R2 Bucket
4. ✅ تحديث `wrangler.toml`
5. ✅ النشر: `wrangler deploy`
6. ✅ ربط الموارد (Bindings)
7. ✅ الاختبار!

---

**🚀 إذا واجهت أي مشكلة، أرسل لي screenshot وسأساعدك فوراً!**
