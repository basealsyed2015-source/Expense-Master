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
      عدّل اسم الشركة وبيانات التواصل والموقع (المدينة والعنوان) وشعار الشركة في صفحة التواصل وروابط الإحالة.
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

    function setLogoPreviewFromServer(url) {
      revokePreviewObjectUrl();
      var wrap = document.getElementById('logoPreviewWrap');
      var img = document.getElementById('logoPreview');
      var removeBtn = document.getElementById('logo_remove_btn');
      if (!wrap || !img) return;
      var u = String(url || '').trim();
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
        var cityEl = document.getElementById('city');
        if (cityEl) cityEl.value = d.city || '';
        var addrEl = document.getElementById('address');
        if (addrEl) addrEl.value = d.address || '';
        markLogoRemoved = false;
        var hint = document.getElementById('logo_file_hint');
        var fin = document.getElementById('logo_file');
        if (hint) { hint.textContent = ''; hint.classList.add('hidden'); }
        if (fin) fin.value = '';
        setLogoPreviewFromServer(d.logo_url || '');
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
      revokePreviewObjectUrl();
      var wrap = document.getElementById('logoPreviewWrap');
      var img = document.getElementById('logoPreview');
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

      var phoneRaw = document.getElementById('contact_phone').value.trim();
      var cityVal = (document.getElementById('city') && document.getElementById('city').value) ? document.getElementById('city').value.trim() : '';
      var addrVal = document.getElementById('address') ? document.getElementById('address').value.trim() : '';
      var payload = {
        company_name: document.getElementById('company_name').value.trim(),
        contact_email: document.getElementById('contact_email').value.trim() || null,
        contact_phone: phoneRaw === '' ? null : phoneRaw,
        city: cityVal === '' ? null : cityVal,
        address: addrVal === '' ? null : addrVal
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
        } else if (markLogoRemoved) {
          payload.logo_url = null;
        }

        var res = await axios.patch('/api/my-tenant', payload);
        if (res.data && res.data.success) {
          msg.textContent = 'تم حفظ التعديلات بنجاح.';
          msg.className = 'mt-4 text-sm text-green-700';
          markLogoRemoved = false;
          if (fileInput) fileInput.value = '';
          var hint = document.getElementById('logo_file_hint');
          if (hint) { hint.textContent = ''; hint.classList.add('hidden'); }
          var url = res.data.data && res.data.data.logo_url;
          revokePreviewObjectUrl();
          setLogoPreviewFromServer(url || '');
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
