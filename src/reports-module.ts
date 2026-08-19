// ==========================================
// Extended Reports Module — HR, Contracts, Tenants/SaaS
// ==========================================

const FLATPICKR_CSS = `https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css`
const FLATPICKR_JS  = `https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js`
const FLATPICKR_AR  = `https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/l10n/ar.js`

const COLOR_HEX: Record<string, string> = {
  green:  '#16A34A',
  blue:   '#2563EB',
  purple: '#7C3AED',
}

/** Shared print/PDF styles — same pattern as banks & performance reports */
export const REPORT_PRINT_CSS = `
  @media print {
    .no-print { display: none !important; }
    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .max-w-7xl { max-width: 100% !important; padding: 0 !important; }
    canvas { max-width: 100% !important; height: auto !important; }
  }
`

export function reportPdfButtonHtml(btnClass = 'bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold transition-all text-sm flex items-center gap-2'): string {
  return `<button type="button" onclick="window.print()" class="${btnClass} no-print">
    <i class="fas fa-file-pdf"></i>تصدير PDF
  </button>`
}

function buildFilterBar(hex: string, year: number, selectedPeriod: string = 'year'): string {
  const sel = (value: string) => (selectedPeriod === value ? ' selected' : '')
  return `
  <!-- RTL + flatpickr overrides -->
  <style>
    .flatpickr-calendar { direction: rtl !important; font-family: inherit; }
    .flatpickr-months { direction: rtl; }
    .flatpickr-current-month { direction: rtl; display: flex; align-items: center; justify-content: center; gap: 4px; }
    .flatpickr-current-month .flatpickr-monthDropdown-months { direction: rtl; }
    #reportFilterCard { transition: box-shadow .15s; }
    #periodSelect { direction: rtl; }
    .fp-range-pill { background: ${hex}18; border: 1.5px solid ${hex}55; color: #1e293b; }
    ${REPORT_PRINT_CSS}
  </style>

  <div class="flex items-center justify-end mb-3 no-print">
    ${reportPdfButtonHtml()}
  </div>

  <div id="reportFilterCard" class="bg-white rounded-xl shadow-md mb-6 overflow-hidden no-print">
    <!-- Accent strip -->
    <div style="height:3px;background:linear-gradient(to left,${hex}99,${hex})"></div>

    <div class="px-6 pt-5 pb-5">
      <!-- Title row -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg" style="background:${hex}18">
            <i class="fas fa-calendar-alt text-sm" style="color:${hex}"></i>
          </span>
          <span class="text-sm font-bold text-gray-700">الفترة الزمنية</span>
        </div>
        <span id="periodBadge"
          class="text-xs font-semibold px-3 py-1 rounded-full text-white"
          style="background:${hex};display:none"></span>
      </div>

      <!-- Controls row -->
      <div class="flex flex-wrap items-center gap-3">

        <!-- Styled dropdown wrapper -->
        <div class="relative">
          <span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color:${hex}">
            <i class="fas fa-chevron-down text-xs"></i>
          </span>
          <select id="periodSelect" onchange="onPeriodChange()"
            style="padding-right:2rem;border-color:#e2e8f0;min-width:210px;appearance:none;-webkit-appearance:none"
            class="pl-4 py-2.5 border-2 rounded-lg text-gray-800 font-semibold bg-white cursor-pointer
                   focus:outline-none transition-colors hover:border-gray-400 text-sm">
            <option value="today"${sel('today')}>اليوم</option>
            <option value="week"${sel('week')}>الأسبوع الحالي</option>
            <option value="month"${sel('month')}>الشهر الحالي</option>
            <option value="year"${sel('year')}>السنة الحالية ${year}</option>
            <option value="q1"${sel('q1')}>الربع الأول ${year} · يناير – مارس</option>
            <option value="q2"${sel('q2')}>الربع الثاني ${year} · أبريل – يونيو</option>
            <option value="q3"${sel('q3')}>الربع الثالث ${year} · يوليو – سبتمبر</option>
            <option value="q4"${sel('q4')}>الربع الرابع ${year} · أكتوبر – ديسمبر</option>
            <option value="custom"${sel('custom')}>تاريخ مخصص…</option>
          </select>
        </div>

        <!-- Active date range display -->
        <div id="dateDisplay"
          class="fp-range-pill flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium">
          <i class="fas fa-calendar-week text-xs opacity-60"></i>
          <span id="dateRangeLabel" class="text-gray-700">—</span>
        </div>

        <!-- Custom flatpickr input (hidden by default) -->
        <div id="customWrap" style="display:none">
          <input id="dateRangePicker" type="text" readonly placeholder="انقر لاختيار فترة مخصصة"
            class="px-4 py-2.5 rounded-lg text-sm text-gray-700 cursor-pointer transition-colors w-72"
            style="border:2px dashed #cbd5e1" onfocus="this.style.borderColor='${hex}'" onblur="this.style.borderColor='#cbd5e1'">
        </div>

        <!-- Apply button (custom range only) -->
        <div id="applyWrap" style="display:none">
          <button onclick="loadReport()"
            class="px-5 py-2.5 text-white text-sm font-bold rounded-lg transition-opacity hover:opacity-90 flex items-center gap-2"
            style="background:${hex}">
            <i class="fas fa-check text-xs"></i>تطبيق
          </button>
        </div>
      </div>
    </div>
  </div>`
}

