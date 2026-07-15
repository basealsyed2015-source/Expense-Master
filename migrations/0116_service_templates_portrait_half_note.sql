-- Revert سند لأمر page from landscape to portrait, constrained to top half of A4.
-- Changes: tpl-page-break--landscape → tpl-page-break--portrait-half (renderer handles half-page fit).
--          Note section body font 12px → 20px, title 18px → 28px (tuned to fill the ~half-portrait area).

-- ── Step 1: page-break class — compact style (no space before colon) ──────────────────────────────
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'class="tpl-page-break tpl-page-break--landscape" style="page-break-before:always;"',
  'class="tpl-page-break tpl-page-break--portrait-half" style="page-break-before:always;"'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-page-break--landscape') > 0
  AND instr(body_content, 'tpl-page-break--portrait-half') = 0;

-- ── Step 1b: page-break class — TinyMCE style (space before colon) ───────────────────────────────
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'class="tpl-page-break tpl-page-break--landscape" style="page-break-before: always;"',
  'class="tpl-page-break tpl-page-break--portrait-half" style="page-break-before: always;"'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-page-break--landscape') > 0
  AND instr(body_content, 'tpl-page-break--portrait-half') = 0;

-- ── Step 2a: note section font — compact style ───────────────────────────────────────────────────
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'class="tpl-note-section" style="font-size:12px;line-height:1.6"',
  'class="tpl-note-section" style="font-size:20px;line-height:1.6"'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-note-section') > 0
  AND instr(body_content, 'font-size:12px') > 0;

-- ── Step 2b: note section font — TinyMCE spaced style ───────────────────────────────────────────
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'class="tpl-note-section" style="font-size: 12px; line-height: 1.6"',
  'class="tpl-note-section" style="font-size: 20px; line-height: 1.6"'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-note-section') > 0
  AND instr(body_content, 'font-size: 12px') > 0;

-- ── Step 3a: title font — compact inline style ───────────────────────────────────────────────────
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'style="text-align:center;font-weight:800;font-size:18px;">سند لأمر</p>',
  'style="text-align:center;font-weight:800;font-size:28px;">سند لأمر</p>'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-note-section') > 0
  AND instr(body_content, 'font-size:18px;">سند لأمر') > 0;

-- ── Step 3b: title font — TinyMCE spaced style ───────────────────────────────────────────────────
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'style="text-align: center; font-weight: 800; font-size: 18px;">سند لأمر</p>',
  'style="text-align: center; font-weight: 800; font-size: 28px;">سند لأمر</p>'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-note-section') > 0
  AND instr(body_content, 'font-size: 18px;">سند لأمر') > 0;

-- ── Step 3c: title font — TinyMCE span-wrapped variant (مكتب rows edited in UI) ─────────────────
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<span style="font-size: 14px;">سند لأمر</span>',
  '<span style="font-size: 28px;">سند لأمر</span>'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-note-section') > 0
  AND instr(body_content, 'font-size: 14px;">سند لأمر') > 0;
