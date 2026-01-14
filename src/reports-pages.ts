// ==========================================
// تقارير النظام - 3 تقارير احترافية
// ==========================================

// 1️⃣ تقرير النقرات على روابط الحاسبات
export const clicksReportPage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير النقرات على روابط الحاسبات</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl">
        <div class="max-w-7xl mx-auto px-4 py-6">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold flex items-center">
                        <i class="fas fa-mouse-pointer ml-3"></i>
                        تقرير النقرات على روابط الحاسبات
                    </h1>
                    <p class="text-blue-100 mt-2">تتبع وتحليل زيارات الحاسبات حسب نوع الجهاز والمنصة</p>
                </div>
                <a href="/admin/reports" class="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-all flex items-center">
                    <i class="fas fa-arrow-right ml-2"></i>
                    العودة إلى التقارير
                </a>
            </div>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-filter ml-2 text-blue-600"></i>
                تصفية البيانات
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">من تاريخ</label>
                    <input type="date" id="startDate" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">إلى تاريخ</label>
                    <input type="date" id="endDate" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div class="flex items-end">
                    <button onclick="loadReport()" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all">
                        <i class="fas fa-chart-bar ml-2"></i>
                        عرض التقرير
                    </button>
                </div>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-xl p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-100 text-sm font-semibold mb-1">إجمالي النقرات</p>
                        <p class="text-3xl font-bold" id="totalClicks">-</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-full">
                        <i class="fas fa-mouse-pointer text-3xl"></i>
                    </div>
                </div>
            </div>

            <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-xl p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-100 text-sm font-semibold mb-1">زوار فريدون</p>
                        <p class="text-3xl font-bold" id="uniqueVisitors">-</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-full">
                        <i class="fas fa-users text-3xl"></i>
                    </div>
                </div>
            </div>

            <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-xl p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-purple-100 text-sm font-semibold mb-1">أيام نشطة</p>
                        <p class="text-3xl font-bold" id="activeDays">-</p>
                    </div>
                    <div class="bg-white/20 p-4 rounded-full">
                        <i class="fas fa-calendar-check text-3xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-chart-line ml-2 text-blue-600"></i>
                    النقرات اليومية
                </h3>
                <div style="height: 300px; position: relative;">
                    <canvas id="dailyClicksChart"></canvas>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-chart-pie ml-2 text-green-600"></i>
                    توزيع المنصات
                </h3>
                <div style="height: 300px; position: relative;">
                    <canvas id="platformsChart"></canvas>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-mobile-alt ml-2 text-purple-600"></i>
                    توزيع الأجهزة
                </h3>
                <div style="height: 300px; position: relative;">
                    <canvas id="devicesChart"></canvas>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-globe ml-2 text-orange-600"></i>
                    مصادر الزيارات
                </h3>
                <div style="height: 300px; position: relative;">
                    <canvas id="sourcesChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Tables -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">إحصائيات المنصات</h3>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">المنصة</th>
                                <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">عدد النقرات</th>
                                <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">النسبة المئوية</th>
                            </tr>
                        </thead>
                        <tbody id="platformsTable">
                            <tr>
                                <td colspan="3" class="px-4 py-8 text-center text-gray-500">
                                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                    <p>جاري التحميل...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">إحصائيات الأجهزة</h3>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">نوع الجهاز</th>
                                <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">عدد النقرات</th>
                                <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">النسبة المئوية</th>
                            </tr>
                        </thead>
                        <tbody id="devicesTable">
                            <tr>
                                <td colspan="3" class="px-4 py-8 text-center text-gray-500">
                                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                    <p>جاري التحميل...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Details Table -->
        <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800">تفاصيل النقرات</h3>
                <button onclick="exportToExcel()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-all">
                    <i class="fas fa-file-excel ml-2"></i>
                    تصدير Excel
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">التاريخ</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">رابط الحاسبة</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">النقرات</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">زوار فريدون</th>
                        </tr>
                    </thead>
                    <tbody id="detailsTable">
                        <tr>
                            <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                                <p>جاري التحميل...</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        // Set default dates
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        document.getElementById('startDate').value = weekAgo.toISOString().split('T')[0];
        document.getElementById('endDate').value = today.toISOString().split('T')[0];

        let charts = {};

        async function loadReport() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;

            // Generate sample data
            const data = generateSampleData(startDate, endDate);

            // Update summary
            document.getElementById('totalClicks').textContent = data.totalClicks.toLocaleString('ar-SA');
            document.getElementById('uniqueVisitors').textContent = data.uniqueVisitors.toLocaleString('ar-SA');
            document.getElementById('activeDays').textContent = data.activeDays;

            // Draw charts
            drawDailyChart(data.dailyClicks);
            drawPlatformsChart(data.platforms);
            drawDevicesChart(data.devices);
            drawSourcesChart(data.sources);

            // Update tables
            updatePlatformsTable(data.platforms);
            updateDevicesTable(data.devices);
            updateDetailsTable(data.details);
        }

        function generateSampleData(startDate, endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            const dailyClicks = [];
            for (let i = 0; i < days; i++) {
                const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
                dailyClicks.push({
                    date: date.toISOString().split('T')[0],
                    clicks: Math.floor(Math.random() * 200) + 50
                });
            }

            return {
                totalClicks: dailyClicks.reduce((sum, d) => sum + d.clicks, 0),
                uniqueVisitors: Math.floor(dailyClicks.reduce((sum, d) => sum + d.clicks, 0) * 0.7),
                activeDays: days,
                dailyClicks,
                platforms: [
                    { name: 'iOS', clicks: Math.floor(Math.random() * 500) + 200 },
                    { name: 'Android', clicks: Math.floor(Math.random() * 500) + 200 },
                    { name: 'Windows', clicks: Math.floor(Math.random() * 300) + 100 },
                    { name: 'macOS', clicks: Math.floor(Math.random() * 200) + 50 }
                ],
                devices: [
                    { name: 'موبايل', clicks: Math.floor(Math.random() * 800) + 400 },
                    { name: 'كمبيوتر', clicks: Math.floor(Math.random() * 500) + 200 },
                    { name: 'تابلت', clicks: Math.floor(Math.random() * 200) + 50 }
                ],
                sources: [
                    { name: 'مباشر', clicks: Math.floor(Math.random() * 600) + 300 },
                    { name: 'جوجل', clicks: Math.floor(Math.random() * 400) + 200 },
                    { name: 'فيسبوك', clicks: Math.floor(Math.random() * 300) + 100 },
                    { name: 'تويتر', clicks: Math.floor(Math.random() * 200) + 50 }
                ],
                details: dailyClicks.map(d => ({
                    date: d.date,
                    url: 'https://example.com/calculator',
                    clicks: d.clicks,
                    unique: Math.floor(d.clicks * 0.7)
                }))
            };
        }

        function drawDailyChart(data) {
            const ctx = document.getElementById('dailyClicksChart');
            if (charts.daily) charts.daily.destroy();
            
            charts.daily = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(d => d.date),
                    datasets: [{
                        label: 'النقرات',
                        data: data.map(d => d.clicks),
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } }
                }
            });
        }

        function drawPlatformsChart(data) {
            const ctx = document.getElementById('platformsChart');
            if (charts.platforms) charts.platforms.destroy();
            
            charts.platforms = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.name),
                    datasets: [{
                        data: data.map(d => d.clicks),
                        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true
                }
            });
        }

        function drawDevicesChart(data) {
            const ctx = document.getElementById('devicesChart');
            if (charts.devices) charts.devices.destroy();
            
            charts.devices = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: data.map(d => d.name),
                    datasets: [{
                        data: data.map(d => d.clicks),
                        backgroundColor: ['#8B5CF6', '#EC4899', '#06B6D4']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true
                }
            });
        }

        function drawSourcesChart(data) {
            const ctx = document.getElementById('sourcesChart');
            if (charts.sources) charts.sources.destroy();
            
            charts.sources = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.name),
                    datasets: [{
                        label: 'الزيارات',
                        data: data.map(d => d.clicks),
                        backgroundColor: '#F59E0B'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } }
                }
            });
        }

        function updatePlatformsTable(data) {
            const total = data.reduce((sum, d) => sum + d.clicks, 0);
            const html = data.map(d => \`
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-4 py-3">\${d.name}</td>
                    <td class="px-4 py-3 font-bold">\${d.clicks.toLocaleString('ar-SA')}</td>
                    <td class="px-4 py-3">
                        <div class="flex items-center">
                            <div class="w-full bg-gray-200 rounded-full h-2 ml-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: \${(d.clicks / total * 100).toFixed(1)}%"></div>
                            </div>
                            <span class="text-sm font-bold">\${(d.clicks / total * 100).toFixed(1)}%</span>
                        </div>
                    </td>
                </tr>
            \`).join('');
            document.getElementById('platformsTable').innerHTML = html;
        }

        function updateDevicesTable(data) {
            const total = data.reduce((sum, d) => sum + d.clicks, 0);
            const html = data.map(d => \`
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-4 py-3">\${d.name}</td>
                    <td class="px-4 py-3 font-bold">\${d.clicks.toLocaleString('ar-SA')}</td>
                    <td class="px-4 py-3">
                        <div class="flex items-center">
                            <div class="w-full bg-gray-200 rounded-full h-2 ml-2">
                                <div class="bg-purple-600 h-2 rounded-full" style="width: \${(d.clicks / total * 100).toFixed(1)}%"></div>
                            </div>
                            <span class="text-sm font-bold">\${(d.clicks / total * 100).toFixed(1)}%</span>
                        </div>
                    </td>
                </tr>
            \`).join('');
            document.getElementById('devicesTable').innerHTML = html;
        }

        function updateDetailsTable(data) {
            const html = data.map(d => \`
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-4 py-3">\${d.date}</td>
                    <td class="px-4 py-3 text-blue-600">\${d.url}</td>
                    <td class="px-4 py-3 font-bold">\${d.clicks.toLocaleString('ar-SA')}</td>
                    <td class="px-4 py-3 font-bold">\${d.unique.toLocaleString('ar-SA')}</td>
                </tr>
            \`).join('');
            document.getElementById('detailsTable').innerHTML = html;
        }

        function exportToExcel() {
            alert('جاري تصدير التقرير إلى Excel...');
        }

        // Load on page load
        window.addEventListener('load', loadReport);
    </script>
</body>
</html>
`;

// 2️⃣ تقرير سير العمل للعملاء
export const workflowReportPage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير سير العمل للعملاء</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gradient-to-br from-gray-50 via-green-50 to-blue-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-xl">
        <div class="max-w-7xl mx-auto px-4 py-6">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold flex items-center">
                        <i class="fas fa-route ml-3"></i>
                        تقرير سير العمل للعملاء
                    </h1>
                    <p class="text-green-100 mt-2">تتبع رحلة العملاء من التسجيل حتى اكتمال الطلب</p>
                </div>
                <a href="/admin/reports" class="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-all flex items-center">
                    <i class="fas fa-arrow-right ml-2"></i>
                    العودة للتقارير
                </a>
            </div>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">رقم العميل (اختياري)</label>
                    <input type="text" id="customerId" placeholder="اترك فارغاً لجميع العملاء" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">تاريخ البداية</label>
                    <input type="date" id="startDate" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">تاريخ النهاية</label>
                    <input type="date" id="endDate" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                </div>
                <div class="flex items-end">
                    <button onclick="loadWorkflowReport()" class="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:from-green-700 hover:to-blue-700 transition-all">
                        <i class="fas fa-search ml-2"></i>
                        عرض التقرير
                    </button>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-chart-pie ml-2 text-green-600"></i>
                    توزيع الطلبات حسب المراحل
                </h3>
                <canvas id="stagesChart" height="250"></canvas>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-clock ml-2 text-blue-600"></i>
                    متوسط مدة كل مرحلة (بالدقائق)
                </h3>
                <canvas id="durationChart" height="250"></canvas>
            </div>
        </div>

        <!-- Details Table -->
        <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">تفاصيل العملاء وسير العمل</h3>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">رقم العميل</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">اسم العميل</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">رقم الطلب</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">المبلغ المطلوب</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">المرحلة الحالية</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">عدد الانتقالات</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">المدة الإجمالية</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">حالة الطلب</th>
                        </tr>
                    </thead>
                    <tbody id="workflowTable">
                        <tr>
                            <td colspan="8" class="px-4 py-8 text-center text-gray-500">اضغط على "عرض التقرير" لتحميل البيانات</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        // Set default dates
        const today = new Date();
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        document.getElementById('startDate').value = monthAgo.toISOString().split('T')[0];
        document.getElementById('endDate').value = today.toISOString().split('T')[0];

        let charts = {};

        async function loadWorkflowReport() {
            try {
                // Get filter values
                const customerId = document.getElementById('customerIdFilter').value;
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;

                // Build API URL with filters
                const params = new URLSearchParams();
                if (customerId) params.append('customer_id', customerId);
                if (startDate) params.append('start_date', startDate);
                if (endDate) params.append('end_date', endDate);

                // Fetch data from API
                const response = await fetch('/api/reports/workflow?' + params.toString());
                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'فشل تحميل البيانات');
                }

                const data = result.data;

                // Draw charts and update table
                drawStagesChart(data.stages);
                drawDurationChart(data.durations);
                updateWorkflowTable(data.details);
            } catch (error) {
                console.error('Error loading workflow report:', error);
                alert('حدث خطأ في تحميل التقرير. يرجى المحاولة مرة أخرى.');
            }
        }

        function drawStagesChart(data) {
            const ctx = document.getElementById('stagesChart');
            if (charts.stages) charts.stages.destroy();
            
            charts.stages = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.name),
                    datasets: [{
                        data: data.map(d => d.count),
                        backgroundColor: ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true
                }
            });
        }

        function drawDurationChart(data) {
            const ctx = document.getElementById('durationChart');
            if (charts.duration) charts.duration.destroy();
            
            charts.duration = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.stage),
                    datasets: [{
                        label: 'الدقائق',
                        data: data.map(d => d.duration),
                        backgroundColor: '#10B981'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } }
                }
            });
        }

        function updateWorkflowTable(data) {
            const html = data.map(d => \`
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-4 py-3 font-bold">\${d.customerId}</td>
                    <td class="px-4 py-3">\${d.customerName}</td>
                    <td class="px-4 py-3 text-blue-600">\${d.requestId}</td>
                    <td class="px-4 py-3 font-bold">\${d.amount.toLocaleString('ar-SA')} ريال</td>
                    <td class="px-4 py-3">
                        <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
                            \${d.stage}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-center">\${d.transitions}</td>
                    <td class="px-4 py-3">\${d.duration}</td>
                    <td class="px-4 py-3">
                        <span class="px-3 py-1 \${d.status === 'مكتمل' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} rounded-full text-sm font-bold">
                            \${d.status}
                        </span>
                    </td>
                </tr>
            \`).join('');
            document.getElementById('workflowTable').innerHTML = html;
        }
        
        // Load report on page load
        window.addEventListener('load', () => {
            // Set default dates (last 30 days)
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            document.getElementById('endDate').value = today.toISOString().split('T')[0];
            document.getElementById('startDate').value = thirtyDaysAgo.toISOString().split('T')[0];
            
            // Load report automatically
            loadWorkflowReport();
        });
    </script>
</body>
</html>
`;

// 3️⃣ تقرير أداء الموظفين
export const employeePerformanceReportPage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير أداء الموظفين</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl">
        <div class="max-w-7xl mx-auto px-4 py-6">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold flex items-center">
                        <i class="fas fa-chart-line ml-3"></i>
                        تقرير أداء الموظفين
                    </h1>
                    <p class="text-purple-100 mt-2">تحليل شامل لأداء الموظفين والعملاء والطلبات والعمولات</p>
                </div>
                <a href="/admin/reports" class="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg transition-all flex items-center">
                    <i class="fas fa-arrow-right ml-2"></i>
                    العودة للتقارير
                </a>
            </div>
        </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">تاريخ البداية</label>
                    <input type="date" id="startDate" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">تاريخ النهاية</label>
                    <input type="date" id="endDate" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                </div>
                <div class="flex items-end">
                    <button onclick="loadPerformanceReport()" class="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all">
                        <i class="fas fa-chart-bar ml-2"></i>
                        عرض التقرير
                    </button>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-exchange-alt ml-2 text-blue-600"></i>
                    معدل التحويل (عملاء → طلبات)
                </h3>
                <canvas id="conversionChart" height="200"></canvas>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-check-circle ml-2 text-green-600"></i>
                    معدل القبول للطلبات
                </h3>
                <canvas id="approvalChart" height="200"></canvas>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-dollar-sign ml-2 text-purple-600"></i>
                    إجمالي العمولات لكل موظف
                </h3>
                <canvas id="commissionsChart" height="200"></canvas>
            </div>
        </div>

        <!-- Details Table -->
        <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">مقارنة تفصيلية بين الموظفين</h3>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">الموظف</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">إجمالي العملاء</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">تحول إلى طلب</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">معدل التحويل</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">طلبات مقبولة</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">طلبات مرفوضة</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">طلبات قيد المعالجة</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">معدل القبول</th>
                            <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">إجمالي العمولات</th>
                        </tr>
                    </thead>
                    <tbody id="performanceTable">
                        <tr>
                            <td colspan="9" class="px-4 py-8 text-center text-gray-500">اضغط على "عرض التقرير" لتحميل البيانات</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        // Set default dates
        const today = new Date();
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        document.getElementById('startDate').value = monthAgo.toISOString().split('T')[0];
        document.getElementById('endDate').value = today.toISOString().split('T')[0];

        let charts = {};

        function loadPerformanceReport() {
            const data = {
                employees: [
                    { name: 'أحمد محمد', totalCustomers: 50, converted: 35, conversionRate: 70, approved: 28, rejected: 5, pending: 2, approvalRate: 80, commission: 15000 },
                    { name: 'فاطمة علي', totalCustomers: 45, converted: 32, conversionRate: 71, approved: 25, rejected: 4, pending: 3, approvalRate: 78, commission: 13500 },
                    { name: 'خالد سعيد', totalCustomers: 40, converted: 28, conversionRate: 70, approved: 22, rejected: 3, pending: 3, approvalRate: 79, commission: 12000 }
                ]
            };

            drawConversionChart(data.employees);
            drawApprovalChart(data.employees);
            drawCommissionsChart(data.employees);
            updatePerformanceTable(data.employees);
        }

        function drawConversionChart(data) {
            const ctx = document.getElementById('conversionChart');
            if (charts.conversion) charts.conversion.destroy();
            
            charts.conversion = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.name),
                    datasets: [{
                        label: 'معدل التحويل %',
                        data: data.map(d => d.conversionRate),
                        backgroundColor: '#3B82F6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, max: 100 } }
                }
            });
        }

        function drawApprovalChart(data) {
            const ctx = document.getElementById('approvalChart');
            if (charts.approval) charts.approval.destroy();
            
            charts.approval = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.name),
                    datasets: [{
                        label: 'معدل القبول %',
                        data: data.map(d => d.approvalRate),
                        backgroundColor: '#10B981'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, max: 100 } }
                }
            });
        }

        function drawCommissionsChart(data) {
            const ctx = document.getElementById('commissionsChart');
            if (charts.commissions) charts.commissions.destroy();
            
            charts.commissions = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.name),
                    datasets: [{
                        label: 'العمولات (ريال)',
                        data: data.map(d => d.commission),
                        backgroundColor: '#8B5CF6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } }
                }
            });
        }

        function updatePerformanceTable(data) {
            const html = data.map(d => \`
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-4 py-3 font-bold">\${d.name}</td>
                    <td class="px-4 py-3 text-center">\${d.totalCustomers}</td>
                    <td class="px-4 py-3 text-center font-bold text-blue-600">\${d.converted}</td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                            \${d.conversionRate}%
                        </span>
                    </td>
                    <td class="px-4 py-3 text-center font-bold text-green-600">\${d.approved}</td>
                    <td class="px-4 py-3 text-center font-bold text-red-600">\${d.rejected}</td>
                    <td class="px-4 py-3 text-center font-bold text-yellow-600">\${d.pending}</td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                            \${d.approvalRate}%
                        </span>
                    </td>
                    <td class="px-4 py-3 font-bold text-purple-600">\${d.commission.toLocaleString('ar-SA')} ريال</td>
                </tr>
            \`).join('');
            document.getElementById('performanceTable').innerHTML = html;
        }
        
        // Load report on page load
        window.addEventListener('load', () => {
            // Set default dates (last 30 days)
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            document.getElementById('endDate').value = today.toISOString().split('T')[0];
            document.getElementById('startDate').value = thirtyDaysAgo.toISOString().split('T')[0];
            
            // Load report automatically
            loadPerformanceReport();
        });
    </script>
</body>
</html>
`;
