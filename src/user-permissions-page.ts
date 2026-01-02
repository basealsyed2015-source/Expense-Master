// صفحة عرض صلاحيات المستخدم
export const userPermissionsPage = (userId: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>صلاحيات المستخدم</title>
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
      border-color: #3b82f6;
    }
  </style>
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
  
  <div class="max-w-7xl mx-auto px-4 py-6">
    
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <div class="bg-white/20 p-4 rounded-xl">
            <i class="fas fa-user-shield text-4xl"></i>
          </div>
          <div>
            <h1 id="userName" class="text-3xl font-bold">جاري التحميل...</h1>
            <p id="userRole" class="text-lg text-white/90 mt-1">جاري تحميل الدور...</p>
            <p id="userEmail" class="text-sm text-white/80 mt-1">---</p>
          </div>
        </div>
        <div class="flex gap-2">
          <a href="/admin/users" class="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition-all font-bold flex items-center gap-2">
            <i class="fas fa-arrow-right"></i>
            <span>العودة للمستخدمين</span>
          </a>
          <button onclick="editUser()" class="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl transition-all font-bold flex items-center gap-2">
            <i class="fas fa-edit"></i>
            <span>تعديل المستخدم</span>
          </button>
        </div>
      </div>
      
      <!-- إحصاءات سريعة -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div class="bg-white/10 backdrop-blur-lg rounded-xl p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-white/80 font-medium">إجمالي الصلاحيات</p>
              <p id="totalPermissions" class="text-3xl font-bold text-white mt-1">0</p>
            </div>
            <div class="bg-white/20 p-3 rounded-xl">
              <i class="fas fa-key text-2xl text-white"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white/10 backdrop-blur-lg rounded-xl p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-white/80 font-medium">الفئات</p>
              <p id="totalCategories" class="text-3xl font-bold text-white mt-1">0</p>
            </div>
            <div class="bg-white/20 p-3 rounded-xl">
              <i class="fas fa-folder text-2xl text-white"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white/10 backdrop-blur-lg rounded-xl p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-white/80 font-medium">الحالة</p>
              <p id="userStatus" class="text-xl font-bold text-white mt-1">---</p>
            </div>
            <div class="bg-white/20 p-3 rounded-xl">
              <i class="fas fa-check-circle text-2xl text-white"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white/10 backdrop-blur-lg rounded-xl p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-white/80 font-medium">تاريخ الإنشاء</p>
              <p id="createdDate" class="text-sm font-bold text-white mt-1">---</p>
            </div>
            <div class="bg-white/20 p-3 rounded-xl">
              <i class="fas fa-calendar text-2xl text-white"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div id="loadingState" class="flex justify-center items-center py-20">
      <div class="text-center">
        <i class="fas fa-spinner fa-spin text-6xl text-blue-600 mb-4"></i>
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
      <p class="text-gray-500">لم يتم تعيين دور أو صلاحيات لهذا المستخدم بعد</p>
      <button onclick="editUser()" class="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all">
        <i class="fas fa-edit ml-2"></i>
        تعيين دور
      </button>
    </div>

  </div>

  <script>
    const userId = ${userId};
    let userData = null;
    let permissionsData = [];

    // تحميل بيانات المستخدم
    async function loadUserData() {
      try {
        // تحميل معلومات المستخدم
        const userResponse = await axios.get('/api/users');
        const users = userResponse.data.data || [];
        userData = users.find(u => u.id === userId);
        
        if (userData) {
          document.getElementById('userName').textContent = userData.full_name;
          document.getElementById('userRole').textContent = userData.role_name || 'لا يوجد دور';
          document.getElementById('userEmail').textContent = userData.email;
          
          const statusText = userData.is_active ? 'نشط ✓' : 'غير نشط ✗';
          document.getElementById('userStatus').textContent = statusText;
          
          // تنسيق التاريخ
          const date = new Date(userData.created_at);
          document.getElementById('createdDate').textContent = date.toLocaleDateString('ar-EG');
        }
        
        // تحميل الصلاحيات
        const permResponse = await axios.get(\`/api/users/\${userId}/permissions\`);
        permissionsData = permResponse.data.data || [];
        
        document.getElementById('totalPermissions').textContent = permissionsData.length;
        
        displayPermissions();
        
      } catch (error) {
        console.error('Error loading user:', error);
        alert('❌ حدث خطأ في تحميل بيانات المستخدم');
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
        'finance': 'fa-dollar-sign',
        'tools': 'fa-tools',
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
        'finance': 'المالية',
        'tools': 'الأدوات',
        'other': 'أخرى'
      };
      
      // بناء HTML
      let html = '';
      
      for (const [category, permissions] of Object.entries(categorized)) {
        const icon = categoryIcons[category] || categoryIcons['other'];
        const categoryName = categoryNames[category] || category;
        
        html += \`
          <div class="mb-6">
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-4 flex items-center justify-between mb-4">
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

    // تعديل المستخدم
    function editUser() {
      window.location.href = '/admin/users';
    }

    // تحميل البيانات عند تحميل الصفحة
    loadUserData();
  </script>
</body>
</html>
`;
