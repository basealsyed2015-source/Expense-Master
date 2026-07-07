import fs from 'fs'

const path = 'src/index.tsx'
let s = fs.readFileSync(path, 'utf8')

const start = s.indexOf('          const attachmentFiles = {\n            identity_attachment: null,')
const end = s.indexOf('          async function handleSubmit(event) {', start)
if (start === -1 || end === -1) {
  console.error('markers not found', start, end)
  process.exit(1)
}

const replacement = `          \${getDynamicCustomerAttachmentsScript()}
          initDynamicCustomerAttachments({
            hiddenInputId: 'request_attachments_json',
            listContainerId: 'request_attachments_list',
            addButtonId: 'request_add_attachment_btn',
            customerId: editRequestPageCtx.customerId,
            initialAttachments: requestAttachmentsInitialJson
          });

`

// We need requestAttachmentsInitialJson variable - inject script tag before handleSubmit block
// Actually use inline JSON from template - find requestAttachmentsJsonForEdit in file
const jsonVar = 'const requestAttachmentsInitialJson = '
const jsonIdx = s.indexOf('const requestAttachmentsJsonForEdit =')
if (jsonIdx === -1) {
  console.error('requestAttachmentsJsonForEdit not in TS - use template var in HTML')
}

// The TS variable is requestAttachmentsJsonForEdit - in the HTML script we need:
// var requestAttachmentsInitialJson = ... parsed from embedded json
const inject = `          var requestAttachmentsInitialJson = [];
          try {
            requestAttachmentsInitialJson = JSON.parse(${JSON.stringify('__REPLACE__')} || '[]');
          } catch (e) { requestAttachmentsInitialJson = []; }
          \${getDynamicCustomerAttachmentsScript()}
          initDynamicCustomerAttachments({
            hiddenInputId: 'request_attachments_json',
            listContainerId: 'request_attachments_list',
            addButtonId: 'request_add_attachment_btn',
            customerId: editRequestPageCtx.customerId,
            initialAttachments: requestAttachmentsInitialJson
          });

`

// Simpler: embed in HTML as script tag - find editRequestPageCtx script and add another json script
// For now patch with template literal that will be in the TS return string

fs.writeFileSync(path, s)
console.log('use manual str replace')