const DATE_FILTER_SCRIPT = `
  const authToken = localStorage.getItem('authToken');
  const charts = {};
  let _startDate = '', _endDate = '', _fp = null, lastData = null;

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmt(d) { return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }

  function getPeriodDates(period) {
    const now = new Date();
    const y   = now.getFullYear();
    const m   = now.getMonth();
    const lastDay = (yr, mo) => new Date(yr, mo + 1, 0).getDate();
    switch (period) {
      case 'today':
        return { s: fmt(now), e: fmt(now),
                 label: 'اليوم',
                 range: fmt(now) };
      case 'year':
        return { s: y+'-01-01', e: y+'-12-31',
                 label: 'السنة الحالية '+y,
                 range: '1 يناير '+y+' – 31 ديسمبر '+y };
      case 'month': {
        const ld = lastDay(y, m);
        const mn = now.toLocaleString('ar-SA', { month: 'long' });
        return { s: y+'-'+pad(m+1)+'-01', e: y+'-'+pad(m+1)+'-'+pad(ld),
                 label: mn+' '+y,
                 range: '1 '+mn+' – '+ld+' '+mn+' '+y };
      }
      case 'week': {
        const day = now.getDay();
        const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        return { s: fmt(mon), e: fmt(sun),
                 label: 'الأسبوع الحالي',
                 range: fmt(mon)+' – '+fmt(sun) };
      }
      case 'q1': return { s: y+'-01-01', e: y+'-03-31', label: 'الربع الأول '+y, range: 'يناير – مارس '+y };
      case 'q2': return { s: y+'-04-01', e: y+'-06-30', label: 'الربع الثاني '+y, range: 'أبريل – يونيو '+y };
      case 'q3': return { s: y+'-07-01', e: y+'-09-30', label: 'الربع الثالث '+y, range: 'يوليو – سبتمبر '+y };
      case 'q4': return { s: y+'-10-01', e: y+'-12-31', label: 'الربع الرابع '+y, range: 'أكتوبر – ديسمبر '+y };
      default: return null;
    }
  }

  function setBadge(label, range) {
    const badge = document.getElementById('periodBadge');
    const rangeEl = document.getElementById('dateRangeLabel');
    if (badge) {
      if (label) { badge.textContent = label; badge.style.display = ''; }
      else { badge.style.display = 'none'; }
    }
    if (rangeEl) rangeEl.textContent = range || '—';
  }

  function onPeriodChange() {
    const period = document.getElementById('periodSelect').value;
    const customWrap = document.getElementById('customWrap');
    const applyWrap  = document.getElementById('applyWrap');
    const dateDisplay = document.getElementById('dateDisplay');

    if (period === 'custom') {
      customWrap.style.display  = '';
      applyWrap.style.display   = '';
      dateDisplay.style.display = 'none';
      setBadge('', '');
      if (_fp) _fp.clear();
      _startDate = ''; _endDate = '';
    } else {
      customWrap.style.display  = 'none';
      applyWrap.style.display   = 'none';
      dateDisplay.style.display = '';
      const d = getPeriodDates(period);
      _startDate = d.s; _endDate = d.e;
      setBadge(d.label, d.range);
      loadReport();
    }
  }

  function initDatePicker() {
    if (typeof flatpickr === 'undefined') return;
    _fp = flatpickr('#dateRangePicker', {
      mode: 'range',
      dateFormat: 'Y-m-d',
      locale: 'ar',
      allowInput: false,
      onReady(_, __, fp) {
        fp.calendarContainer.setAttribute('dir', 'rtl');
      },
      onClose(dates) {
        if (dates.length === 2) {
          _startDate = fmt(dates[0]);
          _endDate   = fmt(dates[1]);
          const r    = _startDate + ' – ' + _endDate;
          document.getElementById('dateRangePicker').value = r;
          setBadge('مخصص', r);
        }
      }
    });
  }

  async function loadReport() {
    const params = new URLSearchParams();
    if (_startDate) params.append('start_date', _startDate);
    if (_endDate)   params.append('end_date',   _endDate);
    const extra = (typeof collectFilters === 'function') ? collectFilters() : {};
    Object.keys(extra).forEach(k => { if (extra[k]) params.append(k, extra[k]); });

    const card = document.getElementById('reportFilterCard');
    if (card) card.style.boxShadow = '0 0 0 2px ACCENT_HEX';

    try {
      const res = await fetch(API_PATH + '?' + params.toString(), {
        headers: authToken ? { 'Authorization': 'Bearer ' + authToken } : {}
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'فشل تحميل البيانات');
      lastData = result.data;
      render(result.data);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ في تحميل التقرير: ' + err.message);
    } finally {
      if (card) card.style.boxShadow = '';
    }
  }

  function n(v) { return (v == null ? 0 : Number(v)).toLocaleString('ar-SA'); }
  function money(v) { return n(v) + ' ريال'; }

  function drawDoughnut(id, labels, data, colors) {
    const ctx = document.getElementById(id); if (!ctx) return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors }] },
      options: { responsive: true, maintainAspectRatio: true }
    });
  }
  function drawBar(id, labels, data, color, label) {
    const ctx = document.getElementById(id); if (!ctx) return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: label||'', data, backgroundColor: color }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: !!label } } }
    });
  }
  function drawLine(id, labels, data, color, label) {
    const ctx = document.getElementById(id); if (!ctx) return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: label||'', data, borderColor: color,
              backgroundColor: color+'33', tension: 0.4, fill: true }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: !!label } } }
    });
  }

  function csvDownload(rows, filename) {
    const BOM = '\\uFEFF';
    const csv = BOM + rows.map(r => r.map(c => '"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename; a.click();
  }

  function refreshReportFilterYearLabels() {
    var y = new Date().getFullYear();
    if (!Number.isFinite(y) || y < 2000) return;
    var sel = document.getElementById('periodSelect');
    if (!sel) return;
    var labels = {
      year: 'السنة الحالية ' + y,
      q1: 'الربع الأول ' + y + ' · يناير – مارس',
      q2: 'الربع الثاني ' + y + ' · أبريل – يونيو',
      q3: 'الربع الثالث ' + y + ' · يوليو – سبتمبر',
      q4: 'الربع الرابع ' + y + ' · أكتوبر – ديسمبر'
    };
    for (var i = 0; i < sel.options.length; i++) {
      var opt = sel.options[i];
      if (labels[opt.value]) opt.textContent = labels[opt.value];
    }
  }

  window.addEventListener('load', () => {
    refreshReportFilterYearLabels();
    const y = new Date().getFullYear();
    const d = getPeriodDates('year');
    _startDate = d.s; _endDate = d.e;
    setBadge(d.label, d.range);
    initDatePicker();
    loadReport();
  });
`

