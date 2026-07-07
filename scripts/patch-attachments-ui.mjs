import fs from 'fs'

const path = 'src/index.tsx'
let s = fs.readFileSync(path, 'utf8')

function replaceCustomerAddModal() {
  const idx = s.indexOf('id="customer_identity_attachment"')
  if (idx === -1) throw new Error('customer_identity_attachment not found')
  const gridStart = s.lastIndexOf('<motion class="grid grid-cols-1 md:grid-cols-2 gap-4">', idx)
  const gridStart2 = s.lastIndexOf('<div class="grid grid-cols-1 md:grid-cols-2 gap-4">', idx)
  const start = gridStart2
  const doneBtn = s.indexOf('id="doneCustomerAttachmentsModal"', idx)
  const flexStart = s.lastIndexOf('<div class="flex justify-end gap-3 mt-6">', doneBtn)
  if (start === -1 || flexStart === -1) throw new Error('modal markers not found')
  const editorHtml = `                <input type="hidden" name="attachments_json" id="customer_attachments_json" value="[]">
                <div id="customer_attachments_list" class="space-y-3"></div>
                <button type="button" id="customer_add_attachment_btn"
                        class="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1">
                  <i class="fas fa-plus ml-1"></i>
                  إضافة مرفق
                </button>
                <p class="text-xs text-gray-500 mt-2">JPG, PNG أو PDF (حد أقصى 2MB لكل ملف)</p>

`
  s = s.slice(0, start) + editorHtml + s.slice(flexStart)
  s = s.replace('رفع المرفقات (اختياري)', 'المرفقات (اختياري)', 1)
}

function replaceRequestEditModal() {
  const idx = s.indexOf('id="identity_attachment"')
  if (idx === -1) throw new Error('identity_attachment not found')
  const gridStart = s.lastIndexOf('<div class="grid grid-cols-1 md:grid-cols-2 gap-4">', idx)
  const doneBtn = s.indexOf('id="doneRequestAttachmentsModal"', idx)
  const flexStart = s.lastIndexOf('<div class="flex justify-end gap-3 mt-6">', doneBtn)
  if (gridStart === -1 || flexStart === -1) throw new Error('request modal markers not found')
  const editorHtml = `                    <input type="hidden" id="request_attachments_json" value="[]">
                    <motion id="request_attachments_list" class="space-y-3"></motion>
                    <button type="button" id="request_add_attachment_btn"
                            class="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1">
                      <i class="fas fa-plus ml-1"></i>
                      إضافة مرفق
                    </button>
                    <p class="text-xs text-gray-500 mt-2">JPG, PNG أو PDF (حد أقصى 2MB لكل ملف)</p>

`
  s = s.slice(0, gridStart) + editorHtml + s.slice(flexStart)
}

replaceRequestEditModal()
replaceCustomerAddModal()
fs.writeFileSync(path, s)
console.log('patched')
