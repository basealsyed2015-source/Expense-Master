/**
 * نظام التحكم بعرض القوائم حسب الصلاحيات
 * يُستخدم لإخفاء/إظهار عناصر القائمة بناءً على دور المستخدم
 */

// خريطة الصلاحيات لكل صفحة
const PAGE_PERMISSIONS = {
  '/admin/dashboard': ['dashboard_view'],
  '/admin/customers': ['customers_view'],
  '/admin/requests': ['financing_requests_view'],
  '/admin/reports': ['reports_view'],
  '/admin/rates': ['bank_financing_rates_view'],
  '/admin/payments': ['payments_view'],
  '/admin/banks': ['banks_view'],
  '/admin/subscriptions': ['subscriptions_view'],
  '/admin/packages': ['packages_view'],
  '/admin/company-rates': ['companies_view'],
  '/admin/settings': ['system_settings_view'],
  '/admin/hr': ['employees_view'],
  '/admin/users': ['users_view'],
  '/admin/roles': ['roles_view', 'permissions_view'],
  '/admin/tenants': ['tenants_view'],
  '/admin/tenant-calculators': ['tenants_view'],
  '/admin/saas-settings': ['system_settings_view'],
  '/admin/notifications': ['notifications_view'],
  '/calculator': [] // متاح للجميع
};

// الصفحات المتاحة حسب الدور
const ROLE_PAGES = {
  // مدير النظام SaaS (Role ID: 11) - جميع الصفحات
  11: [
    '/admin/dashboard',
    '/admin/customers',
    '/admin/requests',
    '/admin/reports',
    '/admin/rates',
    '/admin/payments',
    '/admin/banks',
    '/admin/subscriptions',
    '/admin/packages',
    '/admin/users',
    '/admin/roles',
    '/admin/hr',
    '/admin/notifications',
    '/calculator',
    '/admin/tenants',
    '/admin/tenant-calculators',
    '/admin/saas-settings',
    '/admin/settings'
  ],
  
  // مدير شركة (Role ID: 12) - إدارة شركته فقط
  12: [
    '/admin/dashboard',
    '/admin/customers',
    '/admin/requests',
    '/admin/reports',
    '/admin/rates',
    '/admin/payments',
    '/admin/banks',
    '/admin/subscriptions',
    '/admin/packages',
    '/admin/users',
    '/admin/hr',
    '/admin/notifications',
    '/calculator',
    '/admin/settings'
  ],
  
  // مشرف موظفين (Role ID: 13) - الموارد البشرية
  13: [
    '/admin/dashboard',
    '/admin/hr',
    '/admin/notifications',
    '/calculator',
    '/admin/reports'
  ],
  
  // موظف (Role ID: 14) - محدود
  14: [
    '/admin/dashboard',
    '/admin/customers',
    '/admin/requests',
    '/calculator',
    '/admin/notifications'
  ]
};

/**
 * تصفية القوائم حسب صلاحيات المستخدم
 */
function filterMenuByRole(roleId) {
  console.log('🔐 تصفية القائمة للدور:', roleId);
  
  // إذا لم يُحدد الدور، إخفاء جميع الروابط الإدارية
  if (!roleId) {
    console.warn('⚠️ لا يوجد دور محدد، إخفاء القوائم الإدارية');
    hideAllAdminLinks();
    return;
  }
  
  // الحصول على الصفحات المتاحة للدور
  const allowedPages = ROLE_PAGES[roleId] || [];
  console.log('✅ الصفحات المتاحة:', allowedPages.length);
  
  // إخفاء جميع الروابط أولاً
  const allLinks = document.querySelectorAll('#mobile-menu a[href^="/admin"]');
  allLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    // إذا كانت الصفحة مسموحة، إظهارها
    if (allowedPages.includes(href)) {
      link.style.display = 'flex';
      link.classList.remove('hidden');
    } else {
      link.style.display = 'none';
      link.classList.add('hidden');
    }
  });
  
  // إظهار روابط الحاسبة دائماً
  const calculatorLinks = document.querySelectorAll('a[href="/calculator"], a[href^="/c/"]');
  calculatorLinks.forEach(link => {
    link.style.display = 'flex';
    link.classList.remove('hidden');
  });
  
  // عرض الإحصائيات
  const visibleLinks = document.querySelectorAll('#mobile-menu a[href^="/admin"]:not(.hidden)');
  console.log(`📊 عدد الروابط المرئية: ${visibleLinks.length}/${allLinks.length}`);
}

/**
 * إخفاء جميع الروابط الإدارية
 */
function hideAllAdminLinks() {
  const allLinks = document.querySelectorAll('#mobile-menu a[href^="/admin"]');
  allLinks.forEach(link => {
    link.style.display = 'none';
    link.classList.add('hidden');
  });
}

/**
 * تحميل معلومات المستخدم وتطبيق الصلاحيات
 */
async function initMenuPermissions() {
  try {
    console.log('🔄 تحميل معلومات المستخدم...');
    
    // محاولة الحصول على role_id من localStorage
    let roleId = localStorage.getItem('user_role_id');
    
    // إذا لم يكن موجوداً، جلبه من API
    if (!roleId) {
      const response = await fetch('/api/user-info');
      if (response.ok) {
        const userData = await response.json();
        roleId = userData.role_id;
        
        // حفظ في localStorage
        if (roleId) {
          localStorage.setItem('user_role_id', roleId);
          localStorage.setItem('user_name', userData.full_name);
          localStorage.setItem('user_email', userData.email);
        }
      }
    }
    
    // تطبيق التصفية
    if (roleId) {
      filterMenuByRole(parseInt(roleId));
    } else {
      console.warn('⚠️ لم يتم العثور على معلومات المستخدم');
      hideAllAdminLinks();
    }
    
  } catch (error) {
    console.error('❌ خطأ في تحميل الصلاحيات:', error);
    hideAllAdminLinks();
  }
}

// تشغيل عند تحميل الصفحة
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMenuPermissions);
} else {
  initMenuPermissions();
}

// إضافة إلى window للاستخدام العالمي
window.filterMenuByRole = filterMenuByRole;
window.initMenuPermissions = initMenuPermissions;
