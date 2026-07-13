-- Waslah service templates: side-by-side signatures (company right / customer left),
-- forced page break before promissory note, centered bold "سند لأمر" heading.
-- Applies to tenants 2 and 3 copies of "عقد تقديم خدمات وحلول - شركة وصله".

UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'الطرف الأول: شركة وصله للخدمات العقارية والتحصيل — الختم:<br>الطرف الثاني: {{party_two_name}} — التوقيع:<br><br>——————————————————————————————<br><br>سند لأمر<br><br>',
  '<div class="tpl-sig-row"><div class="tpl-sig-col"><div class="tpl-sig-label">الطرف الأول</div><div>شركة وصله للخدمات العقارية والتحصيل</div><div class="tpl-sig-space"></div><div>الختم:</div></div><div class="tpl-sig-col"><div class="tpl-sig-label">الطرف الثاني</div><div>{{party_two_name}}</div><div class="tpl-sig-space"></div><div>التوقيع:</div></div></div><div class="tpl-page-break" style="page-break-before:always;"></div><p class="tpl-note-title" style="text-align:center;font-weight:800;">سند لأمر</p>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, 'الطرف الأول: شركة وصله للخدمات العقارية والتحصيل — الختم:<br>الطرف الثاني: {{party_two_name}} — التوقيع:<br><br>——————————————————————————————<br><br>سند لأمر<br><br>') > 0;

-- Plain-text / CRLF variant (legacy seed without <br>)
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'الطرف الأول: شركة وصله للخدمات العقارية والتحصيل — الختم:
الطرف الثاني: {{party_two_name}} — التوقيع:

——————————————————————————————

سند لأمر

',
  '<div class="tpl-sig-row"><div class="tpl-sig-col"><div class="tpl-sig-label">الطرف الأول</div><div>شركة وصله للخدمات العقارية والتحصيل</div><div class="tpl-sig-space"></div><div>الختم:</div></div><div class="tpl-sig-col"><div class="tpl-sig-label">الطرف الثاني</div><div>{{party_two_name}}</div><div class="tpl-sig-space"></div><div>التوقيع:</div></div></div><div class="tpl-page-break" style="page-break-before:always;"></div><p class="tpl-note-title" style="text-align:center;font-weight:800;">سند لأمر</p>
'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, 'الطرف الأول: شركة وصله للخدمات العقارية والتحصيل — الختم:') > 0
  AND instr(body_content, 'tpl-sig-row') = 0;
