import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatHijriDate, getHijriDateParts } from '../src/hijri.ts'
import { formatWorkflowActionTimestamp } from '../src/notification-access.ts'

describe('Hijri calendar (Umm al-Qura)', () => {
  it('maps 27 Aug 2026 to 14 Rabi I 1448, not the astronomical 15', () => {
    const when = new Date('2026-08-27T12:00:00+03:00')
    const parts = getHijriDateParts(when)
    assert.deepEqual(parts, { year: 1448, month: 3, day: 14 })

    const islamic = new Intl.DateTimeFormat('en-u-ca-islamic', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Riyadh',
    }).formatToParts(when)
    const islamicDay = Number(islamic.find((part) => part.type === 'day')?.value)
    assert.equal(islamicDay, 15)
  })

  it('formats workflow timestamps with Umm al-Qura', () => {
    const when = new Date('2026-08-27T12:00:00+03:00')
    const { hijriDate } = formatWorkflowActionTimestamp(when)
    assert.ok(hijriDate.startsWith('١٤ '))
    assert.equal(hijriDate.startsWith('١٥'), false)
    assert.match(hijriDate, /ربيع الأول/)
    assert.match(hijriDate, /١٤٤٨/)
    assert.equal(formatHijriDate(when), hijriDate)
  })
})
