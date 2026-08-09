import { REPORT_FLATPICKR_HEAD, reportFilterBarHtml, REPORT_FILTER_BASE_JS } from './reports-module'

export function buildStaffActiveTimeReportPage(): string {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>وقت النشاط للموظفين</title>
    <link rel="stylesheet" href="/tailwind.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
${REPORT_FLATPICKR_HEAD}
</head>
<body class="bg-gray-50">
    <div class="max-w-6xl mx-auto p-6">
        <div class="mb-6 no-print">
            <a href="/admin/reports" class="text-blue-600 hover:text-blue-800 mb-2 inline-block text-sm">← منظومة التقارير</a>
            <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-stopwatch text-indigo-600 ml-3"></i>
                وقت النشاط للموظفين
            </h1>
            <p class="text-gray-500 text-sm mt-2">مجموع الوقت الذي كان فيه المستخدم فعّالاً داخل المنظومة (تبويب ظاهر + تفاعل خلال آخر 5 دقائق).</p>
        </div>

        ${reportFilterBarHtml('#4F46E5', 'month')}

        <div id="loading" class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-5xl text-indigo-600"></i>
            <p class="mt-4 text-lg text-gray-600">جاري تحميل البيانات...</p>
        </div>

        <div id="content" style="display:none;">
          <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="p-4 border-b flex items-center justify-between">
              <h2 class="text-lg font-bold text-gray-800"><i class="fas fa-users ml-2"></i>الإجمالي حسب الموظف</h2>
              <span id="rangeLabel" class="text-xs text-gray-500"></span>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50 text-gray-600">
                  <tr>
                    <th class="px-4 py-3 text-right">#</th>
                    <th class="px-4 py-3 text-right">الموظف</th>
                    <th class="px-4 py-3 text-right">الدور</th>
                    <th class="px-4 py-3 text-right">إجمالي وقت النشاط</th>
                    <th class="px-4 py-3 text-right">عدد الأيام</th>
                    <th class="px-4 py-3 text-right">متوسط يومي</th>
                  </tr>
                </thead>
                <tbody id="tbody" class="divide-y divide-gray-100"></tbody>
              </table>
            </div>
          </div>
        </div>
    </div>

    <script>
      const authToken = localStorage.getItem('authToken');
      ${REPORT_FILTER_BASE_JS}

      function fmtSeconds(sec) {
        sec = Math.max(0, Math.floor(sec || 0));
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        if (h > 0) return h + 'س ' + m + 'د';
        return m + 'د';
      }

      function roleLabel(rid) {
        const r = Number(rid);
        if (r === 4 || r === 14) return 'موظف';
        if (r === 5 || r === 15) return 'ممثل بنك';
        if (r === 6) return 'موظف/ممثل بنك';
        return String(rid || '-');
      }

      async function loadReport() {
        const params = new URLSearchParams();
        if (_startDate) params.set('start_date', _startDate);
        if (_endDate)   params.set('end_date',   _endDate);
        document.getElementById('loading').style.display = 'block';
        document.getElementById('content').style.display = 'none';
        try {
          const res = await fetch('/api/reports/staff-active-time?' + params, {
            headers: { 'Authorization': 'Bearer ' + authToken }
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Failed to load report');
          const rows = data.rows || [];
          const rangeLabel = document.getElementById('rangeLabel');
          if (rangeLabel) rangeLabel.textContent = (_startDate || '') + ' — ' + (_endDate || '');
          document.getElementById('tbody').innerHTML = rows.map((r, i) => {
            const days = r.days_active || 0;
            const avg = days > 0 ? Math.floor(r.total_active_seconds / days) : 0;
            return '<tr class="hover:bg-gray-50">'
              + '<td class="px-4 py-3 text-gray-500">' + (i + 1) + '</td>'
              + '<td class="px-4 py-3 font-medium">' + (r.full_name || ('#' + r.user_id)) + '</td>'
              + '<td class="px-4 py-3 text-gray-600">' + roleLabel(r.role_id) + '</td>'
              + '<td class="px-4 py-3 font-bold text-indigo-700">' + fmtSeconds(r.total_active_seconds) + '</td>'
              + '<td class="px-4 py-3">' + days + '</td>'
              + '<td class="px-4 py-3 text-gray-700">' + fmtSeconds(avg) + '</td>'
              + '</tr>';
          }).join('') || '<tr><td colspan="6" class="text-center py-8 text-gray-500">لا توجد بيانات في هذه الفترة</td></tr>';
          document.getElementById('content').style.display = 'block';
        } catch (e) {
          alert('حدث خطأ: ' + (e && e.message ? e.message : e));
        } finally {
          document.getElementById('loading').style.display = 'none';
        }
      }

      window.addEventListener('load', () => {
        refreshReportFilterYearLabels();
        const periodSelect = document.getElementById('periodSelect');
        if (periodSelect) periodSelect.value = 'month';
        const d = getPeriodDates('month');
        _startDate = d.s; _endDate = d.e;
        setBadge(d.label, d.range);
        initDatePicker();
        loadReport();
      });
    </script>
</body>
</html>`
}
