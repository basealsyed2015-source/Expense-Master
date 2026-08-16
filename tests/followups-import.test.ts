import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeImportHeader,
  scoreHeaderMatch,
  suggestColumnMapping,
  applyColumnMapping,
  resolveImportSchedule,
  FOLLOWUP_IMPORT_FIELDS,
} from '../src/followups-import.ts'

const phoneField = FOLLOWUP_IMPORT_FIELDS.find((f) => f.key === 'phone')!
const nameField = FOLLOWUP_IMPORT_FIELDS.find((f) => f.key === 'name')!
const priorityField = FOLLOWUP_IMPORT_FIELDS.find((f) => f.key === 'priority')!
const scheduleField = FOLLOWUP_IMPORT_FIELDS.find((f) => f.key === 'scheduled_at')!
const taskField = FOLLOWUP_IMPORT_FIELDS.find((f) => f.key === 'task_title')!

describe('normalizeImportHeader', () => {
  it('strips BOM', () => assert.equal(normalizeImportHeader('﻿phone'), 'phone'))
  it('strips RTL marks', () => assert.equal(normalizeImportHeader('‏هاتف'), 'هاتف'))
  it('lowercases latin', () => assert.equal(normalizeImportHeader('Phone'), 'phone'))
  it('converts Arabic-Indic digits', () => assert.equal(normalizeImportHeader('٥٠٠'), '500'))
  it('trims and collapses spaces', () => assert.equal(normalizeImportHeader('  Mobile  Number  '), 'mobile number'))
  it('removes hyphens', () => assert.equal(normalizeImportHeader('follow-up date'), 'follow up date'))
  it('leaves Arabic text intact', () => assert.equal(normalizeImportHeader('الهاتف'), 'الهاتف'))
})

describe('scoreHeaderMatch — phone field', () => {
  it('exact Arabic الهاتف → 100', () => {
    assert.equal(scoreHeaderMatch(normalizeImportHeader('الهاتف'), phoneField), 100)
  })
  it('exact English phone → 100', () => {
    assert.equal(scoreHeaderMatch(normalizeImportHeader('Phone'), phoneField), 100)
  })
  it('Mobile → 100 (exact synonym)', () => {
    assert.equal(scoreHeaderMatch(normalizeImportHeader('Mobile'), phoneField), 100)
  })
  it('رقم الجوال → 100 (exact synonym)', () => {
    assert.equal(scoreHeaderMatch(normalizeImportHeader('رقم الجوال'), phoneField), 100)
  })
  it('Mobile Number → ≥85 (contains match)', () => {
    assert.ok(scoreHeaderMatch(normalizeImportHeader('Mobile Number'), phoneField) >= 85)
  })
  it('WhatsApp → 100', () => {
    assert.equal(scoreHeaderMatch(normalizeImportHeader('WhatsApp'), phoneField), 100)
  })
  it('Notes → 0 (no match)', () => {
    assert.equal(scoreHeaderMatch(normalizeImportHeader('Notes'), phoneField), 0)
  })
  it('empty normalized header → 0', () => {
    assert.equal(scoreHeaderMatch('', phoneField), 0)
  })
})

describe('scoreHeaderMatch — other fields', () => {
  it('Customer Name → name field ≥50', () => {
    assert.ok(scoreHeaderMatch(normalizeImportHeader('Customer Name'), nameField) >= 50)
  })
  it('Priority Level → priority field ≥50', () => {
    assert.ok(scoreHeaderMatch(normalizeImportHeader('Priority Level'), priorityField) >= 50)
  })
  it('تاريخ → scheduled_at ≥50', () => {
    assert.ok(scoreHeaderMatch(normalizeImportHeader('تاريخ'), scheduleField) >= 50)
  })
  it('task title → task_title field 100', () => {
    assert.equal(scoreHeaderMatch(normalizeImportHeader('task title'), taskField), 100)
  })
})

describe('suggestColumnMapping', () => {
  it('standard Arabic template headers auto-map all 5 fields', () => {
    const headers = ['الاسم', 'الهاتف', 'عنوان المهمة', 'الأولوية', 'موعد المهمة']
    const mapping = suggestColumnMapping(headers)
    assert.equal(mapping[0], 'name')
    assert.equal(mapping[1], 'phone')
    assert.equal(mapping[2], 'task_title')
    assert.equal(mapping[3], 'priority')
    assert.equal(mapping[4], 'scheduled_at')
  })
  it('English headers: Name + Mobile auto-map', () => {
    const headers = ['Name', 'Mobile', 'Notes']
    const mapping = suggestColumnMapping(headers)
    assert.equal(mapping[0], 'name')
    assert.equal(mapping[1], 'phone')
    assert.equal(mapping[2], null)
  })
  it('extra columns get null (skip)', () => {
    const headers = ['Phone', 'Name', 'Campaign ID', 'UTM Source']
    const mapping = suggestColumnMapping(headers)
    assert.equal(mapping[0], 'phone')
    assert.equal(mapping[1], 'name')
    assert.equal(mapping[2], null)
    assert.equal(mapping[3], null)
  })
  it('phone detected by content heuristic when header is "Contact"', () => {
    const headers = ['Contact', 'Name']
    const sampleRows = [
      ['0512345678', 'Ahmed'],
      ['0598765432', 'Sara'],
      ['0556677889', 'Mohammed'],
    ]
    const mapping = suggestColumnMapping(headers, sampleRows)
    assert.equal(mapping[0], 'phone')
  })
  it('single column رقم maps to phone', () => {
    const headers = ['رقم']
    const mapping = suggestColumnMapping(headers)
    assert.equal(mapping[0], 'phone')
  })
  it('two phone-like columns → only one gets phone', () => {
    const headers = ['Mobile', 'Phone']
    const mapping = suggestColumnMapping(headers)
    const phoneCount = Object.values(mapping).filter((v) => v === 'phone').length
    assert.equal(phoneCount, 1)
  })
  it('blank header → null', () => {
    const headers = ['Phone', '', 'random_xyz_qwerty']
    const mapping = suggestColumnMapping(headers)
    assert.equal(mapping[0], 'phone')
    assert.equal(mapping[1], null)
    assert.equal(mapping[2], null)
  })
  it('random column order still maps correctly', () => {
    const headers = ['موعد المهمة', 'الهاتف', 'الاسم']
    const mapping = suggestColumnMapping(headers)
    assert.equal(mapping[0], 'scheduled_at')
    assert.equal(mapping[1], 'phone')
    assert.equal(mapping[2], 'name')
  })
})

