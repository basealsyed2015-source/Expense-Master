-- Fix missing tpl-note-section close on Waslah templates (7, 9).

UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'الاســـم: {{party_two_name}} التوقيع:' || char(10) || '<p>&nbsp;</p>' || char(10) || '</div>',
  'الاســـم: {{party_two_name}} التوقيع:' || char(10) || '<p>&nbsp;</p>' || char(10) || '</div>' || char(10) || '</div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, 'tpl-note-section') > 0
  AND instr(body_content, '<p>&nbsp;</p>' || char(10) || '</div>' || char(10) || '</div>') = 0;
