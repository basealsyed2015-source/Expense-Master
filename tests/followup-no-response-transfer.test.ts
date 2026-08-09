/**
 * After 48h, a no-response follow-up is auto-transferred to the next agent.
 * The transferred task must remain a no-response task (not drop into the
 * regular my-tasks list), with a fresh 48h countdown for the new assignee.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const INDEX_SRC = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
const NOTIF_SRC = readFileSync(join(process.cwd(), 'src', 'notification-access.ts'), 'utf8')

describe('no-response auto-transfer — source invariants', () => {
  it('keeps is_no_response and resets the 48h clock instead of clearing the flag', () => {
    const fnStart = INDEX_SRC.indexOf('async function processNoResponseTransfers')
    assert.ok(fnStart >= 0, 'expected processNoResponseTransfers')
    const fnBody = INDEX_SRC.slice(fnStart, fnStart + 4500)

    assert.match(
      fnBody,
      /SET is_no_response = 1,\s*no_response_at = CURRENT_TIMESTAMP/,
      'transfer must keep the task as no-response with a fresh timer'
    )
    assert.doesNotMatch(
      fnBody,
      /SET is_no_response = 0,\s*no_response_at = NULL,\s*no_response_by = NULL/,
      'transfer must not clear the no-response flag'
    )
  })

  it('routes transfer-in notifications to the no-response tasks page', () => {
    const fnStart = NOTIF_SRC.indexOf('export async function insertFollowupNoResponseTransferNotification')
    assert.ok(fnStart >= 0, 'expected insertFollowupNoResponseTransferNotification')
    const fnBody = NOTIF_SRC.slice(fnStart, fnStart + 1200)

    assert.match(fnBody, /linkUrl = opts\.linkUrl \?\? '\/admin\/my-no-response-tasks'/)
    assert.doesNotMatch(fnBody, /\/admin\/my-tasks/)
  })
})
