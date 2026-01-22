// ========================================
// صفحات نظام الموارد البشرية - HR Pages
// ========================================

// صفحة الإجازات - Leaves Page
export const hrLeavesPage = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إدارة الإجازات - نظام الموارد البشرية</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6 px-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a href="/admin/hr" class="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <i class="fas fa-arrow-right text-xl"></i>
          </a>
          <div>
            <h1 class="text-2xl font-bold">إدارة الإجازات</h1>
            <p class="text-blue-100 text-sm">طلبات الإجازات والموافقات</p>
          </div>
        </div>
        <button onclick="showAddLeaveModal()" class="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition">
          <i class="fas fa-plus ml-2"></i>
          طلب إجازة جديد
        </button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="p-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">إجمالي الطلبات</p>
              <p class="text-3xl font-bold text-gray-800" id="totalLeaves">0</p>
            </div>
            <div class="bg-blue-100 p-4 rounded-full">
              <i class="fas fa-calendar-alt text-blue-600 text-2xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">قيد الانتظار</p>
              <p class="text-3xl font-bold text-yellow-600" id="pendingLeaves">0</p>
            </div>
            <div class="bg-yellow-100 p-4 rounded-full">
              <i class="fas fa-clock text-yellow-600 text-2xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">مقبولة</p>
              <p class="text-3xl font-bold text-green-600" id="approvedLeaves">0</p>
            </div>
            <div class="bg-green-100 p-4 rounded-full">
              <i class="fas fa-check-circle text-green-600 text-2xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">مرفوضة</p>
              <p class="text-3xl font-bold text-red-600" id="rejectedLeaves">0</p>
            </div>
            <div class="bg-red-100 p-4 rounded-full">
              <i class="fas fa-times-circle text-red-600 text-2xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select id="statusFilter" class="border border-gray-300 rounded-lg px-4 py-2" onchange="loadLeaves()">
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="approved">مقبولة</option>
            <option value="rejected">مرفوضة</option>
          </select>

          <select id="typeFilter" class="border border-gray-300 rounded-lg px-4 py-2" onchange="loadLeaves()">
            <option value="">جميع الأنواع</option>
            <option value="annual">إجازة سنوية</option>
            <option value="sick">إجازة مرضية</option>
            <option value="emergency">إجازة طارئة</option>
            <option value="unpaid">إجازة بدون راتب</option>
          </select>

          <select id="employeeFilter" class="border border-gray-300 rounded-lg px-4 py-2" onchange="loadLeaves()">
            <option value="">جميع الموظفين</option>
          </select>

          <button onclick="loadLeaves()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-search ml-2"></i>
            بحث
          </button>
        </div>
      </div>

      <!-- Leaves Table -->
      <div class="bg-white rounded-xl shadow-md overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الموظف</th>
              <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">نوع الإجازة</th>
              <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">من</th>
              <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">إلى</th>
              <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">المدة</th>
              <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الحالة</th>
              <th class="px-6 py-4 text-right text-sm font-bold text-gray-700">الإجراءات</th>
            </tr>
          </thead>
          <tbody id="leavesTableBody">
            <tr>
              <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>جاري تحميل البيانات...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Add Leave Modal -->
  <div id="addLeaveModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800">طلب إجازة جديد</h2>
        <button onclick="closeAddLeaveModal()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <form id="leaveForm" onsubmit="submitLeave(event)">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">الموظف *</label>
            <select name="employee_id" required class="w-full border border-gray-300 rounded-lg px-4 py-2">
              <option value="">اختر الموظف</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">نوع الإجازة *</label>
            <select name="leave_type" required class="w-full border border-gray-300 rounded-lg px-4 py-2">
              <option value="annual">إجازة سنوية</option>
              <option value="sick">إجازة مرضية</option>
              <option value="emergency">إجازة طارئة</option>
              <option value="unpaid">إجازة بدون راتب</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">من تاريخ *</label>
              <input type="date" name="start_date" required class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">إلى تاريخ *</label>
              <input type="date" name="end_date" required class="w-full border border-gray-300 rounded-lg px-4 py-2">
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">السبب *</label>
            <textarea name="reason" required rows="3" class="w-full border border-gray-300 rounded-lg px-4 py-2"></textarea>
          </div>

          <div class="flex gap-4 pt-4">
            <button type="submit" class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
              <i class="fas fa-check ml-2"></i>
              تقديم الطلب
            </button>
            <button type="button" onclick="closeAddLeaveModal()" class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400 transition">
              إلغاء
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <script>
    let leaves = [];
    let employees = [];

    async function loadLeaves() {
      try {
        const statusFilter = document.getElementById('statusFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const employeeFilter = document.getElementById('employeeFilter').value;

        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        if (typeFilter) params.append('type', typeFilter);
        if (employeeFilter) params.append('employee_id', employeeFilter);

        const response = await axios.get('/api/hr/leaves?' + params.toString());
        leaves = response.data.data || [];

        updateStatistics();
        renderLeavesTable();
      } catch (error) {
        console.error('Error loading leaves:', error);
        alert('حدث خطأ في تحميل البيانات');
      }
    }

    function updateStatistics() {
      document.getElementById('totalLeaves').textContent = leaves.length;
      document.getElementById('pendingLeaves').textContent = leaves.filter(l => l.status === 'pending').length;
      document.getElementById('approvedLeaves').textContent = leaves.filter(l => l.status === 'approved').length;
      document.getElementById('rejectedLeaves').textContent = leaves.filter(l => l.status === 'rejected').length;
    }

    function renderLeavesTable() {
      const tbody = document.getElementById('leavesTableBody');
      
      if (leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">لا توجد بيانات</td></tr>';
        return;
      }

      const typeMap = {
        'annual': 'إجازة سنوية',
        'sick': 'إجازة مرضية',
        'emergency': 'إجازة طارئة',
        'unpaid': 'إجازة بدون راتب'
      };

      tbody.innerHTML = leaves.map(leave => {
        const statusColors = {
          'pending': 'bg-yellow-100 text-yellow-800',
          'approved': 'bg-green-100 text-green-800',
          'rejected': 'bg-red-100 text-red-800'
        };

        const statusLabels = {
          'pending': 'قيد الانتظار',
          'approved': 'مقبولة',
          'rejected': 'مرفوضة'
        };

        const days = Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1;

        return \`
          <tr class="border-t hover:bg-gray-50">
            <td class="px-6 py-4">\${leave.employee_name || 'غير محدد'}</td>
            <td class="px-6 py-4">\${typeMap[leave.leave_type] || leave.leave_type}</td>
            <td class="px-6 py-4">\${new Date(leave.start_date).toLocaleDateString('ar-SA')}</td>
            <td class="px-6 py-4">\${new Date(leave.end_date).toLocaleDateString('ar-SA')}</td>
            <td class="px-6 py-4">\${days} يوم</td>
            <td class="px-6 py-4">
              <span class="px-3 py-1 rounded-full text-xs font-bold \${statusColors[leave.status]}">
                \${statusLabels[leave.status]}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex gap-2">
                \${leave.status === 'pending' ? \`
                  <button onclick="approveLeave(\${leave.id})" class="text-green-600 hover:text-green-800" title="قبول">
                    <i class="fas fa-check-circle"></i>
                  </button>
                  <button onclick="rejectLeave(\${leave.id})" class="text-red-600 hover:text-red-800" title="رفض">
                    <i class="fas fa-times-circle"></i>
                  </button>
                \` : ''}
                <button onclick="deleteLeave(\${leave.id})" class="text-gray-600 hover:text-gray-800" title="حذف">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        \`;
      }).join('');
    }

    async function loadEmployees() {
      try {
        const response = await axios.get('/api/hr/employees');
        employees = response.data.data || [];

        // Fill employee filter
        const employeeFilter = document.getElementById('employeeFilter');
        employeeFilter.innerHTML = '<option value="">جميع الموظفين</option>' +
          employees.map(emp => \`<option value="\${emp.id}">\${emp.full_name}</option>\`).join('');

        // Fill employee select in form
        const employeeSelect = document.querySelector('select[name="employee_id"]');
        employeeSelect.innerHTML = '<option value="">اختر الموظف</option>' +
          employees.map(emp => \`<option value="\${emp.id}">\${emp.full_name}</option>\`).join('');
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    }

    function showAddLeaveModal() {
      document.getElementById('addLeaveModal').classList.remove('hidden');
    }

    function closeAddLeaveModal() {
      document.getElementById('addLeaveModal').classList.add('hidden');
      document.getElementById('leaveForm').reset();
    }

    async function submitLeave(event) {
      event.preventDefault();
      const formData = new FormData(event.target);
      const data = Object.fromEntries(formData);

      try {
        await axios.post('/api/hr/leaves', data);
        alert('تم تقديم الطلب بنجاح');
        closeAddLeaveModal();
        loadLeaves();
      } catch (error) {
        console.error('Error submitting leave:', error);
        alert('حدث خطأ في تقديم الطلب');
      }
    }

    async function approveLeave(id) {
      if (!confirm('هل أنت متأكد من قبول هذا الطلب؟')) return;

      try {
        await axios.put(\`/api/hr/leaves/\${id}/approve\`);
        alert('تم قبول الطلب بنجاح');
        loadLeaves();
      } catch (error) {
        console.error('Error approving leave:', error);
        alert('حدث خطأ في قبول الطلب');
      }
    }

    async function rejectLeave(id) {
      const reason = prompt('سبب الرفض:');
      if (!reason) return;

      try {
        await axios.put(\`/api/hr/leaves/\${id}/reject\`, { reason });
        alert('تم رفض الطلب');
        loadLeaves();
      } catch (error) {
        console.error('Error rejecting leave:', error);
        alert('حدث خطأ في رفض الطلب');
      }
    }

    async function deleteLeave(id) {
      if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

      try {
        await axios.delete(\`/api/hr/leaves/\${id}\`);
        alert('تم الحذف بنجاح');
        loadLeaves();
      } catch (error) {
        console.error('Error deleting leave:', error);
        alert('حدث خطأ في الحذف');
      }
    }

    // Load data on page load
    window.addEventListener('load', () => {
      loadEmployees();
      loadLeaves();
    });
  </script>
</body>
</html>
`

// صفحة الرواتب - Salaries Page
export const hrSalariesPage = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إدارة الرواتب - نظام الموارد البشرية</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-gradient-to-r from-green-600 to-teal-600 text-white py-6 px-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a href="/admin/hr" class="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <i class="fas fa-arrow-right text-xl"></i>
          </a>
          <div>
            <h1 class="text-2xl font-bold">إدارة الرواتب</h1>
            <p class="text-green-100 text-sm">رواتب الموظفين والاستحقاقات</p>
          </div>
        </div>
        <button onclick="showAddSalaryModal()" class="bg-white text-green-600 px-6 py-2 rounded-lg font-bold hover:bg-green-50 transition">
          <i class="fas fa-plus ml-2"></i>
          إضافة راتب جديد
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="p-8">
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">الموظف</label>
            <select id="filterEmployee" onchange="loadSalaries()" class="w-full border-gray-300 rounded-lg">
              <option value="">الكل</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">الشهر</label>
            <input type="month" id="filterMonth" onchange="loadSalaries()" class="w-full border-gray-300 rounded-lg">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
            <select id="filterStatus" onchange="loadSalaries()" class="w-full border-gray-300 rounded-lg">
              <option value="">الكل</option>
              <option value="pending">معلق</option>
              <option value="approved">مُعتمد</option>
              <option value="paid">مدفوع</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Salaries Table -->
      <div class="bg-white rounded-xl shadow-md overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الشهر</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الراتب الأساسي</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البدلات</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الخصومات</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الصافي</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
            </tr>
          </thead>
          <tbody id="salariesTableBody" class="bg-white divide-y divide-gray-200">
            <tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">جارٍ التحميل...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Salary Modal -->
    <div id="addSalaryModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
        <div class="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-4 rounded-t-xl">
          <h3 class="text-xl font-bold">إضافة راتب جديد</h3>
        </div>
        <form id="addSalaryForm" class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الموظف *</label>
              <select name="employee_id" required class="w-full border-gray-300 rounded-lg">
                <option value="">اختر الموظف</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الشهر *</label>
              <input type="month" name="salary_month" required class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الراتب الأساسي *</label>
              <input type="number" name="basic_salary" step="0.01" required class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">بدل السكن</label>
              <input type="number" name="housing_allowance" step="0.01" value="0" class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">بدل النقل</label>
              <input type="number" name="transportation_allowance" step="0.01" value="0" class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">بدلات أخرى</label>
              <input type="number" name="other_allowances" step="0.01" value="0" class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">التأمينات</label>
              <input type="number" name="insurance_deduction" step="0.01" value="0" class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">خصومات أخرى</label>
              <input type="number" name="other_deductions" step="0.01" value="0" class="w-full border-gray-300 rounded-lg">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
            <textarea name="notes" rows="3" class="w-full border-gray-300 rounded-lg"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" onclick="hideAddSalaryModal()" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">إلغاء</button>
            <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">حفظ الراتب</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script>
    let employees = [];
    
    function showAddSalaryModal() {
      document.getElementById('addSalaryModal').classList.remove('hidden');
    }
    
    function hideAddSalaryModal() {
      document.getElementById('addSalaryModal').classList.add('hidden');
      document.getElementById('addSalaryForm').reset();
    }
    
    async function loadEmployees() {
      try {
        const res = await axios.get('/api/hr/employees');
        employees = res.data.data || [];
        
        const selects = document.querySelectorAll('select[name="employee_id"], #filterEmployee');
        selects.forEach(select => {
          if (select.id !== 'filterEmployee') {
            select.innerHTML = '<option value="">اختر الموظف</option>';
          } else {
            select.innerHTML = '<option value="">الكل</option>';
          }
          employees.forEach(emp => {
            select.innerHTML += \`<option value="\${emp.id}">\${emp.full_name}</option>\`;
          });
        });
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    }
    
    async function loadSalaries() {
      try {
        const employeeId = document.getElementById('filterEmployee').value;
        const month = document.getElementById('filterMonth').value;
        const status = document.getElementById('filterStatus').value;
        
        let url = '/api/hr/salaries?';
        if (employeeId) url += \`employee_id=\${employeeId}&\`;
        if (month) url += \`month=\${month}&\`;
        if (status) url += \`status=\${status}&\`;
        
        const res = await axios.get(url);
        const salaries = res.data.data || [];
        
        const tbody = document.getElementById('salariesTableBody');
        if (salaries.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">لا توجد رواتب</td></tr>';
          return;
        }
        
        tbody.innerHTML = salaries.map(salary => {
          const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-blue-100 text-blue-800',
            paid: 'bg-green-100 text-green-800'
          };
          const statusLabels = {
            pending: 'معلق',
            approved: 'مُعتمد',
            paid: 'مدفوع'
          };
          
          return \`
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">\${salary.employee_name || 'غير محدد'}</td>
              <td class="px-6 py-4 whitespace-nowrap">\${salary.salary_month}</td>
              <td class="px-6 py-4 whitespace-nowrap">\${salary.basic_salary.toLocaleString()} ر.س</td>
              <td class="px-6 py-4 whitespace-nowrap">\${salary.gross_salary - basic_salary.toLocaleString()} ر.س</td>
              <td class="px-6 py-4 whitespace-nowrap">\${salary.total_deductions.toLocaleString()} ر.س</td>
              <td class="px-6 py-4 whitespace-nowrap font-bold">\${salary.net_salary.toLocaleString()} ر.س</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 rounded-full text-xs \${statusColors[salary.payment_status] || 'bg-gray-100 text-gray-800'}">
                  \${statusLabels[salary.payment_status] || salary.payment_status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                \${salary.payment_status === 'pending' ? \`
                  <button onclick="approveSalary(\${salary.id})" class="text-blue-600 hover:text-blue-800 ml-3" title="اعتماد">
                    <i class="fas fa-check"></i>
                  </button>
                \` : ''}
                \${salary.payment_status === 'approved' ? \`
                  <button onclick="paySalary(\${salary.id})" class="text-green-600 hover:text-green-800 ml-3" title="دفع">
                    <i class="fas fa-money-bill"></i>
                  </button>
                \` : ''}
                <button onclick="deleteSalary(\${salary.id})" class="text-red-600 hover:text-red-800" title="حذف">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          \`;
        }).join('');
      } catch (error) {
        console.error('Error loading salaries:', error);
      }
    }
    
    document.getElementById('addSalaryForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      try {
        await axios.post('/api/hr/salaries', data);
        alert('تم إضافة الراتب بنجاح');
        hideAddSalaryModal();
        loadSalaries();
      } catch (error) {
        console.error('Error adding salary:', error);
        alert('حدث خطأ في الإضافة');
      }
    });
    
    async function approveSalary(id) {
      if (!confirm('هل أنت متأكد من اعتماد هذا الراتب؟')) return;
      try {
        await axios.put(\`/api/hr/salaries/\${id}/approve\`);
        alert('تم الاعتماد بنجاح');
        loadSalaries();
      } catch (error) {
        console.error('Error approving:', error);
        alert('حدث خطأ');
      }
    }
    
    async function paySalary(id) {
      if (!confirm('هل أنت متأكد من دفع هذا الراتب؟')) return;
      try {
        await axios.put(\`/api/hr/salaries/\${id}/pay\`);
        alert('تم الدفع بنجاح');
        loadSalaries();
      } catch (error) {
        console.error('Error paying:', error);
        alert('حدث خطأ');
      }
    }
    
    async function deleteSalary(id) {
      if (!confirm('هل أنت متأكد من حذف هذا الراتب؟')) return;
      try {
        await axios.delete(\`/api/hr/salaries/\${id}\`);
        alert('تم الحذف بنجاح');
        loadSalaries();
      } catch (error) {
        console.error('Error deleting:', error);
        alert('حدث خطأ');
      }
    }
    
    window.addEventListener('load', () => {
      loadEmployees();
      loadSalaries();
    });
  </script>
</body>
</html>
`

// صفحة الأقسام - Departments Page
export const hrDepartmentsPage = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إدارة الأقسام - نظام الموارد البشرية</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 px-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a href="/admin/hr" class="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <i class="fas fa-arrow-right text-xl"></i>
          </a>
          <div>
            <h1 class="text-2xl font-bold">إدارة الأقسام</h1>
            <p class="text-purple-100 text-sm">أقسام الشركة والموظفين</p>
          </div>
        </div>
        <button onclick="showAddDepartmentModal()" class="bg-white text-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-purple-50 transition">
          <i class="fas fa-plus ml-2"></i>
          إضافة قسم جديد
        </button>
      </div>
    </div>

    <!-- Departments Grid -->
    <div class="p-8">
      <div id="departmentsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl shadow-md p-6 text-center">جارٍ التحميل...</div>
      </div>
    </div>

    <!-- Add Department Modal -->
    <div id="addDepartmentModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-t-xl">
          <h3 class="text-xl font-bold">إضافة قسم جديد</h3>
        </div>
        <form id="addDepartmentForm" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">اسم القسم *</label>
            <input type="text" name="department_name" required class="w-full border-gray-300 rounded-lg">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">رمز القسم *</label>
            <input type="text" name="department_code" required class="w-full border-gray-300 rounded-lg">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">مدير القسم</label>
            <select name="manager_id" class="w-full border-gray-300 rounded-lg">
              <option value="">بدون مدير</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">الميزانية</label>
            <input type="number" name="budget" step="0.01" value="0" class="w-full border-gray-300 rounded-lg">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
            <textarea name="description" rows="3" class="w-full border-gray-300 rounded-lg"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" onclick="hideAddDepartmentModal()" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">إلغاء</button>
            <button type="submit" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">حفظ القسم</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script>
    let employees = [];
    
    function showAddDepartmentModal() {
      document.getElementById('addDepartmentModal').classList.remove('hidden');
    }
    
    function hideAddDepartmentModal() {
      document.getElementById('addDepartmentModal').classList.add('hidden');
      document.getElementById('addDepartmentForm').reset();
    }
    
    async function loadEmployees() {
      try {
        const res = await axios.get('/api/hr/employees');
        employees = res.data.data || [];
        
        const select = document.querySelector('select[name="manager_id"]');
        select.innerHTML = '<option value="">بدون مدير</option>';
        employees.forEach(emp => {
          select.innerHTML += \`<option value="\${emp.id}">\${emp.full_name}</option>\`;
        });
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    }
    
    async function loadDepartments() {
      try {
        const res = await axios.get('/api/hr/departments');
        const departments = res.data.data || [];
        
        const grid = document.getElementById('departmentsGrid');
        if (departments.length === 0) {
          grid.innerHTML = '<div class="col-span-full text-center text-gray-500 p-8">لا توجد أقسام</div>';
          return;
        }
        
        grid.innerHTML = departments.map(dept => \`
          <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="bg-purple-100 p-3 rounded-full">
                  <i class="fas fa-building text-purple-600 text-xl"></i>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-800">\${dept.department_name}</h3>
                  <p class="text-sm text-gray-500">\${dept.department_code}</p>
                </div>
              </div>
              <button onclick="deleteDepartment(\${dept.id})" class="text-red-600 hover:text-red-800" title="حذف">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">المدير:</span>
                <span class="font-medium">\${dept.manager_name || 'غير محدد'}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">عدد الموظفين:</span>
                <span class="font-bold text-purple-600">\${dept.employee_count || 0}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-600">الميزانية:</span>
                <span class="font-medium">\${dept.budget ? dept.budget.toLocaleString() + ' ر.س' : '0 ر.س'}</span>
              </div>
            </div>
            \${dept.description ? \`<p class="mt-3 text-sm text-gray-600 border-t pt-3">\${dept.description}</p>\` : ''}
          </div>
        \`).join('');
      } catch (error) {
        console.error('Error loading departments:', error);
      }
    }
    
    document.getElementById('addDepartmentForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      try {
        await axios.post('/api/hr/departments', data);
        alert('تم إضافة القسم بنجاح');
        hideAddDepartmentModal();
        loadDepartments();
      } catch (error) {
        console.error('Error adding department:', error);
        alert('حدث خطأ في الإضافة');
      }
    });
    
    async function deleteDepartment(id) {
      if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
      try {
        await axios.delete(\`/api/hr/departments/\${id}\`);
        alert('تم الحذف بنجاح');
        loadDepartments();
      } catch (error) {
        console.error('Error deleting:', error);
        alert('حدث خطأ في الحذف');
      }
    }
    
    window.addEventListener('load', () => {
      loadEmployees();
      loadDepartments();
    });
  </script>
</body>
</html>
`;

// صفحة تقييم الأداء - Performance Page
export const hrPerformancePage = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقييم الأداء - نظام الموارد البشرية</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-6 px-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a href="/admin/hr" class="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <i class="fas fa-arrow-right text-xl"></i>
          </a>
          <div>
            <h1 class="text-2xl font-bold">تقييم الأداء</h1>
            <p class="text-indigo-100 text-sm">تقييمات أداء الموظفين</p>
          </div>
        </div>
        <button onclick="showAddReviewModal()" class="bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition">
          <i class="fas fa-plus ml-2"></i>
          إضافة تقييم جديد
        </button>
      </div>
    </div>

    <!-- Reviews Table -->
    <div class="p-8">
      <div class="bg-white rounded-xl shadow-md overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المُقيّم</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفترة</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التقييم الكلي</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحضور</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجودة</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمل الجماعي</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدقة</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
            </tr>
          </thead>
          <tbody id="reviewsTableBody" class="bg-white divide-y divide-gray-200">
            <tr><td colspan="10" class="px-6 py-4 text-center text-gray-500">جارٍ التحميل...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Review Modal -->
    <div id="addReviewModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 my-8">
        <div class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-4 rounded-t-xl">
          <h3 class="text-xl font-bold">إضافة تقييم أداء جديد</h3>
        </div>
        <form id="addReviewForm" class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الموظف *</label>
              <select name="employee_id" required class="w-full border-gray-300 rounded-lg">
                <option value="">اختر الموظف</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">فترة التقييم *</label>
              <input type="text" name="review_period" required placeholder="مثال: Q1 2026" class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">تاريخ التقييم *</label>
              <input type="date" name="review_date" required class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">التقييم الكلي (1-5) *</label>
              <input type="number" name="overall_rating" min="1" max="5" required class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">تقييم الحضور (1-5)</label>
              <input type="number" name="attendance_rating" min="1" max="5" value="3" class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">تقييم الجودة (1-5)</label>
              <input type="number" name="quality_rating" min="1" max="5" value="3" class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">العمل الجماعي (1-5)</label>
              <input type="number" name="teamwork_rating" min="1" max="5" value="3" class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الدقة (1-5)</label>
              <input type="number" name="punctuality_rating" min="1" max="5" value="3" class="w-full border-gray-300 rounded-lg">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">نقاط القوة</label>
            <textarea name="strengths" rows="2" class="w-full border-gray-300 rounded-lg"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">نقاط الضعف</label>
            <textarea name="weaknesses" rows="2" class="w-full border-gray-300 rounded-lg"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">الأهداف المستقبلية</label>
            <textarea name="goals" rows="2" class="w-full border-gray-300 rounded-lg"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ملاحظات إضافية</label>
            <textarea name="comments" rows="2" class="w-full border-gray-300 rounded-lg"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" onclick="hideAddReviewModal()" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">إلغاء</button>
            <button type="submit" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">حفظ التقييم</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script>
    function showAddReviewModal() {
      document.getElementById('addReviewModal').classList.remove('hidden');
    }
    
    function hideAddReviewModal() {
      document.getElementById('addReviewModal').classList.add('hidden');
      document.getElementById('addReviewForm').reset();
    }
    
    async function loadEmployees() {
      try {
        const res = await axios.get('/api/hr/employees');
        const employees = res.data.data || [];
        
        const select = document.querySelector('select[name="employee_id"]');
        select.innerHTML = '<option value="">اختر الموظف</option>';
        employees.forEach(emp => {
          select.innerHTML += \`<option value="\${emp.id}">\${emp.full_name}</option>\`;
        });
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    }
    
    async function loadReviews() {
      try {
        const res = await axios.get('/api/hr/performance');
        const reviews = res.data.data || [];
        
        const tbody = document.getElementById('reviewsTableBody');
        if (reviews.length === 0) {
          tbody.innerHTML = '<tr><td colspan="10" class="px-6 py-4 text-center text-gray-500">لا توجد تقييمات</td></tr>';
          return;
        }
        
        tbody.innerHTML = reviews.map(review => {
          const statusColors = {
            draft: 'bg-gray-100 text-gray-800',
            submitted: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800'
          };
          const statusLabels = {
            draft: 'مسودة',
            submitted: 'مُقدم',
            approved: 'مُعتمد'
          };
          
          const ratingColor = (rating) => {
            if (rating >= 4) return 'text-green-600';
            if (rating >= 3) return 'text-blue-600';
            if (rating >= 2) return 'text-yellow-600';
            return 'text-red-600';
          };
          
          return \`
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">\${review.employee_name || 'غير محدد'}</td>
              <td class="px-6 py-4 whitespace-nowrap">\${review.reviewer_name || 'غير محدد'}</td>
              <td class="px-6 py-4 whitespace-nowrap">\${review.review_period}</td>
              <td class="px-6 py-4 whitespace-nowrap font-bold \${ratingColor(Math.round(review.overall_rating || 0))}">
                \${'★'.repeat(Math.round(review.overall_rating || 0))}\${'☆'.repeat(5 - Math.round(review.overall_rating || 0))}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">\${review.attendance_rating || review.attendance_punctuality || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap">\${review.quality_rating || review.quality_of_work || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap">\${review.teamwork_rating || review.teamwork || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap">\${review.punctuality_rating || review.attendance_punctuality || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 rounded-full text-xs \${statusColors[review.status] || 'bg-gray-100 text-gray-800'}">
                  \${statusLabels[review.status] || review.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="deleteReview(\${review.id})" class="text-red-600 hover:text-red-800" title="حذف">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          \`;
        }).join('');
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    }
    
    document.getElementById('addReviewForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      try {
        await axios.post('/api/hr/performance', data);
        alert('تم إضافة التقييم بنجاح');
        hideAddReviewModal();
        loadReviews();
      } catch (error) {
        console.error('Error adding review:', error);
        alert('حدث خطأ في الإضافة');
      }
    });
    
    async function deleteReview(id) {
      if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;
      try {
        await axios.delete(\`/api/hr/performance/\${id}\`);
        alert('تم الحذف بنجاح');
        loadReviews();
      } catch (error) {
        console.error('Error deleting:', error);
        alert('حدث خطأ في الحذف');
      }
    }
    
    window.addEventListener('load', () => {
      loadEmployees();
      loadReviews();
    });
  </script>
</body>
</html>
`;

// صفحة الترقيات - Promotions Page
export const hrPromotionsPage = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>الترقيات - نظام الموارد البشرية</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css\" rel=\"stylesheet\">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50">
  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-gradient-to-r from-orange-600 to-red-600 text-white py-6 px-8 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a href="/admin/hr" class="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <i class="fas fa-arrow-right text-xl"></i>
          </a>
          <div>
            <h1 class="text-2xl font-bold">الترقيات</h1>
            <p class="text-orange-100 text-sm">ترقيات وتطورات الموظفين</p>
          </div>
        </div>
        <button onclick="showAddPromotionModal()" class="bg-white text-orange-600 px-6 py-2 rounded-lg font-bold hover:bg-orange-50 transition">
          <i class="fas fa-plus ml-2"></i>
          إضافة ترقية جديدة
        </button>
      </div>
    </div>

    <!-- Promotions Table -->
    <div class="p-8">
      <div class="bg-white rounded-xl shadow-md overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنصب السابق</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنصب الجديد</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الراتب السابق</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الراتب الجديد</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الترقية</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
            </tr>
          </thead>
          <tbody id="promotionsTableBody" class="bg-white divide-y divide-gray-200">
            <tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">جارٍ التحميل...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Promotion Modal -->
    <div id="addPromotionModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
        <div class="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 rounded-t-xl">
          <h3 class="text-xl font-bold">إضافة ترقية جديدة</h3>
        </div>
        <form id="addPromotionForm" class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الموظف *</label>
              <select name="employee_id" required onchange="loadEmployeeInfo(this.value)" class="w-full border-gray-300 rounded-lg">
                <option value="">اختر الموظف</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">المنصب الجديد *</label>
              <input type="text" name="new_position" required class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">الراتب الجديد *</label>
              <input type="number" name="new_salary" step="0.01" required class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">تاريخ الترقية *</label>
              <input type="date" name="promotion_date" required class="w-full border-gray-300 rounded-lg">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">تاريخ السريان</label>
              <input type="date" name="effective_date" class="w-full border-gray-300 rounded-lg">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">سبب الترقية</label>
            <textarea name="reason" rows="3" class="w-full border-gray-300 rounded-lg"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button type="button" onclick="hideAddPromotionModal()" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">إلغاء</button>
            <button type="submit" class="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">حفظ الترقية</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script>
    let employees = [];
    
    function showAddPromotionModal() {
      document.getElementById('addPromotionModal').classList.remove('hidden');
    }
    
    function hideAddPromotionModal() {
      document.getElementById('addPromotionModal').classList.add('hidden');
      document.getElementById('addPromotionForm').reset();
    }
    
    async function loadEmployees() {
      try {
        const res = await axios.get('/api/hr/employees');
        employees = res.data.data || [];
        
        const select = document.querySelector('select[name="employee_id"]');
        select.innerHTML = '<option value="">اختر الموظف</option>';
        employees.forEach(emp => {
          select.innerHTML += \`<option value="\${emp.id}" data-position="\${emp.job_title}" data-salary="\${emp.basic_salary}">\${emp.full_name}</option>\`;
        });
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    }
    
    function loadEmployeeInfo(employeeId) {
      const emp = employees.find(e => e.id == employeeId);
      if (emp) {
        document.querySelector('input[name="new_salary"]').value = emp.basic_salary;
      }
    }
    
    async function loadPromotions() {
      try {
        const res = await axios.get('/api/hr/promotions');
        const promotions = res.data.data || [];
        
        const tbody = document.getElementById('promotionsTableBody');
        if (promotions.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">لا توجد ترقيات</td></tr>';
          return;
        }
        
        tbody.innerHTML = promotions.map(promo => {
          const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
          };
          const statusLabels = {
            pending: 'معلق',
            approved: 'مُعتمد',
            rejected: 'مرفوض'
          };
          
          const oldSalary = parseFloat(promo.old_salary) || 0;
          const newSalary = parseFloat(promo.new_salary) || 0;
          const salaryIncrease = newSalary - oldSalary;
          const increasePercent = oldSalary > 0 ? ((salaryIncrease / oldSalary) * 100).toFixed(1) : '0';
          
          return \`
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">\${promo.employee_name || 'غير محدد'}</td>
              <td class="px-6 py-4 whitespace-nowrap">\${promo.old_position || promo.old_job_title || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap font-medium text-blue-600">\${promo.new_position || promo.new_job_title || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap">\${oldSalary.toLocaleString()} ر.س</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-bold text-green-600">\${newSalary.toLocaleString()} ر.س</span>
                \${oldSalary > 0 ? \`<span class="text-xs text-gray-500 block">+\${increasePercent}%</span>\` : ''}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">\${promo.promotion_date || promo.effective_date || '-'}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 rounded-full text-xs \${statusColors[promo.status] || 'bg-gray-100 text-gray-800'}">
                  \${statusLabels[promo.status] || promo.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                \${promo.status === 'pending' ? \`
                  <button onclick="approvePromotion(\${promo.id})" class="text-green-600 hover:text-green-800 ml-3" title="اعتماد">
                    <i class="fas fa-check"></i>
                  </button>
                  <button onclick="rejectPromotion(\${promo.id})" class="text-red-600 hover:text-red-800 ml-3" title="رفض">
                    <i class="fas fa-times"></i>
                  </button>
                \` : ''}
                <button onclick="deletePromotion(\${promo.id})" class="text-red-600 hover:text-red-800" title="حذف">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          \`;
        }).join('');
      } catch (error) {
        console.error('Error loading promotions:', error);
      }
    }
    
    document.getElementById('addPromotionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      try {
        await axios.post('/api/hr/promotions', data);
        alert('تم إضافة الترقية بنجاح');
        hideAddPromotionModal();
        loadPromotions();
      } catch (error) {
        console.error('Error adding promotion:', error);
        alert('حدث خطأ في الإضافة');
      }
    });
    
    async function approvePromotion(id) {
      if (!confirm('هل أنت متأكد من اعتماد هذه الترقية؟')) return;
      try {
        await axios.put(\`/api/hr/promotions/\${id}/approve\`);
        alert('تم الاعتماد بنجاح');
        loadPromotions();
      } catch (error) {
        console.error('Error approving:', error);
        alert('حدث خطأ');
      }
    }
    
    async function rejectPromotion(id) {
      if (!confirm('هل أنت متأكد من رفض هذه الترقية؟')) return;
      try {
        await axios.put(\`/api/hr/promotions/\${id}/reject\`);
        alert('تم الرفض');
        loadPromotions();
      } catch (error) {
        console.error('Error rejecting:', error);
        alert('حدث خطأ');
      }
    }
    
    async function deletePromotion(id) {
      if (!confirm('هل أنت متأكد من حذف هذه الترقية؟')) return;
      try {
        await axios.delete(\`/api/hr/promotions/\${id}\`);
        alert('تم الحذف بنجاح');
        loadPromotions();
      } catch (error) {
        console.error('Error deleting:', error);
        alert('حدث خطأ في الحذف');
      }
    }
    
    window.addEventListener('load', () => {
      loadEmployees();
      loadPromotions();
    });
  </script>
</body>
</html>
`;

// 8. صفحة المستندات
export const hrDocumentsPage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المستندات - نظام الموارد البشرية</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-100">
  <div class="min-h-screen">
    <!-- رأس الصفحة -->
    <div class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div>
            <a href="/admin/hr" class="text-blue-600 hover:text-blue-800 mb-2 inline-block">
              <i class="fas fa-arrow-right ml-1"></i> العودة لإدارة HR
            </a>
            <h1 class="text-3xl font-bold text-gray-800">
              <i class="fas fa-file-alt ml-2"></i>
              إدارة المستندات
            </h1>
            <p class="text-gray-600 mt-1">تتبع مستندات الموظفين وتنبيهات انتهاء الصلاحيات</p>
          </div>
          <button onclick="openAddDocumentModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
            <i class="fas fa-plus ml-2"></i>
            إضافة مستند
          </button>
        </div>
      </div>
    </div>

    <!-- تنبيهات انتهاء الصلاحيات -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div id="expiryAlerts" class="space-y-3">
        <!-- سيتم ملؤها ديناميكياً -->
      </div>
    </div>

    <!-- الإحصائيات -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">إجمالي المستندات</p>
              <p class="text-2xl font-bold text-gray-800" id="totalDocuments">0</p>
            </div>
            <i class="fas fa-file-alt text-blue-500 text-3xl"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">منتهية الصلاحية</p>
              <p class="text-2xl font-bold text-red-600" id="expiredDocuments">0</p>
            </div>
            <i class="fas fa-exclamation-circle text-red-500 text-3xl"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">تنتهي خلال 30 يوم</p>
              <p class="text-2xl font-bold text-yellow-600" id="expiringDocuments">0</p>
            </div>
            <i class="fas fa-clock text-yellow-500 text-3xl"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">سارية</p>
              <p class="text-2xl font-bold text-green-600" id="validDocuments">0</p>
            </div>
            <i class="fas fa-check-circle text-green-500 text-3xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- جدول المستندات -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-8">
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b">
          <h2 class="text-xl font-bold text-gray-800">قائمة المستندات</h2>
          
          <!-- الفلاتر -->
          <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" id="searchInput" placeholder="بحث بالموظف أو المستند..." class="border rounded-lg px-4 py-2">
            
            <select id="typeFilter" onchange="loadDocuments()" class="border rounded-lg px-4 py-2">
              <option value="">جميع الأنواع</option>
              <option value="passport">جواز السفر</option>
              <option value="id_card">بطاقة الهوية</option>
              <option value="license">رخصة القيادة</option>
              <option value="contract">عقد العمل</option>
              <option value="insurance">التأمين</option>
              <option value="other">أخرى</option>
            </select>
            
            <select id="statusFilter" onchange="loadDocuments()" class="border rounded-lg px-4 py-2">
              <option value="">جميع الحالات</option>
              <option value="valid">سارية</option>
              <option value="expiring">تنتهي قريباً</option>
              <option value="expired">منتهية</option>
            </select>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">م</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع المستند</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم المستند</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإصدار</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الانتهاء</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأيام المتبقية</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody id="documentsTableBody" class="bg-white divide-y divide-gray-200">
              <!-- سيتم ملؤها ديناميكياً -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal إضافة مستند -->
  <div id="addDocumentModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">إضافة مستند جديد</h2>
      
      <form id="addDocumentForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-700 font-bold mb-2">الموظف *</label>
            <select id="employee_id" required class="w-full border rounded-lg px-4 py-2">
              <option value="">اختر الموظف</option>
            </select>
          </div>
          
          <div>
            <label class="block text-gray-700 font-bold mb-2">نوع المستند *</label>
            <select id="document_type" required class="w-full border rounded-lg px-4 py-2">
              <option value="">اختر النوع</option>
              <option value="passport">جواز السفر</option>
              <option value="id_card">بطاقة الهوية</option>
              <option value="license">رخصة القيادة</option>
              <option value="contract">عقد العمل</option>
              <option value="insurance">التأمين</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          
          <div>
            <label class="block text-gray-700 font-bold mb-2">رقم المستند *</label>
            <input type="text" id="document_number" required class="w-full border rounded-lg px-4 py-2">
          </div>
          
          <div>
            <label class="block text-gray-700 font-bold mb-2">جهة الإصدار</label>
            <input type="text" id="issuing_authority" class="w-full border rounded-lg px-4 py-2">
          </div>
          
          <div>
            <label class="block text-gray-700 font-bold mb-2">تاريخ الإصدار *</label>
            <input type="date" id="issue_date" required class="w-full border rounded-lg px-4 py-2">
          </div>
          
          <div>
            <label class="block text-gray-700 font-bold mb-2">تاريخ الانتهاء *</label>
            <input type="date" id="expiry_date" required class="w-full border rounded-lg px-4 py-2">
          </div>
        </div>
        
        <div>
          <label class="block text-gray-700 font-bold mb-2">ملاحظات</label>
          <textarea id="notes" rows="3" class="w-full border rounded-lg px-4 py-2"></textarea>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold">
            <i class="fas fa-save ml-2"></i>
            حفظ
          </button>
          <button type="button" onclick="closeAddDocumentModal()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold">
            <i class="fas fa-times ml-2"></i>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    // تحميل قائمة المستندات
    async function loadDocuments() {
      try {
        const searchTerm = document.getElementById('searchInput').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (typeFilter) params.append('type', typeFilter);
        if (statusFilter) params.append('status', statusFilter);
        
        const response = await axios.get('/api/hr/documents?' + params.toString());
        const documents = response.data.data || [];
        
        const tbody = document.getElementById('documentsTableBody');
        
        if (documents.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-gray-500">لا توجد مستندات</td></tr>';
          return;
        }
        
        tbody.innerHTML = documents.map((doc, index) => {
          const daysRemaining = calculateDaysRemaining(doc.expiry_date);
          const statusBadge = getDocumentStatusBadge(daysRemaining);
          const documentTypeName = getDocumentTypeName(doc.document_type);
          
          const daysClass = daysRemaining < 0 ? 'text-red-600' : daysRemaining < 30 ? 'text-yellow-600' : 'text-green-600';
          const daysText = daysRemaining < 0 ? 'منتهي' : daysRemaining === 0 ? 'اليوم' : daysRemaining + ' يوم';
          
          return \`
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-900">\${index + 1}</td>
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">\${doc.employee_name || 'غير محدد'}</div>
                <div class="text-sm text-gray-500">\${doc.employee_number || '-'}</div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">\${documentTypeName}</td>
              <td class="px-6 py-4 text-sm text-gray-900">\${doc.document_number || '-'}</td>
              <td class="px-6 py-4 text-sm text-gray-500">\${doc.issue_date || '-'}</td>
              <td class="px-6 py-4 text-sm text-gray-500">\${doc.expiry_date || '-'}</td>
              <td class="px-6 py-4 text-sm \${daysClass}">
                \${daysText}
              </td>
              <td class="px-6 py-4">\${statusBadge}</td>
              <td class="px-6 py-4 text-sm">
                <button onclick="deleteDocument(\${doc.id})" class="text-red-600 hover:text-red-800" title="حذف">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          \`;
        }).join('');
        
        updateStats(documents);
        updateExpiryAlerts(documents);
        
      } catch (error) {
        console.error('Error loading documents:', error);
        alert('حدث خطأ في تحميل المستندات');
      }
    }
    
    // حساب الأيام المتبقية
    function calculateDaysRemaining(expiryDate) {
      if (!expiryDate) return 999;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiry = new Date(expiryDate);
      expiry.setHours(0, 0, 0, 0);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    
    // الحصول على badge الحالة
    function getDocumentStatusBadge(daysRemaining) {
      if (daysRemaining < 0) {
        return '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">منتهية</span>';
      } else if (daysRemaining <= 30) {
        return '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">تنتهي قريباً</span>';
      } else {
        return '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">سارية</span>';
      }
    }
    
    // الحصول على اسم نوع المستند
    function getDocumentTypeName(type) {
      const types = {
        'passport': 'جواز السفر',
        'id_card': 'بطاقة الهوية',
        'license': 'رخصة القيادة',
        'contract': 'عقد العمل',
        'insurance': 'التأمين',
        'other': 'أخرى'
      };
      return types[type] || type;
    }
    
    // تحديث الإحصائيات
    function updateStats(documents) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const stats = {
        total: documents.length,
        expired: 0,
        expiring: 0,
        valid: 0
      };
      
      documents.forEach(doc => {
        const daysRemaining = calculateDaysRemaining(doc.expiry_date);
        if (daysRemaining < 0) {
          stats.expired++;
        } else if (daysRemaining <= 30) {
          stats.expiring++;
        } else {
          stats.valid++;
        }
      });
      
      document.getElementById('totalDocuments').textContent = stats.total;
      document.getElementById('expiredDocuments').textContent = stats.expired;
      document.getElementById('expiringDocuments').textContent = stats.expiring;
      document.getElementById('validDocuments').textContent = stats.valid;
    }
    
    // تحديث تنبيهات انتهاء الصلاحيات
    function updateExpiryAlerts(documents) {
      const alertsContainer = document.getElementById('expiryAlerts');
      const expiredDocs = documents.filter(doc => calculateDaysRemaining(doc.expiry_date) < 0);
      const expiringDocs = documents.filter(doc => {
        const days = calculateDaysRemaining(doc.expiry_date);
        return days >= 0 && days <= 30;
      });
      
      let alertsHTML = '';
      
      if (expiredDocs.length > 0) {
        const expiredList = expiredDocs.slice(0, 5).map(doc => 
          \`<li class="text-red-600">• \${doc.employee_name} - \${getDocumentTypeName(doc.document_type)} (\${doc.document_number})</li>\`
        ).join('');
        const moreExpired = expiredDocs.length > 5 ? \`<li class="text-red-600">• و \${expiredDocs.length - 5} مستندات أخرى...</li>\` : '';
        
        alertsHTML += \`
          <div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-exclamation-circle text-red-500 text-2xl ml-3"></i>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-red-800">مستندات منتهية الصلاحية (\${expiredDocs.length})</h3>
                <p class="text-red-700 mt-1">يرجى تجديد المستندات التالية:</p>
                <ul class="mt-2 space-y-1">
                  \${expiredList}
                  \${moreExpired}
                </ul>
              </div>
            </div>
          </div>
        \`;
      }
      
      if (expiringDocs.length > 0) {
        const expiringList = expiringDocs.slice(0, 5).map(doc => {
          const days = calculateDaysRemaining(doc.expiry_date);
          return \`<li class="text-yellow-600">• \${doc.employee_name} - \${getDocumentTypeName(doc.document_type)} (بعد \${days} يوم)</li>\`;
        }).join('');
        const moreExpiring = expiringDocs.length > 5 ? \`<li class="text-yellow-600">• و \${expiringDocs.length - 5} مستندات أخرى...</li>\` : '';
        
        alertsHTML += \`
          <div class="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-clock text-yellow-500 text-2xl ml-3"></i>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-yellow-800">مستندات تنتهي خلال 30 يوم (\${expiringDocs.length})</h3>
                <p class="text-yellow-700 mt-1">يرجى التجهيز لتجديد المستندات التالية:</p>
                <ul class="mt-2 space-y-1">
                  \${expiringList}
                  \${moreExpiring}
                </ul>
              </div>
            </div>
          </div>
        \`;
      }
      
      if (alertsHTML === '') {
        alertsHTML = \`
          <div class="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 text-2xl ml-3"></i>
              <div>
                <h3 class="text-lg font-bold text-green-800">جميع المستندات سارية</h3>
                <p class="text-green-700 mt-1">لا توجد مستندات منتهية أو تحتاج لتجديد قريب</p>
              </div>
            </div>
          </div>
        \`;
      }
      
      alertsContainer.innerHTML = alertsHTML;
    }
    
    // فتح modal إضافة مستند
    async function openAddDocumentModal() {
      // تحميل قائمة الموظفين
      try {
        const response = await axios.get('/api/hr/employees');
        const employees = response.data.data || [];
        
        const select = document.getElementById('employee_id');
        const employeeOptions = employees.map(emp => \`<option value="\${emp.id}">\${emp.full_name} (\${emp.employee_number})</option>\`).join('');
        select.innerHTML = '<option value="">اختر الموظف</option>' + employeeOptions;
        
      } catch (error) {
        console.error('Error loading employees:', error);
      }
      
      document.getElementById('addDocumentModal').classList.remove('hidden');
      document.getElementById('addDocumentModal').classList.add('flex');
    }
    
    // إغلاق modal
    function closeAddDocumentModal() {
      document.getElementById('addDocumentModal').classList.add('hidden');
      document.getElementById('addDocumentModal').classList.remove('flex');
      document.getElementById('addDocumentForm').reset();
    }
    
    // إضافة مستند
    document.getElementById('addDocumentForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        employee_id: parseInt(document.getElementById('employee_id').value),
        document_type: document.getElementById('document_type').value,
        document_number: document.getElementById('document_number').value,
        issuing_authority: document.getElementById('issuing_authority').value,
        issue_date: document.getElementById('issue_date').value,
        expiry_date: document.getElementById('expiry_date').value,
        notes: document.getElementById('notes').value
      };
      
      try {
        await axios.post('/api/hr/documents', formData);
        alert('تم إضافة المستند بنجاح');
        closeAddDocumentModal();
        loadDocuments();
      } catch (error) {
        console.error('Error adding document:', error);
        alert('حدث خطأ في إضافة المستند');
      }
    });
    
    // حذف مستند
    async function deleteDocument(id) {
      if (!confirm('هل أنت متأكد من حذف هذا المستند؟')) return;
      
      try {
        await axios.delete(\`/api/hr/documents/\${id}\`);
        alert('تم الحذف بنجاح');
        loadDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('حدث خطأ في الحذف');
      }
    }
    
    // البحث التلقائي
    document.getElementById('searchInput').addEventListener('input', () => {
      setTimeout(loadDocuments, 300);
    });
    
    // تحميل البيانات عند فتح الصفحة
    window.addEventListener('load', loadDocuments);
  </script>
</body>
</html>
`;

// 9. صفحة التقارير
export const hrReportsPage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>التقارير والإحصاءات - نظام الموارد البشرية</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-100">
  <div class="min-h-screen">
    <!-- رأس الصفحة -->
    <div class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div>
            <a href="/admin/hr" class="text-blue-600 hover:text-blue-800 mb-2 inline-block">
              <i class="fas fa-arrow-right ml-1"></i> العودة لإدارة HR
            </a>
            <h1 class="text-3xl font-bold text-gray-800">
              <i class="fas fa-chart-bar ml-2"></i>
              التقارير والإحصاءات
            </h1>
            <p class="text-gray-600 mt-1">تقارير شاملة ومفصلة عن الموارد البشرية</p>
          </div>
          <button onclick="exportReport()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
            <i class="fas fa-file-export ml-2"></i>
            تصدير التقرير
          </button>
        </div>
      </div>
    </div>

    <!-- الفلاتر -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">خيارات التقرير</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-gray-700 font-bold mb-2">نوع التقرير</label>
            <select id="reportType" onchange="loadReport()" class="w-full border rounded-lg px-4 py-2">
              <option value="overview">نظرة عامة</option>
              <option value="attendance">الحضور والغياب</option>
              <option value="leaves">الإجازات</option>
              <option value="salaries">الرواتب</option>
              <option value="performance">الأداء</option>
              <option value="turnover">معدل دوران الموظفين</option>
            </select>
          </div>
          
          <div>
            <label class="block text-gray-700 font-bold mb-2">من تاريخ</label>
            <input type="date" id="startDate" onchange="loadReport()" class="w-full border rounded-lg px-4 py-2">
          </div>
          
          <div>
            <label class="block text-gray-700 font-bold mb-2">إلى تاريخ</label>
            <input type="date" id="endDate" onchange="loadReport()" class="w-full border rounded-lg px-4 py-2">
          </div>
        </div>
      </div>
    </div>

    <!-- الإحصائيات الرئيسية -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">إجمالي الموظفين</p>
              <p class="text-2xl font-bold text-gray-800" id="totalEmployees">0</p>
            </div>
            <i class="fas fa-users text-blue-500 text-3xl"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">نسبة الحضور</p>
              <p class="text-2xl font-bold text-green-600" id="attendanceRate">0%</p>
            </div>
            <i class="fas fa-chart-line text-green-500 text-3xl"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">إجمالي الرواتب</p>
              <p class="text-2xl font-bold text-purple-600" id="totalSalaries">0</p>
            </div>
            <i class="fas fa-money-bill-wave text-purple-500 text-3xl"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">متوسط التقييم</p>
              <p class="text-2xl font-bold text-yellow-600" id="avgPerformance">0</p>
            </div>
            <i class="fas fa-star text-yellow-500 text-3xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- الرسوم البيانية -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- رسم بياني الحضور -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">معدل الحضور الشهري</h3>
          <div style="position: relative; height: 300px;">
            <canvas id="attendanceChart"></canvas>
          </div>
        </div>
        
        <!-- رسم بياني الإجازات -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">توزيع أنواع الإجازات</h3>
          <div style="position: relative; height: 300px;">
            <canvas id="leavesChart"></canvas>
          </div>
        </div>
        
        <!-- رسم بياني الرواتب -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">توزيع الرواتب حسب القسم</h3>
          <div style="position: relative; height: 300px;">
            <canvas id="salariesChart"></canvas>
          </div>
        </div>
        
        <!-- رسم بياني الأداء -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">توزيع تقييمات الأداء</h3>
          <div style="position: relative; height: 300px;">
            <canvas id="performanceChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- جداول تفصيلية -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-8">
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b">
          <h2 class="text-xl font-bold text-gray-800">البيانات التفصيلية</h2>
        </div>
        
        <div class="overflow-x-auto">
          <div id="reportDetails" class="p-6">
            <!-- سيتم ملؤها ديناميكياً -->
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let charts = {};
    
    // تحميل التقرير
    async function loadReport() {
      try {
        const reportType = document.getElementById('reportType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        const response = await axios.get(\`/api/hr/reports/\${reportType}?\` + params.toString());
        const data = response.data.data || {};
        
        // تحديث الإحصائيات
        updateMainStats(data);
        
        // تحديث الرسوم البيانية
        updateCharts(data);
        
        // تحديث التفاصيل
        updateReportDetails(reportType, data);
        
      } catch (error) {
        console.error('Error loading report:', error);
        alert('حدث خطأ في تحميل التقرير');
      }
    }
    
    // تحديث الإحصائيات الرئيسية
    function updateMainStats(data) {
      document.getElementById('totalEmployees').textContent = data.totalEmployees || 0;
      document.getElementById('attendanceRate').textContent = (data.attendanceRate || 0) + '%';
      document.getElementById('totalSalaries').textContent = (data.totalSalaries || 0).toLocaleString() + ' ر.س';
      document.getElementById('avgPerformance').textContent = (data.avgPerformance || 0).toFixed(1);
    }
    
    // تحديث الرسوم البيانية
    function updateCharts(data) {
      // رسم بياني الحضور
      if (charts.attendance) charts.attendance.destroy();
      const attendanceCtx = document.getElementById('attendanceChart').getContext('2d');
      charts.attendance = new Chart(attendanceCtx, {
        type: 'line',
        data: {
          labels: data.attendanceLabels || [],
          datasets: [{
            label: 'نسبة الحضور',
            data: data.attendanceData || [],
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
      
      // رسم بياني الإجازات
      if (charts.leaves) charts.leaves.destroy();
      const leavesCtx = document.getElementById('leavesChart').getContext('2d');
      charts.leaves = new Chart(leavesCtx, {
        type: 'doughnut',
        data: {
          labels: data.leavesLabels || [],
          datasets: [{
            data: data.leavesData || [],
            backgroundColor: [
              'rgb(59, 130, 246)',
              'rgb(234, 179, 8)',
              'rgb(239, 68, 68)',
              'rgb(168, 85, 247)',
              'rgb(34, 197, 94)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
      
      // رسم بياني الرواتب
      if (charts.salaries) charts.salaries.destroy();
      const salariesCtx = document.getElementById('salariesChart').getContext('2d');
      charts.salaries = new Chart(salariesCtx, {
        type: 'bar',
        data: {
          labels: data.salariesLabels || [],
          datasets: [{
            label: 'إجمالي الرواتب (ر.س)',
            data: data.salariesData || [],
            backgroundColor: 'rgba(168, 85, 247, 0.5)',
            borderColor: 'rgb(168, 85, 247)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      
      // رسم بياني الأداء
      if (charts.performance) charts.performance.destroy();
      const performanceCtx = document.getElementById('performanceChart').getContext('2d');
      charts.performance = new Chart(performanceCtx, {
        type: 'pie',
        data: {
          labels: data.performanceLabels || [],
          datasets: [{
            data: data.performanceData || [],
            backgroundColor: [
              'rgb(34, 197, 94)',
              'rgb(234, 179, 8)',
              'rgb(239, 68, 68)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
    
    // تحديث التفاصيل
    function updateReportDetails(reportType, data) {
      const detailsContainer = document.getElementById('reportDetails');
      
      let detailsHTML = '<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr>';
      
      switch(reportType) {
        case 'overview':
          detailsHTML += \`
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">القسم</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد الموظفين</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نسبة الحضور</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجمالي الرواتب</th>
          \`;
          break;
        case 'attendance':
          detailsHTML += \`
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحاضرون</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الغائبون</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المتأخرون</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النسبة</th>
          \`;
          break;
      }
      
      detailsHTML += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
      
      if (data.details && data.details.length > 0) {
        detailsHTML += data.details.map(row => {
          let rowHTML = '<tr>';
          Object.values(row).forEach(value => {
            rowHTML += '<td class="px-6 py-4 text-sm text-gray-900">' + value + '</td>';
          });
          rowHTML += '</tr>';
          return rowHTML;
        }).join('');
      } else {
        detailsHTML += '<tr><td colspan="10" class="text-center py-8 text-gray-500">لا توجد بيانات</td></tr>';
      }
      
      detailsHTML += '</tbody></table></div>';
      
      detailsContainer.innerHTML = detailsHTML;
    }
    
    // تصدير التقرير
    function exportReport() {
      alert('سيتم تصدير التقرير قريباً');
    }
    
    // تعيين التواريخ الافتراضية
    function setDefaultDates() {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      document.getElementById('startDate').valueAsDate = firstDayOfMonth;
      document.getElementById('endDate').valueAsDate = today;
    }
    
    // تحميل البيانات عند فتح الصفحة
    window.addEventListener('load', () => {
      setDefaultDates();
      loadReport();
    });
  </script>
</body>
</html>
`;
