## ملخص التغييرات المطلوبة لإصلاح صلاحيات مدير الشركة

### المشكلة الحالية:
1. Dashboard يعرض **جميع البيانات** بدون تصفية حسب `tenant_id`
2. مدير الشركة يرى بيانات **جميع الشركات** وليس شركته فقط
3. لا يوجد tenant isolation في الاستعلامات

### الحل المطلوب:

#### 1. إضافة tenant_id filtering في Dashboard (السطر 5313):

**الاستعلامات التي تحتاج تعديل:**

```sql
-- قبل (يعرض كل شيء):
SELECT COUNT(*) FROM customers

-- بعد (يعرض شركة المستخدم فقط):
SELECT COUNT(*) FROM customers WHERE tenant_id = ?
```

**جميع الاستعلامات المطلوب تعديلها:**
- Line 5318: `FROM customers` → `FROM customers WHERE tenant_id = ?`
- Line 5319: `FROM financing_requests` → `FROM financing_requests WHERE tenant_id = ?`
- Line 5320-5323: جميع طلبات التمويل تحتاج `WHERE tenant_id = ?`
- Line 5336: `FROM financing_requests` → `FROM financing_requests WHERE tenant_id = ?`
- Line 5349: `FROM financing_requests fr` → `FROM financing_requests fr WHERE fr.tenant_id = ?`
- Line 5362: `FROM financing_requests` → `FROM financing_requests WHERE tenant_id = ?`

#### 2. إضافة getUserTenant function:

```typescript
async function getUserTenant(c: any): Promise<number | null> {
  // Get from Authorization token
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (!token) return null
  
  try {
    const decoded = atob(token)
    const parts = decoded.split(':')
    const userId = parseInt(parts[0])
    
    // Get user's tenant_id from database
    const user = await c.env.DB.prepare(`
      SELECT tenant_id FROM users WHERE id = ?
    `).bind(userId).first()
    
    return user?.tenant_id || null
  } catch {
    return null
  }
}
```

#### 3. تطبيق الفلترة في Dashboard:

```typescript
app.get('/admin/dashboard', async (c) => {
  const tenantId = await getUserTenant(c)
  
  // إذا كان مدير شركة، فقط بياناته
  // إذا كان Super Admin، كل البيانات
  
  const whereClause = tenantId ? `WHERE tenant_id = ?` : ''
  const bindParams = tenantId ? [tenantId] : []
  
  const stats = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM customers ${whereClause}) as total_customers,
      (SELECT COUNT(*) FROM financing_requests ${whereClause}) as total_requests,
      ...
  `).bind(...bindParams).first()
  
  // ... باقي الكود
})
```

#### 4. صفحات أخرى تحتاج نفس الإصلاح:
- `/admin/customers` (Line ~6800)
- `/admin/requests` (Line ~7841)
- `/admin/banks` (Line ~10000)
- `/admin/users` (Line ~11500)

### الأولوية:
1. ✅ **تم:** إضافة Role 4 (مدير شركة) ✓
2. ✅ **تم:** منح الصلاحيات الكاملة لـ Role 4 ✓
3. ⏳ **مطلوب:** إضافة tenant filtering في Dashboard
4. ⏳ **مطلوب:** إضافة tenant filtering في باقي الصفحات

### ملاحظة:
هذا التعديل **ضخم جداً** (يتطلب تعديل 50+ استعلام SQL).
يُفضل عمله على **خطوات** أو استخدام **middleware** عام لفلترة tenant_id تلقائياً.
