# Service contract templates (tenants 2 & 3)

Reference for the four **عقد تقديم خدمات وحلول** document-mode templates: how they are stored, rendered, paginated, printed, and migrated.

---

## Overview

| Item | Value |
|------|--------|
| Database | D1 `tamweel-production-v2` |
| Table | `contract_templates` |
| Tenants | **2** (حلول) and **3** (حلول الموعد) |
| Template count | **4** (2 companies × 2 tenants) |
| `render_mode` | **`document`** (body HTML drives contract view) |
| Expected output | **2 pages**: portrait contract + signatures, then portrait سند لأمر (top half only) |

### Production row IDs (as of mid-2026)

| id | tenant_id | template_name |
|----|-----------|---------------|
| 6 | 2 | عقد تقديم خدمات وحلول - مكتب حلول الموعد |
| 7 | 2 | عقد تقديم خدمات وحلول - شركة وصله |
| 8 | 3 | عقد تقديم خدمات وحلول - مكتب حلول الموعد |
| 9 | 3 | عقد تقديم خدمات وحلول - شركة وصله |

IDs can differ on fresh clones; match by **`tenant_id` + `template_name`**.

---

## The two companies

### مكتب حلول الموعد للخدمات العامة

- CR **3350179573**
- Phone **920012979**
- Article 4 includes **`{{finance_type}}`** and **`{{property_description}}`** (real-estate wording)
- Promissory note payee: مكتب حلول الموعد للخدمات العامة

### شركة وصله للخدمات العقارية والتحصيل

- CR **1010805234**
- Phone **0112225256**
- Article 4 uses **`{{finance_type}}`** and **`{{finance_amount}}`** only (no property description)
- Promissory note payee: شركة وصله للخدمات العقارية والتحصيل

Tenant 3 rows were **copied from tenant 2** (`migrations/0092_seed_service_templates_tenant3.sql`) and then updated by the same migration chain. Tenant 3 Waslah was restored twice after browser-translate corruption (`0097`, `0098`).

---

## Document structure (HTML)

Production bodies are wrapped by migration **0102**:

```html
<div class="tpl-doc-font" style="font-size:9px;line-height:1.6">
  … contract clauses …
  … signature block …
  <div class="tpl-page-break tpl-page-break--portrait-half" style="page-break-before:always;"></div>
  <div class="tpl-note-section" style="font-size:20px;line-height:1.6">
    <p class="tpl-note-title" style="text-align:center;font-weight:800;font-size:28px;">سند لأمر</p>
    … promissory note text …
    الاســـم: {{party_two_name}}    التوقيع:
  </div>
</div>
```

### Font sizes

| Region | Size | Mechanism |
|--------|------|-----------|
| Contract body (clauses + signatures) | **9px** | Outer `.tpl-doc-font` wrapper (`0102`) |
| سند لأمر body | **20px** | `.tpl-note-section` inline style (`0116`) |
| سند لأمر title | **28px** | `.tpl-note-title` inline `font-size:28px` (`0116`) |

Template editor **حجم خط المستند** (`templates.html`) reads/writes `.tpl-doc-font` and persists through save. Note section sizes are in the HTML marker, not the dropdown.

### Signature block (current layout)

RTL document: **party one on the right**, party two on the left.

Per column (top → bottom):

1. **`.tpl-sig-label`** — `الطرف الأول` / `الطرف الثاني`
2. **`.tpl-sig-name`** — company name or `{{party_two_name}}`
3. **`.tpl-sig-field`** — inline row: label (`الختم:` / `التوقيع:`) + **`.tpl-sig-space`**

Classes:

- `.tpl-sig-col--party-one` / `.tpl-sig-col--party-two` — used by stamp injection and layout CSS

### Page-break markers

| Class | Role |
|-------|------|
| `.tpl-page-break` | Consumed by paginator; starts a new sheet (not rendered) |
| `.tpl-page-break--landscape` | Same, but next sheet uses **landscape** A4 |
| `.tpl-page-break--portrait-half` | Same, but next sheet is **portrait**; inner content scaled to top half so letterhead footer lands at page midpoint |
| `.tpl-note-section` | Wrapper for سند لأمر; kept as a single atomic block during pagination |
| `.tpl-note-title` | Centered bold title; kept as atomic block during pagination |

**Do not** put `page-break-before` on `.tpl-sig-row` — break is only **after** signatures via `.tpl-page-break`.

---

## Template variables

Shared placeholders (see `variables_list` on each row):

