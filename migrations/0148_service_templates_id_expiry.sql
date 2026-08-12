-- Replace hardcoded 00/00/0000 national-ID-expiry placeholder with {{party_two_id_expiry}}
-- and add the variable to variables_list for all four service contract templates.

UPDATE contract_templates
SET body_content = REPLACE(body_content, '(00/00/0000)', '({{party_two_id_expiry}})')
WHERE template_name LIKE '%خدمات وحلول%'
  AND tenant_id IN (2, 3)
  AND instr(body_content, '(00/00/0000)') > 0;

-- مكتب حلول الموعد templates (property_description variant)
UPDATE contract_templates
SET variables_list = '["date_hijri","date_gregorian","day_name","party_two_name","party_two_id","party_two_id_expiry","party_two_address","party_two_phone","finance_type","property_description","finance_amount","commission_amount","note_order_number"]'
WHERE template_name LIKE '%مكتب حلول الموعد%'
  AND template_name LIKE '%خدمات وحلول%'
  AND tenant_id IN (2, 3);

-- شركة وصله templates (no property_description)
UPDATE contract_templates
SET variables_list = '["date_hijri","date_gregorian","day_name","party_two_name","party_two_id","party_two_id_expiry","party_two_address","party_two_phone","finance_type","finance_amount","commission_amount","note_order_number"]'
WHERE template_name LIKE '%وصله%'
  AND template_name LIKE '%خدمات وحلول%'
  AND tenant_id IN (2, 3);
