export const companyReportsPage = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقارير الشركة المتقدمة</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        .report-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.3s;
        }
        .report-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateY(-2px);
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
            padding: 20px;
        }
        .chart-container {
            position: relative;
            height: 300px;
            margin: 20px 0;
        }
    </style>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto p-6">
        <!-- Header -->
        <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6 mb-6 shadow-lg">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold mb-2">
                        <i class="fas fa-chart-line mr-2"></i>
                        تقارير الشركة المتقدمة
                    </h1>
                    <p class="opacity-90">تحليل شامل لأداء الشركة وإحصائيات التمويل</p>
                </div>
                <div class="text-left">
                    <div class="text-sm opacity-75">الشركة:</div>
                    <div class="text-xl font-bold" id="companyName">جاري التحميل...</div>
                </div>
            </div>
        </div>

        <!-- إحصائيات سريعة -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="stat-card">
                <div class="text-sm opacity-80 mb-1">إجمالي الطلبات</div>
                <div class="text-3xl font-bold" id="totalRequests">0</div>
                <div class="text-sm opacity-75 mt-1">
                    <i class="fas fa-file-invoice"></i> جميع طلبات التمويل
                </div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                <div class="text-sm opacity-80 mb-1">إجمالي المبالغ</div>
                <div class="text-3xl font-bold" id="totalAmount">0 ر.س</div>
                <div class="text-sm opacity-75 mt-1">
                    <i class="fas fa-money-bill-wave"></i> المبالغ المطلوبة
                </div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                <div class="text-sm opacity-80 mb-1">عدد العملاء</div>
                <div class="text-3xl font-bold" id="totalCustomers">0</div>
                <div class="text-sm opacity-75 mt-1">
                    <i class="fas fa-users"></i> العملاء النشطين
                </div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
                <div class="text-sm opacity-80 mb-1">معدل الموافقة</div>
                <div class="text-3xl font-bold" id="approvalRate">0%</div>
                <div class="text-sm opacity-75 mt-1">
                    <i class="fas fa-check-circle"></i> نسبة القبول
                </div>
            </div>
        </div>

        <!-- الرسوم البيانية -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- توزيع حالات الطلبات -->
            <div class="report-card p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-pie text-purple-600 mr-2"></i>
                    توزيع حالات الطلبات
                </h3>
                <div class="chart-container">
                    <canvas id="statusChart"></canvas>
                </div>
            </div>

            <!-- المبالغ حسب الشهر -->
            <div class="report-card p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
                    المبالغ حسب الشهر
                </h3>
                <div class="chart-container">
                    <canvas id="monthlyChart"></canvas>
                </div>
            </div>
        </div>

        <!-- جداول تفصيلية -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- أفضل 5 عملاء -->
            <div class="report-card p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-trophy text-yellow-500 mr-2"></i>
                    أفضل 5 عملاء
                </h3>
                <div id="topCustomers" class="space-y-3">
                    <!-- سيتم ملؤها ديناميكياً -->
                </div>
            </div>

            <!-- البنوك الأكثر استخداماً -->
            <div class="report-card p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-university text-green-500 mr-2"></i>
                    البنوك الأكثر استخداماً
                </h3>
                <div id="topBanks" class="space-y-3">
                    <!-- سيتم ملؤها ديناميكياً -->
                </div>
            </div>
        </div>

        <!-- جدول الطلبات الأخيرة -->
        <div class="report-card p-6 mb-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800">
                    <i class="fas fa-list text-indigo-600 mr-2"></i>
                    آخر طلبات التمويل
                </h3>
                <button onclick="exportReport()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-file-export mr-2"></i>
                    تصدير التقرير
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-right">الرقم</th>
                            <th class="px-4 py-3 text-right">العميل</th>
                            <th class="px-4 py-3 text-right">المبلغ</th>
                            <th class="px-4 py-3 text-right">المدة</th>
                            <th class="px-4 py-3 text-right">البنك</th>
                            <th class="px-4 py-3 text-right">الحالة</th>
                            <th class="px-4 py-3 text-right">التاريخ</th>
                        </tr>
                    </thead>
                    <tbody id="requestsTable">
                        <!-- سيتم ملؤها ديناميكياً -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- أزرار العودة -->
        <div class="flex gap-3">
            <a href="/admin/panel" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg">
                <i class="fas fa-arrow-right mr-2"></i>
                العودة للوحة التحكم
            </a>
        </div>
    </div>

    <script>
        let statusChart, monthlyChart;
        let reportData = {};

        // تحميل البيانات عند بدء الصفحة
        async function loadReportData() {
            try {
                // الحصول على معلومات المستخدم
                const userResponse = await axios.get('/api/user-info');
                const tenantId = userResponse.data.tenant_id;
                const companyName = userResponse.data.company_name || 'الشركة';
                
                document.getElementById('companyName').textContent = companyName;

                // تحميل بيانات الطلبات
                const requestsResponse = await axios.get(\`/api/financing-requests?tenant_id=\${tenantId}\`);
                const requests = requestsResponse.data.data || [];

                // تحميل بيانات العملاء
                const customersResponse = await axios.get(\`/api/customers?tenant_id=\${tenantId}\`);
                const customers = customersResponse.data.data || [];

                // حساب الإحصائيات
                reportData = {
                    requests,
                    customers,
                    tenantId
                };

                calculateStatistics();
                renderCharts();
                renderTables();
                
            } catch (error) {
                console.error('خطأ في تحميل البيانات:', error);
                alert('حدث خطأ في تحميل التقرير');
            }
        }

        function calculateStatistics() {
            const { requests, customers } = reportData;

            // إجمالي الطلبات
            document.getElementById('totalRequests').textContent = requests.length;

            // إجمالي المبالغ
            const totalAmount = requests.reduce((sum, req) => sum + (req.requested_amount || 0), 0);
            document.getElementById('totalAmount').textContent = totalAmount.toLocaleString('ar-SA') + ' ر.س';

            // عدد العملاء
            document.getElementById('totalCustomers').textContent = customers.length;

            // معدل الموافقة
            const approvedCount = requests.filter(r => r.status === 'approved').length;
            const approvalRate = requests.length > 0 ? ((approvedCount / requests.length) * 100).toFixed(1) : 0;
            document.getElementById('approvalRate').textContent = approvalRate + '%';
        }

        function renderCharts() {
            const { requests } = reportData;

            // رسم بياني لتوزيع الحالات
            const statusCounts = {
                'pending': requests.filter(r => r.status === 'pending').length,
                'approved': requests.filter(r => r.status === 'approved').length,
                'rejected': requests.filter(r => r.status === 'rejected').length,
                'under_review': requests.filter(r => r.status === 'under_review').length
            };

            const statusLabels = {
                'pending': 'قيد الانتظار',
                'approved': 'موافق عليه',
                'rejected': 'مرفوض',
                'under_review': 'قيد المراجعة'
            };

            if (statusChart) statusChart.destroy();
            statusChart = new Chart(document.getElementById('statusChart'), {
                type: 'doughnut',
                data: {
                    labels: Object.keys(statusCounts).map(k => statusLabels[k]),
                    datasets: [{
                        data: Object.values(statusCounts),
                        backgroundColor: ['#FCD34D', '#34D399', '#F87171', '#60A5FA']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // رسم بياني للمبالغ حسب الشهر
            const monthlyData = {};
            requests.forEach(req => {
                const month = new Date(req.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
                monthlyData[month] = (monthlyData[month] || 0) + (req.requested_amount || 0);
            });

            if (monthlyChart) monthlyChart.destroy();
            monthlyChart = new Chart(document.getElementById('monthlyChart'), {
                type: 'bar',
                data: {
                    labels: Object.keys(monthlyData),
                    datasets: [{
                        label: 'المبلغ (ر.س)',
                        data: Object.values(monthlyData),
                        backgroundColor: '#667eea'
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
        }

        function renderTables() {
            const { requests, customers } = reportData;

            // أفضل 5 عملاء
            const customerRequests = {};
            requests.forEach(req => {
                customerRequests[req.customer_id] = (customerRequests[req.customer_id] || 0) + 1;
            });

            const topCustomersHTML = Object.entries(customerRequests)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([customerId, count], index) => {
                    const customer = customers.find(c => c.id == customerId);
                    const customerName = customer ? customer.full_name : 'غير معروف';
                    return \`
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
                                    \${index + 1}
                                </div>
                                <span class="font-medium">\${customerName}</span>
                            </div>
                            <span class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                                \${count} طلب
                            </span>
                        </div>
                    \`;
                }).join('');
            document.getElementById('topCustomers').innerHTML = topCustomersHTML || '<p class="text-gray-500 text-center">لا توجد بيانات</p>';

            // جدول الطلبات الأخيرة
            const requestsHTML = requests
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10)
                .map(req => {
                    const statusColors = {
                        'pending': 'bg-yellow-100 text-yellow-800',
                        'approved': 'bg-green-100 text-green-800',
                        'rejected': 'bg-red-100 text-red-800',
                        'under_review': 'bg-blue-100 text-blue-800'
                    };
                    const statusLabels = {
                        'pending': 'قيد الانتظار',
                        'approved': 'موافق عليه',
                        'rejected': 'مرفوض',
                        'under_review': 'قيد المراجعة'
                    };
                    
                    const customer = customers.find(c => c.id == req.customer_id);
                    const customerName = customer ? customer.full_name : 'غير معروف';
                    
                    return \`
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-4 py-3">\${req.id}</td>
                            <td class="px-4 py-3">\${customerName}</td>
                            <td class="px-4 py-3 font-bold text-green-600">\${(req.requested_amount || 0).toLocaleString('ar-SA')} ر.س</td>
                            <td class="px-4 py-3">\${req.duration_months || 0} شهر</td>
                            <td class="px-4 py-3">\${req.bank_name || 'غير محدد'}</td>
                            <td class="px-4 py-3">
                                <span class="px-3 py-1 rounded-full text-xs font-bold \${statusColors[req.status] || 'bg-gray-100'}">
                                    \${statusLabels[req.status] || req.status}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-gray-600">\${new Date(req.created_at).toLocaleDateString('ar-SA')}</td>
                        </tr>
                    \`;
                }).join('');
            document.getElementById('requestsTable').innerHTML = requestsHTML || '<tr><td colspan="7" class="text-center py-8 text-gray-500">لا توجد طلبات</td></tr>';
        }

        function exportReport() {
            const { requests, customers } = reportData;
            let csv = 'الرقم,العميل,المبلغ,المدة,الحالة,التاريخ\\n';
            
            requests.forEach(req => {
                const customer = customers.find(c => c.id == req.customer_id);
                const customerName = customer ? customer.full_name : 'غير معروف';
                csv += \`\${req.id},\${customerName},\${req.requested_amount},\${req.duration_months},\${req.status},\${req.created_at}\\n\`;
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'تقرير-الشركة-' + new Date().toISOString().split('T')[0] + '.csv';
            link.click();
        }

        // تحميل البيانات عند بدء الصفحة
        window.onload = loadReportData;
    </script>
</body>
</html>
`
