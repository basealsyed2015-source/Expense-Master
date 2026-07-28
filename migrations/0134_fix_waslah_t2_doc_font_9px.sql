-- Waslah (tenant 2) body was rewritten to 20px when saving after a watermark
-- opacity tweak. extractDocFontSize wrongly read .tpl-note-section's 20px.
-- Restore outer .tpl-doc-font to 9px so page 1 fits including the stamp.
-- Keep watermark opacity as-is (user set ~0.53). Do not touch note-section sizes.

UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'class="tpl-doc-font" style="font-size:20px;line-height:1.6"',
  'class="tpl-doc-font" style="font-size:9px;line-height:1.6"'
)
WHERE id = 7
  AND tenant_id = 2
  AND template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, 'class="tpl-doc-font" style="font-size:20px;line-height:1.6"') > 0;
