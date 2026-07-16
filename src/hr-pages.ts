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
  <link rel="stylesheet" href="/tailwind.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50">
  <div class="border-b border-slate-200/90 bg-white/90">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 py-1.5">
      <a href="/admin/panel" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 decoration-blue-400/50">← العودة للوحة الرئيسية</a>
    </div>
  </div>
  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6 px-8 shadow-lg">
      <div class="flex items-center gap-4 w-full flex-wrap">
        <div class="min-w-0">
          <h1 class="text-2xl font-bold">إدارة الإجازات</h1>
          <p class="text-blue-100 text-sm">طلبات الإجازات والموافقات</p>
        </div>
        <a href="/admin/hr" class="text-white hover:bg-white/20 p-2 rounded-lg transition shrink-0" aria-label="العودة لـ HR">
          <i class="fas fa-arrow-right text-xl"></i>
        </a>
        <div class="ms-auto shrink-0">
          <button onclick="showAddLeaveModal()" class="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition">
            <i class="fas fa-plus ml-2"></i>
            طلب إجازة جديد
          </button>
        </div>
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
  <link rel="stylesheet" href="/tailwind.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50">
  <div class="border-b border-slate-200/90 bg-white/90">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 py-1.5">
      <a href="/admin/panel" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 decoration-blue-400/50">← العودة للوحة الرئيسية</a>
    </div>
  </div>

  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-gradient-to-r from-green-600 to-teal-600 text-white py-6 px-8 shadow-lg">
      <div class="flex items-center gap-4 w-full flex-wrap">
        <div class="min-w-0">
          <h1 class="text-2xl font-bold">إدارة الرواتب</h1>
          <p class="text-green-100 text-sm">رواتب الموظفين والاستحقاقات</p>
        </div>
        <a href="/admin/hr" class="text-white hover:bg-white/20 p-2 rounded-lg transition shrink-0" aria-label="العودة لـ HR">
          <i class="fas fa-arrow-right text-xl"></i>
        </a>
        <div class="ms-auto shrink-0">
          <button onclick="showAddSalaryModal()" class="bg-white text-green-600 px-6 py-2 rounded-lg font-bold hover:bg-green-50 transition">
            <i class="fas fa-plus ml-2"></i>
            إضافة راتب جديد
          </button>
        </div>
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
          
          const allowances = (salary.gross_salary || 0) - (salary.basic_salary || 0);
          return \`
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">\${salary.employee_name || 'غير محدد'}</td>
              <td class="px-6 py-4 whitespace-nowrap">\${salary.salary_month}</td>
              <td class="px-6 py-4 whitespace-nowrap">\${(salary.basic_salary || 0).toLocaleString()} ر.س</td>
              <td class="px-6 py-4 whitespace-nowrap">\${allowances.toLocaleString()} ر.س</td>
              <td class="px-6 py-4 whitespace-nowrap">\${(salary.total_deductions || 0).toLocaleString()} ر.س</td>
              <td class="px-6 py-4 whitespace-nowrap font-bold">\${(salary.net_salary || 0).toLocaleString()} ر.س</td>
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
        const tbody = document.getElementById('salariesTableBody');
        if (tbody) {
          tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-red-500">حدث خطأ في تحميل الرواتب. يرجى المحاولة مرة أخرى.</td></tr>';
        }
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
  <link rel="stylesheet" href="/tailwind.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50">
  <div class="border-b border-slate-200/90 bg-white/90">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 py-1.5">
      <a href="/admin/panel" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 decoration-blue-400/50">← العودة للوحة الرئيسية</a>
    </div>
  </div>

  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 px-8 shadow-lg">
      <div class="flex items-center gap-4 w-full flex-wrap">
        <div class="min-w-0">
          <h1 class="text-2xl font-bold">إدارة الأقسام</h1>
          <p class="text-purple-100 text-sm">أقسام الشركة والموظفين</p>
        </div>
        <a href="/admin/hr" class="text-white hover:bg-white/20 p-2 rounded-lg transition shrink-0" aria-label="العودة لـ HR">
          <i class="fas fa-arrow-right text-xl"></i>
        </a>
        <div class="ms-auto shrink-0">
          <button onclick="showAddDepartmentModal()" class="bg-white text-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-purple-50 transition">
            <i class="fas fa-plus ml-2"></i>
            إضافة قسم جديد
          </button>
        </div>
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
  <link rel="stylesheet" href="/tailwind.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-50">
  <div class="border-b border-slate-200/90 bg-white/90">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 py-1.5">
      <a href="/admin/panel" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 decoration-blue-400/50">← العودة للوحة الرئيسية</a>
    </div>
  </div>

  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-6 px-8 shadow-lg">
      <div class="flex items-center gap-4 w-full flex-wrap">
        <div class="min-w-0">
          <h1 class="text-2xl font-bold">تقييم الأداء</h1>
          <p class="text-indigo-100 text-sm">تقييمات أداء الموظفين</p>
        </div>
        <a href="/admin/hr" class="text-white hover:bg-white/20 p-2 rounded-lg transition shrink-0" aria-label="العودة لـ HR">
          <i class="fas fa-arrow-right text-xl"></i>
        </a>
        <div class="ms-auto shrink-0">
          <button onclick="showAddReviewModal()" class="bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition">
            <i class="fas fa-plus ml-2"></i>
            إضافة تقييم جديد
          </button>
        </div>
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
  <link rel="stylesheet" href="/tailwind.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css\" rel=\"stylesheet\">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50">
  <div class="border-b border-slate-200/90 bg-white/90">
    <div class="max-w-7xl mx-auto px-6 sm:px-8 py-1.5">
      <a href="/admin/panel" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 decoration-blue-400/50">← العودة للوحة الرئيسية</a>
    </div>
  </div>

  <div class="min-h-screen">
    <!-- Header -->
    <div class="bg-gradient-to-r from-orange-600 to-red-600 text-white py-6 px-8 shadow-lg">
      <div class="flex items-center gap-4 w-full flex-wrap">
        <div class="min-w-0">
          <h1 class="text-2xl font-bold">الترقيات</h1>
          <p class="text-orange-100 text-sm">ترقيات وتطورات الموظفين</p>
        </div>
        <a href="/admin/hr" class="text-white hover:bg-white/20 p-2 rounded-lg transition shrink-0" aria-label="العودة لـ HR">
          <i class="fas fa-arrow-right text-xl"></i>
        </a>
        <div class="ms-auto shrink-0">
          <button onclick="showAddPromotionModal()" class="bg-white text-orange-600 px-6 py-2 rounded-lg font-bold hover:bg-orange-50 transition">
            <i class="fas fa-plus ml-2"></i>
            إضافة ترقية جديدة
          </button>
        </div>
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
    <title>مستندات الموظفين - نظام الموارد البشرية</title>
    <link rel="stylesheet" href="/tailwind.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
      #lightboxOverlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:9999; align-items:center; justify-content:center; }
      #lightboxOverlay.open { display:flex; }
      #lightboxImg { max-width:90vw; max-height:88vh; border-radius:8px; box-shadow:0 8px 40px rgba(0,0,0,0.6); }
    </style>
</head>
<body class="bg-gray-100">

  <!-- Lightbox -->
  <div id="lightboxOverlay" onclick="closeLightbox()">
    <div onclick="event.stopPropagation()" class="relative">
      <button onclick="closeLightbox()" class="absolute -top-10 left-0 text-white text-2xl hover:text-gray-300"><i class="fas fa-times"></i></button>
      <img id="lightboxImg" src="" alt="مستند الهوية">
      <a id="lightboxDownload" href="" download target="_blank" class="absolute -top-10 right-0 text-white text-sm hover:text-gray-300"><i class="fas fa-download ml-1"></i>تنزيل</a>
    </div>
  </div>

  <div class="border-b border-slate-200/90 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
      <a href="/admin/panel" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 decoration-blue-400/50">← العودة للوحة الرئيسية</a>
    </div>
  </div>

  <div class="min-h-screen">
    <div class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center gap-4 py-4">
          <div class="min-w-0 flex-1">
            <a href="/admin/hr" class="text-blue-600 hover:text-blue-800 mb-2 inline-block">
              <i class="fas fa-arrow-right ml-1"></i> العودة لإدارة HR
            </a>
            <h1 class="text-3xl font-bold text-gray-800">
              <i class="fas fa-folder-open ml-2"></i>
              مستندات الموظفين
            </h1>
          </div>
        </div>
      </div>
    </div>

    <!-- تنبيهات انتهاء الصلاحية (فقط عند وجود تنبيهات) -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div id="expiryAlerts" class="space-y-3"></div>
    </div>

    <!-- الإحصائيات -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <i class="fas fa-users text-blue-500 text-xl"></i>
          <div><p class="text-gray-500 text-xs">إجمالي الموظفين</p><p class="text-2xl font-bold text-gray-800" id="statTotal">0</p></div>
        </div>
        <div class="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <i class="fas fa-file-image text-indigo-500 text-xl"></i>
          <div><p class="text-gray-500 text-xs">رُفعت صورة</p><p class="text-2xl font-bold text-indigo-600" id="statHasDoc">0</p></div>
        </div>
        <div class="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <i class="fas fa-exclamation-circle text-red-500 text-xl"></i>
          <div><p class="text-gray-500 text-xs">منتهية</p><p class="text-2xl font-bold text-red-600" id="statExpired">0</p></div>
        </div>
        <div class="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <i class="fas fa-clock text-yellow-500 text-xl"></i>
          <div><p class="text-gray-500 text-xs">تنتهي خلال 90 يوم</p><p class="text-2xl font-bold text-yellow-600" id="statExpiring">0</p></div>
        </div>
        <div class="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <i class="fas fa-question-circle text-gray-400 text-xl"></i>
          <div><p class="text-gray-500 text-xs">لم يُرفع بعد</p><p class="text-2xl font-bold text-gray-400" id="statNoDoc">0</p></div>
        </div>
      </div>
    </div>

    <!-- جدول المستندات -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-8">
      <div class="bg-white rounded-lg shadow">
        <div class="p-5 border-b flex flex-wrap items-center gap-3">
          <h2 class="text-lg font-bold text-gray-800 flex-1">سجلات الهوية والمستندات</h2>
          <input type="text" id="searchInput" placeholder="بحث بالاسم أو الرقم..." class="border rounded-lg px-3 py-2 text-sm w-52" oninput="renderTable()">
          <select id="typeFilter" onchange="renderTable()" class="border rounded-lg px-3 py-2 text-sm">
            <option value="">جميع الأنواع</option>
            <option value="national">هوية وطنية</option>
            <option value="iqama">إقامة</option>
            <option value="missing">غير محدد</option>
          </select>
          <select id="docFilter" onchange="renderTable()" class="border rounded-lg px-3 py-2 text-sm">
            <option value="">جميع المستندات</option>
            <option value="has">رُفعت صورة</option>
            <option value="none">لم يُرفع</option>
          </select>
          <select id="statusFilter" onchange="renderTable()" class="border rounded-lg px-3 py-2 text-sm">
            <option value="">جميع الحالات</option>
            <option value="expired">منتهية</option>
            <option value="expiring">تنتهي قريباً</option>
            <option value="valid">سارية</option>
          </select>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">القسم</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع الهوية</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرقم</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الانتهاء</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستند</th>
              </tr>
            </thead>
            <tbody id="idTableBody" class="bg-white divide-y divide-gray-200">
              <tr><td colspan="7" class="text-center py-8 text-gray-400">جاري التحميل...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    let allEmployees = [];

    function openLightbox(url) {
      document.getElementById('lightboxImg').src = url;
      document.getElementById('lightboxDownload').href = url;
      document.getElementById('lightboxOverlay').classList.add('open');
    }
    function closeLightbox() {
      document.getElementById('lightboxOverlay').classList.remove('open');
      document.getElementById('lightboxImg').src = '';
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

    function daysUntil(dateStr) {
      if (!dateStr) return null;
      const today = new Date(); today.setHours(0,0,0,0);
      const d = new Date(dateStr); d.setHours(0,0,0,0);
      return Math.ceil((d - today) / 86400000);
    }

    function idStatus(emp) {
      const num = emp.id_type === 'iqama' ? emp.iqama_number : emp.national_id;
      if (!num) return 'missing';
      const expiry = emp.id_type === 'iqama' ? emp.iqama_expiry : emp.national_id_expiry;
      if (!expiry) return 'valid';
      const d = daysUntil(expiry);
      if (d < 0) return 'expired';
      if (d <= 90) return 'expiring';
      return 'valid';
    }

    function statusBadge(status) {
      if (status === 'expired') return '<span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">منتهية</span>';
      if (status === 'expiring') return '<span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">تنتهي قريباً</span>';
      if (status === 'missing') return '<span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">غير مُدخل</span>';
      return '<span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">سارية</span>';
    }

    function renderTable() {
      const search = document.getElementById('searchInput').value.trim().toLowerCase();
      const typeF = document.getElementById('typeFilter').value;
      const docF = document.getElementById('docFilter').value;
      const statusF = document.getElementById('statusFilter').value;

      const rows = allEmployees.filter(emp => {
        const name = (emp.full_name || emp.full_name_ar || '').toLowerCase();
        const num = (emp.id_type === 'iqama' ? emp.iqama_number : emp.national_id) || '';
        if (search && !name.includes(search) && !num.includes(search)) return false;
        const empType = emp.id_type || (emp.iqama_number ? 'iqama' : (emp.national_id ? 'national' : 'missing'));
        if (typeF === 'missing') { if (empType !== 'missing' && emp.national_id && emp.iqama_number) return false; if (empType !== 'missing') return false; }
        else if (typeF && empType !== typeF) return false;
        if (docF === 'has' && !emp.id_document_url) return false;
        if (docF === 'none' && emp.id_document_url) return false;
        if (statusF && idStatus(emp) !== statusF) return false;
        return true;
      });

      const tbody = document.getElementById('idTableBody');
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">لا توجد نتائج</td></tr>';
        return;
      }

      tbody.innerHTML = rows.map(emp => {
        const idType = emp.id_type || (emp.iqama_number ? 'iqama' : (emp.national_id ? 'national' : null));
        const idLabel = idType === 'iqama' ? 'إقامة' : (idType === 'national' ? 'هوية وطنية' : '<span class="text-gray-400">—</span>');
        const idNum = idType === 'iqama' ? (emp.iqama_number || '—') : (idType === 'national' ? (emp.national_id || '—') : '—');
        const expiry = idType === 'iqama' ? emp.iqama_expiry : emp.national_id_expiry;
        const days = expiry ? daysUntil(expiry) : null;
        const expiryCell = expiry
          ? (() => {
              const cls = days < 0 ? 'text-red-600 font-bold' : days <= 90 ? 'text-yellow-600 font-bold' : 'text-gray-700';
              const label = days < 0 ? \`(\${Math.abs(days)} يوم مضى)\` : days === 0 ? '(اليوم)' : \`(\${days} يوم)\`;
              return \`<span class="\${cls}">\${expiry} <span class="text-xs">\${label}</span></span>\`;
            })()
          : '<span class="text-gray-400">—</span>';
        const st = idStatus(emp);
        const docCell = emp.id_document_url
          ? \`<button onclick="openLightbox('\${emp.id_document_url.replace(/'/g,'&#39;')}')" class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"><i class="fas fa-eye"></i> عرض</button>\`
          : '<span class="text-gray-400 text-sm">—</span>';
        return \`<tr class="hover:bg-gray-50">
          <td class="px-4 py-3 text-sm font-medium text-gray-900">\${emp.full_name || emp.full_name_ar || '—'}</td>
          <td class="px-4 py-3 text-sm text-gray-600">\${emp.department || '—'}</td>
          <td class="px-4 py-3 text-sm">\${idLabel}</td>
          <td class="px-4 py-3 text-sm font-mono text-gray-800">\${idNum}</td>
          <td class="px-4 py-3 text-sm">\${expiryCell}</td>
          <td class="px-4 py-3">\${statusBadge(st)}</td>
          <td class="px-4 py-3">\${docCell}</td>
        </tr>\`;
      }).join('');
    }

    function renderAlerts() {
      const expired = allEmployees.filter(e => idStatus(e) === 'expired');
      const expiring = allEmployees.filter(e => idStatus(e) === 'expiring');
      let html = '';
      if (expired.length) {
        html += \`<div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div class="flex items-start gap-3"><i class="fas fa-exclamation-circle text-red-500 text-xl mt-0.5"></i>
          <div><h3 class="font-bold text-red-800">هويات منتهية الصلاحية (\${expired.length})</h3>
          <ul class="mt-1 space-y-0.5">\${expired.slice(0,8).map(e => \`<li class="text-red-700 text-sm">• \${e.full_name || e.full_name_ar} — \${e.id_type === 'iqama' ? 'إقامة' : 'هوية وطنية'}</li>\`).join('')}
          \${expired.length > 8 ? \`<li class="text-red-500 text-sm">و \${expired.length - 8} آخرين...</li>\` : ''}</ul></div></div></div>\`;
      }
      if (expiring.length) {
        html += \`<div class="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
          <div class="flex items-start gap-3"><i class="fas fa-clock text-yellow-500 text-xl mt-0.5"></i>
          <div><h3 class="font-bold text-yellow-800">هويات تنتهي خلال 90 يوم (\${expiring.length})</h3>
          <ul class="mt-1 space-y-0.5">\${expiring.slice(0,8).map(e => { const exp = e.id_type==='iqama'?e.iqama_expiry:e.national_id_expiry; const d = daysUntil(exp); return \`<li class="text-yellow-700 text-sm">• \${e.full_name||e.full_name_ar} — \${e.id_type==='iqama'?'إقامة':'هوية وطنية'} (تنتهي \${exp}\${d!==null?' · '+d+' يوم':''}) </li>\`; }).join('')}
          \${expiring.length > 8 ? \`<li class="text-yellow-600 text-sm">و \${expiring.length - 8} آخرين...</li>\` : ''}</ul></div></div></div>\`;
      }
      document.getElementById('expiryAlerts').innerHTML = html;
    }

    function renderStats() {
      const hasDoc = allEmployees.filter(e => e.id_document_url).length;
      const noDoc = allEmployees.filter(e => !e.id_document_url).length;
      const expired = allEmployees.filter(e => idStatus(e) === 'expired').length;
      const expiring = allEmployees.filter(e => idStatus(e) === 'expiring').length;
      document.getElementById('statTotal').textContent = allEmployees.length;
      document.getElementById('statHasDoc').textContent = hasDoc;
      document.getElementById('statExpired').textContent = expired;
      document.getElementById('statExpiring').textContent = expiring;
      document.getElementById('statNoDoc').textContent = noDoc;
    }

    async function load() {
      try {
        const res = await axios.get('/api/hr/employee-ids');
        allEmployees = res.data.data || [];
        renderStats();
        renderAlerts();
        renderTable();
      } catch(e) {
        document.getElementById('idTableBody').innerHTML = '<tr><td colspan="7" class="text-center py-8 text-red-500">حدث خطأ في تحميل البيانات</td></tr>';
      }
    }

    window.addEventListener('load', load);
    window.openLightbox = openLightbox;
    window.closeLightbox = closeLightbox;
    window.renderTable = renderTable;
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
    <link rel="stylesheet" href="/tailwind.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-100">
  <div class="border-b border-slate-200/90 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
      <a href="/admin/panel" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 decoration-blue-400/50">← العودة للوحة الرئيسية</a>
    </div>
  </div>

  <div class="min-h-screen">
    <!-- رأس الصفحة -->
    <div class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center gap-4 py-4">
          <div class="min-w-0 flex-1">
            <a href="/admin/hr" class="text-blue-600 hover:text-blue-800 mb-2 inline-block">
              <i class="fas fa-arrow-right ml-1"></i> العودة لإدارة HR
            </a>
            <h1 class="text-3xl font-bold text-gray-800">
              <i class="fas fa-chart-bar ml-2"></i>
              التقارير والإحصاءات
            </h1>
            <p class="text-gray-600 mt-1">تقارير شاملة ومفصلة عن الموارد البشرية</p>
          </div>
          <div class="ms-auto shrink-0">
            <button onclick="exportReport()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
              <i class="fas fa-file-export ml-2"></i>
              تصدير التقرير
            </button>
          </div>
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
