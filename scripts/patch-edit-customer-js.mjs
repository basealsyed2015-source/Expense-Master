import fs from 'fs'

const path = 'src/index.tsx'
let s = fs.readFileSync(path, 'utf8')

let start = s.indexOf('                var editAttachmentFiles = {')
let end = s.indexOf('                var g=document.getElementById', start)
if (start !== -1 && end !== -1) {
  const inject = `                var editCustomerAttachmentsInitialJson = [];
                try {
                  var __editAttEl = document.getElementById('editCustomerAttachmentsJSON');
                  if (__editAttEl && __editAttEl.textContent) editCustomerAttachmentsInitialJson = JSON.parse(__editAttEl.textContent) || [];
                } catch (e) { editCustomerAttachmentsInitialJson = []; }
                \${getDynamicCustomerAttachmentsScript()}
                initDynamicCustomerAttachments({
                  hiddenInputId: 'edit_customer_attachments_json',
                  listContainerId: 'edit_customer_attachments_list',
                  addButtonId: 'edit_customer_add_attachment_btn',
                  customerId: \${id},
                  initialAttachments: editCustomerAttachmentsInitialJson
                });

`
  s = s.slice(0, start) + inject + s.slice(end)
  console.log('replaced edit attachment vars')
}

start = s.indexOf('                      var uploadOrder = [\n                        { key: \'identity\', label: \'ملف الهوية\' },')
end = s.indexOf('                      editForm.submit();', start)
if (start !== -1 && end !== -1) {
  const rep = `                      if (typeof window.uploadDynamicCustomerAttachments === 'function') {
                        await window.uploadDynamicCustomerAttachments({
                          customerId: String(\${id}),
                          onProgress: function (msg) { setEditMessage('loading', msg); }
                        });
                      }
                      `
  s = s.slice(0, start) + rep + s.slice(end)
  console.log('replaced uploadOrder')
}

fs.writeFileSync(path, s)
console.log('done')
