// =============================================================================
// ⚠️  THIS IS NOT THE LIVE CUSTOMERS/REQUESTS TABLE PAGE
// =============================================================================
//   This file is a legacy SPA (/admin/full route) with its own client-rendered
//   tables (tbody#customersTable, tbody#requestsTable). The pages users actually
//   hit at /admin/customers and /admin/requests live in src/index.tsx — they are
//   server-rendered with tbody#tableBody. If a feature must show up on those
//   real pages, edit src/index.tsx, NOT this file.
// =============================================================================
export const fullAdminPanel = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>لوحة التحكم - نظام حاسبة التمويل</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
    <style>
        .content-section { display: none; min-width: 0; }
        .content-section.active { display: block; animation: fadeIn 0.5s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.7)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
        #alarm-panel { position:fixed; top:0; left:0; bottom:0; width:400px; max-width:95vw; background:#fff; box-shadow:4px 0 30px rgba(0,0,0,.15); z-index:1100; display:flex; flex-direction:column; transform:translateX(-100%); transition:transform .3s ease; }
        #alarm-panel.open { transform:translateX(0); }
        #alarm-panel-overlay { position:fixed; inset:0; background:rgba(0,0,0,.3); z-index:1099; display:none; }
        #alarm-panel-overlay.open { display:block; }
        .quick-access-btn { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .quick-access-btn:active { transform: scale(0.95) !important; }
        
        /* Enhanced Scrollbar Styles */
        .overflow-x-auto {
            overflow-x: auto;
            max-width: 100%;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e0 #f7fafc;
        }

        /* Prevent wide tables from stretching the whole page */
        .overflow-x-auto > table {
            width: max-content;
            min-width: 100%;
        }

        /* Let header/content use full width on large screens */
        .page-header-inner {
            max-width: none;
            margin-left: 0;
            margin-right: 0;
            width: 100%;
        }

        /* Truncate long names inside cells */
        .truncate-cell {
            display: inline-block;
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            vertical-align: bottom;
        }
        .truncate-cell.sm {
            max-width: 130px;
        }

        /* Make table rows visually consistent */
        .overflow-x-auto > table th,
        .overflow-x-auto > table td {
            white-space: nowrap;
        }
        
        .overflow-x-auto::-webkit-scrollbar {
            height: 8px;
        }
        
        .overflow-x-auto::-webkit-scrollbar-track {
            background: #f7fafc;
            border-radius: 10px;
        }
        
        .overflow-x-auto::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 10px;
        }
        
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
        }

        /* Hide horizontal scrollbar (keep scroll) for edge-arrow tables */
        .no-hscrollbar {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE/Edge legacy */
        }
        .no-hscrollbar::-webkit-scrollbar {
            width: 0 !important;
            height: 0 !important;
            display: none !important;
        }

        /* Hover-to-reveal horizontal scroll arrows (tables) */
        .edge-scroll-wrap { position: relative; }
        /* Zone uses pointer-events:none so rows/actions under the gutters stay clickable; buttons opt in on wrap hover */
        .edge-scroll-zone {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 64px;
            z-index: 80;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
        }
        .edge-scroll-zone.left { left: 0; background: linear-gradient(90deg, rgba(249,250,251,.92) 0%, rgba(249,250,251,0) 100%); }
        .edge-scroll-zone.right { right: 0; background: linear-gradient(270deg, rgba(249,250,251,.92) 0%, rgba(249,250,251,0) 100%); }
        .edge-scroll-zone .edge-scroll-btn {
            opacity: 1;
            pointer-events: auto;
            transition: opacity 160ms ease, box-shadow 160ms ease;
            position: absolute;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        .edge-scroll-wrap:hover .edge-scroll-zone .edge-scroll-btn:not(.edge-hidden) {
            box-shadow: 0 12px 40px rgba(15,23,42,0.18);
        }

        .edge-scroll-btn button {
            width: 38px;
            height: 96px;
            border-radius: 9999px;
            border: 1px solid rgba(209,213,219,1);
            background: rgba(255,255,255,0.92);
            box-shadow: 0 12px 36px rgba(0,0,0,0.14);
            color: #111827;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .edge-scroll-btn button:hover { background: rgba(255,255,255,1); }
        .edge-scroll-btn.edge-hidden {
            opacity: 0 !important;
            pointer-events: none !important;
            display: none !important;
        }
        /* left/right positioning is handled by edge-scroll-zone */
        .edge-scroll-wrap .overflow-x-auto {
            padding-left: 8px;
            padding-right: 8px;
        }

        #customersTable.dropdown-open tr:not(.dropdown-active-row),
        #requestsTable.dropdown-open tr:not(.dropdown-active-row) {
            pointer-events: none !important;
        }
        #customersTable.dropdown-open tr:not(.dropdown-active-row):hover td,
        #requestsTable.dropdown-open tr:not(.dropdown-active-row):hover td {
            background-color: inherit !important;
        }
        
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
            /* Make tables horizontally scrollable */
            .overflow-x-auto {
                -webkit-overflow-scrolling: touch;
            }
            
            /* Adjust padding for mobile */
            .px-6 { padding-left: 1rem; padding-right: 1rem; }
            .px-8 { padding-left: 1rem; padding-right: 1rem; }
            
            /* Make buttons full width on mobile */
            .quick-access-btn {
                width: 100%;
                margin-bottom: 0.5rem;
            }
            
            /* Adjust grid columns for mobile */
            .grid-cols-2 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            
            /* Hide less important columns on mobile */
            .mobile-hide { display: none; }
            
            /* Make modals full screen on mobile */
            .fixed.inset-0 > div {
                width: 95% !important;
                max-width: 95% !important;
                margin: 1rem auto !important;
                max-height: 90vh !important;
                overflow-y: auto !important;
            }
            
            /* Adjust font sizes */
            .text-3xl { font-size: 1.5rem; }
            .text-2xl { font-size: 1.25rem; }
            
            /* Make sidebar toggleable on mobile */
            #sidebar {
                position: fixed;
                left: -100%;
                transition: left 0.3s ease;
                z-index: 50;
                height: 100vh;
            }
            
            #sidebar.active {
                left: 0;
            }
            
            /* Add overlay for mobile sidebar */
            #sidebar-overlay {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.5);
                z-index: 40;
            }
            
            #sidebar-overlay.active {
                display: block;
            }
        }
        
        /* Tablet Styles */
        @media (min-width: 769px) and (max-width: 1024px) {
            .grid-cols-4 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        .share-links-dropdown-chevron.open {
            transform: rotate(180deg);
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- شريط علوي: المستخدم والإجراءات السريعة؛ روابط الأقسام في الشريط الجانبي الموحد (حقن من الخادم). -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg sticky top-0 z-40">
        <div class="page-header-inner flex items-center justify-between px-6 py-4 gap-3 flex-wrap">
            <div class="flex items-center gap-1 shrink-0">
            <button type="button" class="p-2 hover:bg-white/10 rounded-lg shrink-0" title="القائمة" aria-label="فتح أو إغلاق قائمة التنقل" onclick="(function(){var t=document.getElementById('gps-panel-rail-toggle');if(t)t.click();})()">
                <i class="fas fa-bars text-2xl"></i>
            </button>
            <a href="/admin/panel" class="p-2 hover:bg-white/10 rounded-lg shrink-0 text-white no-underline" title="لوحة الوصول السريع" aria-label="الصفحة الرئيسية">
                <i class="fas fa-home text-2xl"></i>
            </a>
            </div>
            <div class="flex items-center space-x-reverse space-x-3 min-w-0 flex-1 justify-center md:justify-center">
                <div class="text-right min-w-0">
                    <div class="font-bold truncate max-w-[min(100vw-12rem,28rem)]" id="userDisplayName">جاري التحميل...</div>
                    <div class="text-xs text-blue-200 truncate max-w-[min(100vw-12rem,28rem)]" id="userEmail">-</div>
                </div>
                <i class="fas fa-user-circle text-3xl shrink-0"></i>
            </div>
            <div class="flex items-center space-x-reverse space-x-2 shrink-0">
                <button type="button" onclick="toggleDarkMode()" class="p-2 hover:bg-white/10 rounded-lg hidden md:inline-block" title="الوضع الليلي">
                    <i class="fas fa-moon"></i>
                </button>
                <button type="button" id="notif-bell-btn" onclick="openAlarmPanel()" class="relative p-2 hover:bg-white/10 rounded-lg" style="display:none" title="الإشعارات">
                    <i class="fas fa-bell"></i>
                    <span id="notif-badge" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none"></span>
                </button>
                <button type="button" onclick="doLogout()" class="p-2 hover:bg-red-500 rounded-lg transition-colors hidden md:inline-block" title="تسجيل الخروج">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- Main Content بدون Sidebar -->
    <div class="min-h-screen bg-gray-50">
        <div class="w-full px-6 py-6 2xl:px-10">
            
            <!-- لوحة الوصول السريع -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <i class="fas fa-th-large text-blue-600 ml-3"></i>
                    لوحة الوصول السريع
                </h2>
                
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <!-- زر ملخص العملاء -->
                    <a href="/admin/dashboard" class="quick-access-btn bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-tachometer-alt text-3xl mb-2"></i>
                        <div class="text-sm font-bold">ملخص العملاء</div>
                    </a>
                    
                    <!-- زر العملاء -->
                    <a href="/admin/customers" class="quick-access-btn bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-users text-3xl mb-2"></i>
                        <div class="text-sm font-bold">متابعة العملاء</div>
                    </a>
                    
                    <!-- زر طلبات التمويل -->
                    <a href="/admin/requests" class="quick-access-btn bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-file-invoice text-3xl mb-2"></i>
                        <div class="text-sm font-bold">طلبات التمويل</div>
                    </a>

                    <a href="/admin/my-tasks" class="quick-access-btn bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-tasks text-3xl mb-2"></i>
                        <div class="text-sm font-bold">مهامي</div>
                    </a>

                    <a href="/admin/my-archived-tasks" class="quick-access-btn bg-gradient-to-br from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-archive text-3xl mb-2"></i>
                        <div class="text-sm font-bold">ارشيف الإعلانات</div>
                    </a>

                    <!-- زر التقارير -->
                    <a href="/admin/reports" class="quick-access-btn bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-chart-line text-3xl mb-2"></i>
                        <div class="text-sm font-bold">التقارير</div>
                    </a>
                    
                    <a href="/admin/follow-ups" class="quick-access-btn bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-bullhorn text-3xl mb-2"></i>
                        <div class="text-sm font-bold">الإعلانات</div>
                    </a>
                    
                    <!-- زر نسب التمويل -->
                    <a href="/admin/rates" class="quick-access-btn bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-percentage text-3xl mb-2"></i>
                        <div class="text-sm font-bold">نسب التمويل</div>
                    </a>
                    
                    <!-- زر سندات القبض -->
                    <a href="/admin/payments" class="quick-access-btn bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-receipt text-3xl mb-2"></i>
                        <div class="text-sm font-bold">سندات القبض</div>
                    </a>
                    
                    <!-- زر البنوك -->
                    <a href="/admin/banks" class="quick-access-btn bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-university text-3xl mb-2"></i>
                        <div class="text-sm font-bold">البنوك</div>
                    </a>
                    
                    <!-- زر الاشتراكات -->
                    <a href="/admin/subscriptions" data-superadmin-only="true" class="quick-access-btn bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-id-card text-3xl mb-2"></i>
                        <div class="text-sm font-bold">الاشتراكات</div>
                    </a>
                    
                    <!-- زر الباقات -->
                    <a href="/admin/packages" data-superadmin-only="true" class="quick-access-btn bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-box text-3xl mb-2"></i>
                        <div class="text-sm font-bold">الباقات</div>
                    </a>
                    
                    <!-- زر المستخدمين -->
                    <a href="/admin/users" class="quick-access-btn bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-users-cog text-3xl mb-2"></i>
                        <div class="text-sm font-bold">المستخدمين</div>
                    </a>
                    
                    <!-- زر الأدوار (Super Admin فقط) -->
                    <a href="/admin/roles" data-superadmin-only="true" class="quick-access-btn bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-user-shield text-3xl mb-2"></i>
                        <div class="text-sm font-bold">الأدوار والصلاحيات</div>
                    </a>
                    
                    <!-- زر نظام الموارد البشرية HR -->
                    <a href="/admin/hr" class="quick-access-btn bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center border-2 border-white/30">
                        <i class="fas fa-users-cog text-3xl mb-2"></i>
                        <div class="text-sm font-bold">الموارد البشرية HR</div>
                        <div class="text-xs mt-1 opacity-90">إدارة الموظفين</div>
                    </a>
                    
                    <a href="/admin/contracts" class="quick-access-btn bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-file-contract text-3xl mb-2"></i>
                        <div class="text-sm font-bold">إدارة العقود</div>
                        <div class="text-xs mt-1 opacity-90">عقود وسندات</div>
                    </a>
                    
                    <!-- زر الإشعارات -->
                    <a href="/admin/notifications" class="quick-access-btn bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-bell text-3xl mb-2"></i>
                        <div class="text-sm font-bold">الإشعارات</div>
                    </a>

                    <!-- إعدادات الشركة (مدير الشركة — دور 2 فقط عبر القائمة المسموحة) -->
                    <a href="/admin/company-settings" class="quick-access-btn bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-building text-3xl mb-2"></i>
                        <div class="text-sm font-bold">إعدادات الشركة</div>
                    </a>
                    
                    <!-- زر الحاسبة -->
                    <a href="/calculator" id="calculatorLink" class="quick-access-btn bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-calculator text-3xl mb-2"></i>
                        <div class="text-sm font-bold">الحاسبة</div>
                    </a>
                    
                    <!-- زر الشركات (Super Admin فقط) -->
                    <a href="/admin/tenants" data-superadmin-only="true" class="quick-access-btn bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-building text-3xl mb-2"></i>
                        <div class="text-sm font-bold">إدارة الشركات</div>
                    </a>
                    
                    <!-- زر حاسبات الشركات -->
                    <a href="/admin/tenant-calculators" data-superadmin-only="true" class="quick-access-btn bg-gradient-to-br from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-calculator text-3xl mb-2"></i>
                        <div class="text-sm font-bold">حاسبات الشركات</div>
                    </a>
                    
                    <!-- زر إعدادات النظام -->
                    <a href="/admin/settings" data-superadmin-only="true" class="quick-access-btn bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-cog text-3xl mb-2"></i>
                        <div class="text-sm font-bold">إعدادات النظام</div>
                    </a>
                    
                    <!-- زر نموذج SaaS -->
                    <a href="/admin/saas-settings" data-superadmin-only="true" class="quick-access-btn bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-lg block text-center">
                        <i class="fas fa-cogs text-3xl mb-2"></i>
                        <div class="text-sm font-bold">إعدادات SaaS</div>
                    </a>
                </div>
            </div>
            <!-- Dashboard Section -->
            <div id="dashboard-section" class="content-section active">
                <div id="dashboardCustomerSummarySection">
                <h1 class="text-3xl font-bold mb-6 text-gray-800">
                    <i class="fas fa-tachometer-alt text-blue-600 ml-2"></i>
                    ملخص العملاء
                </h1>
                
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-blue-100 text-sm mb-1">إجمالي العملاء</p>
                                <p class="text-3xl font-bold" id="stat-customers">0</p>
                            </div>
                            <i class="fas fa-users text-5xl opacity-30"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-green-100 text-sm mb-1">إجمالي الطلبات</p>
                                <p class="text-3xl font-bold" id="stat-requests">0</p>
                            </div>
                            <i class="fas fa-file-invoice text-5xl opacity-30"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl shadow-lg p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-yellow-100 text-sm mb-1">قيد الانتظار</p>
                                <p class="text-3xl font-bold" id="stat-pending">0</p>
                            </div>
                            <i class="fas fa-clock text-5xl opacity-30"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-purple-100 text-sm mb-1">مقبول</p>
                                <p class="text-3xl font-bold" id="stat-approved">0</p>
                            </div>
                            <i class="fas fa-check-circle text-5xl opacity-30"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Additional Stats - Superadmin Only -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-6 superadmin-only-stats" style="display: none;">
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600">البنوك النشطة</span>
                            <i class="fas fa-university text-blue-500"></i>
                        </div>
                        <p class="text-2xl font-bold text-gray-800" id="stat-banks">0</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600">الشركات النشطة</span>
                            <i class="fas fa-building text-emerald-500"></i>
                        </div>
                        <p class="text-2xl font-bold text-gray-800" id="stat-tenants">0</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600">الاشتراكات النشطة</span>
                            <i class="fas fa-crown text-yellow-500"></i>
                        </div>
                        <p class="text-2xl font-bold text-gray-800" id="stat-subscriptions">0</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600">المستخدمين النشطين</span>
                            <i class="fas fa-user-check text-green-500"></i>
                        </div>
                        <p class="text-2xl font-bold text-gray-800" id="stat-users">0</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-gray-600">إجمالي الحسابات</span>
                            <i class="fas fa-calculator text-purple-500"></i>
                        </div>
                        <p class="text-2xl font-bold text-gray-800" id="stat-calculations">0</p>
                    </div>
                </div>
                </div>
                
                <!-- Calculator (always visible) + contact/affiliate (collapsible); QR column stays content-sized when dropdown expands -->
                <div class="bg-white rounded-xl shadow-lg p-6 mt-6" id="calculatorLinkSection">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:items-start">
                        <div class="flex flex-col gap-6">
                            <!-- Calculator: always visible -->
                            <div class="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                                <div class="flex flex-col justify-center px-4 py-4">
                                    <section>
                                        <h3 class="flex items-center text-sm font-bold text-gray-800 mb-3">
                                            <span class="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 ml-2">
                                                <i class="fas fa-calculator text-sm"></i>
                                            </span>
                                            حاسبة التمويل
                                        </h3>
                                        <label class="block text-xs font-medium text-gray-600 mb-1.5">رابط الحاسبة</label>
                                        <div class="flex gap-2">
                                            <input 
                                                type="text" 
                                                id="calculatorLinkInput" 
                                                value="جاري التحميل..." 
                                                readonly 
                                                class="flex-1 min-w-0 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                                            >
                                            <button 
                                                type="button"
                                                onclick="copyCalculatorLink()" 
                                                class="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-bold transition-colors"
                                                title="نسخ الرابط"
                                            >
                                                <i class="fas fa-copy"></i>
                                            </button>
                                        </div>
                                        <p class="text-xs text-gray-500 mt-2">
                                            <i class="fas fa-info-circle ml-1"></i>
                                            للعملاء لاستخدام حاسبة التمويل
                                        </p>
                                        <div id="copySuccessMessage" class="hidden mt-2 p-2 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
                                            <i class="fas fa-check-circle ml-1"></i>
                                            تم نسخ الرابط
                                        </div>
                                        <button 
                                            type="button"
                                            onclick="openCalculatorLink()" 
                                            class="w-full mt-3 bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors shadow-sm"
                                        >
                                            <i class="fas fa-external-link-alt ml-2"></i>
                                            فتح الحاسبة في نافذة جديدة
                                        </button>
                                    </section>
                                </div>
                            </div>

                            <!-- Contact + affiliate links (collapsible); flex-shrink-0 keeps bar below calculator -->
                            <div class="share-links-dropdown flex-shrink-0 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                                <button
                                    type="button"
                                    id="shareLinksDropdownToggle"
                                    class="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-start"
                                    onclick="toggleShareLinksDropdown()"
                                    aria-expanded="false"
                                    aria-controls="shareLinksDropdownPanel"
                                >
                                    <span class="flex items-center gap-3 min-w-0">
                                        <i class="fas fa-address-card text-blue-600 text-xl flex-shrink-0"></i>
                                        <span class="text-base font-bold text-gray-800">صفحة التواصل وروابط التتبع</span>
                                    </span>
                                    <i id="shareLinksDropdownChevron" class="fas fa-chevron-down share-links-dropdown-chevron text-gray-500 text-sm transition-transform duration-200 flex-shrink-0" aria-hidden="true"></i>
                                </button>
                                <div id="shareLinksDropdownPanel" class="hidden border-t border-gray-100 bg-white px-4 py-4" role="region" aria-label="التواصل والتتبع">
                                    <div class="flex flex-col gap-8">
                            <!-- Contact root -->
                            <section>
                                <h3 class="flex items-center text-sm font-bold text-gray-800 mb-3">
                                    <span class="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 ml-2">
                                        <i class="fas fa-address-card text-sm"></i>
                                    </span>
                                    صفحة التواصل
                                </h3>
                                <label class="block text-xs font-medium text-gray-600 mb-1.5">رابط صفحة التواصل (المسار الجذر)</label>
                                <div class="flex gap-2">
                                    <input
                                        type="text"
                                        id="contactRootLinkInput"
                                        value="جاري التحميل..."
                                        readonly
                                        class="flex-1 min-w-0 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-blue-500"
                                    >
                                    <button
                                        type="button"
                                        onclick="copyContactRootLink()"
                                        class="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-bold transition-colors"
                                        title="نسخ الرابط"
                                    >
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                                <div id="contactRootCopySuccessMessage" class="hidden mt-2 p-2 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
                                    <i class="fas fa-check-circle ml-1"></i>
                                    تم نسخ رابط التواصل
                                </div>
                                <button
                                    type="button"
                                    onclick="openContactRootLink()"
                                    class="w-full mt-3 bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors shadow-sm"
                                >
                                    <i class="fas fa-external-link-alt ml-2"></i>
                                    فتح صفحة التواصل في نافذة جديدة
                                </button>
                            </section>

                            <!-- Affiliate tracking links -->
                            <section id="contactAffiliateLinksWrap" class="pt-6 border-t border-gray-100" style="display:none;">
                                <h3 class="flex items-center text-sm font-bold text-gray-800 mb-2">
                                    <span class="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 ml-2">
                                        <i class="fas fa-bullhorn text-sm"></i>
                                    </span>
                                    روابط التتبع التسويقية
                                </h3>
                                <p class="text-xs text-gray-500 mb-4 leading-relaxed">مسار إضافي (مثل <span dir="ltr" class="font-mono text-gray-600">/facebook</span>) يظهر مصدر الطلب في المتابعة.</p>
                                <div id="contactAffiliateLinksList" class="space-y-3 max-h-72 overflow-y-auto pr-1"></div>
                                <div id="contactAffiliatesManageBlock" class="mt-4 pt-4 border-t border-gray-100">
                                    <a href="/admin/contact-affiliates" class="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800">
                                        <i class="fas fa-cog"></i>
                                        إدارة روابط التتبع
                                    </a>
                                </div>
                            </section>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right Side: QR Code (self-start: row height follows left column without stretching this panel) -->
                        <div class="flex w-full flex-col md:self-start">
                            <h3 class="flex items-center text-sm font-bold text-gray-800 mb-3">
                                <span class="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 ml-2">
                                    <i class="fas fa-qrcode text-sm"></i>
                                </span>
                                رمز QR للحاسبة
                            </h3>
                            <div class="flex flex-col items-center justify-center bg-gray-50 border border-gray-300 rounded-xl p-5">
                                <div id="qrcodeContainer" class="mb-3"></div>
                                <button 
                                    type="button"
                                    onclick="downloadQRCode()" 
                                    class="w-full max-w-xs bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
                                >
                                    <i class="fas fa-download ml-1"></i>
                                    تحميل رمز QR
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-3 text-center leading-relaxed">
                                <i class="fas fa-mobile-alt ml-1"></i>
                                يوجّه مباشرة إلى رابط الحاسبة أعلاه
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Employee Calculator Link & QR Code Section -->
                <div class="bg-white rounded-xl shadow-lg p-6 mt-6" id="employeeCalculatorSection" style="display: none;">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-calculator text-green-600 text-2xl ml-3"></i>
                        <h2 class="text-xl font-bold text-gray-800">رابط حاسبة الشركة</h2>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Left Side: Link -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-link ml-1"></i>
                                رابط حاسبة التمويل الخاصة بشركتك
                            </label>
                            <div class="flex gap-2">
                                <input 
                                    type="text" 
                                    id="employeeCalculatorLinkInput" 
                                    value="جاري التحميل..." 
                                    readonly 
                                    class="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-green-500"
                                >
                                <button 
                                    onclick="copyEmployeeCalculatorLink()" 
                                    class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                                    title="نسخ الرابط"
                                >
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-2">
                                <i class="fas fa-info-circle ml-1"></i>
                                يمكنك مشاركة هذا الرابط مع عملائك لاستخدام حاسبة التمويل
                            </p>
                            
                            <!-- Success Message -->
                            <div id="employeeCopySuccessMessage" class="hidden mt-2 p-2 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                                <i class="fas fa-check-circle ml-1"></i>
                                تم نسخ الرابط بنجاح!
                            </div>
                            
                            <!-- Open Link Button -->
                            <button 
                                onclick="openEmployeeCalculatorLink()" 
                                class="w-full mt-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-md hover:shadow-lg"
                            >
                                <i class="fas fa-external-link-alt ml-2"></i>
                                فتح الحاسبة في نافذة جديدة
                            </button>
                        </div>
                        
                        <!-- Right Side: QR Code -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-qrcode ml-1"></i>
                                باركود الحاسبة
                            </label>
                            <div class="flex flex-col items-center justify-center bg-gray-50 border border-gray-300 rounded-lg p-4">
                                <div id="employeeQRCodeContainer" class="mb-3"></div>
                                <button 
                                    onclick="downloadEmployeeQRCode()" 
                                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                >
                                    <i class="fas fa-download ml-1"></i>
                                    تحميل الباركود
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-2 text-center">
                                <i class="fas fa-mobile-alt ml-1"></i>
                                يمكن للعملاء مسح الباركود للوصول إلى الحاسبة مباشرة
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Customers Section -->
            <div id="customers-section" class="content-section">
                <div class="flex items-center justify-between mb-6 min-w-0 w-full flex-wrap gap-2">
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-users text-blue-600 ml-2"></i>
                        إدارة العملاء
                    </h1>
                    <div class="flex space-x-reverse space-x-3 min-w-0 flex-wrap gap-2">
                        <button onclick="addCustomer()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold">
                            <i class="fas fa-plus ml-2"></i>
                            إضافة عميل جديد
                        </button>
                        <button onclick="exportExcel('customers')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                            <i class="fas fa-file-excel ml-2"></i>
                            تصدير Excel
                        </button>
                        <button onclick="showAddCustomerModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                            <i class="fas fa-plus ml-2"></i>
                            إضافة عميل
                        </button>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg p-6 min-w-0 w-full">
                    <div class="mb-4">
                        <!-- Search bar always visible -->
                        <input type="text" id="searchCustomers" placeholder="بحث في العملاء..." oninput="loadCustomers()"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3">
                        <!-- Collapsible filters toggle -->
                        <button type="button" onclick="toggleCustomersFilters()" dir="rtl" class="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                            <span dir="rtl" class="inline-block text-right">الفلاتر</span>
                            <i class="fas fa-filter text-blue-500"></i>
                            <i id="customersFiltersIcon" class="fas fa-chevron-down text-xs transition-transform" style="transform: rotate(-90deg);"></i>
                        </button>
                        <div id="customersFiltersPanel" class="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style="display:none;">
                            <div class="flex items-center gap-2">
                                <label class="text-sm font-semibold text-gray-700 whitespace-nowrap">من تاريخ:</label>
                                <input type="date" id="filterDateFrom" onchange="loadCustomers()"
                                       class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 flex-1">
                            </div>
                            <div class="flex items-center gap-2">
                                <label class="text-sm font-semibold text-gray-700 whitespace-nowrap">إلى تاريخ:</label>
                                <input type="date" id="filterDateTo" onchange="loadCustomers()"
                                       class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 flex-1">
                            </div>
                            <select id="filterCustomerEmployee" onchange="loadCustomers()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="">جميع الموظفين</option>
                            </select>
                            <select id="filterCustomerBankAgent" onchange="loadCustomers()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="">جميع موظفي البنك</option>
                            </select>
                            <button type="button" onclick="resetCustomersFilters()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
                                <i class="fas fa-undo text-xs"></i>
                                إعادة تعيين
                            </button>
                        </div>
                    </div>
                    
                    <div id="customersEdgeScrollWrap" class="edge-scroll-wrap">
                        <div class="edge-scroll-zone left">
                            <div id="customersEdgeLeft" class="edge-scroll-btn edge-hidden">
                                <button type="button" onclick="edgeScrollStep('customersTableScroll', 'left')" aria-label="scroll left">
                                    <i class="fas fa-chevron-left text-lg"></i>
                                </button>
                            </div>
                        </div>
                        <div class="edge-scroll-zone right">
                            <div id="customersEdgeRight" class="edge-scroll-btn edge-hidden">
                                <button type="button" onclick="edgeScrollStep('customersTableScroll', 'right')" aria-label="scroll right">
                                    <i class="fas fa-chevron-right text-lg"></i>
                                </button>
                            </div>
                        </div>
                        <div id="customersTableScroll" class="overflow-x-auto no-hscrollbar">
                        <table class="min-w-full w-max">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">م</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الاسم</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الجوال</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">تاريخ الميلاد</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الراتب</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">مبلغ التمويل</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الالتزامات</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">نوع التمويل</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">موظف التمويل</th>
                                </tr>
                            </thead>
                            <tbody id="customersTable">
                                <tr>
                                    <td colspan="10" class="text-center py-8">
                                        <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    </div>

                    <!-- Customers Pagination -->
                    <div class="mt-4 flex items-center justify-between gap-3 flex-wrap">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-semibold text-gray-700 whitespace-nowrap">عدد الصفوف:</span>
                            <select id="customersPageSize" onchange="setCustomersPageSize(this.value)" class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"><option value="15">15</option></select>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="customersPrevBtn" onclick="setCustomersPage('prev')" class="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold hover:bg-gray-50">السابق</button>
                            <span id="customersPageInfo" class="text-sm text-gray-600 whitespace-nowrap"></span>
                            <button id="customersNextBtn" onclick="setCustomersPage('next')" class="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold hover:bg-gray-50">التالي</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Financing Requests Section -->
            <div id="financing-requests-section" class="content-section">
                <div class="flex items-center justify-between mb-4 min-w-0 w-full flex-wrap gap-2">
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-file-invoice text-green-600 ml-2"></i>
                        طلبات التمويل من العملاء
                    </h1>
                    <button onclick="loadFinancingRequests()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-sync ml-2"></i>
                        تحديث
                    </button>
                </div>

                <!-- Collapsible Filters -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                    <button type="button" onclick="toggleRequestsFilters()" dir="rtl" class="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                        <span dir="rtl" class="inline-block text-right">الفلاتر</span>
                        <i class="fas fa-filter text-blue-500"></i>
                        <i id="requestsFiltersIcon" class="fas fa-chevron-down text-xs transition-transform" style="transform: rotate(-90deg);"></i>
                    </button>
                    <div id="requestsFiltersPanel" class="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style="display:none;">
                        <div class="flex items-center gap-2">
                            <label class="text-sm font-semibold text-gray-700 whitespace-nowrap">من تاريخ:</label>
                            <input type="date" id="filterRequestDateFrom" onchange="loadFinancingRequests()"
                                   class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm flex-1">
                        </div>
                        <div class="flex items-center gap-2">
                            <label class="text-sm font-semibold text-gray-700 whitespace-nowrap">إلى تاريخ:</label>
                            <input type="date" id="filterRequestDateTo" onchange="loadFinancingRequests()"
                                   class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm flex-1">
                        </div>
                        <select id="filterStatus" onchange="loadFinancingRequests()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">جميع الحالات</option>
                            <option value="pending">قيد الانتظار</option>
                            <option value="approved">مقبول</option>
                            <option value="rejected">مرفوض</option>
                        </select>
                        <select id="filterBank" onchange="loadFinancingRequests()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">جميع البنوك</option>
                        </select>
                        <select id="filterRequestEmployee" onchange="loadFinancingRequests()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">جميع الموظفين</option>
                        </select>
                        <select id="filterRequestBankAgent" onchange="loadFinancingRequests()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">جميع موظفي البنك</option>
                        </select>
                        <button type="button" onclick="resetRequestsFilters()" class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
                            <i class="fas fa-undo text-xs"></i>
                            إعادة تعيين
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="bg-red-100 border-r-4 border-red-500 rounded-lg p-4">
                        <div class="text-gray-700 text-sm">مرفوض</div>
                        <div class="text-2xl font-bold text-red-600" id="requests-rejected">0</div>
                    </div>
                    <div class="bg-green-100 border-r-4 border-green-500 rounded-lg p-4">
                        <div class="text-gray-700 text-sm">تحت المعالجة</div>
                        <div class="text-2xl font-bold text-green-600" id="requests-processing">0</div>
                    </div>
                    <div class="bg-purple-100 border-r-4 border-purple-500 rounded-lg p-4">
                        <div class="text-gray-700 text-sm">تحت المراجعة</div>
                        <div class="text-2xl font-bold text-purple-600" id="requests-review">0</div>
                    </div>
                    <div class="bg-blue-100 border-r-4 border-blue-500 rounded-lg p-4">
                        <div class="text-gray-700 text-sm">طلب اكتمال بيانات</div>
                        <div class="text-2xl font-bold text-blue-600" id="requests-incomplete">2</div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg p-6 min-w-0 w-full">
                    <div id="requestsEdgeScrollWrap" class="edge-scroll-wrap">
                        <div class="edge-scroll-zone left">
                            <div id="requestsEdgeLeft" class="edge-scroll-btn edge-hidden">
                                <button type="button" onclick="edgeScrollStep('requestsTableScroll', 'left')" aria-label="scroll left">
                                    <i class="fas fa-chevron-left text-lg"></i>
                                </button>
                            </div>
                        </div>
                        <div class="edge-scroll-zone right">
                            <div id="requestsEdgeRight" class="edge-scroll-btn edge-hidden">
                                <button type="button" onclick="edgeScrollStep('requestsTableScroll', 'right')" aria-label="scroll right">
                                    <i class="fas fa-chevron-right text-lg"></i>
                                </button>
                            </div>
                        </div>
                        <div id="requestsTableScroll" class="overflow-x-auto no-hscrollbar">
                        <table class="min-w-full w-max">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">م</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">العميل</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الجوال</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">نوع التمويل</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">المبلغ</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">المدة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">البنك</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                                </tr>
                            </thead>
                            <tbody id="requestsTable">
                                <tr>
                                    <td colspan="9" class="text-center py-8">
                                        <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    </div>

                    <!-- Requests Pagination -->
                    <div class="mt-4 flex items-center justify-between gap-3 flex-wrap">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-semibold text-gray-700 whitespace-nowrap">عدد الصفوف:</span>
                            <select id="requestsPageSize" onchange="setRequestsPageSize(this.value)" class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"><option value="15">15</option></select>
                        </div>
                        <div class="flex items-center gap-2">
                            <button id="requestsPrevBtn" onclick="setRequestsPage('prev')" class="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold hover:bg-gray-50">السابق</button>
                            <span id="requestsPageInfo" class="text-sm text-gray-600 whitespace-nowrap"></span>
                            <button id="requestsNextBtn" onclick="setRequestsPage('next')" class="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold hover:bg-gray-50">التالي</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Other sections will be loaded dynamically -->
            <div id="banks-section" class="content-section">
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-university text-blue-600 ml-2"></i>
                        إدارة البنوك
                    </h1>
                    <button onclick="addBank()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold">
                        <i class="fas fa-plus ml-2"></i>
                        إضافة بنك جديد
                    </button>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">م</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">اسم البنك</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الكود</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="banksTable">
                                <tr>
                                    <td colspan="5" class="text-center py-8">
                                        <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="rates-section" class="content-section">
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-percent text-green-600 ml-2"></i>
                        نسب التمويل
                    </h1>
                    <button onclick="addRate()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold">
                        <i class="fas fa-plus ml-2"></i>
                        إضافة نسبة جديدة
                    </button>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">م</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">البنك</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">نوع التمويل</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">النسبة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">المبلغ (من - إلى)</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الراتب (من - إلى)</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="ratesTable">
                                <tr>
                                    <td colspan="8" class="text-center py-8">
                                        <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="subscriptions-section" class="content-section">
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-crown text-yellow-600 ml-2"></i>
                        الاشتراكات
                    </h1>
                    <button onclick="addSubscription()" class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-bold">
                        <i class="fas fa-plus ml-2"></i>
                        إضافة اشتراك جديد
                    </button>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">م</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الشركة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الباقة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">تاريخ البداية</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">تاريخ الانتهاء</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="subscriptionsTable">
                                <tr>
                                    <td colspan="7" class="text-center py-8">
                                        <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="users-section" class="content-section">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-user-cog text-purple-600 ml-2"></i>
                        المستخدمين
                    </h1>
                    <div class="flex flex-wrap gap-2">
                        <button onclick="addUser()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold">
                            <i class="fas fa-plus ml-2"></i>
                            إضافة مستخدم جديد
                        </button>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">م</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الاسم</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">البريد الإلكتروني</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">اسم المستخدم</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الدور</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الصلاحيات</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="usersTable">
                                <tr>
                                    <td colspan="7" class="text-center py-8">
                                        <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="packages-section" class="content-section">
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-box text-orange-600 ml-2"></i>
                        إدارة الباقات
                    </h1>
                    <button onclick="addPackage()" class="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold">
                        <i class="fas fa-plus ml-2"></i>
                        إضافة باقة جديدة
                    </button>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">م</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">اسم الباقة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">السعر</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">المدة (أشهر)</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">عدد الحسابات</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="packagesTable">
                                <tr>
                                    <td colspan="7" class="text-center py-8">
                                        <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="subscription-requests-section" class="content-section">
                <div class="flex items-center justify-between mb-6">
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-clipboard-list text-red-600 ml-2"></i>
                        طلبات الاشتراك
                    </h1>
                </div>
                
                <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">م</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">اسم الشركة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">جهة الاتصال</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">البريد الإلكتروني</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الجوال</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الباقة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="subscriptionRequestsTable">
                                <tr>
                                    <td colspan="8" class="text-center py-8">
                                        <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Reports Section -->
            <div id="reports-section" class="content-section">
                <h1 class="text-3xl font-bold mb-6 text-gray-800">
                    <i class="fas fa-chart-line text-indigo-600 ml-2"></i>
                    التقارير والإحصائيات
                </h1>
                
                <!-- Date Range Filter -->
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">من تاريخ</label>
                            <input type="date" id="reportFromDate" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">إلى تاريخ</label>
                            <input type="date" id="reportToDate" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                        <div class="flex items-end">
                            <button onclick="loadReports()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold">
                                <i class="fas fa-search ml-2"></i>
                                عرض التقرير
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Statistics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm opacity-90">إجمالي الطلبات</p>
                                <h3 class="text-3xl font-bold mt-2" id="reportTotalRequests">0</h3>
                            </div>
                            <i class="fas fa-file-alt text-4xl opacity-50"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm opacity-90">الطلبات المقبولة</p>
                                <h3 class="text-3xl font-bold mt-2" id="reportApprovedRequests">0</h3>
                            </div>
                            <i class="fas fa-check-circle text-4xl opacity-50"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-6 shadow-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm opacity-90">قيد المراجعة</p>
                                <h3 class="text-3xl font-bold mt-2" id="reportPendingRequests">0</h3>
                            </div>
                            <i class="fas fa-clock text-4xl opacity-50"></i>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm opacity-90">إجمالي المبلغ</p>
                                <h3 class="text-2xl font-bold mt-2" id="reportTotalAmount">0 ريال</h3>
                            </div>
                            <i class="fas fa-money-bill-wave text-4xl opacity-50"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <!-- Requests by Status Chart -->
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-chart-pie text-indigo-600 ml-2"></i>
                            الطلبات حسب الحالة
                        </h3>
                        <canvas id="statusChart"></canvas>
                    </div>
                    
                    <!-- Requests by Bank Chart -->
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-chart-bar text-indigo-600 ml-2"></i>
                            الطلبات حسب البنك
                        </h3>
                        <canvas id="bankChart"></canvas>
                    </div>
                </div>
                
                <!-- Top Customers Table -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-users text-indigo-600 ml-2"></i>
                        أكثر العملاء نشاطاً
                    </h3>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">العميل</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">عدد الطلبات</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">إجمالي المبلغ</th>
                                    <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">آخر طلب</th>
                                </tr>
                            </thead>
                            <tbody id="topCustomersTable">
                                <tr>
                                    <td colspan="4" class="text-center py-8 text-gray-500">لا توجد بيانات</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modals Section -->

        <!-- Add Customer Modal -->
        <div id="addCustomerModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
            <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">
                    <i class="fas fa-user-plus text-blue-600 ml-2"></i>
                    إضافة عميل جديد
                </h2>
                <form id="addCustomerForm">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل *</label>
                            <input type="text" name="full_name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">رقم الجوال *</label>
                            <input type="tel" name="phone" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                            <input type="email" name="email" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">رقم الهوية</label>
                            <input type="text" name="national_id" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">تاريخ الميلاد</label>
                            <input type="hidden" name="dob_calendar_type" id="modal_dob_calendar_type" value="gregorian">
                            <input type="hidden" name="date_of_birth" id="modal_date_of_birth">
                            <div class="flex gap-2 items-center flex-wrap">
                                <div class="flex rounded-lg border border-gray-300 overflow-hidden flex-1 min-w-0">
                                    <input type="date" id="modal_date_of_birth_gregorian" class="flex-1 min-w-0 px-4 py-2 border-0 focus:ring-2 focus:ring-blue-500">
                                    <input type="text" id="modal_date_of_birth_hijri" style="display:none" placeholder="1445-01-01 (هـ)" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" class="flex-1 min-w-0 px-4 py-2 border-0 focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div class="flex rounded-lg border border-gray-300 bg-gray-50">
                                    <button type="button" id="modal_dob_toggle_gregorian" class="px-2 py-1.5 text-sm font-medium rounded-r-lg bg-blue-600 text-white" title="ميلادي">م</button>
                                    <button type="button" id="modal_dob_toggle_hijri" class="px-2 py-1.5 text-sm font-medium rounded-l-lg text-gray-600 hover:bg-gray-100" title="هجري">هـ</button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">جهة العمل</label>
                            <input type="text" name="employer_name" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">نوع الوظيفة</label>
                            <select name="job_type" id="modal_job_type" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="civilian">مدني</option>
                                <option value="military">عسكري</option>
                                <option value="retired">متقاعد</option>
                            </select>
                        </div>
                        <div>
                            <div id="modal_job_title_civilian_wrap">
                                <label class="block text-sm font-medium text-gray-700 mb-2">المسمى الوظيفي</label>
                                <input type="text" name="job_title" id="modal_job_title_input" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div id="modal_military_rank_wrap" style="display:none">
                                <label class="block text-sm font-medium text-gray-700 mb-2">الرتبة العسكرية</label>
                                <select name="military_rank" id="modal_military_rank_select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">-- اختر الرتبة --</option>
                                    <option value="جندي">جندي</option>
                                    <option value="عريف">عريف</option>
                                    <option value="وكيل رقيب">وكيل رقيب</option>
                                    <option value="رقيب">رقيب</option>
                                    <option value="رقيب أول">رقيب أول</option>
                                    <option value="رئيس رقباء">رئيس رقباء</option>
                                    <option value="ملازم">ملازم</option>
                                    <option value="ملازم أول">ملازم أول</option>
                                    <option value="نقيب">نقيب</option>
                                    <option value="رائد">رائد</option>
                                    <option value="مقدم">مقدم</option>
                                    <option value="عقيد">عقيد</option>
                                    <option value="عميد">عميد</option>
                                    <option value="لواء">لواء</option>
                                    <option value="فريق">فريق</option>
                                    <option value="فريق أول">فريق أول</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">تاريخ بداية العمل</label>
                            <input type="date" name="work_start_date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
                            <input type="text" name="city" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">رقم مالك العقار</label>
                            <input type="text" name="property_owner" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">رقم المكتب العقاري</label>
                            <input type="text" name="real_estate_office" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الراتب الأساسي</label>
                            <input type="number" name="basic_salary" step="0.01" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الراتب الشهري</label>
                            <input type="number" name="monthly_salary" step="0.01" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div class="col-span-full border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 class="text-sm font-bold text-gray-700 mb-2">
                                <i class="fas fa-credit-card text-red-600 ml-1"></i>
                                الالتزامات المالية
                            </h3>
                            <input type="hidden" name="obligations_json" id="modal_obligations_json" value="[]">
                            <div class="overflow-x-auto mb-2">
                                <table class="w-full text-sm">
                                    <thead>
                                        <tr class="border-b border-gray-300 text-right">
                                            <th class="py-2 px-2">نوع الالتزام</th>
                                            <th class="py-2 px-2">إجمالي المبلغ</th>
                                            <th class="py-2 px-2">القسط الشهري</th>
                                            <th class="py-2 px-2">ملاحظة</th>
                                            <th class="py-2 px-2 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody id="modal_obligations_tbody"></tbody>
                                </table>
                            </div>
                            <button type="button" id="modal_add_obligation_row" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                <i class="fas fa-plus ml-1"></i> إضافة صف
                            </button>
                        </div>
                    </div>
                    <div id="addCustomerBankAgentSection" style="display: none;" class="col-span-full">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            <i class="fas fa-user-tie text-indigo-600 ml-1"></i>
                            موظف التمويل (اختياري)
                        </label>
                        <select id="addCustomerBankAgentSelect" name="assigned_bank_agent_id" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">— بدون تعيين —</option>
                        </select>
                    </div>
                    <div class="flex gap-3 mt-6">
                        <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-save ml-2"></i>
                            حفظ
                        </button>
                        <button type="button" onclick="closeModal('addCustomerModal')" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-times ml-2"></i>
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Add Bank Modal -->
        <div id="addBankModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
            <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">
                    <i class="fas fa-university text-blue-600 ml-2"></i>
                    إضافة بنك جديد
                </h2>
                <form id="addBankForm">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">اسم البنك *</label>
                            <input type="text" name="bank_name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">كود البنك *</label>
                            <input type="text" name="bank_code" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">رابط الشعار</label>
                            <input type="url" name="logo_url" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    <div class="flex gap-3 mt-6">
                        <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-save ml-2"></i>
                            حفظ
                        </button>
                        <button type="button" onclick="closeModal('addBankModal')" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-times ml-2"></i>
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Add Rate Modal -->
        <div id="addRateModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
            <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">
                    <i class="fas fa-percent text-green-600 ml-2"></i>
                    إضافة نسبة تمويل جديدة
                </h2>
                <form id="addRateForm">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">البنك *</label>
                            <select name="bank_id" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" id="rateBankSelect">
                                <option value="">اختر البنك</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">نوع التمويل *</label>
                            <select name="financing_type_id" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" id="rateFinancingTypeSelect">
                                <option value="">اختر نوع التمويل</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">النسبة % *</label>
                            <input type="number" name="rate" step="0.01" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى للمبلغ *</label>
                            <input type="number" name="min_amount" step="0.01" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الحد الأعلى للمبلغ *</label>
                            <input type="number" name="max_amount" step="0.01" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى للراتب *</label>
                            <input type="number" name="min_salary" step="0.01" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الحد الأعلى للراتب *</label>
                            <input type="number" name="max_salary" step="0.01" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى للمدة (شهر) *</label>
                            <input type="number" name="min_duration" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الحد الأعلى للمدة (شهر) *</label>
                            <input type="number" name="max_duration" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                            <textarea name="notes" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="أضف ملاحظات اختيارية..."></textarea>
                        </div>
                    </div>
                    <div class="flex gap-3 mt-6">
                        <button type="submit" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-save ml-2"></i>
                            حفظ
                        </button>
                        <button type="button" onclick="closeModal('addRateModal')" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-times ml-2"></i>
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Add Subscription Modal -->
        <div id="addSubscriptionModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
            <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">
                    <i class="fas fa-crown text-yellow-600 ml-2"></i>
                    إضافة اشتراك جديد
                </h2>
                <form id="addSubscriptionForm">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">اسم الشركة *</label>
                            <input type="text" name="company_name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الباقة *</label>
                            <select name="package_id" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500" id="subscriptionPackageSelect">
                                <option value="">اختر الباقة</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">تاريخ البداية *</label>
                            <input type="date" name="start_date" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">تاريخ الانتهاء *</label>
                            <input type="date" name="end_date" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
                        </div>
                    </div>
                    <div class="flex gap-3 mt-6">
                        <button type="submit" class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-save ml-2"></i>
                            حفظ
                        </button>
                        <button type="button" onclick="closeModal('addSubscriptionModal')" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-times ml-2"></i>
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- View Request Modal -->
        <div id="viewRequestModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
            <div class="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">
                    <i class="fas fa-file-invoice text-blue-600 ml-2"></i>
                    تفاصيل طلب التمويل
                </h2>
                <div id="requestDetails" class="space-y-4">
                    <!-- Will be filled dynamically -->
                </div>
                <div class="flex gap-3 mt-6">
                    <button type="button" onclick="closeModal('viewRequestModal')" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">
                        <i class="fas fa-times ml-2"></i>
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Update Status Modal -->
        <div id="updateStatusModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
            <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">
                    <i class="fas fa-edit text-green-600 ml-2"></i>
                    تحديث حالة الطلب
                </h2>
                <form id="updateStatusForm">
                    <input type="hidden" id="requestId" name="requestId">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الحالة الجديدة *</label>
                            <select name="status" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                                <option value="pending">قيد الانتظار</option>
                                <option value="approved">مقبول</option>
                                <option value="rejected">مرفوض</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                            <textarea name="notes" rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="أضف ملاحظات حول تحديث الحالة..."></textarea>
                        </div>
                    </div>
                    <div class="flex gap-3 mt-6">
                        <button type="submit" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-save ml-2"></i>
                            حفظ التحديث
                        </button>
                        <button type="button" onclick="closeModal('updateStatusModal')" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-times ml-2"></i>
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Add Package Modal -->
        <div id="addPackageModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
            <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">
                    <i class="fas fa-box text-orange-600 ml-2"></i>
                    إضافة باقة جديدة
                </h2>
                <form id="addPackageForm">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">اسم الباقة *</label>
                            <input type="text" name="package_name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">السعر (ريال) *</label>
                            <input type="number" name="price" step="0.01" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">المدة (أشهر) *</label>
                            <input type="number" name="duration_months" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">عدد الحسابات</label>
                            <input type="number" name="max_calculations" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">عدد المستخدمين</label>
                            <input type="number" name="max_users" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                            <textarea name="description" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"></textarea>
                        </div>
                    </div>
                    <div class="flex gap-3 mt-6">
                        <button type="submit" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-save ml-2"></i>
                            حفظ
                        </button>
                        <button type="button" onclick="closeModal('addPackageModal')" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-times ml-2"></i>
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Edit User Modal -->
        <div id="editUserModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
            <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">
                    <i class="fas fa-user-edit text-purple-600 ml-2"></i>
                    تعديل مستخدم
                </h2>
                <form id="editUserForm">
                    <input type="hidden" name="userId" id="editUserId">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل *</label>
                            <input type="text" name="full_name" id="editUserFullName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني *</label>
                            <input type="email" name="email" id="editUserEmail" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">رقم الجوال</label>
                            <input type="text" name="phone" id="editUserPhone" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الدور *</label>
                            <select name="role_id" id="editUserRole" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                <option value="1">مدير النظام</option>
                                <option value="2">شركة مشتركة</option>
                                <option value="3">مستخدم عادي</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الحالة *</label>
                            <select name="is_active" id="editUserActive" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                                <option value="1">نشط</option>
                                <option value="0">غير نشط</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex gap-3 mt-6">
                        <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-save ml-2"></i>
                            حفظ التعديلات
                        </button>
                        <button type="button" onclick="closeModal('editUserModal')" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">
                            <i class="fas fa-times ml-2"></i>
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Manage User Permissions Modal -->
        <div id="managePermissionsModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50" style="display: none;">
            <div class="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">
                    <i class="fas fa-shield-alt text-purple-600 ml-2"></i>
                    إدارة صلاحيات المستخدم: <span id="permissionsUserName"></span>
                </h2>
                <input type="hidden" id="permissionsRoleId">
                
                <div class="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle ml-1"></i>
                        الصلاحيات تُحدد حسب الدور. تغيير الدور سيؤثر على جميع المستخدمين بنفس الدور.
                    </p>
                </div>

                <div id="permissionsContent" class="space-y-4">
                    <!-- يتم ملؤها ديناميكياً -->
                </div>

                <div class="flex gap-3 mt-6">
                    <button type="button" onclick="savePermissions()" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-bold">
                        <i class="fas fa-save ml-2"></i>
                        حفظ الصلاحيات
                    </button>
                    <button type="button" onclick="closeModal('managePermissionsModal')" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">
                        <i class="fas fa-times ml-2"></i>
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
        
    </div>

    <!--__PANEL_USER_BOOT__-->
    <script>
        // Debug dump function - displays data on screen
        window.dd = function(data) {
            console.log('🔍 DD:', data);
            
            // Create or get debug panel
            let debugPanel = document.getElementById('dd-debug-panel');
            if (!debugPanel) {
                debugPanel = document.createElement('div');
                debugPanel.id = 'dd-debug-panel';
                debugPanel.style.cssText = 'position: fixed; top: 10px; right: 10px; width: 400px; max-height: 80vh; background: #1a1a1a; color: #0f0; padding: 15px; border-radius: 8px; z-index: 99999; overflow-y: auto; font-family: monospace; font-size: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 2px solid #0f0;';
                document.body.appendChild(debugPanel);
                
                // Add close button
                const closeBtn = document.createElement('button');
                closeBtn.textContent = '✕';
                closeBtn.style.cssText = 'position: absolute; top: 5px; right: 5px; background: #ff0000; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; cursor: pointer; font-weight: bold;';
                closeBtn.onclick = () => debugPanel.remove();
                debugPanel.appendChild(closeBtn);
                
                // Add clear button
                const clearBtn = document.createElement('button');
                clearBtn.textContent = 'Clear';
                clearBtn.style.cssText = 'position: absolute; top: 5px; right: 35px; background: #ff8800; color: white; border: none; border-radius: 3px; padding: 2px 8px; cursor: pointer; font-size: 10px;';
                clearBtn.onclick = () => { debugPanel.innerHTML = ''; debugPanel.appendChild(closeBtn); debugPanel.appendChild(clearBtn); };
                debugPanel.appendChild(clearBtn);
            }
            
            // Format the data
            let formatted = '';
            try {
                if (data === null) {
                    formatted = '<span style="color: #888;">null</span>';
                } else if (data === undefined) {
                    formatted = '<span style="color: #888;">undefined</span>';
                } else if (typeof data === 'object') {
                    formatted = '<pre style="margin: 5px 0; color: #0f0;">' + JSON.stringify(data, null, 2) + '</pre>';
                } else {
                    formatted = '<span style="color: #0f0;">' + String(data) + '</span>';
                }
            } catch (e) {
                formatted = '<span style="color: #ff0;">[Error formatting: ' + e.message + ']</span>';
            }
            
            // Add timestamp
            const time = new Date().toLocaleTimeString();
            const entry = document.createElement('div');
            entry.style.cssText = 'margin: 8px 0; padding: 8px; background: #2a2a2a; border-left: 3px solid #0f0; border-radius: 4px;';
            entry.innerHTML = '<div style="color: #888; font-size: 10px; margin-bottom: 4px;">[' + time + ']</div>' + formatted;
            debugPanel.appendChild(entry);
            
            // Auto-scroll to bottom
            debugPanel.scrollTop = debugPanel.scrollHeight;
        };
        
        // دالة بسيطة للانتقال بين الأقسام
        window.goToSection = function(sectionName) {
            console.log('🚀 الانتقال إلى:', sectionName);
            
            // إخفاء جميع الأقسام
            const allSections = document.querySelectorAll('.content-section');
            allSections.forEach(function(section) {
                section.classList.remove('active');
            });
            
            // إظهار القسم المطلوب
            const targetSection = document.getElementById(sectionName + '-section');
            if (targetSection) {
                targetSection.classList.add('active');
                console.log('✅ تم تفعيل القسم:', sectionName);
                
                // تحميل البيانات
                window.loadSectionData(sectionName);
                ;[0, 120, 400].forEach(function (ms) {
                    setTimeout(function () {
                        try {
                            updateEdgeScrollControls('customersTableScroll', 'customersEdgeLeft', 'customersEdgeRight');
                            updateEdgeScrollControls('requestsTableScroll', 'requestsEdgeLeft', 'requestsEdgeRight');
                        } catch (e) {}
                    }, ms);
                });
            } else {
                console.error('❌ القسم غير موجود:', sectionName);
            }
        }
        
        // دالة تسجيل الخروج - تنظيف LocalStorage + حذف Cookie على السيرفر (فعلياً) لمنع بقاء صلاحيات قديمة
        async function doLogout() {
            console.log('🚪 محاولة تسجيل الخروج...');
            if (!confirm('هل تريد تسجيل الخروج؟')) {
                console.log('❌ تم إلغاء تسجيل الخروج');
                return;
            }

            try {
                // Clear cookie on server (most important for SSR pages)
                await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            } catch (e) {
                console.warn('⚠️ فشل استدعاء /api/auth/logout (سنكمل محلياً):', e);
            }

            // Clear local storage
            try {
                localStorage.clear();
            } catch (e) {
                console.warn('⚠️ فشل حذف localStorage:', e);
            }

            // Clear cookie on client too (covers cases where JS cookie was set)
            try {
                document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax';
                document.cookie = 'authToken=; Path=/; Max-Age=0; SameSite=Lax; Secure';
            } catch (e) {}

            window.location.href = '/login';
        }
        
        // جعل الدالة متاحة عالمياً
        window.doLogout = doLogout;
        
        // تحميل بيانات المستخدم من localStorage (أو من السيرفر إن لم تكن موجودة)
        function loadUserData() {
            console.log('═══════════════════════════════════════');
            console.log('🔄 بدء تحميل بيانات المستخدم...');
            console.log('═══════════════════════════════════════');
            
            try {
                // Prefer fresh server-injected data to avoid stale role labels in localStorage
                let user = null;
                if (typeof window.USER_DATA !== 'undefined' && window.USER_DATA) {
                    user = window.USER_DATA;
                    try {
                        localStorage.setItem('userData', JSON.stringify(window.USER_DATA));
                        console.log('✅ تم تحديث userData من USER_DATA');
                    } catch (e) {
                        console.warn('⚠️ فشل حفظ USER_DATA في localStorage:', e);
                    }
                } else {
                    const userStr = localStorage.getItem('userData') || localStorage.getItem('user');
                    if (userStr) user = JSON.parse(userStr);
                }
                
                console.log('📦 محتويات localStorage:');
                console.log('  - userData:', localStorage.getItem('userData') ? 'موجود ✅' : 'غير موجود ❌');
                console.log('  - user:', localStorage.getItem('user') ? 'موجود ✅' : 'غير موجود ❌');
                console.log('  - authToken:', localStorage.getItem('authToken') ? 'موجود ✅' : 'غير موجود ❌');
                
                if (user) {
                    const normalizeRoleId = (value) => {
                        const numeric = parseInt(value, 10);
                        const legacyMap = { 11: 1, 12: 2, 13: 3, 14: 4 };
                        return legacyMap[numeric] || numeric || null;
                    };
                    const roleId = normalizeRoleId(user.role_id || window.USER_ROLE_ID);
                    const roleName = (user.role_name || '').trim();
                    const roleLabelFromId =
                        roleId === 1 ? 'مدير النظام' :
                        roleId === 2 ? 'مدير الشركة' :
                        roleId === 3 ? 'مشرف المبيعات' :
                        roleId === 4 ? 'موظف' :
                        roleId === 5 ? 'موظف التمويل' :
                        roleId === 6 ? 'موظف مزدوج' : '';
                    const finalRoleLabel = roleName || roleLabelFromId || 'مستخدم';

                    console.log('👤 بيانات المستخدم المحملة:');
                    console.log('  - username:', user.username);
                    console.log('  - full_name:', user.full_name);
                    console.log('  - role_id:', roleId);
                    console.log('  - role_name:', finalRoleLabel);
                    console.log('  - tenant_id:', user.tenant_id);
                    console.log('  - company_name:', user.company_name || user.tenant_name);
                    console.log('  - tenant_slug:', user.tenant_slug);
                    
                    // تحديث اسم المستخدم
                    const displayNameEl = document.getElementById('userDisplayName');
                    const emailEl = document.getElementById('userEmail');
                    
                    console.log('🎯 عناصر DOM:');
                    console.log('  - displayNameEl:', displayNameEl ? 'موجود ✅' : 'غير موجود ❌');
                    console.log('  - emailEl:', emailEl ? 'موجود ✅' : 'غير موجود ❌');
                    
                    if (displayNameEl) {
                        let displayName = user.full_name || user.username || 'مستخدم';
                        // Do not force "manager" based on company presence; always respect real role
                        displayName += ' (' + finalRoleLabel + ')';
                        
                        displayNameEl.textContent = displayName;
                        console.log('✅ تم تحديث DOM - الاسم:', displayName);
                    } else {
                        console.error('❌ عنصر userDisplayName غير موجود في DOM!');
                    }
                    
                    if (emailEl && user.email) {
                        emailEl.textContent = user.email;
                        console.log('✅ تم تحديث DOM - البريد:', user.email);
                    }
                    
                    // تحديث رابط النسب بـ tenant_id إذا كان المستخدم مدير شركة
                    if (user.tenant_id) {
                        const ratesLink = document.querySelector('a[href="/admin/rates"]');
                        if (ratesLink) {
                            ratesLink.setAttribute('href', '/admin/rates?tenant_id=' + user.tenant_id);
                            console.log('✅ تم تحديث رابط النسب: /admin/rates?tenant_id=' + user.tenant_id);
                        }
                    }
                    
                    console.log('═══════════════════════════════════════');
                    console.log('✅ اكتمل تحميل بيانات المستخدم بنجاح');
                    console.log('═══════════════════════════════════════');
                } else {
                    console.warn('═══════════════════════════════════════');
                    console.warn('⚠️ لم يتم العثور على بيانات المستخدم في localStorage');
                    console.warn('═══════════════════════════════════════');
                }
            } catch (error) {
                console.error('═══════════════════════════════════════');
                console.error('❌ خطأ في تحميل بيانات المستخدم:', error);
                console.error('═══════════════════════════════════════');
            }
        }
        
        // تحميل البيانات عند تحميل الصفحة وعند DOMContentLoaded
        loadUserData();
        document.addEventListener('DOMContentLoaded', loadUserData);
        
        // دالة تطبيق الصلاحيات حسب دور المستخدم
        function applyUserPermissions() {
            console.log('🔐 بدء تطبيق الصلاحيات...');
            
            try {
                // قراءة بيانات المستخدم من localStorage
                let userStr = localStorage.getItem('userData') || localStorage.getItem('user');
                let user = null;
                let roleId = null;
                const normalizeRoleId = (value) => {
                    const numeric = parseInt(value, 10);
                    const legacyMap = { 11: 1, 12: 2, 13: 3, 14: 4 };
                    return legacyMap[numeric] || numeric || null;
                };

                if (userStr) {
                    user = JSON.parse(userStr);
                    roleId = normalizeRoleId(user.role_id);
                }

                // Prefer server-injected role to avoid stale localStorage
                if (typeof window.USER_ROLE_ID !== 'undefined' && window.USER_ROLE_ID !== null) {
                    roleId = normalizeRoleId(window.USER_ROLE_ID);
                    console.log('✅ role_id من USER_ROLE_ID:', roleId);
                }

                if (!roleId && typeof window.USER_DATA !== 'undefined' && window.USER_DATA) {
                    roleId = normalizeRoleId(window.USER_DATA.role_id);
                    console.log('✅ role_id من USER_DATA:', roleId);
                }

                // Fail-closed: if we still don't know the role, treat as most limited (role 4)
                if (!roleId) {
                    console.warn('⚠️ لم يتم العثور على role_id - استخدام الدور الأدنى (4)');
                    roleId = 4;
                }
                
                console.log('👤 role_id:', roleId);
                console.log('📋 user data:', user || window.USER_DATA || {});

                // Role 3 should land directly on contracts list (not dashboard)
                if (roleId === 3) {
                    document.querySelectorAll('.quick-access-btn[href="/admin/contracts"]').forEach((el) => {
                        el.setAttribute('href', '/admin/contracts/list');
                    });
                    document.querySelectorAll('#global-persistent-sidebar a[href="/admin/contracts"]').forEach((el) => {
                        el.setAttribute('href', '/admin/contracts/list');
                    });
                }

                // Roles 4/5/6: "مهامي" module is labeled "الإعلانات"
                if (roleId === 4 || roleId === 5 || roleId === 6) {
                    document.querySelectorAll('.quick-access-btn[href="/admin/my-tasks"] .text-sm').forEach((el) => {
                        el.textContent = 'الإعلانات';
                    });
                    document.querySelectorAll('#global-persistent-sidebar a[href="/admin/my-tasks"]').forEach((el) => {
                        const icon = el.querySelector('i');
                        el.textContent = '';
                        if (icon) el.appendChild(icon);
                        el.appendChild(document.createTextNode('الإعلانات'));
                    });
                }
                
                // تعريف الروابط المسموحة لكل role_id
                // Source of truth for permissions:
                // - Sidebar MUST match quick-access behavior exactly.
                // - SaaS-only items (Subscriptions/Packages/Tenants/Roles/SaaS Settings)
                //   must be super-admin only (role_id = 1).
                const allowedLinks = {
                    '1': [ // Super Admin
                        '/admin/panel',
                        '/admin/dashboard',
                        '/admin/customers',
                        '/admin/customers/completed',
                        '/admin/customers/archived',
                        '/admin/requests',
                        '/admin/banks',
                        '/admin/rates',
                        '/admin/subscriptions',
                        '/admin/packages',
                        '/admin/users',
                        '/admin/roles',
                        '/admin/notifications',
                        '/calculator',
                        '/admin/tenants',
                        '/admin/tenant-calculators',
                        '/admin/saas-settings',
                        '/admin/reports',
                        '/admin/follow-ups',
                        '/admin/contact-affiliates',
                        '/admin/link-stats',
                        '/admin/payments',
                        '/admin/settings',
                        '/admin/hr',
                        '/admin/contracts'
                    ],
                    '2': [ // Company Admin (companyadmin)
                        '/admin/panel',
                        '/admin/dashboard',
                        '/admin/customers',
                        '/admin/customers/completed',
                        '/admin/customers/archived',
                        '/admin/requests',
                        '/admin/reports',
                        '/admin/follow-ups',
                        '/admin/contact-affiliates',
                        '/admin/link-stats',
                        '/admin/banks',
                        '/admin/rates',
                        '/admin/payments',
                        '/admin/users',
                        '/admin/hr',
                        '/admin/contracts',
                        '/admin/notifications',
                        '/admin/company-settings',
                        '/admin/company-settings/locations',
                        '/admin/my-archived-tasks',
                        '/calculator',
                    ],
                    '3': [ // Supervisor (Read-only)
                        '/admin/panel',
                        '/admin/customers',
                        '/admin/customers/completed',
                        '/admin/customers/archived',
                        '/admin/requests',
                        '/admin/reports',
                        '/admin/follow-ups',
                        '/admin/banks',
                        '/admin/rates',
                        // Logical entry + list URL: href is rewritten to /admin/contracts/list before allowlist runs
                        '/admin/contracts',
                        '/admin/contracts/list',
                        '/calculator',
                    ],
                    '4': [ // Employee
                        '/admin/panel',
                        '/admin/customers',
                        '/admin/customers/completed',
                        '/admin/customers/archived',
                        '/admin/requests',
                        '/admin/contracts',
                        '/admin/contracts/list',
                        '/admin/contracts/new',
                        '/admin/contracts/templates',
                        '/admin/my-tasks',
                        '/admin/my-archived-tasks',
                        '/my-tasks',
                        '/calculator',
                    ],
                    '5': [ // Same access as role 4 (employee).
                        '/admin/panel',
                        '/admin/customers',
                        '/admin/customers/completed',
                        '/admin/customers/archived',
                        '/admin/requests',
                        '/admin/requests/completed',
                        '/admin/contracts',
                        '/admin/contracts/list',
                        '/admin/contracts/new',
                        '/admin/contracts/templates',
                        '/admin/my-tasks',
                        '/admin/my-archived-tasks',
                        '/my-tasks',
                        '/admin/my-leaves',
                        '/admin/my-hr',
                        '/admin/my-profile',
                        '/admin/notifications',
                        '/calculator',
                        '/',
                    ],
                    '6': [ // Same access as role 4/5.
                        '/admin/panel',
                        '/admin/customers',
                        '/admin/customers/completed',
                        '/admin/customers/archived',
                        '/admin/requests',
                        '/admin/requests/completed',
                        '/admin/contracts',
                        '/admin/contracts/list',
                        '/admin/contracts/new',
                        '/admin/contracts/templates',
                        '/admin/my-tasks',
                        '/admin/my-archived-tasks',
                        '/my-tasks',
                        '/admin/my-leaves',
                        '/admin/my-hr',
                        '/admin/my-profile',
                        '/admin/notifications',
                        '/calculator',
                        '/',
                    ]
                };
                
                // Show superadmin-only stats only for Role 1 (Super Admin)
                const superadminStats = document.querySelector('.superadmin-only-stats');
                if (superadminStats) {
                    if (roleId === 1) {
                        console.log('✅ إظهار إحصائيات السوبر أدمن');
                        superadminStats.style.display = 'grid';
                    } else {
                        console.log('❌ إخفاء إحصائيات السوبر أدمن');
                        superadminStats.style.display = 'none';
                    }
                }
                
                // الحصول على الروابط المتاحة للمستخدم
                const userAllowedLinks = allowedLinks[String(roleId)] || allowedLinks['4'];
                
                console.log('✅ الروابط المتاحة:', userAllowedLinks);
                
                // إخفاء الأزرار غير المسموح بها
                const allButtons = document.querySelectorAll('.quick-access-btn');
                let hiddenCount = 0;
                let visibleCount = 0;
                
                allButtons.forEach(button => {
                    const href = button.getAttribute('href');
                    const normalizedHref = href ? href.split('?')[0] : href;
                    
                    // Check if button has data-superadmin-only attribute
                    const isSuperAdminOnly = button.hasAttribute('data-superadmin-only') && 
                                          button.getAttribute('data-superadmin-only') === 'true';
                    
                    // If it's superadmin-only and user is not superadmin, hide it
                    if (isSuperAdminOnly && roleId !== 1) {
                        button.style.display = 'none';
                        hiddenCount++;
                        console.log('🚫 إخفاء زر (superadmin-only):', href);
                        return;
                    }

                    // Calculator href is rewritten to /c/:slug/calculator; quick-access uses same visibility rule as other roles.
                    const isCalculatorHref =
                        normalizedHref === '/calculator' ||
                        (normalizedHref.startsWith('/c/') && normalizedHref.endsWith('/calculator'));
                    const calculatorQuickBypass = isCalculatorHref;
                    
                    // فحص الصلاحية
                    if (!calculatorQuickBypass && !userAllowedLinks.includes(normalizedHref)) {
                        button.style.display = 'none';
                        hiddenCount++;
                        console.log('🚫 إخفاء زر:', href);
                    } else {
                        button.style.display = 'block';
                        visibleCount++;
                        console.log('✅ عرض زر:', href);
                    }
                });
                
                // Sidebar: apply the exact same allowlist as quick-access (persistent rail injected with HTML response)
                const sidebarLinks = document.querySelectorAll('#global-persistent-sidebar .gps-nav a[href]');
                let sidebarHidden = 0;
                let sidebarVisible = 0;
                
                sidebarLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (!href) return;
                    const normalizedHref = href.split('?')[0];
                    
                    // Check if link has data-superadmin-only attribute
                    const isSuperAdminOnly = link.hasAttribute('data-superadmin-only') && 
                                          link.getAttribute('data-superadmin-only') === 'true';
                    
                    // If it's superadmin-only and user is not superadmin, hide it
                    if (isSuperAdminOnly && roleId !== 1) {
                        link.style.display = 'none';
                        sidebarHidden++;
                        console.log('🚫 إخفاء رابط السايدبار (superadmin-only):', href);
                        return;
                    }
                    
                    // Panel home always; calculator tenant URLs same rules as other roles (allowlist still applies where needed)
                    const isAlways =
                        normalizedHref === '/admin/panel' ||
                        normalizedHref === '/calculator' ||
                        normalizedHref.startsWith('/c/');
                    
                    // Check if href is in allowed links
                    if (isAlways || userAllowedLinks.includes(normalizedHref)) {
                        link.style.display = 'flex';
                        sidebarVisible++;
                        console.log('✅ عرض رابط السايدبار:', href);
                    } else {
                        link.style.display = 'none';
                        sidebarHidden++;
                        console.log('🚫 إخفاء رابط السايدبار:', href);
                    }
                });
                
                console.log('📌 Sidebar permissions applied:', sidebarVisible, 'visible,', sidebarHidden, 'hidden');
                
                console.log('تم تطبيق الصلاحيات: ' + visibleCount + ' أزرار ظاهرة، ' + hiddenCount + ' أزرار مخفية');
                
                // إخفاء الكروت الإضافية للموظفين والمشرفين
                const adminOnlyStats = document.querySelector('.admin-only-stats');
                if (adminOnlyStats) {
                    if (roleId === 4 || roleId === 3 || roleId === 5 || roleId === 6) {
                        adminOnlyStats.style.display = 'none';
                        console.log('🚫 إخفاء الكروت الإضافية (موظف أو مشرف أو موظف التمويل أو موظف مزدوج)');
                    } else {
                        adminOnlyStats.style.display = 'grid';
                        console.log('✅ عرض الكروت الإضافية');
                    }
                }
                
                const dashboardCustomerSummarySection = document.getElementById('dashboardCustomerSummarySection');
                if (dashboardCustomerSummarySection) {
                    if (roleId === 3 || roleId === 4 || roleId === 5 || roleId === 6) {
                        dashboardCustomerSummarySection.style.display = 'none';
                        console.log('🚫 إخفاء ملخص العملاء (مشرف / موظف / وكيل بنك / موظف مزدوج)');
                    } else {
                        dashboardCustomerSummarySection.style.display = '';
                        console.log('✅ عرض ملخص العملاء');
                    }
                }

                // قسم رابط الحاسبة + QR + صفحة التواصل + روابط الإحالة — لجميع الأدوار
                const calculatorLinkSection = document.getElementById('calculatorLinkSection');
                const employeeCalculatorSection = document.getElementById('employeeCalculatorSection');
                
                if (calculatorLinkSection) {
                    calculatorLinkSection.style.display = 'block';
                    if (employeeCalculatorSection) {
                        employeeCalculatorSection.style.display = 'none';
                    }
                    console.log('✅ عرض قسم رابط الحاسبة والتواصل (جميع الأدوار)');
                    setTimeout(() => {
                        if (typeof loadCalculatorLink === 'function') {
                            loadCalculatorLink();
                        }
                    }, 500);
                } else {
                    console.warn('⚠️ لم يتم العثور على calculatorLinkSection');
                }
                
            } catch (error) {
                console.error('❌ خطأ في تطبيق الصلاحيات:', error);
            }
        }
        
        // تطبيق الصلاحيات عند تحميل الصفحة
        applyUserPermissions();
        document.addEventListener('DOMContentLoaded', applyUserPermissions);
        
        // دالة تحديث رابط الحاسبة حسب الشركة
        async function updateCalculatorLink() {
            console.log('🔗 تحديث رابط الحاسبة...');
            
            try {
                // قراءة بيانات المستخدم من localStorage
                let userStr = localStorage.getItem('userData') || localStorage.getItem('user');
                
                if (!userStr) {
                    console.warn('⚠️ لا توجد بيانات مستخدم');
                    return;
                }
                
                const user = JSON.parse(userStr);
                const calculatorLink = document.getElementById('calculatorLink');
                const sidebarCalculatorLink = document.getElementById('sidebarCalculatorLink');
                
                // تحديد رابط الحاسبة حسب الشركة
                const tenantSlug = resolveTenantSlug(user);
                const calculatorHref = await resolveCalculatorPathFromTenantSettings(user);
                if (calculatorHref.startsWith('/c/')) {
                    console.log('✅ تم تحديث رابط الحاسبة المخصص للشركة:', calculatorHref);
                } else if (tenantSlug) {
                    console.log('✅ تم تحديث رابط الحاسبة إلى: /c/' + tenantSlug + '/calculator');
                } else {
                    console.log('✅ تم تحديث رابط الحاسبة إلى: /calculator (حاسبة عامة)');
                }
                
                // تحديث رابط الحاسبة في لوحة الوصول السريع
                if (calculatorLink) {
                    calculatorLink.href = calculatorHref;
                } else {
                    console.warn('⚠️ زر الحاسبة في لوحة الوصول السريع غير موجود');
                }
                
                // تحديث رابط الحاسبة في السايدبار
                if (sidebarCalculatorLink) {
                    sidebarCalculatorLink.href = calculatorHref;
                    console.log('✅ تم تحديث رابط الحاسبة في السايدبار');
                } else {
                    console.warn('⚠️ رابط الحاسبة في السايدبار غير موجود');
                }
                
            } catch (error) {
                console.error('❌ خطأ في تحديث رابط الحاسبة:', error);
            }
        }
        
        // تحديث رابط الحاسبة عند تحميل الصفحة
        updateCalculatorLink();
        document.addEventListener('DOMContentLoaded', updateCalculatorLink);
        
        // دالة تحميل بيانات الأقسام - window function
        window.loadSectionData = async function(section) {
            console.log('📥 تحميل بيانات القسم:', section);
            switch(section) {
                case 'dashboard':
                    await loadDashboardStats();
                    break;
                case 'customers':
                    await loadRoleDropdowns();
                    await loadCustomers();
                    break;
                case 'financing-requests':
                    await loadRoleDropdowns();
                    await loadFinancingRequests();
                    break;
                case 'banks':
                    await loadBanks();
                    break;
                case 'rates':
                    await loadRates();
                    break;
                case 'subscriptions':
                    await loadSubscriptions();
                    break;
                case 'users':
                    await loadUsers();
                    break;
                case 'packages':
                    await loadPackages();
                    break;
                case 'subscription-requests':
                    await loadSubscriptionRequests();
                    break;
            }
        }
        
        // Load Dashboard Stats
        async function loadDashboardStats() {
            try {
                const response = await axios.get('/api/dashboard/stats');
                if (response.data.success) {
                    const stats = response.data.data;
                    document.getElementById('stat-customers').textContent = stats.total_customers;
                    document.getElementById('stat-requests').textContent = stats.total_requests;
                    document.getElementById('stat-pending').textContent = stats.pending_requests;
                    document.getElementById('stat-approved').textContent = stats.approved_requests;
                    document.getElementById('stat-banks').textContent = stats.active_banks;
                    document.getElementById('stat-tenants').textContent = stats.active_tenants || 0;
                    document.getElementById('stat-subscriptions').textContent = stats.active_subscriptions;
                    document.getElementById('stat-users').textContent = stats.active_users;
                    document.getElementById('stat-calculations').textContent = stats.total_calculations;
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }
        
        // Actions dropdown: portal onto .edge-scroll-wrap so menus are not clipped by horizontal scroll ports
        function closeAllDropdowns() {
            document.querySelectorAll('.actions-dropdown-menu').forEach(function(m) {
                restorePortaledMenu(m);
                m.classList.add('hidden');
                m.style.top = '';
                m.style.bottom = '';
                m.style.marginTop = '';
                m.style.marginBottom = '';
            });
            document.querySelectorAll('td.actions-cell-active').forEach(function(td) {
                td.classList.remove('actions-cell-active');
                td.style.zIndex = '';
            });
            document.querySelectorAll('tbody.dropdown-open').forEach(function(tb) { tb.classList.remove('dropdown-open'); });
            document.querySelectorAll('tr.dropdown-active-row').forEach(function(tr) { tr.classList.remove('dropdown-active-row'); });
            document.querySelectorAll('tbody .actions-dropdown-btn').forEach(function(b) { b.style.visibility = ''; });
        }

        function unbindActionsMenuRepos(menu) {
            if (!menu._actionsRepos) return;
            var scrollEl = menu._actionsRepos.scrollEl;
            var reposition = menu._actionsRepos.reposition;
            if (scrollEl && reposition) scrollEl.removeEventListener('scroll', reposition);
            if (reposition) {
                window.removeEventListener('resize', reposition);
                window.removeEventListener('scroll', reposition);
            }
            delete menu._actionsRepos;
        }

        function restorePortaledMenu(menu) {
            if (!menu || menu.dataset.portal !== '1') return;
            unbindActionsMenuRepos(menu);
            var placeholder = document.querySelector('[data-actions-menu-placeholder-id="' + menu.dataset.portalPlaceholderId + '"]');
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.replaceChild(menu, placeholder);
            }
            delete menu.dataset.portal;
            delete menu.dataset.portalPlaceholderId;
            menu.style.position = '';
            menu.style.left = '';
            menu.style.top = '';
            menu.style.right = '';
            menu.style.bottom = '';
            menu.style.marginTop = '';
            menu.style.marginBottom = '';
            menu.style.zIndex = '';
        }

        function anchorActionsMenu(btn, menu) {
            if (!menu || menu.dataset.portal === '1') return;
            if (!menu.parentNode) return;
            var placeholderId = String(Date.now()) + '-' + String(Math.random()).slice(2).slice(0, 14);
            var placeholder = document.createElement('span');
            placeholder.setAttribute('data-actions-menu-placeholder-id', placeholderId);
            menu.parentNode.insertBefore(placeholder, menu);
            menu.dataset.portal = '1';
            menu.dataset.portalPlaceholderId = placeholderId;
            document.body.appendChild(menu);
        }

        function positionAnchoredActionsMenu(btn, menu) {
            if (!btn || !menu) return;
            var br = btn.getBoundingClientRect();
            var vpPad = 8;
            var gap = 6;
            var w = menu.offsetWidth || 200;
            var h = menu.offsetHeight || 220;
            if (w < 10) w = 200;
            if (h < 10) h = 220;

            var left = br.right - w;
            left = Math.max(vpPad, Math.min(left, window.innerWidth - w - vpPad));

            var top = br.bottom + gap;
            var spaceBelow = window.innerHeight - br.bottom - vpPad;
            var spaceAbove = br.top - vpPad;
            if (spaceBelow < h && spaceAbove >= h && spaceAbove > spaceBelow) {
                top = br.top - h - gap;
            }
            top = Math.max(vpPad, Math.min(top, window.innerHeight - h - vpPad));

            menu.style.position = 'fixed';
            menu.style.left = Math.round(left) + 'px';
            menu.style.top = Math.round(top) + 'px';
            menu.style.right = 'auto';
            menu.style.bottom = 'auto';
            menu.style.marginTop = '0';
            menu.style.marginBottom = '0';
            menu.style.zIndex = '10050';
        }

        function bindActionsMenuRepos(btn, menu) {
            unbindActionsMenuRepos(menu);
            var scrollEl = btn.closest('#customersTableScroll, #requestsTableScroll');
            function reposition() {
                if (menu.classList.contains('hidden')) return;
                positionAnchoredActionsMenu(btn, menu);
            }
            menu._actionsRepos = { scrollEl: scrollEl || null, reposition: reposition };
            if (scrollEl) scrollEl.addEventListener('scroll', reposition, { passive: true });
            window.addEventListener('resize', reposition);
            window.addEventListener('scroll', reposition, { passive: true });
        }

        function getActionsMenuForButton(btn) {
            if (!btn) return null;
            var id = btn.dataset && btn.dataset.actionsMenuId ? String(btn.dataset.actionsMenuId) : '';
            if (id) {
                var found = document.querySelector('.actions-dropdown-menu[data-actions-menu-id="' + id + '"]');
                if (found) return found;
            }
            var sib = btn.nextElementSibling;
            if (sib && sib.classList && sib.classList.contains('actions-dropdown-menu')) return sib;
            return null;
        }

        function toggleActionsDropdown(btn) {
            var menu = getActionsMenuForButton(btn);
            if (!menu) return;
            var willOpen = menu.classList.contains('hidden');
            closeAllDropdowns();
            if (willOpen) {
                menu.classList.remove('hidden');
                if (!menu.dataset.actionsMenuId) menu.dataset.actionsMenuId = String(Date.now()) + '-' + String(Math.random()).slice(2);
                btn.dataset.actionsMenuId = menu.dataset.actionsMenuId;
                anchorActionsMenu(btn, menu);
                requestAnimationFrame(function() {
                    positionAnchoredActionsMenu(btn, menu);
                    bindActionsMenuRepos(btn, menu);
                });
                var cell = btn.closest('td');
                if (cell) { cell.classList.add('actions-cell-active'); cell.style.zIndex = '80'; }
                var row = btn.closest('tr');
                if (row) row.classList.add('dropdown-active-row');
                var tbody = btn.closest('tbody');
                if (tbody) {
                    tbody.classList.add('dropdown-open');
                    tbody.querySelectorAll('.actions-dropdown-btn').forEach(function(b) {
                        b.style.visibility = (b === btn) ? '' : 'hidden';
                    });
                }
            }
        }
        window.toggleActionsDropdown = toggleActionsDropdown;

        document.addEventListener('click', function(e) {
            var tgt = e.target;
            if (tgt && tgt.nodeType === 3) tgt = tgt.parentElement;
            if (!tgt || typeof tgt.closest !== 'function') tgt = null;
            if (tgt && (tgt.closest('.actions-dropdown-btn') || tgt.closest('.actions-dropdown-menu'))) return;
            var ev = e;
            setTimeout(function() {
                var t = ev.target;
                if (t && t.nodeType === 3) t = t.parentElement;
                if (!t || typeof t.closest !== 'function') t = null;
                if (t && (t.closest('.actions-dropdown-btn') || t.closest('.actions-dropdown-menu'))) return;
                closeAllDropdowns();
            }, 0);
        });

        function normalizePhoneDigits(phoneValue) {
            const raw = String(phoneValue || '').trim();
            return raw
                .replace(/[٠-٩]/g, function(d) { return String(d.charCodeAt(0) - 1632); })
                .replace(/[۰-۹]/g, function(d) { return String(d.charCodeAt(0) - 1776); })
                .replace(/[^\\d]/g, '');
        }

        function localSaudiPhone(phoneValue) {
            const digits = normalizePhoneDigits(phoneValue);
            if (!digits) return '';
            if (digits.startsWith('00966')) return digits.slice(5);
            if (digits.startsWith('966')) return digits.slice(3);
            if (digits.startsWith('05') && digits.length === 10) return digits.slice(1);
            return digits;
        }

        function toSaudiWaNumber(phoneValue) {
            let digits = normalizePhoneDigits(phoneValue);
            if (!digits) return '';
            if (digits.startsWith('00966')) digits = digits.slice(2);
            if (digits.startsWith('966')) return /^9665\\d{8}$/.test(digits) ? digits : '';
            if (digits.startsWith('05') && digits.length === 10) digits = digits.slice(1);
            if (/^5\\d{8}$/.test(digits)) return '966' + digits;
            return '';
        }

        function openCustomerWhatsApp(whatsAppPhone, fallbackPhone, customerName) {
            const normalizedPhone = toSaudiWaNumber(whatsAppPhone) || toSaudiWaNumber(fallbackPhone);
            if (!normalizedPhone) {
                alert('لا يوجد رقم واتساب صالح لهذا العميل');
                return;
            }

            let url = 'https://wa.me/' + normalizedPhone;
            const msg = applyWaGreetingTemplate(customerName || '');
            if (msg) url += '?text=' + encodeURIComponent(msg);
            window.open(url, '_blank', 'noopener,noreferrer');
        }

        let waGreetingTemplate = '';
        let waCompanyName = '';
        function applyWaGreetingTemplate(customerName) {
            if (!waGreetingTemplate) return '';
            return String(waGreetingTemplate)
                .replace(/\\{\\{customer_name\\}\\}/g, String(customerName || ''))
                .replace(/\\{\\{company_name\\}\\}/g, waCompanyName || '');
        }
        async function loadWaGreetingSettings() {
            try {
                const res = await axios.get('/api/tenant/whatsapp-greeting');
                if (res.data && res.data.success && res.data.data) {
                    waGreetingTemplate = res.data.data.whatsapp_greeting || '';
                    waCompanyName = res.data.data.company_name || '';
                }
            } catch (_) {}
        }
        loadWaGreetingSettings();
        document.addEventListener('DOMContentLoaded', loadWaGreetingSettings);

        // Pagination helpers (Customers + Financing Requests)
        const customersPaging = { page: 1, pageSize: 15, lastSig: '' };
        const requestsPaging = { page: 1, pageSize: 15, lastSig: '' };

        function getPageSizeOptions(total) {
            const base = [15, 30, 50, 100];
            const totalNum = Number(total) || 0;
            const options = [base[0]];

            for (let i = 1; i < base.length; i++) {
                const size = base[i];
                const prev = base[i - 1];

                if (totalNum >= size) {
                    options.push(size);
                    continue;
                }

                // If we have more than the previous bucket, allow the next higher option.
                // Example: total=21 -> [15, 30]
                if (totalNum > prev) options.push(size);
                break;
            }

            return options;
        }

        function clampPage(page, totalPages) {
            if (totalPages <= 1) return 1;
            if (page < 1) return 1;
            if (page > totalPages) return totalPages;
            return page;
        }

        function renderPaginationUI(kind, total, paging) {
            const pageSizeSelect = document.getElementById(kind + 'PageSize');
            const prevBtn = document.getElementById(kind + 'PrevBtn');
            const nextBtn = document.getElementById(kind + 'NextBtn');
            const info = document.getElementById(kind + 'PageInfo');

            if (!pageSizeSelect || !prevBtn || !nextBtn || !info) return;

            const options = getPageSizeOptions(total);
            if (!options.includes(paging.pageSize)) paging.pageSize = 15;

            pageSizeSelect.innerHTML = options
                .map((n) => '<option value="' + n + '" ' + (n === paging.pageSize ? 'selected' : '') + '>' + n + '</option>')
                .join('');

            const totalPages = Math.max(1, Math.ceil(total / paging.pageSize));
            paging.page = clampPage(paging.page, totalPages);

            const start = total === 0 ? 0 : (paging.page - 1) * paging.pageSize + 1;
            const end = Math.min(total, paging.page * paging.pageSize);

            info.textContent = total === 0 ? '0 / 0' : (start + '-' + end + ' من ' + total);
            prevBtn.disabled = paging.page <= 1;
            nextBtn.disabled = paging.page >= totalPages;
            prevBtn.classList.toggle('opacity-50', prevBtn.disabled);
            nextBtn.classList.toggle('opacity-50', nextBtn.disabled);
        }

        // Edge scroll controls for horizontally-scrollable tables
        function setNormalizedScrollLeft(el, normalizedLeft) {
            const max = el.scrollWidth - el.clientWidth;
            const clamped = Math.max(0, Math.min(max, normalizedLeft));
            const dir = (getComputedStyle(el).direction || 'ltr').toLowerCase();
            if (dir !== 'rtl') {
                el.scrollLeft = clamped;
                return;
            }
            const type = getRtlScrollType();
            if (type === 'negative') el.scrollLeft = -clamped;
            else if (type === 'reverse') el.scrollLeft = max - clamped;
            else el.scrollLeft = clamped; // default
        }

        function animateNormalizedScrollLeft(el, target, durationMs) {
            const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReduced) {
                setNormalizedScrollLeft(el, target);
                return;
            }

            const max = el.scrollWidth - el.clientWidth;
            const to = Math.max(0, Math.min(max, target));
            const from = getNormalizedScrollLeft(el);
            const delta = to - from;
            if (Math.abs(delta) < 1) return;

            const start = performance.now();
            const duration = Math.max(120, Number(durationMs) || 260);
            const animToken = String(Number(el.dataset.edgeScrollAnimToken || '0') + 1);
            el.dataset.edgeScrollAnimToken = animToken;

            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

            const tick = (now) => {
                if (el.dataset.edgeScrollAnimToken !== animToken) return; // cancelled by a newer anim
                const t = Math.min(1, (now - start) / duration);
                const eased = easeOutCubic(t);
                setNormalizedScrollLeft(el, from + delta * eased);
                if (t < 1) requestAnimationFrame(tick);
            };

            requestAnimationFrame(tick);
        }

        window.edgeScrollStep = function(scrollElId, visualDirection) {
            const el = document.getElementById(scrollElId);
            if (!el) return;

            const step = 360;
            const dir = (getComputedStyle(el).direction || 'ltr').toLowerCase();

            // visualDirection means "move viewport towards that edge"
            // normalized scrollLeft is always LTR-like (0..max)
            let delta = visualDirection === 'left' ? -step : step;
            if (dir === 'rtl') delta = -delta;

            const current = getNormalizedScrollLeft(el);
            animateNormalizedScrollLeft(el, current + delta, 260);

            requestAnimationFrame(() => {
                const leftId = scrollElId.indexOf('customers') >= 0 ? 'customersEdgeLeft' : 'requestsEdgeLeft';
                const rightId = scrollElId.indexOf('customers') >= 0 ? 'customersEdgeRight' : 'requestsEdgeRight';
                updateEdgeScrollControls(scrollElId, leftId, rightId);
            });
        }

        let __rtlScrollType = null;
        function getRtlScrollType() {
            if (__rtlScrollType) return __rtlScrollType;
            const div = document.createElement('div');
            div.style.width = '4px';
            div.style.height = '1px';
            div.style.overflow = 'scroll';
            div.style.direction = 'rtl';
            div.style.position = 'absolute';
            div.style.top = '-9999px';
            const inner = document.createElement('div');
            inner.style.width = '8px';
            inner.style.height = '1px';
            div.appendChild(inner);
            document.body.appendChild(div);
            // Standard RTL scrollLeft detection:
            // - reverse: initial scrollLeft > 0 (starts at max)
            // - negative: after setting scrollLeft=1, value becomes < 0 (Chrome) or stays 0 (older impls)
            // - default: after setting scrollLeft=1, value becomes > 0
            if (div.scrollLeft > 0) {
                __rtlScrollType = 'reverse';
            } else {
                div.scrollLeft = 1;
                __rtlScrollType = div.scrollLeft <= 0 ? 'negative' : 'default';
            }

            document.body.removeChild(div);
            return __rtlScrollType;
        }

        function getNormalizedScrollLeft(el) {
            const max = el.scrollWidth - el.clientWidth;
            const dir = (getComputedStyle(el).direction || 'ltr').toLowerCase();
            if (dir !== 'rtl') return el.scrollLeft;
            const type = getRtlScrollType();
            if (type === 'negative') return -el.scrollLeft;
            if (type === 'reverse') return max - el.scrollLeft;
            return el.scrollLeft; // default
        }

        function positionEdgeArrowAtViewportCenter(scrollElId, arrowBtnId) {
            const el = document.getElementById(scrollElId);
            const arrow = document.getElementById(arrowBtnId);
            if (!el || !arrow) return;

            const wrap = el.closest('.edge-scroll-wrap');
            if (!wrap) return;

            const wrapRect = wrap.getBoundingClientRect();
            const vhCenter = window.innerHeight / 2;
            const padding = 16;
            const minY = wrapRect.top + padding;
            const maxY = wrapRect.bottom - padding;
            const desired = vhCenter;
            const clamped = Math.max(minY, Math.min(maxY, desired));
            const relativeTop = clamped - wrapRect.top;
            arrow.style.top = String(relativeTop) + 'px';
        }

        function updateEdgeScrollControls(scrollElId, leftBtnId, rightBtnId) {
            const el = document.getElementById(scrollElId);
            const leftWrap = document.getElementById(leftBtnId);
            const rightWrap = document.getElementById(rightBtnId);
            if (!el || !leftWrap || !rightWrap) return;

            const canScroll = (el.scrollWidth - el.clientWidth) > 0.5;
            if (!canScroll) {
                leftWrap.classList.add('edge-hidden');
                rightWrap.classList.add('edge-hidden');
                return;
            }

            const maxScrollLeft = el.scrollWidth - el.clientWidth;
            const sl = getNormalizedScrollLeft(el);

            const canLeft = sl > 1;
            const canRight = sl < maxScrollLeft - 1;
            const dir = (getComputedStyle(el).direction || 'ltr').toLowerCase();
            const showLeft = dir === 'rtl' ? canRight : canLeft;
            const showRight = dir === 'rtl' ? canLeft : canRight;

            // show only when there is room in that direction
            leftWrap.classList.toggle('edge-hidden', !showLeft);
            rightWrap.classList.toggle('edge-hidden', !showRight);

            if (showLeft) positionEdgeArrowAtViewportCenter(scrollElId, leftBtnId);
            if (showRight) positionEdgeArrowAtViewportCenter(scrollElId, rightBtnId);
        }

        function setupEdgeScroll(scrollElId, leftBtnId, rightBtnId) {
            const el = document.getElementById(scrollElId);
            if (!el) return;
            if (el.dataset.edgeScrollBound === '1') return;
            el.dataset.edgeScrollBound = '1';

            const tick = () => updateEdgeScrollControls(scrollElId, leftBtnId, rightBtnId);
            el.addEventListener('scroll', tick, { passive: true });
            window.addEventListener('resize', tick);
            window.addEventListener('scroll', tick, { passive: true });
            window.addEventListener('load', tick, { passive: true });
            setTimeout(tick, 0);
            setTimeout(tick, 150);
            setTimeout(tick, 500);
            if (typeof ResizeObserver !== 'undefined') {
                try {
                    const ro = new ResizeObserver(tick);
                    ro.observe(el);
                    const tbl = el.querySelector('table');
                    if (tbl) ro.observe(tbl);
                } catch (e) {}
            }
        }

        window.setCustomersPageSize = function(value) {
            const parsed = Number(value);
            customersPaging.pageSize = Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
            customersPaging.page = 1;
            loadCustomers();
        }

        window.setCustomersPage = function(directionOrPage) {
            if (directionOrPage === 'prev') customersPaging.page -= 1;
            else if (directionOrPage === 'next') customersPaging.page += 1;
            else {
                const parsed = Number(directionOrPage);
                if (Number.isFinite(parsed)) customersPaging.page = parsed;
            }
            loadCustomers();
        }

        window.setRequestsPageSize = function(value) {
            const parsed = Number(value);
            requestsPaging.pageSize = Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
            requestsPaging.page = 1;
            loadFinancingRequests();
        }

        window.setRequestsPage = function(directionOrPage) {
            if (directionOrPage === 'prev') requestsPaging.page -= 1;
            else if (directionOrPage === 'next') requestsPaging.page += 1;
            else {
                const parsed = Number(directionOrPage);
                if (Number.isFinite(parsed)) requestsPaging.page = parsed;
            }
            loadFinancingRequests();
        }

        // Collapsible filter toggles
        window.toggleCustomersFilters = function() {
            const panel = document.getElementById('customersFiltersPanel');
            const icon = document.getElementById('customersFiltersIcon');
            if (!panel) return;
            const hidden = panel.style.display === 'none';
            panel.style.display = hidden ? 'grid' : 'none';
            if (icon) icon.style.transform = hidden ? '' : 'rotate(-90deg)';
        }

        window.toggleRequestsFilters = function() {
            const panel = document.getElementById('requestsFiltersPanel');
            const icon = document.getElementById('requestsFiltersIcon');
            if (!panel) return;
            const hidden = panel.style.display === 'none';
            panel.style.display = hidden ? 'grid' : 'none';
            if (icon) icon.style.transform = hidden ? '' : 'rotate(-90deg)';
        }

        window.resetCustomersFilters = function() {
            const el = (id) => document.getElementById(id);
            if (el('filterDateFrom')) el('filterDateFrom').value = '';
            if (el('filterDateTo')) el('filterDateTo').value = '';
            if (el('filterCustomerEmployee')) el('filterCustomerEmployee').value = '';
            if (el('filterCustomerBankAgent')) el('filterCustomerBankAgent').value = '';
            loadCustomers();
        }

        window.resetRequestsFilters = function() {
            const el = (id) => document.getElementById(id);
            if (el('filterRequestDateFrom')) el('filterRequestDateFrom').value = '';
            if (el('filterRequestDateTo')) el('filterRequestDateTo').value = '';
            if (el('filterStatus')) el('filterStatus').value = '';
            if (el('filterBank')) el('filterBank').value = '';
            if (el('filterRequestEmployee')) el('filterRequestEmployee').value = '';
            if (el('filterRequestBankAgent')) el('filterRequestBankAgent').value = '';
            loadFinancingRequests();
        }

        // Populate employee (role 4/6) and bank agent (role 5/6) dropdowns
        async function loadRoleDropdowns() {
            try {
                const userData = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || 'null') || {};
                const tenantId = parseInt(String(userData.tenant_id || userData.tenantId || ''), 10);
                let employees = [];
                let bankAgents = [];
                if (tenantId > 0) {
                    const [empRes, agentRes] = await Promise.all([
                        axios.get('/api/admin/filter-employees?tenant_id=' + encodeURIComponent(String(tenantId))),
                        axios.get('/api/admin/bank-agents?tenant_id=' + encodeURIComponent(String(tenantId))),
                    ]);
                    if (empRes.data?.success) employees = empRes.data.data || [];
                    if (agentRes.data?.success) bankAgents = agentRes.data.data || [];
                }
                if (!employees.length && !bankAgents.length) {
                    const response = await axios.get('/api/users');
                    if (!response.data.success) return;
                    const users = response.data.data;
                    employees = users.filter((u) => { const r = Number(u.role_id); return r === 4 || r === 14 || r === 6; });
                    bankAgents = users.filter((u) => { const r = Number(u.role_id); return r === 5 || r === 15 || r === 6; });
                } else {
                    employees = employees.filter((u) => { const r = Number(u.role_id); return r === 4 || r === 14 || r === 6; });
                    bankAgents = bankAgents.filter((u) => { const r = Number(u.role_id); return r === 5 || r === 15 || r === 6; });
                }

                const empSelectors = ['filterCustomerEmployee', 'filterRequestEmployee'];
                empSelectors.forEach((id) => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    const current = el.value;
                    el.innerHTML = '<option value="">جميع الموظفين</option>' +
                        employees.map((u) => \`<option value="\${u.id}">\${u.full_name || u.username}</option>\`).join('');
                    el.value = current;
                });

                const agentSelectors = ['filterCustomerBankAgent', 'filterRequestBankAgent'];
                agentSelectors.forEach((id) => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    const current = el.value;
                    el.innerHTML = '<option value="">جميع موظفي البنك</option>' +
                        bankAgents.map((u) => \`<option value="\${u.id}">\${u.full_name || u.username}</option>\`).join('');
                    el.value = current;
                });

                // Add customer modal: show bank agent selector for role 2/1
                const addCustAgentSelect = document.getElementById('addCustomerBankAgentSelect');
                const addCustAgentSection = document.getElementById('addCustomerBankAgentSection');
                if (addCustAgentSelect && addCustAgentSection) {
                    const normalizeRId = (v) => { const n = parseInt(v, 10); const m = {11:1,12:2,13:3,14:4,15:5}; return m[n] || n || null; };
                    const currentRoleId = normalizeRId(typeof window.USER_ROLE_ID !== 'undefined' ? window.USER_ROLE_ID : null)
                        || normalizeRId((JSON.parse(localStorage.getItem('userData') || 'null') || {}).role_id);
                    if (currentRoleId === 2 || currentRoleId === 1) {
                        if (bankAgents.length > 0) {
                            addCustAgentSelect.innerHTML = '<option value="">— بدون تعيين —</option>' +
                                bankAgents.map((u) => \`<option value="\${u.id}">\${u.full_name || u.username}</option>\`).join('');
                            addCustAgentSection.style.display = '';
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading role dropdowns:', e);
            }
        }

        // ===== Customer alarm glow dot — DOM-based injection =====
        // Strategy: each customer/request row carries a placeholder
        //   <span class="customer-alarm-slot" data-customer-id="X"></span>
        // After any table render OR after fresh alarm data arrives, paintCustomerAlarmDots()
        // walks every slot and fills (or empties) it based on the latest count.
        //
        // Count sources, in priority order:
        //   1. data-unread-alarms on the parent <tr> (shipped from /api/customers,
        //      /api/financing-requests as unread_alarm_count)
        //   2. window.customerAlarmsByCustomer client-side map (fallback)
        //
        // Works for ALL three alarm types — backend returns every unread row regardless
        // of alarm_type, and the counts are grouped by customer_id only.

        window.customerAlarmsByCustomer = window.customerAlarmsByCustomer || {};

        function buildAlarmDotHTML(customerId, count) {
            return '<button type="button" onclick="event.stopPropagation(); openCustomerAlarmsPopup(' + customerId + ')" ' +
                'title="' + count + ' تنبيه غير مقروء" ' +
                'class="inline-flex items-center justify-center w-3 h-3 rounded-full bg-red-500 flex-shrink-0 cursor-pointer hover:scale-125 transition-transform" ' +
                'style="animation:pulse-glow 1.5s infinite; box-shadow:0 0 0 2px rgba(239,68,68,0.4)"></button>';
        }

        function paintCustomerAlarmDots(root) {
            const scope = root || document;
            const slots = scope.querySelectorAll('.customer-alarm-slot[data-customer-id]');
            if (!slots.length) return 0;
            const map = window.customerAlarmsByCustomer || {};
            let painted = 0;
            slots.forEach(function(slot) {
                const cid = slot.getAttribute('data-customer-id');
                if (!cid || cid === 'null' || cid === 'undefined') { slot.innerHTML = ''; return; }
                // Prefer per-row count from the <tr>
                let count = 0;
                const tr = slot.closest('tr');
                if (tr) {
                    const raw = tr.getAttribute('data-unread-alarms');
                    if (raw != null && raw !== '') count = Number(raw) || 0;
                }
                if (!count) {
                    const list = map[String(cid)] || map[cid];
                    if (list && list.length) count = list.length;
                }
                if (count > 0) {
                    slot.innerHTML = buildAlarmDotHTML(cid, count);
                    painted++;
                } else {
                    slot.innerHTML = '';
                }
            });
            try { console.log('[alarm-glow] painted', painted, '/', slots.length, 'slots'); } catch(_) {}
            return painted;
        }
        window.paintCustomerAlarmDots = paintCustomerAlarmDots;

        async function refreshCustomerAlarmsMap() {
            try {
                const resp = await fetch('/api/customer-alarms', { credentials: 'same-origin' });
                const data = await resp.json();
                const map = {};
                if (data && data.success && Array.isArray(data.data)) {
                    for (const a of data.data) {
                        if (a.is_read) continue;
                        const cid = a.customer_id;
                        if (cid == null || cid === '') continue;
                        const key = String(cid);
                        if (!map[key]) map[key] = [];
                        map[key].push(a);
                    }
                }
                window.customerAlarmsByCustomer = map;
                try { console.log('[alarm-glow] map updated:', Object.keys(map).length, 'customers, sample:', Object.keys(map).slice(0, 5)); } catch(_) {}
                // Repaint any visible table immediately so the dot appears even if the
                // table was rendered without the inline data-unread-alarms hint.
                paintCustomerAlarmDots();
                return map;
            } catch (e) {
                console.warn('[alarm-glow] refresh failed:', e);
                return window.customerAlarmsByCustomer || {};
            }
        }
        window.refreshCustomerAlarmsMap = refreshCustomerAlarmsMap;

        // Backwards-compat: some older render paths may still call renderCustomerAlarmDot.
        function renderCustomerAlarmDot(customerId, inlineCount) {
            if (customerId == null || customerId === '') return '';
            let count = typeof inlineCount === 'number' ? inlineCount : 0;
            if (!count) {
                const map = window.customerAlarmsByCustomer || {};
                const list = map[String(customerId)] || map[customerId];
                if (list && list.length) count = list.length;
            }
            if (!count) return '';
            return buildAlarmDotHTML(customerId, count);
        }
        window.renderCustomerAlarmDot = renderCustomerAlarmDot;

        // Load Customers
        async function loadCustomers() {
            try {
                const [response] = await Promise.all([
                    axios.get('/api/customers'),
                    refreshCustomerAlarmsMap()
                ]);
                if (response.data.success) {
                    let customers = response.data.data;
                    const tbody = document.getElementById('customersTable');
                    
                    // Apply filters
                    const filterDateFrom = document.getElementById('filterDateFrom')?.value;
                    const filterDateTo = document.getElementById('filterDateTo')?.value;
                    const searchQuery = (document.getElementById('searchCustomers')?.value || '').trim().toLowerCase();
                    const filterCustomerEmployee = document.getElementById('filterCustomerEmployee')?.value || '';
                    const filterCustomerBankAgent = document.getElementById('filterCustomerBankAgent')?.value || '';
                    const sig = JSON.stringify({ filterDateFrom, filterDateTo, searchQuery, filterCustomerEmployee, filterCustomerBankAgent });
                    if (sig !== customersPaging.lastSig) {
                        customersPaging.lastSig = sig;
                        customersPaging.page = 1;
                    }

                    if (filterDateFrom || filterDateTo) {
                        customers = customers.filter(customer => {
                            if (!customer.created_at) return false;
                            const customerDate = new Date(customer.created_at);
                            if (filterDateFrom && customerDate < new Date(filterDateFrom)) return false;
                            if (filterDateTo && customerDate > new Date(filterDateTo + 'T23:59:59')) return false;
                            return true;
                        });
                    }

                    if (searchQuery) {
                        customers = customers.filter((customer) => {
                            const name = String(customer.full_name || '').toLowerCase();
                            const phone = String(customer.phone || '').toLowerCase();
                            return name.includes(searchQuery) || phone.includes(searchQuery);
                        });
                    }

                    if (filterCustomerEmployee) {
                        const empId = Number(filterCustomerEmployee);
                        customers = customers.filter((c) => Number(c.assigned_employee_id) === empId);
                    }

                    if (filterCustomerBankAgent) {
                        const agentId = Number(filterCustomerBankAgent);
                        customers = customers.filter((c) => {
                            const rid = c.resolved_bank_agent_id != null && c.resolved_bank_agent_id !== ''
                                ? Number(c.resolved_bank_agent_id)
                                : c.assigned_bank_agent_id != null && c.assigned_bank_agent_id !== ''
                                  ? Number(c.assigned_bank_agent_id)
                                  : NaN;
                            return rid === agentId;
                        });
                    }
                    
                    closeAllDropdowns();
                    if (customers.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="10" class="text-center py-8 text-gray-500">لا توجد بيانات</td></tr>';
                        renderPaginationUI('customers', 0, customersPaging);
                        return;
                    }

                    const totalCustomers = customers.length;
                    renderPaginationUI('customers', totalCustomers, customersPaging);
                    const totalPages = Math.max(1, Math.ceil(totalCustomers / customersPaging.pageSize));
                    customersPaging.page = clampPage(customersPaging.page, totalPages);
                    const startIdx = (customersPaging.page - 1) * customersPaging.pageSize;
                    const pageCustomers = customers.slice(startIdx, startIdx + customersPaging.pageSize);
                    
                    tbody.innerHTML = pageCustomers.map((customer, index) => \`
                        <tr class="border-b hover:bg-gray-50" data-customer-id="\${customer.id}" data-unread-alarms="\${Number(customer.unread_alarm_count) || 0}">
                            <td class="px-4 py-3">
                                <div class="relative inline-block text-right">
                                    <button type="button" onclick="toggleActionsDropdown(this); return false;" class="actions-dropdown-btn inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium transition-colors">
                                        <i class="fas fa-ellipsis-h"></i> الإجراءات <i class="fas fa-chevron-down text-xs"></i>
                                    </button>
                                    <div class="actions-dropdown-menu hidden absolute left-0 mt-1 min-w-[11rem] w-max bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                                        <button onclick="viewCustomer(\${customer.id})" class="flex items-center gap-2 w-full px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 text-right">
                                            <i class="fas fa-eye w-3"></i> عرض
                                        </button>
                                        <a href="/admin/requests/new?customer_id=\${customer.id}" class="flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 text-right">
                                            <i class="fas fa-file-invoice w-3 flex-shrink-0"></i> طلب تمويل جديد
                                        </a>
                                        <button onclick="editCustomer(\${customer.id})" class="flex items-center gap-2 w-full px-3 py-2 text-xs text-green-700 hover:bg-green-50 text-right">
                                            <i class="fas fa-edit w-3"></i> تعديل
                                        </button>
                                    </div>
                                </div>
                            </td>
                            <td class="px-4 py-3">\${startIdx + index + 1}</td>
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-2">
                                    <span class="customer-alarm-slot" data-customer-id="\${customer.id}"></span>
                                    <span class="font-medium truncate-cell">\${customer.full_name}</span>
                                    <button onclick="viewCustomerFinancingDetails(\${customer.id})"
                                            class="text-indigo-600 hover:text-indigo-800 transition-colors" 
                                            title="عرض التفاصيل التمويلية الكاملة">
                                        <i class="fas fa-info-circle text-lg"></i>
                                    </button>
                                </div>
                            </td>
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-2">
                                    <span dir="ltr">\${localSaudiPhone(customer.phone) || '-'}</span>
                                    <button
                                        onclick="openCustomerWhatsApp('\${String(customer.whatsapp_phone || customer.whatsapp_phone_number || customer.phone || '').replace(/'/g, "\\\\'")}', '\${String(customer.phone || '').replace(/'/g, "\\\\'")}', '\${String(customer.full_name || '').replace(/'/g, "\\\\'")}')"
                                        class="inline-flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-md text-xs font-semibold transition-colors"
                                        title="فتح واتساب">
                                        <i class="fab fa-whatsapp"></i>
                                        <span>واتساب</span>
                                    </button>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-sm">\${customer.birthdate ? customer.birthdate + (customer.dob_calendar_type === 'hijri' ? ' هـ' : ' م') : '-'}</td>
                            <td class="px-4 py-3 font-medium text-green-600">\${customer.monthly_salary ? customer.monthly_salary.toLocaleString('ar-SA') + ' ريال' : '-'}</td>
                            <td class="px-4 py-3 font-medium text-purple-600">\${customer.financing_amount ? customer.financing_amount.toLocaleString('ar-SA') + ' ريال' : '-'}</td>
                            <td class="px-4 py-3 text-sm text-orange-600">\${customer.monthly_obligations ? customer.monthly_obligations.toLocaleString('ar-SA') + ' ريال' : '-'}</td>
                            <td class="px-4 py-3 text-sm">\${customer.financing_type_name || '-'}</td>
                            <td class="px-4 py-3 text-sm text-indigo-700">\${customer.assigned_bank_agent_name || ((customer.resolved_bank_agent_id ?? customer.assigned_bank_agent_id) ? '(#' + (customer.resolved_bank_agent_id ?? customer.assigned_bank_agent_id) + ')' : '-')}</td>
                        </tr>
                    \`).join('');

                    try { paintCustomerAlarmDots(tbody); } catch (e) { console.warn('[alarm-glow] paint after customers render failed', e); }
                    setupEdgeScroll('customersTableScroll', 'customersEdgeLeft', 'customersEdgeRight');
                } else {
                    renderPaginationUI('customers', 0, customersPaging);
                }
            } catch (error) {
                console.error('Error loading customers:', error);
                renderPaginationUI('customers', 0, customersPaging);
            }
        }
        
        // Load Financing Requests
        async function loadFinancingRequests() {
            try {
                const [response] = await Promise.all([
                    axios.get('/api/financing-requests'),
                    refreshCustomerAlarmsMap()
                ]);
                if (response.data.success) {
                    let requests = response.data.data;
                    const tbody = document.getElementById('requestsTable');
                    
                    // Apply filters
                    const filterDateFrom = document.getElementById('filterRequestDateFrom')?.value;
                    const filterDateTo = document.getElementById('filterRequestDateTo')?.value;
                    const filterStatus = document.getElementById('filterStatus')?.value || '';
                    const filterBank = document.getElementById('filterBank')?.value || '';
                    const filterRequestEmployee = document.getElementById('filterRequestEmployee')?.value || '';
                    const filterRequestBankAgent = document.getElementById('filterRequestBankAgent')?.value || '';
                    const sig = JSON.stringify({ filterDateFrom, filterDateTo, filterStatus, filterBank, filterRequestEmployee, filterRequestBankAgent });
                    if (sig !== requestsPaging.lastSig) {
                        requestsPaging.lastSig = sig;
                        requestsPaging.page = 1;
                    }

                    if (filterDateFrom || filterDateTo) {
                        requests = requests.filter(req => {
                            if (!req.created_at) return false;
                            const requestDate = new Date(req.created_at);
                            if (filterDateFrom && requestDate < new Date(filterDateFrom)) return false;
                            if (filterDateTo && requestDate > new Date(filterDateTo + 'T23:59:59')) return false;
                            return true;
                        });
                    }

                    if (filterStatus) {
                        requests = requests.filter((req) => String(req.status || '') === filterStatus);
                    }

                    if (filterBank) {
                        const bankIdNum = Number(filterBank);
                        requests = requests.filter((req) => {
                            if (Number.isFinite(bankIdNum)) return Number(req.selected_bank_id) === bankIdNum;
                            return String(req.selected_bank_name || '') === filterBank;
                        });
                    }

                    if (filterRequestEmployee) {
                        const empId = Number(filterRequestEmployee);
                        requests = requests.filter((req) => Number(req.assigned_employee_id) === empId);
                    }

                    if (filterRequestBankAgent) {
                        const agentId = Number(filterRequestBankAgent);
                        requests = requests.filter((req) => Number(req.assigned_bank_agent_id) === agentId);
                    }
                    
                    closeAllDropdowns();
                    if (requests.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-gray-500">لا توجد طلبات</td></tr>';
                        renderPaginationUI('requests', 0, requestsPaging);
                        return;
                    }

                    const totalRequests = requests.length;
                    renderPaginationUI('requests', totalRequests, requestsPaging);
                    const totalPages = Math.max(1, Math.ceil(totalRequests / requestsPaging.pageSize));
                    requestsPaging.page = clampPage(requestsPaging.page, totalPages);
                    const startIdx = (requestsPaging.page - 1) * requestsPaging.pageSize;
                    const pageRequests = requests.slice(startIdx, startIdx + requestsPaging.pageSize);
                    
                    tbody.innerHTML = pageRequests.map((req, index) => {
                        const statusColors = {
                            'pending': 'bg-yellow-100 text-yellow-800',
                            'approved': 'bg-green-100 text-green-800',
                            'rejected': 'bg-red-100 text-red-800'
                        };
                        const statusText = {
                            'pending': 'قيد الانتظار',
                            'approved': 'مقبول',
                            'rejected': 'مرفوض'
                        };
                        
                        return \`
                            <tr class="border-b hover:bg-gray-50" data-customer-id="\${req.customer_id}" data-unread-alarms="\${Number(req.unread_alarm_count) || 0}">
                                <td class="px-4 py-3">
                                    <div class="relative inline-block text-right">
                                        <button type="button" onclick="toggleActionsDropdown(this); return false;" class="actions-dropdown-btn inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium transition-colors">
                                            <i class="fas fa-ellipsis-h"></i> الإجراءات <i class="fas fa-chevron-down text-xs"></i>
                                        </button>
                                        <div class="actions-dropdown-menu hidden absolute left-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                                            <button onclick="viewRequest(\${req.id})" class="flex items-center gap-2 w-full px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 text-right">
                                                <i class="fas fa-eye w-3"></i> عرض
                                            </button>
                                            <button onclick="updateStatus(\${req.id})" class="flex items-center gap-2 w-full px-3 py-2 text-xs text-green-700 hover:bg-green-50 text-right">
                                                <i class="fas fa-edit w-3"></i> تعديل الحالة
                                            </button>
                                            <div class="border-t border-gray-100 my-1"></div>
                                            <button onclick="deleteRequest(event, \${req.id})" class="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-700 hover:bg-red-50 text-right">
                                                <i class="fas fa-trash w-3"></i> حذف
                                            </button>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-4 py-3">\${startIdx + index + 1}</td>
                                <td class="px-4 py-3 font-medium"><div class="flex items-center gap-2"><span class="customer-alarm-slot" data-customer-id="\${req.customer_id}"></span><span class="truncate-cell">\${req.customer_name}</span></div></td>
                                <td class="px-4 py-3">\${req.customer_phone}</td>
                                <td class="px-4 py-3 text-sm">\${req.financing_type_name || '-'}</td>
                                <td class="px-4 py-3 font-medium">\${req.requested_amount.toLocaleString('ar-SA')}</td>
                                <td class="px-4 py-3">\${req.duration_months} شهر</td>
                                <td class="px-4 py-3 text-sm"><span class="truncate-cell sm">\${req.selected_bank_name || '-'}</span></td>
                                <td class="px-4 py-3">
                                    <span class="\${statusColors[req.status]} px-2 py-1 rounded text-xs">\${statusText[req.status]}</span>
                                </td>
                            </tr>
                        \`;
                    }).join('');

                    try { paintCustomerAlarmDots(tbody); } catch (e) { console.warn('[alarm-glow] paint after requests render failed', e); }
                    setupEdgeScroll('requestsTableScroll', 'requestsEdgeLeft', 'requestsEdgeRight');
                } else {
                    renderPaginationUI('requests', 0, requestsPaging);
                }
            } catch (error) {
                console.error('Error loading requests:', error);
                renderPaginationUI('requests', 0, requestsPaging);
            }
        }
        
        // Utility functions
        window.toggleDarkMode = function() {
            alert('وضع الليل - قيد التطوير');
        }
        
        window.logout = function() {
            if (confirm('هل تريد تسجيل الخروج؟')) {
                window.location.href = '/login';
            }
        }
        
        window.exportExcel = function(type) {
            alert('تصدير Excel - قيد التطوير');
        }
        
        function showAddCustomerModal() {
            alert('إضافة عميل - قيد التطوير');
        }
        
        window.addCustomer = function() {
            openModal('addCustomerModal');
        }
        
        window.viewCustomer = async function(id) {
            try {
                const response = await axios.get('/api/customers');
                if (response.data.success) {
                    const customer = response.data.data.find(c => c.id === id);
                    if (!customer) {
                        alert('❌ لم يتم العثور على العميل');
                        return;
                    }
                    
                    // Create modal content
                    const modalContent = \`
                        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="this.remove()">
                            <div class="bg-white rounded-xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                                <div class="flex items-center justify-between mb-6">
                                    <h2 class="text-3xl font-bold text-gray-800">
                                        <i class="fas fa-user-circle text-blue-600 ml-2"></i>
                                        بيانات العميل
                                    </h2>
                                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                                        <i class="fas fa-times text-2xl"></i>
                                    </button>
                                </div>
                                
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <!-- Personal Information -->
                                    <div class="col-span-2">
                                        <h3 class="text-xl font-bold text-gray-700 mb-4 border-b-2 border-blue-500 pb-2">
                                            <i class="fas fa-id-card text-blue-600 ml-2"></i>
                                            المعلومات الشخصية
                                        </h3>
                                    </div>
                                    
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-600 mb-1">الاسم الكامل</p>
                                        <p class="text-lg font-bold text-gray-800">\${customer.full_name || '-'}</p>
                                    </div>
                                    
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-600 mb-1">رقم الجوال</p>
                                        <p class="text-lg font-bold text-gray-800">\${localSaudiPhone(customer.phone) || '-'}</p>
                                    </div>
                                    
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-600 mb-1">البريد الإلكتروني</p>
                                        <p class="text-lg font-bold text-gray-800">\${customer.email || '-'}</p>
                                    </div>
                                    
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-600 mb-1">رقم الهوية الوطني</p>
                                        <p class="text-lg font-bold text-gray-800">\${customer.national_id && !customer.national_id.startsWith('TEMP-') ? customer.national_id : 'غير متوفر'}</p>
                                    </div>
                                    
                                    <div class="bg-blue-50 p-4 rounded-lg">
                                        <p class="text-sm text-blue-600 mb-1">📅 تاريخ الميلاد</p>
                                        <p class="text-lg font-bold text-blue-800">\${customer.birthdate ? customer.birthdate + (customer.dob_calendar_type === 'hijri' ? ' هـ' : ' م') : 'غير متوفر'}</p>
                                    </div>
                                    
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-600 mb-1">المدينة</p>
                                        <p class="text-lg font-bold text-gray-800">\${customer.city || 'غير متوفر'}</p>
                                    </div>
                                    
                                    <div class="bg-purple-50 p-4 rounded-lg">
                                        <p class="text-sm text-purple-600 mb-1">📝 تاريخ التسجيل</p>
                                        <p class="text-lg font-bold text-purple-800">\${customer.created_at ? new Date(customer.created_at).toLocaleDateString('ar-SA') : 'غير متوفر'}</p>
                                    </div>
                                    
                                    <!-- Employment Information -->
                                    <div class="col-span-2 mt-4">
                                        <h3 class="text-xl font-bold text-gray-700 mb-4 border-b-2 border-green-500 pb-2">
                                            <i class="fas fa-briefcase text-green-600 ml-2"></i>
                                            المعلومات الوظيفية
                                        </h3>
                                    </div>
                                    
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-600 mb-1">جهة العمل</p>
                                        <p class="text-lg font-bold text-gray-800">\${customer.employer_name || '-'}</p>
                                    </div>
                                    
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-600 mb-1">المسمى الوظيفي</p>
                                        <p class="text-lg font-bold text-gray-800">\${customer.job_title || '-'}</p>
                                    </div>
                                    
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-600 mb-1">تاريخ بداية العمل</p>
                                        <p class="text-lg font-bold text-gray-800">\${customer.work_start_date || '-'}</p>
                                    </div>
                                    
                                    <!-- Financing Information -->
                                    <div class="col-span-2 mt-4">
                                        <h3 class="text-xl font-bold text-gray-700 mb-4 border-b-2 border-purple-500 pb-2">
                                            <i class="fas fa-money-bill-wave text-purple-600 ml-2"></i>
                                            معلومات التمويل
                                        </h3>
                                    </div>
                                    
                                    <div class="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                                        <p class="text-sm text-purple-600 mb-1">💰 مبلغ التمويل المطلوب</p>
                                        <p class="text-2xl font-bold text-purple-700">\${customer.financing_amount ? customer.financing_amount.toLocaleString('ar-SA') + ' ريال' : 'غير محدد'}</p>
                                    </div>
                                    
                                    <div class="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                                        <p class="text-sm text-green-600 mb-1">💵 الراتب الشهري</p>
                                        <p class="text-2xl font-bold text-green-700">\${customer.monthly_salary ? customer.monthly_salary.toLocaleString('ar-SA') + ' ريال' : 'غير محدد'}</p>
                                    </div>
                                    
                                    <div class="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                                        <p class="text-sm text-orange-600 mb-1">📊 الالتزامات الشهرية</p>
                                        <p class="text-2xl font-bold text-orange-700">\${customer.monthly_obligations ? customer.monthly_obligations.toLocaleString('ar-SA') + ' ريال' : '0 ريال'}</p>
                                    </div>
                                    
                                    <div class="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                                        <p class="text-sm text-blue-600 mb-1">💳 الدخل المتاح</p>
                                        <p class="text-2xl font-bold text-blue-700">\${customer.monthly_salary && customer.monthly_obligations ? (customer.monthly_salary - customer.monthly_obligations).toLocaleString('ar-SA') + ' ريال' : 'غير محسوب'}</p>
                                    </div>
                                    
                                    <div class="bg-indigo-50 p-4 rounded-lg col-span-2 border-2 border-indigo-200">
                                        <p class="text-sm text-indigo-600 mb-1">🏦 نوع التمويل</p>
                                        <p class="text-xl font-bold text-indigo-800">\${customer.financing_type_name || 'غير محدد'}</p>
                                    </div>
                                    
                                    <!-- Requests Statistics -->
                                    <div class="col-span-2 mt-4">
                                        <h3 class="text-xl font-bold text-gray-700 mb-4 border-b-2 border-blue-500 pb-2">
                                            <i class="fas fa-chart-bar text-blue-600 ml-2"></i>
                                            إحصائيات الطلبات
                                        </h3>
                                    </div>
                                    
                                    <div class="bg-blue-50 p-4 rounded-lg text-center">
                                        <p class="text-sm text-blue-600 mb-1">إجمالي الطلبات</p>
                                        <p class="text-3xl font-bold text-blue-700">\${customer.total_requests || 0}</p>
                                    </div>
                                    
                                    <div class="bg-yellow-50 p-4 rounded-lg text-center">
                                        <p class="text-sm text-yellow-600 mb-1">قيد الانتظار</p>
                                        <p class="text-3xl font-bold text-yellow-700">\${customer.pending_requests || 0}</p>
                                    </div>
                                    
                                    <div class="bg-green-50 p-4 rounded-lg text-center">
                                        <p class="text-sm text-green-600 mb-1">موافق عليها</p>
                                        <p class="text-3xl font-bold text-green-700">\${customer.approved_requests || 0}</p>
                                    </div>
                                </div>
                                
                                <div class="flex justify-end gap-3 mt-6">
                                    <button onclick="editCustomer(\${customer.id})" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold">
                                        <i class="fas fa-edit ml-2"></i>
                                        تعديل
                                    </button>
                                    <button onclick="this.closest('.fixed').remove()" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold">
                                        <i class="fas fa-times ml-2"></i>
                                        إغلاق
                                    </button>
                                </div>
                            </div>
                        </div>
                    \`;
                    
                    // Append modal to body
                    document.body.insertAdjacentHTML('beforeend', modalContent);
                }
            } catch (error) {
                console.error('Error viewing customer:', error);
                alert('❌ حدث خطأ أثناء تحميل بيانات العميل');
            }
        }
        
        // View Customer Financing Details with Best Bank & Best Offer
        window.viewCustomerFinancingDetails = async function(id) {
            try {
                console.log('🔍 Loading financing details for customer:', id);
                
                // Get customer data
                const customersRes = await axios.get('/api/customers');
                const customer = customersRes.data.data.find(c => c.id === id);
                
                if (!customer) {
                    alert('❌ لم يتم العثور على العميل');
                    return;
                }
                
                // Get banks and rates data
                const [banksRes, ratesRes] = await Promise.all([
                    axios.get('/api/banks'),
                    axios.get('/api/financing-rates')
                ]);
                
                const banks = banksRes.data.data || [];
                const rates = ratesRes.data.data || [];
                
                // Calculate best financing options
                const salary = customer.monthly_salary || 0;
                const obligations = customer.monthly_obligations || 0;
                const requestedAmount = customer.financing_amount || 0;
                const duration = 60; // Default 60 months
                
                const availableIncome = salary - obligations;
                const maxMonthlyPayment = availableIncome * 0.33;
                
                // Calculate offers for each bank
                const offers = banks.filter(b => b.is_active).map(bank => {
                    // Find rate for this bank
                    const rate = rates.find(r => r.bank_id === bank.id && r.is_active);
                    if (!rate) return null;
                    
                    const profitRate = parseFloat(rate.profit_rate) / 100;
                    const adminFee = parseFloat(rate.admin_fee_percentage) / 100;
                    
                    // Calculate total amount with profit
                    const totalProfit = requestedAmount * profitRate * (duration / 12);
                    const totalAmount = requestedAmount + totalProfit;
                    const adminFeeAmount = requestedAmount * adminFee;
                    const finalAmount = totalAmount + adminFeeAmount;
                    const monthlyPayment = finalAmount / duration;
                    
                    return {
                        bank_id: bank.id,
                        bank_name: bank.bank_name,
                        profit_rate: rate.profit_rate,
                        admin_fee: rate.admin_fee_percentage,
                        monthly_payment: monthlyPayment,
                        total_amount: finalAmount,
                        total_profit: totalProfit + adminFeeAmount,
                        is_affordable: monthlyPayment <= maxMonthlyPayment
                    };
                }).filter(o => o !== null);
                
                // Sort by lowest monthly payment
                offers.sort((a, b) => a.monthly_payment - b.monthly_payment);
                
                const bestOffer = offers.find(o => o.is_affordable) || offers[0];
                
                // Create detailed modal
                const modalContent = \`
                    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="this.remove()">
                        <div class="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto" onclick="event.stopPropagation()">
                            <!-- Header -->
                            <div class="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 rounded-t-xl">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h2 class="text-2xl font-bold mb-2">
                                            <i class="fas fa-calculator ml-2"></i>
                                            التفاصيل التمويلية الكاملة
                                        </h2>
                                        <p class="text-indigo-100">\${customer.full_name}</p>
                                    </div>
                                    <button onclick="this.closest('.fixed').remove()" class="text-white hover:text-indigo-200">
                                        <i class="fas fa-times text-2xl"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="p-6">
                                <!-- Customer Financial Info -->
                                <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-6">
                                    <h3 class="text-xl font-bold text-blue-800 mb-4">
                                        <i class="fas fa-user-circle ml-2"></i>
                                        البيانات الأساسية
                                    </h3>
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div class="bg-white rounded-lg p-4">
                                            <p class="text-sm text-gray-600 mb-1">تاريخ الميلاد</p>
                                            <p class="text-lg font-bold text-gray-800">\${customer.birthdate ? customer.birthdate + (customer.dob_calendar_type === 'hijri' ? ' هـ' : ' م') : '-'}</p>
                                        </div>
                                        <div class="bg-white rounded-lg p-4">
                                            <p class="text-sm text-gray-600 mb-1">رقم الجوال</p>
                                            <p class="text-lg font-bold text-gray-800">\${customer.phone}</p>
                                        </div>
                                        <div class="bg-white rounded-lg p-4">
                                            <p class="text-sm text-gray-600 mb-1">نوع التمويل</p>
                                            <p class="text-lg font-bold text-gray-800">\${customer.financing_type_name || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Financial Summary -->
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div class="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 text-center">
                                        <i class="fas fa-money-bill-wave text-3xl mb-2 opacity-80"></i>
                                        <p class="text-sm opacity-90 mb-1">الراتب الشهري</p>
                                        <p class="text-2xl font-bold">\${salary.toLocaleString('ar-SA')}</p>
                                        <p class="text-xs opacity-75">ريال</p>
                                    </div>
                                    <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center">
                                        <i class="fas fa-hand-holding-usd text-3xl mb-2 opacity-80"></i>
                                        <p class="text-sm opacity-90 mb-1">مبلغ التمويل</p>
                                        <p class="text-2xl font-bold">\${requestedAmount.toLocaleString('ar-SA')}</p>
                                        <p class="text-xs opacity-75">ريال</p>
                                    </div>
                                    <div class="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 text-center">
                                        <i class="fas fa-credit-card text-3xl mb-2 opacity-80"></i>
                                        <p class="text-sm opacity-90 mb-1">الالتزامات</p>
                                        <p class="text-2xl font-bold">\${obligations.toLocaleString('ar-SA')}</p>
                                        <p class="text-xs opacity-75">ريال</p>
                                    </div>
                                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center">
                                        <i class="fas fa-wallet text-3xl mb-2 opacity-80"></i>
                                        <p class="text-sm opacity-90 mb-1">الدخل المتاح</p>
                                        <p class="text-2xl font-bold">\${availableIncome.toLocaleString('ar-SA')}</p>
                                        <p class="text-xs opacity-75">ريال</p>
                                    </div>
                                </div>
                                
                                <!-- Best Offer Section -->
                                \${bestOffer ? \`
                                <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-xl p-6 mb-6">
                                    <div class="flex items-center gap-3 mb-4">
                                        <div class="bg-yellow-500 text-white rounded-full p-3">
                                            <i class="fas fa-trophy text-2xl"></i>
                                        </div>
                                        <div>
                                            <h3 class="text-2xl font-bold text-yellow-800">أفضل عرض مقترح</h3>
                                            <p class="text-yellow-700">\${bestOffer.bank_name}</p>
                                        </div>
                                    </div>
                                    
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div class="bg-white rounded-lg p-4 border-2 border-yellow-300">
                                            <p class="text-sm text-gray-600 mb-1">القسط الشهري</p>
                                            <p class="text-2xl font-bold text-yellow-700">\${bestOffer.monthly_payment.toLocaleString('ar-SA', {maximumFractionDigits: 2})}</p>
                                            <p class="text-xs text-gray-500">ريال / شهر</p>
                                        </div>
                                        <div class="bg-white rounded-lg p-4">
                                            <p class="text-sm text-gray-600 mb-1">نسبة الربح</p>
                                            <p class="text-xl font-bold text-gray-800">\${bestOffer.profit_rate}%</p>
                                            <p class="text-xs text-gray-500">سنوياً</p>
                                        </div>
                                        <div class="bg-white rounded-lg p-4">
                                            <p class="text-sm text-gray-600 mb-1">رسوم إدارية</p>
                                            <p class="text-xl font-bold text-gray-800">\${bestOffer.admin_fee}%</p>
                                            <p class="text-xs text-gray-500">من المبلغ</p>
                                        </div>
                                        <div class="bg-white rounded-lg p-4">
                                            <p class="text-sm text-gray-600 mb-1">إجمالي المبلغ</p>
                                            <p class="text-xl font-bold text-gray-800">\${bestOffer.total_amount.toLocaleString('ar-SA', {maximumFractionDigits: 0})}</p>
                                            <p class="text-xs text-gray-500">ريال</p>
                                        </div>
                                    </div>
                                    
                                    <div class="mt-4 p-4 bg-white rounded-lg">
                                        <div class="flex items-center justify-between mb-2">
                                            <span class="text-gray-700">إجمالي الربح والرسوم:</span>
                                            <span class="text-xl font-bold text-red-600">\${bestOffer.total_profit.toLocaleString('ar-SA', {maximumFractionDigits: 0})} ريال</span>
                                        </div>
                                        <div class="flex items-center justify-between">
                                            <span class="text-gray-700">الحالة:</span>
                                            <span class="px-3 py-1 rounded-full text-sm font-bold \${bestOffer.is_affordable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                                                \${bestOffer.is_affordable ? '✓ مناسب للعميل' : '✗ يتجاوز القدرة الشرائية'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                \` : '<div class="text-center text-gray-500 py-8">لا توجد عروض متاحة</div>'}
                                
                                <!-- All Offers Comparison -->
                                \${offers.length > 1 ? \`
                                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div class="bg-gray-100 px-6 py-4 border-b">
                                        <h3 class="text-xl font-bold text-gray-800">
                                            <i class="fas fa-chart-bar ml-2"></i>
                                            مقارنة جميع العروض
                                        </h3>
                                    </div>
                                    <div class="overflow-x-auto">
                                        <table class="w-full">
                                            <thead class="bg-gray-50">
                                                <tr>
                                                    <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">البنك</th>
                                                    <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">القسط الشهري</th>
                                                    <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">نسبة الربح</th>
                                                    <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">الرسوم</th>
                                                    <th class="px-4 py-3 text-right text-sm font-bold text-gray-700">الإجمالي</th>
                                                    <th class="px-4 py-3 text-center text-sm font-bold text-gray-700">الحالة</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                \${offers.map((offer, idx) => \`
                                                    <tr class="border-t hover:bg-gray-50 \${offer.bank_id === bestOffer?.bank_id ? 'bg-yellow-50' : ''}">
                                                        <td class="px-4 py-3 font-medium \${offer.bank_id === bestOffer?.bank_id ? 'text-yellow-700' : ''}">
                                                            \${offer.bank_id === bestOffer?.bank_id ? '🏆 ' : ''}\${offer.bank_name}
                                                        </td>
                                                        <td class="px-4 py-3 font-bold">\${offer.monthly_payment.toLocaleString('ar-SA', {maximumFractionDigits: 2})} ريال</td>
                                                        <td class="px-4 py-3">\${offer.profit_rate}%</td>
                                                        <td class="px-4 py-3">\${offer.admin_fee}%</td>
                                                        <td class="px-4 py-3 font-medium">\${offer.total_amount.toLocaleString('ar-SA', {maximumFractionDigits: 0})} ريال</td>
                                                        <td class="px-4 py-3 text-center">
                                                            <span class="px-2 py-1 rounded-full text-xs font-bold \${offer.is_affordable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                                                                \${offer.is_affordable ? '✓ مناسب' : '✗ غير مناسب'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                \`).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                \` : ''}
                                
                                <!-- Action Buttons -->
                                <div class="flex justify-end gap-3 mt-6">
                                    <button onclick="window.print()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-bold">
                                        <i class="fas fa-print ml-2"></i>
                                        طباعة
                                    </button>
                                    <button onclick="this.closest('.fixed').remove()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold">
                                        <i class="fas fa-times ml-2"></i>
                                        إغلاق
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
                
                document.body.insertAdjacentHTML('beforeend', modalContent);
                
            } catch (error) {
                console.error('Error loading financing details:', error);
                alert('❌ حدث خطأ أثناء تحميل التفاصيل التمويلية');
            }
        }
        
        window.editCustomer = function(id) {
            window.location.href = '/admin/customers/' + id + '/edit';
        }
        
        window.deleteCustomer = async function(id) {
            if (!confirm('هل أنت متأكد من حذف هذا العميل؟\\n\\nسيتم حذف جميع الطلبات المرتبطة به.')) {
                return;
            }
            
            try {
                const response = await axios.delete(\`/api/customers/\${id}\`);
                if (response.data.success) {
                    alert('✅ ' + response.data.message);
                    loadCustomers();
                } else {
                    alert('❌ خطأ: ' + response.data.error);
                }
            } catch (error) {
                console.error('Error deleting customer:', error);
                alert('❌ حدث خطأ أثناء الحذف');
            }
        }
        
        window.viewRequest = async function(id) {
            try {
                const response = await axios.get('/api/financing-requests');
                if (response.data.success) {
                    const request = response.data.data.find(r => r.id === id);
                    if (request) {
                        const statusColors = {
                            'pending': 'bg-yellow-100 text-yellow-800',
                            'approved': 'bg-green-100 text-green-800',
                            'rejected': 'bg-red-100 text-red-800'
                        };
                        const statusText = {
                            'pending': 'قيد الانتظار',
                            'approved': 'مقبول',
                            'rejected': 'مرفوض'
                        };
                        
                        const detailsHtml = \`
                            <div class="bg-gray-50 rounded-lg p-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p class="text-sm text-gray-600">رقم الطلب</p>
                                        <p class="font-bold text-lg">#\${request.id}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">الحالة</p>
                                        <span class="\${statusColors[request.status]} px-3 py-1 rounded text-sm font-bold inline-block mt-1">
                                            \${statusText[request.status]}
                                        </span>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">اسم العميل</p>
                                        <p class="font-medium">\${request.customer_name}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">رقم الجوال</p>
                                        <p class="font-medium">\${request.customer_phone}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">رقم الهوية</p>
                                        <p class="font-medium">\${request.national_id || '-'}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">جهة العمل</p>
                                        <p class="font-medium">\${request.employer_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">المسمى الوظيفي</p>
                                        <p class="font-medium">\${request.job_title || '-'}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">البنك المختار</p>
                                        <p class="font-medium">\${request.selected_bank_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">نوع التمويل</p>
                                        <p class="font-medium">\${request.financing_type_name || '-'}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">المبلغ المطلوب</p>
                                        <p class="font-bold text-green-600 text-lg">\${Number(request.requested_amount).toLocaleString('ar-SA')} ريال</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">مدة التمويل</p>
                                        <p class="font-medium">\${request.duration_months} شهر</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">الراتب عند الطلب</p>
                                        <p class="font-medium">\${Number(request.salary_at_request).toLocaleString('ar-SA')} ريال</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">الالتزامات الشهرية</p>
                                        <p class="font-medium">\${Number(request.monthly_obligations || 0).toLocaleString('ar-SA')} ريال</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">القسط الشهري</p>
                                        <p class="font-medium">\${Number(request.monthly_payment || 0).toLocaleString('ar-SA')} ريال</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">تاريخ الطلب</p>
                                        <p class="font-medium">\${new Date(request.created_at).toLocaleDateString('ar-SA')}</p>
                                    </div>
                                </div>
                                \${request.notes ? \`
                                    <div class="mt-4 pt-4 border-t">
                                        <p class="text-sm text-gray-600 mb-2">ملاحظات</p>
                                        <p class="text-gray-800">\${request.notes}</p>
                                    </div>
                                \` : ''}
                                
                                <!-- Attachments Section -->
                                <div class="mt-4 pt-4 border-t">
                                    <p class="text-sm text-gray-700 font-semibold mb-3">
                                        <i class="fas fa-paperclip ml-1"></i>
                                        المرفقات
                                    </p>
                                    \${(() => {
                                        const legacyFields = [
                                          { key: 'identity_attachment_url', label: 'ملف الهوية' },
                                          { key: 'signature_attachment_url', label: 'ملف السمة' },
                                          { key: 'salary_profile_attachment_url', label: 'ملف تعريف الراتب' },
                                          { key: 'gosi_attachment_url', label: 'ملف التأمينات الاجتماعية' },
                                          { key: 'tax_exemption_attachment_url', label: 'شهادة الإعفاء الضريبي' },
                                          { key: 'additional_1_attachment_url', label: 'مستند إضافي 1' },
                                          { key: 'additional_2_attachment_url', label: 'مستند إضافي 2' },
                                          { key: 'additional_3_attachment_url', label: 'مستند إضافي 3' }
                                        ];
                                        const normalizeAttUrl = (url) => {
                                          const raw = String(url || '').trim();
                                          if (!raw || raw === 'null') return null;
                                          const prefix = '/api/attachments/view/';
                                          if (raw.startsWith(prefix)) return raw;
                                          const idx = raw.indexOf(prefix);
                                          if (idx >= 0) return raw.slice(idx);
                                          if (/^(customers\\/\\d+\\/|temp\\/|\\d+\\/)/.test(raw)) return prefix + raw.replace(/^\\/+/, '');
                                          return null;
                                        };
                                        let docs = [];
                                        try {
                                          const raw = request.attachments_json;
                                          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                          if (Array.isArray(parsed)) {
                                            parsed.forEach((entry) => {
                                              if (!entry) return;
                                              const label = String(entry.label || '').trim();
                                              const url = String(entry.url || '').trim();
                                              const normalized = normalizeAttUrl(url);
                                              if (label && normalized) docs.push({ label, url: normalized });
                                            });
                                          }
                                        } catch (e) {}
                                        if (!docs.length) {
                                          docs = legacyFields
                                            .map((f) => {
                                              const url = request[f.key];
                                              const normalized = normalizeAttUrl(url);
                                              return normalized ? { label: f.label, url: normalized } : null;
                                            })
                                            .filter(Boolean);
                                        }
                                        if (docs.length === 0) return '';
                                        return '<div class="grid grid-cols-1 md:grid-cols-2 gap-3">' + docs.map((d) => \`
                                          <a href="\${d.url}" target="_blank"
                                             class="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
                                              <i class="fas fa-file-alt text-blue-600"></i>
                                              <span class="text-sm text-blue-800 font-medium">\${d.label}</span>
                                              <i class="fas fa-download text-blue-600 mr-auto"></i>
                                          </a>
                                        \`).join('') + '</div>';
                                    })()}
                                </div>
                            </div>
                        \`;
                        
                        document.getElementById('requestDetails').innerHTML = detailsHtml;
                        openModal('viewRequestModal');
                    }
                }
            } catch (error) {
                console.error('Error loading request:', error);
                alert('❌ حدث خطأ أثناء تحميل بيانات الطلب');
            }
        }
        
        window.deleteRequest = async function(e, id) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }
            if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
                return false;
            }
            
            try {
                const response = await axios.delete(\`/api/financing-requests/\${id}\`);
                if (response.data.success) {
                    alert('✅ ' + response.data.message);
                    loadFinancingRequests();
                    loadDashboardStats(); // Refresh stats
                } else {
                    alert('❌ خطأ: ' + response.data.error);
                }
            } catch (error) {
                console.error('Error deleting request:', error);
                alert('❌ حدث خطأ أثناء الحذف: ' + (error.response?.data?.error || error.message || 'Unknown error'));
            }
        }
        
        window.updateStatus = async function(id) {
            document.getElementById('requestId').value = id;
            
            // Load current request data
            try {
                const response = await axios.get('/api/financing-requests');
                if (response.data.success) {
                    const request = response.data.data.find(r => r.id === id);
                    if (request) {
                        document.querySelector('#updateStatusForm select[name="status"]').value = request.status;
                        document.querySelector('#updateStatusForm textarea[name="notes"]').value = request.notes || '';
                    }
                }
            } catch (error) {
                console.error('Error loading request:', error);
            }
            
            openModal('updateStatusModal');
        }
        
        // Load Banks
        async function loadBanks() {
            try {
                const response = await axios.get('/api/banks');
                if (response.data.success) {
                    const banks = response.data.data;
                    const tbody = document.getElementById('banksTable');
                    
                    if (banks.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">لا توجد بنوك</td></tr>';
                        return;
                    }
                    
                    tbody.innerHTML = banks.map((bank, index) => \`
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-4 py-3">\${index + 1}</td>
                            <td class="px-4 py-3 font-medium">\${bank.bank_name}</td>
                            <td class="px-4 py-3">\${bank.bank_code || '-'}</td>
                            <td class="px-4 py-3">
                                <span class="\${bank.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-2 py-1 rounded text-xs">
                                    \${bank.is_active ? 'نشط' : 'غير نشط'}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <button onclick="viewBank(\${bank.id})" class="text-blue-600 hover:text-blue-800 ml-2" title="عرض">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="editBank(\${bank.id})" class="text-green-600 hover:text-green-800 ml-2" title="تعديل">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteBank(\${bank.id})" class="text-red-600 hover:text-red-800" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    \`).join('');
                }
            } catch (error) {
                console.error('Error loading banks:', error);
            }
        }
        
        // Load Rates
        async function loadRates() {
            try {
                const response = await axios.get('/api/rates');
                if (response.data.success) {
                    const rates = response.data.data;
                    const tbody = document.getElementById('ratesTable');
                    
                    if (rates.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-500">لا توجد نسب</td></tr>';
                        return;
                    }
                    
                    tbody.innerHTML = rates.map((rate, index) => \`
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-4 py-3">\${index + 1}</td>
                            <td class="px-4 py-3 font-medium">\${rate.bank_name || '-'}</td>
                            <td class="px-4 py-3">\${rate.financing_type_name || '-'}</td>
                            <td class="px-4 py-3 font-bold text-green-600">\${rate.rate}%</td>
                            <td class="px-4 py-3 text-sm">\${rate.min_amount.toLocaleString('ar-SA')} - \${rate.max_amount.toLocaleString('ar-SA')}</td>
                            <td class="px-4 py-3 text-sm">\${rate.min_salary.toLocaleString('ar-SA')} - \${rate.max_salary.toLocaleString('ar-SA')}</td>
                            <td class="px-4 py-3">
                                <span class="\${rate.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-2 py-1 rounded text-xs">
                                    \${rate.is_active ? 'نشط' : 'غير نشط'}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <button onclick="viewRate(\${rate.id})" class="text-blue-600 hover:text-blue-800 ml-2" title="عرض">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="editRate(\${rate.id})" class="text-green-600 hover:text-green-800 ml-2" title="تعديل">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteRate(\${rate.id})" class="text-red-600 hover:text-red-800" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    \`).join('');
                }
            } catch (error) {
                console.error('Error loading rates:', error);
            }
        }
        
        // Bank actions
        window.addBank = function() {
            openModal('addBankModal');
        }
        
        window.viewBank = function(id) {
            alert('عرض البنك رقم: ' + id);
        }
        
        window.editBank = function(id) {
            alert('تعديل البنك رقم: ' + id);
        }
        
        window.deleteBank = async function(id) {
            if (!confirm('هل أنت متأكد من حذف هذا البنك؟\\n\\nسيتم حذف جميع النسب المرتبطة به.')) {
                return;
            }
            
            try {
                const response = await axios.delete(\`/api/banks/\${id}\`);
                if (response.data.success) {
                    alert('✅ ' + response.data.message);
                    loadBanks();
                } else {
                    alert('❌ خطأ: ' + response.data.error);
                }
            } catch (error) {
                console.error('Error deleting bank:', error);
                alert('❌ حدث خطأ أثناء الحذف');
            }
        }
        
        // Rate actions
        window.addRate = async function() {
            // Load banks and financing types for the dropdown
            try {
                const [banksRes, typesRes] = await Promise.all([
                    axios.get('/api/banks'),
                    axios.get('/api/financing-types')
                ]);
                
                if (banksRes.data.success && typesRes.data.success) {
                    const bankSelect = document.getElementById('rateBankSelect');
                    const typeSelect = document.getElementById('rateFinancingTypeSelect');
                    
                    bankSelect.innerHTML = '<option value="">اختر البنك</option>' +
                        banksRes.data.data.map(b => \`<option value="\${b.id}">\${b.bank_name}</option>\`).join('');
                    
                    typeSelect.innerHTML = '<option value="">اختر نوع التمويل</option>' +
                        typesRes.data.data.map(t => \`<option value="\${t.id}">\${t.type_name}</option>\`).join('');
                    
                    openModal('addRateModal');
                }
            } catch (error) {
                console.error('Error loading data:', error);
                alert('❌ حدث خطأ أثناء تحميل البيانات');
            }
        }
        
        window.viewRate = function(id) {
            alert('عرض النسبة رقم: ' + id);
        }
        
        window.editRate = function(id) {
            alert('تعديل النسبة رقم: ' + id);
        }
        
        window.deleteRate = async function(id) {
            if (!confirm('هل أنت متأكد من حذف هذه النسبة؟')) {
                return;
            }
            
            try {
                const response = await axios.delete(\`/api/rates/\${id}\`);
                if (response.data.success) {
                    alert('✅ ' + response.data.message);
                    loadRates();
                } else {
                    alert('❌ خطأ: ' + response.data.error);
                }
            } catch (error) {
                console.error('Error deleting rate:', error);
                alert('❌ حدث خطأ أثناء الحذف');
            }
        }

        // Load Users
        async function loadUsers() {
            try {
                const response = await axios.get('/api/users');
                if (response.data.success) {
                    const users = response.data.data;
                    const tbody = document.getElementById('usersTable');
                    
                    if (users.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-500">لا توجد مستخدمين</td></tr>';
                        return;
                    }
                    
                    tbody.innerHTML = users.map((user, index) => \`
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-4 py-3">\${index + 1}</td>
                            <td class="px-4 py-3 font-medium"><span class="truncate-cell">\${user.full_name}</span></td>
                            <td class="px-4 py-3">\${user.email}</td>
                            <td class="px-4 py-3">\${user.username}</td>
                            <td class="px-4 py-3">
                                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                    \${user.role_name || '-'}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <button onclick="managePermissions(\${user.id}, '\${user.full_name}', \${user.role_id})" 
                                        class="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded text-xs font-medium" 
                                        title="إدارة الصلاحيات">
                                    <i class="fas fa-shield-alt ml-1"></i>
                                    \${user.permissions_count || 0} صلاحية
                                </button>
                            </td>
                            <td class="px-4 py-3">
                                <span class="\${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-2 py-1 rounded text-xs">
                                    \${user.is_active ? 'نشط' : 'غير نشط'}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <button onclick="viewUser(\${user.id})" class="text-blue-600 hover:text-blue-800 ml-2" title="عرض">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="editUser(\${user.id})" class="text-green-600 hover:text-green-800 ml-2" title="تعديل">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteUser(\${user.id})" class="text-red-600 hover:text-red-800" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    \`).join('');
                }
            } catch (error) {
                console.error('Error loading users:', error);
            }
        }
        
        // Manage User Permissions
        window.managePermissions = async function(userId, userName, roleId) {
            document.getElementById('permissionsUserName').textContent = userName;
            document.getElementById('permissionsRoleId').value = roleId;
            
            try {
                // Load all permissions grouped by category
                const permissionsRes = await axios.get('/api/permissions/by-category');
                // Load user's current permissions
                const userPermRes = await axios.get(\`/api/roles/\${roleId}/permissions\`);
                
                if (permissionsRes.data.success && userPermRes.data.success) {
                    const allPermissions = permissionsRes.data.data;
                    const userPermissions = userPermRes.data.data.map(p => p.id);
                    
                    const categoryNames = {
                        'dashboard': 'لوحة التحكم',
                        'customers': 'العملاء',
                        'requests': 'طلبات التمويل',
                        'banks': 'البنوك',
                        'rates': 'النسب التمويلية',
                        'packages': 'الباقات',
                        'subscriptions': 'الاشتراكات',
                        'users': 'المستخدمين',
                        'calculator': 'الحاسبة',
                        'reports': 'التقارير'
                    };
                    
                    const content = Object.keys(allPermissions).map(category => {
                        const permissions = allPermissions[category];
                        return \`
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h3 class="font-bold text-lg mb-3 text-gray-800">
                                    <i class="fas fa-folder ml-2"></i>
                                    \${categoryNames[category] || category}
                                </h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    \${permissions.map(perm => \`
                                        <label class="flex items-center space-x-reverse space-x-2 p-2 hover:bg-white rounded cursor-pointer">
                                            <input type="checkbox" 
                                                   class="permission-checkbox rounded text-purple-600 focus:ring-purple-500" 
                                                   value="\${perm.id}"
                                                   \${userPermissions.includes(perm.id) ? 'checked' : ''}>
                                            <span class="text-sm text-gray-700">\${perm.permission_name}</span>
                                        </label>
                                    \`).join('')}
                                </div>
                            </div>
                        \`;
                    }).join('');
                    
                    document.getElementById('permissionsContent').innerHTML = content;
                    openModal('managePermissionsModal');
                }
            } catch (error) {
                console.error('Error loading permissions:', error);
                alert('❌ حدث خطأ أثناء تحميل الصلاحيات');
            }
        }
        
        // Save Permissions
        window.savePermissions = async function() {
            const roleId = document.getElementById('permissionsRoleId').value;
            const checkboxes = document.querySelectorAll('.permission-checkbox:checked');
            const permissionIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
            
            try {
                const response = await axios.put(\`/api/roles/\${roleId}/permissions\`, {
                    permission_ids: permissionIds
                });
                
                if (response.data.success) {
                    alert('✅ تم تحديث الصلاحيات بنجاح');
                    closeModal('managePermissionsModal');
                    loadUsers();
                } else {
                    alert('❌ خطأ: ' + response.data.error);
                }
            } catch (error) {
                console.error('Error saving permissions:', error);
                alert('❌ حدث خطأ أثناء حفظ الصلاحيات');
            }
        }
        
        // Edit User
        window.editUser = async function(id) {
            try {
                // Load roles first
                const rolesResponse = await axios.get('/api/roles');
                if (rolesResponse.data.success) {
                    const roles = rolesResponse.data.data;
                    const roleSelect = document.getElementById('editUserRole');
                    roleSelect.innerHTML = roles.map(role => 
                        \`<option value="\${role.id}">\${role.description}</option>\`
                    ).join('');
                }
                
                // Load user data
                const response = await axios.get('/api/users');
                if (response.data.success) {
                    const user = response.data.data.find(u => u.id === id);
                    if (user) {
                        document.getElementById('editUserId').value = user.id;
                        document.getElementById('editUserFullName').value = user.full_name;
                        document.getElementById('editUserEmail').value = user.email;
                        document.getElementById('editUserPhone').value = user.phone || '';
                        document.getElementById('editUserRole').value = user.role_id;
                        document.getElementById('editUserActive').value = user.is_active;
                        
                        openModal('editUserModal');
                    }
                }
            } catch (error) {
                console.error('Error loading user:', error);
                alert('❌ حدث خطأ أثناء تحميل بيانات المستخدم');
            }
        }
        
        window.viewUser = function(id) {
            alert('عرض تفاصيل المستخدم رقم: ' + id);
        }
        
        // Load Subscriptions
        async function loadSubscriptions() {
            try {
                const response = await axios.get('/api/subscriptions');
                if (response.data.success) {
                    const subscriptions = response.data.data;
                    const tbody = document.getElementById('subscriptionsTable');
                    
                    if (subscriptions.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">لا توجد اشتراكات</td></tr>';
                        return;
                    }
                    
                    tbody.innerHTML = subscriptions.map((sub, index) => {
                        const statusColors = {
                            'active': 'bg-green-100 text-green-800',
                            'expired': 'bg-red-100 text-red-800',
                            'cancelled': 'bg-gray-100 text-gray-800'
                        };
                        const statusText = {
                            'active': 'نشط',
                            'expired': 'منتهي',
                            'cancelled': 'ملغي'
                        };
                        
                        return \`
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-3">\${index + 1}</td>
                                <td class="px-4 py-3 font-medium">\${sub.company_name}</td>
                                <td class="px-4 py-3">\${sub.package_name || '-'}</td>
                                <td class="px-4 py-3">\${sub.start_date}</td>
                                <td class="px-4 py-3">\${sub.end_date}</td>
                                <td class="px-4 py-3">
                                    <span class="\${statusColors[sub.status]} px-2 py-1 rounded text-xs">
                                        \${statusText[sub.status] || sub.status}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <button onclick="viewSubscription(\${sub.id})" class="text-blue-600 hover:text-blue-800 ml-2" title="عرض">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button onclick="editSubscription(\${sub.id})" class="text-green-600 hover:text-green-800 ml-2" title="تعديل">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteSubscription(\${sub.id})" class="text-red-600 hover:text-red-800" title="حذف">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        \`;
                    }).join('');
                }
            } catch (error) {
                console.error('Error loading subscriptions:', error);
            }
        }
        
        // Load Packages
        async function loadPackages() {
            try {
                const response = await axios.get('/api/packages');
                if (response.data.success) {
                    const packages = response.data.data;
                    const tbody = document.getElementById('packagesTable');
                    
                    if (packages.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">لا توجد باقات</td></tr>';
                        return;
                    }
                    
                    tbody.innerHTML = packages.map((pkg, index) => \`
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-4 py-3">\${index + 1}</td>
                            <td class="px-4 py-3 font-medium">\${pkg.package_name}</td>
                            <td class="px-4 py-3 font-bold text-green-600">\${pkg.price.toLocaleString('ar-SA')} ريال</td>
                            <td class="px-4 py-3">\${pkg.duration_months} شهر</td>
                            <td class="px-4 py-3">\${pkg.max_calculations || 'غير محدود'}</td>
                            <td class="px-4 py-3">
                                <span class="\${pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} px-2 py-1 rounded text-xs">
                                    \${pkg.is_active ? 'نشط' : 'غير نشط'}
                                </span>
                            </td>
                            <td class="px-4 py-3">
                                <button onclick="viewPackage(\${pkg.id})" class="text-blue-600 hover:text-blue-800 ml-2" title="عرض">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="editPackage(\${pkg.id})" class="text-green-600 hover:text-green-800 ml-2" title="تعديل">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deletePackage(\${pkg.id})" class="text-red-600 hover:text-red-800" title="حذف">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    \`).join('');
                }
            } catch (error) {
                console.error('Error loading packages:', error);
            }
        }
        
        // User actions
        window.addUser = function() { alert('إضافة مستخدم جديد - قيد التطوير'); }
        // viewUser already converted as window.viewUser
        // editUser already converted as window.editUser
        window.deleteUser = async function(id) {
            if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
            try {
                const response = await axios.delete(\`/api/users/\${id}\`);
                if (response.data.success) {
                    alert('✅ ' + response.data.message);
                    loadUsers();
                } else {
                    alert('❌ خطأ: ' + response.data.error);
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('❌ حدث خطأ أثناء الحذف');
            }
        }
        
        // Subscription actions
        window.addSubscription = function() { alert('إضافة اشتراك جديد - قيد التطوير'); }
        window.viewSubscription = function(id) { alert('عرض الاشتراك رقم: ' + id); }
        window.editSubscription = function(id) { alert('تعديل الاشتراك رقم: ' + id); }
        window.deleteSubscription = async function(id) {
            if (!confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) return;
            try {
                const response = await axios.delete(\`/api/subscriptions/\${id}\`);
                if (response.data.success) {
                    alert('✅ ' + response.data.message);
                    loadSubscriptions();
                } else {
                    alert('❌ خطأ: ' + response.data.error);
                }
            } catch (error) {
                console.error('Error deleting subscription:', error);
                alert('❌ حدث خطأ أثناء الحذف');
            }
        }
        
        // Package actions
        window.addPackage = function() {
            openModal('addPackageModal');
        }
        window.viewPackage = function(id) { alert('عرض الباقة رقم: ' + id); }
        window.editPackage = function(id) { alert('تعديل الباقة رقم: ' + id); }
        window.deletePackage = async function(id) {
            if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
            try {
                const response = await axios.delete(\`/api/packages/\${id}\`);
                if (response.data.success) {
                    alert('✅ ' + response.data.message);
                    loadPackages();
                } else {
                    alert('❌ خطأ: ' + response.data.error);
                }
            } catch (error) {
                console.error('Error deleting package:', error);
                alert('❌ حدث خطأ أثناء الحذف');
            }
        }
        
        // Load Subscription Requests
        async function loadSubscriptionRequests() {
            try {
                const response = await axios.get('/api/subscription-requests');
                if (response.data.success) {
                    const requests = response.data.data;
                    const tbody = document.getElementById('subscriptionRequestsTable');
                    
                    if (requests.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-gray-500">لا توجد طلبات اشتراك</td></tr>';
                        return;
                    }
                    
                    tbody.innerHTML = requests.map((req, index) => {
                        const statusColors = {
                            'pending': 'bg-yellow-100 text-yellow-800',
                            'approved': 'bg-green-100 text-green-800',
                            'rejected': 'bg-red-100 text-red-800'
                        };
                        const statusText = {
                            'pending': 'قيد الانتظار',
                            'approved': 'مقبول',
                            'rejected': 'مرفوض'
                        };
                        
                        return \`
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-3">\${index + 1}</td>
                                <td class="px-4 py-3 font-medium">\${req.company_name}</td>
                                <td class="px-4 py-3">\${req.contact_name}</td>
                                <td class="px-4 py-3">\${req.email}</td>
                                <td class="px-4 py-3">\${req.phone}</td>
                                <td class="px-4 py-3">\${req.package_name || '-'}</td>
                                <td class="px-4 py-3">
                                    <span class="\${statusColors[req.status]} px-2 py-1 rounded text-xs">
                                        \${statusText[req.status] || req.status}
                                    </span>
                                </td>
                                <td class="px-4 py-3">
                                    <button onclick="viewSubscriptionRequest(\${req.id})" class="text-blue-600 hover:text-blue-800 ml-2" title="عرض">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button onclick="updateSubscriptionRequestStatus(\${req.id})" class="text-green-600 hover:text-green-800 ml-2" title="تحديث الحالة">
                                        <i class="fas fa-check-circle"></i>
                                    </button>
                                    <button onclick="deleteSubscriptionRequest(\${req.id})" class="text-red-600 hover:text-red-800" title="حذف">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        \`;
                    }).join('');
                }
            } catch (error) {
                console.error('Error loading subscription requests:', error);
            }
        }
        
        // Subscription Request actions
        window.viewSubscriptionRequest = function(id) { alert('عرض طلب الاشتراك رقم: ' + id); }
        window.updateSubscriptionRequestStatus = function(id) { alert('تحديث حالة طلب الاشتراك رقم: ' + id); }
        window.deleteSubscriptionRequest = async function(id) {
            if (!confirm('هل أنت متأكد من حذف طلب الاشتراك هذا؟')) return;
            try {
                const response = await axios.delete(\`/api/subscription-requests/\${id}\`);
                if (response.data.success) {
                    alert('✅ ' + response.data.message);
                    loadSubscriptionRequests();
                } else {
                    alert('❌ خطأ: ' + response.data.error);
                }
            } catch (error) {
                console.error('Error deleting subscription request:', error);
                alert('❌ حدث خطأ أثناء الحذف');
            }
        }
        
        // Modal Management
        window.openModal = function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.remove('hidden');
            }
        }
        
        window.closeModal = function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
                modal.classList.add('hidden');
                const form = modal.querySelector('form');
                if (form) form.reset();
            }
        }
        
        // Form Submissions
        document.addEventListener('DOMContentLoaded', async () => {
            const addCustomerForm = document.getElementById('addCustomerForm');
            if (addCustomerForm) {
                let modalObligationTypeNames = [];
                try {
                    let q = '';
                    const userStr = localStorage.getItem('userData') || localStorage.getItem('user');
                    if (userStr) {
                        const u = JSON.parse(userStr);
                        if (u.tenant_id) q = '?tenant_id=' + encodeURIComponent(String(u.tenant_id));
                    }
                    const otRes = await axios.get('/api/obligation-types' + q);
                    if (otRes.data && otRes.data.success && Array.isArray(otRes.data.data)) {
                        modalObligationTypeNames = otRes.data.data.map(function (x) { return x.type_name; });
                    }
                } catch (e) {
                    console.warn('obligation-types:', e);
                }
                if (!modalObligationTypeNames.length) {
                    modalObligationTypeNames = ['قرض شخصي', 'قرض عقاري', 'تمويل سيارة قائم', 'بطاقة ائتمان', 'تمويل تعاوني', 'تقسيط / شراء بالأقساط', 'سلفة راتب', 'التزامات أخرى'];
                }
                (function setupDobToggle() {
                    const g = document.getElementById('modal_date_of_birth_gregorian');
                    const h = document.getElementById('modal_date_of_birth_hijri');
                    const type = document.getElementById('modal_dob_calendar_type');
                    const hidden = document.getElementById('modal_date_of_birth');
                    const btnG = document.getElementById('modal_dob_toggle_gregorian');
                    const btnH = document.getElementById('modal_dob_toggle_hijri');
                    if (!g || !h || !type || !hidden || !btnG || !btnH) return;
                    function setGregorian() {
                        g.style.display = ''; h.style.display = 'none'; type.value = 'gregorian';
                        hidden.value = g.value || ''; btnG.className = 'px-2 py-1.5 text-sm font-medium rounded-r-lg bg-blue-600 text-white'; btnH.className = 'px-2 py-1.5 text-sm font-medium rounded-l-lg text-gray-600 hover:bg-gray-100';
                    }
                    function setHijri() {
                        g.style.display = 'none'; h.style.display = ''; type.value = 'hijri';
                        hidden.value = h.value || ''; btnG.className = 'px-2 py-1.5 text-sm font-medium rounded-r-lg text-gray-600 hover:bg-gray-100'; btnH.className = 'px-2 py-1.5 text-sm font-medium rounded-l-lg bg-blue-600 text-white';
                    }
                    btnG.onclick = setGregorian; btnH.onclick = setHijri;
                    g.onchange = function() { if (type.value === 'gregorian') hidden.value = g.value || ''; };
                    h.oninput = h.onchange = function() { if (type.value === 'hijri') hidden.value = h.value || ''; };
                })();
                (function setupJobTypeToggle() {
                    const jobTypeEl = document.getElementById('modal_job_type');
                    const civilianWrap = document.getElementById('modal_job_title_civilian_wrap');
                    const militaryWrap = document.getElementById('modal_military_rank_wrap');
                    const jobTitleInput = document.getElementById('modal_job_title_input');
                    const militarySelect = document.getElementById('modal_military_rank_select');
                    if (!jobTypeEl || !civilianWrap || !militaryWrap) return;
                    function update() {
                        const isMilitary = jobTypeEl.value === 'military';
                        civilianWrap.style.display = isMilitary ? 'none' : 'block';
                        militaryWrap.style.display = isMilitary ? 'block' : 'none';
                        if (jobTitleInput) jobTitleInput.disabled = isMilitary;
                        if (militarySelect) militarySelect.disabled = !isMilitary;
                    }
                    jobTypeEl.addEventListener('change', update);
                    update();
                })();
                (function setupModalObligations() {
                    const tbody = document.getElementById('modal_obligations_tbody');
                    const addBtn = document.getElementById('modal_add_obligation_row');
                    const hidden = document.getElementById('modal_obligations_json');
                    if (!tbody || !addBtn || !hidden) return;
                    const OBLIG_CUSTOM = '__custom__';
                    function escAttr(s) {
                        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
                    }
                    function buildModalObligDropdownCell(selectedValue, optionNames, selectClass, customClass, emptyLabel, placeholder) {
                        const sel = selectedValue == null ? '' : String(selectedValue).trim();
                        const isKnown = sel && optionNames.indexOf(sel) >= 0;
                        const isCustom = sel && !isKnown;
                        let opts = '<option value="">' + emptyLabel + '</option>';
                        optionNames.forEach(function (name) {
                            opts += '<option value="' + escAttr(name) + '"' + (sel === name ? ' selected' : '') + '>' + escAttr(name) + '</option>';
                        });
                        opts += '<option value="' + OBLIG_CUSTOM + '"' + (isCustom ? ' selected' : '') + '>أخرى (إدخال يدوي)</option>';
                        const customHidden = isCustom ? '' : ' hidden';
                        return '<div class="space-y-1">' +
                            '<select class="' + selectClass + ' w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">' + opts + '</select>' +
                            '<input type="text" class="' + customClass + customHidden + ' w-full px-2 py-1 border border-gray-300 rounded-lg text-sm" placeholder="' + escAttr(placeholder) + '" maxlength="200" value="' + (isCustom ? escAttr(sel) : '') + '">' +
                            '</div>';
                    }
                    function buildModalObligTypeCell(selectedValue) {
                        return buildModalObligDropdownCell(selectedValue, modalObligationTypeNames, 'modal-oblig-type', 'modal-oblig-type-custom', '— اختر نوع الالتزام —', 'أدخل نوع الالتزام');
                    }
                    function wireModalObligDropdownRow(tr, selectClass, customClass) {
                        const sel = tr.querySelector('.' + selectClass);
                        const custom = tr.querySelector('.' + customClass);
                        if (!sel || !custom) return;
                        function sync() {
                            if (sel.value === OBLIG_CUSTOM) custom.classList.remove('hidden');
                            else custom.classList.add('hidden');
                        }
                        sel.addEventListener('change', sync);
                        sync();
                    }
                    function wireModalObligRow(tr) {
                        wireModalObligDropdownRow(tr, 'modal-oblig-type', 'modal-oblig-type-custom');
                    }
                    function collectModalObligDropdown(tr, selectClass, customClass) {
                        const sel = tr.querySelector('.' + selectClass);
                        if (!sel) return '';
                        if (sel.value === OBLIG_CUSTOM) {
                            const custom = tr.querySelector('.' + customClass);
                            return custom ? String(custom.value || '').trim() : '';
                        }
                        return String(sel.value || '').trim();
                    }
                    function collectModalObligType(tr) {
                        return collectModalObligDropdown(tr, 'modal-oblig-type', 'modal-oblig-type-custom');
                    }
                    function addRow(data) {
                        data = data || {};
                        const tr = document.createElement('tr');
                        tr.className = 'border-b border-gray-200';
                        tr.innerHTML = '<td class="py-1 px-2">' + buildModalObligTypeCell(data.obligation_type || '') + '</td>' +
                            '<td class="py-1 px-2"><input type="number" class="modal-oblig-total w-full px-2 py-1 border rounded" step="0.01" min="0" placeholder="0"></td>' +
                            '<td class="py-1 px-2"><input type="number" class="modal-oblig-monthly w-full px-2 py-1 border rounded" step="0.01" min="0" placeholder="0"></td>' +
                            '<td class="py-1 px-2"><input type="text" class="modal-oblig-due w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" maxlength="200"></td>' +
                            '<td class="py-1 px-2"><button type="button" class="modal-oblig-remove text-red-600 hover:text-red-800" title="حذف"><i class="fas fa-trash"></i></button></td>';
                        if (data.total_amount != null) tr.querySelector('.modal-oblig-total').value = data.total_amount;
                        if (data.monthly_installment != null) tr.querySelector('.modal-oblig-monthly').value = data.monthly_installment;
                        if (data.due_date) tr.querySelector('.modal-oblig-due').value = data.due_date;
                        wireModalObligRow(tr);
                        tr.querySelector('.modal-oblig-remove').onclick = () => tr.remove();
                        tbody.appendChild(tr);
                    }
                    addBtn.onclick = () => addRow();
                    addRow();
                })();
                addCustomerForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const typeEl = document.getElementById('modal_dob_calendar_type');
                    const hiddenEl = document.getElementById('modal_date_of_birth');
                    if (typeEl && hiddenEl) hiddenEl.value = typeEl.value === 'hijri' ? (document.getElementById('modal_date_of_birth_hijri').value || '') : (document.getElementById('modal_date_of_birth_gregorian').value || '');
                    const jobTypeEl = document.getElementById('modal_job_type');
                    const jobTitleInput = document.getElementById('modal_job_title_input');
                    const militarySelect = document.getElementById('modal_military_rank_select');
                    if (jobTypeEl && jobTypeEl.value === 'military' && militarySelect && jobTitleInput) {
                        jobTitleInput.value = militarySelect.value || '';
                        jobTitleInput.disabled = false;
                    }
                    const obligationsJsonEl = document.getElementById('modal_obligations_json');
                    if (obligationsJsonEl) {
                        const rows = document.querySelectorAll('#modal_obligations_tbody tr');
                        const arr = [];
                        rows.forEach(tr => {
                            const totalEl = tr.querySelector('.modal-oblig-total');
                            const monthlyEl = tr.querySelector('.modal-oblig-monthly');
                            if (!totalEl || !monthlyEl) return;
                            const obligationType = collectModalObligType(tr);
                            const dueEl = tr.querySelector('.modal-oblig-due');
                            const dueDate = dueEl ? String(dueEl.value || '').trim() : '';
                            arr.push({ obligation_type: obligationType, total_amount: parseFloat(totalEl.value) || 0, monthly_installment: parseFloat(monthlyEl.value) || 0, due_date: dueDate || null });
                        });
                        obligationsJsonEl.value = JSON.stringify(arr);
                    }
                    const formData = new FormData(e.target);
                    try {
                        const response = await axios.post('/api/customers', formData, {
                            headers: { 'X-Customer-Form': '1' }
                        });
                        if (response.data.ok) {
                            closeModal('addCustomerModal');
                            loadCustomers();
                        } else {
                            alert('❌ ' + (response.data.message || 'حدث خطأ أثناء الإضافة'));
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('❌ حدث خطأ أثناء الإضافة');
                    }
                });
            }
            
            const addBankForm = document.getElementById('addBankForm');
            if (addBankForm) {
                addBankForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    try {
                        const response = await axios.post('/api/banks', data);
                        if (response.data.success) {
                            alert('✅ تم إضافة البنك بنجاح');
                            closeModal('addBankModal');
                            loadBanks();
                        } else {
                            alert('❌ ' + (response.data.error || 'حدث خطأ أثناء الإضافة'));
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        const msg = error.response?.data?.error || 'حدث خطأ أثناء الإضافة';
                        alert('❌ ' + msg);
                    }
                });
            }
            
            const addRateForm = document.getElementById('addRateForm');
            if (addRateForm) {
                addRateForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    try {
                        const response = await axios.post('/api/rates', data);
                        if (response.data.success) {
                            alert('✅ تم إضافة النسبة بنجاح');
                            closeModal('addRateModal');
                            loadRates();
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('❌ حدث خطأ أثناء الإضافة');
                    }
                });
            }
            
            const addSubscriptionForm = document.getElementById('addSubscriptionForm');
            if (addSubscriptionForm) {
                addSubscriptionForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    try {
                        const response = await axios.post('/api/subscriptions', data);
                        if (response.data.success) {
                            alert('✅ تم إضافة الاشتراك بنجاح');
                            closeModal('addSubscriptionModal');
                            loadSubscriptions();
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('❌ حدث خطأ أثناء الإضافة');
                    }
                });
            }
            
            const addPackageForm = document.getElementById('addPackageForm');
            if (addPackageForm) {
                addPackageForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = Object.fromEntries(formData.entries());
                    try {
                        const response = await axios.post('/api/packages', data);
                        if (response.data.success) {
                            alert('✅ ' + response.data.message);
                            closeModal('addPackageModal');
                            loadPackages();
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('❌ حدث خطأ أثناء الإضافة');
                    }
                });
            }
            
            // Update Status Form
            const updateStatusForm = document.getElementById('updateStatusForm');
            if (updateStatusForm) {
                updateStatusForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const requestId = formData.get('requestId');
                    const status = formData.get('status');
                    const notes = formData.get('notes');
                    
                    try {
                        const response = await axios.put(\`/api/financing-requests/\${requestId}/status\`, {
                            status: status,
                            notes: notes
                        });
                        if (response.data.success) {
                            alert('✅ تم تحديث حالة الطلب بنجاح');
                            closeModal('updateStatusModal');
                            loadFinancingRequests();
                            loadDashboardStats();
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('❌ حدث خطأ أثناء التحديث');
                    }
                });
            }
            
            // Edit User Form
            const editUserForm = document.getElementById('editUserForm');
            if (editUserForm) {
                editUserForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const userId = formData.get('userId');
                    const data = {
                        full_name: formData.get('full_name'),
                        email: formData.get('email'),
                        phone: formData.get('phone'),
                        role_id: parseInt(formData.get('role_id')),
                        is_active: parseInt(formData.get('is_active'))
                    };
                    
                    try {
                        const response = await axios.put(\`/api/users/\${userId}\`, data);
                        if (response.data.success) {
                            alert('✅ تم تحديث بيانات المستخدم بنجاح');
                            closeModal('editUserModal');
                            loadUsers();
                        } else {
                            alert('❌ خطأ: ' + response.data.error);
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('❌ حدث خطأ أثناء التحديث');
                    }
                });
            }
        });
        
        // ==========================================
        // Calculator Link & QR Code Functions
        // ==========================================
        
        function resolveTenantSlug(userData = {}) {
            const slugCandidates = [
                userData.tenant_slug,
                userData.tenantSlug,
                userData.slug,
                userData.company_slug,
                userData.companySlug,
                userData.tenant && userData.tenant.slug,
                userData.company && userData.company.slug
            ];
            
            for (const candidate of slugCandidates) {
                if (typeof candidate !== 'string') continue;
                
                const normalized = candidate.trim();
                if (!normalized || normalized.toLowerCase() === 'unknown') continue;
                
                return normalized;
            }
            
            return null;
        }
        
        function buildCalculatorPath(userData = {}) {
            const tenantSlug = resolveTenantSlug(userData);
            return tenantSlug ? '/c/' + encodeURIComponent(tenantSlug) + '/calculator' : '/calculator';
        }

        function buildContactRootPath(userData = {}) {
            const tenantSlug = resolveTenantSlug(userData);
            return tenantSlug ? '/' + encodeURIComponent(tenantSlug) : '/';
        }

        async function resolveCalculatorPathFromTenantSettings(userData = {}) {
            const localPath = buildCalculatorPath(userData);
            if (localPath !== '/calculator') {
                return localPath;
            }

            const tenantIdCandidates = [
                userData.tenant_id,
                userData.tenantId,
                userData.tenant && userData.tenant.id
            ];
            const tenantId = tenantIdCandidates
                .map((value) => parseInt(value, 10))
                .find((value) => Number.isInteger(value) && value > 0);

            const tenantNameCandidates = [
                userData.tenant_name,
                userData.company_name,
                userData.companyName,
                userData.tenant && userData.tenant.company_name
            ];
            const tenantName = tenantNameCandidates
                .find((value) => typeof value === 'string' && value.trim())
                ?.trim()
                .toLowerCase();

            try {
                const response = await axios.get('/api/tenants');
                const tenants = Array.isArray(response?.data?.data) ? response.data.data : [];

                const matchedTenant = tenants.find((tenant) => {
                    const currentId = parseInt(tenant?.id, 10);
                    if (tenantId && currentId === tenantId) return true;

                    if (tenantName && typeof tenant?.company_name === 'string') {
                        return tenant.company_name.trim().toLowerCase() === tenantName;
                    }

                    return false;
                });

                if (!matchedTenant) {
                    return localPath;
                }

                const matchedSlug = resolveTenantSlug(matchedTenant);
                if (!matchedSlug) {
                    return localPath;
                }

                return '/c/' + encodeURIComponent(matchedSlug) + '/calculator';
            } catch (error) {
                console.warn('⚠️ تعذر تحميل رابط الحاسبة المخصص من إعدادات الشركات:', error);
                return localPath;
            }
        }

        async function resolveContactRootPathFromTenantSettings(userData = {}) {
            const localPath = buildContactRootPath(userData);
            if (localPath !== '/') {
                return localPath;
            }

            const tenantIdCandidates = [
                userData.tenant_id,
                userData.tenantId,
                userData.tenant && userData.tenant.id
            ];
            const tenantId = tenantIdCandidates
                .map((value) => parseInt(value, 10))
                .find((value) => Number.isInteger(value) && value > 0);

            const tenantNameCandidates = [
                userData.tenant_name,
                userData.company_name,
                userData.companyName,
                userData.tenant && userData.tenant.company_name
            ];
            const tenantName = tenantNameCandidates
                .find((value) => typeof value === 'string' && value.trim())
                ?.trim()
                .toLowerCase();

            try {
                const response = await axios.get('/api/tenants');
                const tenants = Array.isArray(response?.data?.data) ? response.data.data : [];

                const matchedTenant = tenants.find((tenant) => {
                    const currentId = parseInt(tenant?.id, 10);
                    if (tenantId && currentId === tenantId) return true;

                    if (tenantName && typeof tenant?.company_name === 'string') {
                        return tenant.company_name.trim().toLowerCase() === tenantName;
                    }

                    return false;
                });

                if (!matchedTenant) {
                    return localPath;
                }

                const matchedSlug = resolveTenantSlug(matchedTenant);
                if (!matchedSlug) {
                    return localPath;
                }

                return '/' + encodeURIComponent(matchedSlug);
            } catch (error) {
                console.warn('⚠️ تعذر تحميل رابط صفحة التواصل من إعدادات الشركات:', error);
                return localPath;
            }
        }
        
        function bindContactAffiliateActions(rootEl) {
            if (!rootEl) return;
            function fallbackCopy(text) {
                var ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                try {
                    document.execCommand('copy');
                } catch (e) {}
                document.body.removeChild(ta);
            }
            rootEl.querySelectorAll('[data-aff-copy]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var u = btn.getAttribute('data-aff-copy');
                    if (!u) return;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(u).catch(function () {
                            fallbackCopy(u);
                        });
                    } else {
                        fallbackCopy(u);
                    }
                });
            });
            rootEl.querySelectorAll('[data-aff-open]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var u = btn.getAttribute('data-aff-open');
                    if (u) window.open(u, '_blank');
                });
            });
        }

        window.toggleShareLinksDropdown = function () {
            var panel = document.getElementById('shareLinksDropdownPanel');
            var btn = document.getElementById('shareLinksDropdownToggle');
            var chev = document.getElementById('shareLinksDropdownChevron');
            if (!panel || !btn) return;
            var nowHidden = panel.classList.toggle('hidden');
            btn.setAttribute('aria-expanded', nowHidden ? 'false' : 'true');
            if (chev) chev.classList.toggle('open', !nowHidden);
        };

        // Generate and display calculator link and QR code
        async function loadCalculatorLink() {
            console.log('📱 بدء تحميل رابط الحاسبة...');
            
            const userDataStr = localStorage.getItem('userData');
            console.log('📦 بيانات localStorage:', userDataStr);
            
            if (!userDataStr) {
                console.error('❌ لا توجد بيانات مستخدم في localStorage');
                return;
            }
            
            const userData = JSON.parse(userDataStr);
            console.log('👤 بيانات المستخدم:', userData);
            
            const tenantSlug = resolveTenantSlug(userData);
            const tenantName = userData.tenant_name || userData.company_name || 'الشركة';
            
            console.log('🏢 معلومات الشركة:', { tenantSlug, tenantName });
            
            // Build calculator URL
            const baseUrl = window.location.origin;
            const calculatorPath = await resolveCalculatorPathFromTenantSettings(userData);
            const calculatorUrl = baseUrl + calculatorPath;
            const contactRootPath = await resolveContactRootPathFromTenantSettings(userData);
            const contactRootUrl = baseUrl + contactRootPath;
            
            console.log('🔗 رابط الحاسبة المولد:', calculatorUrl);
            
            // Update input field
            const linkInput = document.getElementById('calculatorLinkInput');
            if (linkInput) {
                linkInput.value = calculatorUrl;
            }
            const contactLinkInput = document.getElementById('contactRootLinkInput');
            if (contactLinkInput) {
                contactLinkInput.value = contactRootUrl;
            }
            
            // Generate QR Code using QR Server API
            const qrcodeContainer = document.getElementById('qrcodeContainer');
            if (qrcodeContainer) {
                qrcodeContainer.innerHTML = '';
                
                // Create QR code image using API
                const qrCodeUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(calculatorUrl)}\`;
                
                const qrImg = document.createElement('img');
                qrImg.src = qrCodeUrl;
                qrImg.alt = 'QR Code';
                qrImg.className = 'w-48 h-48';
                qrImg.id = 'qrcodeImage';
                
                qrcodeContainer.appendChild(qrImg);
            }

            const affWrap = document.getElementById('contactAffiliateLinksWrap');
            const affList = document.getElementById('contactAffiliateLinksList');
            if (affWrap && affList) {
                affList.innerHTML = '';
                let rid = parseInt(userData.role_id, 10);
                const roleLegacy = { 11: 1, 12: 2, 13: 3, 14: 4, 15: 5 };
                if (roleLegacy[rid]) rid = roleLegacy[rid];
                if (typeof window.USER_ROLE_ID !== 'undefined' && window.USER_ROLE_ID !== null) {
                    const w = parseInt(window.USER_ROLE_ID, 10);
                    rid = roleLegacy[w] || w;
                }
                /** Show copyable campaign links whenever a public contact path exists — not role-gated. */
                const showAff = Boolean(contactRootPath && contactRootPath !== '/');
                const manageAffBlock = document.getElementById('contactAffiliatesManageBlock');
                if (manageAffBlock) {
                    manageAffBlock.style.display = rid === 1 || rid === 2 ? '' : 'none';
                }
                if (!showAff) {
                    affWrap.style.display = 'none';
                } else {
                    affWrap.style.display = 'block';
                    try {
                        let u = '/api/tenant-contact-affiliates';
                        if (rid === 1) {
                            const tid = parseInt(userData.tenant_id || userData.tenantId || '0', 10);
                            if (!Number.isFinite(tid) || tid <= 0) {
                                affList.innerHTML =
                                    '<div class="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 leading-relaxed">' +
                                    'لعرض روابط التتبع، اختر شركة من نطاق السوبر أدمن أو افتح تفاصيل الشركة.' +
                                    '</div>';
                                return;
                            }
                            u += '?tenant_id=' + tid;
                        }
                        const res = await axios.get(u);
                        const rows = Array.isArray(res && res.data && res.data.data) ? res.data.data : [];
                        function escAff(s) {
                            return String(s ?? '')
                                .replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/"/g, '&quot;');
                        }
                        function escAttr(s) {
                            return String(s ?? '')
                                .replace(/&/g, '&amp;')
                                .replace(/"/g, '&quot;')
                                .replace(/'/g, '&#39;');
                        }
                        if (!rows.length) {
                            affList.innerHTML =
                                '<div class="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 leading-relaxed">' +
                                'لا توجد روابط تتبع بعد. استخدم «إدارة روابط التتبع» أدناه لإضافة مسار.' +
                                '</div>';
                        } else {
                            affList.innerHTML = rows
                                .map(function (r) {
                                    var pathSeg = encodeURIComponent(r.path_segment || '');
                                    var full =
                                        baseUrl +
                                        String(contactRootPath).replace(/\\/$/, '') +
                                        '/' +
                                        pathSeg;
                                    return (
                                        '<div class="rounded-lg border border-gray-200 bg-gray-50 p-3">' +
                                        '<p class="text-xs font-bold text-gray-800 mb-2">' +
                                        escAff(r.label) +
                                        '</p>' +
                                        '<label class="block text-xs font-medium text-gray-600 mb-1.5">رابط الحملة</label>' +
                                        '<div class="flex gap-2">' +
                                        '<input type="text" readonly dir="ltr" class="flex-1 min-w-0 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-800" value="' +
                                        escAttr(full) +
                                        '">' +
                                        '<button type="button" class="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-bold transition-colors" data-aff-copy="' +
                                        escAttr(full) +
                                        '" title="نسخ الرابط">' +
                                        '<i class="fas fa-copy"></i>' +
                                        '</button>' +
                                        '</div>' +
                                        '<button type="button" class="w-full mt-3 bg-slate-700 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm" data-aff-open="' +
                                        escAttr(full) +
                                        '">' +
                                        '<i class="fas fa-external-link-alt ml-2"></i>فتح في نافذة جديدة' +
                                        '</button>' +
                                        '</div>'
                                    );
                                })
                                .join('');
                            bindContactAffiliateActions(affList);
                        }
                    } catch (e) {
                        affList.innerHTML =
                            '<div class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">تعذر تحميل الروابط</div>';
                    }
                }
            }
        }
        
        // Copy calculator link to clipboard
        window.copyCalculatorLink = function() {
            console.log('📋 نسخ رابط الحاسبة...');
            
            const linkInput = document.getElementById('calculatorLinkInput');
            if (!linkInput) {
                console.error('❌ لم يتم العثور على حقل الرابط');
                return;
            }
            
            // Copy to clipboard
            linkInput.select();
            linkInput.setSelectionRange(0, 99999); // For mobile devices
            
            try {
                document.execCommand('copy');
                console.log('✅ تم النسخ بنجاح');
                
                // Show success message
                const successMessage = document.getElementById('copySuccessMessage');
                if (successMessage) {
                    successMessage.classList.remove('hidden');
                    setTimeout(() => {
                        successMessage.classList.add('hidden');
                    }, 3000);
                }
            } catch (err) {
                console.error('❌ فشل النسخ:', err);
                alert('❌ فشل نسخ الرابط');
            }
        };
        
        // Open calculator link in new tab
        window.openCalculatorLink = function() {
            console.log('🌐 فتح رابط الحاسبة...');
            
            const linkInput = document.getElementById('calculatorLinkInput');
            if (!linkInput || !linkInput.value || linkInput.value === 'جاري التحميل...') {
                console.error('❌ الرابط غير جاهز');
                alert('❌ الرجاء الانتظار حتى يتم تحميل الرابط');
                return;
            }
            
            const calculatorUrl = linkInput.value;
            console.log('🔗 فتح الرابط:', calculatorUrl);
            
            // Open in new tab
            window.open(calculatorUrl, '_blank');
        };

        window.copyContactRootLink = function() {
            const linkInput = document.getElementById('contactRootLinkInput');
            if (!linkInput) return;
            linkInput.select();
            linkInput.setSelectionRange(0, 99999);
            try {
                document.execCommand('copy');
                const successMessage = document.getElementById('contactRootCopySuccessMessage');
                if (successMessage) {
                    successMessage.classList.remove('hidden');
                    setTimeout(() => successMessage.classList.add('hidden'), 3000);
                }
            } catch (err) {
                console.error('❌ فشل نسخ رابط صفحة التواصل:', err);
                alert('❌ فشل نسخ الرابط');
            }
        };

        window.openContactRootLink = function() {
            const linkInput = document.getElementById('contactRootLinkInput');
            if (!linkInput || !linkInput.value || linkInput.value === 'جاري التحميل...') {
                alert('❌ الرجاء الانتظار حتى يتم تحميل الرابط');
                return;
            }
            window.open(linkInput.value, '_blank');
        };
        
        // Download QR Code as image
        window.downloadQRCode = function() {
            console.log('💾 تحميل رمز QR...');
            
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const tenantName = userData.tenant_name || 'الشركة';
            
            const qrImg = document.getElementById('qrcodeImage');
            if (!qrImg) {
                console.error('❌ لم يتم العثور على رمز QR');
                alert('❌ لم يتم إنشاء رمز QR بعد');
                return;
            }
            
            // Create download link
            const link = document.createElement('a');
            link.href = qrImg.src;
            link.download = \`calculator-qr-\${tenantName.replace(/\\s+/g, '-')}.png\`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('✅ تم بدء التحميل');
        };
        
        // Employee Calculator Link Functions
        window.copyEmployeeCalculatorLink = function() {
            console.log('📋 نسخ رابط الحاسبة (موظف)...');
            
            const linkInput = document.getElementById('employeeCalculatorLinkInput');
            if (!linkInput) {
                console.error('❌ لم يتم العثور على حقل الرابط');
                return;
            }
            
            linkInput.select();
            linkInput.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                console.log('✅ تم النسخ بنجاح');
                
                const successMessage = document.getElementById('employeeCopySuccessMessage');
                if (successMessage) {
                    successMessage.classList.remove('hidden');
                    setTimeout(() => {
                        successMessage.classList.add('hidden');
                    }, 3000);
                }
            } catch (err) {
                console.error('❌ فشل النسخ:', err);
                alert('❌ فشل نسخ الرابط');
            }
        };
        
        window.openEmployeeCalculatorLink = function() {
            console.log('🌐 فتح رابط الحاسبة (موظف)...');
            
            const linkInput = document.getElementById('employeeCalculatorLinkInput');
            if (!linkInput || !linkInput.value || linkInput.value === 'جاري التحميل...') {
                console.error('❌ الرابط غير جاهز');
                alert('❌ الرجاء الانتظار حتى يتم تحميل الرابط');
                return;
            }
            
            window.open(linkInput.value, '_blank');
        };
        
        window.downloadEmployeeQRCode = function() {
            console.log('💾 تحميل باركود الحاسبة (موظف)...');
            
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            const tenantName = userData.tenant_name || 'الشركة';
            
            const qrImg = document.getElementById('employeeQRCodeImage');
            if (!qrImg) {
                console.error('❌ لم يتم العثور على الباركود');
                alert('❌ لم يتم إنشاء الباركود بعد');
                return;
            }
            
            const link = document.createElement('a');
            link.href = qrImg.src;
            link.download = \`calculator-qr-\${tenantName.replace(/\\s+/g, '-')}.png\`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('✅ تم بدء التحميل');
        };
        
        window.loadEmployeeCalculatorLink = async function() {
            console.log('🔗 تحميل رابط الحاسبة للموظف...');
            
            try {
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const tenantSlug = resolveTenantSlug(userData);
                
                const baseUrl = window.location.origin;
                const calculatorPath = await resolveCalculatorPathFromTenantSettings(userData);
                const calculatorUrl = baseUrl + calculatorPath;
                
                if (!tenantSlug && calculatorPath === '/calculator') {
                    console.warn('⚠️ tenant_slug غير متوفر - استخدام الحاسبة العامة');
                }
                
                console.log('✅ رابط الحاسبة:', calculatorUrl);
                
                // Update input field
                const linkInput = document.getElementById('employeeCalculatorLinkInput');
                if (linkInput) {
                    linkInput.value = calculatorUrl;
                }
                
                // Generate QR Code
                const qrContainer = document.getElementById('employeeQRCodeContainer');
                if (qrContainer && typeof QRCode !== 'undefined') {
                    qrContainer.innerHTML = '';
                    new QRCode(qrContainer, {
                        text: calculatorUrl,
                        width: 200,
                        height: 200,
                        colorDark: '#000000',
                        colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.H
                    });
                    
                    setTimeout(() => {
                        const qrImg = qrContainer.querySelector('img');
                        if (qrImg) {
                            qrImg.id = 'employeeQRCodeImage';
                            qrImg.style.border = '10px solid white';
                            qrImg.style.borderRadius = '10px';
                            console.log('✅ تم إنشاء الباركود');
                        }
                    }, 500);
                }
            } catch (error) {
                console.error('❌ خطأ في تحميل رابط الحاسبة:', error);
            }
        };
        
        // Initialize on load
        loadDashboardStats();
        
        // رابط الحاسبة يُحمَّل من applyUserPermissions → loadCalculatorLink لجميع الأدوار
        
        // Bell badge: counts unread customer alarms only
        async function loadNotifCount() {
            try {
                const resp = await fetch('/api/customer-alarms/unread-count', { credentials: 'same-origin' });
                const data = await resp.json();
                const count = (data.success ? data.count : 0) || 0;
                const btn = document.getElementById('notif-bell-btn');
                const badge = document.getElementById('notif-badge');
                if (btn && badge) {
                    if (count > 0) {
                        badge.textContent = count > 99 ? '99+' : String(count);
                        btn.style.display = 'inline-block';
                    } else {
                        btn.style.display = 'none';
                    }
                }
            } catch (e) {
                console.warn('alarms count:', e);
            }
        }
        loadNotifCount();
        setInterval(loadNotifCount, 60000);

        // Show Section function
        window.showSection = function(sectionName) {
            console.log('🔄 Switching to section:', sectionName);
            
            // Hide all sections
            const allSections = document.querySelectorAll('.content-section');
            allSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Show target section
            const targetSection = document.getElementById(sectionName + '-section');
            if (targetSection) {
                targetSection.classList.add('active');
                console.log('✅ Section activated:', sectionName);
                
                // Load data based on section
                if (sectionName === 'reports') {
                    loadReports();
                }
            } else {
                console.error('❌ Section not found:', sectionName);
            }
        };
        
        // Load Reports function
        window.loadReports = async function() {
            try {
                console.log('📊 Loading reports...');
                
                // Get date range
                const fromDate = document.getElementById('reportFromDate').value;
                const toDate = document.getElementById('reportToDate').value;
                
                // Set default dates if not provided
                if (!fromDate || !toDate) {
                    const today = new Date();
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                    document.getElementById('reportFromDate').value = firstDay.toISOString().split('T')[0];
                    document.getElementById('reportToDate').value = today.toISOString().split('T')[0];
                }
                
                // Get auth token
                const token = localStorage.getItem('authToken');
                
                // Fetch statistics
                const statsResponse = await axios.get('/api/reports/statistics', {
                    params: { from_date: fromDate, to_date: toDate },
                    headers: token ? { 'Authorization': \`Bearer \${token}\` } : {}
                });
                
                if (statsResponse.data.success) {
                    const stats = statsResponse.data.data;
                    
                    // Update cards
                    document.getElementById('reportTotalRequests').textContent = stats.total_requests || 0;
                    document.getElementById('reportApprovedRequests').textContent = stats.approved_requests || 0;
                    document.getElementById('reportPendingRequests').textContent = stats.pending_requests || 0;
                    document.getElementById('reportTotalAmount').textContent = (stats.total_amount || 0).toLocaleString('ar-SA') + ' ريال';
                    
                    // Load top customers
                    if (stats.top_customers && stats.top_customers.length > 0) {
                        const tbody = document.getElementById('topCustomersTable');
                        tbody.innerHTML = stats.top_customers.map(customer => \`
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-4 py-3">\${customer.customer_name}</td>
                                <td class="px-4 py-3">\${customer.request_count}</td>
                                <td class="px-4 py-3">\${(customer.total_amount || 0).toLocaleString('ar-SA')} ريال</td>
                                <td class="px-4 py-3">\${customer.last_request_date ? new Date(customer.last_request_date).toLocaleDateString('ar-SA') : '-'}</td>
                            </tr>
                        \`).join('');
                    }
                    
                    console.log('✅ Reports loaded successfully');
                } else {
                    console.error('Failed to load reports');
                }
            } catch (error) {
                console.error('Error loading reports:', error);
            }
        };
    </script>
    
    <!-- تم توحيد صلاحيات القائمة الجانبية مع صلاحيات لوحة الوصول السريع داخل applyUserPermissions() -->
    
    <!-- Mobile Sidebar Overlay -->
    <div id="sidebar-overlay"></div>

    <!-- Alarm Side Panel -->
    <div id="alarm-panel-overlay" onclick="closeAlarmPanel()"></div>
    <div id="alarm-panel">
        <div class="bg-gradient-to-r from-orange-400 to-red-500 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <h2 class="text-white text-xl font-bold"><i class="fas fa-bell ml-2"></i> التنبيهات</h2>
            <div class="flex items-center gap-3">
                <button onclick="markAllPanelAlarmsRead()" class="text-white text-sm hover:text-orange-100 font-medium" title="تحديد الكل كمقروء">
                    <i class="fas fa-check-double ml-1"></i> تحديد الكل
                </button>
                <button onclick="closeAlarmPanel()" class="text-white hover:text-orange-100 text-2xl leading-none">&times;</button>
            </div>
        </div>
        <div class="px-4 py-2 border-b bg-gray-50 flex items-center gap-2 flex-shrink-0">
            <label class="text-xs text-gray-500 font-medium whitespace-nowrap">تصفية:</label>
            <select id="alarmPanelFilter" onchange="loadPanelAlarms()" class="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 text-right">
                <option value="all">الكل</option>
                <option value="scheduled">التنبيهات المجدولة</option>
                <option value="workflow">تنبيهات سير العمل</option>
                <option value="reminder">تذكيرات التقييم</option>
            </select>
        </div>
        <div id="alarm-panel-list" class="flex-1 overflow-y-auto p-4 space-y-3">
            <div class="text-center text-gray-400 py-10"><i class="fas fa-spinner fa-spin text-3xl mb-3"></i><p>جاري التحميل...</p></div>
        </div>
    </div>

    <script>
        async function openAlarmPanel() {
            document.getElementById('alarm-panel').classList.add('open');
            document.getElementById('alarm-panel-overlay').classList.add('open');
            await loadPanelAlarms();
        }
        function closeAlarmPanel() {
            document.getElementById('alarm-panel').classList.remove('open');
            document.getElementById('alarm-panel-overlay').classList.remove('open');
        }

        async function loadPanelAlarms() {
            const list = document.getElementById('alarm-panel-list');
            list.innerHTML = '<div class="text-center text-gray-400 py-10"><i class="fas fa-spinner fa-spin text-3xl mb-3"></i><p>جاري التحميل...</p></div>';
            try {
                const resp = await fetch('/api/customer-alarms', { credentials: 'same-origin' });
                const data = await resp.json();
                if (!data.success) {
                    list.innerHTML = '<div class="text-center text-red-400 py-10"><i class="fas fa-exclamation-circle text-3xl mb-2"></i><p class="text-sm">فشل تحميل التنبيهات</p></div>';
                    return;
                }
                const filter = document.getElementById('alarmPanelFilter')?.value || 'all';
                let alarms = data.data || [];
                if (filter === 'scheduled') alarms = alarms.filter(function(a) { return !a.alarm_type || (a.alarm_type !== 'workflow' && a.alarm_type !== 'reminder' && a.alarm_type !== 'task_pass'); });
                else if (filter === 'workflow') alarms = alarms.filter(function(a) { return a.alarm_type === 'workflow' || a.alarm_type === 'task_pass'; });
                else if (filter === 'reminder') alarms = alarms.filter(function(a) { return a.alarm_type === 'reminder'; });
                if (!alarms.length) {
                    list.innerHTML = '<div class="text-center text-gray-400 py-10"><i class="fas fa-bell-slash text-4xl mb-3"></i><p class="text-sm">لا توجد تنبيهات</p></div>';
                    return;
                }
                list.innerHTML = alarms.map(function(a) {
                    const isUnread = !a.is_read;
                    const isTaskPass = a.alarm_type === 'task_pass';
                    const isWorkflow = a.alarm_type === 'workflow' || isTaskPass;
                    const isReminder = a.alarm_type === 'reminder';
                    let dateStr = [a.alarm_date_gregorian, a.alarm_date_hijri].filter(Boolean).join(' | ');
                    if (!dateStr && a.created_at) {
                        try {
                            const d = new Date(a.created_at);
                            dateStr = d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' });
                        } catch(e) {}
                    }
                    let timeStr = a.alarm_time ? ' — ' + a.alarm_time : '';
                    if (!timeStr && a.created_at) {
                        try {
                            timeStr = ' — ' + new Date(a.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });
                        } catch(e) {}
                    }
                    const cid = a.customer_id;
                    const customerHref = isWorkflow ? (a.link_url || '#') : ((cid != null && cid !== '') ? '/admin/customers/' + String(cid) : '#');
                    const borderClass = isWorkflow
                        ? (isUnread ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white')
                        : isReminder
                            ? (isUnread ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white')
                            : (isUnread ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white');
                    const sideBgClass = isWorkflow
                        ? (isUnread ? 'bg-blue-50/80' : 'bg-gray-50/80')
                        : isReminder
                            ? (isUnread ? 'bg-green-50/80' : 'bg-gray-50/80')
                            : (isUnread ? 'bg-orange-50/80' : 'bg-gray-50/80');
                    const dotColor = isWorkflow ? 'bg-blue-500' : isReminder ? 'bg-green-500' : 'bg-red-500';
                    const icon = isTaskPass
                        ? '<i class="fas fa-share text-violet-400 text-xs ml-1"></i>'
                        : isWorkflow
                        ? '<i class="fas fa-route text-blue-400 text-xs ml-1"></i>'
                        : isReminder
                            ? '<i class="fas fa-rotate text-green-400 text-xs ml-1"></i>'
                            : '';
                    const clockColor = isWorkflow ? 'text-blue-400' : isReminder ? 'text-green-400' : 'text-orange-400';
                    const nameColor = isWorkflow ? 'text-blue-800' : isReminder ? 'text-green-800' : 'text-gray-800';
                    const noteColor = isWorkflow ? 'text-blue-700' : isReminder ? 'text-green-700' : 'text-gray-600';
                    return \`<div id="ap-alarm-\${a.id}" class="rounded-xl border \${borderClass} shadow-sm transition-all flex items-stretch overflow-hidden">
                        <a href="\${customerHref}" class="flex-1 min-w-0 p-4 block text-right no-underline text-inherit cursor-pointer hover:bg-black/5 focus:outline-none rounded-s-xl">
                            <div class="flex items-center gap-2 mb-1">
                                \${isUnread ? \`<span class="inline-block w-2.5 h-2.5 rounded-full \${dotColor} flex-shrink-0 mt-0.5" style="animation:pulse-glow 1.5s infinite"></span>\` : ''}
                                \${icon}
                                <p class="font-bold \${nameColor} text-sm truncate">\${a.customer_name}</p>
                            </div>
                            \${dateStr ? \`<p class="text-xs text-gray-500 mb-1"><i class="fas fa-clock \${clockColor} ml-1"></i>\${dateStr}\${timeStr}</p>\` : ''}
                            \${a.note ? \`<p class="text-sm \${noteColor} mt-1 line-clamp-4 whitespace-pre-line">\${a.note}</p>\` : ''}
                        </a>
                        <div class="flex flex-col gap-1 flex-shrink-0 justify-center px-2 py-2 border-s border-gray-200/80 \${sideBgClass}">
                            \${isUnread ? \`<button type="button" onclick="markPanelAlarmRead(\${a.id})" title="تحديد كمقروء" class="w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 text-green-600 flex items-center justify-center transition-colors"><i class="fas fa-check text-xs"></i></button>\` : ''}
                            <button type="button" onclick="deletePanelAlarm(\${a.id})" title="حذف" class="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"><i class="fas fa-trash text-xs"></i></button>
                        </div>
                    </div>\`;
                }).join('');
            } catch(e) {
                list.innerHTML = '<div class="text-center text-red-400 py-10"><i class="fas fa-exclamation-circle text-3xl mb-2"></i><p class="text-sm">فشل تحميل التنبيهات</p></div>';
            }
        }

        async function markPanelAlarmRead(id) {
            await fetch('/api/customer-alarms/' + id + '/read', { method: 'PUT', credentials: 'same-origin' });
            const el = document.getElementById('ap-alarm-' + id);
            if (el) {
                el.classList.remove('border-orange-300', 'bg-orange-50', 'border-blue-300', 'bg-blue-50', 'border-green-300', 'bg-green-50');
                el.classList.add('border-gray-200', 'bg-white');
                const dot = el.querySelector('.bg-red-500, .bg-blue-500, .bg-green-500');
                if (dot) dot.remove();
                const readBtn = el.querySelector('button[onclick^="markPanelAlarmRead"]');
                if (readBtn) readBtn.remove();
                const sideDiv = el.querySelector('.flex.flex-col');
                if (sideDiv) { sideDiv.classList.remove('bg-orange-50\\/80', 'bg-blue-50\\/80', 'bg-green-50\\/80'); sideDiv.classList.add('bg-gray-50\\/80'); }
            }
            loadNotifCount();
            try { if (typeof refreshVisibleCustomerTables === 'function') refreshVisibleCustomerTables(); } catch(_) {}
        }

        async function deletePanelAlarm(id) {
            await fetch('/api/customer-alarms/' + id, { method: 'DELETE', credentials: 'same-origin' });
            const el = document.getElementById('ap-alarm-' + id);
            if (el) el.remove();
            const list = document.getElementById('alarm-panel-list');
            if (!list.querySelector('[id^="ap-alarm-"]')) {
                list.innerHTML = '<div class="text-center text-gray-400 py-10"><i class="fas fa-bell-slash text-4xl mb-3"></i><p class="text-sm">لا توجد تنبيهات</p></div>';
            }
            loadNotifCount();
        }

        async function markAllPanelAlarmsRead() {
            await fetch('/api/customer-alarms/read-all', { method: 'PUT', credentials: 'same-origin' });
            await loadPanelAlarms();
            loadNotifCount();
            try { if (typeof refreshVisibleCustomerTables === 'function') refreshVisibleCustomerTables(); } catch(_) {}
        }

        // ===== Standalone per-customer alarm popup =====
        // (refreshCustomerAlarmsMap + renderCustomerAlarmDot are defined earlier,
        // in the same script block as loadCustomers, so they're available at table-render time.)

        window.openCustomerAlarmsPopup = async function(customerId) {
            await window.refreshCustomerAlarmsMap();
            const list = (window.customerAlarmsByCustomer && window.customerAlarmsByCustomer[customerId]) || [];
            const overlay = document.getElementById('customer-alarm-popup-overlay');
            const body = document.getElementById('customer-alarm-popup-body');
            const title = document.getElementById('customer-alarm-popup-title');
            if (!overlay || !body) return;
            if (!list.length) {
                closeCustomerAlarmsPopup();
                // Refresh visible table so the dot disappears
                refreshVisibleCustomerTables();
                return;
            }
            const customerName = list[0].customer_name || '';
            if (title) title.textContent = customerName ? 'تنبيهات: ' + customerName : 'التنبيهات';
            body.dataset.customerId = String(customerId);
            body.innerHTML = list.map(function(a) {
                const isWorkflow = a.alarm_type === 'workflow';
                const isReminder = a.alarm_type === 'reminder';
                let dateStr = [a.alarm_date_gregorian, a.alarm_date_hijri].filter(Boolean).join(' | ');
                if (!dateStr && a.created_at) {
                    try {
                        const d = new Date(a.created_at);
                        dateStr = d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' });
                    } catch(e) {}
                }
                let timeStr = a.alarm_time ? ' — ' + a.alarm_time : '';
                if (!timeStr && a.created_at) {
                    try {
                        timeStr = ' — ' + new Date(a.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });
                    } catch(e) {}
                }
                const borderClass = isWorkflow ? 'border-blue-300 bg-blue-50'
                    : isReminder ? 'border-green-300 bg-green-50'
                    : 'border-orange-300 bg-orange-50';
                const dotColor = isWorkflow ? 'bg-blue-500' : isReminder ? 'bg-green-500' : 'bg-red-500';
                const icon = isWorkflow ? '<i class="fas fa-route text-blue-400 text-xs ml-1"></i>'
                    : isReminder ? '<i class="fas fa-rotate text-green-400 text-xs ml-1"></i>'
                    : '<i class="fas fa-bell text-orange-400 text-xs ml-1"></i>';
                const nameColor = isWorkflow ? 'text-blue-800' : isReminder ? 'text-green-800' : 'text-gray-800';
                const noteColor = isWorkflow ? 'text-blue-700' : isReminder ? 'text-green-700' : 'text-gray-700';
                return '<div id="cap-alarm-' + a.id + '" class="rounded-xl border ' + borderClass + ' shadow-sm p-4 text-right">' +
                    '<div class="flex items-center gap-2 mb-2">' +
                        '<span class="inline-block w-2.5 h-2.5 rounded-full ' + dotColor + ' flex-shrink-0" style="animation:pulse-glow 1.5s infinite"></span>' +
                        icon +
                        '<p class="font-bold ' + nameColor + ' text-sm flex-1 truncate">' + (a.customer_name || '') + '</p>' +
                    '</div>' +
                    (dateStr ? '<p class="text-xs text-gray-500 mb-2"><i class="fas fa-clock text-orange-400 ml-1"></i>' + dateStr + timeStr + '</p>' : '') +
                    (a.note ? '<p class="text-sm ' + noteColor + ' mb-3 whitespace-pre-line">' + a.note + '</p>' : '') +
                    '<div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">' +
                        '<button type="button" onclick="markCustomerAlarmReadFromPopup(' + a.id + ', ' + customerId + ')" class="inline-flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors">' +
                            '<i class="fas fa-check"></i><span>تحديد كمقروء</span>' +
                        '</button>' +
                    '</div>' +
                '</div>';
            }).join('');
            overlay.classList.add('open');
            overlay.style.display = 'flex';
        };

        window.closeCustomerAlarmsPopup = function() {
            const overlay = document.getElementById('customer-alarm-popup-overlay');
            if (overlay) {
                overlay.classList.remove('open');
                overlay.style.display = 'none';
            }
        };

        window.markCustomerAlarmReadFromPopup = async function(alarmId, customerId) {
            await fetch('/api/customer-alarms/' + alarmId + '/read', { method: 'PUT', credentials: 'same-origin' });
            const el = document.getElementById('cap-alarm-' + alarmId);
            if (el) el.remove();
            // Refresh global state
            await window.refreshCustomerAlarmsMap();
            const remaining = (window.customerAlarmsByCustomer && window.customerAlarmsByCustomer[customerId]) || [];
            if (!remaining.length) {
                closeCustomerAlarmsPopup();
            }
            // Update bell badge and visible tables (so dot vanishes when no unread remain)
            loadNotifCount();
            refreshVisibleCustomerTables();
        };

        window.refreshVisibleCustomerTables = function() {
            try {
                const custSec = document.getElementById('customers-section');
                if (custSec && custSec.classList.contains('active') && typeof loadCustomers === 'function') {
                    loadCustomers();
                }
                const reqSec = document.getElementById('requests-section');
                if (reqSec && reqSec.classList.contains('active') && typeof loadFinancingRequests === 'function') {
                    loadFinancingRequests();
                }
            } catch (e) { /* noop */ }
        };
    </script>

    <!-- Customer Alarm Standalone Popup -->
    <div id="customer-alarm-popup-overlay"
         onclick="if(event.target===this) closeCustomerAlarmsPopup()"
         style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:10000; align-items:center; justify-content:center; padding:1rem;">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onclick="event.stopPropagation()">
            <div class="bg-gradient-to-r from-orange-400 to-red-500 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <h2 id="customer-alarm-popup-title" class="text-white text-lg font-bold"><i class="fas fa-bell ml-2"></i> التنبيهات</h2>
                <button type="button" onclick="closeCustomerAlarmsPopup()" class="text-white hover:text-orange-100 text-2xl leading-none" title="إغلاق">&times;</button>
            </div>
            <div id="customer-alarm-popup-body" class="flex-1 overflow-y-auto p-4 space-y-3"></div>
            <div class="px-4 py-3 border-t bg-gray-50 flex items-center justify-end flex-shrink-0">
                <button type="button" onclick="closeCustomerAlarmsPopup()" class="inline-flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-semibold transition-colors">
                    <i class="fas fa-times"></i><span>إغلاق</span>
                </button>
            </div>
        </div>
    </div>

</body>
</html>
`;
