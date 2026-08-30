import sys
sys.stdout.reconfigure(encoding='utf-8')

body_ilgha = '<div class="tpl-doc-font" style="font-size:12px;line-height:1.6"><p style="text-align:center;font-weight:800;font-size:22px;">مخالصة مالية</p><p>بعون الله وتوفيقه أنه في يوم: {{day_name}} - الموافق: {{date_gregorian}} م أتفق كلاً من:</p><p>السادة / شركة وصله للخدمات العقارية والتحصيل<br>سجل تجاري رقم (1010805234) (الطرف الاول)</p><p>السيد / {{party_two_name}}<br>بطاقة مدنية رقم ({{party_two_id}}) (الطرف الثاني)</p><p>حيث ان الطرف الثاني يملك سند رقم ({{note_order_number}}) بمبلغ ({{commission_amount}}) ريال وقد تم الغاء الطلب<br>ووافق الطرفان وهما بكامل الأهلية القانونية على اعتبار هذه الوثيقة بمثابة مخالصة مالية نهائية ولا يحق<br>لأي من الطرفين مطالبة الأخر بأي مستحقات مالية.</p><p>والله ولي التوفيق،،،</p><div class="tpl-sig-row"><div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الطرف الأول</div><div class="tpl-sig-name">شركة وصله للخدمات العقارية والتحصيل</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space">&nbsp;</div></div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">الطرف الثاني</div><div class="tpl-sig-name">{{party_two_name}}</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space">&nbsp;</div></div></div></div></div>'

body_inhaa = '<div class="tpl-doc-font" style="font-size:12px;line-height:1.6"><p style="text-align:center;font-weight:800;font-size:22px;">مخالصة مالية</p><p>بعون الله وتوفيقه أنه في يوم: {{day_name}} - الموافق: {{date_gregorian}} م أتفق كلاً من:</p><p>السادة / شركة وصله للخدمات العقارية والتحصيل<br>سجل تجاري رقم (1010805234) (الطرف الاول)</p><p>السيد / {{party_two_name}}<br>بطاقة مدنية رقم ({{party_two_id}}) (الطرف الثاني)</p><p>حيث ان الطرف الثاني يملك سند رقم ({{note_order_number}}) بمبلغ ({{finance_amount}}) ريال<br>وقد اتفق مع الطرف الأول على وساطة عقارية عن طريق الجهات التمويلية بمبلغ سعي ({{commission_amount}}) ريال<br>وقد اتم الطرف الثاني جميع المستحقات المالية للطرف الأول عليه وافق الطرفان وهما بكامل الأهلية القانونية على اعتبار هذه الوثيقة بمثابة مخالصة مالية نهائية ولا يحق لأي من الطرفين مطالبة الأخر بأي مستحقات مالية أخرى.</p><div class="tpl-sig-row"><div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الطرف الأول</div><div class="tpl-sig-name">شركة وصله للخدمات العقارية والتحصيل</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space">&nbsp;</div></div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">الطرف الثاني</div><div class="tpl-sig-name">{{party_two_name}}</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space">&nbsp;</div></div></div></div></div>'

