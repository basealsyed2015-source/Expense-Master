-- Match tenant-3 Waslah density: wrap remaining service templates in
-- tpl-doc-font at 9px so clauses + signatures fit on one page before the
-- forced سند لأمر break (same as contract_templates id 9).

UPDATE contract_templates
SET body_content =
  '<div class="tpl-doc-font" style="font-size:9px;line-height:1.6">' ||
  body_content ||
  '</div>'
WHERE template_name IN (
  'عقد تقديم خدمات وحلول - مكتب حلول الموعد',
  'عقد تقديم خدمات وحلول - شركة وصله'
)
  AND instr(body_content, 'tpl-doc-font') = 0;
