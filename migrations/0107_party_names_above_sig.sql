-- Move party names above stamp/signature fields.

-- Compact Waslah
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الطرف الأول</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space"></div></div><div>شركة وصله للخدمات العقارية والتحصيل</div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">الطرف الثاني</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space"></div></div><div>{{party_two_name}}</div></div>',
  '<div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الطرف الأول</div><div class="tpl-sig-name">شركة وصله للخدمات العقارية والتحصيل</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space"></div></div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">الطرف الثاني</div><div class="tpl-sig-name">{{party_two_name}}</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space"></div></div></div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, 'tpl-sig-name') = 0;

-- Compact مكتب
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الطرف الأول</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space"></div></div><div>مكتب حلول الموعد للخدمات العامة</div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">الطرف الثاني</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space"></div></div><div>{{party_two_name}}</div></div>',
  '<div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الطرف الأول</div><div class="tpl-sig-name">مكتب حلول الموعد للخدمات العامة</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space"></div></div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">الطرف الثاني</div><div class="tpl-sig-name">{{party_two_name}}</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space"></div></div></div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - مكتب حلول الموعد'
  AND instr(body_content, 'tpl-sig-name') = 0;

-- Pretty Waslah
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-sig-col tpl-sig-col--party-one">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الأول</div>' || char(10) ||
  '<div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space">&nbsp;</div></div>' || char(10) ||
  '<div>شركة وصله للخدمات العقارية والتحصيل</div>' || char(10) ||
  '</div>' || char(10) ||
  '<div class="tpl-sig-col tpl-sig-col--party-two">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الثاني</div>' || char(10) ||
  '<div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space">&nbsp;</div></div>' || char(10) ||
  '<div>{{party_two_name}}</div>' || char(10) ||
  '</div>',
  '<div class="tpl-sig-col tpl-sig-col--party-one">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الأول</div>' || char(10) ||
  '<div class="tpl-sig-name">شركة وصله للخدمات العقارية والتحصيل</div>' || char(10) ||
  '<div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space">&nbsp;</div></div>' || char(10) ||
  '</div>' || char(10) ||
  '<div class="tpl-sig-col tpl-sig-col--party-two">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الثاني</div>' || char(10) ||
  '<div class="tpl-sig-name">{{party_two_name}}</div>' || char(10) ||
  '<div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space">&nbsp;</div></div>' || char(10) ||
  '</div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - شركة وصله'
  AND instr(body_content, 'tpl-sig-name') = 0;

-- Pretty مكتب
UPDATE contract_templates
SET body_content = REPLACE(
  body_content,
  '<div class="tpl-sig-col tpl-sig-col--party-one">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الأول</div>' || char(10) ||
  '<div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space">&nbsp;</div></div>' || char(10) ||
  '<div>مكتب حلول الموعد للخدمات العامة</div>' || char(10) ||
  '</div>' || char(10) ||
  '<div class="tpl-sig-col tpl-sig-col--party-two">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الثاني</div>' || char(10) ||
  '<div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space">&nbsp;</div></div>' || char(10) ||
  '<div>{{party_two_name}}</div>' || char(10) ||
  '</div>',
  '<div class="tpl-sig-col tpl-sig-col--party-one">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الأول</div>' || char(10) ||
  '<div class="tpl-sig-name">مكتب حلول الموعد للخدمات العامة</div>' || char(10) ||
  '<div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space">&nbsp;</div></div>' || char(10) ||
  '</div>' || char(10) ||
  '<div class="tpl-sig-col tpl-sig-col--party-two">' || char(10) ||
  '<div class="tpl-sig-label">الطرف الثاني</div>' || char(10) ||
  '<div class="tpl-sig-name">{{party_two_name}}</div>' || char(10) ||
  '<div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space">&nbsp;</div></div>' || char(10) ||
  '</div>'
)
WHERE template_name = 'عقد تقديم خدمات وحلول - مكتب حلول الموعد'
  AND instr(body_content, 'tpl-sig-name') = 0;
