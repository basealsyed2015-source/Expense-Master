import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SRC = readFileSync(join(ROOT, 'src', 'index.tsx'), 'utf8')
const HR_PAGES = readFileSync(join(ROOT, 'src', 'hr-pages.ts'), 'utf8')
const MIGRATION = readFileSync(join(ROOT, 'migrations', '0144_hr_employee_insurance_docs.sql'), 'utf8')

describe('my-profile medical insurance + GOSI documents', () => {
  it('adds insurance document columns on hr_employees', () => {
    assert.match(MIGRATION, /medical_insurance_document_url/i)
    assert.match(MIGRATION, /medical_insurance_expiry/i)
    assert.match(MIGRATION, /gosi_document_url/i)
    assert.match(MIGRATION, /gosi_document_expiry/i)
  })

  it('loads insurance fields from My Profile GET with migration fallback', () => {
    const idx = SRC.indexOf("app.get('/api/my-profile'")
    assert.ok(idx > 0)
    const slice = SRC.slice(idx, idx + 4_500)
    assert.match(slice, /medical_insurance_document_url/)
    assert.match(slice, /gosi_document_url/)
    assert.match(slice, /Migration 0144 not applied/)
  })

  it('saves insurance docs via PATCH without clearing the other document', () => {
    const idx = SRC.indexOf("app.patch('/api/my-profile'")
    assert.ok(idx > 0)
    const slice = SRC.slice(idx, idx + 12_000)
    assert.match(slice, /hasInsuranceFields/)
    assert.match(slice, /medical_insurance_document_url = \?/)
    assert.match(slice, /gosi_document_url = \?/)
    assert.match(slice, /Only update columns that were sent/)
  })

  it('renders insurance upload section on My Profile', () => {
    assert.match(SRC, /id="insuranceCard"/)
    assert.match(SRC, /id="medicalFile"/)
    assert.match(SRC, /id="gosiFile"/)
    assert.match(SRC, /submitInsuranceDoc/)
  })

  it('shows insurance columns on the HR documents page', () => {
    assert.match(HR_PAGES, /تأمين طبي/)
    assert.match(HR_PAGES, /تأمينات اجتماعية/)
    assert.match(HR_PAGES, /medical_insurance_document_url/)
    assert.match(HR_PAGES, /gosi_document_url/)
  })
})
