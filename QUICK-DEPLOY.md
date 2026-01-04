# 🚀 دليل النشر السريع

## ⚡ النشر السريع (3 دقائق)

### 📋 المتطلبات
1. ✅ حساب Cloudflare
2. ✅ API Token من Cloudflare (في تبويب Deploy)
3. ✅ الكود جاهز ومُختبر

---

## 🎯 طريقة النشر

### **الطريقة 1: سكريبت تلقائي (الأسهل) ⭐**

```bash
cd /home/user/webapp
./deploy.sh
```

هذا السكريبت سيقوم بـ:
- ✅ إضافة التغييرات إلى Git
- ✅ إنشاء Commit
- ✅ دفع إلى GitHub
- ✅ بناء المشروع
- ✅ النشر على Cloudflare

---

### **الطريقة 2: أوامر npm (سريعة)**

```bash
cd /home/user/webapp

# نشر كامل (Git + بناء + Cloudflare)
npm run update:full

# أو خطوة بخطوة:
npm run git:push         # دفع إلى GitHub
npm run deploy:prod      # بناء + نشر على Cloudflare
```

---

### **الطريقة 3: يدوياً (تحكم كامل)**

```bash
cd /home/user/webapp

# 1. Git
git add .
git commit -m "تحديث: [الوصف]"
git push origin main

# 2. بناء
npm run build

# 3. نشر
npx wrangler pages deploy dist --project-name tamweel-calc --branch main
```

---

## 📦 أوامر مفيدة

### **Git**
```bash
npm run git:push          # دفع للفرع main
npm run git:push:dev      # دفع للفرع التطويري
```

### **بناء ونشر**
```bash
npm run build            # بناء فقط
npm run deploy           # بناء + نشر
npm run deploy:prod      # نشر production
npm run deploy:dev       # نشر development
```

### **قاعدة البيانات**
```bash
npm run db:migrate:local   # تطبيق migrations محلياً
npm run db:migrate:prod    # تطبيق migrations على production
npm run db:seed            # إضافة بيانات تجريبية
npm run db:reset           # إعادة تعيين قاعدة البيانات
```

### **Cloudflare**
```bash
npm run cf:whoami          # التحقق من الحساب
npm run cf:projects        # عرض المشاريع
npm run cf:deployments     # عرض النشرات
npm run cf:tail            # مراقبة Logs
```

### **تطوير**
```bash
npm run dev:sandbox        # تطوير في sandbox
npm run dev:d1             # تطوير مع D1 database
npm run clean:port         # تنظيف المنفذ 3000
npm run test               # اختبار الخدمة
```

---

## 🔧 إعداد Cloudflare API (أول مرة)

### **خطوات سريعة:**

1. **افتح Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/
   ```

2. **انتقل إلى API Tokens**
   ```
   My Profile → API Tokens → Create Token
   ```

3. **اختر Edit Cloudflare Workers**
   - أو أنشئ Custom Token بهذه الصلاحيات:
     - Account Settings: Read
     - Cloudflare Pages: Edit

4. **انسخ المفتاح** واحفظه

5. **أضف المفتاح في GenSpark**
   - اذهب إلى تبويب **Deploy**
   - الصق المفتاح واحفظ

6. **تحقق من الإعداد**
   ```bash
   npm run cf:whoami
   ```

---

## 🎯 سيناريوهات شائعة

### **سيناريو 1: تحديث كود بسيط**
```bash
./deploy.sh
```
أو
```bash
npm run update:full
```

### **سيناريو 2: تحديث قاعدة بيانات**
```bash
# 1. أنشئ migration: migrations/0018_xxx.sql
# 2. طبق على production
npm run db:migrate:prod
# 3. انشر الكود
npm run deploy:prod
```

### **سيناريو 3: إضافة Secret**
```bash
npx wrangler pages secret put API_KEY --project-name tamweel-calc
# أدخل القيمة عند المطالبة
```

### **سيناريو 4: تحديث سريع للتطوير**
```bash
npm run git:push:dev
npm run deploy:dev
```

---

## 🔍 التحقق من النشر

### **1. افتح الموقع**
```
https://tamweel-calc.pages.dev
```

### **2. اختبر API**
```bash
curl https://tamweel-calc.pages.dev/api/user-info
```

### **3. راقب Logs**
```bash
npm run cf:tail
```

---

## 🐛 حل المشاكل

### **خطأ: Authentication failed**
```bash
# الحل: حدّث API Token في تبويب Deploy
npm run cf:whoami  # للتحقق
```

### **خطأ: Build failed**
```bash
# الحل: نظف وأعد البناء
rm -rf dist node_modules/.vite
npm run build
```

### **خطأ: D1_ERROR**
```bash
# الحل: طبق migrations
npm run db:migrate:prod
```

### **خطأ: Port 3000 in use**
```bash
# الحل: نظف المنفذ
npm run clean:port
```

---

## 📊 مراقبة الخدمة

### **Cloudflare Dashboard**
```
https://dash.cloudflare.com/
→ Workers & Pages
→ tamweel-calc
```

### **GitHub Repository**
```
https://github.com/basealsyed2015-source/Expense-Master
```

---

## ✅ Checklist النشر

- [ ] اختبار محلي ناجح
- [ ] تطبيق migrations (إذا لزم)
- [ ] Git commit + push
- [ ] `npm run build` ناجح
- [ ] حجم dist/_worker.js معقول
- [ ] جاهز للنشر!

---

## 🆘 للمساعدة

```bash
npm run help
```

أو راجع الدليل الشامل:
```
DEPLOYMENT-GUIDE.md
```

---

## 🎉 جاهز للنشر!

**اختر طريقتك المفضلة وانطلق!**

```bash
./deploy.sh
```

🚀 **Happy Deploying!**
