# 🌐 ربط Domain المخصص: tamweel-calc.com

## 📋 الخطوات الكاملة لربط Domain

---

## ✅ **المتطلبات:**

1. ✅ Domain: `tamweel-calc.com` (موجود)
2. ✅ Cloudflare Project: `tamweel-calc-prod` (موجود)
3. ✅ Account ID: `946716fe2e725173ff521f80abd41e9e`

---

## 🎯 **الطريقة 1: من Cloudflare Dashboard (موصى بها)**

### **الخطوة 1: أضف Domain إلى Cloudflare**

#### **إذا كان Domain في Cloudflare بالفعل:**
✅ انتقل مباشرة للخطوة 2

#### **إذا لم يكن Domain في Cloudflare:**

1. **افتح Cloudflare Dashboard:**
   ```
   https://dash.cloudflare.com/
   ```

2. **أضف الموقع:**
   - اضغط **"Add site"**
   - أدخل: `tamweel-calc.com`
   - اختر الخطة (Free أو Pro)
   - اضغط **"Add site"**

3. **تحديث Nameservers:**
   
   Cloudflare سيعطيك Nameservers مثل:
   ```
   henry.ns.cloudflare.com
   vera.ns.cloudflare.com
   ```

4. **اذهب إلى مزود Domain الخاص بك:**
   - GoDaddy / Namecheap / أي مزود آخر
   - ابحث عن **"Nameservers"** أو **"DNS Settings"**
   - غيّر Nameservers إلى Cloudflare Nameservers
   - احفظ التغييرات

5. **انتظر التفعيل:**
   - يستغرق من 5 دقائق إلى 24 ساعة
   - ستصلك رسالة بريد إلكتروني عند التفعيل

---

### **الخطوة 2: ربط Domain بـ Cloudflare Pages**

1. **افتح صفحة المشروع:**
   ```
   https://dash.cloudflare.com/946716fe2e725173ff521f80abd41e9e/pages/view/tamweel-calc-prod
   ```

2. **اذهب إلى Domains:**
   - اضغط تبويب **"Custom domains"**

3. **أضف Domain:**
   - اضغط **"Set up a custom domain"**
   - أدخل: `tamweel-calc.com`
   - اضغط **"Continue"**

4. **أضف www أيضاً (اختياري):**
   - كرر العملية لـ `www.tamweel-calc.com`

5. **انتظر DNS Configuration:**
   - Cloudflare سيضبط DNS تلقائياً
   - يستغرق 1-5 دقائق

6. **تفعيل SSL:**
   - ✅ تلقائي! Cloudflare يوفر SSL مجاني
   - ✅ HTTPS سيعمل تلقائياً

---

## 🚀 **الطريقة 2: من Terminal (متقدمة)**

### **باستخدام Wrangler CLI:**

```bash
# تعيين المتغيرات
export CLOUDFLARE_API_TOKEN="F3Grpt9G_ughAQQR0tySYaQYo_ehx-am_91Zy8FD"
export CLOUDFLARE_ACCOUNT_ID="946716fe2e725173ff521f80abd41e9e"

# إضافة Domain
npx wrangler pages domain add tamweel-calc.com \
  --project-name tamweel-calc-prod

# إضافة www
npx wrangler pages domain add www.tamweel-calc.com \
  --project-name tamweel-calc-prod

# عرض جميع Domains المرتبطة
npx wrangler pages domain list \
  --project-name tamweel-calc-prod
```

---

## 📊 **التحقق من الإعدادات:**

### **1. تحقق من DNS Records:**

```bash
# تحقق من A Record
dig tamweel-calc.com

# تحقق من CNAME
dig www.tamweel-calc.com
```

**النتيجة المتوقعة:**
```
tamweel-calc.com → CNAME → tamweel-calc-prod.pages.dev
www.tamweel-calc.com → CNAME → tamweel-calc-prod.pages.dev
```

---

### **2. تحقق من الموقع:**

```bash
# HTTP
curl -I http://tamweel-calc.com

# HTTPS (بعد تفعيل SSL)
curl -I https://tamweel-calc.com
```

---

## ⚙️ **إعدادات DNS المطلوبة:**

