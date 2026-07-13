-- Add weekday placeholder {{day_name}} to "عقد تقديم خدمات وحلول" templates
-- for both companies that use them (tenant 2 + tenant 3).
-- contract-view already substitutes day_name from the contract gregorian date.
-- Idempotent: safe to re-run (no-op once blanks are already replaced).

-- مكتب حلول الموعد (plain text on tenants 2 and 3) — blank was (..........)
UPDATE contract_templates
SET
  body_content = REPLACE(body_content, 'في يوم (..........)', 'في يوم ({{day_name}})'),
  variables_list = CASE
    WHEN instr(COALESCE(variables_list, ''), '"day_name"') > 0 THEN variables_list
    ELSE REPLACE(COALESCE(variables_list, '[]'), '"date_gregorian"', '"date_gregorian","day_name"')
  END
WHERE template_name = 'عقد تقديم خدمات وحلول - مكتب حلول الموعد'
  AND instr(body_content, 'في يوم (..........)') > 0;

-- شركة وصله plain-text body (tenant 2) — blank was (............)
UPDATE contract_templates
SET
  body_content = REPLACE(body_content, 'في يوم (............)', 'في يوم ({{day_name}})'),
  variables_list = CASE
    WHEN instr(COALESCE(variables_list, ''), '"day_name"') > 0 THEN variables_list
    ELSE REPLACE(COALESCE(variables_list, '[]'), '"date_gregorian"', '"date_gregorian","day_name"')
  END
WHERE template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, 'في يوم (............)') > 0;

-- شركة وصله rich-HTML body (tenant 3) — day blank is a lone (............) after "يوم"
UPDATE contract_templates
SET
  body_content = REPLACE(body_content, '(............)', '({{day_name}})'),
  variables_list = CASE
    WHEN instr(COALESCE(variables_list, ''), '"day_name"') > 0 THEN variables_list
    ELSE REPLACE(COALESCE(variables_list, '[]'), '"date_gregorian"', '"date_gregorian","day_name"')
  END
WHERE template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, '(............)') > 0
  AND instr(body_content, '{{day_name}}') = 0;
