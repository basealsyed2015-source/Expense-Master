export const homePage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>منصة حاسبة التمويل</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .mobile-menu {
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
        }
        .mobile-menu.active {
            transform: translateX(0);
        }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
    <!-- Top Header Bar -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex items-center justify-between h-16">
                <!-- Right: Menu Toggle -->
                <button onclick="toggleMenu()" class="p-2 hover:bg-white/10 rounded-lg transition-all" title="القائمة">
                    <i class="fas fa-bars text-2xl"></i>
                </button>
                
                <!-- Center: Title -->
                <div class="flex items-center space-x-2 space-x-reverse">
                    <i class="fas fa-calculator text-2xl"></i>
                    <h1 class="text-xl font-bold">منصة حاسبة التمويل</h1>
                </div>
                
                <!-- Left: Login Button -->
                <a href="/login" class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all flex items-center">
                    <i class="fas fa-sign-in-alt ml-2"></i>
                    <span class="hidden md:inline">تسجيل دخول</span>
                </a>
            </div>
        </div>
    </div>

    <!-- Mobile Menu -->
    <div id="mobileMenu" class="mobile-menu fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto">
        <div class="p-6">
            <!-- Close Button -->
            <button onclick="toggleMenu()" class="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg transition-all">
                <i class="fas fa-times text-2xl text-gray-600"></i>
            </button>
            
            <!-- Logo -->
            <div class="mb-8 pt-4">
                <div class="flex items-center space-x-3 space-x-reverse mb-4">
                    <i class="fas fa-calculator text-4xl text-blue-600"></i>
                    <div>
                        <h2 class="text-xl font-bold text-gray-800">منصة التمويل</h2>
                        <p class="text-sm text-gray-500">حاسبة التمويل</p>
                    </div>
                </div>
            </div>

            <!-- Menu Items -->
            <div class="space-y-2">
                <a href="/" class="flex items-center space-x-3 space-x-reverse p-4 bg-blue-50 rounded-lg">
                    <i class="fas fa-home text-xl text-blue-600"></i>
                    <span class="font-medium text-blue-600">الرئيسية</span>
                </a>

                <a href="/calculator" class="flex items-center space-x-3 space-x-reverse p-4 hover:bg-blue-50 rounded-lg transition-all group">
                    <i class="fas fa-calculator text-xl text-gray-600 group-hover:text-blue-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-blue-600">الحاسبة</span>
                </a>

                <a href="/login" class="flex items-center space-x-3 space-x-reverse p-4 hover:bg-green-50 rounded-lg transition-all group">
                    <i class="fas fa-sign-in-alt text-xl text-gray-600 group-hover:text-green-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-green-600">تسجيل الدخول</span>
                </a>

                <a href="/admin/panel" class="flex items-center space-x-3 space-x-reverse p-4 hover:bg-purple-50 rounded-lg transition-all group">
                    <i class="fas fa-tachometer-alt text-xl text-gray-600 group-hover:text-purple-600"></i>
                    <span class="font-medium text-gray-700 group-hover:text-purple-600">لوحة التحكم</span>
                </a>
            </div>
        </div>
    </div>

    <!-- Overlay -->
    <div id="menuOverlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden" onclick="toggleMenu()"></div>

    <div class="container mx-auto px-4 py-12">
        <div class="max-w-6xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-12">
                <i class="fas fa-calculator text-6xl text-blue-600 mb-4"></i>
                <h2 class="text-5xl font-bold text-gray-800 mb-4">منصة حاسبة التمويل</h2>
                <p class="text-xl text-gray-600">نظام شامل لإدارة التمويل والعملاء والبنوك</p>
            </div>
            
            <!-- Main Links -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
                <a href="/calculator" class="block bg-gradient-to-br from-blue-500 to-blue-700 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                    <i class="fas fa-calculator text-5xl mb-4"></i>
                    <h2 class="text-2xl font-bold mb-2">الحاسبة</h2>
                    <p class="text-blue-100">احسب التمويل المناسب لك</p>
                </a>
                
                <a href="/login" class="block bg-gradient-to-br from-green-500 to-green-700 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-105">
                    <i class="fas fa-sign-in-alt text-5xl mb-4"></i>
                    <h2 class="text-2xl font-bold mb-2">تسجيل الدخول</h2>
                    <p class="text-green-100">دخول الموظفين</p>
                </a>
            </div>
            
            <!-- Features -->
            <div class="bg-white rounded-2xl shadow-xl p-8">
                <h3 class="text-2xl font-bold mb-6 text-gray-800">
                    <i class="fas fa-star text-yellow-500 ml-2"></i>
                    مميزات النظام
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex items-start">
                        <i class="fas fa-calculator text-blue-500 text-2xl ml-3 mt-1"></i>
                        <div>
                            <h4 class="font-bold text-lg mb-1">حاسبة تمويل متقدمة</h4>
                            <p class="text-gray-600">حساب دقيق لجميع أنواع التمويل</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-university text-green-500 text-2xl ml-3 mt-1"></i>
                        <div>
                            <h4 class="font-bold text-lg mb-1">إدارة البنوك والنسب</h4>
                            <p class="text-gray-600">تحديث نسب التمويل لجميع البنوك</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-users text-purple-500 text-2xl ml-3 mt-1"></i>
                        <div>
                            <h4 class="font-bold text-lg mb-1">إدارة المستخدمين</h4>
                            <p class="text-gray-600">نظام صلاحيات كامل</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <i class="fas fa-file-invoice-dollar text-orange-500 text-2xl ml-3 mt-1"></i>
                        <div>
                            <h4 class="font-bold text-lg mb-1">إدارة الاشتراكات</h4>
                            <p class="text-gray-600">باقات مرنة للشركات</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // Toggle Mobile Menu
        function toggleMenu() {
            const menu = document.getElementById('mobileMenu');
            const overlay = document.getElementById('menuOverlay');
            
            menu.classList.toggle('active');
            overlay.classList.toggle('hidden');
        }

        // Load unread notifications count
        async function loadUnreadCount() {
            try {
                const response = await axios.get('/api/notifications/unread-count');
                if (response.data.success && response.data.count > 0) {
                    const badge = document.getElementById('notif-badge');
                    if (badge) {
                        badge.textContent = response.data.count;
                        badge.classList.remove('hidden');
                    }
                }
            } catch (error) {
                console.error('Error loading unread count:', error);
            }
        }
        
        loadUnreadCount();
    </script>
</body>
</html>
`;
