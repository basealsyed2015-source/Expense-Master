import sys
sys.stdout.reconfigure(encoding='utf-8')

body_ilgha = '<div class="tpl-doc-font" style="font-size:12px;line-height:1.6"><p style="text-align:center;font-weight:800;font-size:22px;">مخالصة مالية</p><p>بعون الله وتوفيقه أنه في يوم: {{day_name}} - الموافق: {{date_gregorian}} م أتفق كلاً من:</p><p>السادة / مكتب حلول الموعد للخدمات العامة<br>سجل رقم (3350179573) (الطرف الاول)</p><p>السيد / {{party_two_name}}<br>بطاقة مدنية رقم ({{party_two_id}}) (الطرف الثاني)</p><p>حيث ان الطرف الثاني يملك سند رقم ({{note_order_number}}) بمبلغ ({{commission_amount}}) ريال وقد تم الغاء الطلب<br>ووافق الطرفان وهما بكامل الأهلية القانونية على اعتبار هذه الوثيقة بمثابة مخالصة مالية نهائية ولا يحق<br>لأي من الطرفين مطالبة الأخر بأي مستحقات مالية.</p><p>والله ولي التوفيق،،،</p><div class="tpl-sig-row"><div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الطرف الأول</div><div class="tpl-sig-name">مكتب حلول الموعد للخدمات العامة</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space">&nbsp;</div></div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">الطرف الثاني</div><div class="tpl-sig-name">{{party_two_name}}</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space">&nbsp;</div></div></div></div></div>'

body_inhaa = '<div class="tpl-doc-font" style="font-size:12px;line-height:1.6"><p style="text-align:center;font-weight:800;font-size:22px;">مخالصة مالية</p><p>بعون الله وتوفيقه أنه في يوم: {{day_name}} - الموافق: {{date_gregorian}} م أتفق كلاً من:</p><p>السادة / مكتب حلول الموعد للخدمات العامة<br>سجل رقم (3350179573) (الطرف الاول)</p><p>السيد / {{party_two_name}}<br>بطاقة مدنية رقم ({{party_two_id}}) (الطرف الثاني)</p><p>حيث ان الطرف الثاني يملك سند رقم ({{note_order_number}}) بمبلغ ({{finance_amount}}) ريال<br>وقد اتفق مع الطرف الأول على وساطة عقارية عن طريق الجهات التمويلية بمبلغ سعي ({{commission_amount}}) ريال<br>وقد اتم الطرف الثاني جميع المستحقات المالية للطرف الأول عليه وافق الطرفان وهما بكامل الأهلية القانونية على اعتبار هذه الوثيقة بمثابة مخالصة مالية نهائية ولا يحق لأي من الطرفين مطالبة الأخر بأي مستحقات مالية أخرى.</p><p>والله ولي التوفيق،،،</p><div class="tpl-sig-row"><div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الطرف الأول</div><div class="tpl-sig-name">مكتب حلول الموعد للخدمات العامة</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space">&nbsp;</div></div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">الطرف الثاني</div><div class="tpl-sig-name">{{party_two_name}}</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space">&nbsp;</div></div></div></div></div>'

