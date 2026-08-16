export type FollowupImportFieldKey = 'phone' | 'name' | 'task_title' | 'priority' | 'scheduled_at' | 'skip'

export interface FollowupImportField {
  key: FollowupImportFieldKey
  labelAr: string
  required: boolean
  synonyms: string[]
}

export type ColumnMapping = Record<number, FollowupImportFieldKey | null>

export interface FollowupImportRow {
  name: string
  phone: string
  task_title: string
  priority: string
  scheduled_at: string
  scheduled_at_raw: string
  schedule_status: 'valid' | 'invalid' | 'missing'
}

export function normalizeImportHeader(raw: string): string {
  let s = String(raw ?? '')
  s = s.replace(/^﻿/, '').replace(/[‏‎]/g, '')
  s = s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  s = s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
  s = s.trim()
  s = s.replace(/[a-zA-Z]+/g, (m) => m.toLowerCase())
  s = s.replace(/[ؐ-ًؚ-ٟ]/g, '')
  s = s.replace(/\s+/g, ' ').trim()
  s = s.replace(/[.,;:()\[\]#@\-_]/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}

export const FOLLOWUP_IMPORT_FIELDS: FollowupImportField[] = [
  {
    key: 'phone',
    labelAr: 'الهاتف',
    required: true,
    synonyms: [
      'phone', 'mobile', 'tel', 'telephone', 'cell', 'whatsapp', 'wa', 'contact', 'contacts',
      'customer phone', 'client phone', 'mob', 'number', 'phonenumber', 'mobilenumber',
      'الهاتف', 'الجوال', 'جوال', 'رقم', 'رقم الجوال', 'رقم الهاتف', 'موبايل', 'واتساب',
      'هاتف', 'هاتف العميل', 'رقم الموبايل', 'رقم التواصل', 'رقم الواتس',
    ],
  },
  {
    key: 'name',
    labelAr: 'الاسم',
    required: false,
    synonyms: [
      'name', 'full name', 'fullname', 'customer name', 'client name', 'customer', 'client',
      'lead name', 'person', 'contact name',
      'الاسم', 'اسم العميل', 'اسم', 'الاسم الكامل', 'العميل',
    ],
  },
  {
    key: 'task_title',
    labelAr: 'عنوان المهمة',
    required: false,
    synonyms: [
      'task', 'task title', 'title', 'subject', 'task name', 'task subject',
      'عنوان المهمة', 'عنوان', 'المهمة', 'موضوع',
    ],
  },
  {
    key: 'priority',
    labelAr: 'الأولوية',
    required: false,
    synonyms: [
      'priority', 'importance', 'level', 'urgency',
      'الأولوية', 'أولوية', 'الأهمية',
    ],
  },
  {
    key: 'scheduled_at',
    labelAr: 'موعد المهمة',
    required: false,
    synonyms: [
      'date', 'scheduled', 'scheduled at', 'schedule', 'time', 'datetime', 'appointment',
      'follow up date', 'followup date', 'due date', 'duedate',
      'موعد المهمة', 'موعد', 'تاريخ', 'الموعد', 'التاريخ', 'وقت',
    ],
  },
]

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    let prev = i
    for (let j = 1; j <= n; j++) {
      const curr = a[i - 1] === b[j - 1] ? dp[j - 1] : 1 + Math.min(dp[j], prev, dp[j - 1])
      dp[j - 1] = prev
      prev = curr
    }
    dp[n] = prev
  }
  return dp[n]
}

export function scoreHeaderMatch(normalizedHeader: string, field: FollowupImportField): number {
  if (!normalizedHeader) return 0
  let best = 0
  const h = normalizedHeader
  for (const rawSyn of field.synonyms) {
    const syn = normalizeImportHeader(rawSyn)
    if (!syn) continue
    if (h === syn) return 100
    if (syn.length >= 4 && (h.includes(syn) || syn.includes(h))) {
      best = Math.max(best, 85)
      continue
    }
    const hTokens = h.split(' ').filter(Boolean)
    const sTokens = syn.split(' ').filter(Boolean)
    if (hTokens.length && sTokens.length) {
      const hSet = new Set(hTokens)
      const sSet = new Set(sTokens)
      const shared = [...hSet].filter((t) => sSet.has(t)).length
      const total = new Set([...hTokens, ...sTokens]).size
      if (total) best = Math.max(best, Math.round((shared / total) * 80))
    }
    if (h.length >= 3 && syn.length >= 3) {
      const dist = levenshtein(h, syn)
      const maxLen = Math.max(h.length, syn.length)
      const ratio = 1 - dist / maxLen
      if (ratio >= 0.6) best = Math.max(best, Math.round(ratio * 70))
    }
  }
  return best
}

function isSaudiMobileCell(val: string): boolean {
  const s = String(val)
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
  const digits = s.replace(/\D/g, '')
  if (!digits) return false
  const local = digits.startsWith('00966')
    ? digits.slice(5)
    : digits.startsWith('966')
    ? digits.slice(3)
    : digits.startsWith('0')
    ? digits.slice(1)
    : digits
  return /^5\d{8}$/.test(local)
}

export function suggestColumnMapping(headers: string[], sampleRows: string[][] = []): ColumnMapping {
  const mapping: ColumnMapping = {}
  const normalizedHeaders = headers.map(normalizeImportHeader)
  const fields = FOLLOWUP_IMPORT_FIELDS

  const scores: number[][] = normalizedHeaders.map((h) => fields.map((field) => scoreHeaderMatch(h, field)))

  for (let c = 0; c < headers.length; c++) {
    if (scores[c][0] >= 50) continue
    const dataCells = sampleRows.slice(0, 20).map((row) => String(row[c] ?? ''))
    const nonEmpty = dataCells.filter((v) => v.trim())
    if (!nonEmpty.length) continue
    const phoneCount = nonEmpty.filter(isSaudiMobileCell).length
    if (phoneCount / nonEmpty.length >= 0.7) scores[c][0] = Math.max(scores[c][0], 75)
  }

  const candidates: { score: number; col: number; fieldIdx: number }[] = []
  for (let c = 0; c < normalizedHeaders.length; c++) {
    for (let f = 0; f < fields.length; f++) {
      if (scores[c][f] >= 50) candidates.push({ score: scores[c][f], col: c, fieldIdx: f })
    }
  }
  candidates.sort((a, b) => b.score - a.score)

  const usedCols = new Set<number>()
  const usedFields = new Set<number>()
  for (const { col, fieldIdx } of candidates) {
    if (usedCols.has(col) || usedFields.has(fieldIdx)) continue
    mapping[col] = fields[fieldIdx].key
    usedCols.add(col)
    usedFields.add(fieldIdx)
  }

  for (let c = 0; c < headers.length; c++) {
    if (!(c in mapping)) mapping[c] = null
  }

  return mapping
}

function normalizeCsvCell(v: unknown): string {
  return String(v == null ? '' : v)
    .replace(/^﻿/, '')
    .replace(/‏/g, '')
    .trim()
}

function isReadableSchedule(v: string): boolean {
  const s = v.trim()
  if (!s) return false
  return !Number.isNaN(new Date(s).getTime())
}

export function resolveImportSchedule(raw: unknown): {
  scheduled_at: string
  scheduled_at_raw: string
  schedule_status: 'valid' | 'invalid' | 'missing'
} {
  const scheduled_at_raw = normalizeCsvCell(raw)
  if (!scheduled_at_raw) return { scheduled_at: '', scheduled_at_raw: '', schedule_status: 'missing' }
  if (isReadableSchedule(scheduled_at_raw))
    return { scheduled_at: scheduled_at_raw, scheduled_at_raw, schedule_status: 'valid' }
  return { scheduled_at: '', scheduled_at_raw, schedule_status: 'invalid' }
}

export function applyColumnMapping(rawRows: string[][], mapping: ColumnMapping): FollowupImportRow[] {
  const results: FollowupImportRow[] = []
  const colForKey = (key: FollowupImportFieldKey): number | undefined => {
    for (const [c, v] of Object.entries(mapping)) {
      if (v === key) return Number(c)
    }
    return undefined
  }
  for (const row of rawRows) {
    const get = (key: FollowupImportFieldKey): string => {
      const c = colForKey(key)
      return c !== undefined ? normalizeCsvCell(row[c]) : ''
    }
    const phone = get('phone')
    if (!phone) continue
    const schedule = resolveImportSchedule(get('scheduled_at'))
    results.push({
      name: get('name'),
      phone,
      task_title: get('task_title'),
      priority: get('priority'),
      ...schedule,
    })
  }
  return results
}
