# دليل النشر - GitHub و Cloudflare Pages

هذا الدليل الشامل لتحديث ونشر تطبيق **حاسبة التمويل** على GitHub و Cloudflare Pages.

---

## 📋 **المتطلبات الأساسية**

### ✅ **1. حساب GitHub**
- المستودع: https://github.com/basealsyed2015-source/Expense-Master
- الفرع الرئيسي: `main`
- الفرع التطويري: `genspark_ai_developer`

### ✅ **2. حساب Cloudflare**
- يجب أن يكون لديك حساب على Cloudflare
- مفتاح API بالصلاحيات المناسبة

---

## 🔧 **الإعداد الأولي**

### **الخطوة 1: إعداد مفتاح Cloudflare API**

#### 1. تسجيل الدخول إلى Cloudflare
```
https://dash.cloudflare.com/
```

#### 2. إنشاء API Token جديد
1. اذهب إلى: **My Profile** → **API Tokens**
2. اضغط على **Create Token**
3. استخدم قالب **Edit Cloudflare Workers** أو أنشئ Custom Token

#### 3. الصلاحيات المطلوبة
```
Account:
  - Account Settings: Read
  - Cloudflare Pages: Edit

Zone:
  - Workers Routes: Edit (اختياري)
```

#### 4. حفظ المفتاح
- انسخ المفتاح (سيظهر مرة واحدة فقط!)
- احفظه في مكان آمن

#### 5. إضافة المفتاح في GenSpark
1. اذهب إلى تبويب **Deploy** في الشريط الجانبي
2. ابحث عن **Cloudflare API Key**
3. الصق المفتاح واحفظه

---

## 🚀 **النشر على GitHub**

### **الطريقة 1: من السطر (Terminal)**

#### 1. التحقق من الحالة
```bash
cd /home/user/webapp
git status
```

#### 2. إضافة التغييرات
```bash
git add .
```

#### 3. إنشاء Commit
```bash
git commit -m "وصف التحديث"
```

#### 4. دفع التحديثات
```bash
# إلى الفرع الحالي
git push origin main

# أو إلى فرع آخر
git push origin genspark_ai_developer
```

### **الطريقة 2: باستخدام الدليل المرجعي**

```bash
# جميع الأوامر في خطوة واحدة
cd /home/user/webapp && \
git add . && \
git commit -m "تحديث: وصف التحديثات" && \
git push origin main
```

---

## ☁️ **النشر على Cloudflare Pages**

### **الخطوة 1: التحقق من wrangler.jsonc**

تأكد من أن ملف `wrangler.jsonc` يحتوي على:
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "tamweel-calc",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"]
}
```

### **الخطوة 2: بناء المشروع**

```bash
cd /home/user/webapp
npm run build
```

**النتيجة المتوقعة:**
```
✓ 56 modules transformed.
dist/_worker.js  1,476.82 kB
✓ built in 1.56s
```

### **الخطوة 3: إنشاء مشروع Cloudflare Pages (أول مرة فقط)**

```bash
npx wrangler pages project create tamweel-calc \
  --production-branch main \
  --compatibility-date 2024-01-01
```

### **الخطوة 4: نشر المشروع**

```bash
npx wrangler pages deploy dist --project-name tamweel-calc
```

**ستحصل على URLs:**
```
✨ Deployment complete! Take a peek over at https://random-id.tamweel-calc.pages.dev
🌍 View your site at:
  - https://tamweel-calc.pages.dev (Production)
  - https://main.tamweel-calc.pages.dev (main branch)
```

---

## 🔄 **التحديثات اللاحقة**

### **السيناريو 1: تحديث بسيط (كود فقط)**

```bash
cd /home/user/webapp

# 1. تحديث الكود
# ... قم بتعديل الملفات ...

# 2. Git
git add .
git commit -m "تحديث: [وصف]"
git push origin main

# 3. بناء ونشر
npm run build
npx wrangler pages deploy dist --project-name tamweel-calc
```

### **السيناريو 2: تحديث قاعدة البيانات**

```bash
cd /home/user/webapp

# 1. إنشاء migration جديد
# مثال: migrations/0018_add_new_table.sql

# 2. تطبيق Migration محلياً (للاختبار)
npx wrangler d1 migrations apply tamweel-production --local

# 3. تطبيق Migration على Production
npx wrangler d1 migrations apply tamweel-production

# 4. Git + بناء + نشر
git add .
git commit -m "تحديث قاعدة البيانات: [وصف]"
git push origin main
npm run build
npx wrangler pages deploy dist --project-name tamweel-calc
```

### **السيناريو 3: تحديث متغيرات البيئة (Secrets)**

```bash
# إضافة/تحديث secret
npx wrangler pages secret put API_KEY --project-name tamweel-calc

# عرض قائمة secrets
npx wrangler pages secret list --project-name tamweel-calc

