import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('contracts templates page performance', () => {
  it('does not eagerly load TinyMCE in the page head', () => {
    const page = readFileSync(
      join(process.cwd(), 'src', 'contracts-module-pages', 'generated', 'contractsTemplatesPage.ts'),
      'utf8'
    )
    const headEnd = page.indexOf('</head>')
    assert.ok(headEnd > 0)
    const head = page.slice(0, headEnd)
    assert.doesNotMatch(head, /tinymce\.min\.js/)
    assert.match(page, /loadTinyMceScript|data-tinymce-loader/)
  })

  it('lists contract templates without selecting body_content', () => {
    const api = readFileSync(join(process.cwd(), 'src', 'contracts-module-api.ts'), 'utf8')
    assert.match(api, /table === 'contract_templates'[\s\S]{0,200}template_name[\s\S]{0,200}stamp_url/)
    assert.match(api, /List cards never need full template HTML bodies/)
  })
})
