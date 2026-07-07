import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import {
  findBankDuplicate,
  bankDuplicateMessage,
  mapBankDbError,
} from '../src/bank-tenant-uniqueness.ts'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'

const BANK_NAME = 'البنك الأهلي'
const BANK_CODE = 'AHLI'

function createBanksDb(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE banks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_name TEXT NOT NULL,
      bank_code TEXT,
      logo_url TEXT,
      is_active INTEGER DEFAULT 1,
      tenant_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX idx_banks_tenant_bank_name
      ON banks (COALESCE(tenant_id, -1), bank_name);
    CREATE UNIQUE INDEX idx_banks_tenant_bank_code
      ON banks (COALESCE(tenant_id, -1), bank_code)
      WHERE bank_code IS NOT NULL AND TRIM(bank_code) != '';
  `)
  return db
}

function insertBank(
  db: Database.Database,
  tenantId: number,
  bankName: string,
  bankCode: string
): number {
  const info = db
    .prepare(
      `INSERT INTO banks (bank_name, bank_code, is_active, tenant_id)
       VALUES (?, ?, 1, ?)`
    )
    .run(bankName, bankCode, tenantId)
  return Number(info.lastInsertRowid)
}

describe('bank tenant uniqueness', () => {
  it('allows the same bank name for different tenants', async () => {
    const raw = createBanksDb()
    const d1 = createSqliteD1(raw)
    insertBank(raw, 1, BANK_NAME, 'A1')

    const beforeSecondTenant = await findBankDuplicate(d1, {
      tenantId: 2,
      bankName: BANK_NAME,
      bankCode: 'A2',
    })
    assert.equal(beforeSecondTenant, null)

    insertBank(raw, 2, BANK_NAME, 'A2')

    const count = raw.prepare('SELECT COUNT(*) AS c FROM banks WHERE bank_name = ?').get(BANK_NAME) as {
      c: number
    }
    assert.equal(count.c, 2)

    const dupSameTenant = await findBankDuplicate(d1, {
      tenantId: 1,
      bankName: BANK_NAME,
      bankCode: 'X',
    })
    assert.equal(dupSameTenant, 'name')
  })

  it('detects duplicate bank name within the same tenant', async () => {
    const raw = createBanksDb()
    const d1 = createSqliteD1(raw)
    insertBank(raw, 10, BANK_NAME, BANK_CODE)

    const dup = await findBankDuplicate(d1, {
      tenantId: 10,
      bankName: '  البنك الأهلي  ',
      bankCode: 'OTHER',
    })
    assert.equal(dup, 'name')
  })

  it('detects duplicate bank code within the same tenant', async () => {
    const raw = createBanksDb()
    const d1 = createSqliteD1(raw)
    insertBank(raw, 10, 'بنك مختلف', BANK_CODE)

    const dup = await findBankDuplicate(d1, {
      tenantId: 10,
      bankName: 'اسم جديد',
      bankCode: BANK_CODE,
    })
    assert.equal(dup, 'code')
  })

  it('excludes the current bank id when checking updates', async () => {
    const raw = createBanksDb()
    const d1 = createSqliteD1(raw)
    const id = insertBank(raw, 10, BANK_NAME, BANK_CODE)

    const dup = await findBankDuplicate(d1, {
      tenantId: 10,
      bankName: BANK_NAME,
      bankCode: BANK_CODE,
      excludeId: id,
    })
    assert.equal(dup, null)
  })

  it('returns Arabic duplicate messages', () => {
    assert.match(bankDuplicateMessage('name'), /شركتك/)
    assert.match(bankDuplicateMessage('code'), /الكود/)
  })

  it('maps D1 UNIQUE constraint errors to Arabic messages', () => {
    assert.equal(
      mapBankDbError(new Error('D1_ERROR: UNIQUE constraint failed: idx_banks_tenant_bank_name')),
      bankDuplicateMessage('name')
    )
    assert.equal(
      mapBankDbError(new Error('UNIQUE constraint failed: idx_banks_tenant_bank_code')),
      bankDuplicateMessage('code')
    )
    assert.equal(mapBankDbError(new Error('some other error')), null)
  })

  it('enforces per-tenant uniqueness at the database level', () => {
    const raw = createBanksDb()
    insertBank(raw, 5, BANK_NAME, BANK_CODE)

    assert.throws(
      () => insertBank(raw, 5, BANK_NAME, 'OTHER'),
      /UNIQUE constraint/
    )

    assert.doesNotThrow(() => insertBank(raw, 6, BANK_NAME, 'OTHER'))
  })
})
