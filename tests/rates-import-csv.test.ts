import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'

async function importRates(
  db: D1Database,
  tenantId: number,
  rates: Record<string, unknown>[]
) {
  let created = 0
  let updated = 0
  const errors: string[] = []

  for (let i = 0; i < rates.length; i++) {
    const rateData = rates[i] || {}
    const bank_id = Number(rateData.bank_id)
    const financing_type_id = Number(rateData.financing_type_id)
    const rate = rateData.rate

    if (!bank_id || !financing_type_id || rate === undefined || rate === null || rate === '') {
      errors.push(`Row ${i + 1}: invalid`)
      continue
    }

    const existing = await db
      .prepare(
        `SELECT id FROM bank_financing_rates
         WHERE bank_id = ? AND financing_type_id = ? AND tenant_id = ?
         LIMIT 1`
      )
      .bind(bank_id, financing_type_id, tenantId)
      .first<{ id: number }>()

    if (existing?.id) {
      await db
        .prepare(
          `UPDATE bank_financing_rates SET rate = ? WHERE id = ? AND tenant_id = ?`
        )
        .bind(rate, existing.id, tenantId)
        .run()
      updated++
    } else {
      await db
        .prepare(
          `INSERT INTO bank_financing_rates
           (bank_id, financing_type_id, rate, tenant_id, is_active)
           VALUES (?, ?, ?, ?, 1)`
        )
        .bind(bank_id, financing_type_id, rate, tenantId)
        .run()
      created++
    }
  }

  return { created, updated, errors }
}

describe('rates CSV import logic', () => {
  it('inserts new rows and updates existing bank+type+tenant', async () => {
    const sqlite = new Database(':memory:')
    sqlite.exec(`
      CREATE TABLE bank_financing_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bank_id INTEGER NOT NULL,
        financing_type_id INTEGER NOT NULL,
        rate REAL NOT NULL,
        tenant_id INTEGER,
        is_active INTEGER DEFAULT 1
      );
    `)
    const db = createSqliteD1(sqlite)

    const first = await importRates(db, 1, [
      { bank_id: 10, financing_type_id: 20, rate: 4.5 }
    ])
    assert.equal(first.created, 1)
    assert.equal(first.updated, 0)

    const second = await importRates(db, 1, [
      { bank_id: 10, financing_type_id: 20, rate: 5.25 }
    ])
    assert.equal(second.created, 0)
    assert.equal(second.updated, 1)

    const row = await db
      .prepare(
        `SELECT rate FROM bank_financing_rates
         WHERE bank_id = 10 AND financing_type_id = 20 AND tenant_id = 1`
      )
      .first<{ rate: number }>()
    assert.equal(row?.rate, 5.25)
  })
})
