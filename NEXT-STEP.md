# ✅ الخطوة التالية - النشر على tamweel-calc-prod

## 📌 الوضع الحالي

- ✅ **المشروع الصحيح**: tamweel-calc-prod (الأحدث، منذ يومين)
- ❌ **مشاريع قديمة**: 5 مشاريع قديمة (يمكن حذفها)
- ✅ **الكود على GitHub**: محدث
- ✅ **البناء**: جاهز
- ❌ **API Token**: يجب إضافته

---

## 🎯 **خطوة واحدة فقط: أضف API Token**

### **1. افتح Cloudflare**
```
https://dash.cloudflare.com/profile/api-tokens
```

### **2. أنشئ Token**
- اضغط **"Create Token"**
- اختر **"Edit Cloudflare Workers"**
- انسخ الـ Token

### **3. أضفه في GenSpark**
- تبويب **"Deploy"** ← **"Cloudflare API Key"** ← الصق ← حفظ

---

## 🚀 **النشر (اختر طريقة)**

### **الطريقة 1: سكريبت محدث ⭐**
```bash
cd /home/user/webapp
./deploy-prod.sh
```

### **الطريقة 2: npm**
```bash
npm run deploy:prod
```

### **الطريقة 3: يدوي**
```bash
npx wrangler pages deploy dist --project-name tamweel-calc-prod --branch main
```

---

## 🌍 **بعد النشر**

الرابط:
```
https://tamweel-calc-prod.pages.dev
```

Dashboard:
```
https://dash.cloudflare.com/
→ Workers & Pages
→ tamweel-calc-prod
```

---

## 🧹 **تنظيف (اختياري)**

يمكنك حذف المشاريع القديمة:
- tamweel-producti...
- tamweel-calc-3
- tamweel-calc-2
- tamweel-calc
- orange-lake-2932

**من:**
```
https://dash.cloudflare.com/
→ Workers & Pages
→ اضغط على ... → Delete
```

---

## 🎉 **جاهز!**

**خطوة واحدة:**
```
أضف API Token في تبويب Deploy
```

**ثم:**
```bash
./deploy-prod.sh
```

**🚀 انطلق!**
