export const hrMainPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظام إدارة الموارد البشرية - HR</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 min-h-screen">
    <!-- Navigation Bar -->
    <nav class="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white shadow-2xl sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <!-- Left: User Info (Desktop) & Buttons -->
                <div class="flex items-center space-x-3 space-x-reverse">
                    <a href="/admin/panel" class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all hidden md:flex items-center">
                        <i class="fas fa-home ml-2"></i>
                        لوحة التحكم الرئيسية
                    </a>
                    <button onclick="logout()" class="bg-red-500/80 hover:bg-red-600 px-4 py-2 rounded-lg transition-all hidden md:flex items-center">
                        <i class="fas fa-sign-out-alt ml-2"></i>
                        تسجيل خروج
                    </button>
                </div>
                
                <!-- Center: Title -->
                <div class="flex items-center space-x-4 space-x-reverse">
                    <i class="fas fa-users-cog text-3xl hidden md:block"></i>
                    <div class="text-center md:text-right">
                        <h1 class="text-xl font-bold">نظام إدارة الموارد البشرية</h1>
                        <p class="text-xs text-blue-100 hidden md:block">إدارة الموظفين والحضور والإجازات والرواتب</p>
                    </div>
                </div>
                
                <!-- Right: Burger Menu -->
                <button onclick="toggleSidebar()" class="p-2 hover:bg-white/10 rounded-lg transition-all" title="القائمة">
                    <i class="fas fa-bars text-2xl"></i>
                </button>
            </div>
        </div>
    </nav>

    <!-- Sidebar Menu -->
    <div id="sidebar" class="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform translate-x-full transition-transform duration-300 ease-in-out z-50 overflow-y-auto">
        <div class="p-6">
            <!-- Close Button -->
            <button onclick="toggleSidebar()" class="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg transition-all">
                <i class="fas fa-times text-2xl text-gray-600"></i>
            </button>
            
            <!-- Header -->
            <div class="mb-8 pt-4">
                <div class="flex items-center space-x-3 space-x-reverse mb-4">
                    <i class="fas fa-users-cog text-4xl text-blue-600"></i>
                    <div>
                        <h2 class="text-xl font-bold text-gray-800">نظام HR</h2>
                        <p class="text-sm text-gray-500">الموارد البشرية</p>
                    </div>
                </div>
            </div>

            <!-- Menu Items -->
            <div class="space-y-2">
                <a href="/admin/panel" class="flex items-center space-x-3 space-x-reverse p-4 hover:bg-blue-50 rounded-lg transition-all group">
                    <i class="fas fa-home text-xl text-gray-600 group-hover:text-blue-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-blue-600">لوحة التحكم الرئيسية</span>
                </a>
                
                <a href="/admin/hr" class="flex items-center space-x-3 space-x-reverse p-4 bg-blue-50 rounded-lg">
                    <i class="fas fa-chart-line text-xl text-blue-600"></i>
                    <span class="font-medium text-blue-600">لوحة المعلومات</span>
                </a>

                <a href="#" onclick="alert('قيد التطوير'); return false;" class="flex items-center space-x-3 space-x-reverse p-4 hover:bg-blue-50 rounded-lg transition-all group">
                    <i class="fas fa-users text-xl text-gray-600 group-hover:text-blue-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-blue-600">إدارة الموظفين</span>
                </a>

                <a href="#" onclick="alert('قيد التطوير'); return false;" class="flex items-center space-x-3 space-x-reverse p-4 hover:bg-blue-50 rounded-lg transition-all group">
                    <i class="fas fa-user-check text-xl text-gray-600 group-hover:text-blue-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-blue-600">الحضور والغياب</span>
                </a>

                <a href="#" onclick="alert('قيد التطوير'); return false;" class="flex items-center space-x-3 space-x-reverse p-4 hover:bg-blue-50 rounded-lg transition-all group">
                    <i class="fas fa-calendar-alt text-xl text-gray-600 group-hover:text-blue-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-blue-600">إدارة الإجازات</span>
                </a>

                <a href="#" onclick="alert('قيد التطوير'); return false;" class="flex items-center space-x-3 space-x-reverse p-4 hover:bg-blue-50 rounded-lg transition-all group">
                    <i class="fas fa-money-bill-wave text-xl text-gray-600 group-hover:text-blue-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-blue-600">الرواتب</span>
                </a>

                <a href="#" onclick="alert('قيد التطوير'); return false;" class="flex items-center space-x-3 space-x-reverse p-4 hover:bg-blue-50 rounded-lg transition-all group">
                    <i class="fas fa-star text-xl text-gray-600 group-hover:text-blue-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-blue-600">تقييم الأداء</span>
                </a>

                <a href="#" onclick="alert('قيد التطوير'); return false;" class="flex items-center space-x-3 space-x-reverse p-4 hover:bg-blue-50 rounded-lg transition-all group">
                    <i class="fas fa-level-up-alt text-xl text-gray-600 group-hover:text-blue-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-blue-600">الترقيات والنقل</span>
                </a>

                <a href="#" onclick="alert('قيد التطوير'); return false;" class="flex items-center space-x-3 space-x-reverse p-4 hover:bg-blue-50 rounded-lg transition-all group">
                    <i class="fas fa-bell text-xl text-gray-600 group-hover:text-blue-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-blue-600">تنبيهات المستندات</span>
                </a>

                <a href="#" onclick="alert('قيد التطوير'); return false;" class="flex items-center space-x-3 space-x-reverse p-4 hover:bg-blue-50 rounded-lg transition-all group">
                    <i class="fas fa-file-alt text-xl text-gray-600 group-hover:text-blue-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-blue-600">التقارير</span>
                </a>

                <hr class="my-4">

                <button onclick="logout()" class="w-full flex items-center space-x-3 space-x-reverse p-4 hover:bg-red-50 rounded-lg transition-all group">
                    <i class="fas fa-sign-out-alt text-xl text-gray-600 group-hover:text-red-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-red-600">تسجيل خروج</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Overlay -->
    <div id="overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden" onclick="toggleSidebar()"></div>

    <!-- Main Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Total Employees -->
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="text-blue-100 text-sm">إجمالي الموظفين</p>
                        <h3 class="text-4xl font-bold mt-1" id="totalEmployees">0</h3>
                    </div>
                    <div class="bg-white/20 p-3 rounded-lg">
                        <i class="fas fa-users text-2xl"></i>
                    </div>
                </div>
                <div class="flex items-center text-sm">
                    <span class="text-blue-100">
                        <span class="font-bold" id="activeEmployees">0</span> نشط
                    </span>
                </div>
            </div>

            <!-- Attendance Today -->
            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="text-green-100 text-sm">حضور اليوم</p>
                        <h3 class="text-4xl font-bold mt-1" id="presentToday">0</h3>
                    </div>
                    <div class="bg-white/20 p-3 rounded-lg">
                        <i class="fas fa-user-check text-2xl"></i>
                    </div>
                </div>
                <div class="flex items-center text-sm">
                    <span class="text-green-100">من إجمالي <span id="totalEmployeesForAttendance">0</span></span>
                </div>
            </div>

            <!-- Pending Leaves -->
            <div class="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="text-yellow-100 text-sm">طلبات الإجازات المعلقة</p>
                        <h3 class="text-4xl font-bold mt-1" id="pendingLeaves">0</h3>
                    </div>
                    <div class="bg-white/20 p-3 rounded-lg">
                        <i class="fas fa-calendar-times text-2xl"></i>
                    </div>
                </div>
                <div class="flex items-center text-sm">
                    <span class="text-yellow-100">تحتاج موافقة</span>
                </div>
            </div>

            <!-- Pending Salaries -->
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="text-purple-100 text-sm">الرواتب المعلقة</p>
                        <h3 class="text-4xl font-bold mt-1" id="pendingSalariesCount">0</h3>
                    </div>
                    <div class="bg-white/20 p-3 rounded-lg">
                        <i class="fas fa-money-bill-wave text-2xl"></i>
                    </div>
                </div>
                <div class="flex items-center text-sm">
                    <span class="text-purple-100" id="pendingSalariesAmount">0 ريال</span>
                </div>
            </div>
        </div>

        <!-- Quick Access Menu -->
        <div class="bg-white rounded-xl shadow-xl p-6 mb-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <i class="fas fa-th-large ml-3 text-indigo-600"></i>
                القائمة الرئيسية
            </h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <!-- Employees -->
                <a href="/admin/hr/employees" class="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-500 hover:to-blue-600 rounded-xl p-6 transition-all transform hover:scale-105 hover:shadow-xl">
                    <div class="text-center">
                        <div class="bg-blue-500 group-hover:bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-all">
                            <i class="fas fa-users text-white group-hover:text-blue-500 text-2xl transition-all"></i>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 group-hover:text-white transition-all">إدارة الموظفين</h3>
                        <p class="text-sm text-gray-600 group-hover:text-blue-100 mt-2 transition-all">عرض وإدارة بيانات الموظفين</p>
                    </div>
                </a>

                <!-- Attendance -->
                <a href="/admin/hr/attendance" class="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-500 hover:to-green-600 rounded-xl p-6 transition-all transform hover:scale-105 hover:shadow-xl">
                    <div class="text-center">
                        <div class="bg-green-500 group-hover:bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-all">
                            <i class="fas fa-clock text-white group-hover:text-green-500 text-2xl transition-all"></i>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 group-hover:text-white transition-all">الحضور والغياب</h3>
                        <p class="text-sm text-gray-600 group-hover:text-green-100 mt-2 transition-all">تسجيل ومتابعة الحضور</p>
                    </div>
                </a>

                <!-- Leaves -->
                <a href="/admin/hr/leaves" class="group bg-gradient-to-br from-yellow-50 to-orange-100 hover:from-yellow-500 hover:to-orange-500 rounded-xl p-6 transition-all transform hover:scale-105 hover:shadow-xl">
                    <div class="text-center">
                        <div class="bg-yellow-500 group-hover:bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-all">
                            <i class="fas fa-umbrella-beach text-white group-hover:text-yellow-500 text-2xl transition-all"></i>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 group-hover:text-white transition-all">إدارة الإجازات</h3>
                        <p class="text-sm text-gray-600 group-hover:text-orange-100 mt-2 transition-all">طلبات وموافقات الإجازات</p>
                    </div>
                </a>

                <!-- Salaries -->
                <a href="/admin/hr/salaries" class="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-500 hover:to-purple-600 rounded-xl p-6 transition-all transform hover:scale-105 hover:shadow-xl">
                    <div class="text-center">
                        <div class="bg-purple-500 group-hover:bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-all">
                            <i class="fas fa-money-check-alt text-white group-hover:text-purple-500 text-2xl transition-all"></i>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 group-hover:text-white transition-all">إدارة الرواتب</h3>
                        <p class="text-sm text-gray-600 group-hover:text-purple-100 mt-2 transition-all">حساب وصرف الرواتب</p>
                    </div>
                </a>

                <!-- Performance Reviews -->
                <a href="/admin/hr/performance" class="group bg-gradient-to-br from-red-50 to-pink-100 hover:from-red-500 hover:to-pink-500 rounded-xl p-6 transition-all transform hover:scale-105 hover:shadow-xl">
                    <div class="text-center">
                        <div class="bg-red-500 group-hover:bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-all">
                            <i class="fas fa-star text-white group-hover:text-red-500 text-2xl transition-all"></i>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 group-hover:text-white transition-all">تقييم الأداء</h3>
                        <p class="text-sm text-gray-600 group-hover:text-pink-100 mt-2 transition-all">تقييمات ومراجعات الأداء</p>
                    </div>
                </a>

                <!-- Promotions & Transfers -->
                <a href="/admin/hr/promotions" class="group bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-500 hover:to-cyan-600 rounded-xl p-6 transition-all transform hover:scale-105 hover:shadow-xl">
                    <div class="text-center">
                        <div class="bg-cyan-500 group-hover:bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-all">
                            <i class="fas fa-level-up-alt text-white group-hover:text-cyan-500 text-2xl transition-all"></i>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 group-hover:text-white transition-all">الترقيات والنقل</h3>
                        <p class="text-sm text-gray-600 group-hover:text-cyan-100 mt-2 transition-all">إدارة الترقيات والنقل</p>
                    </div>
                </a>

                <!-- Document Alerts -->
                <a href="/admin/hr/documents" class="group bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-500 hover:to-amber-600 rounded-xl p-6 transition-all transform hover:scale-105 hover:shadow-xl">
                    <div class="text-center">
                        <div class="bg-amber-500 group-hover:bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-all">
                            <i class="fas fa-file-alt text-white group-hover:text-amber-500 text-2xl transition-all"></i>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 group-hover:text-white transition-all">تنبيهات المستندات</h3>
                        <p class="text-sm text-gray-600 group-hover:text-amber-100 mt-2 transition-all">انتهاء صلاحيات المستندات</p>
                    </div>
                </a>

                <!-- Reports -->
                <a href="/admin/hr/reports" class="group bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-500 hover:to-teal-600 rounded-xl p-6 transition-all transform hover:scale-105 hover:shadow-xl">
                    <div class="text-center">
                        <div class="bg-teal-500 group-hover:bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-all">
                            <i class="fas fa-chart-bar text-white group-hover:text-teal-500 text-2xl transition-all"></i>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 group-hover:text-white transition-all">التقارير والإحصاءات</h3>
                        <p class="text-sm text-gray-600 group-hover:text-teal-100 mt-2 transition-all">تقارير شاملة ومفصلة</p>
                    </div>
                </a>
            </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Employees by Department -->
            <div class="bg-white rounded-xl shadow-xl p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-chart-pie ml-2 text-blue-600"></i>
                    توزيع الموظفين حسب القسم
                </h3>
                <canvas id="departmentChart" height="200"></canvas>
            </div>

            <!-- Attendance Statistics -->
            <div class="bg-white rounded-xl shadow-xl p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-chart-line ml-2 text-green-600"></i>
                    إحصائيات الحضور (آخر 7 أيام)
                </h3>
                <canvas id="attendanceChart" height="200"></canvas>
            </div>
        </div>
    </div>

    <script>
        // تهيئة التوكن
        const token = localStorage.getItem('authToken') || getCookie('authToken');
        console.log('🔑 Token found:', token ? 'YES' : 'NO');
        if (!token) {
            console.log('❌ No token, redirecting to login');
            window.location.href = '/login';
        }

        // تحميل البيانات الإحصائية
        async function loadDashboardStats() {
            console.log('📊 Loading dashboard stats...');
            try {
                const response = await axios.get('/api/hr/dashboard/stats', {
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });
                
                console.log('✅ Response received:', response.data);
                
                if (response.data.success) {
                    const stats = response.data.data;
                    console.log('📈 Stats:', stats);
                    
                    // إحصائيات الموظفين
                    document.getElementById('totalEmployees').textContent = stats.totalEmployees || 0;
                    document.getElementById('activeEmployees').textContent = stats.activeEmployees || 0;
                    document.getElementById('totalEmployeesForAttendance').textContent = stats.totalEmployees || 0;
                    
                    // إحصائيات الحضور
                    document.getElementById('presentToday').textContent = stats.presentToday || 0;
                    
                    // الإجازات المعلقة
                    document.getElementById('pendingLeaves').textContent = stats.pendingLeaves || 0;
                    
                    // الرواتب المعلقة
                    document.getElementById('pendingSalariesCount').textContent = stats.pendingSalaries || 0;
                    document.getElementById('pendingSalariesAmount').textContent = 
                        (stats.pendingSalariesAmount || 0).toLocaleString('ar-SA') + ' ريال';
                    
                    // رسم البيانات
                    console.log('🎨 Drawing charts...');
                    drawDepartmentChart(stats.departmentDistribution);
                    drawAttendanceChart(stats.attendanceTrend);
                    console.log('✅ Dashboard loaded successfully!');
                }
            } catch (error) {
                console.error('❌ Error loading dashboard stats:', error);
                console.error('Error details:', error.response?.data || error.message);
            }
        }

        // رسم مخطط الأقسام
        function drawDepartmentChart(data) {
            const ctx = document.getElementById('departmentChart').getContext('2d');
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.department),
                    datasets: [{
                        data: data.map(d => d.count),
                        backgroundColor: [
                            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
                            '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // رسم مخطط الحضور
        function drawAttendanceChart(data) {
            const ctx = document.getElementById('attendanceChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(d => d.date),
                    datasets: [{
                        label: 'حاضر',
                        data: data.map(d => d.present),
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'غائب',
                        data: data.map(d => d.absent),
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // Helper function: get cookie
        function getCookie(name) {
            const value = \`; \${document.cookie}\`;
            const parts = value.split(\`; \${name}=\`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        }

        // Toggle Sidebar
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');
            
            if (sidebar.classList.contains('translate-x-full')) {
                // فتح القائمة
                sidebar.classList.remove('translate-x-full');
                sidebar.classList.add('translate-x-0');
                overlay.classList.remove('hidden');
            } else {
                // إغلاق القائمة
                sidebar.classList.add('translate-x-full');
                sidebar.classList.remove('translate-x-0');
                overlay.classList.add('hidden');
            }
        }

        // Logout
        function logout() {
            localStorage.removeItem('authToken');
            document.cookie = 'authToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            window.location.href = '/login';
        }

        // تحميل البيانات عند فتح الصفحة
        loadDashboardStats();
    </script>
</body>
</html>
`
