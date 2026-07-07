import { readFileSync } from 'fs'
import { buildCsvContent, encodeUtf16LeWithBom } from '../src/csv-export.ts'

const w = readFileSync('dist/_worker.js', 'utf8')
console.log('arabic محمد in bundle:', w.includes('محمد'))
console.log('utf-16le content-type in bundle:', w.includes('charset=utf-16le'))
console.log('downloadUtf16Csv in bundle:', w.includes('downloadUtf16Csv'))

const csv = buildCsvContent([['الاسم'], ['محمد أحمد']])
const buf = Buffer.from(encodeUtf16LeWithBom(csv))
console.log('utf16 bom:', buf.slice(0, 2).toString('hex'), '(expect fffe)')
console.log('arabic ok:', buf.includes(Buffer.from('محمد', 'utf16le')))
