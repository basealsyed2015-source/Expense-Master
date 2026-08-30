export const smartCalculator = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>حاسبة التمويل الذكية</title>
    <link rel="stylesheet" href="/tailwind.css">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr-hijri-calendar@1.0.0/dist/flatpickr-hijri-calendar.min.css">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/l10n/ar.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/luxon@2.0.2/build/global/luxon.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr-hijri-calendar@1.0.0/dist/flatpickr-hijri-calendar.min.js"></script>
    <style>
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); overflow-y: auto; }
        .modal.active { display: flex; align-items: center; justify-content: center; }
        .best-offer { border: 3px solid #10B981; background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); }
        .bank-card { transition: all 0.3s; cursor: pointer; }
        .bank-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .qualification-badge { 
            display: inline-block; 
            padding: 8px 20px; 
            border-radius: 50px; 
            font-weight: bold; 
            font-size: 1.1rem;
        }
        .qualified { background: linear-gradient(135deg, #10B981, #059669); color: white; }
        .not-qualified { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; }
        
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
            /* Adjust padding and margins */
            .container { padding-left: 1rem; padding-right: 1rem; }
            .px-8 { padding-left: 1rem; padding-right: 1rem; }
            .py-12 { padding-top: 2rem; padding-bottom: 2rem; }
            
            /* Make grid single column */
            .grid-cols-2 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            
            /* Adjust font sizes */
            .text-4xl { font-size: 1.75rem; }
            .text-3xl { font-size: 1.5rem; }
            .text-2xl { font-size: 1.25rem; }
            
            /* Make modals full screen */
            .modal > div {
                width: 95% !important;
                max-width: 95% !important;
                margin: 1rem !important;
                max-height: 90vh !important;
                overflow-y: auto !important;
            }
            
            /* Adjust input sizes */
            input, select, button {
                font-size: 16px !important; /* Prevent zoom on iOS */
                padding: 0.75rem !important;
            }
            
            /* Stack bank cards vertically */
            .bank-card {
                margin-bottom: 1rem;
            }
            
            /* Adjust button sizes */
            button {
                padding: 0.75rem 1.5rem !important;
                width: 100%;
                margin-bottom: 0.5rem;
            }
            
            /* Hide decorative elements on mobile */
            .absolute.top-0.left-0 { display: none; }
            .absolute.bottom-0.right-0 { display: none; }
        }
        
        /* Print styles */
        @media print {
            body { background: white; }
            nav, .modal, button { display: none !important; }
            #step1 { display: none !important; }
            #resultsSection { display: block !important; }
            .bank-card { break-inside: avoid; }
            @page { margin: 1cm; }
        }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
    <!-- Header -->
    <nav class="bg-white shadow-lg">
        <div class="container mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
                <a href="/admin/panel" class="text-2xl font-bold text-blue-600">
                    <i class="fas fa-calculator ml-2"></i>
                    حاسبة التمويل الذكية
                </a>
                <div class="flex items-center space-x-reverse space-x-4">
                    <a href="/packages" class="text-gray-700 hover:text-blue-600 transition-colors">
                        <i class="fas fa-box ml-1"></i>الباقات
                    </a>
                    <a href="/login" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                        <i class="fas fa-sign-in-alt ml-1"></i>تسجيل الدخول
                    </a>
                    <a href="/subscribe" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                        <i class="fas fa-rocket ml-1"></i>اشترك الآن
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
            <!-- Step 1: Main Calculator Form -->
            <div id="step1" class="bg-white rounded-2xl shadow-2xl p-8 mb-8">
                <div class="text-center mb-8">
                    <div class="inline-block bg-blue-100 rounded-full p-4 mb-4">
                        <i class="fas fa-calculator text-4xl text-blue-600"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">احسب أفضل عرض تمويل</h2>
                    <p class="text-gray-600">سنقارن لك جميع البنوك ونختار الأفضل</p>
                </div>
                
                <form id="calculatorForm" class="space-y-6">
                    <!-- نوع التمويل -->
                    <div>
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-hand-holding-usd text-blue-600 ml-2"></i>
                            نوع التمويل
                        </label>
                        <select id="financingType" required class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">اختر نوع التمويل</option>
                        </select>
                    </div>
                    
                    <!-- مبلغ التمويل -->
                    <div>
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-money-bill-wave text-green-600 ml-2"></i>
                            مبلغ التمويل المطلوب (ريال)
                        </label>
                        <input type="number" id="amount" required min="10000" step="1000" 
                               class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               placeholder="مثال: 100000">
                        <p class="text-sm text-gray-500 mt-1">الحد الأدنى: 10,000 ريال</p>
                    </div>
                    
                    <!-- الراتب الشهري -->
                    <div>
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-wallet text-purple-600 ml-2"></i>
                            الراتب الشهري (ريال)
                        </label>
                        <input type="number" id="salary" required min="3000" step="100"
                               class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               placeholder="مثال: 10000">
                        <p class="text-sm text-gray-500 mt-1">الحد الأدنى: 3,000 ريال</p>
                    </div>
                    
                    <!-- زر الحساب -->
                    <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold text-xl hover:shadow-xl transition transform hover:scale-105">
                        <i class="fas fa-calculator ml-2"></i>
                        احسب أفضل عرض
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal: Customer Info -->
    <div id="customerModal" class="modal">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div class="text-center mb-6">
                <div class="inline-block bg-green-100 rounded-full p-4 mb-4">
                    <i class="fas fa-user-check text-4xl text-green-600"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">معلوماتك الشخصية</h3>
                <p class="text-gray-600">لنجد لك أفضل عرض مخصص</p>
            </div>
            
            <form id="customerForm" class="space-y-4">
                <div>
                    <label class="block text-gray-700 font-bold mb-2">
                        <i class="fas fa-user text-blue-600 ml-2"></i>
                        الاسم الكامل
                    </label>
                    <input type="text" id="customerName" required 
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                           placeholder="مثال: محمد أحمد السعيد">
                </div>
                
                <div>
                    <label class="block text-gray-700 font-bold mb-2">
                        <i class="fas fa-phone text-green-600 ml-2"></i>
                        رقم الجوال
                    </label>
                    <input type="tel" id="customerPhone" required pattern="05[0-9]{8}"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                           placeholder="مثال: 0512345678">
                    <p class="text-sm text-gray-500 mt-1">يجب أن يبدأ بـ 05 ويتكون من 10 أرقام</p>
                </div>
                
                <div>
                    <label class="block text-gray-700 font-bold mb-2">
                        <i class="fas fa-calendar-alt text-indigo-600 ml-2"></i>
                        تاريخ الميلاد (هجري)
                    </label>
                    <input type="text" id="customerBirthdateHijri" autocomplete="off"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                           placeholder="اختر التاريخ من التقويم الهجري">
                </div>

                <div>
                    <label class="block text-gray-700 font-bold mb-2">
                        <i class="fas fa-calendar text-purple-600 ml-2"></i>
                        تاريخ الميلاد (ميلادي)
                    </label>
                    <input type="date" id="customerBirthdate" required max="2006-12-31"
                           class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <p class="text-sm text-gray-500 mt-1">يجب أن يكون عمرك 18 سنة على الأقل</p>
                </div>
                
                <div class="flex space-x-reverse space-x-3 mt-6">
                    <button type="button" onclick="closeModal()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-bold">
                        إلغاء
                    </button>
                    <button type="submit" class="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-bold">
                        <i class="fas fa-search ml-2"></i>
                        ابحث عن أفضل عرض
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Complete Request Form -->
    <div id="completeRequestModal" class="modal">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 my-8">
            <div class="text-center mb-6">
                <div class="inline-block bg-blue-100 rounded-full p-4 mb-4">
                    <i class="fas fa-file-alt text-4xl text-blue-600"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">إكمال طلب التمويل</h3>
                <p class="text-gray-600">املأ بياناتك الكاملة لإتمام الطلب</p>
            </div>
            
            <form id="completeRequestForm" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-user text-blue-600 ml-2"></i>
                            الاسم الكامل
                        </label>
                        <input type="text" id="fullName" required 
                               class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-phone text-green-600 ml-2"></i>
                            رقم الجوال
                        </label>
                        <input type="tel" id="fullPhone" required 
                               class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-envelope text-purple-600 ml-2"></i>
                            البريد الإلكتروني (اختياري)
                        </label>
                        <input type="email" id="email" 
                               class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-id-card text-orange-600 ml-2"></i>
                            رقم الهوية
                        </label>
                        <input type="text" id="nationalId" required 
                               class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-building text-indigo-600 ml-2"></i>
                            جهة العمل
                        </label>
                        <input type="text" id="employer" required 
                               class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-briefcase text-pink-600 ml-2"></i>
                            المسمى الوظيفي
                        </label>
                        <input type="text" id="jobTitle" required 
                               class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-calendar-alt text-teal-600 ml-2"></i>
                            تاريخ بداية العمل
                        </label>
                        <input type="date" id="workStartDate" required 
                               class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-home text-red-600 ml-2"></i>
                            المدينة
                        </label>
                        <input type="text" id="city" required 
                               class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
                
                <div>
                    <label class="block text-gray-700 font-bold mb-2">
                        <i class="fas fa-comment text-gray-600 ml-2"></i>
                        ملاحظات إضافية (اختياري)
                    </label>
                    <textarea id="notes" rows="3"
                              class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                
                <!-- File Attachments Section -->
                <div class="border-t-2 border-gray-200 pt-6 mt-6">
                    <h4 class="text-lg font-bold text-gray-800 mb-4">
                        <i class="fas fa-paperclip text-blue-600 ml-2"></i>
                        المرفقات (اختياري)
                    </h4>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- 1. ملف الهوية -->
                        <div>
                            <label class="block text-gray-700 font-bold mb-2">
                                <i class="fas fa-id-card text-blue-600 ml-2"></i>
                                ملف الهوية
                            </label>
                            <input type="file" id="identityAttachment" accept="image/*,.pdf" onchange="previewFile(this, 'identityPreview')"
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                            <div id="identityPreview" class="mt-2"></div>
                            <p class="text-xs text-gray-500 mt-1">صيغة الملف: صورة أو PDF (حد أقصى: 20 ميغابايت)</p>
                        </div>
                        
                        <!-- 2. ملف السمة -->
                        <div>
                            <label class="block text-gray-700 font-bold mb-2">
                                <i class="fas fa-signature text-green-600 ml-2"></i>
                                ملف السمة
                            </label>
                            <input type="file" id="signatureAttachment" accept="image/*,.pdf" onchange="previewFile(this, 'signaturePreview')"
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100">
                            <div id="signaturePreview" class="mt-2"></div>
                            <p class="text-xs text-gray-500 mt-1">صيغة الملف: صورة أو PDF (حد أقصى: 20 ميغابايت)</p>
                        </div>
                        
                        <!-- 3. ملف تعريف الراتب -->
                        <div>
                            <label class="block text-gray-700 font-bold mb-2">
                                <i class="fas fa-file-contract text-purple-600 ml-2"></i>
                                ملف تعريف الراتب
                            </label>
                            <input type="file" id="salaryProfileAttachment" accept="image/*,.pdf" onchange="previewFile(this, 'salaryProfilePreview')"
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100">
                            <div id="salaryProfilePreview" class="mt-2"></div>
                            <p class="text-xs text-gray-500 mt-1">صيغة الملف: صورة أو PDF (حد أقصى: 20 ميغابايت)</p>
                        </div>
                        
                        <!-- 4. ملف التأمينات الاجتماعية -->
                        <div>
                            <label class="block text-gray-700 font-bold mb-2">
                                <i class="fas fa-shield-alt text-orange-600 ml-2"></i>
                                ملف التأمينات الاجتماعية
                            </label>
                            <input type="file" id="gosiAttachment" accept="image/*,.pdf" onchange="previewFile(this, 'gosiPreview')"
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100">
                            <div id="gosiPreview" class="mt-2"></div>
                            <p class="text-xs text-gray-500 mt-1">صيغة الملف: صورة أو PDF (حد أقصى: 20 ميغابايت)</p>
                        </div>

                        <!-- 5. شهادة الإعفاء الضريبي -->
                        <div>
                            <label class="block text-gray-700 font-bold mb-2">
                                <i class="fas fa-certificate text-blue-600 ml-2"></i>
                                شهادة الإعفاء الضريبي
                            </label>
                            <input type="file" id="taxExemptionAttachment" accept="image/*,.pdf" onchange="previewFile(this, 'taxExemptionPreview')"
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                            <div id="taxExemptionPreview" class="mt-2"></div>
                            <p class="text-xs text-gray-500 mt-1">صيغة الملف: صورة أو PDF (حد أقصى: 20 ميغابايت)</p>
                        </div>

                        <!-- 6. مستند إضافي 1 -->
                        <div>
                            <label class="block text-gray-700 font-bold mb-2">
                                <i class="fas fa-file-alt text-green-600 ml-2"></i>
                                مستند إضافي 1
                            </label>
                            <input type="file" id="additional1Attachment" accept="image/*,.pdf" onchange="previewFile(this, 'additional1Preview')"
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100">
                            <div id="additional1Preview" class="mt-2"></div>
                            <p class="text-xs text-gray-500 mt-1">صيغة الملف: صورة أو PDF (حد أقصى: 20 ميغابايت)</p>
                        </div>

                        <!-- 7. مستند إضافي 2 -->
                        <div>
                            <label class="block text-gray-700 font-bold mb-2">
                                <i class="fas fa-file-alt text-purple-600 ml-2"></i>
                                مستند إضافي 2
                            </label>
                            <input type="file" id="additional2Attachment" accept="image/*,.pdf" onchange="previewFile(this, 'additional2Preview')"
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100">
                            <div id="additional2Preview" class="mt-2"></div>
                            <p class="text-xs text-gray-500 mt-1">صيغة الملف: صورة أو PDF (حد أقصى: 20 ميغابايت)</p>
                        </div>

                        <!-- 8. مستند إضافي 3 -->
                        <div>
                            <label class="block text-gray-700 font-bold mb-2">
                                <i class="fas fa-file-alt text-orange-600 ml-2"></i>
                                مستند إضافي 3
                            </label>
                            <input type="file" id="additional3Attachment" accept="image/*,.pdf" onchange="previewFile(this, 'additional3Preview')"
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100">
                            <div id="additional3Preview" class="mt-2"></div>
                            <p class="text-xs text-gray-500 mt-1">صيغة الملف: صورة أو PDF (حد أقصى: 20 ميغابايت)</p>
                        </div>
                    </div>
                    
                    <!-- Progress bars container -->
                    <div id="uploadProgress" class="hidden mt-4 space-y-2"></div>
                    
                    <div class="bg-blue-50 border-r-4 border-blue-500 p-4 mt-4 rounded">
                        <p class="text-sm text-blue-800">
                            <i class="fas fa-info-circle ml-2"></i>
                            <strong>ملاحظة:</strong> جميع المرفقات اختيارية، لكن إرفاق المستندات يساعد في تسريع معالجة طلبك
                        </p>
                    </div>
                </div>
                
                <div class="flex space-x-reverse space-x-3 mt-6">
                    <button type="button" onclick="closeCompleteRequestModal()" 
                            class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-bold">
                        إلغاء
                    </button>
                    <button type="submit" id="submitRequestBtn"
                            class="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-bold">
                        <i class="fas fa-paper-plane ml-2"></i>
                        إرسال الطلب
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Success Modal -->
    <div id="successModal" class="modal hidden">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div class="text-center">
                <!-- Success Icon -->
                <div class="inline-block bg-green-100 rounded-full p-6 mb-4">
                    <i class="fas fa-check-circle text-6xl text-green-600"></i>
                </div>
                
                <!-- Success Message -->
                <h3 class="text-3xl font-bold text-gray-800 mb-3">🎉 تهانينا!</h3>
                <p class="text-xl text-gray-700 mb-2 font-semibold">تم إرسال طلبك بنجاح</p>
                <p class="text-gray-600 mb-4">سيتم المراجعة من شركة <span id="companyNameInSuccess" class="font-bold text-blue-600"></span></p>
                <p class="text-gray-600 mb-6">وسوف يتم التواصل معك قريباً</p>
                
                <!-- Attachments Count -->
                <div id="attachmentsCount" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 hidden">
                    <i class="fas fa-paperclip text-blue-600 ml-2"></i>
                    <span class="text-blue-800 font-medium">تم رفع <span id="attachmentNumber"></span> مرفق(ات) بنجاح</span>
                </div>
                
                <!-- Auto close message -->
                <p class="text-sm text-gray-500">
                    <i class="fas fa-info-circle ml-1"></i>
                    سيتم إغلاق هذه الرسالة تلقائياً بعد 3 ثوانٍ
                </p>
            </div>
        </div>
    </div>

    <!-- Error Modal -->
    <div id="errorModal" class="modal hidden">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div class="text-center">
                <!-- Error Icon -->
                <div class="inline-block bg-red-100 rounded-full p-6 mb-4">
                    <i class="fas fa-exclamation-circle text-6xl text-red-600"></i>
                </div>
                
                <!-- Error Message -->
                <h3 class="text-2xl font-bold text-gray-800 mb-3">❌ حدث خطأ</h3>
                <p class="text-gray-700 mb-6" id="errorMessage">حدث خطأ أثناء إرسال الطلب</p>
                
                <!-- Close Button -->
                <button onclick="closeErrorModal()" class="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold transition-colors">
                    <i class="fas fa-times ml-2"></i>
                    إغلاق
                </button>
            </div>
        </div>
    </div>

    <!-- Results Section -->
    <div id="resultsSection" class="container mx-auto px-4 py-8 hidden">
        <div class="max-w-6xl mx-auto">
            <!-- Qualification Status -->
            <div id="qualificationStatus" class="text-center mb-8">
                <!-- Will be filled dynamically -->
            </div>
            
            <!-- Debug filter reasons (shown only when enabled) -->
            <div id="filterDebug" class="hidden bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg p-4 mb-6 text-sm"></div>

            <!-- Best Offer Banner -->
            <div id="bestOfferBanner" class="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl shadow-2xl p-8 mb-8 text-center">
                <div class="inline-block bg-white/20 rounded-full p-4 mb-4">
                    <i id="bestOfferIcon" class="fas fa-trophy text-5xl"></i>
                </div>
                <h2 id="bestOfferTitle" class="text-3xl font-bold mb-2">🎉 وجدنا لك أفضل عرض!</h2>
                <p class="text-xl mb-4" id="bestOfferText">جاري التحميل...</p>
                
                <!-- Complete Request Button -->
                <button id="completeRequestBtn" onclick="openCompleteRequestModal()" 
                        class="bg-white text-green-600 px-8 py-4 rounded-lg font-bold text-xl hover:shadow-xl transition transform hover:scale-105 mt-4">
                    <i class="fas fa-clipboard-check ml-2"></i>
                    إكمال الطلب
                </button>
            </div>

            <!-- All Offers -->
            <div class="mb-8">
                <h3 class="text-2xl font-bold mb-6 text-gray-800">
                    <i class="fas fa-list ml-2 text-blue-600"></i>
                    جميع العروض المتاحة
                </h3>
                <div id="offersGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Offers will be loaded here -->
                </div>
            </div>
            
            <!-- Comparison Table -->
            <div id="comparisonTable" class="mb-8">
                <!-- Detailed comparison table will be loaded here -->
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-center space-x-reverse space-x-4">
                <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold">
                    <i class="fas fa-print ml-2"></i>
                    طباعة العروض
                </button>
                <button onclick="restartCalculator()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-bold">
                    <i class="fas fa-redo ml-2"></i>
                    حساب جديد
                </button>
            </div>
        </div>
    </div>

    <script>
        let calculationData = {};
        let customerData = {};
        let selectedBestOffer = null;
        let allBanks = [];
        let financingTypes = [];
        let allRates = [];
        const showFilterDebug = false;
        
        function toNumber(value, fallback = null) {
            const numeric = Number(value);
            return Number.isFinite(numeric) ? numeric : fallback;
        }

        function toNullableNumber(value) {
            if (value === null || value === undefined || value === '') {
                return null;
            }

            const numeric = Number(value);
            return Number.isFinite(numeric) ? numeric : null;
        }

        let isBirthdateSyncing = false;
        let hijriBirthdatePicker = null;

        // Umm al-Qura (official Saudi calendar). ICU `islamic` is often 1 day off.
        const hijriDisplayFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const hijriPartsFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        function normalizeArabicDigits(value) {
            if (!value) return '';
            const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
            const easternArabicDigits = '۰۱۲۳۴۵۶۷۸۹';
            return String(value).replace(/[٠-٩۰-۹]/g, (char) => {
                const arabicIndex = arabicDigits.indexOf(char);
                if (arabicIndex >= 0) return String(arabicIndex);
                const easternArabicIndex = easternArabicDigits.indexOf(char);
                return easternArabicIndex >= 0 ? String(easternArabicIndex) : char;
            });
        }

        function parseHijriInput(value) {
            const normalized = normalizeArabicDigits(value)
                .replace(/\u200f/g, '')
                .replace(/\u200e/g, '')
                .trim();
            if (!normalized) return null;

            const parts = normalized.split(/[^\d]+/).filter(Boolean);
            if (parts.length !== 3) return null;

            let year;
            let month;
            let day;

            if (parts[0].length === 4) {
                year = Number(parts[0]);
                month = Number(parts[1]);
                day = Number(parts[2]);
            } else if (parts[2].length === 4) {
                day = Number(parts[0]);
                month = Number(parts[1]);
                year = Number(parts[2]);
            } else {
                return null;
            }

            if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
            if (year < 1200 || year > 1700) return null;
            if (month < 1 || month > 12) return null;
            if (day < 1 || day > 30) return null;

            return { year, month, day };
        }

        function extractHijriPartsFromDate(dateObject) {
            const parts = hijriPartsFormatter.formatToParts(dateObject);
            const year = Number(parts.find((part) => part.type === 'year')?.value);
            const month = Number(parts.find((part) => part.type === 'month')?.value);
            const day = Number(parts.find((part) => part.type === 'day')?.value);
            if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
            return { year, month, day };
        }

        function formatGregorianValue(dateObject) {
            const year = dateObject.getFullYear();
            const month = String(dateObject.getMonth() + 1).padStart(2, '0');
            const day = String(dateObject.getDate()).padStart(2, '0');
            return \`\${year}-\${month}-\${day}\`;
        }

        function formatHijriDateFromGregorian(dateValue) {
            if (!dateValue) return '';
            const [year, month, day] = String(dateValue).split('-').map(Number);
            if (!year || !month || !day) return '';
            const gregorianDate = new Date(year, month - 1, day, 12, 0, 0);
            if (Number.isNaN(gregorianDate.getTime())) return '';
            return hijriDisplayFormatter.format(gregorianDate);
        }

        function findGregorianFromHijri(hijriParts) {
            const approxGregorianYear = hijriParts.year + 579;
            const start = new Date(approxGregorianYear - 2, 0, 1, 12, 0, 0);
            const end = new Date(approxGregorianYear + 2, 11, 31, 12, 0, 0);

            for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
                const currentHijriParts = extractHijriPartsFromDate(cursor);
                if (!currentHijriParts) continue;

                if (
                    currentHijriParts.year === hijriParts.year &&
                    currentHijriParts.month === hijriParts.month &&
                    currentHijriParts.day === hijriParts.day
                ) {
                    return formatGregorianValue(cursor);
                }
            }

            return '';
        }

        function initHijriBirthdatePicker() {
            const hijriInput = document.getElementById('customerBirthdateHijri');
            const gregorianInput = document.getElementById('customerBirthdate');
            if (!hijriInput || !gregorianInput) return;

            if (typeof flatpickr !== 'function' || typeof hijriCalendarPlugin !== 'function' || !window.luxon?.DateTime) {
                console.warn('Hijri picker dependencies not loaded, fallback to manual conversion.');
                return;
            }

            hijriBirthdatePicker = flatpickr(hijriInput, {
                locale: 'ar',
                disableMobile: true,
                dateFormat: 'Y-m-d',
                allowInput: true,
                plugins: [
                    hijriCalendarPlugin(window.luxon.DateTime, {
                        showHijriDates: true,
                        showHijriToggle: false
                    })
                ],
                onOpen: [(_, __, instance) => {
                    if (gregorianInput.value) {
                        instance.setDate(gregorianInput.value, false, 'Y-m-d');
                    }
                }],
                onChange: [(selectedDates) => {
                    if (!selectedDates.length || isBirthdateSyncing) return;
                    const gregorianValue = formatGregorianValue(selectedDates[0]);
                    isBirthdateSyncing = true;
                    gregorianInput.value = gregorianValue;
                    hijriInput.value = formatHijriDateFromGregorian(gregorianValue);
                    isBirthdateSyncing = false;
                }]
            });

            if (gregorianInput.value) {
                syncBirthdateFromGregorian();
            }
        }

        function syncBirthdateFromGregorian() {
            if (isBirthdateSyncing) return;
            const gregorianInput = document.getElementById('customerBirthdate');
            const hijriInput = document.getElementById('customerBirthdateHijri');
            if (!gregorianInput || !hijriInput) return;

            isBirthdateSyncing = true;
            hijriInput.value = formatHijriDateFromGregorian(gregorianInput.value);
            if (hijriBirthdatePicker && gregorianInput.value) {
                hijriBirthdatePicker.setDate(gregorianInput.value, false, 'Y-m-d');
            }
            isBirthdateSyncing = false;
        }

        function syncBirthdateFromHijri() {
            if (isBirthdateSyncing) return;
            const gregorianInput = document.getElementById('customerBirthdate');
            const hijriInput = document.getElementById('customerBirthdateHijri');
            if (!gregorianInput || !hijriInput) return;

            const parsedHijri = parseHijriInput(hijriInput.value);
            if (!parsedHijri) return;

            const gregorianValue = findGregorianFromHijri(parsedHijri);
            if (!gregorianValue) return;

            isBirthdateSyncing = true;
            gregorianInput.value = gregorianValue;
            hijriInput.value = formatHijriDateFromGregorian(gregorianValue);
            if (hijriBirthdatePicker) {
                hijriBirthdatePicker.setDate(gregorianValue, false, 'Y-m-d');
            }
            isBirthdateSyncing = false;
        }
        
        function sanitizeRequestData(data) {
            const sanitized = {};
            Object.keys(data).forEach((key) => {
                const value = data[key];
                sanitized[key] = value === undefined ? null : value;
            });
            return sanitized;
        }
        
        // File validation and preview
        function previewFile(input, previewId) {
            const preview = document.getElementById(previewId);
            const file = input.files[0];
            
            if (!file) {
                preview.innerHTML = '';
                return;
            }
            
            // Validate file size (20MB max)
            const maxSize = 20 * 1024 * 1024;
            if (file.size > maxSize) {
                alert('حجم الملف كبير جداً! الحد الأقصى: 20 ميغابايت');
                input.value = '';
                preview.innerHTML = '';
                return;
            }
            
            // Show preview
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.innerHTML = \`
                        <div class="flex items-center gap-3 bg-green-50 border border-green-300 rounded p-2">
                            <img src="\${e.target.result}" class="w-20 h-20 object-cover rounded border">
                            <div class="flex-1">
                                <p class="text-sm font-bold text-green-800">\${file.name}</p>
                                <p class="text-xs text-green-600">\${(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <i class="fas fa-check-circle text-2xl text-green-600"></i>
                        </div>
                    \`;
                };
                reader.readAsDataURL(file);
            } else {
                preview.innerHTML = \`
                    <div class="flex items-center gap-3 bg-green-50 border border-green-300 rounded p-2">
                        <i class="fas fa-file-pdf text-4xl text-red-600"></i>
                        <div class="flex-1">
                            <p class="text-sm font-bold text-green-800">\${file.name}</p>
                            <p class="text-xs text-green-600">\${(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <i class="fas fa-check-circle text-2xl text-green-600"></i>
                    </div>
                \`;
            }
        }
        
        // Load initial data
        async function loadData() {
            try {
                // Extract tenant from URL (for /c/tenant/calculator)
                const pathParts = window.location.pathname.split('/');
                const tenantSlug = pathParts[1] === 'c' ? pathParts[2] : null;
                
                // Get tenant_id if we have a tenant slug
                let tenantId = null;
                if (tenantSlug) {
                    try {
                        const tenantRes = await axios.get(\`/api/tenants\`);
                        const tenant = tenantRes.data.data.find(t => t.slug === tenantSlug);
                        if (tenant) {
                            tenantId = tenant.id;
                            console.log('🏢 Tenant ID:', tenantId);
                        }
                    } catch (error) {
                        console.error('Error getting tenant:', error);
                    }
                }
                
                // Build API URLs with tenant_id if available
                const banksUrl = tenantId ? \`/api/banks?tenant_id=\${tenantId}&include_global=0\` : '/api/banks';
                const ratesUrl = tenantId ? \`/api/rates?tenant_id=\${tenantId}\` : '/api/rates';
                
                const [banksRes, typesRes, ratesRes] = await Promise.all([
                    axios.get(banksUrl),
                    axios.get('/api/financing-types'),
                    axios.get(ratesUrl)
                ]);
                
                allBanks = (banksRes.data.data || []).map((bank) => ({
                    ...bank,
                    id: toNumber(bank.id, bank.id)
                }));
                financingTypes = typesRes.data.data || [];
                allRates = (ratesRes.data.data || []).map((rate) => ({
                    ...rate,
                    bank_id: toNumber(rate.bank_id, rate.bank_id),
                    financing_type_id: toNumber(rate.financing_type_id, rate.financing_type_id),
                    rate: toNumber(rate.rate, rate.rate),
                    min_duration: toNumber(rate.min_duration, rate.min_duration),
                    max_duration: toNumber(rate.max_duration, rate.max_duration),
                    min_salary: toNullableNumber(rate.min_salary),
                    max_salary: toNullableNumber(rate.max_salary),
                    min_amount: toNullableNumber(rate.min_amount),
                    max_amount: toNullableNumber(rate.max_amount),
                    is_active: toNumber(rate.is_active, rate.is_active)
                }));
                if (tenantId) {
                    const allowedBankIds = new Set(allBanks.map((bank) => bank.id));
                    allRates = allRates.filter((rate) => allowedBankIds.has(rate.bank_id));
                }
                
                console.log(\`✅ تم تحميل \${allBanks.length} بنك و \${allRates.length} نسبة\`);
                if (tenantId) {
                    console.log('✅ تم تحميل البيانات الخاصة بالشركة فقط');
                }
                
                // Populate financing types
                const typeSelect = document.getElementById('financingType');
                financingTypes.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type.id;
                    option.textContent = type.type_name;
                    typeSelect.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading data:', error);
                alert('خطأ في تحميل البيانات');
            }
        }
        
        // Step 1: Main form submission
        document.getElementById('calculatorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data (obligations not collected on calculator; affordability uses full salary)
            calculationData = {
                financing_type_id: parseInt(document.getElementById('financingType').value, 10),
                amount: parseFloat(document.getElementById('amount').value),
                salary: parseFloat(document.getElementById('salary').value),
                obligations: 0
            };
            
            const availableIncome = calculationData.salary;
            
            if (availableIncome < 1000) {
                alert('عذراً، الراتب الشهري غير كافٍ (يجب أن يكون 1000 ريال على الأقل)');
                return;
            }
            
            // Show modal
            document.getElementById('customerModal').classList.add('active');
        });
        
        // Step 2: Customer info submission
        document.getElementById('customerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            syncBirthdateFromHijri();
            syncBirthdateFromGregorian();
            
            // Get customer info
            customerData = {
                name: document.getElementById('customerName').value,
                phone: document.getElementById('customerPhone').value,
                birthdate: document.getElementById('customerBirthdate').value
            };
            
            // Close modal
            closeModal();
            
            // Save customer initial data to database
            try {
                // Extract tenant from URL (for /c/tenant/calculator) or use null for /calculator
                const pathParts = window.location.pathname.split('/');
                const tenantSlug = pathParts[1] === 'c' ? pathParts[2] : null;
                
                console.log('🔍 Saving customer data:', {
                    name: customerData.name,
                    phone: customerData.phone,
                    birthdate: customerData.birthdate,
                    salary: calculationData.salary,
                    amount: calculationData.amount,
                    tenantSlug: tenantSlug
                });
                
                const response = await axios.post('/api/calculator/save-customer', {
                    name: customerData.name,
                    phone: customerData.phone,
                    birthdate: customerData.birthdate,
                    salary: calculationData.salary,
                    amount: calculationData.amount,
                    obligations: calculationData.obligations,
                    financing_type_id: calculationData.financing_type_id,
                    tenant_slug: tenantSlug,
                    solutions: []
                });
                
                console.log('✅ تم حفظ بيانات العميل في قاعدة البيانات:', response.data);
            } catch (error) {
                console.error('❌ خطأ في حفظ بيانات العميل:', error);
                if (error.response) {
                    console.error('Error details:', error.response.data);
                }
                // Continue anyway - don't block the user
            }
            
            // Show loading
            document.getElementById('resultsSection').classList.remove('hidden');
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
            
            // Calculate all offers
            await calculateAllOffers();
        });
        
        // Step 3: Complete Request Form submission
        document.getElementById('completeRequestForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = e.target.querySelector('button[type="submit"]');
            const resetSubmitButton = () => {
                if (!submitBtn) return;
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane ml-2"></i> إرسال الطلب';
            };

            if (!customerData || !customerData.phone || !customerData.birthdate) {
                showErrorModal('الرجاء إكمال بيانات العميل أولاً قبل إرسال الطلب.');
                resetSubmitButton();
                return;
            }

            if (!selectedBestOffer || !selectedBestOffer.bank || !selectedBestOffer.bestCalculation) {
                showErrorModal('لا يوجد عرض تمويل محدد. الرجاء إعادة الحساب ثم المحاولة مرة أخرى.');
                resetSubmitButton();
                return;
            }
            
            // Get file attachments info (filename only for now)
            const identityFile = document.getElementById('identityAttachment').files[0];
            const signatureFile = document.getElementById('signatureAttachment').files[0];
            const salaryProfileFile = document.getElementById('salaryProfileAttachment').files[0];
            const gosiFile = document.getElementById('gosiAttachment').files[0];
            const taxExemptionFile = document.getElementById('taxExemptionAttachment').files[0];
            const additional1File = document.getElementById('additional1Attachment').files[0];
            const additional2File = document.getElementById('additional2Attachment').files[0];
            const additional3File = document.getElementById('additional3Attachment').files[0];

            const pathParts = window.location.pathname.split('/');
            const tenantSlug = pathParts[1] === 'c' ? pathParts[2] : null;
            
            // Build request data object
            const requestData = {
                full_name: document.getElementById('fullName').value,
                phone: document.getElementById('fullPhone').value,
                email: document.getElementById('email').value || null,
                national_id: document.getElementById('nationalId').value,
                birthdate: customerData.birthdate,
                employer: document.getElementById('employer').value,
                job_title: document.getElementById('jobTitle').value,
                monthly_salary: calculationData.salary,
                work_start_date: document.getElementById('workStartDate').value,
                city: document.getElementById('city').value,
                financing_type_id: calculationData.financing_type_id,
                bank_id: selectedBestOffer.bank.id,
                requested_amount: calculationData.amount,
                monthly_obligations: calculationData.obligations,
                duration: selectedBestOffer.bestCalculation.duration,
                monthly_payment: selectedBestOffer.bestCalculation.monthlyPayment,
                notes: document.getElementById('notes').value || null,
                tenant_slug: tenantSlug,
                // Store filenames for tracking
                identity_attachment_filename: identityFile ? identityFile.name : null,
                signature_attachment_filename: signatureFile ? signatureFile.name : null,
                salary_profile_attachment_filename: salaryProfileFile ? salaryProfileFile.name : null,
                gosi_attachment_filename: gosiFile ? gosiFile.name : null,
                tax_exemption_attachment_filename: taxExemptionFile ? taxExemptionFile.name : null,
                additional_1_attachment_filename: additional1File ? additional1File.name : null,
                additional_2_attachment_filename: additional2File ? additional2File.name : null,
                additional_3_attachment_filename: additional3File ? additional3File.name : null
            };
            const sanitizedRequestData = sanitizeRequestData(requestData);
            const missingFields = Object.keys(requestData).filter((key) => requestData[key] === undefined);
            
            try {
                // Show loading message
                const originalText = submitBtn ? submitBtn.innerHTML : '';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i> جاري الإرسال...';
                }
                
                // Step 1: Create the financing request first
                const response = await axios.post('/api/calculator/submit-request', sanitizedRequestData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.data.success) {
                    const requestId = response.data.request_id;
                    console.log('✅ Request created successfully:', { requestId, response: response.data });
                    
                    // Step 2: Upload attachments if any exist
                    const attachments = [
                        { file: identityFile, type: 'identity', label: 'ملف الهوية' },
                        { file: signatureFile, type: 'signature', label: 'ملف السمة' },
                        { file: salaryProfileFile, type: 'salary_profile', label: 'ملف تعريف الراتب' },
                        { file: gosiFile, type: 'gosi', label: 'ملف التأمينات الاجتماعية' },
                        { file: taxExemptionFile, type: 'tax_exemption', label: 'شهادة الإعفاء الضريبي' },
                        { file: additional1File, type: 'additional_1', label: 'مستند إضافي 1' },
                        { file: additional2File, type: 'additional_2', label: 'مستند إضافي 2' },
                        { file: additional3File, type: 'additional_3', label: 'مستند إضافي 3' }
                    ].filter(att => att.file);
                    
                    if (attachments.length > 0) {
                        if (submitBtn) {
                            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i> جاري رفع المرفقات...';
                        }
                        
                        // Show progress container
                        const progressContainer = document.getElementById('uploadProgress');
                        progressContainer.classList.remove('hidden');
                        progressContainer.innerHTML = '';
                        
                        let uploadedCount = 0;
                        
                        for (const attachment of attachments) {
                            // Add progress bar
                            const progressId = \`progress-\${attachment.type}\`;
                            progressContainer.innerHTML += \`
                                <div class="bg-gray-100 rounded p-3">
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="text-sm font-bold text-gray-700">\${attachment.label}</span>
                                        <span id="\${progressId}-status" class="text-xs text-gray-600">جاري الرفع...</span>
                                    </div>
                                    <div class="w-full bg-gray-300 rounded-full h-2">
                                        <div id="\${progressId}-bar" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                                    </div>
                                </div>
                            \`;
                            
                            const formData = new FormData();
                            formData.append('file', attachment.file);
                            formData.append('request_id', requestId);
                            formData.append('attachment_type', attachment.type);
                            
                            console.log('📤 Uploading attachment:', { 
                                requestId, 
                                type: attachment.type, 
                                fileName: attachment.file.name 
                            });
                            
                            try {
                                // Simulate progress (since R2 upload doesn't report progress)
                                const progressBar = document.getElementById(\`\${progressId}-bar\`);
                                const progressStatus = document.getElementById(\`\${progressId}-status\`);
                                
                                progressBar.style.width = '30%';
                                
                                await axios.post('/api/attachments/upload', formData, {
                                    headers: {
                                        'Content-Type': 'multipart/form-data'
                                    }
                                });
                                
                                progressBar.style.width = '100%';
                                progressBar.classList.remove('bg-blue-600');
                                progressBar.classList.add('bg-green-600');
                                progressStatus.textContent = '✓ تم الرفع';
                                progressStatus.classList.remove('text-gray-600');
                                progressStatus.classList.add('text-green-600');
                                uploadedCount++;
                            } catch (uploadError) {
                                console.error(\`Error uploading \${attachment.type}:\`, uploadError);
                                const progressBar = document.getElementById(\`\${progressId}-bar\`);
                                const progressStatus = document.getElementById(\`\${progressId}-status\`);
                                progressBar.style.width = '100%';
                                progressBar.classList.remove('bg-blue-600');
                                progressBar.classList.add('bg-red-600');
                                progressStatus.textContent = '✗ فشل الرفع';
                                progressStatus.classList.remove('text-gray-600');
                                progressStatus.classList.add('text-red-600');
                            }
                        }
                        
                        if (submitBtn) {
                            submitBtn.innerHTML = '<i class="fas fa-check ml-2"></i> اكتمل الرفع!';
                        }
                    }
                    
                    closeCompleteRequestModal();
                    
                    // Show success modal
                    showSuccessModal(attachments.length);
                    
                    // Reset calculator after 3 seconds
                    setTimeout(() => {
                        restartCalculator();
                    }, 3000);
                } else {
                    showErrorModal(response.data.error || response.data.message || 'حدث خطأ غير متوقع');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }
                }
            } catch (error) {
                console.error('Error submitting request:', error);
                dd({
                    action: 'submit-request-error',
                    endpoint: '/api/calculator/submit-request',
                    error: error?.response || error?.message || error
                });
                showErrorModal('حدث خطأ أثناء إرسال الطلب. الرجاء المحاولة مرة أخرى.');
                resetSubmitButton();
            }
        });
        
        async function calculateAllOffers() {
            const availableIncome = calculationData.salary - calculationData.obligations;
            const maxMonthlyPayment = availableIncome * 0.33; // 33% من الدخل المتاح
            const matchesSalaryRange = (rate) => {
                const minSalary = rate.min_salary;
                const maxSalary = rate.max_salary;
                const minOk = minSalary === null || minSalary === undefined || minSalary <= calculationData.salary;
                const maxOk = maxSalary === null || maxSalary === undefined || maxSalary >= calculationData.salary;
                return minOk && maxOk;
            };
            const matchesAmountRange = (rate) => {
                const minAmount = rate.min_amount;
                const maxAmount = rate.max_amount;
                const minOk = minAmount === null || minAmount === undefined || minAmount <= calculationData.amount;
                const maxOk = maxAmount === null || maxAmount === undefined || maxAmount >= calculationData.amount;
                return minOk && maxOk;
            };
            const debugBox = document.getElementById('filterDebug');
            if (debugBox) {
                debugBox.classList.add('hidden');
                debugBox.innerHTML = '';
            }
            
            // Determine qualification status
            const isQualified = maxMonthlyPayment >= 500; // الحد الأدنى للقسط الشهري
            
            // Display qualification status
            const qualificationDiv = document.getElementById('qualificationStatus');
            qualificationDiv.innerHTML = \`
                <div class="inline-block qualification-badge \${isQualified ? 'qualified' : 'not-qualified'}">
                    <i class="fas fa-\${isQualified ? 'check-circle' : 'times-circle'} ml-2"></i>
                    \${isQualified ? 'مؤهل للحصول على التمويل' : 'غير مؤهل للحصول على التمويل'}
                </div>
                <div class="mt-4 text-gray-700">
                    <p>الدخل المتاح: <span class="font-bold text-blue-600">\${availableIncome.toLocaleString('ar-SA')} ريال</span></p>
                    <p>القدرة الشرائية: <span class="font-bold text-green-600">\${maxMonthlyPayment.toLocaleString('ar-SA')} ريال</span></p>
                </div>
            \`;
            
            if (!isQualified) {
                setBestOfferBannerState('no-offers');
                document.getElementById('offersGrid').innerHTML = '<div class="col-span-full text-center text-gray-600 text-lg">عذراً، القدرة الشرائية الحالية غير كافية للحصول على تمويل</div>';
                return;
            }
            
            // Filter rates for selected financing type
            const applicableRates = allRates.filter(rate => 
                rate.financing_type_id === calculationData.financing_type_id &&
                rate.is_active === 1 &&
                matchesSalaryRange(rate) &&
                matchesAmountRange(rate)
            );

            let mismatchType = [];
            let inactiveRates = [];
            let salaryOutOfRange = [];
            let amountOutOfRange = [];

            if (showFilterDebug && debugBox) {
                mismatchType = allRates.filter(rate => rate.financing_type_id !== calculationData.financing_type_id);
                inactiveRates = allRates.filter(rate => rate.is_active !== 1);
                salaryOutOfRange = allRates.filter(rate =>
                    rate.financing_type_id === calculationData.financing_type_id &&
                    rate.is_active === 1 &&
                    !matchesSalaryRange(rate)
                );
                amountOutOfRange = allRates.filter(rate =>
                    rate.financing_type_id === calculationData.financing_type_id &&
                    rate.is_active === 1 &&
                    matchesSalaryRange(rate) &&
                    !matchesAmountRange(rate)
                );
            }
            
            if (applicableRates.length === 0) {
                if (showFilterDebug && debugBox) {
                    debugBox.innerHTML =
                        '<div class="font-bold mb-2">تفاصيل التصفية:</div>' +
                        '<div>إجمالي العروض: ' + allRates.length + '</div>' +
                        '<div>اختلاف نوع التمويل: ' + mismatchType.length + '</div>' +
                        '<div>عروض غير مفعّلة: ' + inactiveRates.length + '</div>' +
                        '<div>خارج نطاق الراتب: ' + salaryOutOfRange.length + '</div>' +
                        '<div>خارج نطاق مبلغ التمويل: ' + amountOutOfRange.length + '</div>' +
                        '<div>مطابقة للشروط: ' + applicableRates.length + '</div>' +
                        '<div>الحد الأقصى للقسط الشهري: ' + maxMonthlyPayment.toLocaleString('ar-SA') + ' ريال</div>' +
                        '<div class="mt-2">عروض ضمن القدرة الشرائية: 0</div>';
                    debugBox.classList.remove('hidden');
                }
                setBestOfferBannerState('no-offers');
                document.getElementById('bestOfferText').textContent = 'عذراً، لا توجد عروض متاحة حالياً تناسب معاييرك';
                document.getElementById('completeRequestBtn').classList.add('hidden');
                return;
            }
            
            // Calculate offers for each bank
            let affordableOfferCount = 0;
            const unaffordableDetails = [];
            let skippedMissingBank = 0;
            const missingBankIds = new Set();
            let skippedInvalidDuration = 0;
            const offers = applicableRates.map(rate => {
                const bank = allBanks.find(b => b.id === rate.bank_id);
                if (!bank) {
                    skippedMissingBank += 1;
                    if (rate.bank_id !== undefined && rate.bank_id !== null) {
                        missingBankIds.add(rate.bank_id);
                    }
                    return null;
                }
                const calculations = [];
                const minDuration = toNumber(rate.min_duration);
                const maxDuration = toNumber(rate.max_duration);
                if (!Number.isFinite(minDuration) || !Number.isFinite(maxDuration) || minDuration <= 0 || maxDuration <= 0) {
                    skippedInvalidDuration += 1;
                    return null;
                }
                let minMonthlyPayment = null;
                let minMonthlyMonth = null;
                const durationPayments = [];
                
                // Try different durations
                for (let months = minDuration; months <= maxDuration; months += 1) {
                    const monthlyRate = rate.rate / 100 / 12;
                    const monthlyPayment = (calculationData.amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                                          (Math.pow(1 + monthlyRate, months) - 1);
                    
                    if (minMonthlyPayment === null || monthlyPayment < minMonthlyPayment) {
                        minMonthlyPayment = monthlyPayment;
                        minMonthlyMonth = months;
                    }
                    
                    if (months === minDuration || months === maxDuration || months % 12 === 0) {
                        durationPayments.push({
                            months: months,
                            monthlyPayment: Math.round(monthlyPayment * 100) / 100
                        });
                    }
                    
                    if (monthlyPayment <= maxMonthlyPayment) {
                        const totalPayment = monthlyPayment * months;
                        const totalInterest = totalPayment - calculationData.amount;
                        
                        calculations.push({
                            duration: months,
                            monthlyPayment: Math.round(monthlyPayment * 100) / 100,
                            totalPayment: Math.round(totalPayment * 100) / 100,
                            totalInterest: Math.round(totalInterest * 100) / 100
                        });
                    }
                }
                
                // Get best duration (lowest total interest)
                const bestCalc = calculations.sort((a, b) => a.totalInterest - b.totalInterest)[0];
                
                if (bestCalc) {
                    affordableOfferCount += 1;
                } else if (minMonthlyPayment !== null) {
                    unaffordableDetails.push({
                        bankName: bank.bank_name,
                        rate: rate.rate,
                        minPayment: Math.round(minMonthlyPayment * 100) / 100,
                        minPaymentMonth: minMonthlyMonth,
                        minDuration: minDuration,
                        maxDuration: maxDuration,
                        durationPayments: durationPayments
                    });
                }

                return {
                    bank: bank,
                    rate: rate.rate,
                    bestCalculation: bestCalc,
                    allCalculations: calculations
                };
            }).filter(offer => offer && offer.bestCalculation);

            if (showFilterDebug && debugBox) {
                const unaffordableList = unaffordableDetails.length
                    ? '<div class="mt-2 font-bold">تفاصيل العروض غير المناسبة:</div>' +
                      unaffordableDetails.map(detail =>
                          '<div>• ' + detail.bankName +
                          ' | نسبة: ' + detail.rate + '%' +
                          ' | أقل قسط متاح: ' + detail.minPayment.toLocaleString('ar-SA') +
                          ' (عند ' + detail.minPaymentMonth + ' شهر)' +
                          ' ريال | المدد: ' + detail.minDuration + '-' + detail.maxDuration + ' شهر' +
                          '<div class="mr-4 text-xs text-gray-700">الأقساط حسب المدة: ' +
                          detail.durationPayments.map(payment =>
                              payment.months + 'ش=' + payment.monthlyPayment.toLocaleString('ar-SA')
                          ).join(' | ') +
                          '</div></div>'
                      ).join('')
                    : '';

                debugBox.innerHTML =
                    '<div class="font-bold mb-2">تفاصيل التصفية:</div>' +
                    '<div>إجمالي العروض: ' + allRates.length + '</div>' +
                    '<div>اختلاف نوع التمويل: ' + mismatchType.length + '</div>' +
                    '<div>عروض غير مفعّلة: ' + inactiveRates.length + '</div>' +
                    '<div>خارج نطاق الراتب: ' + salaryOutOfRange.length + '</div>' +
                    '<div>خارج نطاق مبلغ التمويل: ' + amountOutOfRange.length + '</div>' +
                    '<div>مطابقة للشروط: ' + applicableRates.length + '</div>' +
                    '<div>تم استبعادها لعدم وجود بنك: ' + skippedMissingBank + '</div>' +
                    '<div>معرفات البنوك المفقودة: ' + (missingBankIds.size ? Array.from(missingBankIds).join(', ') : '-') + '</div>' +
                    '<div>تم استبعادها لمدد غير صالحة: ' + skippedInvalidDuration + '</div>' +
                    '<div>الحد الأقصى للقسط الشهري: ' + maxMonthlyPayment.toLocaleString('ar-SA') + ' ريال</div>' +
                    '<div class="mt-2">عروض ضمن القدرة الشرائية: ' + affordableOfferCount + '</div>' +
                    unaffordableList;
                debugBox.classList.remove('hidden');
            }
            
            // Sort by total interest (best first)
            offers.sort((a, b) => a.bestCalculation.totalInterest - b.bestCalculation.totalInterest);
            
            // Display results
            displayOffers(offers);
            
            // Update customer record with calculation results
            if (offers.length > 0 && customerData && customerData.phone) {
                const bestOffer = offers[0];
                try {
                    const pathParts = window.location.pathname.split('/');
                    const tenantSlug = pathParts[1] === 'c' ? pathParts[2] : null;
                    
                    console.log('💾 Updating customer with calculation results:', {
                        phone: customerData.phone,
                        best_bank: bestOffer.bank.bank_name,
                        duration: bestOffer.bestCalculation.duration,
                        monthly_payment: bestOffer.bestCalculation.monthlyPayment
                    });
                    
                    await axios.post('/api/calculator/save-customer', {
                        name: customerData.name,
                        phone: customerData.phone,
                        birthdate: customerData.birthdate,
                        salary: calculationData.salary,
                        amount: calculationData.amount,
                        obligations: calculationData.obligations,
                        financing_type_id: calculationData.financing_type_id,
                        duration_months: bestOffer.bestCalculation.duration,
                        best_bank_id: bestOffer.bank.id,
                        best_rate: bestOffer.rate,
                        monthly_payment: bestOffer.bestCalculation.monthlyPayment,
                        total_payment: bestOffer.bestCalculation.totalPayment,
                        tenant_slug: tenantSlug
                    });
                    
                    console.log('✅ تم تحديث بيانات العميل بنتائج الحساب');
                } catch (error) {
                    console.error('❌ خطأ في تحديث بيانات العميل:', error);
                }
            }
        }
        
        function displayOffers(offers) {
            if (offers.length === 0) {
                setBestOfferBannerState('no-offers');
                document.getElementById('bestOfferText').textContent = 'العروض المتاحة لا تحتوي على قسط شهري ضمن قدرتك الشرائية حالياً';
                document.getElementById('completeRequestBtn').classList.add('hidden');
                return;
            }
            
            const bestOffer = offers[0];
            selectedBestOffer = bestOffer;
            
            // Update best offer banner
            setBestOfferBannerState('best');
            document.getElementById('bestOfferText').innerHTML = \`
                <span class="text-2xl">أفضل عرض من <span class="font-bold">\${bestOffer.bank.bank_name}</span></span>
                <br>
                <span class="text-lg">قسط شهري: \${bestOffer.bestCalculation.monthlyPayment.toLocaleString('ar-SA')} ريال</span>
            \`;
            
            // Show complete request button
            document.getElementById('completeRequestBtn').classList.remove('hidden');
            
            // Display all offers (cards)
            const offersGrid = document.getElementById('offersGrid');
            offersGrid.innerHTML = offers.map((offer, index) => {
                const isBest = index === 0;
                return \`
                    <div class="bank-card \${isBest ? 'best-offer' : 'bg-white'} rounded-xl shadow-lg p-6 relative">
                        \${isBest ? '<div class="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-tr-xl rounded-bl-xl font-bold"><i class="fas fa-star ml-1"></i>الأفضل</div>' : ''}
                        
                        <div class="text-center mb-4 \${isBest ? 'mt-6' : ''}">
                            <div class="inline-block bg-blue-100 rounded-full p-3 mb-2">
                                <i class="fas fa-university text-3xl text-blue-600"></i>
                            </div>
                            <h4 class="text-xl font-bold text-gray-800">\${offer.bank.bank_name}</h4>
                        </div>
                        
                        <div class="space-y-3">
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <div class="text-sm text-gray-600">نسبة الفائدة</div>
                                <div class="text-lg font-bold text-blue-600">\${offer.rate}%</div>
                            </div>
                            
                            <div class="bg-blue-50 p-3 rounded-lg">
                                <div class="text-sm text-gray-600">القسط الشهري</div>
                                <div class="text-2xl font-bold text-blue-600">\${offer.bestCalculation.monthlyPayment.toLocaleString('ar-SA')} <span class="text-sm">ريال</span></div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-2">
                                <div class="bg-gray-50 p-2 rounded text-center">
                                    <div class="text-xs text-gray-600">المدة</div>
                                    <div class="font-bold">\${offer.bestCalculation.duration} شهر</div>
                                </div>
                                <div class="bg-gray-50 p-2 rounded text-center">
                                    <div class="text-xs text-gray-600">إجمالي الفائدة</div>
                                    <div class="font-bold text-orange-600">\${offer.bestCalculation.totalInterest.toLocaleString('ar-SA')}</div>
                                </div>
                            </div>
                            
                            <div class="bg-purple-50 p-3 rounded-lg">
                                <div class="text-sm text-gray-600">إجمالي المبلغ</div>
                                <div class="text-xl font-bold text-purple-600">\${offer.bestCalculation.totalPayment.toLocaleString('ar-SA')} <span class="text-sm">ريال</span></div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
            
            // Display comparison table
            displayComparisonTable(offers);
        }
        
        function displayComparisonTable(offers) {
            const comparisonTable = document.getElementById('comparisonTable');
            if (!comparisonTable) return;
            
            comparisonTable.innerHTML = \`
                <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h3 class="text-2xl font-bold text-gray-800 mb-2">
                                <i class="fas fa-table text-blue-600 ml-2"></i>
                                جدول المقارنة التفصيلي
                            </h3>
                            <p class="text-gray-600">قارن جميع العروض المتاحة بسهولة</p>
                        </div>
                        <button onclick="printResults()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                            <i class="fas fa-print ml-2"></i>
                            طباعة النتائج
                        </button>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full text-right">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-4 py-3 text-gray-700 font-bold">البنك</th>
                                    <th class="px-4 py-3 text-gray-700 font-bold">نسبة الفائدة</th>
                                    <th class="px-4 py-3 text-gray-700 font-bold">القسط الشهري</th>
                                    <th class="px-4 py-3 text-gray-700 font-bold">المدة</th>
                                    <th class="px-4 py-3 text-gray-700 font-bold">إجمالي الفائدة</th>
                                    <th class="px-4 py-3 text-gray-700 font-bold">إجمالي المبلغ</th>
                                    <th class="px-4 py-3 text-gray-700 font-bold">التوفير</th>
                                </tr>
                            </thead>
                            <tbody>
                                \${offers.map((offer, index) => {
                                    const isBest = index === 0;
                                    const savings = index > 0 ? offer.bestCalculation.totalInterest - offers[0].bestCalculation.totalInterest : 0;
                                    return \`
                                        <tr class="\${isBest ? 'bg-green-50 font-bold' : 'hover:bg-gray-50'}">
                                            <td class="px-4 py-3 border-t">
                                                \${offer.bank.bank_name}
                                                \${isBest ? '<span class="mr-2 text-green-600"><i class="fas fa-star"></i></span>' : ''}
                                            </td>
                                            <td class="px-4 py-3 border-t">\${offer.rate}%</td>
                                            <td class="px-4 py-3 border-t text-blue-600">\${offer.bestCalculation.monthlyPayment.toLocaleString('ar-SA')} ر.س</td>
                                            <td class="px-4 py-3 border-t">\${offer.bestCalculation.duration} شهر</td>
                                            <td class="px-4 py-3 border-t text-orange-600">\${offer.bestCalculation.totalInterest.toLocaleString('ar-SA')} ر.س</td>
                                            <td class="px-4 py-3 border-t text-purple-600">\${offer.bestCalculation.totalPayment.toLocaleString('ar-SA')} ر.س</td>
                                            <td class="px-4 py-3 border-t \${isBest ? 'text-green-600' : 'text-red-600'}">
                                                \${isBest ? 'الأفضل ✓' : '+' + savings.toLocaleString('ar-SA') + ' ر.س'}
                                            </td>
                                        </tr>
                                    \`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Smart Recommendations -->
                    <div class="mt-6 bg-blue-50 p-4 rounded-lg">
                        <h4 class="font-bold text-blue-800 mb-2">
                            <i class="fas fa-lightbulb text-yellow-500 ml-2"></i>
                            نصائح ذكية
                        </h4>
                        <ul class="text-sm text-gray-700 space-y-2">
                            \${generateSmartRecommendations(offers)}
                        </ul>
                    </div>
                </div>
            \`;
        }
        
        function generateSmartRecommendations(offers) {
            if (offers.length === 0) return '';
            
            const recommendations = [];
            const bestOffer = offers[0];
            
            // Recommendation 1: Best bank
            recommendations.push(\`<li><i class="fas fa-check-circle text-green-600 ml-2"></i>عرض <strong>\${bestOffer.bank.bank_name}</strong> هو الأفضل بقسط شهري \${bestOffer.bestCalculation.monthlyPayment.toLocaleString('ar-SA')} ريال</li>\`);
            
            // Recommendation 2: Savings
            if (offers.length > 1) {
                const savings = offers[1].bestCalculation.totalInterest - bestOffer.bestCalculation.totalInterest;
                recommendations.push(\`<li><i class="fas fa-piggy-bank text-green-600 ml-2"></i>ستوفر <strong>\${savings.toLocaleString('ar-SA')} ريال</strong> بالمقارنة مع ثاني أفضل عرض</li>\`);
            }
            
            // Recommendation 3: Duration advice
            if (bestOffer.bestCalculation.duration >= 60) {
                recommendations.push(\`<li><i class="fas fa-clock text-orange-600 ml-2"></i>المدة طويلة (\${bestOffer.bestCalculation.duration} شهر). حاول تقليصها إن أمكن لتوفير المزيد من الفوائد</li>\`);
            } else {
                recommendations.push(\`<li><i class="fas fa-clock text-green-600 ml-2"></i>مدة التمويل معقولة (\${bestOffer.bestCalculation.duration} شهر)</li>\`);
            }
            
            // Recommendation 4: Monthly payment
            const paymentRatio = (bestOffer.bestCalculation.monthlyPayment / calculationData.salary) * 100;
            if (paymentRatio <= 25) {
                recommendations.push(\`<li><i class="fas fa-check-circle text-green-600 ml-2"></i>القسط الشهري يشكل \${paymentRatio.toFixed(1)}% فقط من راتبك - نسبة ممتازة!</li>\`);
            } else {
                recommendations.push(\`<li><i class="fas fa-exclamation-triangle text-orange-600 ml-2"></i>القسط الشهري يشكل \${paymentRatio.toFixed(1)}% من راتبك - تأكد من قدرتك على الالتزام</li>\`);
            }
            
            return recommendations.join('');
        }
        
        function printResults() {
            window.print();
        }

        function setBestOfferBannerState(state) {
            const banner = document.getElementById('bestOfferBanner');
            const title = document.getElementById('bestOfferTitle');
            const icon = document.getElementById('bestOfferIcon');
            if (!banner || !title || !icon) return;
            
            if (state === 'no-offers') {
                banner.classList.remove('from-green-500', 'to-green-600');
                banner.classList.add('from-yellow-500', 'to-orange-500');
                icon.className = 'fas fa-info-circle text-5xl';
                title.textContent = 'لا توجد عروض مناسبة حالياً';
                return;
            }
            
            // default: best offer
            banner.classList.remove('from-yellow-500', 'to-orange-500');
            banner.classList.add('from-green-500', 'to-green-600');
            icon.className = 'fas fa-trophy text-5xl';
            title.textContent = '🎉 وجدنا لك أفضل عرض!';
        }
        
        function openCompleteRequestModal() {
            // Pre-fill some data
            document.getElementById('fullName').value = customerData.name;
            document.getElementById('fullPhone').value = customerData.phone;
            
            // Show modal
            document.getElementById('completeRequestModal').classList.add('active');
        }
        
        function closeModal() {
            document.getElementById('customerModal').classList.remove('active');
        }
        
        function closeCompleteRequestModal() {
            document.getElementById('completeRequestModal').classList.remove('active');
        }
        
        function restartCalculator() {
            document.getElementById('resultsSection').classList.add('hidden');
            document.getElementById('calculatorForm').reset();
            calculationData = {};
            customerData = {};
            selectedBestOffer = null;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        function showSuccessModal(attachmentCount) {
            const modal = document.getElementById('successModal');
            const companyName = window.TENANT_NAME || 'الشركة';
            
            // Set company name
            document.getElementById('companyNameInSuccess').textContent = companyName;
            
            // Show attachments count if any
            if (attachmentCount > 0) {
                document.getElementById('attachmentsCount').classList.remove('hidden');
                document.getElementById('attachmentNumber').textContent = attachmentCount;
            } else {
                document.getElementById('attachmentsCount').classList.add('hidden');
            }
            
            // Show modal
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            
            // Auto close after 3 seconds
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }, 3000);
        }
        
        function showErrorModal(message) {
            const modal = document.getElementById('errorModal');
            document.getElementById('errorMessage').textContent = message;
            
            // Show modal
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
        
        window.closeErrorModal = function() {
            const modal = document.getElementById('errorModal');
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }

        const customerBirthdateInput = document.getElementById('customerBirthdate');
        const customerBirthdateHijriInput = document.getElementById('customerBirthdateHijri');
        if (customerBirthdateInput) {
            customerBirthdateInput.addEventListener('change', syncBirthdateFromGregorian);
            customerBirthdateInput.addEventListener('input', syncBirthdateFromGregorian);
        }
        if (customerBirthdateHijriInput) {
            customerBirthdateHijriInput.addEventListener('change', syncBirthdateFromHijri);
            customerBirthdateHijriInput.addEventListener('blur', syncBirthdateFromHijri);
        }
        initHijriBirthdatePicker();
        
        // Load data on page load
        loadData();

    </script>
</body>
</html>
`;
