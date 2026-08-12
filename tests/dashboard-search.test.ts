/**
 * Dashboard search: unified customer + task search backing the /admin/panel search bar.
 *
 * These tests mix two flavors:
 *   - Source-scan invariants pinning the guarantees of the endpoint and the UI
 *     (patient search, min-length guard, no archive/completion filter, tenant scoping).
 *   - In-memory SQLite integration exercising the same SQL shapes the endpoint uses,
 *     to prove archived/completed records are still returned and that tenant scoping
 *     isolates rows across tenants.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'

const INDEX_SRC = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
const PANEL_SRC = readFileSync(join(process.cwd(), 'src', 'full-admin-panel.ts'), 'utf8')

function sliceEndpoint(): string {
  const idx = INDEX_SRC.indexOf("app.get('/api/dashboard-search'")
  assert.ok(idx > 0, 'expected /api/dashboard-search route in src/index.tsx')
  // Big enough window to cover the whole handler body.
  return INDEX_SRC.slice(idx, idx + 15_000)
}

describe('dashboard search endpoint — source invariants', () => {
  it('exposes /api/dashboard-search as a GET route', () => {
    assert.ok(INDEX_SRC.includes("app.get('/api/dashboard-search'"))
  })

  it('requires authentication before searching', () => {
    const slice = sliceEndpoint()
    assert.match(slice, /if \(!userInfo\.userId \|\| !userInfo\.roleId\)[\s\S]{0,120}Unauthorized/)
  })

  it('short-circuits when query is under 2 characters', () => {
    const slice = sliceEndpoint()
    assert.match(slice, /q\.length < 2/)
  })

  it('surfaces archived + completed customers but excludes completed/cancelled tasks', () => {
    const slice = sliceEndpoint()
    // Customers: no state filter — active/archived/completed all surface (routing
    // sends each to the state-appropriate page).
    assert.doesNotMatch(slice, /c\.is_archived\s*=\s*0/)
    assert.doesNotMatch(slice, /c\.is_completed\s*=\s*0/)
    // Tasks: enrollment marks tasks completed → they cease to exist for search.
    // The task WHERE must exclude 'completed' and 'cancelled'.
    assert.match(slice, /NOT IN\s*\(\s*'completed'\s*,\s*'cancelled'\s*\)/)
  })

  it('routes each result to its state-appropriate page', () => {
    const slice = sliceEndpoint()
    // Customer routing by state — list pages with q= + customerId= (same as task deep-links).
    assert.match(slice, /customerHrefFor\('archived'/)
    assert.match(slice, /customerHrefFor\('completed'/)
    assert.match(slice, /customerHrefFor\('active'/)
    assert.match(slice, /\/admin\/customers\/archived/)
    assert.match(slice, /\/admin\/customers\/completed/)
    assert.match(slice, /\/admin\/customers[^/]/)
    assert.match(slice, /customerId=\$\{cid\}/)
    // Task routing by follow-up flags: marketing-module admins → /admin/follow-ups
    // with the matching status filter; staff → their dedicated list pages.
    assert.match(slice, /\/admin\/follow-ups\?followupStatusFilter=archived/)
    assert.match(slice, /\/admin\/follow-ups\?followupStatusFilter=no_response/)
    assert.match(slice, /\/admin\/my-archived-tasks/)
    assert.match(slice, /\/admin\/my-no-response-tasks/)
  })

  it('applies role-based tenant scoping (roles 2/3 fixed to their tenant)', () => {
    const slice = sliceEndpoint()
    assert.match(slice, /roleNorm === 2 \|\| roleNorm === 3/)
    assert.match(slice, /c\.tenant_id = \?/)
    assert.match(slice, /t\.tenant_id = \?/)
  })

  it('scopes tasks to assigned user for staff roles 4/5/6', () => {
    const slice = sliceEndpoint()
    assert.match(slice, /roleNorm === 4 \|\| roleNorm === 5 \|\| roleNorm === 6/)
    assert.match(slice, /t\.assigned_user_id = \?/)
  })

  it('routes task result links to /admin/follow-ups for admins, /admin/my-tasks for staff', () => {
    const slice = sliceEndpoint()
    assert.match(slice, /\/admin\/follow-ups/)
    assert.match(slice, /\/admin\/my-tasks/)
    // Deep-link uses local 05… phone (via customerPhoneInputValue) + followupId.
    assert.match(slice, /customerPhoneInputValue\(phone\)/)
    assert.match(slice, /q=\$\{encodeURIComponent\(phoneQ\)\}/)
    assert.match(slice, /followupId=\$\{fid\}/)
    assert.doesNotMatch(slice, /highlightTask=/)
  })

  it('routes archived and completed customers to their own list pages (not /admin/customers)', () => {
    const slice = sliceEndpoint()
    assert.match(slice, /if \(state === 'archived'\) return withQs\('\/admin\/customers\/archived'\)/)
    assert.match(slice, /if \(state === 'completed'\) return withQs\('\/admin\/customers\/completed'\)/)
    assert.match(slice, /return withQs\('\/admin\/customers'\)/)
    assert.match(slice, /if \(archived\) \{[\s\S]{0,120}customerHrefFor\('archived'/)
    assert.match(slice, /else if \(completed\) \{[\s\S]{0,120}customerHrefFor\('completed'/)
    assert.match(slice, /customerPhoneInputValue\(phone\)/)
    assert.match(slice, /q=\$\{encodeURIComponent\(qVal\)\}/)
    assert.match(slice, /customerId=\$\{cid\}/)
    assert.doesNotMatch(slice, /highlightCustomer=/)
    assert.doesNotMatch(slice, /href = `\/admin\/customers\/\$\{r\.id\}`/)
  })

  it('normalizes task deep-link phones away from 966 before putting them in q', () => {
    function customerPhoneInputValue(rawPhone: string | null | undefined): string {
      const digits = String(rawPhone ?? '').trim().replace(/[^\d]/g, '')
      if (!digits) return ''
      if (digits.startsWith('00966')) return digits.slice(5)
      if (digits.startsWith('966')) return digits.slice(3)
      if (digits.startsWith('05') && digits.length === 10) return digits.slice(1)
      return digits
    }
    assert.equal(customerPhoneInputValue('966501234567'), '501234567')
    assert.equal(customerPhoneInputValue('0501234567'), '501234567')
    assert.equal(customerPhoneInputValue('501234567'), '501234567')
    // Destination search box uses display form 05…
    const local = customerPhoneInputValue('966501234567')
    const phoneQ = local && /^5\d{8}$/.test(local) ? `0${local}` : local
    assert.equal(phoneQ, '0501234567')
  })

  it('collapses 966… phone queries to the local core before LIKE (not just leading 0)', () => {
    const normIdx = INDEX_SRC.indexOf('function normalizeListSearchQuery')
    assert.ok(normIdx > 0, 'expected normalizeListSearchQuery')
    const normSlice = INDEX_SRC.slice(normIdx, normIdx + 900)
    assert.match(normSlice, /customerPhoneInputValue\(digitsOnly\)/)

    const slice = sliceEndpoint()
    // Dashboard search also expands phoneMatchVariants (same as follow-ups).
    assert.match(slice, /phoneMatchVariants/)
    assert.match(slice, /c\.phone IN \(/)
  })

  it('returns customerTotal + taskTotal so the UI can label result counts distinctly', () => {
    const slice = sliceEndpoint()
    assert.match(slice, /customerTotal/)
    assert.match(slice, /taskTotal/)
  })

  it('tags each result with a type so the row can render an "عميل" / "إعلان" badge', () => {
    const slice = sliceEndpoint()
    assert.match(slice, /typeLabel:\s*'عميل'/)
    // "إعلان" mirrors the sidebar label (/admin/my-tasks and /admin/follow-ups both read "الإعلانات").
    assert.match(slice, /typeLabel:\s*'إعلان'/)
  })
})

describe('panel search bar UI — source invariants', () => {
  it('renders the search bar and results container on /admin/panel', () => {
    assert.match(PANEL_SRC, /id="panelGlobalSearchForm"/)
    assert.match(PANEL_SRC, /id="panelGlobalSearchInput"/)
    assert.match(PANEL_SRC, /id="panelSearchResults"/)
    assert.match(PANEL_SRC, /id="panelSearchResultsList"/)
  })

  it('is patient: submits only on form submit, never on input keystrokes', () => {
    // The submit handler is where the search fires. An input listener exists only
    // to toggle the clear button visibility — it must NOT run a search.
    assert.match(PANEL_SRC, /form\.addEventListener\('submit'/)
    const inputListenerMatch = PANEL_SRC.match(/input\.addEventListener\('input',\s*([\s\S]{0,200}?)\)\s*;\s*\}/)
    assert.ok(inputListenerMatch, 'expected an input listener to toggle the clear button')
    assert.doesNotMatch(inputListenerMatch[1], /runSearch|fetch\(/)
  })

  it('marks the default panel content so it can be hidden while a search is active', () => {
    assert.match(PANEL_SRC, /data-panel-default="1"/)
    // Both the quick-access panel and the dashboard summary must be tagged so the
    // whole default view disappears when results are shown.
    assert.match(PANEL_SRC, /id="quickAccessPanel"\s+data-panel-default="1"/)
    assert.match(PANEL_SRC, /id="dashboard-section"[^>]*data-panel-default="1"/)
  })

  it('drives state from the URL so refresh preserves the search and Back exits it', () => {
    // Submitting a new search pushes history; paginating replaces it. This means
    // the browser Back button walks straight out of search rather than page-by-page.
    assert.match(PANEL_SRC, /history\.pushState\(\{ panelSearch: true/)
    assert.match(PANEL_SRC, /history\.replaceState\(\{ panelSearch: true/)
    assert.match(PANEL_SRC, /window\.addEventListener\('popstate'/)
    assert.match(PANEL_SRC, /URLSearchParams\(window\.location\.search\)/)
  })

  it('enforces the same 2-char minimum client-side', () => {
    assert.match(PANEL_SRC, /q\.length < 2/)
  })
})

// --- Integration: exercise the SQL shapes the endpoint uses ---
//
// These tests do not import the endpoint (it's an inline Hono handler), but they
// pin the intended behavior of its two core queries so a regression in the
// endpoint's SQL will surface as a mismatch here in code review.

function seedDb(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY,
      full_name TEXT,
      phone TEXT,
      email TEXT,
      national_id TEXT,
      tenant_id INTEGER,
      is_archived INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE company_contact_followups (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER,
      customer_name TEXT,
      customer_phone TEXT
    );
    CREATE TABLE company_contact_followup_tasks (
      id INTEGER PRIMARY KEY,
      followup_id INTEGER,
      tenant_id INTEGER,
      task_title TEXT,
      status TEXT,
      assigned_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
  return db
}

describe('dashboard search — SQL behavior', () => {
  it('returns archived and completed customers alongside active ones (global scope)', () => {
    const db = seedDb()
    db.prepare(`INSERT INTO customers (id, full_name, phone, tenant_id, is_archived, is_completed) VALUES
      (1, 'Ali Active', '966501111111', 7, 0, 0),
      (2, 'Ali Archived', '966502222222', 7, 1, 0),
      (3, 'Ali Completed', '966503333333', 7, 0, 1),
      (4, 'Ali Other Tenant', '966504444444', 9, 0, 0)`).run()

    // Same shape as the endpoint's customer WHERE clause for role 2:
    //   c.tenant_id = ? AND (name/phone/email/nid LIKE ?)
    const like = '%Ali%'
    const rows = db.prepare(`
      SELECT id, full_name, is_archived, is_completed FROM customers c
      WHERE c.tenant_id = ?
        AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR IFNULL(c.national_id, '') LIKE ?)
      ORDER BY id
    `).all(7, like, like, like, like) as { id: number; is_archived: number; is_completed: number }[]

    assert.equal(rows.length, 3, 'expected active + archived + completed for tenant 7')
    assert.deepEqual(rows.map(r => r.id), [1, 2, 3])
    // The row-level flags survive so the UI can render the status pill.
    assert.equal(rows[1].is_archived, 1)
    assert.equal(rows[2].is_completed, 1)
  })

  it('excludes completed / cancelled tasks but returns pending ones', () => {
    // Enrollment marks a task `completed`, at which point the task ceases to
    // exist for the user — global search must not surface it.
    const db = seedDb()
    db.prepare(`INSERT INTO company_contact_followups (id, tenant_id, customer_name, customer_phone) VALUES
      (1, 7, 'Sara Pending', '966510000001'),
      (2, 7, 'Sara Done', '966510000002'),
      (3, 7, 'Sara Cancelled', '966510000003')`).run()
    db.prepare(`INSERT INTO company_contact_followup_tasks (id, followup_id, tenant_id, task_title, status, assigned_user_id) VALUES
      (10, 1, 7, 'Call Sara', 'pending', 1),
      (11, 2, 7, 'Call Sara', 'completed', 1),
      (12, 3, 7, 'Call Sara', 'cancelled', 1)`).run()

    const like = '%Sara%'
    // Same shape as the endpoint's task WHERE clause, including the
    // completed/cancelled exclusion.
    const rows = db.prepare(`
      SELECT t.id, t.status FROM company_contact_followup_tasks t
      LEFT JOIN company_contact_followups f ON f.id = t.followup_id
      WHERE t.tenant_id = ?
        AND (IFNULL(t.task_title, '') LIKE ? OR IFNULL(f.customer_name, '') LIKE ? OR IFNULL(f.customer_phone, '') LIKE ?)
        AND (t.status IS NULL OR TRIM(t.status) = '' OR LOWER(TRIM(t.status)) NOT IN ('completed', 'cancelled'))
      ORDER BY t.id
    `).all(7, like, like, like) as { id: number; status: string }[]

    assert.deepEqual(rows.map(r => r.id), [10], 'only the pending task should surface')
  })

  it('tenant-isolates customers for role 2 (Ali Other Tenant is invisible)', () => {
    const db = seedDb()
    db.prepare(`INSERT INTO customers (id, full_name, tenant_id) VALUES
      (1, 'Ali T7', 7),
      (2, 'Ali T9', 9)`).run()
    const like = '%Ali%'
    const rowsT7 = db.prepare(
      `SELECT id FROM customers c WHERE c.tenant_id = ? AND c.full_name LIKE ?`
    ).all(7, like) as { id: number }[]
    assert.deepEqual(rowsT7.map(r => r.id), [1])
  })

  it('scopes tasks to the assigned user for staff (role 4/5/6)', () => {
    const db = seedDb()
    db.prepare(`INSERT INTO company_contact_followups (id, tenant_id, customer_name, customer_phone) VALUES
      (1, 7, 'Lead A', '9665111'), (2, 7, 'Lead B', '9665222')`).run()
    db.prepare(`INSERT INTO company_contact_followup_tasks (id, followup_id, tenant_id, task_title, status, assigned_user_id) VALUES
      (10, 1, 7, 'Call Lead', 'pending', 42),
      (11, 2, 7, 'Call Lead', 'pending', 99)`).run()
    const like = '%Lead%'
    const rows = db.prepare(`
      SELECT t.id FROM company_contact_followup_tasks t
      LEFT JOIN company_contact_followups f ON f.id = t.followup_id
      WHERE t.tenant_id = ? AND t.assigned_user_id = ?
        AND (IFNULL(t.task_title, '') LIKE ? OR IFNULL(f.customer_name, '') LIKE ? OR IFNULL(f.customer_phone, '') LIKE ?)
    `).all(7, 42, like, like, like) as { id: number }[]
    assert.deepEqual(rows.map(r => r.id), [10])
  })

  it('supports phone-fragment match (endpoint normalizes "0501…" → "501…" before LIKE)', () => {
    const db = seedDb()
    db.prepare(`INSERT INTO customers (id, full_name, phone, tenant_id) VALUES
      (1, 'Amal', '966501234567', 7)`).run()
    // normalizeListSearchQuery strips a leading 0 from all-digit input, so "0501234567"
    // becomes "501234567" — which matches the stored 966… number via LIKE.
    const like = '%501234567%'
    const rows = db.prepare(
      `SELECT id FROM customers c WHERE c.tenant_id = ? AND c.phone LIKE ?`
    ).all(7, like) as { id: number }[]
    assert.deepEqual(rows.map(r => r.id), [1])
  })

  it('normalizes 966… search to local core so it matches 05… / 5… / 966… storage', () => {
    // Mirror of normalizeListSearchQuery + customerPhoneInputValue (src/index.tsx).
    function customerPhoneInputValue(rawPhone: string | null | undefined): string {
      const digits = String(rawPhone ?? '').trim().replace(/[^\d]/g, '')
      if (!digits) return ''
      if (digits.startsWith('00966')) return digits.slice(5)
      if (digits.startsWith('966')) return digits.slice(3)
      if (digits.startsWith('05') && digits.length === 10) return digits.slice(1)
      return digits
    }
    function normalizeListSearchQuery(raw: string): string {
      const trimmed = String(raw ?? '').trim()
      if (!trimmed) return ''
      const compact = trimmed.replace(/[\s\-().+]/g, '')
      const digitsOnly = compact.replace(/^\+/, '')
      if (/^\d+$/.test(digitsOnly)) {
        const local = customerPhoneInputValue(digitsOnly)
        if (local && local.length >= 4) return local
        if (digitsOnly.startsWith('0')) return digitsOnly.replace(/^0+/, '') || trimmed
        return digitsOnly
      }
      return trimmed
    }

    // The reported miss: typing the full international form.
    assert.equal(normalizeListSearchQuery('966554154444'), '554154444')
    assert.equal(normalizeListSearchQuery('+966554154444'), '554154444')
    assert.equal(normalizeListSearchQuery('0554154444'), '554154444')
    assert.equal(normalizeListSearchQuery('554154444'), '554154444')

    const db = seedDb()
    // Mixed storage forms that all represent the same mobile.
    db.prepare(`INSERT INTO customers (id, full_name, phone, tenant_id) VALUES
      (1, 'Stored966', '966554154444', 2),
      (2, 'Stored05', '0554154444', 2),
      (3, 'StoredLocal', '554154444', 2),
      (4, 'OtherTenant', '966554154444', 9)`).run()

    const like = `%${normalizeListSearchQuery('966554154444')}%`
    const rows = db.prepare(
      `SELECT id FROM customers c WHERE c.tenant_id = ? AND c.phone LIKE ? ORDER BY id`
    ).all(2, like) as { id: number }[]
    assert.deepEqual(rows.map(r => r.id), [1, 2, 3])
  })
})
