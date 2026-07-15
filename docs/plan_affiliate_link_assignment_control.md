# Plan: Per-Affiliate-Link Employee Assignment Control

## Overview

Currently, when a customer submits via an affiliate/marketing link, a follow-up task is created and auto-assigned to employees via round-robin across **all** role-4 and role-14 staff (lines 33299–33356 in `src/index.tsx`). This plan adds a per-link control to restrict assignment to a specific pool of employees with optional per-employee caps.

---

## Role Reference

| Role ID | Label | Can appear as |
|---------|-------|---------------|
| 4 | موظف (Employee) | Employee only |
| 6 | وكيل مزدوج (Dual Agent) | Employee **or** Bank Agent **or both** — separate roster entries |
| 14 | وكيل بنك (Bank Agent) | Bank Agent only |

Role-6 users appear in **both** the employee picker and the bank agent picker. They can be added to a link's roster as:
- Employee only (one roster row, `role_context = 'employee'`)
- Bank agent only (one roster row, `role_context = 'bank_agent'`)
- Both (two roster rows with independent limits/counts)

Each roster row counts as **1 customer** per submission — adding role-6 as both does not double-count a single submission; it just means they appear in two pools and can receive customers via either context.

---

## Database Changes (2 migrations)

### Migration 0117 — Add assignment mode + unassigned counter to affiliate links

```sql
ALTER TABLE tenant_contact_affiliate_links
  ADD COLUMN assignment_mode TEXT NOT NULL DEFAULT 'auto';

ALTER TABLE tenant_contact_affiliate_links
  ADD COLUMN unassigned_limit_count INTEGER NOT NULL DEFAULT 0;
```

- `assignment_mode`: `'auto'` (default, existing behaviour) | `'custom'`
- `unassigned_limit_count`: increments each time a submission arrives but no employee has capacity

### Migration 0118 — Per-link employee assignment roster

```sql
CREATE TABLE affiliate_link_employee_assignments (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  affiliate_link_id  INTEGER NOT NULL,
  user_id            INTEGER NOT NULL,
  role_context       TEXT NOT NULL,             -- 'employee' | 'bank_agent'
  assignment_limit   INTEGER NULL,              -- NULL = unlimited; integer = max via this link in this context
  assigned_count     INTEGER NOT NULL DEFAULT 0,
  created_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (affiliate_link_id, user_id, role_context),
  FOREIGN KEY (affiliate_link_id)
    REFERENCES tenant_contact_affiliate_links(id) ON DELETE CASCADE
);
```

- `role_context`: `'employee'` or `'bank_agent'`
  - Role-4 users: always `'employee'`
  - Role-14 users: always `'bank_agent'`
  - Role-6 users: whichever context they were added from; can have both
- `UNIQUE (affiliate_link_id, user_id, role_context)` — allows role-6 to hold two rows (one per context) but prevents duplicates
- `assignment_limit NULL` → unlimited slots via this link in this context
- `assigned_count` tracks customers assigned to this user **via this link in this context**
- Deleting a roster row does not retroactively change already-assigned tasks

---

## API Changes

### 1. `GET /api/tenant-contact-affiliates/:id/assignment-config`

Returns:
```json
{
  "assignment_mode": "custom",
  "unassigned_limit_count": 3,
  "roster": [
    { "id": 1, "user_id": 12, "name": "Ahmed", "role_id": 4, "role_context": "employee",   "assignment_limit": 10, "assigned_count": 4 },
    { "id": 2, "user_id": 17, "name": "Sara",  "role_id": 14, "role_context": "bank_agent", "assignment_limit": null, "assigned_count": 2 },
    { "id": 3, "user_id": 9,  "name": "Khalid","role_id": 6,  "role_context": "employee",   "assignment_limit": 5,  "assigned_count": 1 },
    { "id": 4, "user_id": 9,  "name": "Khalid","role_id": 6,  "role_context": "bank_agent", "assignment_limit": 5,  "assigned_count": 0 }
  ]
}
```

Also returns `available_employees` (role 4 + 6) and `available_bank_agents` (role 14 + 6) for populating the pickers:
```json
{
  "available_employees":   [{ "user_id": 12, "name": "Ahmed", "role_id": 4 }, ...],
  "available_bank_agents": [{ "user_id": 17, "name": "Sara",  "role_id": 14 }, { "user_id": 9, "name": "Khalid", "role_id": 6 }, ...]
}
```

