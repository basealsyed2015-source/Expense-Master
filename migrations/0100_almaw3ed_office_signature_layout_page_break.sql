-- Same signature row + forced page break + centered bold سند لأمر
-- for "عقد تقديم خدمات وحلول - مكتب حلول الموعد" (tenants 2 and 3).

UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'الطرف الأول: مكتب حلول الموعد للخدمات العامة — الختم:<br>الطرف الثاني: {{party_two_name}} — التوقيع:<br><br>——————————————————————————————<br><br>سند لأمر<br><br>',
  '<div class="tpl-sig-row"><div class="tpl-sig-col"><div class="tpl-sig-label">الطرف الأول</div><div>مكتب حلول الموعد للخدمات العامة</div><div class="tpl-sig-space"></div><div>الختم:</div></div><div class="tpl-sig-col"><div class="tpl-sig-label">الطرف الثاني</div><div>{{party_two_name}}</div><div class="tpl-sig-space"></div><div>التوقيع:</div></div></div><div class="tpl-page-break" style="page-break-before:always;"></div><p class="tpl-note-title" style="text-align:center;font-weight:800;">سند لأمر</p>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - مكتب حلول الموعد'
  AND instr(body_content, 'الطرف الأول: مكتب حلول الموعد للخدمات العامة — الختم:<br>الطرف الثاني: {{party_two_name}} — التوقيع:<br><br>——————————————————————————————<br><br>سند لأمر<br><br>') > 0;

UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  'الطرف الأول: مكتب حلول الموعد للخدمات العامة — الختم:
الطرف الثاني: {{party_two_name}} — التوقيع:

——————————————————————————————

سند لأمر

',
  '<div class="tpl-sig-row"><div class="tpl-sig-col"><div class="tpl-sig-label">الطرف الأول</div><div>مكتب حلول الموعد للخدمات العامة</div><div class="tpl-sig-space"></div><div>الختم:</div></div><div class="tpl-sig-col"><div class="tpl-sig-label">الطرف الثاني</div><div>{{party_two_name}}</div><div class="tpl-sig-space"></div><div>التوقيع:</div></div></div><div class="tpl-page-break" style="page-break-before:always;"></div><p class="tpl-note-title" style="text-align:center;font-weight:800;">سند لأمر</p>
'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - مكتب حلول الموعد'
  AND instr(body_content, 'الطرف الأول: مكتب حلول الموعد للخدمات العامة — الختم:') > 0
  AND instr(body_content, 'tpl-sig-row') = 0;
