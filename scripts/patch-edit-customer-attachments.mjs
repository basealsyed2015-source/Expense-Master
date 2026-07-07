import fs from 'fs'

const path = 'src/index.tsx'
let s = fs.readFileSync(path, 'utf8')

// Replace edit customer attachments HTML block
const htmlStart = s.indexOf('                ${(() => {\n                  const docs = [\n                    { label: \'ملف الهوية\'')
const htmlEnd = s.indexOf('              <motion class="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">', htmlStart)
const htmlEnd2 = s.indexOf('              <div class="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">', htmlStart)
const htmlEndFinal = htmlEnd2 !== -1 ? htmlEnd2 : htmlEnd

if (htmlStart === -1 || htmlEndFinal === -1) {
  console.error('edit customer html block not found', htmlStart, htmlEndFinal)
  process.exit(1)
}

const htmlReplacement = `                ${editCustomerAttachments.length > 0 ? `
                    <div class="mb-6 bg-white p-4 rounded-lg">
                      <h3 class="font-bold text-gray-700 mb-3">المرفقات الحالية:</h3>
                      \${renderCustomerAttachmentsListHtml(editCustomerAttachments)}
                    </div>
                  ` : ''}
                \${renderDynamicAttachmentsEditorHtml({
                  hiddenInputId: 'edit_customer_attachments_json',
                  listContainerId: 'edit_customer_attachments_list',
                  addButtonId: 'edit_customer_add_attachment_btn',
                })}

`

// Can't use TS in mjs - use placeholder and fix in TS file with search replace instead
console.log('html block at', htmlStart, htmlEndFinal, 'len', htmlEndFinal - htmlStart)