function buildReportShell(opts: {
  title: string;
  headerIcon: string;
  headerSubtitle: string;
  headerColor: string;
  bodyId: string;
  apiPath: string;
  cardsHtml: string;
  chartsHtml: string;
  tablesHtml: string;
  renderScript: string;
}): string {
  const hex  = COLOR_HEX[opts.headerColor] ?? '#2563EB'
  const year = new Date().getFullYear()
  const script = DATE_FILTER_SCRIPT
    .replace(/ACCENT_HEX/g, hex)

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
  <link rel="stylesheet" href="/tailwind.css">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link rel="stylesheet" href="${FLATPICKR_CSS}">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="${FLATPICKR_JS}"></script>
  <script src="${FLATPICKR_AR}"></script>
</head>
<body class="bg-gray-50">
  <div class="border-b border-gray-200 bg-white no-print">
    <div class="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
      <a href="/admin/reports" class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">← منظومة التقارير</a>
      <a href="/admin/panel" class="text-sm font-medium text-gray-500 hover:text-gray-800">لوحة التحكم</a>
    </div>
  </div>

  <div style="background:${hex}" class="text-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <h1 class="text-3xl font-bold flex items-center">
        <i class="${opts.headerIcon} ml-3"></i>${opts.title}
      </h1>
      <p class="mt-1 text-sm opacity-80">${opts.headerSubtitle}</p>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 py-6" id="${opts.bodyId}">
    ${buildFilterBar(hex, year)}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">${opts.cardsHtml}</div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">${opts.chartsHtml}</div>
    ${opts.tablesHtml}
  </div>

  <script>
    const API_PATH = '${opts.apiPath}';
    ${script}
    ${opts.renderScript}
  </script>
</body>
</html>`
}

// ─────────────────────────────────────────
// 1) HR Report
// ─────────────────────────────────────────
export const hrReportPage = buildReportShell({
  title: 'تقرير الموارد البشرية',
  headerIcon: 'fas fa-user-tie',
  headerSubtitle: 'الموظفون، الإجازات، الرواتب، وحركة القوى العاملة',
  headerColor: 'green',
  bodyId: 'hrReport',
  apiPath: '/api/reports/hr',
  cardsHtml: `
    <div class="bg-green-600 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-green-100 text-sm font-medium mb-1">الموظفون النشطون</p><p class="text-3xl font-bold" id="cTotalEmployees">-</p></div>
        <i class="fas fa-users text-4xl text-green-200"></i>
      </div>
    </div>
    <div class="bg-yellow-500 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-yellow-100 text-sm font-medium mb-1">إجازات قيد المراجعة</p><p class="text-3xl font-bold" id="cPendingLeaves">-</p></div>
        <i class="fas fa-calendar-alt text-4xl text-yellow-200"></i>
      </div>
    </div>
    <div class="bg-emerald-600 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-emerald-100 text-sm font-medium mb-1">أيام إجازة معتمدة</p><p class="text-3xl font-bold" id="cApprovedLeaveDays">-</p></div>
        <i class="fas fa-umbrella-beach text-4xl text-emerald-200"></i>
      </div>
    </div>
    <div class="bg-teal-600 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-teal-100 text-sm font-medium mb-1">متوسط اعتماد الإجازة (ساعة)</p><p class="text-3xl font-bold" id="cAvgApproval">-</p></div>
        <i class="fas fa-clock text-4xl text-teal-200"></i>
      </div>
    </div>
    <div class="bg-blue-600 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-blue-100 text-sm font-medium mb-1">صافي الرواتب (الفترة)</p><p class="text-3xl font-bold" id="cPayrollNet">-</p></div>
        <i class="fas fa-money-bill-wave text-4xl text-blue-200"></i>
      </div>
    </div>
    <div class="bg-indigo-600 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-indigo-100 text-sm font-medium mb-1">رواتب مدفوعة</p><p class="text-3xl font-bold" id="cPayrollPaid">-</p></div>
        <i class="fas fa-check-circle text-4xl text-indigo-200"></i>
      </div>
    </div>
    <div class="bg-cyan-600 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-cyan-100 text-sm font-medium mb-1">تعيينات جديدة</p><p class="text-3xl font-bold" id="cHires">-</p></div>
        <i class="fas fa-user-plus text-4xl text-cyan-200"></i>
      </div>
    </div>
    <div class="bg-rose-500 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-rose-100 text-sm font-medium mb-1">إنهاء خدمة</p><p class="text-3xl font-bold" id="cTerminations">-</p></div>
        <i class="fas fa-user-minus text-4xl text-rose-200"></i>
      </div>
    </div>`,
  chartsHtml: `
    <div class="md:col-span-2 text-sm font-bold text-gray-500 tracking-wide">الإجازات</div>
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-chart-bar ml-2 text-emerald-600"></i>الإجازات حسب النوع</h3>
      <div style="height:280px;position:relative;"><canvas id="leaveTypeChart"></canvas></div>
    </div>
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-chart-pie ml-2 text-yellow-500"></i>الإجازات حسب الحالة</h3>
      <div style="height:280px;position:relative;"><canvas id="leaveStatusChart"></canvas></div>
    </div>
    <div class="md:col-span-2 text-sm font-bold text-gray-500 tracking-wide mt-2">الرواتب وحركة القوى العاملة</div>
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-chart-line ml-2 text-blue-600"></i>اتجاه الرواتب الشهرية</h3>
      <div style="height:280px;position:relative;"><canvas id="payrollTrendChart"></canvas></div>
    </div>
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-chart-pie ml-2 text-cyan-600"></i>نوع التوظيف</h3>
      <div style="height:280px;position:relative;"><canvas id="empTypeChart"></canvas></div>
    </div>
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-chart-pie ml-2 text-green-600"></i>الموظفون حسب القسم</h3>
      <div style="height:280px;position:relative;"><canvas id="deptChart"></canvas></div>
    </div>
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-hourglass-half ml-2 text-indigo-600"></i>توزيع سنوات الخدمة</h3>
      <div style="height:280px;position:relative;"><canvas id="tenureChart"></canvas></div>
    </div>`,
  tablesHtml: `
    <div class="bg-white rounded-xl shadow-md p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-gray-800">استهلاك الإجازات مقابل السياسة</h3>
        <button onclick="exportLeaveUtilCsv()" class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-bold flex items-center gap-1">
          <i class="fas fa-file-excel"></i>تصدير
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100"><tr>
            <th class="px-4 py-3 text-right font-bold text-gray-700">نوع الإجازة</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">المخصص / موظف</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">السعة الكلية</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">المستخدم</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">المتبقي</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">نسبة الاستهلاك</th>
          </tr></thead>
          <tbody id="leaveUtilTable"></tbody>
        </table>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white rounded-xl shadow-md p-6">
        <h3 class="font-bold text-gray-800 mb-4">الإجازات حسب القسم</h3>
        <table class="w-full text-sm">
          <thead class="bg-gray-100"><tr>
            <th class="px-4 py-3 text-right font-bold text-gray-700">القسم</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">الطلبات</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">الأيام</th>
          </tr></thead>
          <tbody id="leaveDeptTable"></tbody>
        </table>
      </div>
      <div class="bg-white rounded-xl shadow-md p-6">
        <h3 class="font-bold text-gray-800 mb-4">الرواتب حسب حالة الدفع</h3>
        <table class="w-full text-sm">
          <thead class="bg-gray-100"><tr>
            <th class="px-4 py-3 text-right font-bold text-gray-700">الحالة</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">العدد</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">الإجمالي</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">الصافي</th>
          </tr></thead>
          <tbody id="payrollStatusTable"></tbody>
        </table>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow-md p-6 mb-6">
      <h3 class="font-bold text-gray-800 mb-4">الأقسام</h3>
      <table class="w-full text-sm">
        <thead class="bg-gray-100"><tr>
          <th class="px-4 py-3 text-right font-bold text-gray-700">القسم</th>
          <th class="px-4 py-3 text-right font-bold text-gray-700">الموظفون</th>
          <th class="px-4 py-3 text-right font-bold text-gray-700">إجمالي الرواتب الأساسية</th>
          <th class="px-4 py-3 text-right font-bold text-gray-700">متوسط الراتب</th>
        </tr></thead>
        <tbody id="deptTable"></tbody>
      </table>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-800">التعيينات في الفترة</h3>
          <button onclick="exportHiresCsv()" class="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded-lg font-bold flex items-center gap-1">
            <i class="fas fa-file-excel"></i>تصدير
          </button>
        </div>
        <div class="overflow-x-auto max-h-80 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100 sticky top-0"><tr>
              <th class="px-3 py-2 text-right font-bold text-gray-700">الاسم</th>
              <th class="px-3 py-2 text-right font-bold text-gray-700">القسم</th>
              <th class="px-3 py-2 text-right font-bold text-gray-700">التاريخ</th>
            </tr></thead>
            <tbody id="hiresTable"></tbody>
          </table>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-800">إنهاء الخدمة في الفترة</h3>
          <button onclick="exportTermsCsv()" class="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs rounded-lg font-bold flex items-center gap-1">
            <i class="fas fa-file-excel"></i>تصدير
          </button>
        </div>
        <div class="overflow-x-auto max-h-80 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100 sticky top-0"><tr>
              <th class="px-3 py-2 text-right font-bold text-gray-700">الاسم</th>
              <th class="px-3 py-2 text-right font-bold text-gray-700">القسم</th>
              <th class="px-3 py-2 text-right font-bold text-gray-700">التاريخ</th>
            </tr></thead>
            <tbody id="termsTable"></tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-bold text-gray-800 mb-4">آخر التذاكر</h3>
      <table class="w-full text-sm">
        <thead class="bg-gray-100"><tr>
          <th class="px-4 py-3 text-right font-bold text-gray-700">الموضوع</th>
          <th class="px-4 py-3 text-right font-bold text-gray-700">النوع</th>
          <th class="px-4 py-3 text-right font-bold text-gray-700">الأولوية</th>
          <th class="px-4 py-3 text-right font-bold text-gray-700">الحالة</th>
          <th class="px-4 py-3 text-right font-bold text-gray-700">التاريخ</th>
        </tr></thead>
        <tbody id="ticketsTable"></tbody>
      </table>
    </div>`,
  renderScript: `
    function render(d) {
      const s = d.summary || {};
      document.getElementById('cTotalEmployees').textContent = n(s.total_employees);
      document.getElementById('cPendingLeaves').textContent  = n(s.pending_leaves);
      document.getElementById('cApprovedLeaveDays').textContent = n(s.approved_leave_days);
      document.getElementById('cAvgApproval').textContent =
        s.avg_approval_hours != null ? Number(s.avg_approval_hours).toFixed(1) : '—';
      document.getElementById('cPayrollNet').textContent  = money(s.payroll_net);
      document.getElementById('cPayrollPaid').textContent = money(s.payroll_paid);
      document.getElementById('cHires').textContent = n(s.hires_in_range);
      document.getElementById('cTerminations').textContent = n(s.terminations_in_range);

      const leaveTypes = d.leaves_by_type || [];
      drawBar('leaveTypeChart',
        leaveTypes.map(x => x.leave_name_ar || x.leave_type),
        leaveTypes.map(x => x.count), '#059669', 'طلبات');

      const leaveStatuses = d.leaves_by_status || [];
      drawDoughnut('leaveStatusChart',
        leaveStatuses.map(x => x.status || '—'),
        leaveStatuses.map(x => x.count),
        ['#EAB308','#16A34A','#EF4444','#64748B','#8B5CF6']);

      const months = d.payroll_monthly || [];
      drawLine('payrollTrendChart',
        months.map(x => x.month),
        months.map(x => Number(x.net || 0)), '#2563EB', 'صافي الرواتب');

      const empTypes = d.employment_types || [];
      drawDoughnut('empTypeChart',
        empTypes.map(x => x.employment_type),
        empTypes.map(x => x.count),
        ['#0891B2','#3B82F6','#8B5CF6','#F97316','#84CC16']);

      const depts = d.departments || [];
      drawDoughnut('deptChart',
        depts.map(x => x.department || '—'),
        depts.map(x => x.employee_count),
        ['#16A34A','#3B82F6','#EAB308','#EF4444','#8B5CF6','#06B6D4','#F97316','#84CC16']);

      const tenure = d.tenure_buckets || [];
      drawBar('tenureChart',
        tenure.map(x => x.bucket),
        tenure.map(x => x.count), '#4F46E5');

      document.getElementById('leaveUtilTable').innerHTML = (d.leave_utilization || []).map(x => \`
        <tr class="border-b hover:bg-gray-50">
          <td class="px-4 py-3">\${x.leave_name_ar || x.leave_type}</td>
          <td class="px-4 py-3">\${n(x.allocated_days)}</td>
          <td class="px-4 py-3">\${n(x.capacity_days)}</td>
          <td class="px-4 py-3 font-bold">\${n(x.used_days)}</td>
          <td class="px-4 py-3 text-gray-600">\${n(x.remaining_days)}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded text-xs \${x.utilization_pct>=80?'bg-red-100 text-red-800':x.utilization_pct>=50?'bg-yellow-100 text-yellow-800':'bg-green-100 text-green-800'}">
              \${x.utilization_pct}%
            </span>
          </td>
        </tr>\`).join('') || '<tr><td colspan="6" class="text-center py-8 text-gray-400">لا توجد سياسة إجازات محفوظة — اضبطها من إدارة الإجازات ← سياسة الإجازات</td></tr>';

      document.getElementById('leaveDeptTable').innerHTML = (d.leaves_by_dept || []).map(x => \`
        <tr class="border-b hover:bg-gray-50">
          <td class="px-4 py-3">\${x.department}</td>
          <td class="px-4 py-3 font-bold">\${n(x.count)}</td>
          <td class="px-4 py-3">\${n(x.total_days)}</td>
        </tr>\`).join('') || '<tr><td colspan="3" class="text-center py-8 text-gray-400">لا توجد إجازات</td></tr>';

      document.getElementById('payrollStatusTable').innerHTML = (d.payroll_by_status || []).map(x => \`
        <tr class="border-b hover:bg-gray-50">
          <td class="px-4 py-3">\${x.payment_status || ''}</td>
          <td class="px-4 py-3 font-bold">\${n(x.count)}</td>
          <td class="px-4 py-3">\${money(x.gross)}</td>
          <td class="px-4 py-3">\${money(x.net)}</td>
        </tr>\`).join('') || '<tr><td colspan="4" class="text-center py-8 text-gray-400">لا توجد مسيرات رواتب</td></tr>';

      document.getElementById('deptTable').innerHTML = depts.map(x => \`
        <tr class="border-b hover:bg-gray-50">
          <td class="px-4 py-3">\${x.department || ''}</td>
          <td class="px-4 py-3 font-bold">\${n(x.employee_count)}</td>
          <td class="px-4 py-3">\${money(x.total_salary)}</td>
          <td class="px-4 py-3 text-gray-600">\${money(x.avg_salary)}</td>
        </tr>\`).join('') || '<tr><td colspan="4" class="text-center py-8 text-gray-400">لا توجد بيانات</td></tr>';

      document.getElementById('hiresTable').innerHTML = (d.recent_hires || []).map(x => \`
        <tr class="border-b hover:bg-gray-50">
          <td class="px-3 py-2">\${x.full_name || ''}</td>
          <td class="px-3 py-2 text-gray-600">\${x.department || ''}</td>
          <td class="px-3 py-2 text-gray-500">\${(x.hire_date||'').substring(0,10)}</td>
        </tr>\`).join('') || '<tr><td colspan="3" class="text-center py-8 text-gray-400">لا توجد تعيينات</td></tr>';

      document.getElementById('termsTable').innerHTML = (d.recent_terminations || []).map(x => \`
        <tr class="border-b hover:bg-gray-50">
          <td class="px-3 py-2">\${x.full_name || ''}</td>
          <td class="px-3 py-2 text-gray-600">\${x.department || ''}</td>
          <td class="px-3 py-2 text-gray-500">\${(x.termination_date||'').substring(0,10)}</td>
        </tr>\`).join('') || '<tr><td colspan="3" class="text-center py-8 text-gray-400">لا توجد إنهاءات</td></tr>';

      document.getElementById('ticketsTable').innerHTML = (d.recent_tickets || []).map(t => \`
        <tr class="border-b hover:bg-gray-50">
          <td class="px-4 py-3">\${t.subject || ''}</td>
          <td class="px-4 py-3 text-gray-600">\${t.ticket_type || ''}</td>
          <td class="px-2 py-3"><span class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">\${t.priority || ''}</span></td>
          <td class="px-2 py-3">
            <span class="px-2 py-0.5 rounded text-xs \${t.status==='open'?'bg-yellow-100 text-yellow-800':t.status==='resolved'?'bg-green-100 text-green-800':'bg-gray-100 text-gray-700'}">
              \${t.status || ''}
            </span>
          </td>
          <td class="px-4 py-3 text-gray-500">\${(t.created_at||'').substring(0,10)}</td>
        </tr>\`).join('') || '<tr><td colspan="5" class="text-center py-8 text-gray-400">لا توجد تذاكر</td></tr>';
    }

    function exportLeaveUtilCsv() {
      if (!lastData || !(lastData.leave_utilization||[]).length) { alert('لا توجد بيانات للتصدير'); return; }
      const headers = ['نوع الإجازة','المخصص','السعة','المستخدم','المتبقي','نسبة الاستهلاك'];
      const rows = lastData.leave_utilization.map(x => [
        x.leave_name_ar || x.leave_type, x.allocated_days, x.capacity_days, x.used_days, x.remaining_days, x.utilization_pct+'%'
      ]);
      csvDownload([headers, ...rows], 'hr-leave-utilization.csv');
    }
    function exportHiresCsv() {
      if (!lastData || !(lastData.recent_hires||[]).length) { alert('لا توجد بيانات للتصدير'); return; }
      const headers = ['الاسم','القسم','المسمى','نوع التوظيف','تاريخ التعيين'];
      const rows = lastData.recent_hires.map(x => [
        x.full_name||'', x.department||'', x.job_title||'', x.employment_type||'', (x.hire_date||'').substring(0,10)
      ]);
      csvDownload([headers, ...rows], 'hr-hires.csv');
    }
    function exportTermsCsv() {
      if (!lastData || !(lastData.recent_terminations||[]).length) { alert('لا توجد بيانات للتصدير'); return; }
      const headers = ['الاسم','القسم','المسمى','تاريخ الإنهاء','السبب'];
      const rows = lastData.recent_terminations.map(x => [
        x.full_name||'', x.department||'', x.job_title||'', (x.termination_date||'').substring(0,10), x.termination_reason||''
      ]);
      csvDownload([headers, ...rows], 'hr-terminations.csv');
    }`
})

// ─────────────────────────────────────────
// 2) Contracts Report
// ─────────────────────────────────────────
export const contractsReportPage = buildReportShell({
  title: 'تقرير العقود',
  headerIcon: 'fas fa-file-signature',
  headerSubtitle: 'العقود، السندات لأمر، والقيم المالية',
  headerColor: 'blue',
  bodyId: 'contractsReport',
  apiPath: '/api/reports/contracts',
  cardsHtml: `
    <div class="bg-blue-600 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-blue-100 text-sm font-medium mb-1">إجمالي العقود</p><p class="text-3xl font-bold" id="cTotalContracts">-</p></div>
        <i class="fas fa-file-contract text-4xl text-blue-200"></i>
      </div>
    </div>
    <div class="bg-green-600 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-green-100 text-sm font-medium mb-1">قيمة التمويل الإجمالية</p><p class="text-3xl font-bold" id="cTotalFinance">-</p></div>
        <i class="fas fa-coins text-4xl text-green-200"></i>
      </div>
    </div>
    <div class="bg-yellow-500 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-yellow-100 text-sm font-medium mb-1">إجمالي العمولات</p><p class="text-3xl font-bold" id="cTotalCommission">-</p></div>
        <i class="fas fa-percentage text-4xl text-yellow-200"></i>
      </div>
    </div>
    <div class="bg-purple-600 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-purple-100 text-sm font-medium mb-1">سندات لأمر مستحقة</p><p class="text-3xl font-bold" id="cDueNotes">-</p></div>
        <i class="fas fa-file-invoice-dollar text-4xl text-purple-200"></i>
      </div>
    </div>`,
  chartsHtml: `
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-chart-pie ml-2 text-blue-600"></i>حالات العقود</h3>
      <div style="height:280px;position:relative;"><canvas id="statusChart"></canvas></div>
    </div>
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-chart-bar ml-2 text-blue-600"></i>العقود حسب البنك</h3>
      <div style="height:280px;position:relative;"><canvas id="bankChart"></canvas></div>
    </div>`,
  tablesHtml: `
    <div class="bg-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-gray-800">أحدث العقود</h3>
        <button onclick="exportContractsCsv()"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-bold transition-colors flex items-center gap-2">
          <i class="fas fa-file-excel"></i>تصدير Excel
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100"><tr>
            <th class="px-4 py-3 text-right font-bold text-gray-700">رقم العقد</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">الطرف الثاني</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">نوع التمويل</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">قيمة التمويل</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">العمولة</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">الحالة</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">التاريخ</th>
          </tr></thead>
          <tbody id="contractsTable"></tbody>
        </table>
      </div>
    </div>`,
  renderScript: `
    function render(d) {
      document.getElementById('cTotalContracts').textContent  = n(d.summary.total_contracts);
      document.getElementById('cTotalFinance').textContent    = money(d.summary.total_finance);
      document.getElementById('cTotalCommission').textContent = money(d.summary.total_commission);
      document.getElementById('cDueNotes').textContent        = n(d.summary.due_notes);

      const statuses = d.by_status || [];
      drawDoughnut('statusChart',
        statuses.map(x => x.status || 'غير محدد'),
        statuses.map(x => x.count),
        ['#3B82F6','#16A34A','#EAB308','#EF4444','#8B5CF6','#F97316']);

      const banks = d.by_bank || [];
      drawBar('bankChart',
        banks.map(x => x.bank_name || 'غير محدد'),
        banks.map(x => x.count), '#3B82F6');

      const rows = d.recent || [];
      document.getElementById('contractsTable').innerHTML = rows.map(r => \`
        <tr class="border-b hover:bg-gray-50">
          <td class="px-4 py-3 font-mono text-gray-700">\${r.contract_number || '-'}</td>
          <td class="px-4 py-3">\${r.party_two_name || ''}</td>
          <td class="px-4 py-3 text-gray-600">\${r.finance_type || ''}</td>
          <td class="px-4 py-3 font-bold text-green-700">\${money(r.finance_amount)}</td>
          <td class="px-4 py-3 text-gray-700">\${money(r.commission_amount)}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">\${r.status || ''}</span>
          </td>
          <td class="px-4 py-3 text-gray-500">\${(r.created_at||'').substring(0,10)}</td>
        </tr>\`).join('') || '<tr><td colspan="7" class="text-center py-8 text-gray-400">لا توجد عقود في هذه الفترة</td></tr>';
    }

    function exportContractsCsv() {
      if (!lastData || !lastData.recent || lastData.recent.length === 0) {
        alert('لا توجد بيانات للتصدير'); return;
      }
      const headers = ['رقم العقد','الطرف الثاني','نوع التمويل','قيمة التمويل','العمولة','الحالة','التاريخ'];
      const rows = lastData.recent.map(r => [
        r.contract_number||'', r.party_two_name||'', r.finance_type||'',
        r.finance_amount||0, r.commission_amount||0, r.status||'',
        (r.created_at||'').substring(0,10)
      ]);
      csvDownload([headers, ...rows], 'contracts-report.csv');
    }`
})

// ─────────────────────────────────────────
// 3) Tenants / SaaS Report
// ─────────────────────────────────────────
export const tenantsReportPage = buildReportShell({
  title: 'تقرير الشركات والاشتراكات',
  headerIcon: 'fas fa-building',
  headerSubtitle: 'الشركات المشتركة، الباقات، والإيرادات',
  headerColor: 'purple',
  bodyId: 'tenantsReport',
  apiPath: '/api/reports/tenants',
  cardsHtml: `
    <div class="bg-purple-600 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-purple-100 text-sm font-medium mb-1">إجمالي الشركات</p><p class="text-3xl font-bold" id="cTotalTenants">-</p></div>
        <i class="fas fa-building text-4xl text-purple-200"></i>
      </div>
    </div>
    <div class="bg-green-600 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-green-100 text-sm font-medium mb-1">شركات نشطة</p><p class="text-3xl font-bold" id="cActiveTenants">-</p></div>
        <i class="fas fa-check-circle text-4xl text-green-200"></i>
      </div>
    </div>
    <div class="bg-blue-600 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-blue-100 text-sm font-medium mb-1">اشتراكات فعالة</p><p class="text-3xl font-bold" id="cActiveSubs">-</p></div>
        <i class="fas fa-box-open text-4xl text-blue-200"></i>
      </div>
    </div>
    <div class="bg-yellow-500 text-white rounded-xl shadow-md p-6">
      <div class="flex items-center justify-between">
        <div><p class="text-yellow-100 text-sm font-medium mb-1">الإيرادات الشهرية (MRR)</p><p class="text-3xl font-bold" id="cMRR">-</p></div>
        <i class="fas fa-chart-line text-4xl text-yellow-200"></i>
      </div>
    </div>`,
  chartsHtml: `
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-chart-pie ml-2 text-purple-600"></i>الاشتراكات حسب الباقة</h3>
      <div style="height:280px;position:relative;"><canvas id="packageChart"></canvas></div>
    </div>
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-bold text-gray-800 mb-4"><i class="fas fa-chart-bar ml-2 text-blue-600"></i>الشركات المسجلة شهرياً</h3>
      <div style="height:280px;position:relative;"><canvas id="growthChart"></canvas></div>
    </div>`,
  tablesHtml: `
    <div class="bg-white rounded-xl shadow-md p-6">
      <h3 class="font-bold text-gray-800 mb-4">تفاصيل الشركات</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100"><tr>
            <th class="px-4 py-3 text-right font-bold text-gray-700">الشركة</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">الحالة</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">الباقة</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">المستخدمون</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">العملاء</th>
            <th class="px-4 py-3 text-right font-bold text-gray-700">تاريخ التسجيل</th>
          </tr></thead>
          <tbody id="tenantsTable"></tbody>
        </table>
      </div>
    </div>`,
  renderScript: `
    function render(d) {
      document.getElementById('cTotalTenants').textContent  = n(d.summary.total_tenants);
      document.getElementById('cActiveTenants').textContent = n(d.summary.active_tenants);
      document.getElementById('cActiveSubs').textContent    = n(d.summary.active_subscriptions);
      document.getElementById('cMRR').textContent           = money(d.summary.mrr);

      const pkgs = d.by_package || [];
      drawDoughnut('packageChart',
        pkgs.map(x => x.package_name || 'بدون باقة'),
        pkgs.map(x => x.count),
        ['#7C3AED','#3B82F6','#16A34A','#EAB308','#EF4444','#F97316']);

      const growth = d.monthly_growth || [];
      drawBar('growthChart',
        growth.map(x => x.month),
        growth.map(x => x.new_tenants), '#7C3AED', 'شركات جديدة');

      document.getElementById('tenantsTable').innerHTML = (d.tenants || []).map(r => \`
        <tr class="border-b hover:bg-gray-50">
          <td class="px-4 py-3 font-bold">\${r.name || r.slug || ''}</td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 rounded text-xs \${r.status==='active'?'bg-green-100 text-green-800':'bg-gray-100 text-gray-600'}">
              \${r.status || ''}
            </span>
          </td>
          <td class="px-4 py-3 text-gray-600">\${r.package_name || '-'}</td>
          <td class="px-4 py-3">\${n(r.user_count)}</td>
          <td class="px-4 py-3">\${n(r.customer_count)}</td>
          <td class="px-4 py-3 text-gray-500">\${(r.created_at||'').substring(0,10)}</td>
        </tr>\`).join('') || '<tr><td colspan="6" class="text-center py-8 text-gray-400">لا توجد شركات</td></tr>';
    }`
})

// ─── Shared exports for other report pages ───────────────────────────────────

export const REPORT_FLATPICKR_HEAD = `  <link rel="stylesheet" href="${FLATPICKR_CSS}">
  <script src="${FLATPICKR_JS}"></script>
  <script src="${FLATPICKR_AR}"></script>`

export function reportFilterBarHtml(hex: string, selectedPeriod: string = 'year'): string {
  return buildFilterBar(hex, new Date().getFullYear(), selectedPeriod)
}

/** Date filter for /admin/link-stats — same flatpickr UX as reports, uses from/to query params. */
export function linkStatsFilterBarHtml(hex = '#0f766e'): string {
  const year = new Date().getFullYear()
  return `
  <style>
    .flatpickr-calendar { direction: rtl !important; font-family: inherit; }
    .flatpickr-months { direction: rtl; }
    .flatpickr-current-month { direction: rtl; display: flex; align-items: center; justify-content: center; gap: 4px; }
    .flatpickr-current-month .flatpickr-monthDropdown-months { direction: rtl; }
    #reportFilterCard { transition: box-shadow .15s; }
    #periodSelect { direction: rtl; }
    .fp-range-pill { background: ${hex}18; border: 1.5px solid ${hex}55; color: #1e293b; }
  </style>
  <div id="reportFilterCard" class="bg-white border border-slate-200 rounded-2xl metric-glow overflow-hidden mt-4">
    <div style="height:3px;background:linear-gradient(to left,${hex}99,${hex})"></div>
    <div class="px-5 pt-4 pb-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg" style="background:${hex}18">
            <i class="fas fa-calendar-alt text-sm" style="color:${hex}"></i>
          </span>
          <span class="text-sm font-bold text-slate-700">الفترة الزمنية</span>
        </div>
        <span id="periodBadge" class="text-xs font-semibold px-3 py-1 rounded-full text-white" style="background:${hex};display:none"></span>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative">
          <span class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style="color:${hex}">
            <i class="fas fa-chevron-down text-xs"></i>
          </span>
          <select id="periodSelect" onchange="onPeriodChange()"
            style="padding-right:2rem;border-color:#e2e8f0;min-width:220px;appearance:none;-webkit-appearance:none"
            class="pl-4 py-2.5 border-2 rounded-xl text-slate-800 font-semibold bg-slate-50 cursor-pointer focus:outline-none text-sm">
            <option value="today">اليوم</option>
            <option value="week">الأسبوع الحالي</option>
            <option value="month">الشهر الحالي</option>
            <option value="year">السنة الحالية ${year}</option>
            <option value="last7">آخر 7 أيام</option>
            <option value="last30" selected>آخر 30 يوم</option>
            <option value="last90">آخر 90 يوم</option>
            <option value="all">كل الفترات</option>
            <option value="q1">الربع الأول ${year} · يناير – مارس</option>
            <option value="q2">الربع الثاني ${year} · أبريل – يونيو</option>
            <option value="q3">الربع الثالث ${year} · يوليو – سبتمبر</option>
            <option value="q4">الربع الرابع ${year} · أكتوبر – ديسمبر</option>
            <option value="custom">تاريخ مخصص…</option>
          </select>
        </div>
        <div id="dateDisplay" class="fp-range-pill flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium">
          <i class="fas fa-calendar-week text-xs opacity-60"></i>
          <span id="dateRangeLabel" class="text-slate-700">—</span>
        </div>
        <div id="customWrap" style="display:none">
          <input id="dateRangePicker" type="text" readonly placeholder="انقر لاختيار فترة مخصصة"
            class="px-4 py-2.5 rounded-xl text-sm text-slate-700 cursor-pointer w-72 bg-slate-50"
            style="border:2px dashed #cbd5e1">
        </div>
        <div id="applyWrap" style="display:none">
          <button type="button" onclick="load()"
            class="px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-opacity hover:opacity-90 flex items-center gap-2"
            style="background:${hex}">
            <i class="fas fa-check text-xs"></i>تطبيق
          </button>
        </div>
      </div>
    </div>
  </div>`
}

export const LINK_STATS_DATE_FILTER_JS = `
  let _startDate = '', _endDate = '', _fp = null;

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmt(d) { return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }

  function getPeriodDates(period) {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth();
    const lastDay = (yr, mo) => new Date(yr, mo + 1, 0).getDate();
    const rolling = (days, label) => {
      const to = new Date(), from = new Date();
      from.setDate(to.getDate() - days + 1);
      const range = fmt(from) + ' – ' + fmt(to);
      return { s: fmt(from), e: fmt(to), label, range };
    };
    switch (period) {
      case 'today': return { s: fmt(now), e: fmt(now), label: 'اليوم', range: fmt(now) };
      case 'last7': return rolling(7, 'آخر 7 أيام');
      case 'last30': return rolling(30, 'آخر 30 يوم');
      case 'last90': return rolling(90, 'آخر 90 يوم');
      case 'all': return { s: '', e: '', label: 'كل الفترات', range: 'منذ البداية' };
      case 'year': return { s: y+'-01-01', e: y+'-12-31', label: 'السنة الحالية '+y, range: '1 يناير '+y+' – 31 ديسمبر '+y };
      case 'month': {
        const ld = lastDay(y, m), mn = now.toLocaleString('ar-SA', { month: 'long' });
        return { s: y+'-'+pad(m+1)+'-01', e: y+'-'+pad(m+1)+'-'+pad(ld), label: mn+' '+y, range: '1 '+mn+' – '+ld+' '+mn+' '+y };
      }
      case 'week': {
        const day = now.getDay(), mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        return { s: fmt(mon), e: fmt(sun), label: 'الأسبوع الحالي', range: fmt(mon)+' – '+fmt(sun) };
      }
      case 'q1': return { s: y+'-01-01', e: y+'-03-31', label: 'الربع الأول '+y, range: 'يناير – مارس '+y };
      case 'q2': return { s: y+'-04-01', e: y+'-06-30', label: 'الربع الثاني '+y, range: 'أبريل – يونيو '+y };
      case 'q3': return { s: y+'-07-01', e: y+'-09-30', label: 'الربع الثالث '+y, range: 'يوليو – سبتمبر '+y };
      case 'q4': return { s: y+'-10-01', e: y+'-12-31', label: 'الربع الرابع '+y, range: 'أكتوبر – ديسمبر '+y };
      default: return null;
    }
  }

  function dateRange() {
    const out = {};
    if (_startDate) out.from = _startDate;
    if (_endDate) out.to = _endDate;
    return out;
  }

  function setBadge(label, range) {
    const badge = document.getElementById('periodBadge');
    const rangeEl = document.getElementById('dateRangeLabel');
    if (badge) {
      if (label) { badge.textContent = label; badge.style.display = ''; }
      else { badge.style.display = 'none'; }
    }
    if (rangeEl) rangeEl.textContent = range || '—';
  }

  function onPeriodChange() {
    const period = document.getElementById('periodSelect').value;
    const customWrap = document.getElementById('customWrap');
    const applyWrap = document.getElementById('applyWrap');
    const dateDisplay = document.getElementById('dateDisplay');
    if (period === 'custom') {
      customWrap.style.display = '';
      applyWrap.style.display = '';
      dateDisplay.style.display = 'none';
      setBadge('', '');
      if (_fp) _fp.clear();
      _startDate = '';
      _endDate = '';
    } else {
      customWrap.style.display = 'none';
      applyWrap.style.display = 'none';
      dateDisplay.style.display = '';
      const d = getPeriodDates(period);
      _startDate = d.s;
      _endDate = d.e;
      setBadge(d.label, d.range);
      load();
    }
  }

  function initDatePicker() {
    if (typeof flatpickr === 'undefined') return;
    _fp = flatpickr('#dateRangePicker', {
      mode: 'range',
      dateFormat: 'Y-m-d',
      locale: 'ar',
      allowInput: false,
      onReady(_, __, fp) { fp.calendarContainer.setAttribute('dir', 'rtl'); },
      onClose(dates) {
        if (dates.length === 2) {
          _startDate = fmt(dates[0]);
          _endDate = fmt(dates[1]);
          const r = _startDate + ' – ' + _endDate;
          document.getElementById('dateRangePicker').value = r;
          setBadge('مخصص', r);
        }
      }
    });
  }

  function initDateRangeFromUrl() {
    const q = new URLSearchParams(location.search);
    const from = q.get('from'), to = q.get('to');
    const select = document.getElementById('periodSelect');
    if (from && to && /^\\d{4}-\\d{2}-\\d{2}$/.test(from) && /^\\d{4}-\\d{2}-\\d{2}$/.test(to)) {
      select.value = 'custom';
      document.getElementById('customWrap').style.display = '';
      document.getElementById('applyWrap').style.display = '';
      document.getElementById('dateDisplay').style.display = 'none';
      _startDate = from;
      _endDate = to;
      const r = from + ' – ' + to;
      const picker = document.getElementById('dateRangePicker');
      if (picker) picker.value = r;
      setBadge('مخصص', r);
      if (_fp) _fp.setDate([from, to], false);
      return;
    }
    if (!from && !to) {
      const allExplicit = q.get('period') === 'all';
      if (allExplicit) {
        select.value = 'all';
        const d = getPeriodDates('all');
        _startDate = d.s;
        _endDate = d.e;
        setBadge(d.label, d.range);
        return;
      }
    }
    select.value = 'last30';
    const d = getPeriodDates('last30');
    _startDate = d.s;
    _endDate = d.e;
    setBadge(d.label, d.range);
  }
`

export const REPORT_FILTER_BASE_JS = `
  let _startDate = '', _endDate = '', _fp = null;

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmt(d) { return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }

  function getPeriodDates(period) {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth();
    const lastDay = (yr, mo) => new Date(yr, mo + 1, 0).getDate();
    switch (period) {
      case 'today': return { s: fmt(now), e: fmt(now), label: 'اليوم', range: fmt(now) };
      case 'year': return { s: y+'-01-01', e: y+'-12-31', label: 'السنة الحالية '+y, range: '1 يناير '+y+' – 31 ديسمبر '+y };
      case 'month': { const ld = lastDay(y, m), mn = now.toLocaleString('ar-SA',{month:'long'}); return { s: y+'-'+pad(m+1)+'-01', e: y+'-'+pad(m+1)+'-'+pad(ld), label: mn+' '+y, range: '1 '+mn+' – '+ld+' '+mn+' '+y }; }
      case 'week': { const day = now.getDay(), mon = new Date(now); mon.setDate(now.getDate()-((day+6)%7)); const sun = new Date(mon); sun.setDate(mon.getDate()+6); return { s: fmt(mon), e: fmt(sun), label: 'الأسبوع الحالي', range: fmt(mon)+' – '+fmt(sun) }; }
      case 'q1': return { s: y+'-01-01', e: y+'-03-31', label: 'الربع الأول '+y, range: 'يناير – مارس '+y };
      case 'q2': return { s: y+'-04-01', e: y+'-06-30', label: 'الربع الثاني '+y, range: 'أبريل – يونيو '+y };
      case 'q3': return { s: y+'-07-01', e: y+'-09-30', label: 'الربع الثالث '+y, range: 'يوليو – سبتمبر '+y };
      case 'q4': return { s: y+'-10-01', e: y+'-12-31', label: 'الربع الرابع '+y, range: 'أكتوبر – ديسمبر '+y };
      default: return null;
    }
  }

  function setBadge(label, range) {
    const badge = document.getElementById('periodBadge'), rangeEl = document.getElementById('dateRangeLabel');
    if (badge) { if (label) { badge.textContent = label; badge.style.display = ''; } else badge.style.display = 'none'; }
    if (rangeEl) rangeEl.textContent = range || '—';
  }

  function onPeriodChange() {
    const period = document.getElementById('periodSelect').value;
    const customWrap = document.getElementById('customWrap'), applyWrap = document.getElementById('applyWrap'), dateDisplay = document.getElementById('dateDisplay');
    if (period === 'custom') {
      customWrap.style.display = ''; applyWrap.style.display = ''; dateDisplay.style.display = 'none';
      setBadge('', ''); if (_fp) _fp.clear(); _startDate = ''; _endDate = '';
    } else {
      customWrap.style.display = 'none'; applyWrap.style.display = 'none'; dateDisplay.style.display = '';
      const d = getPeriodDates(period); _startDate = d.s; _endDate = d.e; setBadge(d.label, d.range);
      loadReport();
    }
  }

  function initDatePicker() {
    if (typeof flatpickr === 'undefined') return;
    _fp = flatpickr('#dateRangePicker', {
      mode: 'range', dateFormat: 'Y-m-d', locale: 'ar', allowInput: false,
      onReady(_, __, fp) { fp.calendarContainer.setAttribute('dir', 'rtl'); },
      onClose(dates) {
        if (dates.length === 2) {
          _startDate = fmt(dates[0]); _endDate = fmt(dates[1]);
          const r = _startDate + ' – ' + _endDate;
          document.getElementById('dateRangePicker').value = r;
          setBadge('مخصص', r);
        }
      }
    });
  }

  function n(v) { return (v == null ? 0 : Number(v)).toLocaleString('ar-SA'); }
  function money(v) { return n(v) + ' ريال'; }

  function refreshReportFilterYearLabels() {
    var y = new Date().getFullYear();
    if (!Number.isFinite(y) || y < 2000) return;
    var sel = document.getElementById('periodSelect');
    if (!sel) return;
    var labels = {
      year: 'السنة الحالية ' + y,
      q1: 'الربع الأول ' + y + ' · يناير – مارس',
      q2: 'الربع الثاني ' + y + ' · أبريل – يونيو',
      q3: 'الربع الثالث ' + y + ' · يوليو – سبتمبر',
      q4: 'الربع الرابع ' + y + ' · أكتوبر – ديسمبر'
    };
    for (var i = 0; i < sel.options.length; i++) {
      var opt = sel.options[i];
      if (labels[opt.value]) opt.textContent = labels[opt.value];
    }
  }
`
