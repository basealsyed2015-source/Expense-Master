import { buildSaudiCitySelectOptionsHtml } from './saudi-arabia-cities'

export const companySettingsPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعدادات الشركة</title>
  <link rel="stylesheet" href="/tailwind.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="border-b border-slate-200/90 bg-slate-50/90">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-1.5">
      <a href="/admin/panel" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 decoration-blue-400/50">← العودة للوحة الرئيسية</a>
    </div>
  </div>

  <div class="bg-gradient-to-r from-teal-600 to-teal-800 text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-bold flex items-center min-w-0 flex-1" dir="rtl">
        <i class="fas fa-building ml-3 shrink-0"></i>
        إعدادات الشركة
      </h1>
      <a href="/admin/company-settings/locations"
        class="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-bold text-teal-800 shadow-md ring-1 ring-white/60 hover:bg-teal-50 hover:text-teal-900 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-teal-700"
        dir="rtl">
        <i class="fas fa-map-marker-alt text-base text-teal-600 shrink-0" aria-hidden="true"></i>
        <span>مواقع الشركة والفروع</span>
      </a>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <p class="text-sm text-gray-600 mb-6 leading-relaxed" dir="rtl">
      عدّل اسم الشركة وبيانات التواصل والموقع (المدينة والعنوان) وشعار الشركة وعلامة المستندات المائية.
    </p>

    <div id="loadError" class="hidden mb-6 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3" dir="rtl"></div>

    <form id="companyForm" class="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-6 max-w-3xl mx-auto" dir="rtl">
      <div>
        <label class="block text-sm font-bold text-gray-700 mb-2 text-right" for="company_name" dir="rtl">
          <i class="fas fa-signature text-teal-600 ml-1"></i>
          اسم الشركة
        </label>
        <input type="text" id="company_name" required maxlength="200"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
          dir="rtl" lang="ar" autocomplete="organization" />
      </div>
      <div>
        <label class="block text-sm font-bold text-gray-700 mb-2" for="contact_email" dir="rtl">
          <i class="fas fa-envelope text-teal-600 ml-1"></i>
          البريد الإلكتروني للتواصل
        </label>
        <input type="email" id="contact_email" maxlength="200" dir="ltr" placeholder="name@company.com"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-left" />
        <p class="text-xs text-gray-500 mt-1.5 leading-relaxed" dir="rtl">اختياري. يُعرض للعملاء في صفحة التواصل العامة.</p>
      </div>
      <div>
        <label class="block text-sm font-bold text-gray-700 mb-2" for="contact_phone" dir="rtl">
          <i class="fas fa-phone text-teal-600 ml-1"></i>
          رقم الجوال للتواصل
        </label>
        <input type="tel" id="contact_phone" maxlength="40" dir="ltr" placeholder="5XXXXXXXX أو 9665XXXXXXXX"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-left" />
        <p class="text-xs text-gray-500 mt-1.5 leading-relaxed" dir="rtl">اختياري. صيغة سعودية (يبدأ بـ 5). يُستخدم في صفحة التواصل ورابط واتساب.</p>
      </div>
      <div>
        <label class="block text-sm font-bold text-gray-700 mb-2" for="whatsapp_greeting" dir="rtl">
          <i class="fab fa-whatsapp text-green-600 ml-1"></i>
          رسالة ترحيب واتساب
        </label>
        <textarea id="whatsapp_greeting" maxlength="2000" rows="4"
          placeholder="مثال: السلام عليكم، معكم فريقنا. كيف نقدر نخدمك؟"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y min-h-[6rem] text-right"
          dir="rtl" lang="ar"></textarea>
        <p class="text-xs text-gray-500 mt-1.5 leading-relaxed" dir="rtl">
          اختياري. تُفتح هذه الرسالة جاهزة في واتساب عند الضغط على زر واتساب في جداول العملاء والطلبات.
        </p>
      </div>
      <div>
        <label class="block text-sm font-bold text-gray-700 mb-2" for="city" dir="rtl">
          <i class="fas fa-map-marker-alt text-teal-600 ml-1"></i>
          المدينة
        </label>
        <select id="city" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-right" dir="rtl">
          ${buildSaudiCitySelectOptionsHtml()}
        </select>
        <p class="text-xs text-gray-500 mt-1.5 leading-relaxed" dir="rtl">اختياري. جميع مدن المملكة العربية السعودية.</p>
      </div>
      <div>
        <label class="block text-sm font-bold text-gray-700 mb-2" for="address" dir="rtl">
          <i class="fas fa-road text-teal-600 ml-1"></i>
          العنوان التفصيلي
        </label>
        <textarea id="address" maxlength="2000" rows="3" placeholder="الحي، الشارع، المبنى…"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y min-h-[5rem] text-right"
          dir="rtl" lang="ar"></textarea>
        <p class="text-xs text-gray-500 mt-1.5 leading-relaxed" dir="rtl">اختياري. نص حر (مثلاً الحي والشوارع).</p>
      </div>
      <div>
        <span class="block text-sm font-bold text-gray-700 mb-2" dir="rtl">
          <i class="fas fa-image text-teal-600 ml-1"></i>
          شعار الشركة
        </span>
        <div class="flex flex-wrap items-center gap-3 mt-1">
          <label class="inline-flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-teal-50 hover:border-teal-400 cursor-pointer transition-colors">
            <i class="fas fa-upload text-teal-600"></i>
            <span class="text-sm font-bold text-gray-800" dir="rtl">اختر صورة</span>
            <input type="file" id="logo_file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" class="hidden" />
          </label>
          <button type="button" id="logo_remove_btn" class="hidden text-sm font-bold text-red-600 hover:text-red-800 px-2 py-3" dir="rtl">
            إزالة الشعار
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2 leading-relaxed" dir="rtl">PNG أو JPEG أو GIF أو WebP — بحد أقصى 2 ميجابايت. يُحفظ عند الضغط على «حفظ التعديلات».</p>
        <p id="logo_file_hint" class="text-xs text-teal-700 mt-2 font-medium hidden leading-relaxed" dir="rtl"></p>
      </div>
      <div id="logoPreviewWrap" class="hidden">
        <span class="text-xs font-bold text-gray-600" dir="rtl">معاينة</span>
        <div class="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-center">
          <img id="logoPreview" alt="" class="max-h-28 max-w-[240px] object-contain rounded-md" />
        </div>
      </div>

      <div class="pt-4 border-t border-gray-100 space-y-4">
        <div>
          <h2 class="text-base font-bold text-gray-800 flex items-center gap-2" dir="rtl">
            <i class="fas fa-stamp text-teal-600"></i>
            علامة مائية للمستندات
          </h2>
          <p class="text-xs text-gray-500 mt-1.5 leading-relaxed" dir="rtl">
            صورة خلفية خفيفة تظهر خلف نص العقود عند المعاينة والطباعة، دون حجب المحتوى (مختلفة عن علامة «مسودة غير معتمدة»).
            عند التفعيل بدون صورة مخصصة يُستخدم شعار الشركة تلقائياً.
          </p>
        </div>
        <label class="flex items-start gap-3 cursor-pointer select-none" dir="rtl">
          <input type="checkbox" id="document_watermark_enabled"
            class="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <span class="text-sm font-bold text-gray-800">تفعيل العلامة المائية في مستندات العقود</span>
        </label>
        <div>
          <span class="block text-sm font-bold text-gray-700 mb-2" dir="rtl">
            <i class="fas fa-image text-teal-600 ml-1"></i>
            صورة العلامة المائية
          </span>
          <div class="flex flex-wrap items-center gap-3 mt-1">
            <label class="inline-flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-teal-50 hover:border-teal-400 cursor-pointer transition-colors">
              <i class="fas fa-upload text-teal-600"></i>
              <span class="text-sm font-bold text-gray-800" dir="rtl">اختر صورة</span>
              <input type="file" id="watermark_file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" class="hidden" />
            </label>
            <button type="button" id="watermark_use_logo_btn"
              class="text-sm font-bold text-teal-700 hover:text-teal-900 px-2 py-3" dir="rtl">
              استخدام شعار الشركة
            </button>
            <button type="button" id="watermark_remove_btn" class="hidden text-sm font-bold text-red-600 hover:text-red-800 px-2 py-3" dir="rtl">
              إزالة الصورة
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2 leading-relaxed" dir="rtl">PNG أو JPEG أو GIF أو WebP — بحد أقصى 2 ميجابايت. يُفضَّل شعار بخلفية شفافة.</p>
          <p id="watermark_file_hint" class="text-xs text-teal-700 mt-2 font-medium hidden leading-relaxed" dir="rtl"></p>
        </div>
        <div id="watermarkPreviewWrap" class="hidden">
          <span class="text-xs font-bold text-gray-600" dir="rtl">معاينة العلامة المائية</span>
          <div class="mt-2 p-6 bg-white rounded-lg border border-gray-200 flex justify-center relative overflow-hidden min-h-[140px]">
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none" id="watermarkPreviewBg">
              <img id="watermarkPreview" alt="" class="max-h-24 max-w-[200px] object-contain" style="opacity:0.08;" />
            </div>
            <p class="relative z-[1] text-sm text-gray-700 text-center leading-relaxed px-4" dir="rtl">
              مثال لنص العقد — العلامة المائية تظهر خلف النص بشفافية منخفضة.
            </p>
          </div>
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2" for="document_watermark_opacity" dir="rtl">
            الشفافية
            <span id="opacity_value_label" class="text-teal-700 font-bold mr-1">12%</span>
          </label>
          <input type="range" id="document_watermark_opacity" min="3" max="25" step="1" value="12"
            class="w-full accent-teal-600" />
          <p class="text-xs text-gray-500 mt-1.5 leading-relaxed" dir="rtl">من 3٪ (أخف) إلى 25٪ (أوضح قليلاً). الافتراضي 12٪.</p>
        </div>
      </div>

      <div class="pt-4 border-t border-gray-100 space-y-4">
        <div>
          <h2 class="text-base font-bold text-gray-800 flex items-center gap-2" dir="rtl">
            <i class="fas fa-heading text-teal-600"></i>
            ترويسة الصفحة (Header)
          </h2>
          <p class="text-xs text-gray-500 mt-1.5 leading-relaxed" dir="rtl">
            صورة ترويسة تظهر أعلى كل صفحة من العقد. النص يبدأ أسفلها ولا يتداخل معها.
          </p>
        </div>
        <label class="flex items-start gap-3 cursor-pointer select-none" dir="rtl">
          <input type="checkbox" id="document_header_enabled"
            class="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <span class="text-sm font-bold text-gray-800">تفعيل ترويسة الصفحة</span>
        </label>
        <div>
          <span class="block text-sm font-bold text-gray-700 mb-2" dir="rtl">صورة الترويسة</span>
          <div class="flex flex-wrap items-center gap-3 mt-1">
            <label class="inline-flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-teal-50 hover:border-teal-400 cursor-pointer transition-colors">
              <i class="fas fa-upload text-teal-600"></i>
              <span class="text-sm font-bold text-gray-800" dir="rtl">اختر صورة</span>
              <input type="file" id="header_file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" class="hidden" />
            </label>
            <button type="button" id="header_remove_btn" class="hidden text-sm font-bold text-red-600 hover:text-red-800 px-2 py-3" dir="rtl">إزالة الصورة</button>
          </div>
          <p id="header_file_hint" class="text-xs text-teal-700 mt-2 font-medium hidden leading-relaxed" dir="rtl"></p>
        </div>
        <div id="headerPreviewWrap" class="hidden">
          <span class="text-xs font-bold text-gray-600" dir="rtl">معاينة الترويسة</span>
          <div class="mt-2 p-3 bg-white rounded-lg border border-gray-200 flex justify-center overflow-hidden">
            <img id="headerPreview" alt="" class="w-full max-h-28 object-contain" style="opacity:1;" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2" for="document_header_opacity" dir="rtl">
            الشفافية
            <span id="header_opacity_value_label" class="text-teal-700 font-bold mr-1">100%</span>
          </label>
          <input type="range" id="document_header_opacity" min="10" max="100" step="1" value="100"
            class="w-full accent-teal-600" />
          <p class="text-xs text-gray-500 mt-1.5 leading-relaxed" dir="rtl">الافتراضي 100٪ (معتم بالكامل).</p>
        </div>
      </div>

      <div class="pt-4 border-t border-gray-100 space-y-4">
        <div>
          <h2 class="text-base font-bold text-gray-800 flex items-center gap-2" dir="rtl">
            <i class="fas fa-grip-lines text-teal-600"></i>
            تذييل الصفحة (Footer)
          </h2>
          <p class="text-xs text-gray-500 mt-1.5 leading-relaxed" dir="rtl">
            صورة تذييل تظهر أسفل كل صفحة من العقد. النص يتوقف فوقها ولا يتداخل معها.
          </p>
        </div>
        <label class="flex items-start gap-3 cursor-pointer select-none" dir="rtl">
          <input type="checkbox" id="document_footer_enabled"
            class="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <span class="text-sm font-bold text-gray-800">تفعيل تذييل الصفحة</span>
        </label>
        <div>
          <span class="block text-sm font-bold text-gray-700 mb-2" dir="rtl">صورة التذييل</span>
          <div class="flex flex-wrap items-center gap-3 mt-1">
            <label class="inline-flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-teal-50 hover:border-teal-400 cursor-pointer transition-colors">
              <i class="fas fa-upload text-teal-600"></i>
              <span class="text-sm font-bold text-gray-800" dir="rtl">اختر صورة</span>
              <input type="file" id="footer_file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" class="hidden" />
            </label>
            <button type="button" id="footer_remove_btn" class="hidden text-sm font-bold text-red-600 hover:text-red-800 px-2 py-3" dir="rtl">إزالة الصورة</button>
          </div>
          <p id="footer_file_hint" class="text-xs text-teal-700 mt-2 font-medium hidden leading-relaxed" dir="rtl"></p>
        </div>
        <div id="footerPreviewWrap" class="hidden">
          <span class="text-xs font-bold text-gray-600" dir="rtl">معاينة التذييل</span>
          <div class="mt-2 p-3 bg-white rounded-lg border border-gray-200 flex justify-center overflow-hidden">
            <img id="footerPreview" alt="" class="w-full max-h-28 object-contain" style="opacity:1;" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2" for="document_footer_opacity" dir="rtl">
            الشفافية
            <span id="footer_opacity_value_label" class="text-teal-700 font-bold mr-1">100%</span>
          </label>
          <input type="range" id="document_footer_opacity" min="10" max="100" step="1" value="100"
            class="w-full accent-teal-600" />
          <p class="text-xs text-gray-500 mt-1.5 leading-relaxed" dir="rtl">الافتراضي 100٪ (معتم بالكامل).</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 pt-2 border-t border-gray-100" dir="rtl">
        <button type="submit" id="saveBtn"
          class="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-6 py-3 rounded-lg font-bold shadow-lg transition-all">
          <i class="fas fa-save"></i>
          حفظ التعديلات
        </button>
      </div>
    </form>

    <div id="formMessage" class="mt-4 text-sm max-w-3xl mx-auto" dir="rtl"></div>
  </div>

  <script>
    var previewObjectUrl = null;
    var markLogoRemoved = false;
    var watermarkPreviewObjectUrl = null;
    var markWatermarkRemoved = false;
    var watermarkPendingUrl = null; // set when "use company logo" is clicked
    var useCompanyLogoAsWatermark = false;
    var currentLogoUrl = '';
    var currentWatermarkUrl = '';
    var currentHeaderUrl = '';
    var currentFooterUrl = '';
    var markHeaderRemoved = false;
    var markFooterRemoved = false;
    var headerPreviewObjectUrl = null;
    var footerPreviewObjectUrl = null;

    function showLoadError(msg) {
      var el = document.getElementById('loadError');
      if (!el) return;
      el.textContent = msg || 'تعذر تحميل البيانات.';
      el.classList.remove('hidden');
    }

    function revokePreviewObjectUrl() {
      if (previewObjectUrl) {
        try { URL.revokeObjectURL(previewObjectUrl); } catch (_) {}
        previewObjectUrl = null;
      }
    }

    function revokeWatermarkPreviewObjectUrl() {
      if (watermarkPreviewObjectUrl) {
        try { URL.revokeObjectURL(watermarkPreviewObjectUrl); } catch (_) {}
        watermarkPreviewObjectUrl = null;
      }
    }

    function revokeHeaderPreviewObjectUrl() {
      if (headerPreviewObjectUrl) {
        try { URL.revokeObjectURL(headerPreviewObjectUrl); } catch (_) {}
        headerPreviewObjectUrl = null;
      }
    }

    function revokeFooterPreviewObjectUrl() {
      if (footerPreviewObjectUrl) {
        try { URL.revokeObjectURL(footerPreviewObjectUrl); } catch (_) {}
        footerPreviewObjectUrl = null;
      }
    }

    function getOpacityFraction() {
      var el = document.getElementById('document_watermark_opacity');
      var pct = el ? parseInt(el.value, 10) : 12;
      if (!Number.isFinite(pct)) pct = 12;
      return Math.min(0.25, Math.max(0.03, pct / 100));
    }

    function syncOpacityLabel() {
      var el = document.getElementById('document_watermark_opacity');
      var label = document.getElementById('opacity_value_label');
      var img = document.getElementById('watermarkPreview');
      var pct = el ? parseInt(el.value, 10) : 12;
      if (label) label.textContent = pct + '%';
      if (img) img.style.opacity = String(pct / 100);
    }

    function getLetterheadOpacityFraction(id) {
      var el = document.getElementById(id);
      var pct = el ? parseInt(el.value, 10) : 100;
      if (!Number.isFinite(pct)) pct = 100;
      return Math.min(1, Math.max(0.1, pct / 100));
    }

    function syncLetterheadOpacity(kind) {
      var el = document.getElementById('document_' + kind + '_opacity');
      var label = document.getElementById(kind + '_opacity_value_label');
      var img = document.getElementById(kind + 'Preview');
      var pct = el ? parseInt(el.value, 10) : 100;
      if (label) label.textContent = pct + '%';
      if (img) img.style.opacity = String(pct / 100);
    }

    function setLetterheadPreviewFromUrl(kind, url) {
      var revoke = kind === 'header' ? revokeHeaderPreviewObjectUrl : revokeFooterPreviewObjectUrl;
      revoke();
      var wrap = document.getElementById(kind + 'PreviewWrap');
      var img = document.getElementById(kind + 'Preview');
      var removeBtn = document.getElementById(kind + '_remove_btn');
      if (!wrap || !img) return;
      var u = String(url || '').trim();
      if (kind === 'header') currentHeaderUrl = u;
      else currentFooterUrl = u;
      if (!u) {
        wrap.classList.add('hidden');
        img.removeAttribute('src');
        if (removeBtn) removeBtn.classList.add('hidden');
        return;
      }
      img.onload = function () {
        wrap.classList.remove('hidden');
        if (removeBtn) removeBtn.classList.remove('hidden');
        syncLetterheadOpacity(kind);
      };
      img.onerror = function () {
        wrap.classList.add('hidden');
        if (removeBtn) removeBtn.classList.remove('hidden');
      };
      img.src = u;
      syncLetterheadOpacity(kind);
    }

    function setLetterheadPreviewLocal(kind, file) {
      var wrap = document.getElementById(kind + 'PreviewWrap');
      var img = document.getElementById(kind + 'Preview');
      var removeBtn = document.getElementById(kind + '_remove_btn');
      if (!wrap || !img || !file) return;
      if (kind === 'header') {
        revokeHeaderPreviewObjectUrl();
        headerPreviewObjectUrl = URL.createObjectURL(file);
        img.src = headerPreviewObjectUrl;
      } else {
        revokeFooterPreviewObjectUrl();
        footerPreviewObjectUrl = URL.createObjectURL(file);
        img.src = footerPreviewObjectUrl;
      }
      img.onload = function () {
        wrap.classList.remove('hidden');
        if (removeBtn) removeBtn.classList.remove('hidden');
        syncLetterheadOpacity(kind);
      };
      img.onerror = function () { wrap.classList.add('hidden'); };
      syncLetterheadOpacity(kind);
    }

    function setLogoPreviewFromServer(url) {
      revokePreviewObjectUrl();
      var wrap = document.getElementById('logoPreviewWrap');
      var img = document.getElementById('logoPreview');
      var removeBtn = document.getElementById('logo_remove_btn');
      if (!wrap || !img) return;
      var u = String(url || '').trim();
      currentLogoUrl = u;
      if (!u) {
        wrap.classList.add('hidden');
        img.removeAttribute('src');
        if (removeBtn) removeBtn.classList.add('hidden');
        return;
      }
      img.onload = function () { wrap.classList.remove('hidden'); if (removeBtn) removeBtn.classList.remove('hidden'); };
      img.onerror = function () { wrap.classList.add('hidden'); if (removeBtn) removeBtn.classList.add('hidden'); };
      img.src = u;
    }

    function setLogoPreviewLocal(file) {
      revokePreviewObjectUrl();
      var wrap = document.getElementById('logoPreviewWrap');
      var img = document.getElementById('logoPreview');
      var removeBtn = document.getElementById('logo_remove_btn');
      if (!wrap || !img || !file) return;
      previewObjectUrl = URL.createObjectURL(file);
      img.onload = function () { wrap.classList.remove('hidden'); if (removeBtn) removeBtn.classList.remove('hidden'); };
      img.onerror = function () { wrap.classList.add('hidden'); };
      img.src = previewObjectUrl;
    }

    function setWatermarkPreviewFromUrl(url) {
      revokeWatermarkPreviewObjectUrl();
      var wrap = document.getElementById('watermarkPreviewWrap');
      var img = document.getElementById('watermarkPreview');
      var removeBtn = document.getElementById('watermark_remove_btn');
      if (!wrap || !img) return;
      var u = String(url || '').trim();
      currentWatermarkUrl = u;
      if (!u) {
        wrap.classList.add('hidden');
        img.removeAttribute('src');
        if (removeBtn) removeBtn.classList.add('hidden');
        return;
      }
      img.onload = function () {
        wrap.classList.remove('hidden');
        if (removeBtn) removeBtn.classList.remove('hidden');
        syncOpacityLabel();
      };
      img.onerror = function () {
        // Keep URL in state; only hide preview if the file truly fails to load
        wrap.classList.add('hidden');
        if (removeBtn) removeBtn.classList.remove('hidden');
      };
      img.src = u;
      syncOpacityLabel();
    }

    function setWatermarkPreviewLocal(file) {
      revokeWatermarkPreviewObjectUrl();
      var wrap = document.getElementById('watermarkPreviewWrap');
      var img = document.getElementById('watermarkPreview');
      var removeBtn = document.getElementById('watermark_remove_btn');
      if (!wrap || !img || !file) return;
      watermarkPreviewObjectUrl = URL.createObjectURL(file);
      img.onload = function () {
        wrap.classList.remove('hidden');
        if (removeBtn) removeBtn.classList.remove('hidden');
        syncOpacityLabel();
      };
      img.onerror = function () { wrap.classList.add('hidden'); };
      img.src = watermarkPreviewObjectUrl;
      syncOpacityLabel();
    }

    async function loadTenant() {
      try {
        var res = await axios.get('/api/my-tenant');
        if (!res.data || res.data.success !== true || !res.data.data) {
          showLoadError((res.data && res.data.error) ? res.data.error : 'تعذر تحميل بيانات الشركة.');
          return;
        }
        var d = res.data.data;
        document.getElementById('company_name').value = d.company_name || '';
        document.getElementById('contact_email').value = d.contact_email || '';
        document.getElementById('contact_phone').value = d.contact_phone || '';
        var waGreetingEl = document.getElementById('whatsapp_greeting');
        if (waGreetingEl) waGreetingEl.value = d.whatsapp_greeting || '';
        var cityEl = document.getElementById('city');
        if (cityEl) cityEl.value = d.city || '';
        var addrEl = document.getElementById('address');
        if (addrEl) addrEl.value = d.address || '';
        markLogoRemoved = false;
        markWatermarkRemoved = false;
        markHeaderRemoved = false;
        markFooterRemoved = false;
        watermarkPendingUrl = null;
        useCompanyLogoAsWatermark = false;
        var hint = document.getElementById('logo_file_hint');
        var fin = document.getElementById('logo_file');
        if (hint) { hint.textContent = ''; hint.classList.add('hidden'); }
        if (fin) fin.value = '';
        setLogoPreviewFromServer(d.logo_url || '');

        var wmEnabled = document.getElementById('document_watermark_enabled');
        if (wmEnabled) wmEnabled.checked = !!d.document_watermark_enabled;
        var opacityPct = Math.round((Number(d.document_watermark_opacity) || 0.12) * 100);
        if (opacityPct < 3) opacityPct = 3;
        if (opacityPct > 25) opacityPct = 25;
        var opacityEl = document.getElementById('document_watermark_opacity');
        if (opacityEl) opacityEl.value = String(opacityPct);
        syncOpacityLabel();
        var wmHint = document.getElementById('watermark_file_hint');
        var wmFin = document.getElementById('watermark_file');
        if (wmHint) { wmHint.textContent = ''; wmHint.classList.add('hidden'); }
        if (wmFin) wmFin.value = '';
        setWatermarkPreviewFromUrl(d.document_watermark_url || '');

        var headerEnabled = document.getElementById('document_header_enabled');
        if (headerEnabled) headerEnabled.checked = !!d.document_header_enabled;
        var headerOpacityPct = Math.round((Number(d.document_header_opacity) || 1) * 100);
        if (headerOpacityPct < 10) headerOpacityPct = 10;
        if (headerOpacityPct > 100) headerOpacityPct = 100;
        var headerOpacityEl = document.getElementById('document_header_opacity');
        if (headerOpacityEl) headerOpacityEl.value = String(headerOpacityPct);
        syncLetterheadOpacity('header');
        var headerHint = document.getElementById('header_file_hint');
        var headerFin = document.getElementById('header_file');
        if (headerHint) { headerHint.textContent = ''; headerHint.classList.add('hidden'); }
        if (headerFin) headerFin.value = '';
        setLetterheadPreviewFromUrl('header', d.document_header_url || '');

        var footerEnabled = document.getElementById('document_footer_enabled');
        if (footerEnabled) footerEnabled.checked = !!d.document_footer_enabled;
        var footerOpacityPct = Math.round((Number(d.document_footer_opacity) || 1) * 100);
        if (footerOpacityPct < 10) footerOpacityPct = 10;
        if (footerOpacityPct > 100) footerOpacityPct = 100;
        var footerOpacityEl = document.getElementById('document_footer_opacity');
        if (footerOpacityEl) footerOpacityEl.value = String(footerOpacityPct);
        syncLetterheadOpacity('footer');
        var footerHint = document.getElementById('footer_file_hint');
        var footerFin = document.getElementById('footer_file');
        if (footerHint) { footerHint.textContent = ''; footerHint.classList.add('hidden'); }
        if (footerFin) footerFin.value = '';
        setLetterheadPreviewFromUrl('footer', d.document_footer_url || '');
      } catch (e) {
        var msg = 'تعذر تحميل البيانات.';
        if (e.response && e.response.data && e.response.data.error) msg = e.response.data.error;
        showLoadError(msg);
      }
    }

    document.getElementById('logo_file').addEventListener('change', function () {
      markLogoRemoved = false;
      var hint = document.getElementById('logo_file_hint');
      var file = this.files && this.files[0];
      if (!file) {
        if (hint) { hint.textContent = ''; hint.classList.add('hidden'); }
        return;
      }
      if (hint) {
        hint.textContent = 'تم اختيار: ' + file.name + ' — اضغط «حفظ التعديلات» لرفع الشعار وتطبيقه.';
        hint.classList.remove('hidden');
      }
      setLogoPreviewLocal(file);
    });

    document.getElementById('logo_remove_btn').addEventListener('click', function () {
      var fin = document.getElementById('logo_file');
      if (fin) fin.value = '';
      var hint = document.getElementById('logo_file_hint');
      if (hint) { hint.textContent = ''; hint.classList.add('hidden'); }
      markLogoRemoved = true;
      currentLogoUrl = '';
      revokePreviewObjectUrl();
      var wrap = document.getElementById('logoPreviewWrap');
      var img = document.getElementById('logoPreview');
      if (img) img.removeAttribute('src');
      if (wrap) wrap.classList.add('hidden');
      this.classList.add('hidden');
    });

    document.getElementById('document_watermark_opacity').addEventListener('input', syncOpacityLabel);
    document.getElementById('document_header_opacity').addEventListener('input', function () { syncLetterheadOpacity('header'); });
    document.getElementById('document_footer_opacity').addEventListener('input', function () { syncLetterheadOpacity('footer'); });

    function bindLetterheadFile(kind, uploadMarkRemovedSetter) {
      document.getElementById(kind + '_file').addEventListener('change', function () {
        uploadMarkRemovedSetter(false);
        var hint = document.getElementById(kind + '_file_hint');
        var file = this.files && this.files[0];
        if (!file) {
          if (hint) { hint.textContent = ''; hint.classList.add('hidden'); }
          return;
        }
        if (hint) {
          hint.textContent = 'تم اختيار: ' + file.name + ' — اضغط «حفظ التعديلات» لرفع الصورة.';
          hint.classList.remove('hidden');
        }
        setLetterheadPreviewLocal(kind, file);
      });
      document.getElementById(kind + '_remove_btn').addEventListener('click', function () {
        var fin = document.getElementById(kind + '_file');
        if (fin) fin.value = '';
        var hint = document.getElementById(kind + '_file_hint');
        if (hint) { hint.textContent = ''; hint.classList.add('hidden'); }
        uploadMarkRemovedSetter(true);
        if (kind === 'header') currentHeaderUrl = '';
        else currentFooterUrl = '';
        setLetterheadPreviewFromUrl(kind, '');
        this.classList.add('hidden');
      });
    }
    bindLetterheadFile('header', function (v) { markHeaderRemoved = v; });
    bindLetterheadFile('footer', function (v) { markFooterRemoved = v; });

    document.getElementById('watermark_file').addEventListener('change', function () {
      markWatermarkRemoved = false;
      watermarkPendingUrl = null;
      useCompanyLogoAsWatermark = false;
      var hint = document.getElementById('watermark_file_hint');
      var file = this.files && this.files[0];
      if (!file) {
        if (hint) { hint.textContent = ''; hint.classList.add('hidden'); }
        return;
      }
      if (hint) {
        hint.textContent = 'تم اختيار: ' + file.name + ' — اضغط «حفظ التعديلات» لرفع الصورة.';
        hint.classList.remove('hidden');
      }
      setWatermarkPreviewLocal(file);
    });

    document.getElementById('watermark_use_logo_btn').addEventListener('click', function () {
      var logoFile = document.getElementById('logo_file');
      var pendingLogoFile = logoFile && logoFile.files && logoFile.files[0];
      var hint = document.getElementById('watermark_file_hint');
      var wmFin = document.getElementById('watermark_file');
      if (wmFin) wmFin.value = '';
      markWatermarkRemoved = false;
      useCompanyLogoAsWatermark = true;
      if (pendingLogoFile) {
        watermarkPendingUrl = null;
        setWatermarkPreviewLocal(pendingLogoFile);
        if (hint) {
          hint.textContent = 'سيتم استخدام شعار الشركة المختار عند الحفظ.';
          hint.classList.remove('hidden');
        }
        return;
      }
      if (!currentLogoUrl) {
        useCompanyLogoAsWatermark = false;
        if (hint) {
          hint.textContent = 'لا يوجد شعار شركة محفوظ لاستخدامه. ارفع شعاراً أولاً أو اختر صورة للعلامة المائية.';
          hint.classList.remove('hidden');
        }
        return;
      }
      watermarkPendingUrl = currentLogoUrl;
      setWatermarkPreviewFromUrl(currentLogoUrl);
      if (hint) {
        hint.textContent = 'سيتم استخدام شعار الشركة الحالي كعلامة مائية عند الحفظ.';
        hint.classList.remove('hidden');
      }
    });

    document.getElementById('watermark_remove_btn').addEventListener('click', function () {
      var fin = document.getElementById('watermark_file');
      if (fin) fin.value = '';
      var hint = document.getElementById('watermark_file_hint');
      if (hint) { hint.textContent = ''; hint.classList.add('hidden'); }
      markWatermarkRemoved = true;
      watermarkPendingUrl = null;
      useCompanyLogoAsWatermark = false;
      currentWatermarkUrl = '';
      revokeWatermarkPreviewObjectUrl();
      var wrap = document.getElementById('watermarkPreviewWrap');
      var img = document.getElementById('watermarkPreview');
      if (img) img.removeAttribute('src');
      if (wrap) wrap.classList.add('hidden');
      this.classList.add('hidden');
    });

    document.getElementById('companyForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = document.getElementById('formMessage');
      var btn = document.getElementById('saveBtn');
      msg.textContent = '';
      msg.className = 'mt-4 text-sm';

      var fileInput = document.getElementById('logo_file');
      var file = fileInput && fileInput.files && fileInput.files[0];
      var wmFileInput = document.getElementById('watermark_file');
      var wmFile = wmFileInput && wmFileInput.files && wmFileInput.files[0];

      var phoneRaw = document.getElementById('contact_phone').value.trim();
      var cityVal = (document.getElementById('city') && document.getElementById('city').value) ? document.getElementById('city').value.trim() : '';
      var addrVal = document.getElementById('address') ? document.getElementById('address').value.trim() : '';
      var payload = {
        company_name: document.getElementById('company_name').value.trim(),
        contact_email: document.getElementById('contact_email').value.trim() || null,
        contact_phone: phoneRaw === '' ? null : phoneRaw,
        whatsapp_greeting: (document.getElementById('whatsapp_greeting') && document.getElementById('whatsapp_greeting').value.trim()) || null,
        city: cityVal === '' ? null : cityVal,
        address: addrVal === '' ? null : addrVal,
        document_watermark_enabled: !!(document.getElementById('document_watermark_enabled') && document.getElementById('document_watermark_enabled').checked),
        document_watermark_opacity: getOpacityFraction(),
        document_header_enabled: !!(document.getElementById('document_header_enabled') && document.getElementById('document_header_enabled').checked),
        document_header_opacity: getLetterheadOpacityFraction('document_header_opacity'),
        document_footer_enabled: !!(document.getElementById('document_footer_enabled') && document.getElementById('document_footer_enabled').checked),
        document_footer_opacity: getLetterheadOpacityFraction('document_footer_opacity')
      };

      btn.disabled = true;
      try {
        if (file) {
          var fd = new FormData();
          fd.append('file', file);
          var up = await axios.post('/api/my-tenant/logo-upload', fd);
          if (!up.data || up.data.success !== true || !up.data.url) {
            msg.textContent = (up.data && up.data.error) ? up.data.error : 'فشل رفع الشعار.';
            msg.className = 'mt-4 text-sm text-red-600';
            return;
          }
          payload.logo_url = up.data.url;
          currentLogoUrl = up.data.url;
        } else if (markLogoRemoved) {
          payload.logo_url = null;
          currentLogoUrl = '';
        }

        // Only touch document_watermark_url when the user explicitly changed it.
        // Do NOT rewrite it to the company logo on every save — that was wiping custom uploads.
        if (wmFile) {
          var wfd = new FormData();
          wfd.append('file', wmFile);
          var wup = await axios.post('/api/my-tenant/watermark-upload', wfd);
          if (!wup.data || wup.data.success !== true || !wup.data.url) {
            msg.textContent = (wup.data && wup.data.error) ? wup.data.error : 'فشل رفع العلامة المائية.';
            msg.className = 'mt-4 text-sm text-red-600';
            return;
          }
          payload.document_watermark_url = wup.data.url;
        } else if (markWatermarkRemoved) {
          payload.document_watermark_url = null;
        } else if (useCompanyLogoAsWatermark) {
          var logoForWm = payload.logo_url || currentLogoUrl;
          if (logoForWm) payload.document_watermark_url = logoForWm;
        } else if (watermarkPendingUrl) {
          payload.document_watermark_url = watermarkPendingUrl;
        } else if (
          payload.document_watermark_enabled &&
          !currentWatermarkUrl &&
          (payload.logo_url || currentLogoUrl)
        ) {
          // First enable with no watermark image yet → seed from company logo once
          payload.document_watermark_url = payload.logo_url || currentLogoUrl;
        }

        var headerFileInput = document.getElementById('header_file');
        var headerFile = headerFileInput && headerFileInput.files && headerFileInput.files[0];
        if (headerFile) {
          var hfd = new FormData();
          hfd.append('file', headerFile);
          var hup = await axios.post('/api/my-tenant/header-upload', hfd);
          if (!hup.data || hup.data.success !== true || !hup.data.url) {
            msg.textContent = (hup.data && hup.data.error) ? hup.data.error : 'فشل رفع ترويسة الصفحة.';
            msg.className = 'mt-4 text-sm text-red-600';
            return;
          }
          payload.document_header_url = hup.data.url;
        } else if (markHeaderRemoved) {
          payload.document_header_url = null;
        }

        var footerFileInput = document.getElementById('footer_file');
        var footerFile = footerFileInput && footerFileInput.files && footerFileInput.files[0];
        if (footerFile) {
          var ffd = new FormData();
          ffd.append('file', footerFile);
          var fup = await axios.post('/api/my-tenant/footer-upload', ffd);
          if (!fup.data || fup.data.success !== true || !fup.data.url) {
            msg.textContent = (fup.data && fup.data.error) ? fup.data.error : 'فشل رفع تذييل الصفحة.';
            msg.className = 'mt-4 text-sm text-red-600';
            return;
          }
          payload.document_footer_url = fup.data.url;
        } else if (markFooterRemoved) {
          payload.document_footer_url = null;
        }

        var res = await axios.patch('/api/my-tenant', payload);
        if (res.data && res.data.success) {
          msg.textContent = 'تم حفظ التعديلات بنجاح.';
          msg.className = 'mt-4 text-sm text-green-700';
          markLogoRemoved = false;
          markWatermarkRemoved = false;
          markHeaderRemoved = false;
          markFooterRemoved = false;
          watermarkPendingUrl = null;
          useCompanyLogoAsWatermark = false;
          if (fileInput) fileInput.value = '';
          if (wmFileInput) wmFileInput.value = '';
          if (headerFileInput) headerFileInput.value = '';
          if (footerFileInput) footerFileInput.value = '';
          var hint = document.getElementById('logo_file_hint');
          if (hint) { hint.textContent = ''; hint.classList.add('hidden'); }
          var wmHint = document.getElementById('watermark_file_hint');
          if (wmHint) { wmHint.textContent = ''; wmHint.classList.add('hidden'); }
          var headerHint = document.getElementById('header_file_hint');
          if (headerHint) { headerHint.textContent = ''; headerHint.classList.add('hidden'); }
          var footerHint = document.getElementById('footer_file_hint');
          if (footerHint) { footerHint.textContent = ''; footerHint.classList.add('hidden'); }
          var saved = res.data.data || {};
          var url = saved.logo_url;
          revokePreviewObjectUrl();
          setLogoPreviewFromServer(url || '');
          // Prefer server value; if server omitted it, keep the local URL we already have
          var wmUrl = Object.prototype.hasOwnProperty.call(saved, 'document_watermark_url')
            ? (saved.document_watermark_url || '')
            : currentWatermarkUrl;
          revokeWatermarkPreviewObjectUrl();
          setWatermarkPreviewFromUrl(wmUrl || '');
          var headerUrl = Object.prototype.hasOwnProperty.call(saved, 'document_header_url')
            ? (saved.document_header_url || '')
            : currentHeaderUrl;
          setLetterheadPreviewFromUrl('header', headerUrl || '');
          var footerUrl = Object.prototype.hasOwnProperty.call(saved, 'document_footer_url')
            ? (saved.document_footer_url || '')
            : currentFooterUrl;
          setLetterheadPreviewFromUrl('footer', footerUrl || '');
          var wmEnabled = document.getElementById('document_watermark_enabled');
          if (wmEnabled && saved) wmEnabled.checked = !!saved.document_watermark_enabled;
          var headerEnabledEl = document.getElementById('document_header_enabled');
          if (headerEnabledEl && saved) headerEnabledEl.checked = !!saved.document_header_enabled;
          var footerEnabledEl = document.getElementById('document_footer_enabled');
          if (footerEnabledEl && saved) footerEnabledEl.checked = !!saved.document_footer_enabled;
          if (saved.document_watermark_opacity != null) {
            var opacityEl = document.getElementById('document_watermark_opacity');
            if (opacityEl) {
              opacityEl.value = String(Math.round(Number(saved.document_watermark_opacity) * 100));
              syncOpacityLabel();
            }
          }
          if (saved.document_header_opacity != null) {
            var headerOpacityEl = document.getElementById('document_header_opacity');
            if (headerOpacityEl) {
              headerOpacityEl.value = String(Math.round(Number(saved.document_header_opacity) * 100));
              syncLetterheadOpacity('header');
            }
          }
          if (saved.document_footer_opacity != null) {
            var footerOpacityEl = document.getElementById('document_footer_opacity');
            if (footerOpacityEl) {
              footerOpacityEl.value = String(Math.round(Number(saved.document_footer_opacity) * 100));
              syncLetterheadOpacity('footer');
            }
          }
        } else {
          msg.textContent = (res.data && res.data.error) ? res.data.error : 'فشل الحفظ.';
          msg.className = 'mt-4 text-sm text-red-600';
        }
      } catch (err) {
        var em = 'فشل الحفظ.';
        if (err.response && err.response.data && err.response.data.error) em = err.response.data.error;
        msg.textContent = em;
        msg.className = 'mt-4 text-sm text-red-600';
      } finally {
        btn.disabled = false;
      }
    });

    loadTenant();
  </script>
</body>
</html>
`
