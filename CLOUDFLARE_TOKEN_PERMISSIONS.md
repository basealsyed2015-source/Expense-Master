# صلاحيات التوكن المطلوبة لـ Cloudflare

## ❌ المشكلة الحالية
```
Authentication error [code: 10000]
A request to the Cloudflare API (/memberships) failed.
```

## ✅ الحل: إنشاء API Token جديد بالصلاحيات الصحيحة

### **الخطوات:**

1. اذهب إلى: https://dash.cloudflare.com/profile/api-tokens
2. اضغط على **"Create Token"**
3. اختر **"Edit Cloudflare Workers"** Template
4. قم بتعديل الصلاحيات كالتالي:

### **الصلاحيات المطلوبة:**

#### **Account Permissions:**
- ✅ **Workers Scripts: Edit**
- ✅ **Workers R2 Storage: Edit** 
- ✅ **D1: Edit**
- ✅ **Account Settings: Read**

#### **User Permissions:**
- ✅ **User Details: Read** (مهم لحل المشكلة الحالية)
- ✅ **Memberships: Read** (مهم جداً)

#### **Account Resources:**
- اختر **All accounts** أو حدد الحساب المطلوب

#### **Client IP Address Filtering:**
- اتركه فارغاً أو حدد IP معين للأمان

---

## 🔄 البديل: استخدام Dashboard لإنشاء الموارد يدوياً

إذا كنت لا تستطيع تعديل التوكن:

### **1. إنشاء D1 Database من Dashboard:**
```
1. اذهب إلى: https://dash.cloudflare.com/
2. اختر Account > Workers & Pages > D1
3. اضغط "Create database"
4. الاسم: tamweel-production
5. انسخ Database ID
```

### **2. إنشاء R2 Bucket من Dashboard:**
```
1. اذهب إلى: https://dash.cloudflare.com/
2. اختر R2 > Create bucket
3. الاسم: tamweel-attachments-production
```

### **3. تحديث wrangler.toml:**
```toml
[[d1_databases]]
binding = "DB"
database_name = "tamweel-production"
database_id = "YOUR_DATABASE_ID_HERE"

[[r2_buckets]]
binding = "ATTACHMENTS"
bucket_name = "tamweel-attachments-production"
```

### **4. رفع الجداول للـ Database:**
استخدم Dashboard:
```
1. افتح D1 Database > tamweel-production
2. اذهب إلى Console
3. انسخ محتوى ملف migrations/quick_cloudflare_setup.sql
4. الصقه في Console
5. اضغط Execute
```

---

## 📊 الخيارات المتاحة:

| الخيار | السهولة | السرعة | الموصى به |
|-------|---------|--------|-----------|
| إنشاء توكن جديد بالصلاحيات الصحيحة | ⭐⭐⭐ | ⚡⚡⚡ | ✅ نعم |
| استخدام Dashboard يدوياً | ⭐⭐ | ⚡⚡ | ⚠️ بديل |
| wrangler login (Browser OAuth) | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡⚡ | 🚫 لا (sandbox) |

---

## 🎯 التوصية:

**أنشئ توكن جديد** بالصلاحيات التالية:
```
✅ Account > Workers Scripts: Edit
✅ Account > Workers R2 Storage: Edit
✅ Account > D1: Edit
✅ Account > Account Settings: Read
✅ User > User Details: Read
✅ User > Memberships: Read
```

ثم أرسل التوكن الجديد، وسأكمل النشر بالكامل! 🚀
