import fs from 'fs'

const path = 'src/index.tsx'
let s = fs.readFileSync(path, 'utf8')

const start = s.indexOf('              // Upload attachments if selected')
const end = s.indexOf('              // Update financing request', start)
if (start === -1 || end === -1) {
  console.error('not found', start, end)
  process.exit(1)
}

const replacement = `              if (typeof window.uploadDynamicCustomerAttachments === 'function') {
                var uploadedAttachments = await window.uploadDynamicCustomerAttachments({
                  onProgress: function (msg) {
                    document.getElementById('message').innerHTML = '<motion class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded"><i class="fas fa-spinner fa-spin ml-2"></i>' + msg + '</div>';
                  }
                });
                data.attachments_json = JSON.stringify(uploadedAttachments || []);
              } else {
                var attHidden = document.getElementById('request_attachments_json');
                data.attachments_json = attHidden ? (attHidden.value || '[]') : '[]';
              }

`.replace(/<motion class="/g, '<div class="').replace(/<\/motion>/g, '</div>')

s = s.slice(0, start) + replacement + s.slice(end)
fs.writeFileSync(path, s)
console.log('patched request submit')
