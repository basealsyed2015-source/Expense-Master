# Plan: Link Stats Page (`/admin/link-stats`)

## Decision: One page for all links (not per-link pages)

A single page with a **link selector** (main company link + every affiliate link), not dedicated pages per link.

Why:
- Admins compare links against each other; separate pages make comparison painful.
- Reuses one route, one API, one set of components.
- Deep-linking still works: `/admin/link-stats?link=facebook` (or `?link=company`) selects a link on load, so each link effectively *has* its own shareable URL without a separate page.
- Bonus: an "All links" overview mode that shows a comparison table across links, then click a row to drill into that link.

## Access

- Roles 1 (super admin, with tenant picker like `/admin/contact-affiliates`) and 2 (company admin). Role 3 (supervisor) read-only optional.
- Entry point: a "الإحصائيات" button on `/admin/contact-affiliates` (page header + per-link row action).

---

## Data / Backend

### 1. Visit tracking (new)

Visits are not currently recorded. Add a lightweight counter table:

```sql
-- migrations/0120_contact_link_visits.sql
CREATE TABLE IF NOT EXISTS contact_link_visits (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id    INTEGER NOT NULL,
  -- NULL = main company link; otherwise tenant_contact_affiliate_links.id
  affiliate_link_id INTEGER NULL,
  visit_date   TEXT NOT NULL,          -- YYYY-MM-DD
  visit_count  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (tenant_id, affiliate_link_id, visit_date)
);
```

- One row per link per day, incremented with `INSERT ... ON CONFLICT ... DO UPDATE SET visit_count = visit_count + 1`.
- Increment happens in the **public contact page GET handler** (the `/{slug}` and `/{slug}/{path}` render routes) — these are only served to non-logged-in visitors, so no auth filtering needed. Refreshes count again by design (user confirmed raw counts are fine).
- Daily aggregation keeps the table tiny (links × days rows) while still allowing a visits-over-time chart. No per-visit rows, no IP/UA storage.

### 2. Stats API (new)

`GET /api/link-stats?link=company|<id>&tenant_id=<n?>&from=<date?>&to=<date?>`

Returns one JSON payload (single round trip):

- **visits**: total + per-day array (for the chart) within range.
- **submissions**: total followups for the link (`company_contact_followups` filtered by `affiliate_path_segment` — `NULL` for company).
- **enrolled / not enrolled**: a followup counts as *enrolled* when a `customers` row exists in the tenant with the same normalized phone (`customer_phone`). Two lists returned (name, phone, date, assigned user), plus counts. This is a phone-match heuristic — documented in the UI with a small info tooltip.
- **per-user counts**: for each user who received followup tasks from this link (`company_contact_followup_tasks.assigned_user_id` joined via followups), return: tasks received from this link, enrolled among them, current active-incomplete customer total (same query already used by the assignment-config API), and assignment limit if the user is on the link roster.
- **misc**: unassigned count, conversion rate (enrolled ÷ submissions), visit→submission rate (submissions ÷ visits), first/last submission date.
- **overview mode** (`link=all`): one row per link with visits, submissions, enrolled, conversion — powers the comparison table.

Auth mirrors the assignment-config endpoints (roles 1/2, tenant scoping).

---

## Page Layout (top to bottom)

RTL Arabic, Tailwind, same visual language as `/admin/contact-affiliates` (amber accents, `rounded-xl` white cards on gray background, FontAwesome icons).

### 1. Header bar
- Title "إحصائيات الروابط" + back link to روابط التواصل.
- **Link selector**: pill-style dropdown listing "كل الروابط" / "الرابط الرئيسي" / each affiliate label. Super admin also gets the tenant dropdown.
- **Date range picker**: presets (7 يوم / 30 يوم / 90 يوم / الكل). Default 30 days.

### 2. KPI cards row (4–5 compact cards)
Grid of small stat cards — number large and bold, label small and gray, icon in a tinted circle:
- الزيارات (visits)
- الطلبات المستلمة (submissions)
- العملاء المسجّلون (enrolled)
- نسبة التحويل (conversion %, submissions → enrolled)
- بدون تعيين (unassigned, red tint when > 0)

### 3. Visits chart (one, lightweight)
- Single bar/line chart of visits per day with submissions overlaid. Use **Chart.js via CDN** (already the pattern used elsewhere in the admin) — no build changes.
- Keep it to exactly one chart; everything else is tables. Charts multiply token/UI cost fast and tables answer the actual questions.

### 4. Per-user distribution table
Columns: الموظف (name + role badge like the roster cards) | المهام من هذا الرابط | المسجّلون منهم | العملاء النشطون حالياً | الحد (limit or "غير محدود").
- Sorted by tasks received desc. Row highlight when the user is at/over their limit.

### 5. Customers panel — tabbed table
Tabs: "المسجّلون" / "غير المسجّلين" (with counts in the tab labels).
Columns: الاسم | الجوال | تاريخ الطلب | المعيَّن له | الحالة.
- Not-enrolled rows get a subtle amber background and a quick action linking to the followup card in `/admin/follow-ups`.
- Client-side search box (name/phone) + pagination at 25 rows.

### 6. Overview mode (when "كل الروابط" selected)
Replaces sections 3–5 with one comparison table: الرابط | الزيارات | الطلبات | المسجّلون | التحويل % | بدون تعيين — each row clickable to drill into that link.

## Answer to "table vs complex design"

**Hybrid, weighted toward tables**: KPI cards for at-a-glance numbers, one chart for the visits trend, plain tables for everything else. A dashboard full of charts looks impressive but is slower to read for "who has how many customers" questions; tables with good sorting answer those directly. This matches the existing admin aesthetic and keeps the page cheap to build and maintain.

---

## Implementation checklist

| # | Item | Where |
|---|------|-------|
| 1 | Migration `0120_contact_link_visits.sql` | `migrations/` |
| 2 | Visit increment in public contact page GET routes | `src/index.tsx` (~38400 render handlers) |
| 3 | `GET /api/link-stats` | `src/index.tsx` near affiliate APIs (~33800) |
| 4 | Page route `GET /admin/link-stats` + sidebar/allow-list entries | `src/index.tsx` (route allow-lists ~3560, ~2130 in `full-admin-panel.ts`) |
| 5 | Stats button on `/admin/contact-affiliates` | header + row actions |

Estimated size: 1 migration, 1 API handler, 1 page (HTML + inline script, same style as contact-affiliates page).
