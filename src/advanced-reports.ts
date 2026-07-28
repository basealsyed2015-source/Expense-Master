// Advanced Reports - Customer, Requests, Performance, Financial, Banks Reports
import { REPORT_FLATPICKR_HEAD, reportFilterBarHtml, REPORT_FILTER_BASE_JS, REPORT_PRINT_CSS, reportPdfButtonHtml } from './reports-module'

// Helper: Mobile-Responsive CSS Styles
const getMobileResponsiveCSS = () => `
  /* Mobile Responsive Styles */
  @media (max-width: 768px) {
    .max-w-7xl, .max-w-6xl, .max-w-5xl {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }
    h1 { font-size: 1.5rem !important; }
    h2 { font-size: 1.25rem !important; }
    table { font-size: 0.875rem !important; }
    table th, table td { padding: 0.5rem !important; }
    .hide-on-mobile { display: none !important; }
    button, .btn { font-size: 0.875rem !important; padding: 0.5rem 1rem !important; }
    input, select, textarea { font-size: 1rem !important; }
    .bg-white.rounded-xl, .bg-white.rounded-lg { padding: 1rem !important; }
    .flex.justify-between { flex-wrap: wrap; gap: 1rem; }
    .flex-wrap > * { width: 100%; }
    input[type="text"], input[type="search"] { width: 100% !important; }
    .grid { grid-template-columns: 1fr !important; }
    .p-6 { padding: 1rem !important; }
    .p-8 { padding: 1.5rem !important; }
    .overflow-x-auto { 
      margin-left: -1rem !important; 
      margin-right: -1rem !important;
      padding-bottom: 1.5rem !important;
      position: relative !important;
    }
    
    /* Enhanced Mobile Scrollbar */
    .overflow-x-auto::-webkit-scrollbar {
      height: 14px !important;
      -webkit-appearance: none;
    }
    .overflow-x-auto::-webkit-scrollbar-track {
      background: #f1f5f9 !important;
      border-radius: 8px !important;
      border: 2px solid #e2e8f0 !important;
    }
    .overflow-x-auto::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%) !important;
      border-radius: 8px !important;
      border: 2px solid #e2e8f0 !important;
      min-width: 50px !important;
    }
    .overflow-x-auto {
      overflow-x: scroll !important;
      -webkit-overflow-scrolling: touch !important;
      scrollbar-width: auto !important;
      scrollbar-color: #3b82f6 #f1f5f9 !important;
    }
  }
  @media (max-width: 480px) {
    body { font-size: 14px !important; }
    h1 { font-size: 1.25rem !important; }
    table { font-size: 0.75rem !important; }
    button { font-size: 0.75rem !important; padding: 0.375rem 0.75rem !important; }
    .overflow-x-auto::-webkit-scrollbar { height: 16px !important; }
    .overflow-x-auto::-webkit-scrollbar-thumb { min-width: 60px !important; }
  }
`

export const customersReportPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير العملاء</title>
    <link rel="stylesheet" href="/tailwind.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <style>
        /* Custom Scrollbar - Enhanced */
        .overflow-x-auto {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #3b82f6 #f7fafc;
        }
        
        .overflow-x-auto::-webkit-scrollbar {
            height: 12px;
            width: 12px;
        }
        
        .overflow-x-auto::-webkit-scrollbar-track {
            background: #e5e7eb;
            border-radius: 10px;
            margin: 0 10px;
        }
        
        .overflow-x-auto::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
            border-radius: 10px;
            border: 2px solid #e5e7eb;
        }
        
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
            border-color: #d1d5db;
        }
        
        /* Force scrollbar to always show */
        .overflow-x-auto {
            overflow-x: scroll !important; /* Always show scrollbar */
        }
        
        .overflow-x-auto table {
            min-width: 1200px; /* Force table to be wide enough for scrollbar */
            width: max-content;
        }
        
        ${getMobileResponsiveCSS()}
        ${REPORT_PRINT_CSS}
    </style>
