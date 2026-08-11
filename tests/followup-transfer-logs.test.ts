/**
 * No-response transfer log parsing / summary for card UI.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildTransferSummary,
  parseAutoTransferNote,
} from '../src/followup-transfer-logs.ts'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('followup transfer logs', () => {
  it('parses Arabic auto-transfer note text', () => {
    const p = parseAutoTransferNote(
      'تم تحويل المهمة تلقائياً من أحمد العتيبي إلى سارة المالكي بسبب عدم الرد خلال 48 ساعة',
    )
    assert.deepEqual(p, { from_name: 'أحمد العتيبي', to_name: 'سارة المالكي' })
  })

  it('builds chain from initial employee through later hops', () => {
    const summary = buildTransferSummary([
      { from_name: 'A', to_name: 'B', created_at: '2026-08-01 10:00:00' },
      { from_name: 'B', to_name: 'C', created_at: '2026-08-03 10:00:00' },
    ])
    assert.ok(summary)
    assert.equal(summary!.initial_name, 'A')
    assert.equal(summary!.latest_to_name, 'C')
    assert.equal(summary!.latest_at, '2026-08-03 10:00:00')
    assert.deepEqual(summary!.chain, ['A', 'B', 'C'])
  })

  it('migration 0145 allows auto_transfer note_type', () => {
    const sql = readFileSync(
      join(process.cwd(), 'migrations', '0145_task_notes_auto_transfer.sql'),
      'utf8',
    )
    assert.match(sql, /auto_transfer/)
    assert.match(sql, /employee_note',\s*'pass_note',\s*'auto_transfer'/)
  })

  it('my-tasks and follow-ups cards render transferLogHtml', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
    assert.match(src, /function transferLogHtml\(summary\)/)
    assert.match(src, /transferLogHtml\(task\.transfer_summary\)/)
    assert.match(src, /transferLogHtml\(row\.transfer_summary\)/)
    assert.match(src, /attachNoResponseTransferLogs/)
  })
})
