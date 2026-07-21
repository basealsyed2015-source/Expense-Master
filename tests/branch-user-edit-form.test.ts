/**
 * Verifies that the /admin/users/:id/edit form and its POST handler wire up
 * the new `assigned_location_id` branch field end-to-end (source-level).
 *
 * These are structural checks against src/index.tsx — they catch regressions
 * where the form field is removed, the POST handler stops reading the field,
 * or the UPDATE query drops the column.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')

describe('user edit form — branch field', () => {
  it('renders a tenant_locations dropdown on the edit form', () => {
    const idx = SRC.indexOf("app.get('/admin/users/:id/edit'")
    assert.ok(idx > 0, 'edit route must exist')
    const slice = SRC.slice(idx, idx + 20_000)
    assert.match(slice, /SELECT id, name FROM tenant_locations WHERE tenant_id = \? AND is_active = 1/)
    assert.match(slice, /name="assigned_location_id"/)
  })

  it('POST /admin/users/:id parses and persists assigned_location_id', () => {
    const idx = SRC.indexOf("app.post('/admin/users/:id'")
    assert.ok(idx > 0, 'edit POST route must exist')
    const slice = SRC.slice(idx, idx + 20_000)
    assert.match(slice, /formData\.get\('assigned_location_id'\)/)
    assert.match(slice, /assigned_location_id = \?/)
  })
})

describe('marketing link assignment — branch mode surfaces in API', () => {
  it('GET config returns assignment_branch_id and branches list', () => {
    const idx = SRC.indexOf("'/api/tenant-contact-affiliates/:id/assignment-config'")
    assert.ok(idx > 0)
    const slice = SRC.slice(idx, idx + 6_000)
    assert.match(slice, /assignment_branch_id/)
    assert.match(slice, /branches: branchRows/)
  })

  it('PUT config validates branch and branch-exclusion modes and requires a branch id', () => {
    const putIdx = SRC.indexOf("app.put('/api/tenant-contact-affiliates/:id/assignment-config'")
    assert.ok(putIdx > 0)
    const slice = SRC.slice(putIdx, putIdx + 6_000)
    assert.match(slice, /\['custom', 'custom_excl', 'branch', 'branch_excl'\]\.includes\(rawMode\)/)
    assert.match(slice, /mode === 'branch' \|\| mode === 'branch_excl'/)
    assert.match(slice, /يجب اختيار فرع/)
    assert.match(slice, /UPDATE tenant_contact_affiliate_links SET assignment_mode = \?, assignment_branch_id = \?/)
  })

  it('tenant-wide PUT config accepts branch and exclusion modes too', () => {
    const putIdx = SRC.indexOf("app.put('/api/tenant-contact-main-assignment-config'")
    assert.ok(putIdx > 0)
    const slice = SRC.slice(putIdx, putIdx + 6_000)
    assert.match(slice, /\['custom', 'custom_excl', 'branch', 'branch_excl'\]\.includes\(rawMode\)/)
    assert.match(slice, /mode === 'custom' \|\| mode === 'custom_excl' \|\| mode === 'branch_excl'/)
    assert.match(slice, /UPDATE tenants SET contact_assignment_mode = \?, contact_assignment_branch_id = \?/)
  })

  it('followup submission auto-branch pool is filtered by users.assigned_location_id', () => {
    const marker = 'useBranchMode'
    const idx = SRC.indexOf(marker)
    assert.ok(idx > 0, 'branch-mode filter block must exist in followup submission')
    const slice = SRC.slice(idx, idx + 2_000)
    assert.match(slice, /assigned_location_id = \?/)
  })

  it('followup submission removes roster members in exclusion modes', () => {
    const marker = 'useExclusionRoster'
    const idx = SRC.indexOf(marker)
    assert.ok(idx > 0, 'exclusion-mode pool block must exist in followup submission')
    const slice = SRC.slice(idx, idx + 2_500)
    assert.match(slice, /activeAssignmentMode === 'custom_excl'/)
    assert.match(slice, /activeAssignmentMode === 'branch_excl'/)
    assert.match(slice, /staff = staff\.filter\(\(user\) => !excludedUserIds\.has\(user\.id\)\)/)
  })
})