body_salfa = '<div class="tpl-doc-font" style="font-size:9px;line-height:1.6"><p style="text-align:left;">رقم العقد: {{contract_number}}</p><p style="text-align:center;font-weight:800;font-size:22px;">عقد قرض حسن</p><p>تم بحمد الله وتوفيقه في يوم ({{day_name}}) وتاريخ ({{date_hijri}} هـ) الموافق ({{date_gregorian}} م)، توقيع هذا العقد بين كل من:</p><p>السادة / شركة وصله للخدمات العقارية والتحصيل - سجل تجاري رقم (1010805234) عنوانها مدينة الرياض طريق الامام سعود الفرعي، حي التعاون، هاتف رقم (0112225256) (ويشار اليها في هذا العقد بالطرف الأول)</p><p>السيد / {{party_two_name}} - هوية وطنية رقم ({{party_two_id}})، تاريخ الانتهاء ({{party_two_id_expiry}})<br>مكان الميلاد ({{party_two_birth_place}}) جوال رقم ({{party_two_phone}}) (ويشار إليه في هذا العقد بالطرف الثاني)</p><p><strong>التمهيد:</strong><br>لما كان الطرف الأول شركة متخصصة بتقديم استشارات وحلول تمويلية للعملاء للمساهمة في تقديم كافة التسهيلات والحلول الملائمة لدخل العميل، بصفتها وسيط بين العميل والجهة التمويلية، وحيث أن الطرف الثاني لديه مديونية سابقة ({{previous_debt_description}}) لتمكينه من استخراج قرض تمويلي جديد، مع السعي للبحث عن حلول تمويلية أخرى، وحيث أن الطرفان قد أبرما سابقًا عقدًا برقم ({{previous_contract_number}})، إلا أن الطرفين يقران بأن هذا العقد الحالي مستقل قانونيًا عن العقد السابق، وأن المبلغ الموضح فيه يعتبر قرض حسن يتم استرداده من الطرف الثاني للطرف الأول بأي حال سواء تم إيجاد حل تمويلي للمعاملة أو تعذر ذلك، وقد التقت رغبة الطرفين وهما بكامل أهليتهما المعتبرة شرعًا ونظامًا، واتفقا على ما يلي:</p><p><strong>البند الأول: موضوع العقد</strong><br>يوافق الطرف الأول على تقديم مبلغ قدره ({{finance_amount}}) ريال للطرف الثاني كقرض حسن لغرض سداد المديونية، على ان يتم استرجاع المبلغ مضافاً اليه قيمة الضريبة المضافة 15% ليصبح اجمالي المبلغ المستحق للطرف الاول ({{commission_amount}}) ريال، وحرر سند لأمر رقم ({{note_order_number}}) على أن يتم تحويل المبلغ إلى حساب الطرف الثاني لدى بنك {{bank_name}} - رقم الحساب: {{bank_account_number}} - رقم الآيبان: {{bank_iban}}، ويلتزم الطرف الثاني بسداد مبلغ القرض وفقًا لأحكام هذا العقد دون قيد أو شرط.</p><p><strong>البند الثاني: التزامات الطرف الاول</strong><br>1- يلتزم الطرف الأول عند توقيع هذا العقد بتحويل مبلغ القرض إلى الطرف الثاني، مع تزويده بإيصال يفيد استلامه للمبلغ.<br>2- يلتزم الطرف الأول بإلغاء السند لأمر بعد سداد الطرف الثاني لقيمته.</p><p><strong>البند الثالث: التزامات الطرف الثاني</strong><br>يلتزم الطرف الثاني بإعادة مبلغ قرض الحسن للطرف الأول كاملاً، بغض النظر عن نجاح البحث عن حلول تمويلية أو عدمه.<br>يلتزم الطرف الثاني بتحرير سند لأمر بقيمة مبلغ القرض الحسن قدرها ({{finance_amount}}) ريال.<br>يلتزم الطرف الثاني بتقديم كافة المستندات التي يطلبها الطرف الأول.<br>يلتزم الطرف الثاني بعدم تأجيل السداد بسبب أي ظروف طارئة أو قوة قاهرة، ويظل ملزمًا بسداد المبلغ للطرف الأول وفقًا لشروط هذا العقد والمدة المحددة.<br>يلتزم الطرف الثاني بسداد مبلغ القرض الحسن كاملًا خلال مدة أقصاها (شهر) من تاريخ توقيع هذا العقد، وفي حال تأخره أو امتناعه عن السداد في الموعد المحدد، يكون ملزمًا قانونًا بتحمل كافة أتعاب المحاماة ومصاريف الاحتجاج والتنفيذ القضائي وأي مصروفات أخرى تنشأ عن المطالبة بالدين دون حاجة إلى إنذار أو تنبيه.</p><p><strong>البند الرابع: الاستقلال القانوني</strong><br>يقر الطرفان أن هذا العقد مستقل تمامًا عن العقد السابق رقم ({{previous_contract_number}})، ولا يؤثر على أي التزامات أو حقوق منشأة بموجب العقد السابق.</p><p><strong>البند الخامس: أحكام عامة</strong><br>أي تعديل على هذا العقد يجب أن يكون كتابيًا وموقعًا من الطرفين.<br>يخضع هذا العقد لأنظمة المملكة العربية السعودية، وأي نزاع ينشأ بين الطرفين يتم حله وديًا، وإن تعذر ذلك، يرفع للجهات القضائية المختصة.<br>تعتبر العناوين التي في صدر هذا العقد هي العناوين المعتمدة للمراسلات والإخطارات بين الطرفين.</p><p><strong>البند السادس: إقرار الطرفين</strong><br>يقر الطرفان بأنهما قرآ هذا العقد وفهما جميع بنوده، وأنهما بكامل أهليتهما المعتبرة شرعًا ونظامًا، ووقعاه طواعية وبدون أي إكراه.<br>حرر هذا العقد من نسختين اصليتين سلم لكل طرف نسخة منه وتعهدا بالالتزام بما ورد فيه.</p><div class="tpl-sig-row"><div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الطرف الأول</div><div class="tpl-sig-name">شركة وصله للخدمات العقارية والتحصيل</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space">&nbsp;</div></div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">الطرف الثاني</div><div class="tpl-sig-name">{{party_two_name}}</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space">&nbsp;</div></div></div></div></div>'

