import fs from 'fs'

const path = 'src/index.tsx'
let s = fs.readFileSync(path, 'utf8')

const start = s.indexOf('          function handleAttachmentSelect(type) {')
const end = s.indexOf('          (function jobTypeToggle() {', start)
if (start !== -1 && end !== -1) {
  s = s.slice(0, start) + s.slice(end)
  console.log('removed handleAttachmentSelect block')
} else {
  console.log('handleAttachmentSelect block not found', start, end)
}

fs.writeFileSync(path, s)
