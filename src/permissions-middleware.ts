// Middleware للتحقق من الصلاحيات
export const checkPermission = (permissionName: string) => {
  return async (c: any, next: any) => {
    try {
      // الحصول على معلومات المستخدم من التوكن أو الجلسة
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader) {
        return c.json({ success: false, error: 'غير مصرح' }, 401);
      }
      
      // استخراج user_id من التوكن (مبسّط للتجربة)
      const userId = c.req.header('X-User-Id') || 1;
      
      // التحقق من وجود الصلاحية
      const result = await c.env.DB.prepare(`
        SELECT COUNT(*) as has_permission 
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        INNER JOIN users u ON u.role_id = rp.role_id
        WHERE u.id = ? AND p.name = ?
      `).bind(userId, permissionName).first();
      
      if (!result || result.has_permission === 0) {
        return c.json({ 
          success: false, 
          error: 'ليس لديك صلاحية للقيام بهذا الإجراء',
          required_permission: permissionName
        }, 403);
      }
      
      // تمرير المستخدم للطلب التالي
      c.set('userId', userId);
      await next();
      
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  };
};

// دالة مساعدة للتحقق من صلاحيات متعددة
export const checkAnyPermission = (permissions: string[]) => {
  return async (c: any, next: any) => {
    try {
      const userId = c.req.header('X-User-Id') || 1;
      
      const placeholders = permissions.map(() => '?').join(',');
      const result = await c.env.DB.prepare(\`
        SELECT COUNT(*) as has_permission 
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        INNER JOIN users u ON u.role_id = rp.role_id
        WHERE u.id = ? AND p.name IN (\${placeholders})
      \`).bind(userId, ...permissions).first();
      
      if (!result || result.has_permission === 0) {
        return c.json({ 
          success: false, 
          error: 'ليس لديك صلاحية للقيام بهذا الإجراء',
          required_permissions: permissions
        }, 403);
      }
      
      c.set('userId', userId);
      await next();
      
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  };
};

// دالة للحصول على جميع صلاحيات المستخدم
export async function getUserPermissions(db: D1Database, userId: number) {
  const result = await db.prepare(\`
    SELECT p.name, p.display_name, p.category 
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    INNER JOIN users u ON u.role_id = rp.role_id
    WHERE u.id = ?
    ORDER BY p.category, p.name
  \`).bind(userId).all();
  
  return result.results || [];
}

// دالة للتحقق من صلاحية واحدة
export async function hasPermission(db: D1Database, userId: number, permissionName: string) {
  const result = await db.prepare(\`
    SELECT COUNT(*) as has_permission 
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    INNER JOIN users u ON u.role_id = rp.role_id
    WHERE u.id = ? AND p.name = ?
  \`).bind(userId, permissionName).first();
  
  return result && result.has_permission > 0;
}
