/**
 * Verifies that the inline <script> blocks emitted by the chat widget and
 * chat page are syntactically valid JavaScript.  These functions return plain
 * HTML strings; TypeScript is NOT compiled out of template-literal content, so
 * any TS type annotations accidentally left inside (e.g. Promise<void>,
 * querySelectorAll<T>, `as any`) would silently produce broken browser JS
 * while the build still succeeds.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { renderChatWidget } from '../src/chat-widget.ts'
import { chatPage } from '../src/chat-page.ts'

function extractScripts(html: string): string[] {
  const results: string[] = []
  const re = /<script(?:\s[^>]*)?>([^<]*(?:<(?!\/script>)[^<]*)*)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const body = m[1].trim()
    if (body) results.push(body)
  }
  return results
}

function assertValidJs(source: string, label: string) {
  try {
    new vm.Script(source)
  } catch (e: any) {
    assert.fail(`${label}: script block has a syntax error — ${e.message}`)
  }
}

describe('chat HTML script-block syntax', () => {
  it('renderChatWidget emits valid JS (no stray TS annotations)', () => {
    const html = renderChatWidget(1, 2)
    const scripts = extractScripts(html)
    assert.ok(scripts.length > 0, 'expected at least one <script> block in widget HTML')
    for (const src of scripts) {
      assertValidJs(src, 'chat-widget')
    }
  })

  it('chatPage emits valid JS (no stray TS annotations)', () => {
    const html = chatPage({ userId: 1, tenantId: 10, roleId: 4 })
    const scripts = extractScripts(html)
    assert.ok(scripts.length > 0, 'expected at least one <script> block in chat page HTML')
    for (const src of scripts) {
      assertValidJs(src, 'chat-page')
    }
  })

  it('renderChatWidget script does not contain TypeScript syntax', () => {
    const html = renderChatWidget(1, 2)
    // These patterns are valid TS but invalid browser JS
    const tsPatterns: [RegExp, string][] = [
      [/:\s*Promise</, 'return type annotation :Promise<'],
      [/querySelectorAll<[A-Z]/, 'generic querySelectorAll<T>'],
      [/as\s+any\b/, 'type cast `as any`'],
      [/\|\s*null(?=\s*[=;,\)])/, 'union type `| null`'],
    ]
    for (const [pattern, desc] of tsPatterns) {
      const scripts = extractScripts(html).join('\n')
      assert.ok(!pattern.test(scripts), `widget script contains TS syntax: ${desc}`)
    }
  })
})
