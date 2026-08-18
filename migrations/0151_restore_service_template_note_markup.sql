-- Fully restore service-template markup after 0149/0150 experiments.
-- Remove tpl-promissory-disabled and display:none so templates match pre-disable HTML.
-- Hiding the promissory second page is renderer-only (contract-view.html).

-- Restore page-break class
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'class="tpl-page-break tpl-page-break--portrait-half tpl-promissory-disabled"',
  'class="tpl-page-break tpl-page-break--portrait-half"'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND tenant_id IN (2, 3)
  AND instr(body_content, 'tpl-page-break--portrait-half tpl-promissory-disabled') > 0;

-- Restore note section — compact style
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'class="tpl-note-section tpl-promissory-disabled" style="display:none!important;font-size:20px;line-height:1.6"',
  'class="tpl-note-section" style="font-size:20px;line-height:1.6"'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND tenant_id IN (2, 3)
  AND instr(body_content, 'display:none!important;font-size:20px;line-height:1.6') > 0;

-- Restore note section — TinyMCE spaced style
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'class="tpl-note-section tpl-promissory-disabled" style="display:none!important;font-size: 20px; line-height: 1.6;"',
  'class="tpl-note-section" style="font-size: 20px; line-height: 1.6;"'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND tenant_id IN (2, 3)
  AND instr(body_content, 'display:none!important;font-size: 20px; line-height: 1.6;') > 0;

-- Restore any leftover disabled note fragments
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'class="tpl-note-section tpl-promissory-disabled" style="display:none!important"',
  'class="tpl-note-section"'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND tenant_id IN (2, 3)
  AND instr(body_content, 'class="tpl-note-section tpl-promissory-disabled"') > 0;

UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'class="tpl-note-section tpl-promissory-disabled"',
  'class="tpl-note-section"'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND tenant_id IN (2, 3)
  AND instr(body_content, 'class="tpl-note-section tpl-promissory-disabled"') > 0;