إذا كنت تضبط DNS يدوياً:

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| CNAME | @ | tamweel-calc-prod.pages.dev | Proxied (🟠) | Auto |
| CNAME | www | tamweel-calc-prod.pages.dev | Proxied (🟠) | Auto |

**مهم:**
- ✅ استخدم **Proxied** (البرتقالي ☁️) وليس **DNS only** (الرمادي)
- ✅ هذا يفعّل CDN و SSL و DDoS Protection

---

## 🔐 **SSL/TLS Settings:**

1. **افتح SSL/TLS Settings:**
   ```
   https://dash.cloudflare.com/946716fe2e725173ff521f80abd41e9e/ssl-tls
   ```

2. **اختر "Full" أو "Full (strict)":**
   ```
   Full (strict) ← موصى به
   ```

3. **تفعيل "Always Use HTTPS":**
   - اذهب إلى: Edge Certificates
   - شغّل **"Always Use HTTPS"**

---

## 🎯 **بعد الربط - اختبار الموقع:**

### **روابط الاختبار:**

```
✅ https://tamweel-calc.com
✅ https://www.tamweel-calc.com
✅ http://tamweel-calc.com (سيحوّل تلقائياً إلى HTTPS)
```

### **الصفحات:**

```
https://tamweel-calc.com/login
https://tamweel-calc.com/admin/dashboard
https://tamweel-calc.com/admin/hr
https://tamweel-calc.com/calculator
```

---

## 📝 **Checklist:**

```
□ Domain في Cloudflare
□ Nameservers محدّثة (إن لزم)
□ Custom domain مضاف للمشروع
□ DNS Records صحيحة (CNAME)
□ SSL/TLS مفعّل
□ Always Use HTTPS مفعّل
□ www Domain مضاف (اختياري)
□ اختبار الموقع نجح
```

---

## 🐛 **حل المشاكل الشائعة:**

### **مشكلة 1: "Domain not found"**
```
الحل:
- تأكد أن Domain في Cloudflare
- انتظر تفعيل Nameservers (حتى 24 ساعة)
```

### **مشكلة 2: "SSL Error"**
```
الحل:
- انتظر 5-15 دقيقة لتفعيل SSL
- تحقق من SSL/TLS Mode (اختر Full)
- امسح Cache المتصفح
```

### **مشكلة 3: "DNS_PROBE_FINISHED_NXDOMAIN"**
```
الحل:
- تحقق من DNS Records
- انتظر DNS Propagation (حتى 24 ساعة)
- استخدم: dig tamweel-calc.com
```

### **مشكلة 4: "Too Many Redirects"**
```
الحل:
- غيّر SSL/TLS Mode إلى "Full (strict)"
- امسح Cookies و Cache
```

---

## ⏱️ **الأوقات المتوقعة:**

| العملية | الوقت |
|---------|-------|
| إضافة Domain لـ Pages | 1-5 دقائق |
| DNS Propagation | 5 دقائق - 24 ساعة |
| تفعيل SSL | 5-15 دقيقة |
| Nameservers Update | 1-24 ساعة |

---

## 🔗 **روابط مفيدة:**

```
Cloudflare Dashboard:
https://dash.cloudflare.com/946716fe2e725173ff521f80abd41e9e

Project Settings:
https://dash.cloudflare.com/946716fe2e725173ff521f80abd41e9e/pages/view/tamweel-calc-prod/settings

DNS Settings:
https://dash.cloudflare.com/946716fe2e725173ff521f80abd41e9e/dns

SSL/TLS Settings:
https://dash.cloudflare.com/946716fe2e725173ff521f80abd41e9e/ssl-tls
```

---

## 🎉 **بعد الانتهاء:**

موقعك سيكون متاحاً على:

```
🌍 https://tamweel-calc.com
🌍 https://www.tamweel-calc.com
🌍 https://dde8beca.tamweel-calc.pages.dev (Cloudflare subdomain)
```

---

## 📞 **هل تحتاج مساعدة؟**

أخبرني في أي خطوة أنت:

1. **"Domain في Cloudflare بالفعل"** ← سننتقل للخطوة 2
2. **"أحتاج إضافة Domain لـ Cloudflare"** ← سأرشدك بالتفصيل
3. **"Domain مضاف لكن لا يعمل"** ← سنحل المشكلة

---

**🚀 جاهز للبدء؟ أخبرني بالخطوة الحالية!**
