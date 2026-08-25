export function buildTenantLoginRestrictionPage(tenantId: number, tenantName: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>أمان تسجيل الدخول — ${tenantName}</title>
  <link rel="stylesheet" href="/tailwind.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50 min-h-screen">

  <div class="border-b border-slate-200/90 bg-slate-50/90">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap gap-3 items-center justify-between">
      <a href="/admin/tenants" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">← قائمة الشركات</a>
    </div>
  </div>

  <div class="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <h1 class="text-2xl font-bold flex items-center gap-3">
        <i class="fas fa-shield-alt shrink-0"></i>
        أمان تسجيل الدخول
      </h1>
      <p class="text-emerald-100 text-sm mt-1 opacity-95">${tenantName}</p>
    </div>
  </div>

  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

    <div id="loadError" class="hidden rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3"></div>

    <!-- Settings card -->
    <div class="bg-white rounded-xl shadow p-5 space-y-5">
      <h2 class="font-bold text-gray-800 text-lg flex items-center gap-2">
        <i class="fas fa-cog text-emerald-600"></i>
        إعدادات القيود
      </h2>

      <!-- home_city -->
      <div>
        <label class="block text-sm font-bold text-gray-700 mb-1" dir="rtl">
          <i class="fas fa-city text-emerald-600 ml-1"></i>
          المدينة الرئيسية (لسجل تسجيل الدخول الخارجي)
        </label>
        <div class="flex gap-2">
          <input type="text" id="homeCityInput" placeholder="مثال: Riyadh" dir="ltr"
            class="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm" />
          <button id="saveCityBtn"
            class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all">
            <i class="fas fa-save"></i>
            حفظ
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-1.5" dir="rtl">
          يُقارن بـ cf.city من Cloudflare. اكتب الاسم بالإنجليزية بالضبط (حساس لحالة الأحرف عند المقارنة). اتركه فارغاً لتعطيل سجل المدينة.
        </p>
        <div id="cityMsg" class="mt-1.5 text-sm hidden"></div>
      </div>

      <!-- IP restriction toggle -->
      <div class="border-t border-gray-100 pt-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-bold text-gray-700" dir="rtl">
              <i class="fas fa-network-wired text-emerald-600 ml-1"></i>
              قيد عنوان IP
            </p>
            <p class="text-xs text-gray-500 mt-0.5" dir="rtl">
              يمنع تسجيل الدخول من عناوين IP غير معروفة — يرسل رمز تحقق للمستخدم عند محاولة تسجيل الدخول من عنوان جديد.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span id="ipRestrictionBadge" class="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">جاري التحميل...</span>
            <button id="toggleIpRestrictionBtn"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-gray-200 text-gray-700 hover:bg-gray-300">
              <i id="ipToggleIcon" class="fas fa-toggle-off"></i>
              <span id="ipToggleLabel">—</span>
            </button>
          </div>
        </div>
        <div id="ipToggleMsg" class="mt-2 text-sm hidden"></div>
      </div>

      <!-- Device restriction toggle -->
      <div class="border-t border-gray-100 pt-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-bold text-gray-700" dir="rtl">
              <i class="fas fa-mobile-alt text-emerald-600 ml-1"></i>
              قيد الجهاز
            </p>
            <p class="text-xs text-gray-500 mt-0.5" dir="rtl">
              يمنع تسجيل الدخول من أجهزة غير معروفة — يرسل رمز تحقق إلى بريد الشركة عند استخدام جهاز جديد.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span id="deviceRestrictionBadge" class="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">جاري التحميل...</span>
            <button id="toggleDeviceRestrictionBtn"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-gray-200 text-gray-700 hover:bg-gray-300">
              <i id="deviceToggleIcon" class="fas fa-toggle-off"></i>
              <span id="deviceToggleLabel">—</span>
            </button>
          </div>
        </div>
        <div id="deviceToggleMsg" class="mt-2 text-sm hidden"></div>
      </div>
    </div>

    <!-- Tenant IP allowlist (read-only for superadmin — managed by company admin) -->
    <div class="bg-white rounded-xl shadow p-5">
      <h2 class="font-bold text-gray-800 mb-1 flex items-center gap-2">
        <i class="fas fa-network-wired text-emerald-600"></i>
        قائمة IP المسموح بها (تُدار من مسؤول الشركة)
      </h2>
      <p class="text-xs text-gray-500 mb-3" dir="rtl">هذه عناوين IP المكتب التي أضافها مسؤول الشركة. لا يمكن تعديلها من هنا.</p>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase">
              <th class="py-2 px-3">العنوان / النطاق</th>
              <th class="py-2 px-3">الوصف</th>
              <th class="py-2 px-3">تاريخ الإضافة</th>
            </tr>
          </thead>
          <tbody id="ipTable">
            <tr><td colspan="3" class="py-4 text-center text-gray-400 text-sm">جاري التحميل...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Geo log -->
    <div class="bg-white rounded-xl shadow p-5">
      <h2 class="font-bold text-gray-800 mb-1 flex items-center gap-2">
        <i class="fas fa-map-marked-alt text-emerald-600"></i>
        سجل تسجيل الدخول خارج المدينة
      </h2>
      <p class="text-xs text-gray-500 mb-3" dir="rtl">آخر 100 تسجيل دخول من مدينة مختلفة عن المدينة الرئيسية.</p>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase">
              <th class="py-2 px-3">المستخدم</th>
              <th class="py-2 px-3">IP</th>
              <th class="py-2 px-3">البلد</th>
              <th class="py-2 px-3">المدينة</th>
              <th class="py-2 px-3">تحقق OTP</th>
              <th class="py-2 px-3">التاريخ</th>
            </tr>
          </thead>
          <tbody id="geoTable">
            <tr><td colspan="6" class="py-4 text-center text-gray-400 text-sm">جاري التحميل...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <script>
    var TENANT_ID = ${tenantId};
    var ipRestrictionEnabled = false;
    var deviceRestrictionEnabled = false;

    function esc(s) {
      return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function fmtDate(s) {
      if (!s) return '—';
      try { return new Date(s).toLocaleString('ar-SA'); } catch (_) { return s; }
    }

    function showErr(msg) {
      var el = document.getElementById('loadError');
      el.textContent = msg || '';
      el.classList.toggle('hidden', !msg);
    }

    function setMsg(elId, msg, isErr) {
      var el = document.getElementById(elId);
      if (!el) return;
      el.textContent = msg || '';
      el.className = 'mt-1.5 text-sm ' + (isErr ? 'text-red-600' : 'text-green-700');
      el.classList.toggle('hidden', !msg);
    }

    function updateToggleUI(badgeId, btnId, iconId, labelId, enabled) {
      var badge = document.getElementById(badgeId);
      var btn = document.getElementById(btnId);
      var icon = document.getElementById(iconId);
      var label = document.getElementById(labelId);
      if (enabled) {
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800';
        badge.textContent = 'مفعّل';
        btn.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-red-100 text-red-700 hover:bg-red-200';
        icon.className = 'fas fa-toggle-on';
        label.textContent = 'إيقاف';
      } else {
        badge.className = 'px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600';
        badge.textContent = 'معطّل';
        btn.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-green-100 text-green-700 hover:bg-green-200';
        icon.className = 'fas fa-toggle-off';
        label.textContent = 'تفعيل';
      }
    }

    function renderIpTable(ips) {
      var tb = document.getElementById('ipTable');
      if (!ips || !ips.length) {
        tb.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-gray-400 text-sm">لا توجد عناوين مضافة.</td></tr>';
        return;
      }
      tb.innerHTML = ips.map(function(r) {
        return '<tr class="border-b hover:bg-gray-50">' +
          '<td class="py-2 px-3 font-mono text-sm">' + esc(r.ip) + '</td>' +
          '<td class="py-2 px-3 text-gray-600">' + esc(r.label || '—') + '</td>' +
          '<td class="py-2 px-3 text-gray-500">' + fmtDate(r.created_at) + '</td>' +
        '</tr>';
      }).join('');
    }

    function renderGeoTable(rows) {
      var tb = document.getElementById('geoTable');
      if (!rows || !rows.length) {
        tb.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-gray-400 text-sm">لا توجد سجلات بعد.</td></tr>';
        return;
      }
      tb.innerHTML = rows.map(function(r) {
        var otpBadge = r.otp_verified
          ? '<span class="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold">نعم</span>'
          : '<span class="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs">لا</span>';
        return '<tr class="border-b hover:bg-gray-50">' +
          '<td class="py-2 px-3 font-medium">' + esc(r.username || r.user_id) + '</td>' +
          '<td class="py-2 px-3 font-mono text-xs">' + esc(r.ip) + '</td>' +
          '<td class="py-2 px-3">' + esc(r.country || '—') + '</td>' +
          '<td class="py-2 px-3">' + esc(r.city || '—') + '</td>' +
          '<td class="py-2 px-3">' + otpBadge + '</td>' +
          '<td class="py-2 px-3 text-gray-500 text-xs">' + fmtDate(r.logged_at) + '</td>' +
        '</tr>';
      }).join('');
    }

    async function loadData() {
      showErr('');
      try {
        var res = await axios.get('/api/admin/tenants/' + TENANT_ID + '/login-restriction');
        if (!res.data || !res.data.success) {
          showErr((res.data && res.data.error) || 'تعذر تحميل البيانات');
          return;
        }
        document.getElementById('homeCityInput').value = res.data.home_city || '';
        ipRestrictionEnabled = !!res.data.login_ip_restriction_enabled;
        deviceRestrictionEnabled = !!res.data.login_device_restriction_enabled;
        updateToggleUI('ipRestrictionBadge', 'toggleIpRestrictionBtn', 'ipToggleIcon', 'ipToggleLabel', ipRestrictionEnabled);
        updateToggleUI('deviceRestrictionBadge', 'toggleDeviceRestrictionBtn', 'deviceToggleIcon', 'deviceToggleLabel', deviceRestrictionEnabled);
        renderIpTable(res.data.tenant_ips || []);
        renderGeoTable(res.data.geo_log || []);
      } catch (e) {
        showErr('تعذر تحميل البيانات');
      }
    }

    document.getElementById('saveCityBtn').addEventListener('click', async function() {
      setMsg('cityMsg', '', false);
      var city = document.getElementById('homeCityInput').value.trim() || null;
      try {
        var res = await axios.patch('/api/admin/tenants/' + TENANT_ID + '/login-restriction', { home_city: city });
        if (!res.data || !res.data.success) {
          setMsg('cityMsg', (res.data && res.data.error) || 'فشل الحفظ', true);
          return;
        }
        setMsg('cityMsg', 'تم حفظ المدينة', false);
      } catch (e) {
        setMsg('cityMsg', (e.response && e.response.data && e.response.data.error) || 'فشل الحفظ', true);
      }
    });

    document.getElementById('toggleIpRestrictionBtn').addEventListener('click', async function() {
      setMsg('ipToggleMsg', '', false);
      var newVal = ipRestrictionEnabled ? 0 : 1;
      var confirmMsg = newVal
        ? 'هل أنت متأكد من تفعيل قيد عنوان IP لهذه الشركة؟'
        : 'هل تريد إيقاف قيد عنوان IP؟ سيتمكن المستخدمون من الدخول من أي عنوان IP.';
      if (!confirm(confirmMsg)) return;
      try {
        var res = await axios.patch('/api/admin/tenants/' + TENANT_ID + '/login-restriction', {
          login_ip_restriction_enabled: newVal
        });
        if (!res.data || !res.data.success) {
          setMsg('ipToggleMsg', (res.data && res.data.error) || 'فشل التحديث', true);
          return;
        }
        ipRestrictionEnabled = !!newVal;
        updateToggleUI('ipRestrictionBadge', 'toggleIpRestrictionBtn', 'ipToggleIcon', 'ipToggleLabel', ipRestrictionEnabled);
        setMsg('ipToggleMsg', newVal ? 'تم تفعيل قيد IP' : 'تم إيقاف قيد IP', false);
      } catch (e) {
        setMsg('ipToggleMsg', (e.response && e.response.data && e.response.data.error) || 'فشل التحديث', true);
      }
    });

    document.getElementById('toggleDeviceRestrictionBtn').addEventListener('click', async function() {
      setMsg('deviceToggleMsg', '', false);
      var newVal = deviceRestrictionEnabled ? 0 : 1;
      var confirmMsg = newVal
        ? 'هل أنت متأكد من تفعيل قيد الجهاز لهذه الشركة؟'
        : 'هل تريد إيقاف قيد الجهاز؟ سيتمكن المستخدمون من الدخول من أي جهاز دون التحقق.';
      if (!confirm(confirmMsg)) return;
      try {
        var res = await axios.patch('/api/admin/tenants/' + TENANT_ID + '/login-restriction', {
          login_device_restriction_enabled: newVal
        });
        if (!res.data || !res.data.success) {
          setMsg('deviceToggleMsg', (res.data && res.data.error) || 'فشل التحديث', true);
          return;
        }
        deviceRestrictionEnabled = !!newVal;
        updateToggleUI('deviceRestrictionBadge', 'toggleDeviceRestrictionBtn', 'deviceToggleIcon', 'deviceToggleLabel', deviceRestrictionEnabled);
        setMsg('deviceToggleMsg', newVal ? 'تم تفعيل قيد الجهاز' : 'تم إيقاف قيد الجهاز', false);
      } catch (e) {
        setMsg('deviceToggleMsg', (e.response && e.response.data && e.response.data.error) || 'فشل التحديث', true);
      }
    });

    loadData();
  </script>
</body>
</html>
`
}
