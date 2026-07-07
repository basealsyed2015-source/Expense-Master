import fs from 'fs'

const path = 'src/index.tsx'
let s = fs.readFileSync(path, 'utf8')

const marker = "{ label: 'ملف الهوية', icon: 'fa-id-card', url: (customer as any).identity_attachment_url }"
const start = s.indexOf(marker)
if (start === -1) {
  console.error('marker not found')
  process.exit(1)
}
const blockStart = s.lastIndexOf('${(() => {', start)
const end = s.indexOf('id="edit-add-solution-row"', start)
const endDiv = s.lastIndexOf('<div class="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">', end)
const endFinal = endDiv !== -1 ? endDiv : end
if (blockStart === -1 || endFinal === -1) {
  console.error('block markers not found', blockStart, endFinal)
  process.exit(1)
}

const rep = `                \${editCustomerAttachments.length > 0 ? \`
                    <div class="mb-6 bg-white p-4 rounded-lg">
                      <h3 class="font-bold text-gray-700 mb-3">المرفقات الحالية:</h3>
                      \${renderCustomerAttachmentsListHtml(editCustomerAttachments)}
                    </motion>
                  \` : ''}
                \${renderDynamicAttachmentsEditorHtml({
                  hiddenInputId: 'edit_customer_attachments_json',
                  listContainerId: 'edit_customer_attachments_list',
                  addButtonId: 'edit_customer_add_attachment_btn',
                })}

`.replace(/<\/motion>/g, '</div>').replace(/<motion>/g, '<div>')

s = s.slice(0, blockStart) + rep + s.slice(endFinal)
fs.writeFileSync(path, s)
console.log('patched edit customer html', endFinal - blockStart, 'chars removed')
