---
name: Mixed Orientation Contracts
overview: Add orientation-aware A4 pagination so each service contract stays on one portrait page and its سند لأمر begins on one landscape page. Update and deploy all four production templates with a 12px note body and 18px title.
todos:
  - id: orientation-renderer
    content: Implement orientation-aware A4 preview, pagination, and print CSS
    status: pending
  - id: template-migration
    content: Add landscape note marker and larger note typography to seed and production migration
    status: pending
  - id: verify-deploy
    content: Build, apply migration, deploy Pages, and verify all four production templates
    status: pending
isProject: false
---

# Mixed-orientation service contracts

## Renderer and print layout
- Update [`src/contracts-module/contract-view.html`](src/contracts-module/contract-view.html) to support portrait and landscape sheets:
  - Add `.a4-sheet--landscape` screen dimensions (`297mm × 210mm`) while retaining portrait defaults (`210mm × 297mm`).
  - Replace the portrait-only print setup with named portrait/landscape `@page` rules and remove global `210mm` print-container constraints.
  - Make `createA4Sheet()` and `getA4ContentHeightPx()` orientation-aware so overflow is measured against the correct page height.
- Treat `tpl-page-break--landscape` as a consumed state marker in `expandDocumentBodyBlocks()` and `paginateContractToA4()`:
  - Finish the current portrait page.
  - Start the next sheet in landscape.
  - Keep subsequent note overflow pages landscape without producing blank pages.
  - Preserve ordinary `tpl-page-break` behavior for other templates.
- Keep preview scaling, page labels, watermark/letterhead insertion, stamp rendering, and signature pagination working for both widths; add horizontal preview overflow handling for landscape sheets.

## Template structure and data migration
- Add a new migration (next sequence after `0113`) that updates the two service-template names for tenants 2 and 3:
  - Change the existing note boundary to `<div class="tpl-page-break tpl-page-break--landscape" ...>`.
  - Wrap the full سند لأمر content in `.tpl-note-section` with `font-size:12px; line-height:1.6`.
  - Set the سند لأمر title to `18px`.
  - Scope and guard replacements so the migration is idempotent and only touches the four intended templates.
- Synchronize [`migrations/0090_seed_service_contract_templates.sql`](migrations/0090_seed_service_contract_templates.sql) with the same marker/wrapper/font structure for fresh databases; tenant 3 continues inheriting these templates through migration `0092`.

## Verification and rollout
- Build the application and check diagnostics for the edited renderer.
- Verify all four production rows contain the landscape marker, note wrapper, 12px body, and 18px title.
- Deploy Pages and apply the production D1 migration.
- Validate the expected output: page 1 remains portrait with the contract/signatures; page 2 starts at سند لأمر, is landscape, uses the larger font, and prints without clipping or a blank intermediate page.