### 2. `PUT /api/tenant-contact-affiliates/:id/assignment-config`

Body:
```json
{
  "assignment_mode": "custom",
  "roster": [
    { "user_id": 12, "role_context": "employee",   "assignment_limit": 10 },
    { "user_id": 17, "role_context": "bank_agent",  "assignment_limit": null },
    { "user_id": 9,  "role_context": "employee",   "assignment_limit": 5 },
    { "user_id": 9,  "role_context": "bank_agent",  "assignment_limit": 5 }
  ]
}
```

- Upserts `affiliate_link_employee_assignments` rows (by `affiliate_link_id + user_id + role_context`)
- Deletes rows for (user_id, role_context) pairs removed from the roster
- Does **not** reset `assigned_count` when a row is re-added
- Does **not** reset `unassigned_limit_count`
- Validates:
  - Role-4 users may only use `role_context = 'employee'`
  - Role-14 users may only use `role_context = 'bank_agent'`
  - Role-6 users may use either or both contexts
  - All users belong to the same tenant

### 3. `POST /api/tenant-contact-affiliates/:id/reset-unassigned-count`

- Sets `unassigned_limit_count = 0` on the link row
- No body required
- Requires admin auth (same as other affiliate link endpoints)

### 4. `GET /api/tenant-contact-affiliates/:id/unassigned-customers`

- Returns `company_contact_followups` joined with `company_contact_followup_tasks` where `assigned_user_id IS NULL` and `affiliate_path_segment = link's path_segment`
- Used to populate the unassigned customers popup

---

## Submission Logic Changes

**File:** `src/index.tsx`, lines 33299–33356 (inside `POST /api/public/:slug/contact-submissions`)

Current flow:
1. Fetch all active role 4/14 staff for tenant
2. Round-robin pick using `tenant_followup_auto_assign_state`
3. Assign task

New flow — check `affiliate_link.assignment_mode` first:

### If `assignment_mode = 'auto'` (or no affiliate link)
→ Existing logic unchanged

### If `assignment_mode = 'custom'`

1. Fetch all roster rows for this link from `affiliate_link_employee_assignments`, joined with `users` to confirm `is_active = 1`
2. Filter to **eligible** rows: `assignment_limit IS NULL OR assigned_count < assignment_limit`
3. If **no eligible rows**:
   - Increment `unassigned_limit_count` on the link row
   - Create task with `assigned_user_id = NULL`
   - Do NOT update auto-assign cursor
4. If **eligible rows exist**:
   - Sort eligible rows by `id` ASC
   - Pick the row with the lowest `id` that is **after** the `id` of the last assignment made on this link (wrap around to first if none found after)
   - Assign task to that row's `user_id`
   - Increment `assigned_count` on that roster row by 1

> **Note on role-6 dual context:** If a role-6 user appears in the roster twice (as employee and as bank agent), both rows participate in the round-robin pool independently. A submission selects one row; only that row's `assigned_count` increments. A single submission never assigns the same customer to the same person twice.

> **Note on cursor:** The round-robin cursor is implicit — sort eligible roster rows by `id` ASC, track last-picked roster `id` on a new column `last_picked_roster_id` on `tenant_contact_affiliate_links` (added in migration 0117).

### `assigned_count` lifecycle

- Increments by 1 each time a customer is assigned via this roster row
- Does **not** decrement on manual reassignment or task completion (future hook)
- Acts as a permanent cap: the limit is how many customers this person can receive via this link in this role context

---

## UI Changes — Below Mobile Preview in Design Panel

**File:** `src/index.tsx`, inside the `designPanelHtml(id)` function (around line 35627)

The phone frame and preview sit on the right side of the split panel. Below the phone frame, add an **Assignment Control** card.

### Layout