</head>
<body class="bg-gray-50">
    <div class="border-b border-slate-200/90 bg-white/90 no-print">
        <div class="max-w-7xl mx-auto px-6 py-1.5">
            <a href="/admin/panel" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 decoration-blue-400/50">← العودة للوحة الرئيسية</a>
        </div>
    </div>
    <div class="max-w-7xl mx-auto px-6 pt-4 pb-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-6">
                <i class="fas fa-users text-blue-600 ml-2"></i>
                تقرير العملاء الشامل
            </h1>

        <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex justify-between items-center mb-6 gap-4 flex-wrap">
                <div>
                    <h2 class="text-xl font-bold">إجمالي العملاء: <span id="totalCustomers" class="text-blue-600">0</span></h2>
                    <p class="text-gray-600 text-sm">تاريخ التقرير: <span id="reportDate"></span></p>
                </div>
                <div class="flex items-center gap-3 no-print">
                    <div class="relative">
                        <input 
                            type="text" 
                            id="searchInput" 
                            placeholder="بحث في العملاء..." 
                            class="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onkeyup="searchTable()"
                        />
                        <i class="fas fa-search absolute right-3 top-3 text-gray-400"></i>
                    </div>
                    ${reportPdfButtonHtml('bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold whitespace-nowrap flex items-center gap-2')}
                    <button onclick="exportToExcel()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold whitespace-nowrap">
                        <i class="fas fa-file-excel ml-2"></i>
                        تصدير Excel
                    </button>
                </div>
            </div>

            <div id="loading" class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                <p class="text-gray-600">جاري تحميل البيانات...</p>
            </div>

            <div id="tableContainer" class="hidden overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                        <tr>
                            <th class="px-4 py-3 text-right">#</th>
                            <th class="px-4 py-3 text-right">الاسم الكامل</th>
                            <th class="px-4 py-3 text-right">الهاتف</th>
                            <th class="px-4 py-3 text-right">البريد الإلكتروني</th>
                            <th class="px-4 py-3 text-right">نوع التوظيف</th>
                            <th class="px-4 py-3 text-right">الراتب الشهري</th>
                            <th class="px-4 py-3 text-right">الالتزامات الشهرية</th>
                            <th class="px-4 py-3 text-right">الموظف المخصص</th>
                        </tr>
                    </thead>
                    <tbody id="reportTable" class="divide-y divide-gray-200"></tbody>
                </table>
            </div>
            <div class="p-4 border-t flex items-center justify-between gap-3 flex-wrap no-print">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-gray-700 whitespace-nowrap">عدد الصفوف:</span>
                    <select id="reportPageSize" onchange="setReportPageSize(this.value)" class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"><option value="15">15</option></select>
                </div>
                <div class="flex items-center gap-2">
                    <button id="prevBtn" onclick="setReportPage('prev')" class="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold hover:bg-gray-50">السابق</button>
                    <span id="pageInfo" class="text-sm text-gray-600 whitespace-nowrap"></span>
                    <button id="nextBtn" onclick="setReportPage('next')" class="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold hover:bg-gray-50">التالي</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let reportData = [];
        const authToken = localStorage.getItem('authToken');
        const reportPaging = { page: 1, pageSize: 15, total: 0 };

        function getPageSizeOptions(total) {
            const base = [15, 30, 50, 100];
            const totalNum = Number(total) || 0;
            const options = [base[0]];
            for (let i = 1; i < base.length; i++) {
                const size = base[i];
                const prev = base[i - 1];
                if (totalNum >= size) { options.push(size); continue; }
                if (totalNum > prev) options.push(size);
                break;
            }
            return options;
        }

        function renderPaginationUI() {
            const pageSizeSelect = document.getElementById('reportPageSize');
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const info = document.getElementById('pageInfo');
            if (!pageSizeSelect || !prevBtn || !nextBtn || !info) return;

            const total = reportPaging.total;
            const options = getPageSizeOptions(total);
            if (options.indexOf(reportPaging.pageSize) === -1) reportPaging.pageSize = 15;
            pageSizeSelect.innerHTML = options
                .map((n) => '<option value="' + n + '" ' + (n === reportPaging.pageSize ? 'selected' : '') + '>' + n + '</option>')
                .join('');

            const totalPages = Math.max(1, Math.ceil(total / reportPaging.pageSize));
            reportPaging.page = Math.max(1, Math.min(reportPaging.page, totalPages));
            const start = total === 0 ? 0 : (reportPaging.page - 1) * reportPaging.pageSize + 1;
            const end = Math.min(total, reportPaging.page * reportPaging.pageSize);
            info.textContent = total === 0 ? '0 \\ 0' : (start + '-' + end + ' من ' + total);
            prevBtn.disabled = reportPaging.page <= 1;
            nextBtn.disabled = reportPaging.page >= totalPages;
            prevBtn.classList.toggle('opacity-50', prevBtn.disabled);
            nextBtn.classList.toggle('opacity-50', nextBtn.disabled);
        }

        async function loadReport(page, pageSize) {
            reportPaging.page = page || reportPaging.page;
            if (pageSize) reportPaging.pageSize = pageSize;
            document.getElementById('loading').classList.remove('hidden');
            document.getElementById('tableContainer').classList.add('hidden');
            try {
                const response = await axios.get('/api/customers', {
                    params: { page: reportPaging.page, pageSize: reportPaging.pageSize },
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });
                if (response.data.success) {
                    reportData = response.data.data || [];
                    reportPaging.total = response.data.total || reportData.length;
                    reportPaging.page = response.data.page || reportPaging.page;
                    displayReport();
                }
            } catch (error) {
                console.error('Error loading report:', error);
                alert('حدث خطأ في تحميل التقرير');
            } finally {
                document.getElementById('loading').classList.add('hidden');
            }
        }

        function displayReport() {
            document.getElementById('totalCustomers').textContent = reportPaging.total;
            document.getElementById('reportDate').textContent = new Date().toLocaleDateString('ar-SA');
            document.getElementById('tableContainer').classList.remove('hidden');

            const offset = (reportPaging.page - 1) * reportPaging.pageSize;
            const tbody = document.getElementById('reportTable');
            tbody.innerHTML = reportData.map((customer, index) => \`
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">\${offset + index + 1}</td>
                    <td class="px-4 py-3 font-medium">\${customer.full_name}</td>
                    <td class="px-4 py-3">\${customer.phone}</td>
                    <td class="px-4 py-3">\${customer.email || '-'}</td>
                    <td class="px-4 py-3">\${customer.employment_type || '-'}</td>
                    <td class="px-4 py-3">\${(customer.monthly_salary || 0).toLocaleString('ar-SA')} ريال</td>
                    <td class="px-4 py-3">\${(customer.monthly_obligations || 0).toLocaleString('ar-SA')} ريال</td>
                    <td class="px-4 py-3">\${customer.assigned_employee_name || 'غير محدد'}</td>
                </tr>
            \`).join('');

            renderPaginationUI();
        }

        window.setReportPage = function(directionOrPage) {
            let page = reportPaging.page;
            if (directionOrPage === 'prev') page -= 1;
            else if (directionOrPage === 'next') page += 1;
            else { const p = Number(directionOrPage); if (Number.isFinite(p)) page = p; }
            const totalPages = Math.max(1, Math.ceil(reportPaging.total / reportPaging.pageSize));
            page = Math.max(1, Math.min(totalPages, page));
            if (page !== reportPaging.page) loadReport(page);
        }

        window.setReportPageSize = function(value) {
            const parsed = Number(value);
            loadReport(1, Number.isFinite(parsed) && parsed > 0 ? parsed : 15);
        }

        function searchTable() {
            const searchValue = document.getElementById('searchInput').value.toLowerCase();
            const tbody = document.getElementById('reportTable');
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchValue) ? '' : 'none';
            });
        }

        window.exportToExcel = function() {
            const ws = XLSX.utils.json_to_sheet(reportData.map(c => ({
                'الاسم': c.full_name,
                'الهاتف': c.phone,
                'البريد': c.email,
                'نوع التوظيف': c.employment_type,
                'الراتب': c.monthly_salary,
                'الالتزامات': c.monthly_obligations,
                'الموظف المخصص': c.assigned_employee_name
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'العملاء');
            XLSX.writeFile(wb, 'تقرير_العملاء_' + new Date().toISOString().split('T')[0] + '.xlsx');
        }

        document.addEventListener('DOMContentLoaded', function() { loadReport(1, 15); });
    </script>
</body>
</html>`;

export const requestsReportPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير طلبات التمويل</title>
    <link rel="stylesheet" href="/tailwind.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
${REPORT_FLATPICKR_HEAD}
    <style>
        .overflow-x-auto { overflow-x: auto !important; -webkit-overflow-scrolling: touch; scrollbar-width: thin; scrollbar-color: #16A34A #f7fafc; }
        .overflow-x-auto::-webkit-scrollbar { height: 10px; }
        .overflow-x-auto::-webkit-scrollbar-track { background: #e5e7eb; border-radius: 6px; }
        .overflow-x-auto::-webkit-scrollbar-thumb { background: #16A34A; border-radius: 6px; }
        ${getMobileResponsiveCSS()}
    </style>
</head>
<body class="bg-gray-50">
    <div class="border-b border-gray-200 bg-white">
        <div class="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
            <a href="/admin/reports" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">← منظومة التقارير</a>
            <a href="/admin/panel" class="text-sm font-medium text-gray-500 hover:text-gray-800">لوحة التحكم</a>
        </div>
    </div>

    <div style="background:#16A34A" class="text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 py-6">
            <h1 class="text-3xl font-bold flex items-center">
                <i class="fas fa-file-invoice ml-3"></i>تقرير طلبات التمويل
            </h1>
            <p class="mt-1 text-sm opacity-80">إجمالي الطلبات والحالات والمبالغ حسب الفترة</p>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-6">
        ${reportFilterBarHtml('#16A34A')}

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-xl shadow-md p-5">
                <p class="text-gray-500 text-xs font-medium mb-1">إجمالي الطلبات</p>
                <p class="text-3xl font-bold text-blue-600" id="cTotal">—</p>
                <p class="text-xs text-gray-400 mt-1" id="cTotalAmt"></p>
            </div>
            <div class="bg-white rounded-xl shadow-md p-5">
                <p class="text-gray-500 text-xs font-medium mb-1">قيد المراجعة</p>
                <p class="text-3xl font-bold text-yellow-500" id="cPending">—</p>
            </div>
            <div class="bg-white rounded-xl shadow-md p-5">
                <p class="text-gray-500 text-xs font-medium mb-1">مقبول</p>
                <p class="text-3xl font-bold text-green-600" id="cApproved">—</p>
                <p class="text-xs text-gray-400 mt-1" id="cApprovedAmt"></p>
            </div>
            <div class="bg-white rounded-xl shadow-md p-5">
                <p class="text-gray-500 text-xs font-medium mb-1">مرفوض</p>
                <p class="text-3xl font-bold text-red-500" id="cRejected">—</p>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 mb-6">
            <canvas id="requestsChart" height="80"></canvas>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6">
            <div class="flex justify-between items-center mb-4 gap-4 flex-wrap">
                <h2 class="text-lg font-bold text-gray-800">تفاصيل الطلبات</h2>
                <div class="flex items-center gap-3 no-print">
                    <div class="relative">
                        <input type="text" id="searchInputRequests" placeholder="بحث..." onkeyup="searchTable()"
                            class="px-4 py-2 pr-9 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500">
                        <i class="fas fa-search absolute right-3 top-2.5 text-gray-400 text-sm"></i>
                    </div>
                    <button onclick="exportToExcel()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold">
                        <i class="fas fa-file-excel ml-1"></i>Excel
                    </button>
                </div>
            </div>
            <div id="tableLoading" class="text-center py-8 text-gray-400">جارٍ تحميل البيانات...</div>
            <div id="tableContainer" class="hidden overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-green-600 text-white">
                        <tr>
                            <th class="px-4 py-3 text-right text-sm">#</th>
                            <th class="px-4 py-3 text-right text-sm">العميل</th>
                            <th class="px-4 py-3 text-right text-sm">البنك</th>
                            <th class="px-4 py-3 text-right text-sm">المبلغ</th>
                            <th class="px-4 py-3 text-right text-sm">الحالة</th>
                            <th class="px-4 py-3 text-right text-sm">التاريخ</th>
                        </tr>
                    </thead>
                    <tbody id="reportTable"></tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        const authToken = localStorage.getItem('authToken');
        let _reportData = [], _chart = null;
        ${REPORT_FILTER_BASE_JS}

        async function loadReport() {
            const params = new URLSearchParams();
            if (_startDate) params.set('start_date', _startDate);
            if (_endDate)   params.set('end_date',   _endDate);
            document.getElementById('tableLoading').style.display = '';
            document.getElementById('tableContainer').classList.add('hidden');
            try {
                const res = await fetch('/api/reports/requests?' + params, { headers: { 'Authorization': 'Bearer ' + authToken } });
                const d = await res.json();
                if (!d.success) throw new Error(d.error);
                const s = d.summary || {};
                document.getElementById('cTotal').textContent       = n(s.total);
                document.getElementById('cPending').textContent     = n(s.pending);
                document.getElementById('cApproved').textContent    = n(s.approved);
                document.getElementById('cRejected').textContent    = n(s.rejected);
                document.getElementById('cTotalAmt').textContent    = s.total_amount    ? money(s.total_amount)    : '';
                document.getElementById('cApprovedAmt').textContent = s.approved_amount ? money(s.approved_amount) : '';
                _reportData = d.data || [];
                renderTable(_reportData);
                renderChart(s);
            } catch (e) {
                document.getElementById('tableLoading').textContent = 'فشل تحميل البيانات: ' + e.message;
                document.getElementById('tableLoading').style.display = '';
            } finally {
                document.getElementById('tableLoading').style.display = 'none';
                document.getElementById('tableContainer').classList.remove('hidden');
            }
        }

        function renderTable(data) {
            const STATUS = { pending:'قيد المراجعة', approved:'مقبول', approved_internal:'مقبول (داخلي)', approved_external:'مقبول (خارجي)', rejected:'مرفوض' };
            const COLOR  = { pending:'bg-yellow-100 text-yellow-800', approved:'bg-green-100 text-green-800', approved_internal:'bg-green-100 text-green-800', approved_external:'bg-green-100 text-green-800', rejected:'bg-red-100 text-red-800' };
            document.getElementById('reportTable').innerHTML = data.map(r => \`
                <tr class="hover:bg-gray-50 border-b">
                    <td class="px-4 py-3 text-sm text-gray-500">#\${r.id}</td>
                    <td class="px-4 py-3 font-medium text-sm">\${r.customer_name||'—'}</td>
                    <td class="px-4 py-3 text-sm">\${r.bank_name||'—'}</td>
                    <td class="px-4 py-3 text-sm">\${(r.requested_amount||0).toLocaleString('ar-SA')} ريال</td>
                    <td class="px-4 py-3"><span class="px-2 py-1 text-xs rounded-full \${COLOR[r.status]||'bg-gray-100 text-gray-800'}">\${STATUS[r.status]||r.status}</span></td>
                    <td class="px-4 py-3 text-sm">\${new Date(r.created_at).toLocaleDateString('ar-SA')}</td>
                </tr>\`).join('');
        }

        function renderChart(s) {
            const ctx = document.getElementById('requestsChart');
            if (_chart) _chart.destroy();
            _chart = new Chart(ctx, {
                type: 'bar',
                data: { labels: ['قيد المراجعة','مقبول','مرفوض'], datasets: [{ data: [s.pending||0, s.approved||0, s.rejected||0], backgroundColor: ['#EAB308','#22C55E','#EF4444'] }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

        function searchTable() {
            const q = document.getElementById('searchInputRequests').value.toLowerCase();
            document.querySelectorAll('#reportTable tr').forEach(row => { row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none'; });
        }

        window.exportToExcel = function() {
            const ws = XLSX.utils.json_to_sheet(_reportData.map(r => ({ '#': r.id, 'العميل': r.customer_name, 'البنك': r.bank_name, 'المبلغ': r.requested_amount, 'الحالة': r.status, 'التاريخ': r.created_at })));
            const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'الطلبات');
            XLSX.writeFile(wb, 'تقرير_الطلبات_' + new Date().toISOString().split('T')[0] + '.xlsx');
        }

        window.addEventListener('load', () => {
            const d = getPeriodDates('year');
            _startDate = d.s; _endDate = d.e;
            setBadge(d.label, d.range);
            initDatePicker();
            loadReport();
        });
    </script>
</body>
</html>`;

export const financialReportPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>التقرير المالي</title>
    <link rel="stylesheet" href="/tailwind.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>${REPORT_PRINT_CSS}</style>
</head>
<body class="bg-gray-50">
    <div class="border-b border-slate-200/90 bg-white/90 no-print">
        <div class="max-w-7xl mx-auto px-6 py-1.5">
            <a href="/admin/panel" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 decoration-blue-400/50">← العودة للوحة الرئيسية</a>
        </div>
    </div>
    <div class="max-w-7xl mx-auto px-6 pt-4 pb-6">
        <div class="flex justify-between items-center mb-6 gap-4 flex-wrap">
            <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-dollar-sign text-yellow-600 ml-2"></i>
                التقرير المالي
            </h1>
            ${reportPdfButtonHtml('bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2')}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
                <div class="text-sm opacity-90">إجمالي المبالغ المطلوبة</div>
                <div class="text-3xl font-bold mt-2" id="totalAmount">0 ريال</div>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
                <div class="text-sm opacity-90">المبالغ الموافق عليها</div>
                <div class="text-3xl font-bold mt-2" id="approvedAmount">0 ريال</div>
            </div>
            <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl shadow-lg p-6">
                <div class="text-sm opacity-90">إجمالي العمولات المدفوعة</div>
                <div class="text-3xl font-bold mt-2" id="commissionsAmount">0 ريال</div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <canvas id="financialChart" height="100"></canvas>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold mb-4">متوسط المبالغ</h3>
                <div class="space-y-3">
                    <div class="flex justify-between">
                        <span class="text-gray-600">متوسط المبلغ المطلوب:</span>
                        <span class="font-bold" id="avgRequested">0 ريال</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">متوسط المبلغ الموافق عليه:</span>
                        <span class="font-bold text-green-600" id="avgApproved">0 ريال</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold mb-4">معدل القبول</h3>
                <div class="text-center">
                    <div class="text-5xl font-bold text-green-600" id="approvalRate">0%</div>
                    <div class="text-gray-600 mt-2">من إجمالي الطلبات</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const authToken = localStorage.getItem('authToken');
        
        async function loadReport() {
            try {
                const [requestsRes, paymentsRes] = await Promise.all([
                    axios.get('/api/financing-requests', {
                        headers: { 'Authorization': 'Bearer ' + authToken }
                    }),
                    axios.get('/api/payments', {
                        headers: { 'Authorization': 'Bearer ' + authToken }
                    }).catch(() => ({ data: { data: [] } }))
                ]);
                
                const requests = requestsRes.data.data || [];
                const payments = paymentsRes.data.data || [];
                
                const totalAmount = requests.reduce((sum, r) => sum + (r.requested_amount || 0), 0);
                const approvedAmount = requests
                    .filter(r => r.status === 'approved' || r.status === 'approved_internal' || r.status === 'approved_external')
                    .reduce((sum, r) => sum + (r.requested_amount || 0), 0);
                const commissionsAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                
                const approvedCount = requests.filter(r => r.status === 'approved' || r.status === 'approved_internal' || r.status === 'approved_external').length;
                const approvalRate = requests.length > 0 ? ((approvedCount / requests.length) * 100).toFixed(1) : 0;
                
                document.getElementById('totalAmount').textContent = totalAmount.toLocaleString('ar-SA') + ' ريال';
                document.getElementById('approvedAmount').textContent = approvedAmount.toLocaleString('ar-SA') + ' ريال';
                document.getElementById('commissionsAmount').textContent = commissionsAmount.toLocaleString('ar-SA') + ' ريال';
                document.getElementById('avgRequested').textContent = (requests.length > 0 ? (totalAmount / requests.length) : 0).toLocaleString('ar-SA') + ' ريال';
                document.getElementById('avgApproved').textContent = (approvedCount > 0 ? (approvedAmount / approvedCount) : 0).toLocaleString('ar-SA') + ' ريال';
                document.getElementById('approvalRate').textContent = approvalRate + '%';
                
                displayChart(totalAmount, approvedAmount, commissionsAmount);
            } catch (error) {
                console.error('Error loading report:', error);
            }
        }
        
        function displayChart(total, approved, commissions) {
            const ctx = document.getElementById('financialChart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['المبالغ المطلوبة', 'الموافق عليها', 'العمولات المدفوعة'],
                    datasets: [{
                        data: [total, approved, commissions],
                        backgroundColor: ['#3b82f6', '#22c55e', '#eab308']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        document.addEventListener('DOMContentLoaded', loadReport);
    </script>
</body>
</html>`;
