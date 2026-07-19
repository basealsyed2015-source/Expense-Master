import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('chat lazy load', () => {
  it('injects lazy stub instead of full widget on admin pages', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
    assert.match(src, /renderChatWidgetLazyStub/)
    assert.doesNotMatch(src, /injectPersistentAdminSidebar[\s\S]{0,800}renderChatWidget\(/)
  })

  it('exposes widget-html endpoint for on-demand load', () => {
    const api = readFileSync(join(process.cwd(), 'src', 'chat-module-api.ts'), 'utf8')
    assert.match(api, /\/api\/chat\/widget-html/)
  })

  it('recreates script tags so injected widget JS actually runs', () => {
    const widget = readFileSync(join(process.cwd(), 'src', 'chat-widget.ts'), 'utf8')
    assert.match(widget, /appendHtmlWithScripts/)
    assert.match(widget, /createElement\('script'\)/)
    assert.doesNotMatch(
      widget,
      /insertAdjacentHTML\('beforeend',\s*html\)/,
    )
  })
})
