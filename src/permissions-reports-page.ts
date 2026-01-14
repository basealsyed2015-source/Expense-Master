// صفحة تقارير الصلاحيات
export const permissionsReportsPage = () => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقارير الصلاحيات</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    .report-card {
      transition: all 0.3s ease;
    }
    .report-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
    }
  </style>
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
  
  <div class="max-w-7xl mx-auto px-4 py-6">
    
    <!-- Header -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold flex items-center gap-3">
            <i class="fas fa-chart-pie"></i>
            تقارير وإحصاءات الصلاحيات
          </h1>
          <p class="text-indigo-100 mt-2">تقارير شاملة عن توزيع الصلاحيات والأدوار</p>
        </div>
        <div class="flex gap-3">
          <button onclick="exportReport()" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
            <i class="fas fa-file-export"></i>
            <span>تصدير التقرير</span>
          </button>
          <a href="/admin/panel" class="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition-all font-bold flex items-center gap-2">
            <i class="fas fa-arrow-right"></i>
            <span>العودة</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div class="report-card bg-white rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 font-medium">إجمالي الصلاحيات</p>
            <p id="totalPermissions" class="text-3xl font-bold text-indigo-600 mt-2">0</p>
          </div>
          <div class="bg-indigo-100 p-4 rounded-xl">
            <i class="fas fa-key text-2xl text-indigo-600"></i>
          </div>
        </div>
      </div>
      
      <div class="report-card bg-white rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 font-medium">عدد الفئات</p>
            <p id="totalCategories" class="text-3xl font-bold text-purple-600 mt-2">0</p>
          </div>
          <div class="bg-purple-100 p-4 rounded-xl">
            <i class="fas fa-folder text-2xl text-purple-600"></i>
          </div>
        </div>
      </div>
      
      <div class="report-card bg-white rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 font-medium">عدد الأدوار</p>
            <p id="totalRoles" class="text-3xl font-bold text-blue-600 mt-2">0</p>
          </div>
          <div class="bg-blue-100 p-4 rounded-xl">
            <i class="fas fa-user-shield text-2xl text-blue-600"></i>
          </div>
        </div>
      </div>
      
      <div class="report-card bg-white rounded-xl p-6 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 font-medium">عدد المستخدمين</p>
            <p id="totalUsers" class="text-3xl font-bold text-green-600 mt-2">0</p>
          </div>
          <div class="bg-green-100 p-4 rounded-xl">
            <i class="fas fa-users text-2xl text-green-600"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Permissions by Category -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i class="fas fa-chart-bar text-indigo-600"></i>
          توزيع الصلاحيات حسب الفئة
        </h2>
        <canvas id="categoryChart" height="250"></canvas>
      </div>
      
      <!-- Permissions by Role -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i class="fas fa-chart-pie text-purple-600"></i>
          صلاحيات الأدوار
        </h2>
        <canvas id="roleChart" height="250"></canvas>
      </div>
    </div>

    <!-- Detailed Reports -->
    <div class="space-y-6">
      
      <!-- Roles Comparison -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <h2 class="text-2xl font-bold flex items-center gap-2">
            <i class="fas fa-balance-scale"></i>
            مقارنة الأدوار
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-right font-bold text-gray-700">الدور</th>
                <th class="px-6 py-4 text-center font-bold text-gray-700">الصلاحيات</th>
                <th class="px-6 py-4 text-center font-bold text-gray-700">Dashboard</th>
                <th class="px-6 py-4 text-center font-bold text-gray-700">Customers</th>
                <th class="px-6 py-4 text-center font-bold text-gray-700">Requests</th>
                <th class="px-6 py-4 text-center font-bold text-gray-700">HR</th>
                <th class="px-6 py-4 text-center font-bold text-gray-700">Reports</th>
                <th class="px-6 py-4 text-center font-bold text-gray-700">System</th>
                <th class="px-6 py-4 text-center font-bold text-gray-700">Finance</th>
              </tr>
            </thead>
            <tbody id="rolesComparisonTable">
              <tr>
                <td colspan="9" class="text-center py-8">
                  <i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Permissions Details -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
          <h2 class="text-2xl font-bold flex items-center gap-2">
            <i class="fas fa-list"></i>
            تفاصيل الصلاحيات
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-right font-bold text-gray-700">#</th>
                <th class="px-6 py-4 text-right font-bold text-gray-700">الصلاحية</th>
                <th class="px-6 py-4 text-right font-bold text-gray-700">الفئة</th>
                <th class="px-6 py-4 text-center font-bold text-gray-700">الأدوار المستخدمة</th>
                <th class="px-6 py-4 text-center font-bold text-gray-700">معدل الاستخدام</th>
              </tr>
            </thead>
            <tbody id="permissionsDetailsTable">
              <tr>
                <td colspan="5" class="text-center py-8">
                  <i class="fas fa-spinner fa-spin text-3xl text-purple-600"></i>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Users by Role -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <h2 class="text-2xl font-bold flex items-center gap-2">
            <i class="fas fa-users"></i>
            توزيع المستخدمين حسب الدور
          </h2>
        </div>
        <div class="p-6">
          <div id="usersDistribution" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- سيتم ملؤها ديناميكياً -->
          </div>
        </div>
      </div>

    </div>

  </div>

  <script>
    let allPermissions = [];
    let allRoles = [];
    let allUsers = [];
    let rolePermissions = {};

    // تحميل البيانات
    async function loadData() {
      try {
        // تحميل الصلاحيات
        const permsResponse = await axios.get('/api/permissions');
        allPermissions = permsResponse.data.data || [];
        
        // تحميل الأدوار
        const rolesResponse = await axios.get('/api/roles');
        allRoles = rolesResponse.data.data || [];
        
        // تحميل المستخدمين
        const usersResponse = await axios.get('/api/users');
        allUsers = usersResponse.data.data || [];
        
        // تحميل صلاحيات كل دور
        for (const role of allRoles) {
          const rolePermsResponse = await axios.get(\`/api/roles/\${role.id}/permissions\`);
          rolePermissions[role.id] = rolePermsResponse.data.data || [];
        }
        
        // تحديث الإحصاءات
        updateStats();
        
        // رسم الرسوم البيانية
        drawCharts();
        
        // عرض التقارير
        displayReports();
        
      } catch (error) {
        console.error('Error loading data:', error);
        alert('❌ حدث خطأ في تحميل البيانات');
      }
    }

    // تحديث الإحصاءات
    function updateStats() {
      // تجميع الفئات
      const categories = new Set(allPermissions.map(p => p.category));
      
      document.getElementById('totalPermissions').textContent = allPermissions.length;
      document.getElementById('totalCategories').textContent = categories.size;
      document.getElementById('totalRoles').textContent = allRoles.length;
      document.getElementById('totalUsers').textContent = allUsers.length;
    }

    // رسم الرسوم البيانية
    function drawCharts() {
      // توزيع الصلاحيات حسب الفئة
      const categoryCounts = {};
      allPermissions.forEach(perm => {
        const cat = perm.category || 'other';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      
      const categoryNames = {
        'dashboard': 'لوحة التحكم',
        'customers': 'العملاء',
        'requests': 'الطلبات',
        'hr': 'الموارد البشرية',
        'reports': 'التقارير',
        'admin': 'الإدارة',
        'system': 'النظام',
        'finance': 'المالية',
        'tools': 'الأدوات',
        'other': 'أخرى'
      };
      
      new Chart(document.getElementById('categoryChart'), {
        type: 'bar',
        data: {
          labels: Object.keys(categoryCounts).map(c => categoryNames[c] || c),
          datasets: [{
            label: 'عدد الصلاحيات',
            data: Object.values(categoryCounts),
            backgroundColor: [
              '#6366f1', '#8b5cf6', '#3b82f6', '#10b981',
              '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
      
      // صلاحيات الأدوار
      new Chart(document.getElementById('roleChart'), {
        type: 'doughnut',
        data: {
          labels: allRoles.map(r => r.role_name),
          datasets: [{
            data: allRoles.map(r => r.permissions_count),
            backgroundColor: ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // عرض التقارير
    function displayReports() {
      // مقارنة الأدوار
      const tbody = document.getElementById('rolesComparisonTable');
      
      tbody.innerHTML = allRoles.map(role => {
        const perms = rolePermissions[role.id] || [];
        
        // حساب الصلاحيات لكل فئة
        const catCounts = {
          dashboard: 0, customers: 0, requests: 0, hr: 0,
          reports: 0, system: 0, finance: 0
        };
        
        perms.forEach(p => {
          if (catCounts.hasOwnProperty(p.category)) {
            catCounts[p.category]++;
          }
        });
        
        return \`
          <tr class="border-b hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="font-bold text-gray-800">\${role.role_name}</div>
              <div class="text-xs text-gray-500">\${role.description}</div>
            </td>
            <td class="px-6 py-4 text-center">
              <span class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">
                \${perms.length}
              </span>
            </td>
            <td class="px-6 py-4 text-center font-bold text-gray-700">\${catCounts.dashboard}</td>
            <td class="px-6 py-4 text-center font-bold text-gray-700">\${catCounts.customers}</td>
            <td class="px-6 py-4 text-center font-bold text-gray-700">\${catCounts.requests}</td>
            <td class="px-6 py-4 text-center font-bold text-gray-700">\${catCounts.hr}</td>
            <td class="px-6 py-4 text-center font-bold text-gray-700">\${catCounts.reports}</td>
            <td class="px-6 py-4 text-center font-bold text-gray-700">\${catCounts.system}</td>
            <td class="px-6 py-4 text-center font-bold text-gray-700">\${catCounts.finance}</td>
          </tr>
        \`;
      }).join('');
      
      // تفاصيل الصلاحيات
      const permTbody = document.getElementById('permissionsDetailsTable');
      
      const categoryNames = {
        'dashboard': 'لوحة التحكم',
        'customers': 'العملاء',
        'requests': 'الطلبات',
        'hr': 'الموارد البشرية',
        'reports': 'التقارير',
        'admin': 'الإدارة',
        'system': 'النظام',
        'finance': 'المالية',
        'tools': 'الأدوات',
        'other': 'أخرى'
      };
      
      permTbody.innerHTML = allPermissions.map((perm, index) => {
        // حساب عدد الأدوار التي تستخدم هذه الصلاحية
        let rolesCount = 0;
        Object.values(rolePermissions).forEach(perms => {
          if (perms.some(p => p.id === perm.id)) {
            rolesCount++;
          }
        });
        
        const usagePercent = ((rolesCount / allRoles.length) * 100).toFixed(0);
        
        return \`
          <tr class="border-b hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-700">\${index + 1}</td>
            <td class="px-6 py-4">
              <div class="font-bold text-gray-800">\${perm.display_name}</div>
              <code class="text-xs text-gray-500">\${perm.name}</code>
            </td>
            <td class="px-6 py-4">
              <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                \${categoryNames[perm.category] || perm.category}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <span class="font-bold text-gray-700">\${rolesCount} / \${allRoles.length}</span>
            </td>
            <td class="px-6 py-4 text-center">
              <div class="flex items-center justify-center gap-2">
                <div class="w-24 bg-gray-200 rounded-full h-2">
                  <div class="bg-indigo-600 h-2 rounded-full" style="width: \${usagePercent}%"></div>
                </div>
                <span class="text-sm font-bold text-gray-700">\${usagePercent}%</span>
              </div>
            </td>
          </tr>
        \`;
      }).join('');
      
      // توزيع المستخدمين
      const usersDiv = document.getElementById('usersDistribution');
      
      usersDiv.innerHTML = allRoles.map(role => {
        const roleUsers = allUsers.filter(u => u.role_id === role.id);
        
        return \`
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
            <div class="flex items-center justify-between mb-4">
              <i class="fas fa-user-shield text-3xl text-blue-600"></i>
              <span class="text-3xl font-bold text-blue-600">\${roleUsers.length}</span>
            </div>
            <h3 class="font-bold text-gray-800 mb-1">\${role.role_name}</h3>
            <p class="text-sm text-gray-600">\${roleUsers.length} مستخدم</p>
          </div>
        \`;
      }).join('');
    }

    // تصدير التقرير
    function exportReport() {
      let report = 'تقرير الصلاحيات والأدوار\\n';
      report += '='.repeat(60) + '\\n\\n';
      
      report += '📊 الإحصاءات العامة:\\n';
      report += \`- إجمالي الصلاحيات: \${allPermissions.length}\\n\`;
      report += \`- عدد الأدوار: \${allRoles.length}\\n\`;
      report += \`- عدد المستخدمين: \${allUsers.length}\\n\\n\`;
      
      report += '📋 تفاصيل الأدوار:\\n';
      allRoles.forEach(role => {
        const perms = rolePermissions[role.id] || [];
        report += \`\\n\${role.role_name}:\\n\`;
        report += \`  - الوصف: \${role.description}\\n\`;
        report += \`  - الصلاحيات: \${perms.length}\\n\`;
        report += \`  - المستخدمون: \${allUsers.filter(u => u.role_id === role.id).length}\\n\`;
      });
      
      // تحميل كملف
      const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`permissions-report-\${new Date().toISOString().split('T')[0]}.txt\`;
      a.click();
      
      alert('✅ تم تصدير التقرير بنجاح');
    }

    // تحميل البيانات عند تحميل الصفحة
    loadData();
  </script>
</body>
</html>
`;
