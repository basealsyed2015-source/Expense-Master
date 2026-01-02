// JavaScript Helper للتحقق من الصلاحيات في الواجهة الأمامية
export const permissionsHelper = `
<script>
  // تخزين صلاحيات المستخدم الحالي
  let userPermissions = [];
  let isLoading = true;

  // تحميل صلاحيات المستخدم
  async function loadUserPermissions() {
    try {
      // الحصول على userId من localStorage أو من API
      const userId = localStorage.getItem('userId') || 1;
      
      const response = await axios.get(\`/api/users/\${userId}/permissions\`);
      userPermissions = (response.data.data || []).map(p => p.name);
      
      isLoading = false;
      
      // إخفاء/إظهار العناصر بناءً على الصلاحيات
      applyPermissions();
      
    } catch (error) {
      console.error('Error loading permissions:', error);
      isLoading = false;
    }
  }

  // التحقق من وجود صلاحية
  function hasPermission(permissionName) {
    if (isLoading) return true; // السماح أثناء التحميل
    return userPermissions.includes(permissionName);
  }

  // التحقق من وجود أي صلاحية من قائمة
  function hasAnyPermission(permissionNames) {
    if (isLoading) return true;
    return permissionNames.some(name => userPermissions.includes(name));
  }

  // التحقق من وجود جميع الصلاحيات
  function hasAllPermissions(permissionNames) {
    if (isLoading) return true;
    return permissionNames.every(name => userPermissions.includes(name));
  }

  // تطبيق الصلاحيات على العناصر
  function applyPermissions() {
    // إخفاء العناصر التي تتطلب صلاحية معينة
    document.querySelectorAll('[data-permission]').forEach(element => {
      const requiredPermission = element.getAttribute('data-permission');
      
      if (!hasPermission(requiredPermission)) {
        element.style.display = 'none';
        element.setAttribute('data-hidden-by-permission', 'true');
      }
    });

    // إخفاء العناصر التي تتطلب أي صلاحية من قائمة
    document.querySelectorAll('[data-permission-any]').forEach(element => {
      const requiredPermissions = element.getAttribute('data-permission-any').split(',');
      
      if (!hasAnyPermission(requiredPermissions)) {
        element.style.display = 'none';
        element.setAttribute('data-hidden-by-permission', 'true');
      }
    });

    // إخفاء العناصر التي تتطلب جميع الصلاحيات
    document.querySelectorAll('[data-permission-all]').forEach(element => {
      const requiredPermissions = element.getAttribute('data-permission-all').split(',');
      
      if (!hasAllPermissions(requiredPermissions)) {
        element.style.display = 'none';
        element.setAttribute('data-hidden-by-permission', 'true');
      }
    });

    // تعطيل الأزرار بدلاً من إخفائها
    document.querySelectorAll('[data-permission-disable]').forEach(element => {
      const requiredPermission = element.getAttribute('data-permission-disable');
      
      if (!hasPermission(requiredPermission)) {
        element.setAttribute('disabled', 'true');
        element.classList.add('opacity-50', 'cursor-not-allowed');
        element.title = 'ليس لديك صلاحية لهذا الإجراء';
      }
    });
  }

  // دالة للتحقق من الصلاحية قبل تنفيذ إجراء
  function checkPermissionBeforeAction(permissionName, action) {
    if (!hasPermission(permissionName)) {
      alert('❌ ليس لديك صلاحية للقيام بهذا الإجراء\\nالصلاحية المطلوبة: ' + permissionName);
      return false;
    }
    
    // تنفيذ الإجراء إذا كانت الصلاحية موجودة
    if (typeof action === 'function') {
      action();
    }
    
    return true;
  }

  // تحميل الصلاحيات عند تحميل الصفحة
  if (typeof axios !== 'undefined') {
    loadUserPermissions();
  }

  // إعادة تطبيق الصلاحيات عند تحميل محتوى جديد (للصفحات الديناميكية)
  function refreshPermissions() {
    applyPermissions();
  }
</script>

<style>
  /* تنسيق العناصر المخفية بسبب الصلاحيات */
  [data-hidden-by-permission="true"] {
    display: none !important;
  }
  
  /* تنسيق الأزرار المعطلة */
  [disabled][data-permission-disable] {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
</style>
`;

// دوال مساعدة لإنشاء عناصر محمية
export function protectedButton(permission: string, text: string, onclick: string, className: string = '') {
  return \`<button data-permission="\${permission}" onclick="\${onclick}" class="\${className}">\${text}</button>\`;
}

export function protectedLink(permission: string, text: string, href: string, className: string = '') {
  return \`<a data-permission="\${permission}" href="\${href}" class="\${className}">\${text}</a>\`;
}

export function protectedDiv(permission: string, content: string, className: string = '') {
  return \`<div data-permission="\${permission}" class="\${className}">\${content}</div>\`;
}

// مثال استخدام في الصفحات:
/*
في HTML:

<!-- زر محمي بصلاحية واحدة -->
<button data-permission="customers_create" onclick="addCustomer()">
  <i class="fas fa-plus"></i> إضافة عميل
</button>

<!-- زر محمي بأي صلاحية من قائمة -->
<button data-permission-any="customers_edit,customers_delete" onclick="manageCustomer()">
  <i class="fas fa-cog"></i> إدارة
</button>

<!-- زر محمي بجميع الصلاحيات -->
<button data-permission-all="customers_view,customers_edit" onclick="editCustomer()">
  <i class="fas fa-edit"></i> تعديل
</button>

<!-- زر معطل بدلاً من مخفي -->
<button data-permission-disable="customers_delete" onclick="deleteCustomer()">
  <i class="fas fa-trash"></i> حذف
</button>

<!-- قسم كامل محمي -->
<div data-permission="reports_view">
  <h2>التقارير</h2>
  <!-- محتوى القسم -->
</div>

في JavaScript:

// التحقق قبل تنفيذ إجراء
function deleteCustomer(id) {
  checkPermissionBeforeAction('customers_delete', () => {
    // تنفيذ الحذف
    axios.delete(\`/api/customers/\${id}\`);
  });
}

// التحقق يدوياً
if (hasPermission('customers_create')) {
  // إظهار نموذج الإضافة
}
*/