| Variable | Usage |
|----------|--------|
| `{{day_name}}` | Weekday in opening line (`0096`) |
| `{{date_hijri}}` | Hijri date |
| `{{date_gregorian}}` | Gregorian date |
| `{{party_two_name}}` | Customer name |
| `{{party_two_id}}` | National ID |
| `{{party_two_address}}` | Address |
| `{{party_two_phone}}` | Mobile |
| `{{finance_type}}` | Service / finance type |
| `{{property_description}}` | **مكتب only** |
| `{{finance_amount}}` | Financing amount |
| `{{commission_amount}}` | Fee / note amount |
| `{{note_order_number}}` | Promissory note number |

`contract-view.html` builds substitutions in `buildTemplateSubstitutions()`; `day_name` comes from the contract Gregorian date.

---

## Rendering pipeline

### Entry points

| File | Role |
|------|------|
| `src/contracts-module/contract-view.html` | Pagination, print CSS, stamp, A4 preview |
| `src/contracts-module-pages.ts` | Imports `contract-view.html?raw` → `contractsViewPage` (no code gen) |
| `src/contracts-module/templates.html` | TinyMCE editor, stamp upload, doc font dropdown |
| `src/contracts-module-api.ts` | CRUD, `stamp_url`, translate-block on save |

### Document mode

When `render_mode === 'document'` and `body_content` is non-empty:

- `renderDocumentModeDoc()` fills placeholders and injects HTML into `.doc-document-body`
- Meta header strip (dates/number) is **skipped** — dates live in the body
- Rich HTML vs plain text: `isRichHtmlTemplate()`; plain bodies get `{{var}}` escaped

### Pagination (`paginateContractToA4`)

1. `expandDocumentBodyBlocks()` — splits body into `.doc-a4-line` blocks; preserves atomic blocks (sig row, page breaks, note title)
2. Unwraps `.tpl-doc-font` / `.tpl-note-section` but **inherits** `font-size` onto children
3. Packs blocks into `.a4-sheet` pages with orientation-aware height budgets

**Mixed-orientation mode** (when any block has `.tpl-page-break--landscape`):

- Exactly **one portrait page** for content before the landscape break
- Exactly **one landscape page** for سند لأمر (no overflow pagination)
- `fitSheetContentToSinglePage()` scales inner content down if height exceeds the sheet (avoids a 3rd page or clipping)

**Signature row:** overflow never starts a new page above signatures; content may sit slightly tight on page 1.

### Stamp (ختم)

- Stored per template: `contract_templates.stamp_url` (`0101`)
- Upload: `POST /api/contracts/template-stamp-upload` → R2 `/api/attachments/view/contracts/{tenantId}/template_stamp_…`
- Shown in **`.tpl-sig-space`** of party one **only when contract status is `مكتمل`**
- Applied before/after pagination via `applyPartyOneStampIfCompleted()`
- Targets `.tpl-sig-col--party-one` or label containing `الختم` / `الطرف الأول`

### Print / PDF

- Named `@page` rules must be **top-level** (not nested in `@media print`):
  - `portrait-page` → 210×297mm
  - `landscape-page` → 297×210mm
- Print CSS must **not** lock `html`/`body`/`.main-content` to 210mm (clips landscape)
- `printPage()` in `contract-view.html` (overrides `app.js`) unlocks widths when `.a4-sheet--landscape` exists
- Preview uses `zoom: 1.25` on `.contract-a4-stage` **after** pagination

---

## Editor safeguards

### Browser Translate

Chrome Translate has corrupted Arabic template HTML (English boilerplate injected). Mitigations:

- `translate="no"` + `notranslate` on templates page and TinyMCE iframe
- API rejects saves when `looksBrowserTranslatedTemplate(body_content)` (`browser_translate_blocked`)

If tenant 3 Waslah breaks again, restore from tenant 2 or re-run restore migrations — do not hand-edit in Translate-enabled browser.

### TinyMCE vs compact HTML

Production rows may differ from `0090` seed:

- **Pretty-printed** HTML with `char(10)` newlines and `&nbsp;` in `.tpl-sig-space`
- **Span-wrapped** lines with inline `font-size: 12px` (مكتب rows edited in UI)

Migrations that `REPLACE` exact strings must handle **both** compact and LF+span variants (see `0103`–`0107`, `0114`). Use `char(10)` in SQL, not literal CRLF in files, when matching newlines.

### Saving document font size

Editor wraps body in `.tpl-doc-font` with chosen size (default **9px** for these templates). Pagination reads inherited font-size so lines keep density on each A4 sheet.

---

## Migration history (template-related)

