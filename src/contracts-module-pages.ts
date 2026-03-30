import contractsModuleCss from './contracts-module/css/style.css?raw'
import indexHtml from './contracts-module/index.html?raw'
import contractsListHtml from './contracts-module/contracts.html?raw'
import newContractHtml from './contracts-module/new-contract.html?raw'
import contractViewHtml from './contracts-module/contract-view.html?raw'
import templatesHtml from './contracts-module/templates.html?raw'
import notesHtml from './contracts-module/notes.html?raw'
import archiveHtml from './contracts-module/archive.html?raw'
import settingsHtml from './contracts-module/settings.html?raw'

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
 * Rewrite relative asset and page links for deployment under /admin/contracts and /contracts-module.
 * Font Awesome + Tajawal stay on CDN; app CSS is inlined for reliability.
 */
export function patchContractsHtml(html: string): string {
  let h = injectContractsCss(stripExternalContractsStylesheet(html.replace(/\r\n/g, '\n')))
  h = h.replace(/src="js\/app\.js"/g, 'src="/contracts-module/js/app.js?v=20260330"')
  h = h.replace(/src="js\/dashboard\.js"/g, 'src="/contracts-module/js/dashboard.js?v=20260330"')
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
  // Home link is inlined here so it appears even when /contracts-module/js/app.js is blocked or cached.
  if (!h.includes('contracts-home-btn')) {
    h = h.replace(
      /<div class="topbar-actions">/,
      '<div class="topbar-actions"><a href="/admin/panel" class="btn btn-ghost contracts-home-btn" title="العودة للنظام الرئيسي"><i class="fas fa-home"></i> الرئيسية</a>'
    )
  }
  return h
}

export const contractsDashboardPage = patchContractsHtml(indexHtml)
export const contractsListPage = patchContractsHtml(contractsListHtml)
export const contractsNewPage = patchContractsHtml(newContractHtml)
export const contractsViewPage = patchContractsHtml(contractViewHtml)
export const contractsTemplatesPage = patchContractsHtml(templatesHtml)
export const contractsNotesPage = patchContractsHtml(notesHtml)
export const contractsArchivePage = patchContractsHtml(archiveHtml)
export const contractsSettingsPage = patchContractsHtml(settingsHtml)
