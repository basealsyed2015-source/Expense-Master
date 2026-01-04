#!/bin/bash

# سكريبت النشر المُحدّث لـ tamweel-calc-prod

set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# اسم المشروع الصحيح
PROJECT_NAME="tamweel-calc-prod"
BRANCH="main"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}   نشر tamweel-calc-prod${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# التحقق من wrangler auth
echo -e "${YELLOW}🔐 التحقق من Cloudflare Auth...${NC}"
if npx wrangler whoami 2>&1 | grep -q "not authenticated"; then
    echo -e "${RED}❌ خطأ: Cloudflare API Token غير موجود${NC}"
    echo -e "${YELLOW}الحل:${NC}"
    echo -e "  1. افتح: https://dash.cloudflare.com/profile/api-tokens"
    echo -e "  2. أنشئ Token جديد (Edit Cloudflare Workers)"
    echo -e "  3. أضفه في تبويب Deploy في GenSpark"
    echo -e "  4. ثم أعد تشغيل السكريبت"
    exit 1
fi
echo -e "${GREEN}✅ مُصادق عليه${NC}"
echo ""

# البناء
echo -e "${YELLOW}🔨 بناء المشروع...${NC}"
npm run build
echo -e "${GREEN}✅ البناء ناجح${NC}"
echo ""

# النشر
echo -e "${YELLOW}☁️  النشر على Cloudflare Pages...${NC}"
npx wrangler pages deploy dist --project-name $PROJECT_NAME --branch $BRANCH

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}✅ تم النشر بنجاح!${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${GREEN}🌍 الروابط:${NC}"
echo -e "   Production: https://$PROJECT_NAME.pages.dev"
echo -e "   Dashboard:  https://dash.cloudflare.com/"
echo ""
