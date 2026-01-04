#!/bin/bash

# 🚀 النشر المباشر باستخدام Token

echo "🚀 بدء عملية النشر إلى Cloudflare Pages..."
echo ""

# تعيين Token
export CLOUDFLARE_API_TOKEN="F3Grpt9G_ughAQQR0tySYaQYo_ehx-am_91Zy8FD"

# التحقق من Token
echo "1️⃣ التحقق من صحة Token..."
npx wrangler whoami
if [ $? -ne 0 ]; then
    echo "❌ فشل التحقق من Token"
    exit 1
fi
echo "✅ Token صحيح"
echo ""

# البناء
echo "2️⃣ بناء المشروع..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ فشل البناء"
    exit 1
fi
echo "✅ تم البناء بنجاح"
echo ""

# النشر
echo "3️⃣ النشر إلى Cloudflare Pages..."
npx wrangler pages deploy dist \
  --project-name tamweel-calc-prod \
  --branch main \
  --commit-dirty=true

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ═══════════════════════════════════════"
    echo "🎉 تم النشر بنجاح!"
    echo "🎉 ═══════════════════════════════════════"
    echo ""
    echo "📍 Production URL:"
    echo "   https://tamweel-calc-prod.pages.dev"
    echo ""
    echo "📍 Cloudflare Dashboard:"
    echo "   https://dash.cloudflare.com/"
    echo ""
    echo "✅ المشروع متاح الآن على الإنترنت!"
else
    echo ""
    echo "❌ فشل النشر"
    echo "تحقق من الأخطاء أعلاه"
    exit 1
fi
