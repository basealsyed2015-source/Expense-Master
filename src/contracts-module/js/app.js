/* =============================================
   app.js - الوظائف المشتركة للنظام
   ============================================= */

// ===== CONFIG =====
const COMPANY = {
  name: 'شركة الموعد للمقاولات العامة',
  cr: '3350140062',
  tax: '310XXXXXXXXX', // الرقم الضريبي
  city: 'الرياض',
  phone: '',
  court: 'الرياض'
};

// ===== API HELPERS =====
const API = {
  base: '/api/contract-tables',

  async request(path, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(path, {
        credentials: 'same-origin',
        ...options,
        signal: controller.signal
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  },

  async get(table, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`${this.base}/${table}${qs ? '?' + qs : ''}`);
  },

  async getOne(table, id) {
    return this.request(`${this.base}/${table}/${id}`);
  },

  async create(table, data) {
    return this.request(`${this.base}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async update(table, id, data) {
    return this.request(`${this.base}/${table}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async patch(table, id, data) {
    return this.request(`${this.base}/${table}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async delete(table, id) {
    await fetch(`${this.base}/${table}/${id}`, { method: 'DELETE', credentials: 'same-origin' });
  }
};

// ===== FORMATTERS =====
function formatMoney(amount) {
  if (!amount && amount !== 0) return '—';
  return Number(amount).toLocaleString('ar-SA') + ' ريال';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
}

function getStatusBadge(status) {
  const map = {
    'نشط': { cls: 'badge-active', icon: 'fa-check-circle' },
    'بانتظار التمويل': { cls: 'badge-pending', icon: 'fa-clock' },
    'مكتمل': { cls: 'badge-completed', icon: 'fa-trophy' },
    'مؤرشف': { cls: 'badge-archived', icon: 'fa-archive' },
    'ملغي': { cls: 'badge-cancelled', icon: 'fa-times-circle' }
  };
  const s = map[status] || { cls: 'badge-pending', icon: 'fa-question' };
  return `<span class="badge ${s.cls}"><i class="fas ${s.icon}" style="font-size:10px;margin-left:4px;"></i>${status}</span>`;
}

function getNoteStatusBadge(status) {
  const map = {
    'ساري': { cls: 'badge-active' },
    'سار':  { cls: 'badge-active' },
    'محصل': { cls: 'badge-completed' },
    'متأخر': { cls: 'badge-cancelled' }
  };
  const s = map[status] || { cls: 'badge-pending' };
  return `<span class="badge ${s.cls}">${status}</span>`;
}

// ===== NUMBER TO ARABIC WORDS =====
function numberToArabicWords(num) {
  if (!num) return 'صفر ريال سعودي';
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
    'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر',
    'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convert(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 ? ' و' + ones[n % 10] : '');
    }
    if (n < 1000) {
      return hundreds[Math.floor(n / 100)] + (n % 100 ? ' و' + convert(n % 100) : '');
    }
    if (n < 1000000) {
      const t = Math.floor(n / 1000);
      const r = n % 1000;
      const prefix = t === 1 ? 'ألف' : t === 2 ? 'ألفان' : t <= 10 ? convert(t) + ' آلاف' : convert(t) + ' ألف';
      return prefix + (r ? ' و' + convert(r) : '');
    }
    const m = Math.floor(n / 1000000);
    const r = n % 1000000;
    const prefix = m === 1 ? 'مليون' : m === 2 ? 'مليونان' : convert(m) + ' ملايين';
    return prefix + (r ? ' و' + convert(r) : '');
  }

  const n = Math.floor(num);
  return (n === 0 ? 'صفر' : convert(n)) + ' ريال سعودي لا غير';
}

// ===== CONTRACT NUMBER GENERATOR =====
function generateContractNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 900) + 100;
  return `CNT-${year}-${rand}`;
}

// ===== HIJRI DATE =====
function getHijriDate() {
  try {
    const today = new Date();
    const hijri = today.toLocaleDateString('ar-SA-u-ca-islamic', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
    return hijri;
  } catch {
    return '';
  }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ===== MODAL =====
function openModal(id) {
  const el = document.getElementById(id);
  el?.classList.add('active');
  el?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const el = document.getElementById(id);
  el?.classList.remove('active');
  el?.setAttribute('aria-hidden', 'true');
  if (!document.querySelector('.modal-overlay.active')) {
    document.body.style.overflow = '';
  }
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    e.target.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal-overlay.active')) {
      document.body.style.overflow = '';
    }
  }
});

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// ===== ACTIVE NAV =====
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    const h = item.getAttribute('href');
    if (h && (path === h || path.replace(/\/$/, '') === h)) item.classList.add('active');
  });
}

// ===== CURRENT DATE =====
function setCurrentDate() {
  const el = document.getElementById('currentDate');
  if (!el) return;
  const now = new Date();
  const greg = now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hijri = now.toLocaleDateString('ar-SA-u-ca-islamic', { year: 'numeric', month: 'long', day: 'numeric' });
  el.innerHTML = `<span>${greg}</span>`;
}

// ===== CONFIRM DELETE =====
function confirmDelete(message, callback) {
  if (confirm(message || 'هل أنت متأكد من الحذف؟')) callback();
}

// ===== URL PARAMS =====
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ===== WHATSAPP =====
function sendWhatsApp(phone, message) {
  const cleaned = phone.replace(/[^0-9]/g, '').replace(/^0/, '966');
  const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// ===== PRINT CONTRACT =====
function printPage() {
  window.print();
}

// Expose for inline handlers + CSP-safe pages
if (typeof globalThis !== 'undefined') {
  globalThis.openModal = openModal;
  globalThis.closeModal = closeModal;
  globalThis.showToast = showToast;
  globalThis.toggleSidebar = toggleSidebar;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  setCurrentDate();
});
