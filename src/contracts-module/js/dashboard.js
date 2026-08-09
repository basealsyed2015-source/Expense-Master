/* =============================================
   dashboard.js - لوحة التحكم
   ============================================= */

let contractsChart = null;

async function loadDashboard() {
  try {
    const data = await API.get('contracts', { limit: 100 });
    const contracts = data.data || [];

    // ===== STATS =====
    const total = contracts.length;
    const active = contracts.filter(c => c.status === 'نشط').length;
    const pending = contracts.filter(c => c.status === 'بانتظار التمويل').length;
    const completed = contracts.filter(c => c.status === 'مكتمل').length;
    const totalCommission = contracts.reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);
    const pendingCommission = contracts
      .filter(c => c.status !== 'مكتمل' && c.status !== 'مؤرشف')
      .reduce((s, c) => s + (Number(c.commission_amount) || 0), 0);

    animateNumber('totalContracts', total);
    animateNumber('activeContracts', active);
    animateNumber('pendingContracts', pending);
    animateNumber('completedContracts', completed);
    animateNumberMoney('totalCommission', totalCommission);
    animateNumberMoney('pendingCommission', pendingCommission);

    // ===== CHART =====
    try {
      buildChart(contracts);
    } catch (e) {
      console.warn('[contracts dashboard] chart failed (Chart.js CDN blocked?)', e);
    }

    // ===== ALERTS =====
    buildAlerts(contracts);

    // ===== RECENT TABLE =====
    buildRecentTable(contracts);

  } catch (err) {
    console.error(err);
    showToast('تعذّر تحميل بيانات لوحة التحكم', 'error');
  }
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.ceil(target / 30);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString('ar-SA');
    if (current >= target) clearInterval(timer);
  }, 30);
}

function animateNumberMoney(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString('ar-SA');
    if (current >= target) clearInterval(timer);
  }, 25);
}

function buildChart(contracts) {
  const ctx = document.getElementById('contractsChart');
  if (!ctx) return;

  const statusCounts = {
    'نشط': 0,
    'بانتظار التمويل': 0,
    'مكتمل': 0,
    'مؤرشف': 0,
    'ملغي': 0
  };
  contracts.forEach(c => {
    if (statusCounts[c.status] !== undefined) statusCounts[c.status]++;
    else statusCounts['نشط']++;
  });

  const labels = Object.keys(statusCounts).filter(k => statusCounts[k] > 0);
  const values = labels.map(l => statusCounts[l]);
  const colors = {
    'نشط': '#27ae60',
    'بانتظار التمويل': '#f39c12',
    'مكتمل': '#3498db',
    'مؤرشف': '#95a5a6',
    'ملغي': '#e74c3c'
  };

  if (contractsChart) contractsChart.destroy();

  contractsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map(l => colors[l] || '#ccc'),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'Tajawal', size: 13 },
            padding: 16,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} عقد`
          },
          bodyFont: { family: 'Tajawal' },
          titleFont: { family: 'Tajawal' }
        }
      },
      cutout: '65%'
    }
  });
}

function buildAlerts(contracts) {
  const container = document.getElementById('alertsList');
  if (!container) return;

  const alerts = [];

  // عقود بانتظار التمويل
  const pendingFunding = contracts.filter(c => c.status === 'بانتظار التمويل');
  if (pendingFunding.length > 0) {
    alerts.push({
      type: 'warning',
      icon: 'fa-clock',
      title: `${pendingFunding.length} عقود بانتظار نزول التمويل`,
      sub: pendingFunding.map(c => c.party_two_name).slice(0, 3).join('، ') + (pendingFunding.length > 3 ? ' ...' : '')
    });
  }

  // سندات أمر سارية
  const activeNotes = contracts.filter(c => c.note_order_number && c.status !== 'مكتمل' && c.status !== 'مؤرشف');
  if (activeNotes.length > 0) {
    alerts.push({
      type: 'info',
      icon: 'fa-money-check-alt',
      title: `${activeNotes.length} سندات أمر سارية لم تُحصَّل`,
      sub: 'تأكد من متابعة تحصيل مبالغ السعي'
    });
  }

  // عقود نشطة
  const activeContracts = contracts.filter(c => c.status === 'نشط');
  if (activeContracts.length > 0) {
    alerts.push({
      type: 'danger',
      icon: 'fa-exclamation-triangle',
      title: `${activeContracts.length} عقود نشطة تحتاج متابعة`,
      sub: activeContracts.map(c => c.party_two_name).slice(0, 2).join('، ')
    });
  }

  if (alerts.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-bell-slash"></i><p>لا توجد تنبيهات حالياً</p></div>`;
    return;
  }

  container.innerHTML = alerts.map(a => `
    <div class="alert-item alert-${a.type}">
      <div class="alert-icon"><i class="fas ${a.icon}"></i></div>
      <div class="alert-text">
        <strong>${a.title}</strong>
        <span>${a.sub}</span>
      </div>
    </div>
  `).join('');
}

function buildRecentTable(contracts) {
  const tbody = document.getElementById('recentContractsBody');
  if (!tbody) return;

  const recent = [...contracts]
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
    .slice(0, 8);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fas fa-file-alt"></i><p>لا توجد عقود بعد</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = recent.map(c => `
    <tr>
      <td><strong class="text-primary">${c.contract_number || '—'}</strong></td>
      <td>${c.party_two_name || '—'}</td>
      <td><small>${c.template_name || '—'}</small></td>
      <td><span class="amount-display" style="font-size:14px;">${formatMoney(c.finance_amount)}</span></td>
      <td><strong class="text-secondary">${formatMoney(c.commission_amount)}</strong></td>
      <td>${getStatusBadge(c.status, { bankAgentName: c.bank_agent_name })}</td>
      <td>${c.note_order_number ? `<code>${c.note_order_number}</code>` : '—'}</td>
      <td>
        <div class="action-btns">
          <a href="/admin/contracts/view?id=${c.id}" class="action-btn action-view" title="عرض"><i class="fas fa-eye"></i></a>
          <a href="/admin/contracts/new?edit=${c.id}" class="action-btn action-edit" title="تعديل"><i class="fas fa-edit"></i></a>
          <a href="/admin/contracts/view?id=${c.id}&print=1" class="action-btn action-pdf" title="طباعة/PDF"><i class="fas fa-print"></i></a>
          ${c.party_two_phone ? `<button class="action-btn action-whatsapp" onclick="sendWA('${c.party_two_phone}','${c.party_two_name}','${c.contract_number}')" title="واتساب"><i class="fab fa-whatsapp"></i></button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function sendWA(phone, name, contractNum) {
  const msg = `السلام عليكم ${name}،\nبخصوص عقد الوساطة رقم ${contractNum}، نرجو التواصل معنا لمتابعة إجراءات التمويل.\nشركة الموعد للمقاولات العامة`;
  sendWhatsApp(phone, msg);
}

document.addEventListener('DOMContentLoaded', loadDashboard);
