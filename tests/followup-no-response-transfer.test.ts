/**
 * After 48h, a no-response follow-up is auto-transferred to the next agent.
 * The transferred task must remain a no-response task (not drop into the
 * regular my-tasks list), with a fresh 48h countdown for the new assignee.
 * Bank agents (roles 5/15) are excluded from the auto-transfer pool.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { createSqliteD1 } from './helpers/sqlite-d1.ts'
import {
  listNoResponseTransferStaff,
  pickNextNoResponseAssignee,
} from '../src/followup-transfer-logs.ts'

const INDEX_SRC = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')
const NOTIF_SRC = readFileSync(join(process.cwd(), 'src', 'notification-access.ts'), 'utf8')
const LOGS_SRC = readFileSync(join(process.cwd(), 'src', 'followup-transfer-logs.ts'), 'utf8')

const TENANT = 3
const EMP_A = 41
const EMP_B = 42
const EMP_C = 43
const BANK_AGENT = 51
const BANK_AGENT_15 = 52
const DUAL_ROLE6 = 61

function seedUsersDb(): Database.Database {
  const db = new Database(':memory:')
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      full_name TEXT,
      username TEXT,
      tenant_id INTEGER,
      role_id INTEGER,
      assigned_bank_id INTEGER,
      is_active INTEGER DEFAULT 1
    );
    CREATE TABLE banks (
      id INTEGER PRIMARY KEY,
      tenant_id INTEGER
    );
  `)
  db.prepare('INSERT INTO banks (id, tenant_id) VALUES (1, ?)').run(TENANT)
  const ins = db.prepare(
    'INSERT INTO users (id, full_name, username, tenant_id, role_id, assigned_bank_id, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
  )
  // Name order: Ahmad, BankAgent, Dual, EmpB, EmpC, Role15Agent
  ins.run(EMP_A, 'Ahmad', 'ahmad', TENANT, 4, null)
  ins.run(BANK_AGENT, 'BankAgent', 'ba', TENANT, 5, 1)
  ins.run(DUAL_ROLE6, 'Dual', 'dual', TENANT, 6, null)
  ins.run(EMP_B, 'EmpB', 'empb', TENANT, 4, null)
  ins.run(EMP_C, 'EmpC', 'empc', TENANT, 14, null)
  ins.run(BANK_AGENT_15, 'Role15Agent', 'r15', TENANT, 15, 1)
  // Inactive employee must not be selected
  db.prepare(
    'INSERT INTO users (id, full_name, username, tenant_id, role_id, is_active) VALUES (?, ?, ?, ?, 4, 0)',
  ).run(99, 'Inactive', 'inactive', TENANT)
  return db
}

describe('no-response auto-transfer — source invariants', () => {
  it('keeps is_no_response and resets the 48h clock instead of clearing the flag', () => {
    const fnStart = INDEX_SRC.indexOf('async function processNoResponseTransfers')
    assert.ok(fnStart >= 0, 'expected processNoResponseTransfers')
    const fnBody = INDEX_SRC.slice(fnStart, fnStart + 4500)

    assert.match(
      fnBody,
      /SET is_no_response = 1,\s*no_response_at = CURRENT_TIMESTAMP/,
      'transfer must keep the task as no-response with a fresh timer',
    )
    assert.doesNotMatch(
      fnBody,
      /SET is_no_response = 0,\s*no_response_at = NULL,\s*no_response_by = NULL/,
      'transfer must not clear the no-response flag',
    )
  })

  it('routes transfer-in notifications to the no-response tasks page', () => {
    const fnStart = NOTIF_SRC.indexOf('export async function insertFollowupNoResponseTransferNotification')
    assert.ok(fnStart >= 0, 'expected insertFollowupNoResponseTransferNotification')
    const fnBody = NOTIF_SRC.slice(fnStart, fnStart + 1200)

    assert.match(fnBody, /linkUrl = opts\.linkUrl \?\? '\/admin\/my-no-response-tasks'/)
    assert.doesNotMatch(fnBody, /\/admin\/my-tasks/)
  })

  it('wires processNoResponseTransfers to the employee-only staff helpers', () => {
    const fnStart = INDEX_SRC.indexOf('async function processNoResponseTransfers')
    assert.ok(fnStart >= 0)
    const fnBody = INDEX_SRC.slice(fnStart, fnStart + 2500)
    assert.match(fnBody, /listNoResponseTransferStaff/)
    assert.match(fnBody, /pickNextNoResponseAssignee/)
    assert.match(LOGS_SRC, /role_id IN \(4, 6, 14\)/)
    assert.doesNotMatch(LOGS_SRC, /role_id IN \(5, 15/)
  })
})

describe('no-response auto-transfer — bank agents excluded', () => {
  it('staff pool includes employees/role6 but never role 5 or 15', async () => {
    const raw = seedUsersDb()
    const d1 = createSqliteD1(raw)
    const staff = await listNoResponseTransferStaff(d1, TENANT)
    const ids = staff.map((s) => s.id)

    assert.deepEqual(ids.sort((a, b) => a - b), [EMP_A, EMP_B, EMP_C, DUAL_ROLE6].sort((a, b) => a - b))
    assert.ok(!ids.includes(BANK_AGENT), 'role 5 bank agent must not be in pool')
    assert.ok(!ids.includes(BANK_AGENT_15), 'role 15 bank agent must not be in pool')
    assert.ok(!ids.includes(99), 'inactive employee must not be in pool')
  })

  it('round-robin never picks a bank agent even when cursor points at one', async () => {
    const raw = seedUsersDb()
    const d1 = createSqliteD1(raw)
    const staff = await listNoResponseTransferStaff(d1, TENANT)
    const staffIds = staff.map((s) => s.id)

    // Cursor pretend-last is the bank agent id (stale cursor from older pool).
    // Next pick must still be an employee from the employee-only list.
    const next = pickNextNoResponseAssignee(staffIds, EMP_A, BANK_AGENT)
    assert.ok(next != null)
    assert.ok(staffIds.includes(next!))
    assert.notEqual(next, BANK_AGENT)
    assert.notEqual(next, BANK_AGENT_15)

    // Simulate several hops — never land on bank agent ids.
    let last: number | null = next
    let current = EMP_A
    for (let i = 0; i < 20; i++) {
      const pick = pickNextNoResponseAssignee(staffIds, current, last)
      assert.ok(pick != null)
      assert.ok(![BANK_AGENT, BANK_AGENT_15].includes(pick!), `hop ${i} picked bank agent ${pick}`)
      assert.ok(staffIds.includes(pick!))
      current = pick!
      last = pick
    }
  })

  it('when current assignee is a bank agent, transfer moves to an employee', async () => {
    const raw = seedUsersDb()
    const d1 = createSqliteD1(raw)
    const staff = await listNoResponseTransferStaff(d1, TENANT)
    const staffIds = staff.map((s) => s.id)

    const next = pickNextNoResponseAssignee(staffIds, BANK_AGENT, null)
    assert.ok(next != null)
    assert.ok(staffIds.includes(next!))
    assert.notEqual(next, BANK_AGENT)
  })
})