def esc(s):
    return s.replace("'", "''")

templates = [
    {
        'template_type': 'مخالصة إلغاء طلب',
        'template_name': 'مخالصة إلغاء طلب - شركة وصله',
        'body': body_ilgha,
        'footer': 'مخالصة إلغاء طلب',
        'vars': '["day_name","date_gregorian","party_two_name","party_two_id","note_order_number","commission_amount"]',
    },
    {
        'template_type': 'مخالصة انهاء طلب',
        'template_name': 'مخالصة انهاء طلب - شركة وصله',
        'body': body_inhaa,
        'footer': 'مخالصة انهاء طلب',
        'vars': '["day_name","date_gregorian","party_two_name","party_two_id","note_order_number","finance_amount","commission_amount"]',
    },
    {
        'template_type': 'عقد سلفه',
        'template_name': 'عقد قرض حسن (سلفة) - شركة وصله',
        'body': body_salfa,
        'footer': 'عقد قرض حسن',
        'vars': '["contract_number","day_name","date_hijri","date_gregorian","party_two_name","party_two_id","party_two_id_expiry","party_two_birth_place","party_two_phone","previous_debt_description","previous_contract_number","finance_amount","commission_amount","note_order_number","bank_name","bank_account_number","bank_iban"]',
    },
]

tenants = [
    {
        'id': 2,
        'stamp': '/api/attachments/view/contracts/2/template_stamp_1783974161323_qwrr1ue.jpeg',
    },
    {
        'id': 3,
        'stamp': '/api/attachments/view/contracts/3/template_stamp_1783973689520_5mh5r82.jpeg',
    },
]

watermark = '/api/attachments/view/contracts/3/template_watermark_1784832903575_s5zl5jp.jpeg'
header    = '/api/attachments/view/contracts/3/template_header_1784832954861_x0jslpz.jpeg'
footer_img = '/api/attachments/view/contracts/3/template_footer_1784832963489_55gv4t9.jpeg'

lines = []
for t in tenants:
    for tmpl in templates:
        lines.append(
            f"INSERT INTO contract_templates (tenant_id, template_name, template_type, header_content, body_content, footer_content, variables_list, is_active, court_city, render_mode, stamp_url, document_watermark_url, document_watermark_enabled, document_watermark_opacity, document_header_url, document_header_enabled, document_header_opacity, document_footer_url, document_footer_enabled, document_footer_opacity) VALUES ({t['id']}, '{esc(tmpl['template_name'])}', '{esc(tmpl['template_type'])}', '', '{esc(tmpl['body'])}', '{esc(tmpl['footer'])}', '{esc(tmpl['vars'])}', 1, 'الرياض', 'document', '{t['stamp']}', '{watermark}', 1, 0.12, '{header}', 1, 1.0, '{footer_img}', 1, 1.0);"
        )

with open('migrations/0158_wasla_new_type_templates.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"Generated {len(lines)} INSERT statements → migrations/0158_wasla_new_type_templates.sql")
