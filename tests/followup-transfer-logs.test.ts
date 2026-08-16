/**
 * No-response transfer log parsing / summary for card UI.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildTransferSummary,
  parseAutoTransferNote,
  type TransferHistoryEntry,
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

  it('transfer_count equals auto + accepted-pass entries', () => {
    const history: TransferHistoryEntry[] = [
      { kind: 'auto_no_response', from_name: 'A', to_name: 'B', at: '2026-08-01 06:00:00' },
      { kind: 'auto_no_response', from_name: 'B', to_name: 'C', at: '2026-08-03 06:00:00' },
      { kind: 'manual_pass', from_name: 'C', to_name: 'D', at: '2026-08-04 10:15:00', note: 'العميل ما رد' },
    ]
    assert.equal(history.length, 3)
    assert.equal(history.filter((e) => e.kind === 'auto_no_response').length, 2)
    assert.equal(history.filter((e) => e.kind === 'manual_pass').length, 1)
  })

  it('transfer history entries sort oldest-first', () => {
    const entries: TransferHistoryEntry[] = [
      { kind: 'manual_pass', from_name: 'C', to_name: 'D', at: '2026-08-04 10:15:00' },
      { kind: 'auto_no_response', from_name: 'A', to_name: 'B', at: '2026-08-01 06:00:00' },
      { kind: 'auto_no_response', from_name: 'B', to_name: 'C', at: '2026-08-03 06:00:00' },
    ]
    const sorted = [...entries].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
    assert.equal(sorted[0].from_name, 'A')
    assert.equal(sorted[1].from_name, 'B')
    assert.equal(sorted[2].from_name, 'C')
  })

  it('card UI uses transferHistoryButtonHtml instead of inline transferLogHtml in card renders', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
    // New shared helper must exist
    assert.match(src, /function transferHistoryButtonHtml/)
    assert.match(src, /function bindTransferHistoryPopovers/)
    // transferLogHtml still exists (used in expand panel row view)
    assert.match(src, /function transferLogHtml\(summary\)/)
    // transferLogHtml must NOT be called inline in follow-up card renders (row.transfer_summary pattern removed)
    assert.doesNotMatch(src, /transferLogHtml\(row\.transfer_summary\)/)
    // attachTransferHistory replaces the old function in the API layer
    assert.match(src, /attachTransferHistory/)
    assert.match(src, /attachNoResponseTransferLogs/)
  })

  it('my-tasks row layout colors the summary row by rating, not the expand panel', () => {
    const src = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
    const myTasksIdx = src.indexOf("app.get('/admin/my-tasks'")
    assert.ok(myTasksIdx > 0, 'my-tasks route must exist')
    const nextIdx = src.indexOf("app.get('/admin/my-no-response-tasks'", myTasksIdx)
    const slice = src.slice(myTasksIdx, nextIdx > myTasksIdx ? nextIdx : myTasksIdx + 25000)
    const rowsFnIdx = slice.indexOf('function renderTaskRows')
    assert.ok(rowsFnIdx > 0, 'renderTaskRows must exist')
    const rowsSlice = slice.slice(rowsFnIdx, rowsFnIdx + 8000)
    assert.match(rowsSlice, /ratingCfg\.rowBg/)
    assert.match(rowsSlice, /background-color:' \+ ratingCfg\.rowBg/)
    assert.match(rowsSlice, /id="expand-row-' \+ tid \+ '" class="hidden"/)
    assert.match(rowsSlice, /expand-row-[\s\S]{0,180}bg-slate-50/)
    assert.doesNotMatch(rowsSlice, /expand-row-[\s\S]{0,180}ratingCfg\.rowBg/)
    assert.match(slice, /rowBg: '#f0fdf4'/)
    assert.match(slice, /rowBg: '#f7fee7'/)
    assert.match(slice, /rowBg: '#fefce8'/)
    assert.match(slice, /rowBg: '#fff7ed'/)
    assert.match(slice, /rowBg: '#fef2f2'/)
  })
})
