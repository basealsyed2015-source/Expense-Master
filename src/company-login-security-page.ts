function topBar() {
  return `<div class="border-b border-slate-200/90 bg-slate-50/90">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap gap-3 items-center justify-between">
      <a href="/admin/panel" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">← العودة للوحة الرئيسية</a>
      <a href="/admin/company-settings" class="text-sm font-medium text-teal-700 hover:text-teal-900 hover:underline">إعدادات الشركة العامة</a>
    </div>
  </div>`
}

export const companyLoginSecurityPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>أمان تسجيل الدخول</title>
  <link rel="stylesheet" href="/tailwind.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50 min-h-screen">
  ${topBar()}

  <div class="bg-gradient-to-r from-teal-600 to-teal-800 text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <h1 class="text-2xl font-bold flex items-center" dir="rtl">
        <i class="fas fa-shield-alt ml-3 shrink-0"></i>
        أمان تسجيل الدخول
      </h1>
      <p class="text-teal-100 text-sm mt-1 opacity-95">إدارة عناوين IP المسموح بها لتسجيل دخول موظفي الشركة.</p>
    </div>
  </div>

  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

    <!-- Status banner -->
    <div id="statusBanner" class="hidden rounded-xl border px-4 py-3 text-sm font-medium flex items-center gap-2"></div>

    <!-- Current IP card -->
    <div class="bg-white rounded-xl shadow p-5">
      <h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <i class="fas fa-map-pin text-teal-600"></i>
        عنوان IP الحالي
      </h2>
      <div class="flex flex-wrap items-center gap-3">
        <code id="yourIp" class="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg font-mono text-sm">جاري التحميل...</code>
        <button id="addCurrentIpBtn"
          class="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all">
          <i class="fas fa-plus-circle"></i>
          إضافة هذا العنوان
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-2" dir="rtl">أضف عنوان IP مكتبك وأنت جالس فيه حتى يُتعرف عليه تلقائياً.</p>
    </div>

    <!-- Add custom IP -->
    <div class="bg-white rounded-xl shadow p-5">
      <h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <i class="fas fa-plus text-teal-600"></i>
        إضافة عنوان IP يدوياً
      </h2>
      <div class="flex flex-wrap gap-2">
        <input type="text" id="newIp" placeholder="مثال: 203.0.113.10 أو 203.0.113.0/24" dir="ltr"
          class="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm" />
        <input type="text" id="newLabel" placeholder="وصف (اختياري)" dir="rtl"
          class="flex-1 min-w-[160px] px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm" />
        <button id="addIpBtn"
          class="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all">
          <i class="fas fa-save"></i>
          حفظ
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-2" dir="rtl">يدعم عناوين IPv4 الكاملة ونطاقات CIDR (مثلاً /24).</p>
      <div id="addMsg" class="mt-2 text-sm hidden"></div>
    </div>

    <!-- IP list -->
    <div class="bg-white rounded-xl shadow p-5">
      <h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <i class="fas fa-list text-teal-600"></i>
        العناوين المسموح بها
      </h2>
      <div id="loadError" class="hidden mb-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm px-3 py-2"></div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase">
              <th class="py-2 px-3">العنوان / النطاق</th>
              <th class="py-2 px-3">الوصف</th>
              <th class="py-2 px-3">تاريخ الإضافة</th>
              <th class="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody id="ipTable">
            <tr><td colspan="4" class="py-6 text-center text-gray-400 text-sm">جاري التحميل...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Info note -->
    <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" dir="rtl">
      <i class="fas fa-info-circle ml-2"></i>
      <strong>ملاحظة:</strong> تفعيل قيود تسجيل الدخول يتم من قِبل المسؤول الرئيسي للمنصة فقط.
      العناوين التي تضيفها هنا ستُطبَّق فور تفعيل القيد.
      عند تسجيل الدخول من عنوان غير مُدرج، سيصل رمز تحقق إلى البريد الإلكتروني المسجّل.
    </div>

  </div>

  <script>
    var currentIp = '';

    function showErr(msg) {
      var el = document.getElementById('loadError');
      if (!el) return;
      el.textContent = msg || '';
      el.classList.toggle('hidden', !msg);
    }

    function setAddMsg(msg, isErr) {
      var el = document.getElementById('addMsg');
      if (!el) return;
      el.textContent = msg || '';
      el.className = 'mt-2 text-sm ' + (isErr ? 'text-red-600' : 'text-green-700');
      el.classList.toggle('hidden', !msg);
    }

    function fmtDate(s) {
      if (!s) return '—';
      try { return new Date(s).toLocaleDateString('ar-SA'); } catch (_) { return s; }
    }

    function escHtml(s) {
      return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function renderTable(ips) {
      var tb = document.getElementById('ipTable');
      if (!tb) return;
      if (!ips || !ips.length) {
        tb.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-gray-400 text-sm">لا توجد عناوين مضافة بعد.</td></tr>';
        return;
      }
      tb.innerHTML = ips.map(function(r) {
        return '<tr class="border-b hover:bg-gray-50">' +
          '<td class="py-2 px-3 font-mono text-sm">' + escHtml(r.ip) + '</td>' +
          '<td class="py-2 px-3 text-gray-600">' + escHtml(r.label || '—') + '</td>' +
          '<td class="py-2 px-3 text-gray-500">' + fmtDate(r.created_at) + '</td>' +
          '<td class="py-2 px-3 text-left">' +
            '<button onclick="deleteIp(' + r.id + ')" class="text-red-600 hover:text-red-800 text-xs font-bold">' +
              '<i class="fas fa-trash ml-1"></i>حذف' +
            '</button>' +
          '</td>' +
        '</tr>';
      }).join('');
    }

    async function loadIps() {
      showErr('');
      try {
        var res = await axios.get('/api/my-tenant/login-ips');
        if (!res.data || res.data.success !== true) {
          showErr((res.data && res.data.error) || 'تعذر تحميل البيانات');
          return;
        }
        currentIp = res.data.your_ip || '';
        var ipEl = document.getElementById('yourIp');
        if (ipEl) ipEl.textContent = currentIp || 'غير متاح';

        var banner = document.getElementById('statusBanner');
        if (banner) {
          if (res.data.restriction_enabled) {
            banner.className = 'rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium flex items-center gap-2 text-green-800';
            banner.innerHTML = '<i class="fas fa-check-circle text-green-600"></i> قيود تسجيل الدخول مفعّلة لهذه الشركة.';
          } else {
            banner.className = 'rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium flex items-center gap-2 text-gray-600';
            banner.innerHTML = '<i class="fas fa-info-circle text-gray-400"></i> قيود تسجيل الدخول غير مفعّلة حالياً.';
          }
          banner.classList.remove('hidden');
        }

        renderTable(res.data.ips || []);
      } catch (e) {
        showErr('تعذر تحميل البيانات');
      }
    }

    async function addIp(ipVal, labelVal) {
      setAddMsg('');
      if (!ipVal) { setAddMsg('أدخل عنوان IP أو نطاق CIDR', true); return; }
      try {
        var res = await axios.post('/api/my-tenant/login-ips', { ip: ipVal, label: labelVal || null });
        if (!res.data || !res.data.success) {
          setAddMsg((res.data && res.data.error) || 'فشل الحفظ', true);
          return;
        }
        setAddMsg('تم الحفظ بنجاح', false);
        document.getElementById('newIp').value = '';
        document.getElementById('newLabel').value = '';
        await loadIps();
      } catch (e) {
        var em = (e.response && e.response.data && e.response.data.error) ? e.response.data.error : 'فشل الحفظ';
        setAddMsg(em, true);
      }
    }

    async function deleteIp(id) {
      if (!confirm('هل تريد حذف هذا العنوان؟')) return;
      try {
        var res = await axios.delete('/api/my-tenant/login-ips/' + id);
        if (!res.data || !res.data.success) {
          alert((res.data && res.data.error) || 'فشل الحذف');
          return;
        }
        await loadIps();
      } catch (e) {
        alert((e.response && e.response.data && e.response.data.error) || 'فشل الحذف');
      }
    }

    document.getElementById('addCurrentIpBtn').addEventListener('click', function() {
      if (!currentIp) { setAddMsg('عنوان IP غير متاح', true); return; }
      document.getElementById('newIp').value = currentIp;
      document.getElementById('newIp').focus();
    });

    document.getElementById('addIpBtn').addEventListener('click', function() {
      var ip = document.getElementById('newIp').value.trim();
      var label = document.getElementById('newLabel').value.trim();
      addIp(ip, label);
    });

    document.getElementById('newIp').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var ip = this.value.trim();
        var label = document.getElementById('newLabel').value.trim();
        addIp(ip, label);
      }
    });

    loadIps();
  </script>
</body>
</html>
`
