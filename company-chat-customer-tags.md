# Company Chat — Customer Tagging (Agreed Design)

Decisions from design discussion. Not an implementation spec.

## Purpose

- Tag customers in company chat so colleagues can reference a specific customer in a message.
- Users find customers by **name or phone**, not by remembering **customer ID**.
- **Duplicate names** are resolved in the picker (e.g. name + phone), not by asking users to type IDs.

## Tag input

- User composes a normal message; to tag a customer they type **`@`**, search by **name or phone**, and **pick a row** from a dropdown.
- The composer shows a **chip** (display name). The user does **not** type customer ID or URL.
- On send, the server receives **message text** plus **`customer_ids`** (numeric IDs from the picker). The picker is the source of truth, not free-text `@Name` parsing alone.

## Customer search for the picker

- Chat uses a **dedicated, lightweight search API** (e.g. `GET /api/chat/customers/search?q=…&limit=15`) that runs **on the server** as the user types.
- This is **not** the same mechanism as the customers module list search (which loads a full list and filters in the browser).
- Search fields align with the customers module intent: **name and phone** (with disambiguation fields in results as needed).
- Result set is **small** (typeahead), not the full customer table.

## RBAC

- Reuse **`canUserAccessCustomer`** as the single access rule for tagging and opening profiles.
- **Role 4 (employee):** access via **`customer_assignments`** (assigned customers).
- **Role 5 (bank agent):** access via **bank-agent assignment** on the customer and/or financing request (`isBankAgentAssignedToCustomer` semantics).
- **Tag picker / send:** users only see and can only tag customers they are allowed to access.
- **Roles 2/3:** tenant-scoped customer access (as today for customer pages).

## Hyperlinks in messages

- Tags are shown **per viewer** when loading history (and after a live message is resolved from the API):
  - **`can_link: true`** → link to **`/admin/customers/{id}`** (only if the viewer passes **`canUserAccessCustomer`**).
  - **`can_link: false`** → plain text chip with **display name only**; **`customer_id` is omitted** from the API response so the UI does not expose the ID or a clickable URL.
- Opening a customer page still enforces **`canUserAccessCustomer`** (403 if someone guesses a URL).
- **WebSocket** broadcasts raw tags (shared payload); the client **re-fetches** that message from `GET .../messages` so each participant gets their own `can_link` / `customer_id` shape. This adds a small HTTP round-trip on live messages with tags, not RBAC work on the WebSocket itself.

## What this does and does not hide

- **Protected:** customer profile data; customer ID in the tag UI for viewers without access.
- **Still visible:** the **customer display name** on the tag (by design, so the message stays readable).

## Stored data (conceptual)

- Persist **`customer_id`** per tag on the message (not the display name as the identifier).
- Optional **display name snapshot** at send time for stable rendering if names change later (product choice).

## Out of scope for this document

- Broadcast channel tagging, shared vs chat-only search path naming, and migration shape were discussed as options but not fixed as requirements here.
