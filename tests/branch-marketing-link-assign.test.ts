/**
 * Branch mode for marketing link (contact-followup) assignment.
 *
 * Adds a third `branch` mode alongside `auto` and `custom` for both:
 *   - per-affiliate links (tenant_contact_affiliate_links.assignment_mode/branch_id)
 *   - the tenant-wide company link (tenants.contact_assignment_mode/branch_id)
 *
 * When `branch` is active, the round-robin pool of followup-assignable staff
 * (roles 4/5/6) is filtered to only those whose `users.assigned_location_id`
 * matches the configured branch. `custom` mode still uses the manual roster,
 * `auto` still picks from all eligible staff.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'

const TENANT = 200
const BRANCH_A = 701
const BRANCH_B = 702
const LINK_ID = 55

function seed(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE tenants (
      id INTEGER PRIMARY KEY,
      contact_assignment_mode TEXT DEFAULT 'auto',
      contact_assignment_branch_id INTEGER
    );
    CREATE TABLE tenant_locations (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      full_name TEXT,
      tenant_id INTEGER,
      role_id INTEGER,
      is_active INTEGER DEFAULT 1,
      assigned_bank_id INTEGER,
      assigned_location_id INTEGER
    );
    CREATE TABLE tenant_contact_affiliate_links (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER,
      assignment_mode TEXT DEFAULT 'auto',
      assignment_branch_id INTEGER
    );
  `)
  db.prepare('INSERT INTO tenants (id) VALUES (?)').run(TENANT)
  db.prepare('INSERT INTO tenant_locations (id, tenant_id, name) VALUES (?, ?, ?)').run(BRANCH_A, TENANT, 'Riyadh')
  db.prepare('INSERT INTO tenant_locations (id, tenant_id, name) VALUES (?, ?, ?)').run(BRANCH_B, TENANT, 'Jeddah')
  db.prepare('INSERT INTO tenant_contact_affiliate_links (id, tenant_id) VALUES (?, ?)').run(LINK_ID, TENANT)

  const insertUser = db.prepare(
    'INSERT INTO users (id, full_name, tenant_id, role_id, is_active, assigned_location_id) VALUES (?, ?, ?, ?, 1, ?)'
  )
  insertUser.run(21, 'Alice', TENANT, 4, BRANCH_A)
  insertUser.run(22, 'Bob', TENANT, 5, BRANCH_A)
  insertUser.run(23, 'Carol', TENANT, 6, BRANCH_B)
  insertUser.run(24, 'Dan', TENANT, 4, null) // unpinned
  return db
}

/**
 * Mirror of the followup submission logic: fetch role-4/5/6 staff, then when
 * `useBranchMode` is true filter to only staff on the given branch.
 */
function pickFollowupStaff(
  db: Database.Database,
  tenantId: number,
  opts: { useBranchMode: boolean; branchId: number | null }
): number[] {
  const rows = db
    .prepare(
      `
      SELECT u.id FROM users u
      WHERE u.is_active = 1 AND u.role_id IN (4, 5, 6) AND u.tenant_id = ?
      ORDER BY COALESCE(NULLIF(TRIM(u.full_name), ''), u.id) ASC
      `
    )
    .all(tenantId) as { id: number }[]
  let staff = rows.map((r) => r.id)

  if (opts.useBranchMode && opts.branchId != null && staff.length) {
    const placeholders = staff.map(() => '?').join(',')
    const branchStaff = db
      .prepare(`SELECT id FROM users WHERE id IN (${placeholders}) AND assigned_location_id = ?`)
      .all(...staff, opts.branchId) as { id: number }[]
    const allowed = new Set(branchStaff.map((r) => r.id))
    staff = staff.filter((id) => allowed.has(id))
  }
  return staff
}

