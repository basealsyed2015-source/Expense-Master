import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'
import {
  allocateTenantUserNumber,
  allocateTenantCustomerNumber,
} from '../src/tenant-local-numbers.ts'

const here = dirname(fileURLToPath(import.meta.url))
const migrationSql = readFileSync(
  resolve(here, '..', 'migrations', '0129_tenant_local_numbers.sql'),
  'utf8',
)

function createSchema(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE tenants (id INTEGER PRIMARY KEY);
    CREATE TABLE banks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER
    );
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT,
      tenant_id INTEGER,
      role_id INTEGER,
      assigned_bank_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT,
      tenant_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE hr_employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER,
      employee_code TEXT UNIQUE,
      employee_number TEXT
    );
    -- Stand in for the triggers we intend to drop.
    CREATE TRIGGER trg_users_role5_set_tenant_ins AFTER INSERT ON users
    WHEN NEW.role_id = 5 AND NEW.tenant_id IS NULL AND NEW.assigned_bank_id IS NOT NULL
    BEGIN
      UPDATE users
      SET tenant_id = (SELECT b.tenant_id FROM banks b WHERE b.id = NEW.assigned_bank_id)
      WHERE id = NEW.id;
    END;
    CREATE TRIGGER trg_users_role5_set_tenant_upd AFTER UPDATE OF assigned_bank_id, role_id ON users
    WHEN NEW.role_id = 5 AND NEW.tenant_id IS NULL AND NEW.assigned_bank_id IS NOT NULL
    BEGIN
      UPDATE users
      SET tenant_id = (SELECT b.tenant_id FROM banks b WHERE b.id = NEW.assigned_bank_id)
      WHERE id = NEW.id;
    END;
    CREATE TRIGGER trg_banks_propagate_tenant AFTER UPDATE OF tenant_id ON banks
    WHEN NEW.tenant_id IS NOT NULL
    BEGIN
      UPDATE users SET tenant_id = NEW.tenant_id
      WHERE assigned_bank_id = NEW.id AND role_id = 5;
    END;
  `)
  return db
}

function seedHistoricalRows(db: Database.Database) {
  // Tenant 1: three users, two customers with staggered timestamps.
  db.prepare(
    `INSERT INTO users (id, full_name, tenant_id, role_id, created_at)
     VALUES (1, 'u-a', 1, 2, '2024-01-01 00:00:00'),
            (2, 'u-b', 1, 4, '2024-01-02 00:00:00'),
            (3, 'u-c', 1, 4, '2024-01-03 00:00:00')`,
  ).run()
  db.prepare(
    `INSERT INTO users (id, full_name, tenant_id, role_id, created_at)
     VALUES (4, 'v-a', 2, 2, '2024-01-01 00:00:00'),
            (5, 'v-b', 2, 4, '2024-02-01 00:00:00')`,
  ).run()
  // Super-admin with no tenant should not receive a number.
  db.prepare(
    `INSERT INTO users (id, full_name, tenant_id, role_id, created_at)
     VALUES (99, 'root', NULL, 1, '2023-01-01 00:00:00')`,
  ).run()
  db.prepare(
    `INSERT INTO customers (id, full_name, tenant_id, created_at)
     VALUES (10, 'c1', 1, '2024-01-01 00:00:00'),
            (11, 'c2', 1, '2024-01-05 00:00:00'),
            (12, 'd1', 2, '2024-01-01 00:00:00')`,
  ).run()
}

function applyMigration(db: Database.Database) {
  db.exec(migrationSql)
}

describe('tenant-local numbers migration', () => {
  it('drops legacy 0079 triggers so bank changes no longer shift users', () => {
    const db = createSchema()
    db.prepare(`INSERT INTO banks (id, tenant_id) VALUES (100, 1)`).run()
    db.prepare(
      `INSERT INTO users (id, full_name, role_id, tenant_id, assigned_bank_id, created_at)
       VALUES (50, 'agent', 5, 1, 100, '2024-01-01 00:00:00')`,
    ).run()

    // Sanity: the legacy trigger is present before migration and would move the agent.
    const triggersBefore = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'trigger'`)
      .all() as { name: string }[]
    assert.ok(triggersBefore.some((r) => r.name === 'trg_banks_propagate_tenant'))

    applyMigration(db)

    const triggersAfter = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'trigger'`)
      .all() as { name: string }[]
    const names = triggersAfter.map((r) => r.name)
    assert.ok(!names.includes('trg_users_role5_set_tenant_ins'))
    assert.ok(!names.includes('trg_users_role5_set_tenant_upd'))
    assert.ok(!names.includes('trg_banks_propagate_tenant'))
    assert.ok(names.includes('trg_users_tenant_id_immutable'))
    assert.ok(names.includes('trg_banks_tenant_id_immutable'))
  })

  it('backfills tenant serials from 1 per tenant in chronological order', () => {
    const db = createSchema()
    seedHistoricalRows(db)
    applyMigration(db)

    const users = db
      .prepare(`SELECT id, tenant_id, tenant_user_number FROM users ORDER BY id`)
      .all() as { id: number; tenant_id: number | null; tenant_user_number: number | null }[]

    const byId = new Map(users.map((u) => [u.id, u]))
    assert.equal(byId.get(1)!.tenant_user_number, 1)
    assert.equal(byId.get(2)!.tenant_user_number, 2)
    assert.equal(byId.get(3)!.tenant_user_number, 3)
    assert.equal(byId.get(4)!.tenant_user_number, 1)
    assert.equal(byId.get(5)!.tenant_user_number, 2)
    assert.equal(byId.get(99)!.tenant_user_number, null)

    const customers = db
      .prepare(`SELECT id, tenant_customer_number FROM customers ORDER BY id`)
      .all() as { id: number; tenant_customer_number: number | null }[]
    assert.deepEqual(
      customers.map((c) => c.tenant_customer_number),
      [1, 2, 1],
    )
  })

  it('allocates the next serial per tenant at creation and never reuses on delete', async () => {
    const db = createSchema()
    seedHistoricalRows(db)
    applyMigration(db)
    const d1 = createSqliteD1(db)

    // Insert a fresh user into tenant 1 — should get #4.
    const ins = db
      .prepare(
        `INSERT INTO users (full_name, tenant_id, role_id, created_at)
         VALUES ('u-d', 1, 4, '2024-02-01 00:00:00')`,
      )
      .run()
    await allocateTenantUserNumber(d1, Number(ins.lastInsertRowid), 1)

    const newRow = db
      .prepare(`SELECT tenant_user_number FROM users WHERE id = ?`)
      .get(Number(ins.lastInsertRowid)) as { tenant_user_number: number }
    assert.equal(newRow.tenant_user_number, 4)

    // Delete #2 and add another — the new one takes #5, not #2's slot.
    db.prepare(`DELETE FROM users WHERE id = 2`).run()
    const ins2 = db
      .prepare(
        `INSERT INTO users (full_name, tenant_id, role_id, created_at)
         VALUES ('u-e', 1, 4, '2024-02-02 00:00:00')`,
      )
      .run()
    await allocateTenantUserNumber(d1, Number(ins2.lastInsertRowid), 1)
    const afterDelete = db
      .prepare(`SELECT tenant_user_number FROM users WHERE id = ?`)
      .get(Number(ins2.lastInsertRowid)) as { tenant_user_number: number }
    assert.equal(afterDelete.tenant_user_number, 5)
  })

  it('another tenant starts from 1 independent of others', async () => {
    const db = createSchema()
    seedHistoricalRows(db)
    applyMigration(db)
    const d1 = createSqliteD1(db)

    db.prepare(`INSERT INTO tenants (id) VALUES (3)`).run()
    const ins = db
      .prepare(
        `INSERT INTO users (full_name, tenant_id, role_id, created_at)
         VALUES ('w-a', 3, 4, '2024-03-01 00:00:00')`,
      )
      .run()
    await allocateTenantUserNumber(d1, Number(ins.lastInsertRowid), 3)
    const row = db
      .prepare(`SELECT tenant_user_number FROM users WHERE id = ?`)
      .get(Number(ins.lastInsertRowid)) as { tenant_user_number: number }
    assert.equal(row.tenant_user_number, 1)
  })

  it('rejects cross-tenant reassignment for users', () => {
    const db = createSchema()
    seedHistoricalRows(db)
    applyMigration(db)
    assert.throws(
      () => db.prepare(`UPDATE users SET tenant_id = 2 WHERE id = 1`).run(),
      /users\.tenant_id is immutable/,
    )
    // Same value is a no-op and is allowed.
    db.prepare(`UPDATE users SET tenant_id = 1 WHERE id = 1`).run()
  })

  it('rejects cross-tenant reassignment for banks', () => {
    const db = createSchema()
    seedHistoricalRows(db)
    db.prepare(`INSERT INTO banks (id, tenant_id) VALUES (200, 1)`).run()
    applyMigration(db)
    assert.throws(
      () => db.prepare(`UPDATE banks SET tenant_id = 2 WHERE id = 200`).run(),
      /banks\.tenant_id is immutable/,
    )
  })

  it('enforces per-tenant uniqueness via the partial unique index', () => {
    const db = createSchema()
    seedHistoricalRows(db)
    applyMigration(db)
    // Same number in a different tenant is allowed.
    db.prepare(`INSERT INTO users (full_name, tenant_id, role_id, tenant_user_number) VALUES ('x', 3, 4, 1)`).run()
    // But two rows with the same (tenant, number) collide.
    assert.throws(
      () => db.prepare(
        `INSERT INTO users (full_name, tenant_id, role_id, tenant_user_number) VALUES ('y', 3, 4, 1)`,
      ).run(),
      /UNIQUE/i,
    )
  })

  it('rewrites HR employee_number to the linked user tenant_user_number', () => {
    const db = createSchema()
    seedHistoricalRows(db)
    // Link user 2 (tenant 1) and user 5 (tenant 2) into hr_employees; also a
    // seed row that was never linked to a user.
    db.prepare(
      `INSERT INTO hr_employees (tenant_id, employee_code, employee_number)
       VALUES (1, 'USR2', 'USR2'),
              (2, 'USR5', 'USR5'),
              (1, 'EMP001', 'EMP001')`,
    ).run()

    applyMigration(db)

    const rows = db
      .prepare(
        `SELECT employee_code, employee_number FROM hr_employees ORDER BY employee_code`,
      )
      .all() as { employee_code: string; employee_number: string }[]
    const byCode = new Map(rows.map((r) => [r.employee_code, r.employee_number]))
    // User 2 is tenant 1's second user → tenant_user_number = 2.
    assert.equal(byCode.get('USR2'), '2')
    // User 5 is tenant 2's second user → tenant_user_number = 2.
    assert.equal(byCode.get('USR5'), '2')
    // Seed employee unchanged.
    assert.equal(byCode.get('EMP001'), 'EMP001')
  })

  it('allocates customer numbers with independent per-tenant sequences', async () => {
    const db = createSchema()
    seedHistoricalRows(db)
    applyMigration(db)
    const d1 = createSqliteD1(db)

    const ins = db
      .prepare(`INSERT INTO customers (full_name, tenant_id) VALUES ('c-new', 1)`)
      .run()
    await allocateTenantCustomerNumber(d1, Number(ins.lastInsertRowid), 1)
    const row = db
      .prepare(`SELECT tenant_customer_number FROM customers WHERE id = ?`)
      .get(Number(ins.lastInsertRowid)) as { tenant_customer_number: number }
    assert.equal(row.tenant_customer_number, 3)
  })
})
