/** Tab delimiter — Excel "Unicode text" style; works with UTF-16LE on Arabic Windows. */
export const EXCEL_FIELD_DELIM = '\t'

/** No sep= line (breaks UTF-8/UTF-16 BOM detection in Excel). */
export const HTML_CSV_PREFIX = "''"

/** Paste once per page before export handlers. */
export const HTML_CSV_UTF16_DOWNLOAD_SCRIPT = `
function downloadUtf16Csv(csvText, filename) {
  const n = csvText.length;
  const bytes = new Uint8Array(2 + n * 2);
  bytes[0] = 255;
  bytes[1] = 254;
  for (let i = 0; i < n; i++) {
    const c = csvText.charCodeAt(i);
    const o = 2 + i * 2;
    bytes[o] = c & 255;
    bytes[o + 1] = (c >> 8) & 255;
  }
  const blob = new Blob([bytes], { type: 'application/vnd.ms-excel;charset=utf-16le' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
`

export function sanitizeCsvCell(value: unknown): string {
  return String(value ?? '')
    .replace(/\uFEFF/g, '')
    .replace(/[\u200E\u200F]/g, '')
}

export function escapeCsvCell(value: unknown): string {
  const str = sanitizeCsvCell(value)
  if (/[",\r\n\t]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export function buildCsvContent(
  rows: string[][],
  delimiter: string = EXCEL_FIELD_DELIM
): string {
  return rows.map((row) => row.map(escapeCsvCell).join(delimiter)).join('\r\n') + '\r\n'
}

/** UTF-16 LE with BOM (FF FE) for Excel on Arabic Windows. */
export function encodeUtf16LeWithBom(text: string): Uint8Array {
  const out = new Uint8Array(2 + text.length * 2)
  out[0] = 0xff
  out[1] = 0xfe
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    const o = 2 + i * 2
    out[o] = c & 0xff
    out[o + 1] = (c >> 8) & 0xff
  }
  return out
}

export function csvAttachmentResponse(csv: string, filename: string): Response {
  const asciiName = filename.replace(/[^\x20-\x7E]/g, '_') || 'export.csv'
  const bytes = encodeUtf16LeWithBom(csv)
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-16le',
      'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}

function escapeSpreadsheetXml(value: unknown): string {
  return sanitizeCsvCell(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Excel 2003 XML — opens in Excel with correct Arabic (no encoding guesswork). */
export function buildSpreadsheetML(rows: string[][], sheetName = 'Sheet1'): string {
  const rowXml = rows
    .map(
      (row) =>
        '<Row>' +
        row
          .map(
            (cell) =>
              `<Cell><Data ss:Type="String">${escapeSpreadsheetXml(cell)}</Data></Cell>`
          )
          .join('') +
        '</Row>'
    )
    .join('')

  const safeSheet = escapeSpreadsheetXml(sheetName)

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\r\n` +
    `<?mso-application progid="Excel.Sheet"?>\r\n` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ` +
    `xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\r\n` +
    `<Worksheet ss:Name="${safeSheet}">\r\n` +
    `<Table>\r\n${rowXml}\r\n</Table>\r\n` +
    `</Worksheet>\r\n</Workbook>`
  )
}

export function spreadsheetMLAttachmentResponse(xml: string, filename: string): Response {
  const asciiName = filename.replace(/[^\x20-\x7E]/g, '_') || 'export.xls'
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
