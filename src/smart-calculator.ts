export const smartCalculator = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>حاسبة التمويل الذكية</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
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
                <a href="/" class="text-2xl font-bold text-blue-600">
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
                    
                    <!-- اختيار عميل (عرض عملاء الشركة فقط) -->
                    <div id="calcClientLookupWrap">
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-user text-amber-600 ml-2"></i>
                            اختر العميل (اختياري)
                        </label>
                        <p class="text-sm text-gray-500 mb-2">لتحميل الراتب والالتزامات المحفوظة</p>
                        <select id="calcCustomerSelect" class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">-- اختر العميل --</option>
                        </select>
                        <p id="calcLookupMessage" class="text-sm mt-2 hidden"></p>
                    </div>
                    <!-- الالتزامات المالية (جدول + إجمالي شهري) -->
                    <div id="calcObligationsSection" class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 class="text-sm font-bold text-gray-700 mb-2">
                            <i class="fas fa-credit-card text-red-600 ml-1"></i>
                            الالتزامات المالية
                        </h3>
                        <div class="overflow-x-auto mb-2">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="border-b border-gray-300 text-right">
                                        <th class="py-2 px-2">نوع الالتزام</th>
                                        <th class="py-2 px-2">إجمالي المبلغ</th>
                                        <th class="py-2 px-2">القسط الشهري</th>
                                        <th class="py-2 px-2">تاريخ الاستحقاق</th>
                                        <th class="py-2 px-2 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody id="calcObligationsTbody"></tbody>
                            </table>
                        </div>
                        <p class="text-sm font-bold text-red-700 mb-2">
                            إجمالي الالتزامات الشهرية: <span id="calcObligationsTotal">0</span> ريال
                        </p>
                        <div class="flex gap-2 flex-wrap">
                            <button type="button" id="calcAddAdHocObligation" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                <i class="fas fa-plus ml-1"></i> إضافة التزام مؤقت
                            </button>
                            <button type="button" id="calcSaveObligationsToClient" class="text-green-600 hover:text-green-800 text-sm font-medium hidden">
                                <i class="fas fa-save ml-1"></i> حفظ الالتزامات على العميل
                            </button>
                        </div>
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
                        <i class="fas fa-calendar text-purple-600 ml-2"></i>
                        تاريخ الميلاد
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
                        <!-- الهوية -->
                        <div>
                            <label class="block text-gray-700 font-bold mb-2">
                                <i class="fas fa-id-card text-blue-600 ml-2"></i>
                                صورة الهوية
                            </label>
                            <input type="file" id="idAttachment" accept="image/*,.pdf" onchange="previewFile(this, 'idPreview')"
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                            <div id="idPreview" class="mt-2"></div>
                            <p class="text-xs text-gray-500 mt-1">صيغة الملف: صورة أو PDF (حد أقصى: 2 ميغابايت)</p>
                        </div>
                        
                        <!-- كشف الحساب البنكي -->
                        <div>
                            <label class="block text-gray-700 font-bold mb-2">
                                <i class="fas fa-file-invoice text-green-600 ml-2"></i>
                                كشف الحساب البنكي (آخر 3 أشهر)
                            </label>
                            <input type="file" id="bankStatementAttachment" accept="image/*,.pdf" onchange="previewFile(this, 'bankStatementPreview')"
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100">
                            <div id="bankStatementPreview" class="mt-2"></div>
                            <p class="text-xs text-gray-500 mt-1">صيغة الملف: صورة أو PDF (حد أقصى: 2 ميغابايت)</p>
                        </div>
                        
                        <!-- تعريف بالراتب -->
                        <div>
                            <label class="block text-gray-700 font-bold mb-2">
                                <i class="fas fa-file-contract text-purple-600 ml-2"></i>
                                تعريف بالراتب
                            </label>
                            <input type="file" id="salaryAttachment" accept="image/*,.pdf" onchange="previewFile(this, 'salaryPreview')"
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100">
                            <div id="salaryPreview" class="mt-2"></div>
                            <p class="text-xs text-gray-500 mt-1">صيغة الملف: صورة أو PDF (حد أقصى: 2 ميغابايت)</p>
                        </div>
                        
                        <!-- مرفق إضافي -->
                        <div>
                            <label class="block text-gray-700 font-bold mb-2">
                                <i class="fas fa-file text-orange-600 ml-2"></i>
                                مرفق إضافي
                            </label>
                            <input type="file" id="additionalAttachment" accept="image/*,.pdf" onchange="previewFile(this, 'additionalPreview')"
                                   class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 file:ml-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100">
                            <div id="additionalPreview" class="mt-2"></div>
                            <p class="text-xs text-gray-500 mt-1">صيغة الملف: صورة أو PDF (حد أقصى: 2 ميغابايت)</p>
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
        let selectedCustomer = null;
        let savedObligations = [];
        let adHocObligations = [];
        let selectedBestOffer = null;
        let allBanks = [];
        let financingTypes = [];
        let allRates = [];
        const showFilterDebug = true;
        
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
            
            // Validate file size (2MB max)
            const maxSize = 2 * 1024 * 1024; // 2MB in bytes
            if (file.size > maxSize) {
                alert('حجم الملف كبير جداً! الحد الأقصى: 2 ميغابايت');
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
        
        function getCalcObligationsTotal() {
            const saved = (savedObligations || []).reduce((s, o) => s + (Number(o.monthly_installment) || 0), 0);
            let adhoc = 0;
            const tbody = document.getElementById('calcObligationsTbody');
            if (tbody) {
                tbody.querySelectorAll('tr.calc-adhoc-row').forEach(tr => {
                    const el = tr.querySelector('.calc-adhoc-monthly');
                    if (el) adhoc += parseFloat(el.value) || 0;
                });
            }
            return saved + adhoc;
        }
        
        function renderCalcObligationsTable() {
            const tbody = document.getElementById('calcObligationsTbody');
            const totalEl = document.getElementById('calcObligationsTotal');
            const saveBtn = document.getElementById('calcSaveObligationsToClient');
            if (!tbody || !totalEl) return;
            tbody.innerHTML = '';
            (savedObligations || []).forEach(o => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-gray-200';
                tr.innerHTML = \`<td class="py-1 px-2">\${escapeHtml(o.obligation_type || '')}</td><td class="py-1 px-2">\${formatNumber(Number(o.total_amount) || 0)}</td><td class="py-1 px-2">\${formatNumber(Number(o.monthly_installment) || 0)}</td><td class="py-1 px-2">\${o.due_date || '-'}</td><td class="py-1 px-2"></td>\`;
                tbody.appendChild(tr);
            });
            (adHocObligations || []).forEach((o, i) => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-gray-200 calc-adhoc-row';
                tr.innerHTML = \`<td class="py-1 px-2"><input type="text" class="calc-adhoc-type w-full px-2 py-1 border rounded" value="\${escapeHtml(o.obligation_type || '')}" placeholder="نوع"></td><td class="py-1 px-2"><input type="number" class="calc-adhoc-total w-full px-2 py-1 border rounded" step="0.01" value="\${o.total_amount || ''}"></td><td class="py-1 px-2"><input type="number" class="calc-adhoc-monthly w-full px-2 py-1 border rounded" step="0.01" value="\${o.monthly_installment || ''}"></td><td class="py-1 px-2"><input type="date" class="calc-adhoc-due w-full px-2 py-1 border rounded" value="\${o.due_date || ''}"></td><td class="py-1 px-2"><button type="button" class="calc-adhoc-remove text-red-600 hover:text-red-800" title="حذف"><i class="fas fa-trash"></i></button></td>\`;
                const removeBtn = tr.querySelector('.calc-adhoc-remove');
                removeBtn.addEventListener('click', () => { adHocObligations.splice(i, 1); renderCalcObligationsTable(); });
                tbody.appendChild(tr);
            });
            const total = getCalcObligationsTotal();
            totalEl.textContent = total.toLocaleString('ar-SA');
            if (saveBtn) saveBtn.classList.toggle('hidden', !selectedCustomer);
        }
        
        function escapeHtml(s) {
            const div = document.createElement('div');
            div.textContent = s;
            return div.innerHTML;
        }
        
        function formatNumber(n) {
            return Number(n).toLocaleString('ar-SA');
        }
        
        const pathParts = window.location.pathname.split('/');
        const tenantSlug = pathParts[1] === 'c' ? pathParts[2] : null;
        const showCustomerSelect = typeof window.CALCULATOR_SHOW_CUSTOMER_SELECT !== 'undefined' && window.CALCULATOR_SHOW_CUSTOMER_SELECT;
        if (tenantSlug && showCustomerSelect) {
            const selectEl = document.getElementById('calcCustomerSelect');
            const msgEl = document.getElementById('calcLookupMessage');
            async function loadCustomers() {
                try {
                    const res = await axios.get('/api/calculator/customers', { params: { tenant_slug: tenantSlug } });
                    if (!res.data.success || !Array.isArray(res.data.customers)) return;
                    const select = document.getElementById('calcCustomerSelect');
                    if (!select) return;
                    select.innerHTML = '<option value="">-- اختر العميل --</option>';
                    (res.data.customers || []).forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c.id;
                        opt.textContent = (c.full_name || '') + (c.phone ? ' - ' + c.phone : '');
                        select.appendChild(opt);
                    });
                } catch (err) {
                    if (msgEl) { msgEl.textContent = 'تعذر تحميل قائمة العملاء'; msgEl.classList.remove('hidden'); msgEl.className = 'text-sm mt-2 text-red-600'; }
                }
            }
            loadCustomers();
            selectEl.addEventListener('change', async () => {
                const customerId = selectEl.value;
                msgEl.classList.add('hidden');
                if (!customerId) {
                    selectedCustomer = null;
                    savedObligations = [];
                    renderCalcObligationsTable();
                    const salaryInput = document.getElementById('salary');
                    if (salaryInput) salaryInput.value = '';
                    return;
                }
                try {
                    const res = await axios.get('/api/calculator/customer-by-id', { params: { customer_id: customerId, tenant_slug: tenantSlug } });
                    if (res.data.success && res.data.customer) {
                        selectedCustomer = res.data.customer;
                        savedObligations = res.data.obligations || [];
                        adHocObligations = adHocObligations || [];
                        renderCalcObligationsTable();
                        const salaryInput = document.getElementById('salary');
                        if (salaryInput) {
                            const val = selectedCustomer.monthly_salary ?? selectedCustomer.basic_salary;
                            salaryInput.value = (val != null && val !== '') ? String(val) : '';
                        }
                    } else {
                        selectedCustomer = null;
                        savedObligations = [];
                        renderCalcObligationsTable();
                    }
                } catch (err) {
                    if (msgEl) { msgEl.textContent = 'حدث خطأ أثناء تحميل بيانات العميل'; msgEl.classList.remove('hidden'); msgEl.className = 'text-sm mt-2 text-red-600'; }
                }
            });
        } else {
            document.getElementById('calcClientLookupWrap').classList.add('hidden');
        }
        
        document.getElementById('calcAddAdHocObligation').addEventListener('click', () => {
            adHocObligations = adHocObligations || [];
            adHocObligations.push({ obligation_type: '', total_amount: 0, monthly_installment: 0, due_date: null });
            renderCalcObligationsTable();
        });
        
        document.getElementById('calcSaveObligationsToClient').addEventListener('click', async () => {
            if (!selectedCustomer || !selectedCustomer.id) return;
            const rows = [];
            (savedObligations || []).forEach(o => rows.push({ obligation_type: o.obligation_type || '', total_amount: Number(o.total_amount) || 0, monthly_installment: Number(o.monthly_installment) || 0, due_date: o.due_date || null }));
            document.querySelectorAll('#calcObligationsTbody tr.calc-adhoc-row').forEach(tr => {
                const typeEl = tr.querySelector('.calc-adhoc-type');
                const totalEl = tr.querySelector('.calc-adhoc-total');
                const monthlyEl = tr.querySelector('.calc-adhoc-monthly');
                const dueEl = tr.querySelector('.calc-adhoc-due');
                if (typeEl && totalEl && monthlyEl) rows.push({ obligation_type: typeEl.value || '', total_amount: parseFloat(totalEl.value) || 0, monthly_installment: parseFloat(monthlyEl.value) || 0, due_date: (dueEl && dueEl.value) || null });
            });
            try {
                await axios.post(\`/api/customers/\${selectedCustomer.id}/obligations\`, { obligations: rows }, { withCredentials: true });
                alert('تم حفظ الالتزامات على العميل بنجاح');
                savedObligations = rows;
                adHocObligations = [];
                renderCalcObligationsTable();
            } catch (err) {
                console.error(err);
                alert(err.response && err.response.data && err.response.data.error ? err.response.data.error : 'فشل حفظ الالتزامات. قد تحتاج لتسجيل الدخول.');
            }
        });
        
        renderCalcObligationsTable();
        
        // Step 1: Main form submission
        document.getElementById('calculatorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const obligationsTotal = getCalcObligationsTotal();
            // Get form data
            calculationData = {
                financing_type_id: parseInt(document.getElementById('financingType').value, 10),
                amount: parseFloat(document.getElementById('amount').value),
                salary: parseFloat(document.getElementById('salary').value),
                obligations: obligationsTotal
            };
            
            // Calculate available income
            const availableIncome = calculationData.salary - calculationData.obligations;
            
            // Check if customer can afford
            if (availableIncome < 1000) {
                alert('عذراً، الراتب المتاح بعد خصم الالتزامات غير كافٍ (يجب أن يكون 1000 ريال على الأقل)');
                return;
            }
            
            // Show modal
            document.getElementById('customerModal').classList.add('active');
        });
        
        // Step 2: Customer info submission
        document.getElementById('customerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
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
                    tenant_slug: tenantSlug
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
            const idFile = document.getElementById('idAttachment').files[0];
            const bankStatementFile = document.getElementById('bankStatementAttachment').files[0];
            const salaryFile = document.getElementById('salaryAttachment').files[0];
            const additionalFile = document.getElementById('additionalAttachment').files[0];

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
                id_attachment_filename: idFile ? idFile.name : null,
                bank_statement_attachment_filename: bankStatementFile ? bankStatementFile.name : null,
                salary_attachment_filename: salaryFile ? salaryFile.name : null,
                additional_attachment_filename: additionalFile ? additionalFile.name : null
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
                        { file: idFile, type: 'id', label: 'صورة الهوية' },
                        { file: salaryFile, type: 'salary', label: 'تعريف بالراتب' },
                        { file: bankStatementFile, type: 'bank_statement', label: 'كشف الحساب البنكي' },
                        { file: additionalFile, type: 'additional', label: 'مرفق إضافي' }
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
            selectedCustomer = null;
            savedObligations = [];
            adHocObligations = [];
            selectedBestOffer = null;
            if (typeof renderCalcObligationsTable === 'function') renderCalcObligationsTable();
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
        
        // Load data on page load
        loadData();

    </script>
</body>
</html>
`;
