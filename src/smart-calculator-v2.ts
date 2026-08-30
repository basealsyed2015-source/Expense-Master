export const smartCalculatorV2 = `<!DOCTYPE html>
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
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); }
        .modal.active { display: flex; align-items: center; justify-content: center; }
        .best-offer { border: 3px solid #10B981; background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); }
        .bank-card { transition: all 0.3s; cursor: pointer; }
        .bank-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .qualified { background: linear-gradient(135deg, #10B981 0%, #059669 100%); }
        .not-qualified { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); }
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
                <div class="space-x-reverse space-x-4">
                    <a href="/admin/panel" class="text-gray-700 hover:text-blue-600">
                        <i class="fas fa-home ml-1"></i>الرئيسية
                    </a>
                    <a href="/admin/panel" class="text-gray-700 hover:text-blue-600">
                        <i class="fas fa-user-shield ml-1"></i>الإدارة
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
            <!-- Qualification Status -->
            <div id="qualificationStatus" class="hidden mb-6 rounded-2xl shadow-xl p-6 text-white text-center">
                <div class="flex items-center justify-center mb-3">
                    <i id="qualificationIcon" class="text-5xl ml-3"></i>
                    <h3 class="text-3xl font-bold" id="qualificationText"></h3>
                </div>
                <p id="qualificationMessage" class="text-lg"></p>
            </div>

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
                    
                    <!-- الالتزامات الشهرية -->
                    <div>
                        <label class="block text-gray-700 font-bold mb-2">
                            <i class="fas fa-credit-card text-red-600 ml-2"></i>
                            الالتزامات الشهرية (ريال)
                        </label>
                        <input type="number" id="obligations" min="0" step="100" value="0"
                               class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               placeholder="مثال: 2000">
                        <p class="text-sm text-gray-500 mt-1">أقساط القروض الحالية أو بطاقات الائتمان</p>
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
                    <button type="button" onclick="closeModal('customerModal')" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-bold">
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

    <!-- Modal: Complete Request -->
    <div id="completeRequestModal" class="modal">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="text-center mb-6">
                <div class="inline-block bg-blue-100 rounded-full p-4 mb-4">
                    <i class="fas fa-file-invoice text-4xl text-blue-600"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">إكمال طلب التمويل</h3>
                <p class="text-gray-600">املأ البيانات التالية لإرسال طلبك</p>
            </div>
            
            <form id="completeRequestForm" class="space-y-4">
                <!-- البيانات الشخصية -->
                <div class="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 class="font-bold text-lg mb-3 text-blue-800">
                        <i class="fas fa-user ml-2"></i>
                        البيانات الشخصية
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 font-medium mb-1">الاسم الكامل</label>
                            <input type="text" id="reqName" required readonly
                                   class="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100">
                        </div>
                        <div>
                            <label class="block text-gray-700 font-medium mb-1">رقم الجوال</label>
                            <input type="tel" id="reqPhone" required readonly
                                   class="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100">
                        </div>
                        <div>
                            <label class="block text-gray-700 font-medium mb-1">البريد الإلكتروني</label>
                            <input type="email" id="reqEmail" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                   placeholder="example@email.com">
                        </div>
                        <div>
                            <label class="block text-gray-700 font-medium mb-1">رقم الهوية الوطنية</label>
                            <input type="text" id="reqNationalId" required pattern="[0-9]{10}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                   placeholder="1234567890" maxlength="10">
                        </div>
                    </div>
                </div>

                <!-- بيانات العمل -->
                <div class="bg-green-50 rounded-lg p-4 mb-4">
                    <h4 class="font-bold text-lg mb-3 text-green-800">
                        <i class="fas fa-briefcase ml-2"></i>
                        بيانات العمل
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 font-medium mb-1">جهة العمل</label>
                            <input type="text" id="reqEmployer" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                   placeholder="اسم الشركة أو الجهة">
                        </div>
                        <div>
                            <label class="block text-gray-700 font-medium mb-1">المسمى الوظيفي</label>
                            <input type="text" id="reqJobTitle" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                   placeholder="مثل: محاسب، مهندس">
                        </div>
                    </div>
                </div>

                <!-- بيانات التمويل -->
                <div class="bg-purple-50 rounded-lg p-4 mb-4">
                    <h4 class="font-bold text-lg mb-3 text-purple-800">
                        <i class="fas fa-money-check ml-2"></i>
                        بيانات التمويل المختار
                    </h4>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div class="bg-white p-3 rounded">
                            <div class="text-gray-600">البنك المختار</div>
                            <div class="font-bold text-lg" id="selectedBankDisplay">-</div>
                        </div>
                        <div class="bg-white p-3 rounded">
                            <div class="text-gray-600">المبلغ المطلوب</div>
                            <div class="font-bold text-lg" id="selectedAmountDisplay">-</div>
                        </div>
                        <div class="bg-white p-3 rounded">
                            <div class="text-gray-600">المدة</div>
                            <div class="font-bold text-lg" id="selectedDurationDisplay">-</div>
                        </div>
                        <div class="bg-white p-3 rounded">
                            <div class="text-gray-600">القسط الشهري</div>
                            <div class="font-bold text-lg text-green-600" id="selectedMonthlyDisplay">-</div>
                        </div>
                    </div>
                </div>

                <!-- ملاحظات -->
                <div>
                    <label class="block text-gray-700 font-medium mb-1">
                        <i class="fas fa-comment-dots ml-2"></i>
                        ملاحظات إضافية (اختياري)
                    </label>
                    <textarea id="reqNotes" rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="أي معلومات إضافية تود ذكرها..."></textarea>
                </div>
                
                <div class="flex space-x-reverse space-x-3 mt-6">
                    <button type="button" onclick="closeModal('completeRequestModal')" 
                            class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-bold">
                        إلغاء
                    </button>
                    <button type="submit" id="submitRequestBtn"
                            class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-bold">
                        <i class="fas fa-paper-plane ml-2"></i>
                        إرسال الطلب
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Results Section -->
    <div id="resultsSection" class="container mx-auto px-4 py-8 hidden">
        <div class="max-w-6xl mx-auto">
            <!-- Best Offer Banner with Complete Request Button -->
            <div id="bestOfferBanner" class="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl shadow-2xl p-8 mb-8 text-center">
                <div class="inline-block bg-white/20 rounded-full p-4 mb-4">
                    <i class="fas fa-trophy text-5xl"></i>
                </div>
                <h2 class="text-3xl font-bold mb-2">🎉 وجدنا لك أفضل عرض!</h2>
                <p class="text-xl mb-6" id="bestOfferText">جاري التحميل...</p>
                
                <button onclick="showCompleteRequestModal()" 
                        class="bg-white text-green-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
                    <i class="fas fa-check-circle ml-2"></i>
                    إكمال الطلب للبنك الأفضل
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
        let customerInfo = {};
        let allBanks = [];
        let financingTypes = [];
        let allRates = [];
        let bestOffer = null;
        let allOffers = [];

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
        
        // Load initial data
        async function loadData() {
            try {
                const [banksRes, typesRes, ratesRes] = await Promise.all([
                    axios.get('/api/banks'),
                    axios.get('/api/financing-types'),
                    axios.get('/api/rates')
                ]);
                
                allBanks = banksRes.data.data;
                financingTypes = typesRes.data.data;
                allRates = ratesRes.data.data;
                
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
            
            // Get form data
            calculationData = {
                financing_type_id: parseInt(document.getElementById('financingType').value),
                amount: parseFloat(document.getElementById('amount').value),
                salary: parseFloat(document.getElementById('salary').value),
                obligations: parseFloat(document.getElementById('obligations').value) || 0
            };
            
            // Calculate available income
            const availableIncome = calculationData.salary - calculationData.obligations;
            const maxMonthlyPayment = availableIncome * 0.33;
            
            // Show qualification status
            const qualificationDiv = document.getElementById('qualificationStatus');
            const qualificationIcon = document.getElementById('qualificationIcon');
            const qualificationText = document.getElementById('qualificationText');
            const qualificationMessage = document.getElementById('qualificationMessage');
            
            qualificationDiv.classList.remove('hidden');
            
            if (availableIncome >= 1000 && maxMonthlyPayment > 500) {
                qualificationDiv.className = 'qualified mb-6 rounded-2xl shadow-xl p-6 text-white text-center';
                qualificationIcon.className = 'fas fa-check-circle text-5xl ml-3';
                qualificationText.textContent = '✅ مؤهل للتمويل';
                qualificationMessage.textContent = \`الدخل المتاح: \${availableIncome.toLocaleString('ar-SA')} ريال | الحد الأقصى للقسط: \${maxMonthlyPayment.toLocaleString('ar-SA')} ريال\`;
                
                // Show modal
                setTimeout(() => {
                    document.getElementById('customerModal').classList.add('active');
                }, 500);
            } else {
                qualificationDiv.className = 'not-qualified mb-6 rounded-2xl shadow-xl p-6 text-white text-center';
                qualificationIcon.className = 'fas fa-times-circle text-5xl ml-3';
                qualificationText.textContent = '❌ غير مؤهل حالياً';
                qualificationMessage.textContent = 'عذراً، الراتب المتاح بعد خصم الالتزامات غير كافٍ للحصول على تمويل';
            }
        });
        
        // Step 2: Customer info submission
        document.getElementById('customerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            syncBirthdateFromHijri();
            syncBirthdateFromGregorian();
            
            // Get customer info
            customerInfo = {
                name: document.getElementById('customerName').value,
                phone: document.getElementById('customerPhone').value,
                birthdate: document.getElementById('customerBirthdate').value
            };
            
            // Close modal
            closeModal('customerModal');
            
            // Show loading
            document.getElementById('resultsSection').classList.remove('hidden');
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
            
            // Calculate all offers
            await calculateAllOffers(customerInfo);
        });
        
        async function calculateAllOffers(custInfo) {
            const availableIncome = calculationData.salary - calculationData.obligations;
            const maxMonthlyPayment = availableIncome * 0.33;
            
            // Filter rates
            const applicableRates = allRates.filter(rate => 
                rate.financing_type_id === calculationData.financing_type_id &&
                rate.is_active === 1 &&
                rate.min_salary <= calculationData.salary &&
                rate.max_salary >= calculationData.salary &&
                rate.min_amount <= calculationData.amount &&
                rate.max_amount >= calculationData.amount
            );
            
            if (applicableRates.length === 0) {
                document.getElementById('bestOfferText').textContent = 'عذراً، لا توجد عروض متاحة حالياً تناسب معاييرك';
                return;
            }
            
            // Calculate offers
            const offers = applicableRates.map(rate => {
                const bank = allBanks.find(b => b.id === rate.bank_id);
                const calculations = [];
                
                for (let months = rate.min_duration; months <= rate.max_duration; months += 12) {
                    const monthlyRate = rate.rate / 100 / 12;
                    const monthlyPayment = (calculationData.amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                                          (Math.pow(1 + monthlyRate, months) - 1);
                    
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
                
                const bestCalc = calculations.sort((a, b) => a.totalInterest - b.totalInterest)[0];
                
                return {
                    bank: bank,
                    rate: rate.rate,
                    bestCalculation: bestCalc,
                    allCalculations: calculations
                };
            }).filter(offer => offer.bestCalculation);
            
            offers.sort((a, b) => a.bestCalculation.totalInterest - b.bestCalculation.totalInterest);
            
            allOffers = offers;
            bestOffer = offers[0];
            
            displayOffers(offers, custInfo);
        }
        
        function displayOffers(offers, custInfo) {
            if (offers.length === 0) {
                document.getElementById('bestOfferText').textContent = 'عذراً، لا توجد عروض تناسب قدرتك الشرائية حالياً';
                return;
            }
            
            const best = offers[0];
            
            document.getElementById('bestOfferText').innerHTML = \`
                <span class="text-2xl">أفضل عرض من <span class="font-bold">\${best.bank.bank_name}</span></span>
                <br>
                <span class="text-lg">قسط شهري: \${best.bestCalculation.monthlyPayment.toLocaleString('ar-SA')} ريال لمدة \${best.bestCalculation.duration} شهر</span>
            \`;
            
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
                        
                        <button onclick="selectOfferForRequest(\${index})" 
                                class="w-full mt-4 \${isBest ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 rounded-lg font-bold transition">
                            <i class="fas fa-check ml-2"></i>
                            اختر هذا العرض
                        </button>
                    </div>
                \`;
            }).join('');
        }
        
        function showCompleteRequestModal() {
            if (!bestOffer) return;
            selectOfferForRequest(0);
        }
        
        function selectOfferForRequest(offerIndex) {
            const selectedOffer = allOffers[offerIndex];
            bestOffer = selectedOffer;
            
            // Fill form with customer info
            document.getElementById('reqName').value = customerInfo.name;
            document.getElementById('reqPhone').value = customerInfo.phone;
            
            // Display selected offer details
            document.getElementById('selectedBankDisplay').textContent = selectedOffer.bank.bank_name;
            document.getElementById('selectedAmountDisplay').textContent = calculationData.amount.toLocaleString('ar-SA') + ' ريال';
            document.getElementById('selectedDurationDisplay').textContent = selectedOffer.bestCalculation.duration + ' شهر';
            document.getElementById('selectedMonthlyDisplay').textContent = selectedOffer.bestCalculation.monthlyPayment.toLocaleString('ar-SA') + ' ريال';
            
            // Show modal
            document.getElementById('completeRequestModal').classList.add('active');
        }
        
        // Complete request form submission
        document.getElementById('completeRequestForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitRequestBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i>جاري الإرسال...';
            
            try {
                // 1. Create or get customer
                const customerData = {
                    full_name: document.getElementById('reqName').value,
                    phone: document.getElementById('reqPhone').value,
                    email: document.getElementById('reqEmail').value,
                    national_id: document.getElementById('reqNationalId').value,
                    employer_name: document.getElementById('reqEmployer').value,
                    job_title: document.getElementById('reqJobTitle').value,
                    monthly_salary: calculationData.salary
                };
                
                // Try to find existing customer by phone or national_id
                let customerId;
                const existingCustomers = await axios.get('/api/customers');
                const existingCustomer = existingCustomers.data.data.find(c => 
                    c.phone === customerData.phone || c.national_id === customerData.national_id
                );
                
                if (existingCustomer) {
                    customerId = existingCustomer.id;
                } else {
                    // Create new customer - Need to add this API
                    const newCustomer = await axios.post('/api/customers', customerData);
                    customerId = newCustomer.data.id;
                }
                
                // 2. Create financing request
                const requestData = {
                    customer_id: customerId,
                    financing_type_id: calculationData.financing_type_id,
                    requested_amount: calculationData.amount,
                    duration_months: bestOffer.bestCalculation.duration,
                    salary_at_request: calculationData.salary,
                    selected_bank_id: bestOffer.bank.id,
                    status: 'pending',
                    notes: document.getElementById('reqNotes').value
                };
                
                await axios.post('/api/financing-requests', requestData);
                
                // Success
                closeModal('completeRequestModal');
                alert('✅ تم إرسال طلبك بنجاح! سيتم التواصل معك قريباً من ' + bestOffer.bank.bank_name);
                
                // Reset
                restartCalculator();
                
            } catch (error) {
                console.error('Error submitting request:', error);
                alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane ml-2"></i>إرسال الطلب';
            }
        });
        
        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }
        
        function restartCalculator() {
            document.getElementById('resultsSection').classList.add('hidden');
            document.getElementById('qualificationStatus').classList.add('hidden');
            document.getElementById('calculatorForm').reset();
            calculationData = {};
            customerInfo = {};
            bestOffer = null;
            allOffers = [];
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
        
        loadData();
    </script>
</body>
</html>
`;
