#!/bin/bash

# سكريبت النشر التلقائي لحاسبة التمويل
# Automated Deployment Script for Tamweel Calculator

set -e  # إيقاف السكريبت عند أي خطأ

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# اسم المشروع
PROJECT_NAME="tamweel-calc"
BRANCH="main"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}   سكريبت النشر التلقائي${NC}"
echo -e "${BLUE}   Tamweel Calculator Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# التحقق من المجلد الحالي
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ خطأ: يجب تشغيل السكريبت من مجلد المشروع${NC}"
    exit 1
fi

# الخطوة 1: التحقق من التغييرات
echo -e "${YELLOW}📋 الخطوة 1/6: التحقق من التغييرات...${NC}"
if [[ -z $(git status -s) ]]; then
    echo -e "${GREEN}✅ لا توجد تغييرات جديدة${NC}"
    read -p "هل تريد المتابعة للنشر على Cloudflare؟ (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}تم الإلغاء${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✅ يوجد تغييرات جديدة${NC}"
    git status -s
fi
echo ""

# الخطوة 2: Git Add
if [[ ! -z $(git status -s) ]]; then
    echo -e "${YELLOW}📦 الخطوة 2/6: إضافة التغييرات...${NC}"
    git add .
    echo -e "${GREEN}✅ تم إضافة جميع التغييرات${NC}"
    echo ""
fi

# الخطوة 3: Git Commit
if [[ ! -z $(git status -s) ]]; then
    echo -e "${YELLOW}💬 الخطوة 3/6: إنشاء Commit...${NC}"
    
    # اطلب رسالة الـ commit
    read -p "أدخل رسالة الـ commit (أو اضغط Enter للرسالة الافتراضية): " COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="تحديث: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✅ تم إنشاء الـ commit: $COMMIT_MSG${NC}"
    echo ""
fi

# الخطوة 4: Git Push
echo -e "${YELLOW}🚀 الخطوة 4/6: دفع التحديثات إلى GitHub...${NC}"
git push origin $BRANCH
echo -e "${GREEN}✅ تم دفع التحديثات إلى GitHub${NC}"
echo ""

# الخطوة 5: البناء
echo -e "${YELLOW}🔨 الخطوة 5/6: بناء المشروع...${NC}"
npm run build
echo -e "${GREEN}✅ تم بناء المشروع بنجاح${NC}"
echo ""

# الخطوة 6: النشر على Cloudflare
echo -e "${YELLOW}☁️  الخطوة 6/6: النشر على Cloudflare Pages...${NC}"
npx wrangler pages deploy dist --project-name $PROJECT_NAME --branch $BRANCH

echo ""
echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}✅ تم النشر بنجاح!${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${GREEN}🌍 الروابط:${NC}"
echo -e "   Production: https://$PROJECT_NAME.pages.dev"
echo -e "   Branch:     https://$BRANCH.$PROJECT_NAME.pages.dev"
echo -e "   GitHub:     https://github.com/basealsyed2015-source/Expense-Master"
echo ""
echo -e "${YELLOW}📊 للمراقبة:${NC}"
echo -e "   Dashboard:  https://dash.cloudflare.com/"
echo -e "   Logs:       npx wrangler pages deployment tail --project-name $PROJECT_NAME"
echo ""
