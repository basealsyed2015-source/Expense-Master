// صفحة إدارة المستخدمين
export const usersManagementPage = () => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إدارة المستخدمين</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <style>
    .user-card {
      transition: all 0.3s ease;
    }
    .user-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
    }
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
    }
    .modal.active {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100">
  
  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold flex items-center gap-3">
              <i class="fas fa-users"></i>
              إدارة المستخدمين
            </h1>
            <p class="text-blue-100 mt-2">إدارة المستخدمين وتعيين الأدوار والصلاحيات</p>
          </div>
          <div class="flex gap-3">
            <button onclick="showAddUserModal()" class="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
              <i class="fas fa-plus"></i>
              <span>إضافة مستخدم</span>
            </button>
            <a href="/admin/panel" class="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl transition-all font-bold flex items-center gap-2">
              <i class="fas fa-arrow-right"></i>
              <span>العودة</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="max-w-7xl mx-auto px-6 py-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-xl p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium">إجمالي المستخدمين</p>
              <p id="totalUsers" class="text-3xl font-bold text-blue-600 mt-2">0</p>
            </div>
            <div class="bg-blue-100 p-4 rounded-xl">
              <i class="fas fa-users text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium">النشطون</p>
              <p id="activeUsers" class="text-3xl font-bold text-green-600 mt-2">0</p>
            </div>
            <div class="bg-green-100 p-4 rounded-xl">
              <i class="fas fa-check-circle text-2xl text-green-600"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium">المدراء</p>
              <p id="adminUsers" class="text-3xl font-bold text-purple-600 mt-2">0</p>
            </div>
            <div class="bg-purple-100 p-4 rounded-xl">
              <i class="fas fa-user-shield text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 font-medium">الموظفون</p>
              <p id="employeeUsers" class="text-3xl font-bold text-orange-600 mt-2">0</p>
            </div>
            <div class="bg-orange-100 p-4 rounded-xl">
              <i class="fas fa-user-tie text-2xl text-orange-600"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl p-6 shadow-lg mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" id="searchInput" placeholder="🔍 البحث بالاسم أو البريد..." 
                 class="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 onkeyup="filterUsers()">
          
          <select id="roleFilter" class="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" onchange="filterUsers()">
            <option value="">جميع الأدوار</option>
          </select>
          
          <select id="statusFilter" class="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" onchange="filterUsers()">
            <option value="">جميع الحالات</option>
            <option value="1">نشط</option>
            <option value="0">غير نشط</option>
          </select>
          
          <button onclick="resetFilters()" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-bold transition-all">
            <i class="fas fa-redo ml-2"></i>
            إعادة تعيين
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <tr>
                <th class="px-6 py-4 text-right">#</th>
                <th class="px-6 py-4 text-right">الاسم الكامل</th>
                <th class="px-6 py-4 text-right">البريد الإلكتروني</th>
                <th class="px-6 py-4 text-right">رقم الجوال</th>
                <th class="px-6 py-4 text-right">الدور</th>
                <th class="px-6 py-4 text-right">الحالة</th>
                <th class="px-6 py-4 text-right">تاريخ الإنشاء</th>
                <th class="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">
              <tr>
                <td colspan="8" class="text-center py-12">
                  <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                  <p class="text-gray-600 font-bold">جاري تحميل المستخدمين...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>

  <!-- Add User Modal -->
  <div id="addUserModal" class="modal">
    <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
        <h2 class="text-2xl font-bold flex items-center gap-2">
          <i class="fas fa-user-plus"></i>
          إضافة مستخدم جديد
        </h2>
      </div>
      
      <form id="addUserForm" class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
            <input type="text" name="full_name" required
                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
            <input type="email" name="email" required
                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">رقم الجوال</label>
            <input type="tel" name="phone" required
                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">الدور</label>
            <select name="role_id" id="addUserRole" required
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
              <option value="">اختر الدور...</option>
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
            <input type="password" name="password" required minlength="6"
                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
            <select name="is_active" 
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500">
              <option value="1">نشط</option>
              <option value="0">غير نشط</option>
            </select>
          </div>
        </div>
        
        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all">
            <i class="fas fa-save ml-2"></i>
            حفظ
          </button>
          <button type="button" onclick="closeAddUserModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-bold transition-all">
            <i class="fas fa-times ml-2"></i>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Edit User Modal -->
  <div id="editUserModal" class="modal">
    <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-6 rounded-t-2xl">
        <h2 class="text-2xl font-bold flex items-center gap-2">
          <i class="fas fa-user-edit"></i>
          تعديل المستخدم
        </h2>
      </div>
      
      <form id="editUserForm" class="p-6 space-y-4">
        <input type="hidden" name="id" id="editUserId">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
            <input type="text" name="full_name" id="editUserName" required
                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
            <input type="email" name="email" id="editUserEmail" required
                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500">
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">رقم الجوال</label>
            <input type="tel" name="phone" id="editUserPhone" required
                   class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">الدور</label>
            <select name="role_id" id="editUserRole" required
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500">
              <option value="">اختر الدور...</option>
            </select>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
          <select name="is_active" id="editUserStatus"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500">
            <option value="1">نشط</option>
            <option value="0">غير نشط</option>
          </select>
        </div>
        
        <div class="flex gap-3 pt-4">
          <button type="submit" class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl font-bold transition-all">
            <i class="fas fa-save ml-2"></i>
            حفظ التعديلات
          </button>
          <button type="button" onclick="closeEditUserModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-bold transition-all">
            <i class="fas fa-times ml-2"></i>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let allUsers = [];
    let allRoles = [];

    // تحميل البيانات
    async function loadData() {
      try {
        // تحميل المستخدمين
        const usersResponse = await axios.get('/api/users');
        allUsers = usersResponse.data.data || [];
        
        // تحميل الأدوار
        const rolesResponse = await axios.get('/api/roles');
        allRoles = rolesResponse.data.data || [];
        
        // ملء قوائم الأدوار
        populateRoleSelects();
        
        // عرض المستخدمين
        displayUsers(allUsers);
        
        // تحديث الإحصاءات
        updateStats();
        
      } catch (error) {
        console.error('Error loading data:', error);
        alert('❌ حدث خطأ في تحميل البيانات');
      }
    }

    // ملء قوائم الأدوار
    function populateRoleSelects() {
      const roleFilter = document.getElementById('roleFilter');
      const addUserRole = document.getElementById('addUserRole');
      const editUserRole = document.getElementById('editUserRole');
      
      allRoles.forEach(role => {
        // فلتر الأدوار
        const filterOption = document.createElement('option');
        filterOption.value = role.id;
        filterOption.textContent = role.role_name;
        roleFilter.appendChild(filterOption);
        
        // قائمة إضافة
        const addOption = document.createElement('option');
        addOption.value = role.id;
        addOption.textContent = role.role_name;
        addUserRole.appendChild(addOption);
        
        // قائمة تعديل
        const editOption = document.createElement('option');
        editOption.value = role.id;
        editOption.textContent = role.role_name;
        editUserRole.appendChild(editOption);
      });
    }

    // عرض المستخدمين
    function displayUsers(users) {
      const tbody = document.getElementById('usersTableBody');
      
      if (users.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="8" class="text-center py-12">
              <i class="fas fa-inbox text-gray-300 text-6xl mb-4"></i>
              <p class="text-gray-600 font-bold">لا توجد مستخدمين</p>
            </td>
          </tr>
        \`;
        return;
      }
      
      tbody.innerHTML = users.map((user, index) => {
        const role = allRoles.find(r => r.id === user.role_id);
        const roleName = role ? role.role_name : 'غير محدد';
        const statusBadge = user.is_active ? 
          '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold"><i class="fas fa-check-circle ml-1"></i>نشط</span>' :
          '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold"><i class="fas fa-times-circle ml-1"></i>غير نشط</span>';
        
        const date = new Date(user.created_at);
        const formattedDate = date.toLocaleDateString('ar-EG');
        
        return \`
          <tr class="border-b hover:bg-blue-50 transition-colors">
            <td class="px-6 py-4 font-medium">\${index + 1}</td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                  <i class="fas fa-user text-blue-600"></i>
                </div>
                <span class="font-bold text-gray-800">\${user.full_name}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-gray-600">\${user.email}</td>
            <td class="px-6 py-4 text-gray-600 font-english">\${user.phone || '-'}</td>
            <td class="px-6 py-4">
              <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                <i class="fas fa-user-shield ml-1"></i>
                \${roleName}
              </span>
            </td>
            <td class="px-6 py-4">\${statusBadge}</td>
            <td class="px-6 py-4 text-sm text-gray-500">\${formattedDate}</td>
            <td class="px-6 py-4">
              <div class="flex items-center justify-center gap-2">
                <button onclick="viewUserPermissions(\${user.id})" 
                        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                        title="عرض الصلاحيات">
                  <i class="fas fa-key"></i>
                </button>
                <button onclick="editUser(\${user.id})" 
                        class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm"
                        title="تعديل">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteUser(\${user.id}, '\${user.full_name}')" 
                        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                        title="حذف">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        \`;
      }).join('');
    }

    // تحديث الإحصاءات
    function updateStats() {
      const total = allUsers.length;
      const active = allUsers.filter(u => u.is_active).length;
      const admins = allUsers.filter(u => {
        const role = allRoles.find(r => r.id === u.role_id);
        return role && (role.id === 11 || role.id === 12); // مدير نظام أو مدير شركة
      }).length;
      const employees = allUsers.filter(u => {
        const role = allRoles.find(r => r.id === u.role_id);
        return role && role.id === 14; // موظف
      }).length;
      
      document.getElementById('totalUsers').textContent = total;
      document.getElementById('activeUsers').textContent = active;
      document.getElementById('adminUsers').textContent = admins;
      document.getElementById('employeeUsers').textContent = employees;
    }

    // فلترة المستخدمين
    function filterUsers() {
      const search = document.getElementById('searchInput').value.toLowerCase();
      const roleFilter = document.getElementById('roleFilter').value;
      const statusFilter = document.getElementById('statusFilter').value;
      
      let filtered = allUsers;
      
      // بحث بالاسم أو البريد
      if (search) {
        filtered = filtered.filter(u => 
          u.full_name.toLowerCase().includes(search) || 
          u.email.toLowerCase().includes(search)
        );
      }
      
      // فلتر حسب الدور
      if (roleFilter) {
        filtered = filtered.filter(u => u.role_id == roleFilter);
      }
      
      // فلتر حسب الحالة
      if (statusFilter !== '') {
        filtered = filtered.filter(u => u.is_active == statusFilter);
      }
      
      displayUsers(filtered);
    }

    // إعادة تعيين الفلاتر
    function resetFilters() {
      document.getElementById('searchInput').value = '';
      document.getElementById('roleFilter').value = '';
      document.getElementById('statusFilter').value = '';
      displayUsers(allUsers);
    }

    // Modal functions
    function showAddUserModal() {
      document.getElementById('addUserModal').classList.add('active');
    }

    function closeAddUserModal() {
      document.getElementById('addUserModal').classList.remove('active');
      document.getElementById('addUserForm').reset();
    }

    function showEditUserModal() {
      document.getElementById('editUserModal').classList.add('active');
    }

    function closeEditUserModal() {
      document.getElementById('editUserModal').classList.remove('active');
      document.getElementById('editUserForm').reset();
    }

    // إضافة مستخدم
    document.getElementById('addUserForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await axios.post('/api/users', data);
        
        if (response.data.success) {
          alert('✅ تم إضافة المستخدم بنجاح');
          closeAddUserModal();
          loadData();
        }
      } catch (error) {
        console.error('Error adding user:', error);
        alert('❌ حدث خطأ في إضافة المستخدم');
      }
    });

    // تعديل مستخدم
    function editUser(id) {
      const user = allUsers.find(u => u.id === id);
      if (!user) return;
      
      document.getElementById('editUserId').value = user.id;
      document.getElementById('editUserName').value = user.full_name;
      document.getElementById('editUserEmail').value = user.email;
      document.getElementById('editUserPhone').value = user.phone || '';
      document.getElementById('editUserRole').value = user.role_id || '';
      document.getElementById('editUserStatus').value = user.is_active ? '1' : '0';
      
      showEditUserModal();
    }

    // حفظ التعديلات
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      const userId = data.id;
      delete data.id;
      
      try {
        const response = await axios.put(\`/api/users/\${userId}\`, data);
        
        if (response.data.success) {
          alert('✅ تم تحديث المستخدم بنجاح');
          closeEditUserModal();
          loadData();
        }
      } catch (error) {
        console.error('Error updating user:', error);
        alert('❌ حدث خطأ في تحديث المستخدم');
      }
    });

    // حذف مستخدم
    async function deleteUser(id, name) {
      if (!confirm(\`هل أنت متأكد من حذف المستخدم "\${name}"؟\`)) {
        return;
      }
      
      try {
        const response = await axios.delete(\`/api/users/\${id}\`);
        
        if (response.data.success) {
          alert('✅ تم حذف المستخدم بنجاح');
          loadData();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('❌ حدث خطأ في حذف المستخدم');
      }
    }

    // عرض صلاحيات المستخدم
    function viewUserPermissions(userId) {
      window.location.href = \`/admin/users/\${userId}/permissions\`;
    }

    // تحميل البيانات عند تحميل الصفحة
    loadData();
  </script>
</body>
</html>
`;
