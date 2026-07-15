-- Landscape سند لأمر page: tpl-page-break--landscape + tpl-note-section (12px body, 18px title).

-- 1) Landscape page-break marker
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'class="tpl-page-break" style="page-break-before: always;"',
  'class="tpl-page-break tpl-page-break--landscape" style="page-break-before: always;"'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-page-break--landscape') = 0;

UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'class="tpl-page-break" style="page-break-before:always;"',
  'class="tpl-page-break tpl-page-break--landscape" style="page-break-before:always;"'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-page-break--landscape') = 0;

-- 2a) Open note section — TinyMCE span title variant (مكتب templates)
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-page-break tpl-page-break--landscape" style="page-break-before: always;">&nbsp;</div>' || char(10) ||
  '<p class="tpl-note-title" style="text-align: center; font-weight: 800;"><span style="font-size: 14px;">سند لأمر</span></p>',
  '<div class="tpl-page-break tpl-page-break--landscape" style="page-break-before: always;"></div>' || char(10) ||
  '<div class="tpl-note-section" style="font-size:12px;line-height:1.6">' || char(10) ||
  '<p class="tpl-note-title" style="text-align:center;font-weight:800;font-size:18px;">سند لأمر</p>'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-note-section') = 0
  AND instr(body_content, 'font-size: 14px;">سند لأمر</span>') > 0;

-- 2b) Open note section — plain title variant (Waslah templates)
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-page-break tpl-page-break--landscape" style="page-break-before: always;">&nbsp;</div>' || char(10) ||
  '<p class="tpl-note-title" style="text-align: center; font-weight: 800;">سند لأمر</p>',
  '<div class="tpl-page-break tpl-page-break--landscape" style="page-break-before: always;"></div>' || char(10) ||
  '<div class="tpl-note-section" style="font-size:12px;line-height:1.6">' || char(10) ||
  '<p class="tpl-note-title" style="text-align:center;font-weight:800;font-size:18px;">سند لأمر</p>'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-note-section') = 0
  AND instr(body_content, '<p class="tpl-note-title" style="text-align: center; font-weight: 800;">سند لأمر</p>') > 0;

-- 2c) Seed-style compact break (no TinyMCE spans) for any row still on compact HTML
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-page-break tpl-page-break--landscape" style="page-break-before:always;"></div>' || char(10) ||
  '<p class="tpl-note-title" style="text-align:center;font-weight:800;">سند لأمر</p>',
  '<div class="tpl-page-break tpl-page-break--landscape" style="page-break-before:always;"></div>' || char(10) ||
  '<div class="tpl-note-section" style="font-size:12px;line-height:1.6">' || char(10) ||
  '<p class="tpl-note-title" style="text-align:center;font-weight:800;font-size:18px;">سند لأمر</p>'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-note-section') = 0;

-- 3a) Close note section — span signature line ending
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'الاســـم: {{party_two_name}} التوقيع:</span>' || char(10) || '<p>&nbsp;</p>' || char(10) || '</div>',
  'الاســـم: {{party_two_name}} التوقيع:</span>' || char(10) || '<p>&nbsp;</p>' || char(10) || '</div>' || char(10) || '</div>'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-note-section') > 0
  AND instr(body_content, 'التوقيع:</span>') > 0
  AND instr(body_content, '<p>&nbsp;</p>' || char(10) || '</div>' || char(10) || '</div>') = 0;

-- 3b) Close note section — plain signature line ending
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'الاســـم: {{party_two_name}} التوقيع:' || char(10) || '<p>&nbsp;</p>' || char(10) || '</div>',
  'الاســـم: {{party_two_name}} التوقيع:' || char(10) || '<p>&nbsp;</p>' || char(10) || '</div>' || char(10) || '</div>'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-note-section') > 0
  AND instr(body_content, 'التوقيع:</span>') = 0
  AND instr(body_content, '<p>&nbsp;</p>' || char(10) || '</div>' || char(10) || '</div>') = 0;

-- 3d) Waslah plain ending (retry — step 3b may miss when name filter alone is used)
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'الاســـم: {{party_two_name}} التوقيع:' || char(10) || '<p>&nbsp;</p>' || char(10) || '</div>',
  'الاســـم: {{party_two_name}} التوقيع:' || char(10) || '<p>&nbsp;</p>' || char(10) || '</div>' || char(10) || '</div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, 'tpl-note-section') > 0
  AND instr(body_content, '<p>&nbsp;</p>' || char(10) || '</div>' || char(10) || '</div>') = 0;

-- 3c) Close note section — seed-style ending (no trailing &nbsp; paragraph)
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'الاســـم: {{party_two_name}}    التوقيع:',
  'الاســـم: {{party_two_name}}    التوقيع:</div>'
)
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-note-section') > 0
  AND instr(body_content, 'التوقيع:</div>') = 0
  AND instr(body_content, '<p>&nbsp;</p>') = 0;
