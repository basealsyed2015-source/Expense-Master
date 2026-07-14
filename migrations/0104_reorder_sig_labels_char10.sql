-- Fix sig label order for templates that still use الطرف الأول (pretty-printed / LF bodies).
-- Uses char(10) so Windows CRLF in .sql files cannot break the match.

-- Waslah (newline + &nbsp;)
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

-- مكتب حلول الموعد (newline + &nbsp;)
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
