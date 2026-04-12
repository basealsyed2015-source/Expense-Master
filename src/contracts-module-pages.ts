/** Keep in sync with `ASSETS_VERSION` in scripts/build-contracts-ts-pages.mjs when bumping cache. */
const LEGACY_ASSETS_QUERY = '?v=20260405'

import contractsModuleCss from './contracts-module/css/style.css?raw'
import contractViewHtml from './contracts-module/contract-view.html?raw'
import notesHtml from './contracts-module/notes.html?raw'
import archiveHtml from './contracts-module/archive.html?raw'
import settingsHtml from './contracts-module/settings.html?raw'

/** Phase 1: core pages generated from HTML via scripts/build-contracts-ts-pages.mjs */
export { contractsDashboardPage } from './contracts-module-pages/generated/contractsDashboardPage'
export { contractsListPage } from './contracts-module-pages/generated/contractsListPage'
export { contractsNewPage } from './contracts-module-pages/generated/contractsNewPage'
export { contractsTemplatesPage } from './contracts-module-pages/generated/contractsTemplatesPage'

/** Inline bundled CSS so the UI is styled even when asset URLs are blocked or not routed to the Worker. */
function injectContractsCss(html: string): string {
  const block = `\n  <style id="contracts-module-styles">\n${contractsModuleCss}\n  </style>\n`
  if (html.includes('id="contracts-module-styles"')) return html
  return html.replace('<head>', `<head>${block}`)
}

/** Remove standalone stylesheet link (styles are inlined in injectContractsCss). */
function stripExternalContractsStylesheet(html: string): string {
  return html
    .replace(/\s*<link rel="stylesheet" href="css\/style\.css"\s*\/?>/gi, '')
    .replace(/\s*<link rel="stylesheet" href='css\/style\.css'\s*\/?>/gi, '')
    .replace(/\s*<link rel="stylesheet" href="\/contracts-module\/css\/style\.css"\s*\/?>/gi, '')
    .replace(/\s*<link rel="stylesheet" href='\/contracts-module\/css\/style\.css'\s*\/?>/gi, '')
}

/**
 * Legacy: rewrite relative asset and page links for remaining raw HTML pages (view, notes, archive, settings).
 * Font Awesome + Tajawal stay on CDN; app CSS is inlined for reliability.
 */
/** Adds class on `<html>` so role-3 sidebar CSS applies before app.js runs (avoids flash of hidden nav). */
export function markContractsHtmlRole3Restricted(html: string): string {
  return html.replace('<html lang="ar" dir="rtl">', '<html lang="ar" dir="rtl" class="contracts-role-3">')
}

export function patchContractsHtml(html: string): string {
  let h = injectContractsCss(stripExternalContractsStylesheet(html.replace(/\r\n/g, '\n')))
  h = h.replace(/src="js\/app\.js"/g, `src="/contracts-module/js/app.js${LEGACY_ASSETS_QUERY}"`)
  h = h.replace(/src="js\/dashboard\.js"/g, `src="/contracts-module/js/dashboard.js${LEGACY_ASSETS_QUERY}"`)
  h = h.replace(/new-contract\.html\?template=/g, '/admin/contracts/new?template=')
  h = h.replace(/new-contract\.html\?edit=/g, '/admin/contracts/new?edit=')
  h = h.replace(/contract-view\.html\?id=/g, '/admin/contracts/view?id=')
  h = h.replace(/notes\.html\?/g, '/admin/contracts/notes?')
  h = h.replace(/href="index\.html"/g, 'href="/admin/contracts"')
  h = h.replace(/href="contracts\.html"/g, 'href="/admin/contracts/list"')
  h = h.replace(/href="new-contract\.html"/g, 'href="/admin/contracts/new"')
  h = h.replace(/href="templates\.html"/g, 'href="/admin/contracts/templates"')
  h = h.replace(/href="notes\.html"/g, 'href="/admin/contracts/notes"')
  h = h.replace(/href="archive\.html"/g, 'href="/admin/contracts/archive"')
  h = h.replace(/href="settings\.html"/g, 'href="/admin/contracts/settings"')
  h = h.replace(/window\.location\.href = 'contracts\.html'/g, "window.location.href = '/admin/contracts/list'")
  h = h.replace(/window\.location\.href = `contracts\.html`/g, 'window.location.href = `/admin/contracts/list`')
  h = h.replace(/`contracts\.html`/g, '`/admin/contracts/list`')
  h = h.replace(/`new-contract\.html\?edit=/g, '`/admin/contracts/new?edit=')
  h = h.replace(/`notes\.html\?search=/g, '`/admin/contracts/notes?search=')
  h = h.replace(/`contract-view\.html\?id=/g, '`/admin/contracts/view?id=')
  if (!h.includes('contracts-home-btn')) {
    h = h.replace(
      /<div class="topbar-actions">/,
      '<div class="topbar-actions"><a href="/admin/panel" class="btn btn-ghost contracts-home-btn" title="العودة للنظام الرئيسي"><i class="fas fa-home"></i> الرئيسية</a>'
    )
  }
  return h
}

export const contractsViewPage = patchContractsHtml(contractViewHtml)
export const contractsNotesPage = patchContractsHtml(notesHtml)
export const contractsArchivePage = patchContractsHtml(archiveHtml)
export const contractsSettingsPage = patchContractsHtml(settingsHtml)

/** Shared layout helpers and route constants for future refactors. */
export * from './contracts-module-pages/contracts-layout'
