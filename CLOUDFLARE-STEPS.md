# 🚀 خطوات النشر على Cloudflare - tamweel-calc-prod

## ✅ الحالة الحالية

- ✅ المشروع موجود على Cloudflare: **tamweel-calc-prod**
- ✅ الكود محدث على GitHub: **main branch**
- ✅ البناء ناجح: **dist/_worker.js (1,476.82 kB)**
- ❌ API Token غير مُعد

---

## 📋 الخطوات المطلوبة

### **الخطوة 1: إعداد Cloudflare API Token ⚠️ (مطلوب)**

#### 1.1 افتح Cloudflare Dashboard
```
https://dash.cloudflare.com/profile/api-tokens
```

#### 1.2 أنشئ API Token جديد
1. اضغط على **"Create Token"**
2. اختر قالب **"Edit Cloudflare Workers"**
3. أو أنشئ **Custom Token** بالصلاحيات التالية:

**الصلاحيات المطلوبة:**
```
Account:
  ✅ Account Settings: Read
  ✅ Cloudflare Pages: Edit

Zone: (اختياري)
  □ Workers Routes: Edit
```

#### 1.3 انسخ الـ Token
- بعد إنشاء الـ Token، **انسخه فوراً** (يظهر مرة واحدة فقط!)
- مثال: `Bearer xxxxx-yyyyy-zzzzz`

#### 1.4 أضف الـ Token في GenSpark
**طريقتان:**

**الطريقة 1: عبر واجهة GenSpark (موصى بها)**
1. اذهب إلى تبويب **"Deploy"** في الشريط الجانبي
2. ابحث عن حقل **"Cloudflare API Key"**
3. الصق الـ Token
4. اضغط **"Save"**

**الطريقة 2: عبر Terminal**
```bash
cd /home/user/webapp
export CLOUDFLARE_API_TOKEN="your-token-here"
```

---

### **الخطوة 2: التحقق من الإعداد**

بعد إضافة الـ Token، تحقق:

```bash
cd /home/user/webapp
npx wrangler whoami
```

**النتيجة المتوقعة:**
```
Getting User settings...
👋 You are logged in with an API Token, associated with the email 'your-email@example.com'
┌──────────────────────────────────────┬──────────────────────────────┐
│ Account Name                         │ Account ID                   │
├──────────────────────────────────────┼──────────────────────────────┤
│ Your Account Name                    │ xxxxxxxxxxxxxxxxxxxx         │
└──────────────────────────────────────┴──────────────────────────────┘
```

إذا رأيت هذا، فالإعداد صحيح! ✅

---

### **الخطوة 3: النشر على Cloudflare**

الآن يمكنك النشر بإحدى الطرق التالية:

#### **الطريقة 1: سكريبت تلقائي (الأسهل) ⭐**

```bash
cd /home/user/webapp
./deploy.sh
```

السكريبت سيقوم بـ:
1. ✅ Git add + commit + push
2. ✅ بناء المشروع
3. ✅ النشر على Cloudflare

---

#### **الطريقة 2: أوامر npm (سريعة)**

```bash
cd /home/user/webapp

# نشر مباشر
npm run deploy:prod
```

أو:
```bash
# Git + بناء + نشر (الكل)
npm run update:full
```

---

#### **الطريقة 3: يدوياً (تحكم كامل)**

```bash
cd /home/user/webapp

# 1. بناء (إذا لم تفعل)
npm run build

# 2. النشر
npx wrangler pages deploy dist --project-name tamweel-calc-prod --branch main
```

---

### **الخطوة 4: التحقق من النشر**

بعد النشر الناجح، ستظهر رسالة مثل:

```
✨ Success! Uploaded 1 files (X.XX sec)

✨ Deployment complete! Take a peek over at https://5310a41c.tamweel-calc.pages.dev
🌍 View your deployment at:
  - https://tamweel-calc-prod.pages.dev (Production)
  - https://main.tamweel-calc-prod.pages.dev (main branch)
```

**اختبر الموقع:**
```bash
# طريقة 1: في المتصفح
افتح: https://tamweel-calc-prod.pages.dev

# طريقة 2: عبر curl
curl https://tamweel-calc-prod.pages.dev
```

---

## 🔄 **تحديث قاعدة البيانات (D1) - إذا لزم**

إذا كانت هناك migrations جديدة:

```bash
cd /home/user/webapp

# 1. تطبيق migrations على Production
npx wrangler d1 migrations apply tamweel-production --remote

# 2. التحقق
npx wrangler d1 execute tamweel-production --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

---

## 🎯 **ملاحظات مهمة**

### ⚠️ **اسم المشروع**
- على Cloudflare: `tamweel-calc-prod`
- استخدم هذا الاسم في جميع الأوامر

### 🔐 **الأمان**
- لا تشارك API Token مع أحد
- لا تضع Token في Git
- استخدم `.env` أو Cloudflare Secrets للبيانات الحساسة

### 📊 **المراقبة**
بعد النشر، راقب:
```bash
# Logs في الوقت الفعلي
npx wrangler pages deployment tail --project-name tamweel-calc-prod

# قائمة النشرات
npx wrangler pages deployment list --project-name tamweel-calc-prod
```

---

## 🐛 **حل المشاكل**

### مشكلة 1: "You are not authenticated"
```bash
# الحل: أضف API Token في تبويب Deploy
# ثم تحقق:
npx wrangler whoami
```

### مشكلة 2: "Project not found"
```bash
# تأكد من اسم المشروع
npx wrangler pages project list

# استخدم الاسم الصحيح
npx wrangler pages deploy dist --project-name tamweel-calc-prod
```

### مشكلة 3: "Build failed"
```bash
# نظف وأعد البناء
rm -rf dist node_modules/.vite
npm run build
```

### مشكلة 4: "D1 Database not found"
```bash
# تحقق من قاعدة البيانات
npx wrangler d1 list

# أنشئ إذا لم تكن موجودة
npx wrangler d1 create tamweel-production
```

---

## ✅ **Checklist قبل النشر**

- [ ] **API Token مُضاف في تبويب Deploy** ⚠️ (الأهم)
- [ ] `npx wrangler whoami` يعمل بنجاح
- [ ] `npm run build` ينتهي بدون أخطاء
- [ ] قاعدة البيانات محدثة (migrations مُطبقة)
- [ ] الكود مُختبر محلياً
- [ ] Git commit + push تم بنجاح

---

## 🎉 **ابدأ الآن!**

### **الخطوة الأولى والأهم:**
```
1. افتح: https://dash.cloudflare.com/profile/api-tokens
2. أنشئ Token جديد
3. أضفه في تبويب Deploy
4. تحقق: npx wrangler whoami
```

### **بعد ذلك:**
```bash
cd /home/user/webapp
./deploy.sh
```

**أو:**
```bash
npm run deploy:prod
```

---

## 🔗 **روابط مفيدة**

- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **Workers & Pages**: https://dash.cloudflare.com/ → Workers & Pages → tamweel-calc-prod
- **API Tokens**: https://dash.cloudflare.com/profile/api-tokens
- **GitHub Repo**: https://github.com/basealsyed2015-source/Expense-Master
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/

---

## 📞 **المساعدة**

```bash
# عرض المساعدة
npm run help

# أوامر Cloudflare
npx wrangler pages --help

# أدلة أخرى
cat DEPLOYMENT-GUIDE.md
cat QUICK-DEPLOY.md
```

---

## 🚀 **جاهز؟**

**الخطوة الأولى:**
```
افتح تبويب Deploy وأضف Cloudflare API Token
```

**ثم:**
```bash
./deploy.sh
```

**🎯 انطلق!**
