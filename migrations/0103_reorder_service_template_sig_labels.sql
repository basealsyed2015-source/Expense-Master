-- Reorder signature block labels:
-- Party 1: الختم: above stamp field, company name below
-- Party 2: التوقيع: above signature field, customer name below

-- Compact (no newlines) Waslah
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-sig-col"><div class="tpl-sig-label">الطرف الأول</div><div>شركة وصله للخدمات العقارية والتحصيل</div><div class="tpl-sig-space"></div><div>الختم:</div></div><div class="tpl-sig-col"><div class="tpl-sig-label">الطرف الثاني</div><div>{{party_two_name}}</div><div class="tpl-sig-space"></div><div>التوقيع:</div></div>',
  '<div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الختم:</div><div class="tpl-sig-space"></div><div>شركة وصله للخدمات العقارية والتحصيل</div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">التوقيع:</div><div class="tpl-sig-space"></div><div>{{party_two_name}}</div></div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, 'tpl-sig-col--party-one') = 0
  AND instr(body_content, '<div class="tpl-sig-label">الطرف الأول</div><div>شركة وصله') > 0;

-- Compact مكتب حلول الموعد
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-sig-col"><div class="tpl-sig-label">الطرف الأول</div><div>مكتب حلول الموعد للخدمات العامة</div><div class="tpl-sig-space"></div><div>الختم:</div></div><div class="tpl-sig-col"><div class="tpl-sig-label">الطرف الثاني</div><div>{{party_two_name}}</div><div class="tpl-sig-space"></div><div>التوقيع:</div></div>',
  '<div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الختم:</div><div class="tpl-sig-space"></div><div>مكتب حلول الموعد للخدمات العامة</div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">التوقيع:</div><div class="tpl-sig-space"></div><div>{{party_two_name}}</div></div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - مكتب حلول الموعد'
  AND instr(body_content, 'tpl-sig-col--party-one') = 0
  AND instr(body_content, '<div class="tpl-sig-label">الطرف الأول</div><div>مكتب حلول الموعد') > 0;

-- Pretty-printed / TinyMCE newlines + &nbsp; (use char(10) — CRLF in .sql breaks match)
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-sig-col">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الأول</div>' || char(10) ||
  '<div>شركة وصله للخدمات العقارية والتحصيل</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>الختم:</div>' || char(10) ||
  '</div>' || char(10) ||
  '<div class="tpl-sig-col">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الثاني</div>' || char(10) ||
  '<div>{{party_two_name}}</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>التوقيع:</div>' || char(10) ||
  '</div>',
  '<div class="tpl-sig-col tpl-sig-col--party-one">' || char(10) ||
  '<div class="tpl-sig-label">الختم:</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>شركة وصله للخدمات العقارية والتحصيل</div>' || char(10) ||
  '</div>' || char(10) ||
  '<div class="tpl-sig-col tpl-sig-col--party-two">' || char(10) ||
  '<div class="tpl-sig-label">التوقيع:</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>{{party_two_name}}</div>' || char(10) ||
  '</div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, 'tpl-sig-col--party-one') = 0;

UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-sig-col">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الأول</div>' || char(10) ||
  '<div>مكتب حلول الموعد للخدمات العامة</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>الختم:</div>' || char(10) ||
  '</div>' || char(10) ||
  '<div class="tpl-sig-col">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الثاني</div>' || char(10) ||
  '<div>{{party_two_name}}</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>التوقيع:</div>' || char(10) ||
  '</div>',
  '<div class="tpl-sig-col tpl-sig-col--party-one">' || char(10) ||
  '<div class="tpl-sig-label">الختم:</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>مكتب حلول الموعد للخدمات العامة</div>' || char(10) ||
  '</div>' || char(10) ||
  '<div class="tpl-sig-col tpl-sig-col--party-two">' || char(10) ||
  '<div class="tpl-sig-label">التوقيع:</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>{{party_two_name}}</div>' || char(10) ||
  '</div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - مكتب حلول الموعد'
  AND instr(body_content, 'tpl-sig-col--party-one') = 0;