# حذف secret
npx wrangler pages secret delete API_KEY --project-name tamweel-calc
```

---

## 📦 **سكريبتات مفيدة في package.json**

```json
{
  "scripts": {
    "dev": "wrangler pages dev dist --ip 0.0.0.0 --port 3000",
    "build": "vite build",
    "deploy": "npm run build && npx wrangler pages deploy dist --project-name tamweel-calc",
    "deploy:prod": "npm run build && npx wrangler pages deploy dist --project-name tamweel-calc --branch main",
    "git:push": "git add . && git commit -m 'تحديث' && git push origin main",
    "update:full": "npm run git:push && npm run deploy",
    "db:migrate:prod": "npx wrangler d1 migrations apply tamweel-production",
    "db:migrate:local": "npx wrangler d1 migrations apply tamweel-production --local"
  }
}
```

**الاستخدام:**
```bash
# تحديث كامل (Git + بناء + نشر)
npm run update:full

# نشر فقط
npm run deploy

# تطبيق migrations على production
npm run db:migrate:prod
```

---

## 🔍 **التحقق من النشر**

### **1. فحص حالة المشروع**
```bash
npx wrangler pages project list
```

### **2. عرض معلومات النشر**
```bash
npx wrangler pages deployment list --project-name tamweel-calc
```

### **3. اختبار الموقع**
```bash
curl https://tamweel-calc.pages.dev
curl https://tamweel-calc.pages.dev/api/user-info
```

---

## 🐛 **حل المشاكل الشائعة**

### **مشكلة 1: Authentication failed**
```
خطأ: Invalid API key - authentication failed
```

**الحل:**
1. اذهب إلى تبويب **Deploy**
2. احذف المفتاح القديم
3. أنشئ API Token جديد
4. أضف المفتاح الجديد

### **مشكلة 2: Project already exists**
```
خطأ: Project 'tamweel-calc' already exists
```

**الحل:**
```bash
# استخدم النشر مباشرة بدون إنشاء مشروع
npx wrangler pages deploy dist --project-name tamweel-calc
```

### **مشكلة 3: Build failed**
```
خطأ: vite build failed
```

**الحل:**
```bash
# نظف وأعد البناء
rm -rf dist node_modules/.vite
npm run build
```

### **مشكلة 4: D1 Database errors**
```
خطأ: D1_ERROR: no such table
```

**الحل:**
```bash
# تطبيق migrations
npx wrangler d1 migrations apply tamweel-production
```

---

## 📊 **سير العمل الموصى به**

### **التطوير اليومي:**
```bash
# 1. تعديل الكود محلياً
# 2. اختبار محلي
npm run dev

# 3. Commit + Push
git add .
git commit -m "تحديث: [وصف]"
git push origin genspark_ai_developer
```

### **النشر على Production:**
```bash
# 1. دمج التطوير مع main
git checkout main
git merge genspark_ai_developer

# 2. بناء ونشر
npm run build
npx wrangler pages deploy dist --project-name tamweel-calc --branch main

# 3. Push to GitHub
git push origin main
```

---

## 🔐 **الأمان**

### **1. لا تضف أبداً في Git:**
```gitignore
.env
.dev.vars
node_modules/
.wrangler/
wrangler.toml  # إذا كان يحتوي على secrets
```

### **2. استخدم Cloudflare Secrets:**
```bash
# بدلاً من .env
npx wrangler pages secret put DATABASE_URL --project-name tamweel-calc
npx wrangler pages secret put API_KEY --project-name tamweel-calc
```

### **3. استخدم Environment Variables:**
```typescript
// في الكود
const apiKey = c.env.API_KEY  // من Cloudflare Secrets
```

---

## 📈 **المراقبة**

### **1. Cloudflare Dashboard**
```
https://dash.cloudflare.com/
→ Workers & Pages
→ tamweel-calc
```

**يمكنك مشاهدة:**
- عدد الطلبات (Requests)
- الأخطاء (Errors)
- زمن الاستجابة (Response Time)
- استخدام CPU

### **2. Logs في الوقت الفعلي**
```bash
npx wrangler pages deployment tail --project-name tamweel-calc
```

---

## 🎯 **Checklist قبل النشر**

- [ ] تم اختبار الكود محلياً
- [ ] تم تطبيق migrations على قاعدة البيانات
- [ ] تم تحديث package.json (إذا لزم)
- [ ] تم Git commit + push
- [ ] تم تشغيل `npm run build` بنجاح
- [ ] تم فحص حجم dist/_worker.js (< 10MB)
- [ ] تم اختبار البناء محلياً
- [ ] جاهز للنشر! 🚀

---

## 📞 **الدعم والمساعدة**

### **وثائق Cloudflare:**
- https://developers.cloudflare.com/pages/
- https://developers.cloudflare.com/workers/

### **وثائق Wrangler:**
- https://developers.cloudflare.com/workers/wrangler/

### **المجتمع:**
- Cloudflare Discord: https://discord.cloudflare.com/
- GitHub Issues: https://github.com/cloudflare/workers-sdk/issues

---

## ✅ **الخلاصة**

### **تحديث سريع:**
```bash
cd /home/user/webapp
git add . && git commit -m "تحديث" && git push origin main
npm run build && npx wrangler pages deploy dist --project-name tamweel-calc
```

### **تحديث مع قاعدة البيانات:**
```bash
cd /home/user/webapp
npx wrangler d1 migrations apply tamweel-production
git add . && git commit -m "تحديث + DB" && git push origin main
npm run build && npx wrangler pages deploy dist --project-name tamweel-calc
```

**جاهز للنشر! 🎉**