describe('applyColumnMapping', () => {
  it('maps 5 columns correctly', () => {
    const rows = [['Ahmed', '0512345678', 'Follow up', 'high', '2025-01-15']]
    const mapping: Record<number, string | null> = {
      0: 'name', 1: 'phone', 2: 'task_title', 3: 'priority', 4: 'scheduled_at',
    }
    const result = applyColumnMapping(rows, mapping as any)
    assert.equal(result.length, 1)
    assert.equal(result[0].name, 'Ahmed')
    assert.equal(result[0].phone, '0512345678')
    assert.equal(result[0].task_title, 'Follow up')
    assert.equal(result[0].priority, 'high')
    assert.equal(result[0].schedule_status, 'valid')
    assert.equal(result[0].scheduled_at, '2025-01-15')
  })
  it('skips rows with empty phone cell', () => {
    const rows = [['Ahmed', ''], ['Sara', '0598765432']]
    const mapping: Record<number, string | null> = { 0: 'name', 1: 'phone' }
    const result = applyColumnMapping(rows, mapping as any)
    assert.equal(result.length, 1)
    assert.equal(result[0].name, 'Sara')
  })
  it('only phone+name mapped → task_title and priority empty', () => {
    const rows = [['Ahmed', '0512345678', 'Campaign A', 'extra']]
    const mapping: Record<number, string | null> = { 0: 'name', 1: 'phone', 2: null, 3: null }
    const result = applyColumnMapping(rows, mapping as any)
    assert.equal(result[0].task_title, '')
    assert.equal(result[0].priority, '')
  })
  it('invalid schedule string → schedule_status invalid', () => {
    const rows = [['Ahmed', '0512345678', '', '', 'not-a-date']]
    const mapping: Record<number, string | null> = {
      0: 'name', 1: 'phone', 2: 'task_title', 3: 'priority', 4: 'scheduled_at',
    }
    const result = applyColumnMapping(rows, mapping as any)
    assert.equal(result[0].schedule_status, 'invalid')
    assert.equal(result[0].scheduled_at, '')
    assert.equal(result[0].scheduled_at_raw, 'not-a-date')
  })
  it('empty schedule → schedule_status missing', () => {
    const rows = [['Ahmed', '0512345678', '', '', '']]
    const mapping: Record<number, string | null> = {
      0: 'name', 1: 'phone', 2: 'task_title', 3: 'priority', 4: 'scheduled_at',
    }
    const result = applyColumnMapping(rows, mapping as any)
    assert.equal(result[0].schedule_status, 'missing')
  })
  it('Arabic-Indic digits in phone preserved as-is (server normalizes)', () => {
    const rows = [['Ahmed', '٠٥١٢٣٤٥٦٧٨']]
    const mapping: Record<number, string | null> = { 0: 'name', 1: 'phone' }
    const result = applyColumnMapping(rows, mapping as any)
    assert.equal(result[0].phone, '٠٥١٢٣٤٥٦٧٨')
  })
  it('single-column sheet with phones only', () => {
    const rows = [['0512345678'], ['0598765432']]
    const mapping: Record<number, string | null> = { 0: 'phone' }
    const result = applyColumnMapping(rows, mapping as any)
    assert.equal(result.length, 2)
    assert.equal(result[0].phone, '0512345678')
    assert.equal(result[0].name, '')
  })
})

describe('resolveImportSchedule', () => {
  it('valid ISO date → valid', () => {
    const r = resolveImportSchedule('2025-01-15')
    assert.equal(r.schedule_status, 'valid')
    assert.equal(r.scheduled_at, '2025-01-15')
  })
  it('valid datetime string → valid', () => {
    const r = resolveImportSchedule('2025-01-15 10:30:00')
    assert.equal(r.schedule_status, 'valid')
  })
  it('empty string → missing', () => {
    const r = resolveImportSchedule('')
    assert.equal(r.schedule_status, 'missing')
    assert.equal(r.scheduled_at, '')
    assert.equal(r.scheduled_at_raw, '')
  })
  it('null → missing', () => {
    const r = resolveImportSchedule(null)
    assert.equal(r.schedule_status, 'missing')
  })
  it('invalid string → invalid, raw preserved', () => {
    const r = resolveImportSchedule('not-a-date')
    assert.equal(r.schedule_status, 'invalid')
    assert.equal(r.scheduled_at, '')
    assert.equal(r.scheduled_at_raw, 'not-a-date')
  })
  it('whitespace-only → missing', () => {
    const r = resolveImportSchedule('   ')
    assert.equal(r.schedule_status, 'missing')
  })
})
