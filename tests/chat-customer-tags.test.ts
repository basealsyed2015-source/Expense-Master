/**
 * Customer tagging in chat: server-side search must respect canUserAccessCustomer,
 * and sending a message with customer_ids must persist tags that the user is
 * allowed to access (silently dropping the others). Tags come back with the
 * message history including a display name snapshot.
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { registerChatModuleApi } from '../src/chat-module-api.ts'
import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'

function makeApp(opts: { db: D1Database; user: { userId: number | null; tenantId: number | null; roleId?: number | null } }) {
  const app = new Hono()
  const getUserInfo = async () => ({
    userId: opts.user.userId,
    tenantId: opts.user.tenantId,
    roleId: opts.user.roleId ?? 2,
    tokenRoleId: opts.user.roleId ?? 2,
    assignedBankId: null,
  })
  registerChatModuleApi(app as any, getUserInfo)
  const fakeRooms = { idFromName: () => ({}), get: () => ({ async fetch() { return new Response('ok') } }) } as any
  return async (path: string, init?: RequestInit) => {
    const env = {
      DB: opts.db,
      ATTACHMENTS: { put: async () => {}, get: async () => null } as any,
      CHAT_ROOMS: fakeRooms,
      USER_NOTIFICATIONS: fakeRooms,
      BROADCAST_ROOMS: fakeRooms,
    }
    const executionCtx = { waitUntil: (p: Promise<unknown>) => { void p } } as any
    const url = new URL(path, 'http://test.local').toString()
    return app.fetch(new Request(url, init), env, executionCtx)
  }
}

describe('chat customer tagging', () => {
  let rawDb: ReturnType<typeof createTestDb>
  let db: D1Database

  beforeEach(() => {
    rawDb = createTestDb()
    db = createSqliteD1(rawDb)
    rawDb.prepare(
      `INSERT INTO users (id, name, email, tenant_id, role_id, is_active) VALUES
       (1, 'Admin T1', 'a@t1', 10, 2, 1),
       (2, 'Bob T1',   'b@t1', 10, 2, 1),
       (3, 'Emp T1',   'e@t1', 10, 4, 1)`
    ).run()
    rawDb.prepare(
      `INSERT INTO customers (id, tenant_id, full_name, phone) VALUES
       (100, 10, 'Khalid Ahmed', '0501112222'),
       (101, 10, 'Khalid Other', '0502223333'),
       (102, 10, 'Sara Z',       '0509998888'),
       (200, 20, 'Foreign Tenant Cust', '0500000000')`
    ).run()
  })

  it('search returns tenant customers by name or phone, excludes other tenants', async () => {
    const req = makeApp({ db, user: { userId: 1, tenantId: 10, roleId: 2 } })
    const byName = await (await req('/api/chat/customers/search?q=Khalid')).json() as any
    assert.equal(byName.success, true)
    const ids = byName.customers.map((c: any) => c.id).sort()
    assert.deepEqual(ids, [100, 101])

    const byPhone = await (await req('/api/chat/customers/search?q=0509')).json() as any
    assert.deepEqual(byPhone.customers.map((c: any) => c.id), [102])

    const foreign = await (await req('/api/chat/customers/search?q=Foreign')).json() as any
    assert.equal(foreign.customers.length, 0)
  })

  it('role-4 employee only sees customers they are assigned to', async () => {
    rawDb.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (100, 3)`).run()
    const req = makeApp({ db, user: { userId: 3, tenantId: 10, roleId: 4 } })
    const res = await (await req('/api/chat/customers/search?q=Khalid')).json() as any
    assert.deepEqual(res.customers.map((c: any) => c.id), [100])
  })

  it('role-4 includes assigned archived and completed customers', async () => {
    rawDb.prepare(
      `INSERT INTO customers (id, tenant_id, full_name, phone, is_completed, is_archived) VALUES
       (110, 10, 'Done Client', '0503334444', 1, 0),
       (111, 10, 'Archived Client', '0504445555', 0, 1)`
    ).run()
    rawDb.prepare(
      `INSERT INTO customer_assignments (customer_id, employee_id) VALUES (110, 3), (111, 3)`
    ).run()
    const req = makeApp({ db, user: { userId: 3, tenantId: 10, roleId: 4 } })
    const empty = await (await req('/api/chat/customers/search?q=&limit=10')).json() as any
    assert.deepEqual(
      empty.customers.map((c: any) => c.id).sort(),
      [110, 111]
    )
    const done = await (await req('/api/chat/customers/search?q=Done')).json() as any
    assert.deepEqual(done.customers.map((c: any) => c.id), [110])
  })

  it('role-5 includes assigned archived and completed customers', async () => {
    rawDb.prepare(
      `INSERT INTO users (id, name, email, tenant_id, role_id, is_active) VALUES (4, 'Bank Agent', 'ba@t1', 10, 5, 1)`
    ).run()
    rawDb.prepare(
      `INSERT INTO customers (id, tenant_id, full_name, phone, assigned_bank_agent_id, is_completed, is_archived) VALUES
       (120, 10, 'Bank Done', '0505556666', 4, 1, 0),
       (121, 10, 'Bank Archived', '0506667777', 4, 0, 1)`
    ).run()
    const req = makeApp({ db, user: { userId: 4, tenantId: 10, roleId: 5 } })
    const res = await (await req('/api/chat/customers/search?q=&limit=10')).json() as any
    assert.deepEqual(res.customers.map((c: any) => c.id).sort(), [120, 121])
  })

  it('persists accessible tags on message send and returns them on history', async () => {
    const alice = makeApp({ db, user: { userId: 1, tenantId: 10, roleId: 2 } })
    const conv = await (await alice('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 2 }),
    })).json() as any
    const convId = conv.conversation_id

    // Try to tag 100 (allowed) and 200 (other tenant — must be silently dropped).
    const send = await (await alice('/api/chat/conversations/' + convId + '/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'check @Khalid Ahmed', customer_ids: [100, 200] }),
    })).json() as any
    assert.equal(send.success, true)
    assert.equal(send.message.tags.length, 1)
    assert.equal(send.message.tags[0].customer_id, 100)
    assert.equal(send.message.tags[0].display_name, 'Khalid Ahmed')

    // History returns the tag too.
    const hist = await (await alice('/api/chat/conversations/' + convId + '/messages')).json() as any
    assert.equal(hist.success, true)
    assert.equal(hist.messages.length, 1)
    assert.equal(hist.messages[0].tags[0].customer_id, 100)

    // DB row exists.
    const rows = rawDb.prepare(`SELECT customer_id, display_name FROM chat_message_customer_tags`).all() as any[]
    assert.equal(rows.length, 1)
    assert.equal(rows[0].customer_id, 100)
  })

  it('rejects unauthenticated search', async () => {
    const anon = makeApp({ db, user: { userId: null, tenantId: null } })
    const res = await anon('/api/chat/customers/search?q=Khalid')
    assert.equal(res.status, 401)
  })

  it('message tags are linkable for assigned archived/completed customers (role 4)', async () => {
    rawDb.prepare(
      `INSERT INTO customers (id, tenant_id, full_name, phone, is_completed, is_archived) VALUES
       (110, 10, 'Done Client', '0503334444', 1, 0)`
    ).run()
    rawDb.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (110, 3)`).run()
    const emp = makeApp({ db, user: { userId: 3, tenantId: 10, roleId: 4 } })
    const admin = makeApp({ db, user: { userId: 1, tenantId: 10, roleId: 2 } })
    const conv = await (await admin('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 3 }),
    })).json() as any
    const convId = conv.conversation_id
    const send = await (await emp('/api/chat/conversations/' + convId + '/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'see done', customer_ids: [110] }),
    })).json() as any
    assert.equal(send.success, true)
    assert.equal(send.message.tags.length, 1)
    assert.equal(send.message.tags[0].can_link, true)
    assert.equal(send.message.tags[0].customer_id, 110)

    const hist = await (await emp('/api/chat/conversations/' + convId + '/messages')).json() as any
    assert.equal(hist.messages[0].tags[0].can_link, true)
    assert.equal(hist.messages[0].tags[0].customer_id, 110)
  })

  it('history omits customer_id and can_link for viewers without customer access', async () => {
    rawDb.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (100, 3)`).run()
    const admin = makeApp({ db, user: { userId: 1, tenantId: 10, roleId: 2 } })
    const emp = makeApp({ db, user: { userId: 3, tenantId: 10, roleId: 4 } })
    const conv = await (await admin('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 3 }),
    })).json() as any
    const convId = conv.conversation_id
    await (await admin('/api/chat/conversations/' + convId + '/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'see customer', customer_ids: [100, 101] }),
    })).json()

    const adminHist = await (await admin('/api/chat/conversations/' + convId + '/messages')).json() as any
    const adminTag = adminHist.messages[0].tags.find((t: any) => t.display_name === 'Khalid Ahmed')
    assert.equal(adminTag.can_link, true)
    assert.equal(adminTag.customer_id, 100)

    const empHist = await (await emp('/api/chat/conversations/' + convId + '/messages')).json() as any
    const empAssigned = empHist.messages[0].tags.find((t: any) => t.display_name === 'Khalid Ahmed')
    const empOther = empHist.messages[0].tags.find((t: any) => t.display_name === 'Khalid Other')
    assert.equal(empAssigned.can_link, true)
    assert.equal(empAssigned.customer_id, 100)
    assert.equal(empOther.can_link, false)
    assert.equal(empOther.customer_id, undefined)
  })
})
