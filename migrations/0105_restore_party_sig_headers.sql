-- Restore الطرف الأول / الطرف الثاني headers above الختم / التوقيع.

-- Compact Waslah
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الختم:</div><div class="tpl-sig-space"></div><div>شركة وصله للخدمات العقارية والتحصيل</div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">التوقيع:</div><div class="tpl-sig-space"></div><div>{{party_two_name}}</div></div>',
  '<div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الطرف الأول</div><div>الختم:</div><div class="tpl-sig-space"></div><div>شركة وصله للخدمات العقارية والتحصيل</div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">الطرف الثاني</div><div>التوقيع:</div><div class="tpl-sig-space"></div><div>{{party_two_name}}</div></div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, '<div class="tpl-sig-label">الطرف الأول</div>') = 0;

-- Compact مكتب
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الختم:</div><div class="tpl-sig-space"></div><div>مكتب حلول الموعد للخدمات العامة</div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">التوقيع:</div><div class="tpl-sig-space"></div><div>{{party_two_name}}</div></div>',
  '<div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الطرف الأول</div><div>الختم:</div><div class="tpl-sig-space"></div><div>مكتب حلول الموعد للخدمات العامة</div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">الطرف الثاني</div><div>التوقيع:</div><div class="tpl-sig-space"></div><div>{{party_two_name}}</div></div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - مكتب حلول الموعد'
  AND instr(body_content, '<div class="tpl-sig-label">الطرف الأول</div>') = 0;

-- Pretty-printed Waslah (LF + &nbsp;)
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-sig-col tpl-sig-col--party-one">' || char(10) ||
  '<div class="tpl-sig-label">الختم:</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>شركة وصله للخدمات العقارية والتحصيل</div>' || char(10) ||
  '</div>' || char(10) ||
  '<div class="tpl-sig-col tpl-sig-col--party-two">' || char(10) ||
  '<div class="tpl-sig-label">التوقيع:</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>{{party_two_name}}</div>' || char(10) ||
  '</div>',
  '<div class="tpl-sig-col tpl-sig-col--party-one">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الأول</div>' || char(10) ||
  '<div>الختم:</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>شركة وصله للخدمات العقارية والتحصيل</div>' || char(10) ||
  '</div>' || char(10) ||
  '<div class="tpl-sig-col tpl-sig-col--party-two">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الثاني</div>' || char(10) ||
  '<div>التوقيع:</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>{{party_two_name}}</div>' || char(10) ||
  '</div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, '<div class="tpl-sig-label">الطرف الأول</div>') = 0;

-- Pretty-printed مكتب
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-sig-col tpl-sig-col--party-one">' || char(10) ||
  '<div class="tpl-sig-label">الختم:</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>مكتب حلول الموعد للخدمات العامة</div>' || char(10) ||
  '</div>' || char(10) ||
  '<div class="tpl-sig-col tpl-sig-col--party-two">' || char(10) ||
  '<div class="tpl-sig-label">التوقيع:</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>{{party_two_name}}</div>' || char(10) ||
  '</div>',
  '<div class="tpl-sig-col tpl-sig-col--party-one">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الأول</div>' || char(10) ||
  '<div>الختم:</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>مكتب حلول الموعد للخدمات العامة</div>' || char(10) ||
  '</div>' || char(10) ||
  '<div class="tpl-sig-col tpl-sig-col--party-two">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الثاني</div>' || char(10) ||
  '<div>التوقيع:</div>' || char(10) ||
  '<div class="tpl-sig-space">&nbsp;</div>' || char(10) ||
  '<div>{{party_two_name}}</div>' || char(10) ||
  '</div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - مكتب حلول الموعد'
  AND instr(body_content, '<div class="tpl-sig-label">الطرف الأول</div>') = 0;
