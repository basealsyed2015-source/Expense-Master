import { buildSaudiCitySelectOptionsHtml } from './saudi-arabia-cities'

const cityOptionsHtml = buildSaudiCitySelectOptionsHtml()

function sharedTopBar() {
  return `<div class="border-b border-slate-200/90 bg-slate-50/90">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap gap-3 items-center justify-between">
      <a href="/admin/panel" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">← العودة للوحة الرئيسية</a>
      <a href="/admin/company-settings" class="text-sm font-medium text-teal-700 hover:text-teal-900 hover:underline">إعدادات الشركة العامة</a>
    </div>
  </div>`
}

/** List: table + link to add and per-row edit. */
export const companyLocationsListPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مواقع الشركة</title>
  <link rel="stylesheet" href="/tailwind.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50 min-h-screen">
  ${sharedTopBar()}

  <div class="bg-gradient-to-r from-teal-600 to-teal-800 text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div class="min-w-0 flex-1">
        <h1 class="text-2xl font-bold flex items-center" dir="rtl">
          <i class="fas fa-map-marker-alt ml-3 shrink-0"></i>
          مواقع الشركة (الفروع)
        </h1>
        <p class="text-teal-100 text-sm mt-2 opacity-95">كل شركة تبدأ بموقع رئيسي. أضف فروعاً وروابط تسويق لكل موقع.</p>
      </div>
      <a href="/admin/company-settings/locations/new"
        class="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-bold text-teal-800 shadow-md ring-1 ring-white/60 hover:bg-teal-50 active:scale-[0.98] transition-all"
        dir="rtl">
        <i class="fas fa-plus-circle text-teal-600"></i>
        <span>إضافة موقع</span>
      </a>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div id="loadError" class="hidden mb-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3"></div>

    <div class="bg-white rounded-xl shadow p-4">
      <h2 class="font-bold text-gray-800 mb-3"><i class="fas fa-list ml-2 text-teal-600"></i>المواقع النشطة</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b bg-gray-50 text-right">
              <th class="py-2 px-3">الاسم</th>
              <th class="py-2 px-3">Slug</th>
              <th class="py-2 px-3">المدينة</th>
              <th class="py-2 px-3">العنوان</th>
              <th class="py-2 px-3">هاتف / بريد</th>
              <th class="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody id="locTable"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    var tenantSlug = '';

    function showErr(msg) {
      var el = document.getElementById('loadError');
      if (!el) return;
      el.textContent = msg || '';
      el.classList.toggle('hidden', !msg);
    }

    function fmtPhone(p) { return p ? String(p) : '—'; }
    function fmtMail(e) { return e ? String(e) : '—'; }

    async function loadTenantSlug() {
      try {
        var res = await axios.get('/api/my-tenant');
        if (res.data && res.data.success && res.data.data) {
          tenantSlug = res.data.data.slug || '';
        }
      } catch (_) {}
    }

    function marketingUrl(slug) {
      if (!tenantSlug || !slug) return '—';
      var o = window.location.origin;
      return o + '/' + encodeURIComponent(tenantSlug) + '/' + encodeURIComponent(slug);
    }

    function escapeHtml(s) {
      return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function escapeHtmlAttr(s) {
      return String(s ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    }

    async function loadLocations() {
      showErr('');
      try {
        var res = await axios.get('/api/my-tenant/locations');
        if (!res.data || res.data.success !== true) {
          showErr((res.data && res.data.error) || 'تعذر تحميل المواقع');
          return;
        }
        var rows = res.data.data || [];
        var tb = document.getElementById('locTable');
        tb.innerHTML = rows.map(function (r) {
          var primary = Number(r.is_primary) === 1;
          var url = marketingUrl(r.slug);
          var editHref = '/admin/company-settings/locations/' + encodeURIComponent(String(r.id)) + '/edit';
          return '<tr class="border-b hover:bg-gray-50">' +
            '<td class="py-2 px-3">' + (primary ? '<span class="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded ml-1">رئيسي</span>' : '') +
            escapeHtml(r.name) + '</td>' +
            '<td class="py-2 px-3 font-mono text-xs" dir="ltr">' + escapeHtml(r.slug) +
            '<div class="text-[11px] text-gray-500 mt-1 break-all">' + escapeHtml(url) + '</div></td>' +
            '<td class="py-2 px-3">' + escapeHtml(r.city || '') + '</td>' +
            '<td class="py-2 px-3 max-w-xs truncate" title="' + escapeHtmlAttr(r.address) + '">' + escapeHtml(r.address || '') + '</td>' +
            '<td class="py-2 px-3 text-xs">' + escapeHtml(fmtPhone(r.contact_phone)) + '<br/>' + escapeHtml(fmtMail(r.contact_email)) + '</td>' +
            '<td class="py-2 px-3 whitespace-nowrap">' +
            '<a href="' + editHref + '" class="text-teal-700 font-medium hover:underline">تعديل</a>' +
            '</td></tr>';
        }).join('');
      } catch (e) {
        showErr('تعذر تحميل المواقع');
      }
    }

    loadTenantSlug().then(loadLocations);
  </script>
</body>
</html>
`

/** Add-only form. */
export const companyLocationNewPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إضافة موقع — مواقع الشركة</title>
  <link rel="stylesheet" href="/tailwind.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50 min-h-screen">
  ${sharedTopBar()}

  <div class="bg-gradient-to-r from-teal-600 to-teal-800 text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <a href="/admin/company-settings/locations" class="text-teal-100 text-sm hover:text-white mb-2 inline-block">← العودة لقائمة المواقع</a>
      <h1 class="text-2xl font-bold flex items-center" dir="rtl">
        <i class="fas fa-plus-circle ml-3"></i>
        إضافة موقع فرعي
      </h1>
      <p class="text-teal-100 text-sm mt-2 opacity-95">أدخل بيانات الفرع الجديد ورابط التسويق (slug).</p>
    </div>
  </div>

  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div id="loadError" class="hidden mb-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3"></div>

    <div class="bg-white rounded-xl shadow-lg p-6" dir="rtl">
      <form id="addForm" class="space-y-3" dir="rtl">
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 text-right">اسم الموقع *</label>
          <input type="text" id="add_name" required maxlength="200" class="w-full px-3 py-2 border rounded-lg text-right" dir="rtl" lang="ar" autocomplete="organization" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 text-right" dir="rtl">Slug (بالإنجليزية) *</label>
          <input type="text" id="add_slug" required pattern="[a-z0-9_-]+" class="w-full px-3 py-2 border rounded-lg text-left" dir="ltr" placeholder="jeddah-branch" lang="en" spellcheck="false" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 text-right">المدينة *</label>
          <select id="add_city" required class="w-full px-3 py-2 border rounded-lg bg-white text-right" dir="rtl">${cityOptionsHtml}</select>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 text-right">العنوان التفصيلي *</label>
          <textarea id="add_address" required maxlength="2000" rows="2" class="w-full px-3 py-2 border rounded-lg text-right" dir="rtl" lang="ar"></textarea>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 text-right" dir="rtl">جوال (اختياري — فارغ يستخدم للموقع الرئيسي)</label>
          <input type="tel" id="add_phone" maxlength="40" class="w-full px-3 py-2 border rounded-lg text-left" dir="ltr" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 text-right" dir="rtl">بريد (اختياري)</label>
          <input type="email" id="add_email" maxlength="200" class="w-full px-3 py-2 border rounded-lg text-left" dir="ltr" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">شعار (رفع — اختياري)</label>
          <input type="file" id="add_logo" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" class="w-full text-sm" />
        </div>
        <div class="flex flex-wrap gap-3 pt-2">
          <button type="submit" class="inline-flex flex-1 min-w-[10rem] justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg">حفظ الموقع</button>
          <a href="/admin/company-settings/locations" class="inline-flex flex-1 min-w-[10rem] justify-center items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-lg">إلغاء</a>
        </div>
      </form>
      <p id="addMsg" class="text-sm mt-2"></p>
    </div>
  </div>

  <script>
    document.getElementById('addForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = document.getElementById('addMsg');
      msg.textContent = '';
      var payload = {
        name: document.getElementById('add_name').value.trim(),
        slug: document.getElementById('add_slug').value.trim(),
        city: document.getElementById('add_city').value,
        address: document.getElementById('add_address').value.trim(),
        contact_phone: document.getElementById('add_phone').value.trim() || null,
        contact_email: document.getElementById('add_email').value.trim() || null
      };
      try {
        var res = await axios.post('/api/my-tenant/locations', payload);
        if (!res.data || !res.data.success) throw new Error((res.data && res.data.error) || 'فشل الحفظ');
        var newId = res.data.data && res.data.data.id;
        var file = document.getElementById('add_logo').files && document.getElementById('add_logo').files[0];
        if (file && newId) {
          var fd = new FormData();
          fd.append('file', file);
          await axios.post('/api/my-tenant/locations/' + newId + '/logo-upload', fd);
        }
        window.location.href = '/admin/company-settings/locations';
      } catch (err) {
        msg.textContent = (err.response && err.response.data && err.response.data.error) ? err.response.data.error : err.message;
        msg.className = 'text-sm text-red-600';
      }
    });
  </script>
</body>
</html>
`

/** Edit form for one location; \`locationId\` must be numeric digits only. */
export function buildCompanyLocationEditPage(locationId: string): string {
  const safeId = /^\d+$/.test(locationId) ? locationId : '0'
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تعديل موقع — مواقع الشركة</title>
  <link rel="stylesheet" href="/tailwind.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-50 min-h-screen">
  ${sharedTopBar()}

  <div class="bg-gradient-to-r from-teal-600 to-teal-800 text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <a href="/admin/company-settings/locations" class="text-teal-100 text-sm hover:text-white mb-2 inline-block">← العودة لقائمة المواقع</a>
      <h1 class="text-2xl font-bold flex items-center" dir="rtl">
        <i class="fas fa-edit ml-3"></i>
        تعديل موقع
        <span id="locTitleHint" class="text-lg font-semibold text-teal-100 mr-2 hidden"></span>
      </h1>
      <p class="text-teal-100 text-sm mt-2 opacity-95">الحقول الفارغة للهاتف أو البريد تعني الوراثة من الموقع الرئيسي عند العرض.</p>
    </div>
  </div>

  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div id="loadError" class="hidden mb-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3"></div>

    <div id="formWrap" class="hidden bg-white rounded-xl shadow-lg p-6" dir="rtl">
      <form id="editForm" class="space-y-3" dir="rtl">
        <input type="hidden" id="edit_id" value="${safeId}" />
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 text-right">اسم الموقع *</label>
          <input type="text" id="edit_name" required maxlength="200" class="w-full px-3 py-2 border rounded-lg text-right" dir="rtl" lang="ar" autocomplete="organization" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 text-right" dir="rtl">Slug *</label>
          <input type="text" id="edit_slug" required pattern="[a-z0-9_-]+" class="w-full px-3 py-2 border rounded-lg text-left" dir="ltr" lang="en" spellcheck="false" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 text-right">المدينة *</label>
          <select id="edit_city" required class="w-full px-3 py-2 border rounded-lg bg-white text-right" dir="rtl">${cityOptionsHtml}</select>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 text-right">العنوان *</label>
          <textarea id="edit_address" required maxlength="2000" rows="2" class="w-full px-3 py-2 border rounded-lg text-right" dir="rtl" lang="ar"></textarea>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 text-right" dir="rtl">جوال (فارغ = وراثة)</label>
          <input type="tel" id="edit_phone" maxlength="40" class="w-full px-3 py-2 border rounded-lg text-left" dir="ltr" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1 text-right" dir="rtl">بريد (فارغ = وراثة)</label>
          <input type="email" id="edit_email" maxlength="200" class="w-full px-3 py-2 border rounded-lg text-left" dir="ltr" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">شعار جديد (رفع)</label>
          <input type="file" id="edit_logo" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" class="w-full text-sm" />
        </div>
        <div class="flex flex-wrap gap-2 pt-2">
          <button type="submit" class="flex-1 min-w-[8rem] bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg">حفظ التعديلات</button>
          <button type="button" id="btnDeactivate" class="hidden flex-1 min-w-[8rem] bg-red-100 text-red-800 hover:bg-red-200 font-bold py-3 rounded-lg">إلغاء تفعيل</button>
          <a href="/admin/company-settings/locations" class="inline-flex flex-1 min-w-[8rem] justify-center items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-lg">إلغاء</a>
        </div>
      </form>
      <p id="editMsg" class="text-sm mt-2"></p>
    </div>
  </div>

  <script>
    var EDIT_LOCATION_ID = ${safeId};

    function showErr(msg) {
      var el = document.getElementById('loadError');
      if (!el) return;
      el.textContent = msg || '';
      el.classList.toggle('hidden', !msg);
    }

    function fillEdit(r) {
      document.getElementById('edit_id').value = r.id;
      document.getElementById('edit_name').value = r.name || '';
      document.getElementById('edit_slug').value = r.slug || '';
      document.getElementById('edit_city').value = r.city || '';
      document.getElementById('edit_address').value = r.address || '';
      document.getElementById('edit_phone').value = r.contact_phone || '';
      document.getElementById('edit_email').value = r.contact_email || '';
      var da = document.getElementById('btnDeactivate');
      da.classList.toggle('hidden', Number(r.is_primary) === 1);
      var hint = document.getElementById('locTitleHint');
      if (r.name) {
        hint.textContent = '— ' + String(r.name);
        hint.classList.remove('hidden');
      }
      document.getElementById('formWrap').classList.remove('hidden');
    }

    async function loadOne() {
      showErr('');
      if (!EDIT_LOCATION_ID || EDIT_LOCATION_ID <= 0) {
        showErr('معرّف الموقع غير صالح.');
        return;
      }
      try {
        var res = await axios.get('/api/my-tenant/locations/' + EDIT_LOCATION_ID);
        if (!res.data || res.data.success !== true || !res.data.data) {
          showErr((res.data && res.data.error) || 'تعذر تحميل الموقع');
          return;
        }
        fillEdit(res.data.data);
      } catch (e) {
        var msg = (e.response && e.response.data && e.response.data.error) ? e.response.data.error : 'تعذر تحميل الموقع';
        showErr(msg);
      }
    }

    document.getElementById('editForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = document.getElementById('editMsg');
      msg.textContent = '';
      var id = document.getElementById('edit_id').value;
      var payload = {
        name: document.getElementById('edit_name').value.trim(),
        slug: document.getElementById('edit_slug').value.trim(),
        city: document.getElementById('edit_city').value,
        address: document.getElementById('edit_address').value.trim(),
        contact_phone: document.getElementById('edit_phone').value.trim() === '' ? null : document.getElementById('edit_phone').value.trim(),
        contact_email: document.getElementById('edit_email').value.trim() === '' ? null : document.getElementById('edit_email').value.trim()
      };
      try {
        var res = await axios.patch('/api/my-tenant/locations/' + id, payload);
        if (!res.data || !res.data.success) throw new Error((res.data && res.data.error) || 'فشل الحفظ');
        var file = document.getElementById('edit_logo').files && document.getElementById('edit_logo').files[0];
        if (file) {
          var fd = new FormData();
          fd.append('file', file);
          await axios.post('/api/my-tenant/locations/' + id + '/logo-upload', fd);
        }
        window.location.href = '/admin/company-settings/locations';
      } catch (err) {
        msg.textContent = (err.response && err.response.data && err.response.data.error) ? err.response.data.error : err.message;
        msg.className = 'text-sm text-red-600';
      }
    });

    document.getElementById('btnDeactivate').addEventListener('click', async function () {
      var id = document.getElementById('edit_id').value;
      if (!id) return;
      if (!confirm('إلغاء تفعيل هذا الموقع؟')) return;
      try {
        await axios.delete('/api/my-tenant/locations/' + id);
        window.location.href = '/admin/company-settings/locations';
      } catch (err) {
        alert((err.response && err.response.data && err.response.data.error) || err.message);
      }
    });

    loadOne();
  </script>
</body>
</html>
`
}
