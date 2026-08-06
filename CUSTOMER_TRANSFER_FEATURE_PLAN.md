# Customer Transfer Feature — Implementation Plan

Status: **Not started.** Requirements locked in via chat on 2026-08-05. This doc is the single source of truth for picking the work back up.

---

## 1. What we're building

A "Transfer Customer" action in the customer actions dropdown (on `/admin/customers` and related list views) that lets a role 4 (employee) or role 5 (bank agent) hand off *their own* assignment on a customer to another user in the same tenant. The recipient must approve. Modeled closely on the existing **task transfer** feature in `/admin/my-tasks`.

Reference implementation (task transfer) — study these before coding:
- UI + client JS: `src/index.tsx` lines ~39523–40447
- API endpoints: `src/index.tsx` lines ~39218–39519
- Notification helper: `src/notification-access.ts` lines ~415–478 (`insertTaskPassNotification`)
- Existing supervisor reassignment (role 2, direct edit — the "similar to" reference): customer edit form at `/admin/customers/:id/edit`, updates `customer_assignments` and `customers.assigned_bank_agent_id` directly with no approval.

---

## 2. Scope decisions (locked)

| Question | Decision |
|---|---|
| Who can initiate? | Roles 4, 5, and 6 only. Role 2 keeps using the customer edit form (direct, no approval). |
| What gets transferred? | Only the initiator's own assignment role. Role 4 → employee assignment. Role 5 → bank agent assignment. |
| Role 6 rules | Role 6 can transfer either their employee assignment OR their bank agent assignment on a given customer. **If they hold BOTH roles on the same customer**, block the transfer entirely (for now). |
| Recipient pool | Same tenant. Employee-side transfer → role 4 or 6. Bank-agent-side transfer → role 5 or 6. Exclude self from dropdown. |
| Approval required? | Yes. Recipient must accept. Same request/accept/reject/cancel state machine as task transfer. |
| Related tasks | Ignored. Task-to-customer conversion is treated as "task complete" — tasks don't follow the customer. |
| Financing requests | **No block.** Bank-agent accept must sync `financing_requests.assigned_bank_agent_id` (reuse `syncFinancingRequestsBankAgentForCustomer` — role 2 already does this on customer edit). Employee accept doesn't touch FR rows (role 4 FR access flows through `customer_assignments` on the customer). Known handoff gaps — unread notifications/alarms on old user, `financing_requests.created_by` unchanged — are acceptable, not corruption. |
| Concurrent transfers | Only one pending transfer per customer *per assignment type* (employee vs bank agent) at a time. |
| Note requirement | Mandatory note from sender (same as task transfer). Store as `note_text` column directly on the transfer request row — no separate notes table. |
| Recipient UI | **Notification popup only.** No dedicated "incoming transfers" tab/page (tasks have this; customers won't). When recipient clicks the notification, a popup opens showing the request details + Accept / Reject buttons. |

---

## 3. Data model

### New table: `customer_transfer_requests`

```sql
CREATE TABLE customer_transfer_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('employee', 'bank_agent')),
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  note_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);

CREATE INDEX idx_ctr_customer_status ON customer_transfer_requests(customer_id, assignment_type, status);
CREATE INDEX idx_ctr_to_user ON customer_transfer_requests(to_user_id, status);
```

**Uniqueness rule** (enforced in API, not schema): at most one row per `(customer_id, assignment_type)` with `status = 'pending'`.

### Tables touched on accept
- `customer_assignments` — for employee-side transfers, delete the old `(customer_id, from_user_id)` row and insert `(customer_id, to_user_id)`.
- `customers.assigned_bank_agent_id` — for bank-agent-side transfers, set to `to_user_id`, then call `syncFinancingRequestsBankAgentForCustomer(customer_id)` to propagate to `financing_requests.assigned_bank_agent_id`. Without this sync, role 5 workflow access checks (which read `fr.assigned_bank_agent_id` directly) would leave the old agent still owning the FR — a real ownership split.

### Notifications
Reuse the existing `notifications` + `customer_alarms` pattern from `insertTaskPassNotification`. New categories:
- `customer_transfer_request` — sent to recipient when request is created
- `customer_transfer_response` — sent to sender on accept/reject

`linkUrl` for the recipient notification should encode the transfer request ID so the popup can open when clicked, e.g. `/admin/customers?customer_transfer=<request_id>`. The client reads this query param on load and pops the modal.

---

## 4. API endpoints (new)

All under existing admin auth middleware, tenant-scoped.

### `POST /api/customers/:customerId/transfer`
Create a transfer request.

Body: `{ to_user_id: number, note_text: string, assignment_type: 'employee' | 'bank_agent' }`

Validation (in order — fail fast, return specific error codes):
1. Customer exists and is in caller's tenant.
2. Caller's role is 4, 5, or 6.
3. `assignment_type` matches caller's actual assignment on this customer:
   - `employee`: caller must be in `customer_assignments` for this customer. Caller must be role 4 or 6.
   - `bank_agent`: `customers.assigned_bank_agent_id === caller.id`. Caller must be role 5 or 6.
4. **Role 6 both-roles block**: if caller is role 6 AND is assigned as BOTH employee (in `customer_assignments`) AND bank agent (`assigned_bank_agent_id`) on this customer → reject with clear error.
5. `to_user_id !== caller.id`.
7. Recipient exists, same tenant, correct role for the assignment type (employee → role 4/6; bank_agent → role 5/6).
8. No existing `pending` transfer for `(customer_id, assignment_type)`.
9. `note_text` non-empty after trim.

On success: insert row, call notification helper, return `{ id, status: 'pending' }`.

### `PATCH /api/customer-transfers/:id`
Body: `{ action: 'accept' | 'reject' | 'cancel' }`

- `accept` / `reject` — only `to_user_id` can call. Must be `pending`.
- `cancel` — only `from_user_id` can call. Must be `pending`.
- On `accept`:
  - Employee type: `DELETE FROM customer_assignments WHERE customer_id=? AND employee_id=from_user_id` then `INSERT` with `to_user_id`.
  - Bank agent type: `UPDATE customers SET assigned_bank_agent_id = to_user_id WHERE id = ?` then call `syncFinancingRequestsBankAgentForCustomer(customer_id)` to propagate the change to `financing_requests.assigned_bank_agent_id` (same helper role 2's customer edit uses).
  - Update row: `status='accepted'`, `resolved_at=NOW()`.
  - Notify sender (`customer_transfer_response`, success).
- On `reject`: set status, notify sender (info/warning).
- On `cancel`: set status, no notification needed (sender took the action).

Wrap the accept path in a DB transaction — assignment mutation + status update must be atomic.

### `GET /api/customer-transfers/:id`
For the popup to fetch full details when the recipient clicks the notification: customer name, sender name, note_text, assignment_type, created_at, status. Reject if caller is neither `from_user_id` nor `to_user_id`.

### No `GET /incoming` endpoint
Unlike task transfer, we don't need a list endpoint — there's no tab. The notification carries the ID; the popup fetches by ID.

---

## 5. UI changes

### 5.1 Actions dropdown (customer list)
File: check where the customer list row actions dropdown is rendered (search for `actions-dropdown-btn` in customer table row markup in `src/index.tsx`).

Add one item **conditionally**:
- Label: "تمرير العميل" (Transfer Customer)
- Visible only if caller role ∈ {4, 5, 6}
- Visible only if caller currently holds an assignment on this customer that matches their role
- Hidden if role 6 holds both assignments on this customer

Clicking opens the transfer modal (client-side).

### 5.2 Transfer modal (sender side)
Fields:
- **Assignment type** — auto-selected. If caller is role 4 → employee. Role 5 → bank_agent. Role 6 → whichever single role they hold on this customer (should always be exactly one after the both-roles filter).
- **Recipient dropdown** — fetch from a new endpoint `GET /api/customer-transfer-candidates?customer_id=X&assignment_type=Y` that returns tenant users with the right roles, excluding self. (Or reuse `/api/my-tenant-followup-staff` if it fits — check its filtering; may need a new one.)
- **Note textarea** — required, mirror the styling of task transfer's note modal.
- Submit → `POST /api/customers/:id/transfer`.

### 5.3 Recipient popup
Triggered by:
- User clicks a notification whose `linkUrl` includes `?customer_transfer=<id>`, landing on `/admin/customers`.
- On page load, client JS checks the query param, fetches `GET /api/customer-transfers/:id`, renders modal.

Modal shows: customer name, sender name, assignment type ("سيتم نقل تعيينك كموظف / كوكيل بنك"), the note, and two buttons: **Accept** / **Reject**. Both call `PATCH /api/customer-transfers/:id`. On success, close modal and refresh the customer list.

Also handle: the notification link is stale (already resolved / cancelled) — show a friendly "This transfer request is no longer pending" message instead of the action buttons.

---

## 6. Role rules — quick reference

| Caller role | On customer | Can transfer? | Transfers what |
|---|---|---|---|
| 4 | Assigned as employee | Yes | Employee assignment |
| 4 | Not assigned | No | — |
| 5 | `assigned_bank_agent_id = self` | Yes | Bank agent assignment |
| 5 | Not the bank agent | No | — |
| 6 | Only employee-assigned | Yes | Employee assignment |
| 6 | Only bank-agent-assigned | Yes | Bank agent assignment |
| 6 | **Both** on same customer | **No** (blocked for now) | — |
| 6 | Neither | No | — |
| 2 | Any | Uses edit form directly (not this feature) | — |

Recipient eligibility:
- Employee-side transfer → recipient role ∈ {4, 6}, same tenant, not self.
- Bank-agent-side transfer → recipient role ∈ {5, 6}, same tenant, not self.

---

## 7. Complexity vs. task transfer

Task transfer took ~1000 LOC of client JS + ~300 LOC of API. Customer transfer will be roughly **60–70%** of that scale because:
- No tab UI, no incoming list — just popup.
- No rating/no-response/archive modals piggybacking on the same page.
- Only 3 endpoints vs. 4+.
- But: more validation branches (role + assignment_type matrix), and mutation is split across two tables depending on type.

Estimated: 400–600 LOC across `src/index.tsx` + a small addition to `src/notification-access.ts`. One DB migration file for the new table.

---

## 8. Order of implementation

1. Migration for `customer_transfer_requests` table.
2. Notification helper: add `insertCustomerTransferNotification()` in `src/notification-access.ts` — copy `insertTaskPassNotification` and adapt categories/titles/linkUrl.
3. Backend endpoints (POST, PATCH, GET, candidates). Test each with curl before touching UI.
4. Actions dropdown item + sender modal.
5. Recipient popup + query-param trigger.
6. Manual end-to-end test: role 4 → role 6 employee transfer, role 5 → role 5 bank agent transfer, role 6 both-roles block, FR-blocked case, self-recipient rejection, double-pending rejection.

---

## 9. Open items / future work

- Sender-side visual: pending-transfer badge on the customer row with a cancel button (v2 scope per user).
- Consider a "transfers" tab later if volume grows and popup-only becomes annoying. Not needed for v1.
- Optional handoff polish: reassign unread notifications/customer_alarms from old user to new user on accept, and update `financing_requests.created_by` if we want full ownership handoff. Not needed for v1.
- Audit log entry on accept? Not requested — skip for now.

---

## 10. Files likely to change

- `src/index.tsx` — new endpoints, actions dropdown item, sender modal, recipient popup, query-param handler on `/admin/customers`.
- `src/notification-access.ts` — new notification helper.
- New migration SQL file (check the existing migrations folder for the pattern — look for where `company_contact_followup_task_pass_requests` was created).
- Possibly `src/actions-dropdown.ts` — no changes expected; the dropdown machinery is generic and reads markup only.
