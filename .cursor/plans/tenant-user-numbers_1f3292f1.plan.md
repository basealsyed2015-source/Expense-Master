---
name: tenant-record-numbers
overview: Introduce permanent, tenant-local chronological serial numbers for users and customers while retaining global database IDs for authentication, routes, and foreign keys. Backfill each tenant from 1, update tenant-facing displays, and make user/bank tenant assignment immutable so numbers never need to move.
todos:
  - id: tenant-immutable
    content: Remove bank-agent tenant-shifting triggers, resolve any orphan role-5 users, and enforce immutability of users.tenant_id and banks.tenant_id.
    status: pending
  - id: schema
    content: Add tenant-local user and customer serial-number columns, backfill per tenant from 1, and create partial unique indexes.
    status: pending
  - id: allocation
    content: Assign the next tenant-local serial number in a single INSERT statement for every user and customer creation path, resolving tenant_id up front for bank agents.
    status: pending
  - id: display
    content: Switch tenant-facing user and customer list/detail/export/filter displays to local serial numbers while keeping global IDs in URLs, hidden form values, DOM ids, and API payloads.
    status: pending
  - id: verify
    content: Add coverage, run targeted tests, build, and lint.
    status: pending
isProject: false
---

# Tenant-local user and customer serial numbers

## Design
- `users.id` and `customers.id` remain internal global primary keys; they are referenced by authentication tokens, routes, permissions, assignments, requests, contracts, and foreign keys, and never change.
- Add `users.tenant_user_number` and `customers.tenant_customer_number` as permanent tenant-facing serials.
  - Backfill every tenant from 1 upward in chronological `created_at, id` order; `id` is only a deterministic tie-breaker.
  - Enforce partial unique indexes on `(tenant_id, tenant_user_number)` and `(tenant_id, tenant_customer_number)` (`WHERE tenant_id IS NOT NULL AND ..._number IS NOT NULL`).
  - Numbers are permanent: never reused after deletion, never renumbered on archive/completion/sort/filter.
  - SaaS super-admins without a tenant retain no tenant-local number and display as `—`.
- A user's tenant is permanent. So is a bank's tenant. This is the invariant that makes serial numbers stable and eliminates the "user follows bank" propagation surface entirely.

## Tenant immutability (prerequisite)
- Drop the three triggers introduced in `migrations/0079_backfill_role5_tenant_id.sql`:
  - `trg_users_role5_set_tenant_ins`
  - `trg_users_role5_set_tenant_upd`
  - `trg_banks_propagate_tenant`
- Add replacement triggers that reject cross-tenant reassignment:
  - `BEFORE UPDATE OF tenant_id ON users` — raise when `OLD.tenant_id IS NOT NULL AND NEW.tenant_id IS NOT OLD.tenant_id`.
  - `BEFORE UPDATE OF tenant_id ON banks` — same rule.
- Preflight before enforcement: confirm no role-5 user has `users.tenant_id` differing from its `banks.tenant_id`; confirm no role-5 user has `NULL tenant_id` while its assigned bank sits in a real tenant. Resolve any such rows (set the user's tenant_id from the bank once, in this migration) before the immutability trigger is created.
- Any code path that today inserts a role-5 user with `tenant_id=NULL` relying on the old insert trigger must be updated to resolve `tenant_id` from the assigned bank *before* INSERT, so the tenant-local serial can be allocated in the same statement.

## Changes
- New additive migration `migrations/0129_tenant_local_numbers.sql`:
  1. Drop the three 0079 triggers.
  2. One-time cleanup: for any role-5 user with `NULL tenant_id` but a bank in a real tenant, set `users.tenant_id` from `banks.tenant_id`.
  3. Add columns `users.tenant_user_number INTEGER` and `customers.tenant_customer_number INTEGER`.
  4. Backfill per tenant using `ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id)`.
  5. Validate: every row with a non-null `tenant_id` has a non-null number; no duplicates per tenant.
  6. Create partial unique indexes.
  7. Install the two `BEFORE UPDATE OF tenant_id` immutability triggers on `users` and `banks`.
- Update user and customer creation paths in [src/index.tsx](C:/Users/Kyo/OneDrive/Desktop/Zat%20code/Expense-Cloudflare/Expense-Master/src/index.tsx) so each INSERT allocates the next serial atomically in a single statement:
  ```sql
  INSERT INTO users (..., tenant_id, tenant_user_number)
  SELECT ..., ?, COALESCE(MAX(tenant_user_number), 0) + 1
  FROM users WHERE tenant_id = ?
  ```
  Retry on the (extremely unlikely) unique-index collision. For role-5 creation, resolve `tenant_id` from the assigned bank before the INSERT.
- Replace visible ID output with `tenant_user_number` in the main users table, detail page, CSV export, bank-agent filter labels/tooltips, and HR employee-code display in [src/index.tsx](C:/Users/Kyo/OneDrive/Desktop/Zat%20code/Expense-Cloudflare/Expense-Master/src/index.tsx). Show `—` where a super-admin has no tenant-local number.
- Replace visible customer ID output with `tenant_customer_number` in customer tables, detail pages, CSV exports, and user-facing labels. Do not change customer ID values submitted to customer, request, or contract APIs.
- Keep global `user.id` / `customer.id` in hidden form values, URLs, API payloads, and DOM element IDs needed for operations. Do not substitute them into chat, workflow, assignments, or foreign-key values.
- Update [src/users-management-page.ts](C:/Users/Kyo/OneDrive/Desktop/Zat%20code/Expense-Cloudflare/Expense-Master/src/users-management-page.ts) and [src/full-admin-panel.ts](C:/Users/Kyo/OneDrive/Desktop/Zat%20code/Expense-Cloudflare/Expense-Master/src/full-admin-panel.ts) (not the `.backup.ts` sibling) to show the stable tenant number rather than their current unstable list index.

## Out of scope
- Financing-request serial numbers (not currently displayed).
- Any change to `users.id` / `customers.id` semantics or the `/api/*/:id` route shape.

## Verification
- API tests proving:
  - existing tenant users and customers are numbered consecutively from 1;
  - a newly created record receives the next number in its own tenant;
  - another tenant starts at 1;
  - deletion does not reuse or renumber values;
  - global IDs still drive edit/delete/permission operations;
  - an attempt to update `users.tenant_id` to a different non-null tenant fails;
  - an attempt to update `banks.tenant_id` to a different non-null tenant fails.
- Before applying the production migration, read-only preflight:
  - each tenant's user/customer count matches its backfilled serial count;
  - no duplicate or null tenant serial for rows with non-null `tenant_id`;
  - no role-5 user whose `tenant_id` conflicts with its bank's `tenant_id`.
  Apply only after those pass, then re-run them.
- Run affected tests, full type/build validation, and lint diagnostics for changed files.
- Apply the migration to the target database only when you explicitly request deployment; no commit will be created without your permission.