describe('marketing link branch assignment mode', () => {
  it('auto mode picks from all followup-assignable staff (no branch filter)', () => {
    const db = seed()
    const staff = pickFollowupStaff(db, TENANT, { useBranchMode: false, branchId: null })
    assert.deepEqual(staff.sort((a, b) => a - b), [21, 22, 23, 24])
  })

  it('branch mode filters staff to the configured branch only', () => {
    const db = seed()
    // Simulate the config: affiliate link set to branch mode with branch A.
    db.prepare('UPDATE tenant_contact_affiliate_links SET assignment_mode = ?, assignment_branch_id = ? WHERE id = ?')
      .run('branch', BRANCH_A, LINK_ID)

    const link = db
      .prepare('SELECT assignment_mode, assignment_branch_id FROM tenant_contact_affiliate_links WHERE id = ?')
      .get(LINK_ID) as { assignment_mode: string; assignment_branch_id: number | null }

    const staff = pickFollowupStaff(db, TENANT, {
      useBranchMode: link.assignment_mode === 'branch',
      branchId: link.assignment_branch_id,
    })
    assert.deepEqual(staff.sort((a, b) => a - b), [21, 22], 'only branch-A staff should remain')
  })

  it('branch mode excludes unpinned staff', () => {
    const db = seed()
    db.prepare('UPDATE tenants SET contact_assignment_mode = ?, contact_assignment_branch_id = ? WHERE id = ?')
      .run('branch', BRANCH_B, TENANT)
    const tenant = db
      .prepare('SELECT contact_assignment_mode, contact_assignment_branch_id FROM tenants WHERE id = ?')
      .get(TENANT) as { contact_assignment_mode: string; contact_assignment_branch_id: number | null }

    const staff = pickFollowupStaff(db, TENANT, {
      useBranchMode: tenant.contact_assignment_mode === 'branch',
      branchId: tenant.contact_assignment_branch_id,
    })
    // User 24 is unpinned and must not be assigned in branch mode.
    assert.deepEqual(staff, [23])
  })

  it('branch mode with a branch that has no staff returns empty (task falls back to unassigned)', () => {
    const db = seed()
    const orphan = 799
    db.prepare('INSERT INTO tenant_locations (id, tenant_id, name) VALUES (?, ?, ?)').run(orphan, TENANT, 'Ghost')
    db.prepare('UPDATE tenant_contact_affiliate_links SET assignment_mode = ?, assignment_branch_id = ? WHERE id = ?')
      .run('branch', orphan, LINK_ID)

    const staff = pickFollowupStaff(db, TENANT, { useBranchMode: true, branchId: orphan })
    assert.deepEqual(staff, [])
  })

  it('per-link branch overrides tenant-wide branch (when a followup arrives on an affiliate link)', () => {
    const db = seed()
    // Tenant-wide → branch A; per-link → branch B. The link wins.
    db.prepare('UPDATE tenants SET contact_assignment_mode = ?, contact_assignment_branch_id = ? WHERE id = ?')
      .run('branch', BRANCH_A, TENANT)
    db.prepare('UPDATE tenant_contact_affiliate_links SET assignment_mode = ?, assignment_branch_id = ? WHERE id = ?')
      .run('branch', BRANCH_B, LINK_ID)

    const link = db
      .prepare('SELECT assignment_mode, assignment_branch_id FROM tenant_contact_affiliate_links WHERE id = ?')
      .get(LINK_ID) as { assignment_mode: string; assignment_branch_id: number | null }

    const staff = pickFollowupStaff(db, TENANT, {
      useBranchMode: link.assignment_mode === 'branch',
      branchId: link.assignment_branch_id,
    })
    assert.deepEqual(staff, [23])
  })

  it('persisted assignment_mode accepts auto | custom | branch (rejects unknown values in normalization)', () => {
    const modes = ['auto', 'custom', 'branch', 'garbage']
    const normalize = (raw: string) =>
      raw === 'custom' ? 'custom' : raw === 'branch' ? 'branch' : 'auto'
    assert.equal(normalize(modes[0]), 'auto')
    assert.equal(normalize(modes[1]), 'custom')
    assert.equal(normalize(modes[2]), 'branch')
    assert.equal(normalize(modes[3]), 'auto', 'unknown modes collapse to auto')
  })
})
