import fs from 'fs'

const path = 'src/index.tsx'
let s = fs.readFileSync(path, 'utf8')

const start = s.indexOf('                var editAttachmentFiles = {')
const end = s.indexOf('                var g=document.getElementById(\'edit_date_of_birth_gregorian\')', start)
if (start === -1 || end === -1) {
  console.error('not found', start, end)
  process.exit(1)
}

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

const upStart = s.indexOf('                      var uploadOrder = [', end)
const upEnd = s.indexOf('                      editForm.submit();', upStart)
if (upStart !== -1 && upEnd !== -1) {
  const rep = `                      if (typeof window.uploadDynamicCustomerAttachments === 'function') {
                        await window.uploadDynamicCustomerAttachments({
                          customerId: String(\${id}),
                          onProgress: function (msg) { setEditMessage('loading', msg); }
                        });
                      }
                      `
  s = s.slice(0, upStart) + rep + s.slice(upEnd)
  console.log('uploadOrder replaced')
}

fs.writeFileSync(path, s)
console.log('ok')
