#!/bin/bash

echo "=========================================="
echo "اختبار نظام Multi-Tenancy"
echo "=========================================="
echo ""

echo "1️⃣ اختبار الشركات المسجلة:"
curl -s http://localhost:3000/api/tenants | python3 -m json.tool | grep -E "company_name|slug|tenant_id" | head -20

echo ""
echo "2️⃣ اختبار توزيع البيانات حسب الشركات:"
npx wrangler d1 execute tamweel-production --local --command="
SELECT 
  t.company_name,
  COUNT(DISTINCT b.id) as بنوك,
  COUNT(DISTINCT c.id) as عملاء,
  COUNT(DISTINCT bfr.id) as نسب_تمويل
FROM tenants t
LEFT JOIN banks b ON t.id = b.tenant_id
LEFT JOIN customers c ON t.id = c.tenant_id
LEFT JOIN bank_financing_rates bfr ON t.id = bfr.tenant_id
WHERE t.id >= 2
GROUP BY t.id, t.company_name
ORDER BY t.id
" 2>&1 | grep -A30 "results"

echo ""
echo "3️⃣ اختبار الحاسبة للشركة الأولى:"
curl -s "http://localhost:3000/c/tamweel-1/calculator" | grep "TENANT_NAME" | head -1

echo ""
echo "4️⃣ اختبار الحاسبة للشركة الثانية:"
curl -s "http://localhost:3000/c/tamweel-2/calculator" | grep "TENANT_NAME" | head -1

echo ""
echo "5️⃣ اختبار الحاسبة للشركة الثالثة:"
curl -s "http://localhost:3000/c/tamweel-3/calculator" | grep "TENANT_NAME" | head -1

echo ""
echo "=========================================="
echo "✅ اكتمل الاختبار"
echo "=========================================="
