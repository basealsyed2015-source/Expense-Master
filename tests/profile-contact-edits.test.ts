import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const SRC = readFileSync(join(ROOT, 'src', 'index.tsx'), 'utf8')
const USERS_PAGE = readFileSync(join(ROOT, 'src', 'users-management-page.ts'), 'utf8')
const MIGRATION = readFileSync(join(ROOT, 'migrations', '0143_users_secondary_email.sql'), 'utf8')

describe('profile contact edits and secondary email', () => {
  it('adds the nullable secondary_email users column', () => {
    assert.match(MIGRATION, /ALTER TABLE users ADD COLUMN secondary_email TEXT/i)
  })

  it('returns the logged-in account contact details from My Profile', () => {
    const idx = SRC.indexOf("app.get('/api/my-profile'")
    assert.ok(idx > 0)
    const slice = SRC.slice(idx, idx + 3_500)
    assert.match(slice, /SELECT id, full_name, email, phone, secondary_email FROM users/)
    assert.match(slice, /account:\s*\{[\s\S]*secondary_email: user\.secondary_email/)
  })

  it('validates and saves self-service contact edits, including HR synchronization', () => {
    const idx = SRC.indexOf("app.patch('/api/my-profile'")
    assert.ok(idx > 0)
    const slice = SRC.slice(idx, idx + 8_000)
    assert.match(slice, /hasContactFields/)
    assert.match(slice, /LOWER\(TRIM\(email\)\) = \? AND id != \?/)
    assert.match(slice, /secondaryEmail === email/)
    assert.match(slice, /UPDATE users SET email = \?, phone = \?, secondary_email = \?/)
    assert.match(slice, /UPDATE hr_employees SET email = \?, phone = \?/)
  })

  it('renders contact inputs for the user and a read-only secondary email for admins', () => {
    assert.match(SRC, /id="profileSecondaryEmail"/)
    assert.match(SRC, /secondary_email: secondaryEmail/)
    assert.match(USERS_PAGE, /id="editUserSecondaryEmail" readonly/)
    assert.doesNotMatch(USERS_PAGE, /name="secondary_email"/)
  })

  it('keeps administrative user updates from accepting secondary_email', () => {
    const firstUpdate = SRC.indexOf("app.put('/api/users/:id'")
    assert.ok(firstUpdate > 0)
    const slice = SRC.slice(firstUpdate, firstUpdate + 6_000)
    assert.doesNotMatch(slice, /SET[^`]*secondary_email\s*=/)
  })
})
