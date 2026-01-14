// صفحة إدارة الصلاحيات المخصصة
export const permissionsManagementPage = () => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إدارة الصلاحيات</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <style>
    .permission-checkbox {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
    .category-section {
      transition: all 0.3s ease;
    }
    .category-section:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
  
  <div class="max-w-7xl mx-auto px-4 py-6">
    
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold flex items-center gap-3">
            <i class="fas fa-shield-alt"></i>
            إدارة الصلاحيات المخصصة
          </h1>
          <p class="text-purple-100 mt-2">تخصيص صلاحيات كل دور حسب احتياجات العمل</p>
        </div>
        <div class="flex gap-3">
          <button onclick="saveAllChanges()" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
            <i class="fas fa-save"></i>
            <span>حفظ جميع التغييرات</span>
          </button>
          <a href="/admin/panel" class="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition-all font-bold flex items-center gap-2">
            <i class="fas fa-arrow-right"></i>
            <span>العودة</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Roles Tabs -->
    <div class="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
      <div class="flex border-b border-gray-200 overflow-x-auto">
        <button id="tab-11" onclick="selectRole(11)" class="flex-1 px-6 py-4 font-bold text-gray-600 hover:bg-gray-50 transition-colors border-b-4 border-transparent">
          <i class="fas fa-crown ml-2 text-yellow-500"></i>
          مدير النظام SaaS
          <span id="count-11" class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs ml-2">0</span>
        </button>
        <button id="tab-12" onclick="selectRole(12)" class="flex-1 px-6 py-4 font-bold text-gray-600 hover:bg-gray-50 transition-colors border-b-4 border-transparent">
          <i class="fas fa-building ml-2 text-blue-500"></i>
          مدير شركة
          <span id="count-12" class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs ml-2">0</span>
        </button>
        <button id="tab-13" onclick="selectRole(13)" class="flex-1 px-6 py-4 font-bold text-gray-600 hover:bg-gray-50 transition-colors border-b-4 border-transparent">
          <i class="fas fa-user-tie ml-2 text-indigo-500"></i>
          مشرف موظفين
          <span id="count-13" class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs ml-2">0</span>
        </button>
        <button id="tab-14" onclick="selectRole(14)" class="flex-1 px-6 py-4 font-bold text-gray-600 hover:bg-gray-50 transition-colors border-b-4 border-transparent">
          <i class="fas fa-user ml-2 text-green-500"></i>
          موظف
          <span id="count-14" class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs ml-2">0</span>
        </button>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <i class="fas fa-tasks"></i>
          إجراءات سريعة
        </h3>
        <div class="flex gap-3">
          <button onclick="selectAllPermissions()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-all">
            <i class="fas fa-check-double ml-2"></i>
            تحديد الكل
          </button>
          <button onclick="deselectAllPermissions()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-all">
            <i class="fas fa-times ml-2"></i>
            إلغاء الكل
          </button>
          <button onclick="selectCategoryPermissions()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition-all">
            <i class="fas fa-folder ml-2"></i>
            تحديد فئة
          </button>
        </div>
      </div>
    </div>

    <!-- Permissions Grid -->
    <div id="permissionsGrid" class="space-y-6">
      <div class="flex justify-center items-center py-20">
        <div class="text-center">
          <i class="fas fa-spinner fa-spin text-6xl text-purple-600 mb-4"></i>
          <p class="text-xl text-gray-600 font-bold">جاري تحميل الصلاحيات...</p>
        </div>
      </div>
    </div>

    <!-- Changes Summary -->
    <div id="changesSummary" class="hidden bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 mt-6">
      <div class="flex items-start gap-4">
        <i class="fas fa-exclamation-triangle text-3xl text-yellow-600"></i>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-gray-800 mb-2">تغييرات غير محفوظة!</h3>
          <p class="text-gray-600 mb-3">لديك تغييرات لم يتم حفظها بعد. تأكد من حفظها قبل مغادرة الصفحة.</p>
          <div id="changesCount" class="text-sm font-bold text-yellow-800"></div>
        </div>
      </div>
    </div>

  </div>

  <script>
    let allPermissions = [];
    let allRoles = [];
    let currentRoleId = 11;
    let rolePermissions = {};
    let originalRolePermissions = {};
    let hasUnsavedChanges = false;

    // تحميل البيانات
    async function loadData() {
      try {
        // تحميل جميع الصلاحيات
        const permsResponse = await axios.get('/api/permissions');
        allPermissions = permsResponse.data.data || [];
        
        // تحميل الأدوار
        const rolesResponse = await axios.get('/api/roles');
        allRoles = rolesResponse.data.data || [];
        
        // تحميل صلاحيات كل دور
        for (const role of allRoles) {
          const rolePermsResponse = await axios.get(\`/api/roles/\${role.id}/permissions\`);
          const perms = rolePermsResponse.data.data || [];
          rolePermissions[role.id] = perms.map(p => p.id);
          originalRolePermissions[role.id] = [...rolePermissions[role.id]];
          
          // تحديث عدد الصلاحيات
          document.getElementById(\`count-\${role.id}\`).textContent = perms.length;
        }
        
        // عرض الدور الأول
        selectRole(11);
        
      } catch (error) {
        console.error('Error loading data:', error);
        alert('❌ حدث خطأ في تحميل البيانات');
      }
    }

    // اختيار دور
    function selectRole(roleId) {
      currentRoleId = roleId;
      
      // تحديث tabs
      document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.classList.remove('border-purple-600', 'text-purple-600', 'bg-purple-50');
        tab.classList.add('border-transparent', 'text-gray-600');
      });
      
      const selectedTab = document.getElementById(\`tab-\${roleId}\`);
      selectedTab.classList.remove('border-transparent', 'text-gray-600');
      selectedTab.classList.add('border-purple-600', 'text-purple-600', 'bg-purple-50');
      
      // عرض الصلاحيات
      displayPermissions();
    }

    // عرض الصلاحيات
    function displayPermissions() {
      const grid = document.getElementById('permissionsGrid');
      
      // تجميع الصلاحيات حسب الفئة
      const categorized = {};
      allPermissions.forEach(perm => {
        const category = perm.category || 'other';
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(perm);
      });
      
      // أيقونات وأسماء الفئات
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
        const selectedCount = permissions.filter(p => rolePermissions[currentRoleId].includes(p.id)).length;
        
        html += \`
          <div class="category-section bg-white rounded-2xl shadow-lg overflow-hidden">
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <i class="fas \${icon} text-2xl"></i>
                  <div>
                    <h2 class="text-xl font-bold">\${categoryName}</h2>
                    <p class="text-sm text-white/80">\${permissions.length} صلاحية متاحة</p>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <span class="bg-white/20 px-4 py-2 rounded-full text-sm font-bold">
                    \${selectedCount} / \${permissions.length} محددة
                  </span>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" 
                           class="permission-checkbox" 
                           onchange="toggleCategory('\${category}')"
                           \${selectedCount === permissions.length ? 'checked' : ''}>
                    <span class="text-sm font-bold">تحديد الكل</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        \`;
        
        permissions.forEach(perm => {
          const isChecked = rolePermissions[currentRoleId].includes(perm.id);
          
          html += \`
            <label class="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-purple-50 transition-all \${isChecked ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}">
              <input type="checkbox" 
                     class="permission-checkbox mt-1" 
                     value="\${perm.id}"
                     onchange="togglePermission(\${perm.id})"
                     \${isChecked ? 'checked' : ''}>
              <div class="flex-1">
                <div class="font-bold text-gray-800 mb-1">\${perm.display_name}</div>
                <code class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">\${perm.name}</code>
                \${perm.description ? \`
                  <p class="text-sm text-gray-600 mt-2">\${perm.description}</p>
                \` : ''}
              </div>
            </label>
          \`;
        });
        
        html += \`
              </div>
            </div>
          </div>
        \`;
      }
      
      grid.innerHTML = html;
    }

    // تبديل صلاحية
    function togglePermission(permId) {
      const index = rolePermissions[currentRoleId].indexOf(permId);
      
      if (index > -1) {
        rolePermissions[currentRoleId].splice(index, 1);
      } else {
        rolePermissions[currentRoleId].push(permId);
      }
      
      updateChangesStatus();
      updatePermissionCount();
      displayPermissions();
    }

    // تبديل فئة كاملة
    function toggleCategory(category) {
      const categoryPerms = allPermissions.filter(p => p.category === category);
      const allSelected = categoryPerms.every(p => rolePermissions[currentRoleId].includes(p.id));
      
      if (allSelected) {
        // إلغاء تحديد الكل
        categoryPerms.forEach(p => {
          const index = rolePermissions[currentRoleId].indexOf(p.id);
          if (index > -1) {
            rolePermissions[currentRoleId].splice(index, 1);
          }
        });
      } else {
        // تحديد الكل
        categoryPerms.forEach(p => {
          if (!rolePermissions[currentRoleId].includes(p.id)) {
            rolePermissions[currentRoleId].push(p.id);
          }
        });
      }
      
      updateChangesStatus();
      updatePermissionCount();
      displayPermissions();
    }

    // تحديد جميع الصلاحيات
    function selectAllPermissions() {
      rolePermissions[currentRoleId] = allPermissions.map(p => p.id);
      updateChangesStatus();
      updatePermissionCount();
      displayPermissions();
    }

    // إلغاء جميع الصلاحيات
    function deselectAllPermissions() {
      rolePermissions[currentRoleId] = [];
      updateChangesStatus();
      updatePermissionCount();
      displayPermissions();
    }

    // تحديد صلاحيات فئة معينة
    function selectCategoryPermissions() {
      const category = prompt('أدخل اسم الفئة (dashboard, customers, requests, hr, reports, admin, system, finance, tools):');
      if (!category) return;
      
      const categoryPerms = allPermissions.filter(p => p.category === category);
      if (categoryPerms.length === 0) {
        alert('لم يتم العثور على صلاحيات في هذه الفئة');
        return;
      }
      
      categoryPerms.forEach(p => {
        if (!rolePermissions[currentRoleId].includes(p.id)) {
          rolePermissions[currentRoleId].push(p.id);
        }
      });
      
      updateChangesStatus();
      updatePermissionCount();
      displayPermissions();
    }

    // تحديث عدد الصلاحيات
    function updatePermissionCount() {
      const count = rolePermissions[currentRoleId].length;
      document.getElementById(\`count-\${currentRoleId}\`).textContent = count;
    }

    // تحديث حالة التغييرات
    function updateChangesStatus() {
      let totalChanges = 0;
      
      for (const roleId of [11, 12, 13, 14]) {
        const original = originalRolePermissions[roleId] || [];
        const current = rolePermissions[roleId] || [];
        
        const added = current.filter(id => !original.includes(id)).length;
        const removed = original.filter(id => !current.includes(id)).length;
        
        totalChanges += added + removed;
      }
      
      hasUnsavedChanges = totalChanges > 0;
      const summary = document.getElementById('changesSummary');
      const changesCount = document.getElementById('changesCount');
      
      if (hasUnsavedChanges) {
        summary.classList.remove('hidden');
        changesCount.textContent = \`عدد التغييرات: \${totalChanges}\`;
      } else {
        summary.classList.add('hidden');
      }
    }

    // حفظ جميع التغييرات
    async function saveAllChanges() {
      if (!hasUnsavedChanges) {
        alert('✅ لا توجد تغييرات لحفظها');
        return;
      }
      
      if (!confirm('هل أنت متأكد من حفظ جميع التغييرات؟')) {
        return;
      }
      
      try {
        for (const roleId of [11, 12, 13, 14]) {
          await axios.put(\`/api/roles/\${roleId}/permissions\`, {
            permission_ids: rolePermissions[roleId]
          });
        }
        
        alert('✅ تم حفظ جميع التغييرات بنجاح');
        
        // تحديث original
        for (const roleId of [11, 12, 13, 14]) {
          originalRolePermissions[roleId] = [...rolePermissions[roleId]];
        }
        
        hasUnsavedChanges = false;
        document.getElementById('changesSummary').classList.add('hidden');
        
      } catch (error) {
        console.error('Error saving changes:', error);
        alert('❌ حدث خطأ في حفظ التغييرات');
      }
    }

    // تحذير عند المغادرة
    window.addEventListener('beforeunload', (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // تحميل البيانات عند تحميل الصفحة
    loadData();
  </script>
</body>
</html>
`;
