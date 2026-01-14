// صفحة تفاصيل الدور وصلاحياته
export const roleDetailsPage = (roleId: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تفاصيل الدور</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <style>
    .permission-card {
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }
    .permission-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
      border-color: #6366f1;
    }
    .category-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem;
      border-radius: 0.75rem;
      margin-bottom: 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .role-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      border-radius: 1rem;
      color: white;
      margin-bottom: 2rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    .stat-card {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }
  </style>
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
  <div class="max-w-7xl mx-auto px-4 py-6">
    
    <!-- Header -->
    <div class="role-header">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <div class="bg-white/20 p-4 rounded-xl">
            <i class="fas fa-user-shield text-4xl"></i>
          </div>
          <div>
            <h1 id="roleName" class="text-3xl font-bold">جاري التحميل...</h1>
            <p id="roleDescription" class="text-lg text-white/90 mt-1">جاري تحميل الوصف...</p>
          </div>
        </div>
        <div class="flex gap-2">
          <a href="/admin/roles" class="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition-all font-bold flex items-center gap-2">
            <i class="fas fa-arrow-right"></i>
            <span>العودة للأدوار</span>
          </a>
          <button onclick="editRole()" class="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl transition-all font-bold flex items-center gap-2">
            <i class="fas fa-edit"></i>
            <span>تعديل الدور</span>
          </button>
        </div>
      </div>
      
      <!-- إحصاءات سريعة -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium">إجمالي الصلاحيات</p>
              <p id="totalPermissions" class="text-3xl font-bold text-indigo-600 mt-1">0</p>
            </div>
            <div class="bg-indigo-100 p-3 rounded-xl">
              <i class="fas fa-key text-2xl text-indigo-600"></i>
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium">الفئات</p>
              <p id="totalCategories" class="text-3xl font-bold text-purple-600 mt-1">0</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-xl">
              <i class="fas fa-folder text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium">المستخدمون</p>
              <p id="totalUsers" class="text-3xl font-bold text-blue-600 mt-1">0</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-xl">
              <i class="fas fa-users text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium">تاريخ الإنشاء</p>
              <p id="createdDate" class="text-sm font-bold text-gray-700 mt-1">---</p>
            </div>
            <div class="bg-gray-100 p-3 rounded-xl">
              <i class="fas fa-calendar text-2xl text-gray-600"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div id="loadingState" class="loading">
      <div class="text-center">
        <i class="fas fa-spinner fa-spin text-6xl text-indigo-600 mb-4"></i>
        <p class="text-xl text-gray-600 font-bold">جاري تحميل الصلاحيات...</p>
      </div>
    </div>

    <!-- Permissions by Category -->
    <div id="permissionsContainer" class="hidden">
      <!-- سيتم ملؤها ديناميكياً -->
    </div>

    <!-- Empty State -->
    <div id="emptyState" class="hidden bg-white rounded-2xl shadow-lg p-12 text-center">
      <i class="fas fa-inbox text-gray-300 text-6xl mb-4"></i>
      <h3 class="text-2xl font-bold text-gray-700 mb-2">لا توجد صلاحيات</h3>
      <p class="text-gray-500">لم يتم تعيين أي صلاحيات لهذا الدور بعد</p>
      <button onclick="managePermissions()" class="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all">
        <i class="fas fa-plus ml-2"></i>
        إضافة صلاحيات
      </button>
    </div>

  </div>

  <script>
    const roleId = ${roleId};
    let roleData = null;
    let permissionsData = [];

    // تحميل بيانات الدور
    async function loadRoleData() {
      try {
        // تحميل معلومات الدور
        const roleResponse = await axios.get('/api/roles');
        roleData = roleResponse.data.data.find(r => r.id === roleId);
        
        if (roleData) {
          document.getElementById('roleName').textContent = roleData.role_name;
          document.getElementById('roleDescription').textContent = roleData.description;
          document.getElementById('totalPermissions').textContent = roleData.permissions_count;
          
          // تنسيق التاريخ
          const date = new Date(roleData.created_at);
          document.getElementById('createdDate').textContent = date.toLocaleDateString('ar-EG');
        }
        
        // تحميل الصلاحيات
        const permResponse = await axios.get(\`/api/roles/\${roleId}/permissions\`);
        permissionsData = permResponse.data.data || [];
        
        // تحميل عدد المستخدمين
        // TODO: إضافة API لعدد المستخدمين
        document.getElementById('totalUsers').textContent = '-';
        
        displayPermissions();
        
      } catch (error) {
        console.error('Error loading role:', error);
        alert('❌ حدث خطأ في تحميل بيانات الدور');
      }
    }

    // عرض الصلاحيات حسب الفئات
    function displayPermissions() {
      const container = document.getElementById('permissionsContainer');
      const loadingState = document.getElementById('loadingState');
      const emptyState = document.getElementById('emptyState');
      
      loadingState.classList.add('hidden');
      
      if (permissionsData.length === 0) {
        emptyState.classList.remove('hidden');
        return;
      }
      
      container.classList.remove('hidden');
      
      // تجميع الصلاحيات حسب الفئة
      const categorized = {};
      permissionsData.forEach(perm => {
        const category = perm.category || 'other';
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(perm);
      });
      
      // عرض عدد الفئات
      document.getElementById('totalCategories').textContent = Object.keys(categorized).length;
      
      // أيقونات الفئات
      const categoryIcons = {
        'dashboard': 'fa-tachometer-alt',
        'customers': 'fa-users',
        'requests': 'fa-file-invoice',
        'hr': 'fa-user-tie',
        'reports': 'fa-chart-bar',
        'admin': 'fa-cog',
        'system': 'fa-server',
        'other': 'fa-folder'
      };
      
      // أسماء الفئات بالعربية
      const categoryNames = {
        'dashboard': 'لوحة التحكم',
        'customers': 'إدارة العملاء',
        'requests': 'طلبات التمويل',
        'hr': 'الموارد البشرية',
        'reports': 'التقارير',
        'admin': 'إدارة النظام',
        'system': 'إعدادات النظام',
        'other': 'أخرى'
      };
      
      // بناء HTML
      let html = '';
      
      for (const [category, permissions] of Object.entries(categorized)) {
        const icon = categoryIcons[category] || categoryIcons['other'];
        const categoryName = categoryNames[category] || category;
        
        html += \`
          <div class="mb-8">
            <div class="category-header flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i class="fas \${icon} text-2xl"></i>
                <div>
                  <h2 class="text-xl font-bold">\${categoryName}</h2>
                  <p class="text-sm text-white/80">\${permissions.length} صلاحية</p>
                </div>
              </div>
              <span class="bg-white/20 px-4 py-2 rounded-full text-sm font-bold">
                \${permissions.length}
              </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        \`;
        
        permissions.forEach(perm => {
          html += \`
            <div class="permission-card bg-white rounded-xl p-5 shadow-md">
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-800 mb-1">\${perm.display_name}</h3>
                  <code class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">\${perm.name}</code>
                </div>
                <i class="fas fa-check-circle text-green-500 text-xl"></i>
              </div>
              \${perm.description ? \`
                <p class="text-sm text-gray-600 mt-2">\${perm.description}</p>
              \` : ''}
            </div>
          \`;
        });
        
        html += \`
            </div>
          </div>
        \`;
      }
      
      container.innerHTML = html;
    }

    // تعديل الدور
    function editRole() {
      window.location.href = '/admin/roles';
    }

    // إدارة الصلاحيات
    function managePermissions() {
      window.location.href = \`/admin/roles/\${roleId}/permissions\`;
    }

    // تحميل البيانات عند تحميل الصفحة
    loadRoleData();
  </script>
</body>
</html>
`;
