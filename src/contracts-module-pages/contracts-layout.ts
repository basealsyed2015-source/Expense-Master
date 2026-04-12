/**
 * Shared contracts module HTML layout constants and helpers.
 * Used by migrated TypeScript page modules (Phase 1) and legacy patch flow.
 */
import contractsModuleCss from '../contracts-module/css/style.css?raw'

/** Bump when contracts-module JS changes to bust browser cache. */
export const CONTRACTS_ASSETS_VERSION = '20260401'

export const contractsAppJsSrc = `/contracts-module/js/app.js?v=${CONTRACTS_ASSETS_VERSION}`
export const contractsDashboardJsSrc = `/contracts-module/js/dashboard.js?v=${CONTRACTS_ASSETS_VERSION}`

/** Canonical routes under the Hono worker (no relative .html links). */
export const CONTRACTS_ROUTES = {
  home: '/admin/contracts',
  list: '/admin/contracts/list',
  new: '/admin/contracts/new',
  view: '/admin/contracts/view',
  templates: '/admin/contracts/templates',
  notes: '/admin/contracts/notes',
  archive: '/admin/contracts/archive',
  settings: '/admin/contracts/settings',
  panel: '/admin/panel',
} as const

export type ContractsNavKey =
  | 'dashboard'
  | 'contracts'
  | 'new'
  | 'templates'
  | 'notes'
  | 'archive'
  | 'settings'

/** Inlined CSS block (replaces external css/style.css link). */
export function contractsInlineStyles(): string {
  return `\n  <style id="contracts-module-styles">\n${contractsModuleCss}\n  </style>\n`
}

/**
 * Opening fragment: doctype through end of `<head>` (includes inlined styles, no external contracts CSS link).
 */
export function contractsHeadOpen(title: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" />
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap" rel="stylesheet" />${contractsInlineStyles()}
</head>
<body>
`
}

export function contractsBodyClose(): string {
  return `</body>
</html>
`
}

const R = CONTRACTS_ROUTES

/** Shared sidebar navigation; `active` marks the current section. */
export function contractsSidebarNav(active: ContractsNavKey): string {
  const n = (key: ContractsNavKey, cls: string) =>
    active === key ? `${cls} active` : cls
  return `  <aside class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon"><i class="fas fa-file-contract"></i></div>
      <div class="logo-text">
        <span class="company-name">الموعد</span>
        <span class="company-sub">للمقاولات العامة</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      <a href="${R.home}" class="${n('dashboard', 'nav-item')}" data-page="dashboard">
        <i class="fas fa-chart-pie"></i><span>لوحة التحكم</span>
      </a>
      <a href="${R.list}" class="${n('contracts', 'nav-item')}" data-page="contracts">
        <i class="fas fa-file-alt"></i><span>العقود</span>
      </a>
      <a href="${R.new}" class="${n('new', 'nav-item')}" data-page="new-contract">
        <i class="fas fa-plus-circle"></i><span>عقد جديد</span>
      </a>
      <a href="${R.templates}" class="${n('templates', 'nav-item')}" data-page="templates">
        <i class="fas fa-layer-group"></i><span>القوالب</span>
      </a>
      <a href="${R.notes}" class="${n('notes', 'nav-item')}" data-page="notes">
        <i class="fas fa-money-check-alt"></i><span>سندات الأمر</span>
      </a>
      <a href="${R.archive}" class="${n('archive', 'nav-item')}" data-page="archive">
        <i class="fas fa-archive"></i><span>الأرشيف</span>
      </a>
      <a href="${R.settings}" class="${n('settings', 'nav-item')}" data-page="settings">
        <i class="fas fa-cog"></i><span>الإعدادات</span>
      </a>
    </nav>
    <div class="sidebar-footer">
      <div class="cr-number"><i class="fas fa-registered"></i> س.ت: 3350140062</div>
    </div>
  </aside>
`
}

/** Top bar with home, date, and optional right-side HTML (CTA button or group). */
export function contractsTopbar(titleHtml: string, actionsHtml: string): string {
  return `    <header class="topbar">
      <button class="menu-toggle" onclick="toggleSidebar()"><i class="fas fa-bars"></i></button>
      <div class="topbar-title">${titleHtml}</div>
      <div class="topbar-actions">
        <a href="${R.panel}" class="btn btn-ghost contracts-home-btn" title="العودة للنظام الرئيسي"><i class="fas fa-home"></i> الرئيسية</a>
        <div class="current-date" id="currentDate"></div>
        ${actionsHtml}
      </div>
    </header>
`
}
