/**
 * External-URL affiliate links (hulool / wasla landing pages).
 *
 * These links have an `external_url` field pointing to the real landing page
 * domain. The admin list uses that URL for display and copy; the design button
 * is hidden. Submission routing and visit tracking use `path_segment` as usual
 * — `external_url` is purely a display/admin field and has no effect on how
 * incoming requests are resolved.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'

const TENANT = 300
const LINK_HULOOL = 10
const LINK_WASLA = 11
const LINK_REGULAR = 12

function seed(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE tenants (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      contact_assignment_mode TEXT DEFAULT 'auto',
      contact_assignment_branch_id INTEGER
    );
    CREATE TABLE tenant_contact_affiliate_links (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER NOT NULL,
      path_segment TEXT NOT NULL,
      label TEXT NOT NULL,
      assignment_mode TEXT DEFAULT 'auto',
      assignment_branch_id INTEGER,
      external_url TEXT
    );
    CREATE TABLE company_contact_followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_message TEXT NOT NULL,
      source_slug TEXT,
      affiliate_path_segment TEXT,
      affiliate_label TEXT,
      location_id INTEGER,
      custom_fields_data TEXT
    );
    CREATE TABLE tenant_contact_link_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      affiliate_link_id INTEGER NOT NULL,
      visited_at TEXT DEFAULT (datetime('now'))
    );
  `)
  db.prepare('INSERT INTO tenants (id, slug) VALUES (?, ?)').run(TENANT, 'hulool-mawad')
  db.prepare(`
    INSERT INTO tenant_contact_affiliate_links (id, tenant_id, path_segment, label, external_url)
    VALUES (?, ?, ?, ?, ?)
  `).run(LINK_HULOOL, TENANT, 'hulool-landing', 'موقع حلول الموعد', 'https://huloolmawad.com/')
  db.prepare(`
    INSERT INTO tenant_contact_affiliate_links (id, tenant_id, path_segment, label, external_url)
    VALUES (?, ?, ?, ?, ?)
  `).run(LINK_WASLA, TENANT, 'wasla-landing', 'موقع وصله', 'https://huloolwasla.com/')
  db.prepare(`
    INSERT INTO tenant_contact_affiliate_links (id, tenant_id, path_segment, label, external_url)
    VALUES (?, ?, ?, ?, ?)
  `).run(LINK_REGULAR, TENANT, 'regular-link', 'رابط عادي', null)
  return db
}

/** Mirrors the admin GET query that now includes external_url. */
function queryAdminList(db: Database.Database, tenantId: number) {
  return db
    .prepare(
      `SELECT id, tenant_id, path_segment, label,
              assignment_mode, external_url
       FROM tenant_contact_affiliate_links
       WHERE tenant_id = ?
       ORDER BY id ASC`
    )
    .all(tenantId) as {
      id: number
      tenant_id: number
      path_segment: string
      label: string
      assignment_mode: string
      external_url: string | null
    }[]
}

/** Mirrors the submission endpoint's affiliate path lookup (path_segment only). */
function resolveAffiliatePath(
  db: Database.Database,
  tenantId: number,
  pathSegment: string
): { id: number; path_segment: string; label: string } | undefined {
  return db
    .prepare(
      `SELECT id, path_segment, label
       FROM tenant_contact_affiliate_links
       WHERE tenant_id = ? AND path_segment = ?
       LIMIT 1`
    )
    .get(tenantId, pathSegment) as { id: number; path_segment: string; label: string } | undefined
}

describe('affiliate external_url field', () => {
  it('external links have external_url set; regular links have null', () => {
    const db = seed()
    const rows = queryAdminList(db, TENANT)
    const hulool = rows.find((r) => r.id === LINK_HULOOL)
    const wasla = rows.find((r) => r.id === LINK_WASLA)
    const regular = rows.find((r) => r.id === LINK_REGULAR)
    assert.equal(hulool?.external_url, 'https://huloolmawad.com/')
    assert.equal(wasla?.external_url, 'https://huloolwasla.com/')
    assert.equal(regular?.external_url, null)
  })

  it('admin list returns all three links for the tenant', () => {
    const db = seed()
    const rows = queryAdminList(db, TENANT)
    assert.equal(rows.length, 3)
  })

  it('external_url can be updated without affecting path_segment', () => {
    const db = seed()
    db.prepare('UPDATE tenant_contact_affiliate_links SET external_url = ? WHERE id = ?')
      .run('https://updated-domain.com/', LINK_HULOOL)
    const row = queryAdminList(db, TENANT).find((r) => r.id === LINK_HULOOL)
    assert.equal(row?.external_url, 'https://updated-domain.com/')
    assert.equal(row?.path_segment, 'hulool-landing', 'path_segment must not change')
  })

  it('contact submission resolves affiliate by path_segment regardless of external_url', () => {
    const db = seed()
    // Hulool landing page posts affiliate_path: 'hulool-landing'
    const affRow = resolveAffiliatePath(db, TENANT, 'hulool-landing')
    assert.ok(affRow, 'should resolve to a link row')
    assert.equal(affRow.id, LINK_HULOOL)
    assert.equal(affRow.label, 'موقع حلول الموعد')
  })

  it('wasla landing page submission resolves wasla-landing path', () => {
    const db = seed()
    const affRow = resolveAffiliatePath(db, TENANT, 'wasla-landing')
    assert.ok(affRow)
    assert.equal(affRow.id, LINK_WASLA)
    assert.equal(affRow.label, 'موقع وصله')
  })

  it('submission with a valid external-link path_segment inserts followup correctly', () => {
    const db = seed()
    const affRow = resolveAffiliatePath(db, TENANT, 'hulool-landing')!
    db.prepare(
      `INSERT INTO company_contact_followups
         (tenant_id, customer_name, customer_phone, customer_message, source_slug,
          affiliate_path_segment, affiliate_label)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(TENANT, 'Test User', '0512345678', 'تمويل شخصي', 'hulool-mawad', affRow.path_segment, affRow.label)
    const row = db
      .prepare('SELECT affiliate_path_segment, affiliate_label FROM company_contact_followups WHERE tenant_id = ?')
      .get(TENANT) as { affiliate_path_segment: string; affiliate_label: string }
    assert.equal(row.affiliate_path_segment, 'hulool-landing')
    assert.equal(row.affiliate_label, 'موقع حلول الموعد')
  })

  it('visit tracking records a hit against the affiliate link id (not external_url)', () => {
    const db = seed()
    db.prepare('INSERT INTO tenant_contact_link_visits (affiliate_link_id) VALUES (?)').run(LINK_HULOOL)
    const count = (
      db.prepare('SELECT COUNT(*) as c FROM tenant_contact_link_visits WHERE affiliate_link_id = ?')
        .get(LINK_HULOOL) as { c: number }
    ).c
    assert.equal(count, 1)
  })

  it('unknown path_segment returns no row (submission endpoint would reject it)', () => {
    const db = seed()
    const affRow = resolveAffiliatePath(db, TENANT, 'hulool-mawad/hulool-landing')
    assert.equal(affRow, undefined, 'slug-prefixed path must not resolve')
  })

  it('external_url column accepts null for a new link created without it', () => {
    const db = seed()
    db.prepare(
      `INSERT INTO tenant_contact_affiliate_links (id, tenant_id, path_segment, label)
       VALUES (99, ?, 'new-link', 'رابط جديد')`
    ).run(TENANT)
    const row = db
      .prepare('SELECT external_url FROM tenant_contact_affiliate_links WHERE id = 99')
      .get() as { external_url: string | null }
    assert.equal(row.external_url, null)
  })
})