| Migration | Purpose |
|-----------|---------|
| `0090` | Seed both templates on **tenant 2** (source of truth for fresh installs) |
| `0091` | Recorded no-op; `render_mode` may need manual `ALTER` on empty DBs |
| `0092` | Copy tenant 2 → **tenant 3** (`render_mode = document`) |
| `0096` | `{{day_name}}` placeholder |
| `0097` / `0098` | Restore tenant 3 Waslah Arabic after translate corruption |
| `0099` / `0100` | Side-by-side signatures + forced break before سند لأمر |
| `0101` | `stamp_url` column |
| `0102` | Wrap all four in **9px** `.tpl-doc-font` |
| `0103`–`0107` | Signature label order, party headers, inline الختم/التوقيع, names above fields |
| `0114` | Landscape break + `.tpl-note-section` (12px / 18px title) |
| `0115` | Fix missing `</div>` close on Waslah note section |
| `0116` | Revert landscape → portrait-half; note body 20px / title 28px |

**Rule:** editing `0090` alone does **not** update production — already-applied migrations do not re-run. Add a new numbered migration for prod changes.

Apply remote:

```bash
npx wrangler d1 execute tamweel-production-v2 --remote --file=migrations/XXXX_name.sql
```

Deploy UI/renderer:

```bash
npm run build
npx wrangler pages deploy dist --project-name tamweel-calc-prod --branch="master" --commit-dirty=true
```

---

## Stamp status (typical)

Upload stamps per template in **القوالب** → edit template → ختم. Earlier state:

- Tenant 2: both templates had stamps after upload
- Tenant 3: Waslah (id 9) had stamp; مكتب (id 8) may still need upload

Verify: `SELECT id, tenant_id, template_name, stamp_url FROM contract_templates WHERE template_name LIKE '%خدمات وحلول%';`

---

## Checklist for future template changes

1. **Renderer first** — If adding new layout markers (orientation, sections), update `contract-view.html` pagination/print CSS before DB HTML.
2. **New migration** — Scope by exact `template_name` (both names) and idempotency guards (`instr(...) = 0`).
3. **Sync `0090`** — Keep seed aligned for new environments.
4. **Match HTML variants** — Test REPLACE against both compact and TinyMCE-pretty bodies; use `char(10)` for newlines.
5. **Two-page budget** — Contract at 9px must fit one portrait sheet with signatures; note at 20px must fit the top half of a portrait sheet (relies on `fitSheetContentToSinglePage` with `maxHPortrait/2` budget).
6. **Do not break classes** — `tpl-page-break--landscape`, `tpl-sig-col--party-one`, `tpl-sig-space` are required for paginator/stamp logic.
7. **Translate** — Edit templates only with Translate disabled; verify save does not trip `browser_translate_blocked`.
8. **Deploy** — Renderer changes need Pages deploy; HTML-only changes need D1 migration only.
9. **Print test** — Confirm portrait page 1 and portrait page 2 (note section in top half, letterhead footer at midpoint, lower half blank).

---

## Related files (quick links)

```
migrations/0090_seed_service_contract_templates.sql   # seed (tenant 2)
migrations/0092_seed_service_templates_tenant3.sql    # copy to tenant 3
migrations/0102_service_templates_doc_font_9px.sql
migrations/0114_service_templates_landscape_note.sql
migrations/0115_fix_waslah_note_section_close.sql
src/contracts-module/contract-view.html                 # pagination, print, stamp
src/contracts-module/templates.html                     # editor UI
src/contracts-module-api.ts                             # API + stamp + translate guard
src/contracts-module-pages.ts                           # serves contract-view HTML
```

---

## Known pitfalls

- **Third page** — Caused by overflow pagination before `enforceSinglePageSections`; or signature block pushed to new page (mitigated by keeping sig on page 1).
- **Clipped landscape print** — Caused by 210mm print container width or `@page` nested inside `@media print`.
- **Missing stamp** — Status not `مكتمل`, empty `stamp_url`, or stamp applied before pagination then clipped (stamp runs before + after `paginateContractToA4`).
- **Wrong font after save** — Missing `.tpl-doc-font` wrapper or pagination dropping inline styles (editor + `expandDocumentBodyBlocks` inherit fix).
- **Duplicate closing `</div>`** — Note section wrapper must close before outer `.tpl-doc-font`; Waslah needed `0115`.
- **`0091` on fresh DB** — `render_mode` column may be missing; run manual `ALTER` from comments in `0091` before `0092`.

---

*Last updated: July 2026 — portrait-half سند لأمر (top half, letterhead footer at midpoint), inline signature fields, single-page section fitting.*