```
┌──────────────────────────────────────────────┐
│  📱 Mobile Preview (existing)                │
│  [phone frame, 280×520]                      │
│                                              │
├──────────────────────────────────────────────┤
│  توزيع المهام                                │
│                                              │
│  ○ تلقائي (الافتراضي)   ● مخصص              │
│                                              │
│  ── موظفون ──────────────────────────────    │
│  [+ إضافة موظف ▼]   (role 4 + role 6)       │
│                                              │
│  ┌─ Ahmed  [موظف] ──────────────────────┐    │
│  │ ○ غير محدود  ● محدود: [10]          │    │
│  │ مُعيَّن: 4 / 10  [✕]                 │    │
│  └──────────────────────────────────────┘    │
│  ┌─ Khalid  [وكيل مزدوج] ───────────────┐   │
│  │ ● غير محدود  ○ محدود                │    │
│  │ مُعيَّن: 1  [✕]                      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ── وكلاء البنك ─────────────────────────    │
│  [+ إضافة وكيل ▼]   (role 14 + role 6)      │
│                                              │
│  ┌─ Sara  [وكيل بنك] ───────────────────┐   │
│  │ ● غير محدود  ○ محدود                │    │
│  │ مُعيَّن: 2  [✕]                      │    │
│  └──────────────────────────────────────┘    │
│  ┌─ Khalid  [وكيل مزدوج] ───────────────┐   │  ← same person, different context
│  │ ○ غير محدود  ● محدود: [5]           │    │
│  │ مُعيَّن: 0 / 5  [✕]                  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  [if unassigned_limit_count > 0:]            │
│  ⚠ 3 عملاء بدون تعيين  [عرض]  [إعادة ضبط]  │
│                                              │
│  [حفظ إعدادات التوزيع]                       │
└──────────────────────────────────────────────┘
```

### Behaviour Details

- **Toggle**: radio buttons (auto / custom); switching to auto hides both roster sections
- **Two sections**: "موظفون" (Employees, role 4 + 6) and "وكلاء البنك" (Bank Agents, role 14 + 6)
- **Role-6 in both pickers**: a dual agent appears in both dropdowns; selecting from the employee picker creates `role_context = 'employee'`, selecting from bank agent picker creates `role_context = 'bank_agent'`; they can be selected from both, appearing as two separate cards (one per section) with independent limits
- **Badge on role-6 cards**: `[وكيل مزدوج]` shown in the card header to distinguish from pure employees/agents
- **Limit control**: "غير محدود" / "محدود" toggle per card; number input shown when limited; minimum 1
- **Assigned counter**: read-only `مُعيَّن: X` or `مُعيَّن: X / limit` shown below the limit controls
- **Remove button `[✕]`**: removes that specific (user_id, role_context) row from the roster
- **Unassigned warning**: `⚠ X عملاء بدون تعيين` shown when `unassigned_limit_count > 0`
  - `[عرض]` button opens the unassigned customers popup
  - `[إعادة ضبط]` button calls `POST /reset-unassigned-count` and hides the warning
- **Save button**: calls `PUT /api/tenant-contact-affiliates/:id/assignment-config` with full roster

### Unassigned Customers Popup

Modal triggered by `[عرض]`:

- Title: `العملاء غير المُعيَّنين — [link label]`
- Table: Customer name | Phone | Date submitted | Message (truncated)
- Data from `GET /api/tenant-contact-affiliates/:id/unassigned-customers`
- Each row has a quick-assign dropdown (all active role 4/6/14 staff) for manual assignment
- **Future scope (noted, not built now):** links filter on the main Customers and Requests pages

### Link List Badge (outer page)

On the affiliate links list, add a small badge per link when `unassigned_limit_count > 0`:

```
رابط التسويق #1  [custom: 3 في الروستر]  ⚠ 3 غير مُعيَّنين
```

---

## Files to Change

| File | Change |
|------|--------|
| `migrations/0117_affiliate_link_assignment_mode.sql` | New columns on affiliate links table + `last_picked_roster_id` |
| `migrations/0118_affiliate_link_employee_assignments.sql` | New roster table with `role_context` |
| `src/index.tsx` | 4 API endpoints + submission logic + UI |

---

## Resolved Decisions

| # | Question | Answer |
|---|----------|--------|
| 1 | Role-6 dual agents — appear once or twice? | **Twice if added in both contexts.** Each context is an independent roster row with its own limit/count. Selecting from the employee picker = `role_context='employee'`; from bank agent picker = `role_context='bank_agent'` |
| 2 | Role-6 — count as 1 or 2 per submission? | **1 per roster row.** A submission picks one row; only that row's count increments. The same person cannot receive the same customer twice |
| 3 | `assigned_count` reset? | **No automatic reset.** Decrements only when the follow-up is marked complete (future hook) |
| 4 | Unassigned counter reset? | **Yes — `[إعادة ضبط]` button** calls `POST /reset-unassigned-count` |
| 5 | Unassigned tasks — actionable? | **Yes — popup list** with quick-assign per row |
| 6 | Future scope | Links filter on Customers and Requests pages — **noted, not in this scope** |
