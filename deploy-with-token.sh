#!/bin/bash

# سكريبت النشر باستخدام Token يدوياً

echo "🚀 النشر على tamweel-calc-prod..."
echo ""

# اطلب Token من المستخدم (إذا لم يكن موجوداً)
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "⚠️  لم يتم العثور على CLOUDFLARE_API_TOKEN"
    echo ""
    echo "الرجاء تنفيذ:"
    echo "  export CLOUDFLARE_API_TOKEN='your-token-here'"
    echo ""
    echo "أو أضف الـ Token في تبويب Deploy في GenSpark"
    exit 1
fi

# بناء
echo "🔨 بناء المشروع..."
cd /home/user/webapp
npm run build

# نشر
echo ""
echo "☁️  النشر..."
npx wrangler pages deploy dist \
  --project-name tamweel-calc-prod \
  --branch main

echo ""
echo "✅ تم النشر بنجاح!"
echo "🌍 الموقع: https://tamweel-calc-prod.pages.dev"
