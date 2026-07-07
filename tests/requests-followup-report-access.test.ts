import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  canAccessRequestsFollowupReport,
  isRequestsFollowupReportAdminPath,
  REQUESTS_FOLLOWUP_REPORT_ADMIN_PATH,
} from '../src/reports-access.ts'

describe('requests follow-up report access', () => {
  it('allows roles 1, 2, 3 (including legacy 11–13)', () => {
    for (const roleId of [1, 2, 3, 11, 12, 13]) {
      assert.equal(
        canAccessRequestsFollowupReport(roleId),
        true,
        `expected allow for role ${roleId}`
      )
    }
  })

  it('denies roles 4, 5, 6 (including legacy 14–15)', () => {
    for (const roleId of [4, 5, 6, 14, 15, null, undefined, '', 'x']) {
      assert.equal(
        canAccessRequestsFollowupReport(roleId),
        false,
        `expected deny for role ${String(roleId)}`
      )
    }
  })

  it('matches admin path prefix', () => {
    assert.equal(isRequestsFollowupReportAdminPath(REQUESTS_FOLLOWUP_REPORT_ADMIN_PATH), true)
    assert.equal(
      isRequestsFollowupReportAdminPath('/admin/reports/requests-followup/extra'),
      true
    )
    assert.equal(isRequestsFollowupReportAdminPath('/admin/reports/workflow'), false)
    assert.equal(isRequestsFollowupReportAdminPath('/admin/requests'), false)
  })
})
