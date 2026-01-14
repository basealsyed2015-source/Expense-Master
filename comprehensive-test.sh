#!/bin/bash

echo "=========================================="
echo "🧪 اختبار شامل لنظام Multi-Tenancy"
echo "=========================================="
echo ""

echo "1️⃣ اختبار بيانات الشركات:"
npx wrangler d1 execute tamweel-production --local --command="
SELECT 
  t.id,
  t.company_name,
  COUNT(DISTINCT c.id) as customers,
  COUNT(DISTINCT b.id) as banks,
  COUNT(DISTINCT fr.id) as requests,
  COUNT(DISTINCT u.id) as users
FROM tenants t
LEFT JOIN customers c ON t.id = c.tenant_id
LEFT JOIN banks b ON t.id = b.tenant_id
LEFT JOIN financing_requests fr ON t.id = fr.tenant_id
LEFT JOIN users u ON t.id = u.tenant_id
WHERE t.id >= 2
GROUP BY t.id, t.company_name
ORDER BY t.id
" 2>&1 | grep -A50 "results"

echo ""
echo "2️⃣ اختبار الطلبات حسب الحالة:"
npx wrangler d1 execute tamweel-production --local --command="
SELECT 
  t.company_name,
  fr.status,
  COUNT(fr.id) as count,
  SUM(fr.requested_amount) as total_amount
FROM financing_requests fr
JOIN tenants t ON fr.tenant_id = t.id
WHERE t.id >= 2
GROUP BY t.company_name, fr.status
ORDER BY t.id, fr.status
" 2>&1 | grep -A30 "results"

echo ""
echo "3️⃣ اختبار APIs:"
echo "- API معلومات المستخدم:"
curl -s http://localhost:3000/api/user-info | python3 -m json.tool | head -10

echo ""
echo "4️⃣ اختبار الصفحات:"
echo "- صفحة التقارير:"
curl -s http://localhost:3000/admin/company-reports | grep -o "<title>.*</title>" | head -1

echo "- الحاسبة للشركة الأولى:"
curl -s http://localhost:3000/c/tamweel-1/calculator | grep "TENANT_NAME" | head -1

echo ""
echo "=========================================="
echo "✅ اكتمل الاختبار الشامل"
echo "=========================================="
