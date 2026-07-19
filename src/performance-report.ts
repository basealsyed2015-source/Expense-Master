import { REPORT_FLATPICKR_HEAD, reportFilterBarHtml, REPORT_FILTER_BASE_JS } from './reports-module'

export const performanceReportPage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير الأداء</title>
    <link rel="stylesheet" href="/tailwind.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
${REPORT_FLATPICKR_HEAD}
    <style>
        .stat-card { transition: all 0.3s ease; }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
    </style>
</head>
<body class="bg-gray-50">
    <div class="max-w-7xl mx-auto p-6">
        <div class="mb-6 no-print">
            <a href="/admin/reports" class="text-blue-600 hover:text-blue-800 mb-2 inline-block text-sm">← منظومة التقارير</a>
            <h1 class="text-4xl font-bold text-gray-800">
                <i class="fas fa-chart-line text-green-600 ml-3"></i>
                تقرير الأداء الشامل
            </h1>
        </div>

        ${reportFilterBarHtml('#7C3AED')}

        <div id="loading" class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-6xl text-blue-600"></i>
            <p class="mt-4 text-xl text-gray-600">جاري تحميل البيانات...</p>
        </div>

        <div id="kpiCards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" style="display: none;"></div>

        <div id="charts" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8" style="display: none;">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">الطلبات حسب الحالة</h3>
                <canvas id="requestStatusChart"></canvas>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">الإيرادات الشهرية</h3>
                <canvas id="monthlyRevenueChart"></canvas>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">نمو العملاء</h3>
                <canvas id="customerGrowthChart"></canvas>
            </div>
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">أداء الموظفين</h3>
                <canvas id="employeePerformanceChart"></canvas>
            </div>
        </div>

        <div id="metricsTable" class="bg-white rounded-xl shadow-lg overflow-hidden mb-8" style="display: none;">
            <div class="p-6 border-b">
                <h2 class="text-2xl font-bold text-gray-800"><i class="fas fa-chart-bar ml-2"></i>مقاييس الأداء التفصيلية</h2>
            </div>
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="border rounded-lg p-4">
                        <h4 class="font-bold text-gray-700 mb-3">معدلات التحويل</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between"><span class="text-gray-600">من زائر إلى عميل:</span><span class="font-bold text-blue-600" id="conversionRate">-</span></div>
                            <div class="flex justify-between"><span class="text-gray-600">من عميل إلى طلب:</span><span class="font-bold text-blue-600" id="requestRate">-</span></div>
                            <div class="flex justify-between"><span class="text-gray-600">معدل إتمام الطلبات:</span><span class="font-bold text-blue-600" id="completionRate">-</span></div>
                        </div>
                    </div>
                    <div class="border rounded-lg p-4">
                        <h4 class="font-bold text-gray-700 mb-3">متوسط الأوقات</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between"><span class="text-gray-600">وقت معالجة الطلب:</span><span class="font-bold text-green-600" id="avgProcessingTime">-</span></div>
                            <div class="flex justify-between"><span class="text-gray-600">وقت الرد على العميل:</span><span class="font-bold text-green-600" id="avgResponseTime">-</span></div>
                            <div class="flex justify-between"><span class="text-gray-600">دورة حياة العميل:</span><span class="font-bold text-green-600" id="customerLifecycle">-</span></div>
                        </div>
                    </div>
                    <div class="border rounded-lg p-4">
                        <h4 class="font-bold text-gray-700 mb-3">المؤشرات المالية</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between"><span class="text-gray-600">متوسط قيمة الطلب:</span><span class="font-bold text-purple-600" id="avgOrderValue">-</span></div>
                            <div class="flex justify-between"><span class="text-gray-600">إجمالي الإيرادات:</span><span class="font-bold text-purple-600" id="totalRevenue">-</span></div>
                            <div class="flex justify-between"><span class="text-gray-600">نمو الإيرادات:</span><span class="font-bold text-purple-600" id="revenueGrowth">-</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="topPerformers" class="bg-white rounded-xl shadow-lg overflow-hidden" style="display: none;">
            <div class="p-6 border-b">
                <h2 class="text-2xl font-bold text-gray-800"><i class="fas fa-trophy ml-2"></i>أفضل الأداءات</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المرتبة</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد العملاء</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد الطلبات</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطلبات المقبولة</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">معدل النجاح</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجمالي التمويل</th>
                        </tr>
                    </thead>
                    <tbody id="topPerformersBody" class="bg-white divide-y divide-gray-200"></tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        const authToken = localStorage.getItem('authToken');
        let _chart1 = null, _chart2 = null, _chart3 = null, _chart4 = null;
        ${REPORT_FILTER_BASE_JS}

        let performanceData = null;
        let charts = {};

        async function loadReport() {
            const params = new URLSearchParams();
            if (_startDate) params.set('start_date', _startDate);
            if (_endDate)   params.set('end_date',   _endDate);
            document.getElementById('loading').style.display = 'block';
            document.getElementById('kpiCards').style.display = 'none';
            document.getElementById('charts').style.display = 'none';
            document.getElementById('metricsTable').style.display = 'none';
            try {
                const res = await fetch('/api/reports/performance?' + params, { headers: { 'Authorization': 'Bearer ' + authToken } });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                performanceData = data;
                renderKPICards();
                renderCharts(data);
                renderMetrics();
                renderTopPerformers();
                document.getElementById('kpiCards').style.display = 'grid';
                document.getElementById('charts').style.display = 'grid';
                document.getElementById('metricsTable').style.display = 'block';
                document.getElementById('topPerformers').style.display = 'block';
            } catch (e) {
                alert('حدث خطأ: ' + e.message);
            } finally {
                document.getElementById('loading').style.display = 'none';
            }
        }

        function renderKPICards() {
            const kpis = [
                { title: 'إجمالي الطلبات', value: performanceData.total_requests, icon: 'fa-file-alt', color: 'blue', trend: '' },
                { title: 'معدل القبول', value: (performanceData.approval_rate || 0) + '%', icon: 'fa-check-circle', color: 'green', trend: '' },
                { title: 'العملاء النشطين', value: performanceData.active_customers, icon: 'fa-users', color: 'purple', trend: '' },
                { title: 'إجمالي الإيرادات', value: formatCurrency(performanceData.total_revenue), icon: 'fa-coins', color: 'yellow', trend: '' }
            ];
            document.getElementById('kpiCards').innerHTML = kpis.map(kpi => \`
                <div class="stat-card bg-white rounded-xl shadow-lg p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-gray-500 text-sm font-medium">\${kpi.title}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <p class="text-3xl font-bold text-gray-800">\${kpi.value ?? '—'}</p>
                        <div class="bg-\${kpi.color}-100 rounded-full p-3">
                            <i class="fas \${kpi.icon} text-2xl text-\${kpi.color}-600"></i>
                        </div>
                    </div>
                </div>\`).join('');
        }

        function renderCharts(data) {
            const ctx1 = document.getElementById('requestStatusChart').getContext('2d');
            if (charts.requestStatus) charts.requestStatus.destroy();
            charts.requestStatus = new Chart(ctx1, {
                type: 'pie',
                data: { labels: ['قيد المعالجة','مقبول','مرفوض'], datasets: [{ data: [data.pending_requests, data.approved_requests, data.rejected_requests], backgroundColor: ['#fbbf24','#10b981','#ef4444'] }] }
            });

            const ctx2 = document.getElementById('monthlyRevenueChart').getContext('2d');
            if (charts.monthlyRevenue) charts.monthlyRevenue.destroy();
            charts.monthlyRevenue = new Chart(ctx2, { type: 'bar', data: { labels: ['إجمالي','مقبول','مرفوض','قيد المراجعة'], datasets: [{ data: [data.total_requests, data.approved_requests, data.rejected_requests, data.pending_requests], backgroundColor: ['#8b5cf6','#10b981','#ef4444','#fbbf24'] }] }, options: { plugins: { legend: { display: false } } } });

            const ctx3 = document.getElementById('customerGrowthChart').getContext('2d');
            if (charts.customerGrowth) charts.customerGrowth.destroy();
            charts.customerGrowth = new Chart(ctx3, { type: 'bar', data: { labels: ['إجمالي العملاء','نشط'], datasets: [{ data: [data.total_customers, data.active_customers], backgroundColor: ['#3b82f6','#10b981'] }] }, options: { plugins: { legend: { display: false } } } });

            const ctx4 = document.getElementById('employeePerformanceChart').getContext('2d');
            if (charts.employeePerformance) charts.employeePerformance.destroy();
            const performers = data.top_performers || [];
            charts.employeePerformance = new Chart(ctx4, { type: 'bar', data: { labels: performers.map(p => p.name), datasets: [{ label: 'طلبات مقبولة', data: performers.map(p => p.approved_count), backgroundColor: '#10b981' }] }, options: { plugins: { legend: { display: false } } } });
        }

        function renderMetrics() {
            document.getElementById('conversionRate').textContent = (performanceData.conversion_rate || 0) + '%';
            document.getElementById('requestRate').textContent = (performanceData.request_rate || 0) + '%';
            document.getElementById('completionRate').textContent = (performanceData.completion_rate || 0) + '%';
            document.getElementById('avgProcessingTime').textContent = (performanceData.avg_processing_time || '—') + ' يوم';
            document.getElementById('avgResponseTime').textContent = (performanceData.avg_response_time || '—') + ' ساعة';
            document.getElementById('customerLifecycle').textContent = (performanceData.customer_lifecycle || '—') + ' يوم';
            document.getElementById('avgOrderValue').textContent = formatCurrency(performanceData.avg_order_value);
            document.getElementById('totalRevenue').textContent = formatCurrency(performanceData.total_revenue);
            document.getElementById('revenueGrowth').textContent = (performanceData.revenue_growth || 0) + '%';
        }

        function renderTopPerformers() {
            const performers = performanceData.top_performers || [];
            document.getElementById('topPerformersBody').innerHTML = performers.map((p, i) => \`
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4"><span class="inline-flex items-center justify-center w-8 h-8 rounded-full \${i < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'} font-bold">\${i+1}</span></td>
                    <td class="px-6 py-4 font-medium">\${p.name}</td>
                    <td class="px-6 py-4">\${p.customers_count}</td>
                    <td class="px-6 py-4">\${p.requests_count}</td>
                    <td class="px-6 py-4 text-green-600 font-bold">\${p.approved_count}</td>
                    <td class="px-6 py-4"><span class="px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">\${p.success_rate}%</span></td>
                    <td class="px-6 py-4 text-purple-600 font-bold">\${formatCurrency(p.total_amount)}</td>
                </tr>\`).join('') || '<tr><td colspan="7" class="text-center py-8 text-gray-500">لا توجد بيانات</td></tr>';
        }

        function formatCurrency(v) {
            if (!v) return '0 ريال';
            return parseFloat(v).toLocaleString('ar-SA') + ' ريال';
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
</html>`