body_salfa = '<div class="tpl-doc-font" style="font-size:12px;line-height:1.6"><p style="text-align:left;">رقم العقد: {{contract_number}}</p><p style="text-align:center;font-weight:800;font-size:22px;">عقد قرض حسن</p><p>تم بحمد الله وتوفيقه في يوم ({{day_name}}) وتاريخ ({{date_hijri}} هـ) الموافق ({{date_gregorian}} م)، توقيع هذا العقد بين كل من:</p><p>السادة/ مكتب حلول الموعد للخدمات العامة، سجل تجاري رقم (3350179573) عنوانها مدينة (الرياض) حي (التعاون) طريق الامام سعود الفرعي - الرمز البريدي (12476)<br>هاتف رقم (920012979)، (ويشار اليه في هذا العقد بالطرف الأول)</p><p>السيد / {{party_two_name}} - هوية وطنية رقم ({{party_two_id}})، تاريخ الانتهاء ({{party_two_id_expiry}})<br>جوال رقم ({{party_two_phone}}) (ويشار إليه في هذا العقد بالطرف الثاني)</p><p><strong>التمهيد:</strong><br>لما كان الطرف الأول مكتب متخصص بتقديم استشارات وحلول تمويلية للعملاء للمساهمة في تقديم كافة التسهيلات والحلول الملائمة لدخل العميل، بصفتها وسيط بين العميل والجهة التمويلية، وحيث أن الطرف الثاني يرغب بسلفة لتمكينه من استخراج قرض تمويلي جديد، مع السعي للبحث عن حلول تمويلية أخرى، وحيث أن الطرفين يقران بأن هذا العقد الحالي مستقل قانونيًا عن أي عقد سابق، وأن المبلغ الموضح فيه يعتبر قرض حسن يتم استرداده من الطرف الثاني للطرف الأول بأي حال سواء تم إيجاد حل تمويلي للمعاملة أو تعذر ذلك، وقد التقت رغبة الطرفين وهما بكامل أهليتهما المعتبرة شرعًا ونظامًا، واتفقا على ما يلي:</p><p><strong>البند الأول: موضوع العقد</strong><br>يوافق الطرف الأول على تقديم مبلغ قدره ({{finance_amount}}) ريال للطرف الثاني كقرض حسن (سلفة)، على ان يتم استرجاع المبلغ مضافاً اليه قيمة الضريبة المضافة 15% ليصبح اجمالي المبلغ المستحق للطرف الاول ({{commission_amount}}) ريال، وحرر سند لأمر رقم ({{note_order_number}}) على أن يتم تحويل المبلغ إلى حساب الطرف الثاني لدى بنك {{bank_name}}، ويلتزم الطرف الثاني بسداد مبلغ القرض وفقًا لأحكام هذا العقد دون قيد أو شرط.</p><p><strong>البند الثاني: التزامات الطرف الاول</strong><br>1- يلتزم الطرف الأول عند توقيع هذا العقد بتحويل مبلغ القرض إلى الطرف الثاني، مع تزويده بإيصال يفيد استلامه للمبلغ.<br>2- يلتزم الطرف الأول بإلغاء السند لأمر بعد سداد الطرف الثاني لقيمته.</p><p><strong>البند الثالث: التزامات الطرف الثاني</strong><br>يلتزم الطرف الثاني بإعادة مبلغ قرض الحسن للطرف الأول كاملاً، بغض النظر عن نجاح البحث عن حلول تمويلية أو عدمه.<br>يلتزم الطرف الثاني بتحرير سند لأمر بقيمة مبلغ القرض الحسن قدرها ({{finance_amount}}) ريال.<br>يلتزم الطرف الثاني بتقديم كافة المستندات التي يطلبها الطرف الأول.<br>يلتزم الطرف الثاني بسداد مبلغ القرض الحسن كاملًا خلال مدة أقصاها (شهر) من تاريخ توقيع هذا العقد، وفي حال تأخره أو امتناعه عن السداد في الموعد المحدد، يكون ملزمًا قانونًا بتحمل كافة أتعاب المحاماة ومصاريف الاحتجاج والتنفيذ القضائي.</p><p><strong>البند الرابع: أحكام عامة</strong><br>أي تعديل على هذا العقد يجب أن يكون كتابيًا وموقعًا من الطرفين.<br>يخضع هذا العقد لأنظمة المملكة العربية السعودية، وأي نزاع ينشأ بين الطرفين يتم حله وديًا، وإن تعذر ذلك، يرفع للجهات القضائية المختصة.</p><p><strong>البند الخامس: إقرار الطرفين</strong><br>يقر الطرفان بأنهما قرآ هذا العقد وفهما جميع بنوده، وأنهما بكامل أهليتهما المعتبرة شرعًا ونظامًا، ووقعاه طواعية وبدون أي إكراه.<br>حرر هذا العقد من نسختين اصليتين سلم لكل طرف نسخة منه وتعهدا بالالتزام بما ورد فيه.</p><div class="tpl-sig-row"><div class="tpl-sig-col tpl-sig-col--party-one"><div class="tpl-sig-label">الطرف الأول</div><div class="tpl-sig-name">مكتب حلول الموعد للخدمات العامة</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">الختم:</span><div class="tpl-sig-space">&nbsp;</div></div></div><div class="tpl-sig-col tpl-sig-col--party-two"><div class="tpl-sig-label">الطرف الثاني</div><div class="tpl-sig-name">{{party_two_name}}</div><div class="tpl-sig-field"><span class="tpl-sig-field-lbl">التوقيع:</span><div class="tpl-sig-space">&nbsp;</div></div></div></div></div>'

def esc(s):
    return s.replace("'", "''")

templates = [
    {
        'template_type': 'مخالصة إلغاء طلب',
        'template_name': 'مخالصة إلغاء طلب - مكتب حلول الموعد',
        'body': body_ilgha,
        'footer': 'مخالصة إلغاء طلب',
        'vars': '["day_name","date_gregorian","party_two_name","party_two_id","note_order_number","commission_amount"]',
    },
    {
        'template_type': 'مخالصة انهاء طلب',
        'template_name': 'مخالصة انهاء طلب - مكتب حلول الموعد',
        'body': body_inhaa,
        'footer': 'مخالصة انهاء طلب',
        'vars': '["day_name","date_gregorian","party_two_name","party_two_id","note_order_number","finance_amount","commission_amount"]',
    },
    {
        'template_type': 'عقد سلفه',
        'template_name': 'عقد قرض حسن (سلفة) - مكتب حلول الموعد',
        'body': body_salfa,
        'footer': 'عقد قرض حسن',
        'vars': '["contract_number","day_name","date_hijri","date_gregorian","party_two_name","party_two_id","party_two_id_expiry","party_two_phone","finance_amount","commission_amount","note_order_number","bank_name"]',
    },
]

tenants = [
    {'id': 2, 'stamp': '/api/attachments/view/contracts/2/template_stamp_1783974311438_5d33gl5.jpeg'},
    {'id': 3, 'stamp': '/api/attachments/view/contracts/3/template_stamp_1784060131301_mgcmr03.jpeg'},
]

watermark = '/api/attachments/view/contracts/3/template_watermark_1784833065864_zcbhee0.jpeg'
header = '/api/attachments/view/contracts/3/template_header_1784833070051_lp916hk.jpeg'
footer_img = '/api/attachments/view/contracts/3/template_footer_1784833074946_kb5xtux.jpeg'

lines = []
for t in tenants:
    for tmpl in templates:
        lines.append(
            f"INSERT INTO contract_templates (tenant_id, template_name, template_type, header_content, body_content, footer_content, variables_list, is_active, court_city, render_mode, stamp_url, document_watermark_url, document_watermark_enabled, document_watermark_opacity, document_header_url, document_header_enabled, document_header_opacity, document_footer_url, document_footer_enabled, document_footer_opacity) VALUES ({t['id']}, '{esc(tmpl['template_name'])}', '{esc(tmpl['template_type'])}', '', '{esc(tmpl['body'])}', '{esc(tmpl['footer'])}', '{esc(tmpl['vars'])}', 1, 'الرياض', 'document', '{t['stamp']}', '{watermark}', 1, 0.12, '{header}', 1, 1.0, '{footer_img}', 1, 1.0);"
        )

with open('migrations/insert_new_templates.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"Generated {len(lines)} INSERT statements")
