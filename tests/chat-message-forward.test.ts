/**
 * Forward message tests.
 * - Text messages forwarded to multiple recipients land in separate conversations.
 * - Tags are copied (filtered by forwarder's access).
 * - Deleted source messages are rejected.
 * - Cross-tenant recipients are rejected.
 * - Broadcast → direct forward works (text only).
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import Database from 'better-sqlite3'
import { registerChatModuleApi } from '../src/chat-module-api.ts'
import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'

type BroadcastCall = { roomName: string; payload: any }

function makeFakeRooms(calls: BroadcastCall[]) {
  return {
    idFromName(name: string) { return { __room: name } },
    get(id: { __room: string }) {
      return {
        async fetch(_url: string, init?: RequestInit) {
          const body = init?.body ? JSON.parse(String(init.body)) : null
          calls.push({ roomName: id.__room, payload: body })
          return new Response('ok')
        },
      }
    },
  } as any
}

function makeApp(opts: {
  db: D1Database
  rooms: any
  user: { userId: number | null; tenantId: number | null; roleId?: number | null }
}) {
  const app = new Hono()
  const getUserInfo = async () => ({
    userId: opts.user.userId,
    tenantId: opts.user.tenantId,
    roleId: opts.user.roleId ?? 4,
    tokenRoleId: opts.user.roleId ?? 4,
    assignedBankId: null,
  })
  registerChatModuleApi(app as any, getUserInfo)

  return async (path: string, init?: RequestInit) => {
    const env = {
      DB: opts.db,
      ATTACHMENTS: { put: async () => {}, get: async () => null, delete: async () => {} } as any,
      CHAT_ROOMS: opts.rooms,
      USER_NOTIFICATIONS: makeFakeRooms([]),
      BROADCAST_ROOMS: opts.rooms,
    }
    const executionCtx = { waitUntil: (p: Promise<unknown>) => { void p } } as any
    const url = new URL(path, 'http://test.local').toString()
    return app.fetch(new Request(url, init), env, executionCtx)
  }
}

describe('chat message forward', () => {
  let rawDb: ReturnType<typeof createTestDb>
  let db: D1Database
  let calls: BroadcastCall[]
  let rooms: any

  beforeEach(() => {
    rawDb = createTestDb()
    db = createSqliteD1(rawDb)
    rawDb.prepare(
      `INSERT INTO users (id, full_name, email, tenant_id, role_id, is_active) VALUES
       (1, 'Alice',  'alice@t1',  10, 4, 1),
       (2, 'Bob',    'bob@t1',    10, 4, 1),
       (3, 'Carol',  'carol@t1',  10, 4, 1),
       (4, 'Dave',   'dave@t2',   20, 4, 1),
       (5, 'Admin',  'admin@t1',  10, 2, 1)`
    ).run()
    calls = []
    rooms = makeFakeRooms(calls)
  })

  async function setupConvAndMessage(senderId: number, peerId: number, text: string): Promise<{ convId: number; msgId: number }> {
    const sender = makeApp({ db, rooms, user: { userId: senderId, tenantId: 10 } })
    const createRes = await sender('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: peerId }),
    })
    const { conversation_id: convId } = (await createRes.json()) as any

    const sendRes = await sender(`/api/chat/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: text }),
    })
    const { message } = (await sendRes.json()) as any
    return { convId, msgId: message.id }
  }

  it('forwards a direct text message to a single recipient', async () => {
    const { convId, msgId } = await setupConvAndMessage(1, 2, 'forward me')
    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })

    const res = await alice('/api/chat/messages/forward', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source_type: 'direct',
        source_conversation_id: convId,
        message_ids: [msgId],
        recipient_user_ids: [3],
      }),
    })
    const body = (await res.json()) as any
    assert.equal(res.status, 200)
    assert.equal(body.success, true)

    // Carol should now have a conversation with Alice containing the forwarded message
    const carol = makeApp({ db, rooms, user: { userId: 3, tenantId: 10 } })
    const carolConvs = (await (await carol('/api/chat/conversations')).json()) as any
    assert.ok(carolConvs.conversations.length > 0, 'Carol should have a conversation')
    const carolConvId = carolConvs.conversations[0].id

    const carolHist = (await (await carol(`/api/chat/conversations/${carolConvId}/messages`)).json()) as any
    assert.ok(carolHist.messages.length > 0)
    assert.equal(carolHist.messages[0].body, 'forward me')
    assert.equal(carolHist.messages[0].sender_id, 1, 'sender is the forwarder')
  })

  it('forwards to multiple recipients creating separate conversations', async () => {
    const { convId, msgId } = await setupConvAndMessage(1, 2, 'multi-forward')
    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })

    const res = await alice('/api/chat/messages/forward', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source_type: 'direct',
        source_conversation_id: convId,
        message_ids: [msgId],
        recipient_user_ids: [3, 2],
      }),
    })
    assert.equal((await res.json() as any).success, true)

    // Both Bob and Carol should have the message
    const alice2 = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })
    const aliceConvs = (await (await alice2('/api/chat/conversations')).json()) as any
    assert.ok(aliceConvs.conversations.length >= 2, 'Alice should have convs with Bob and Carol')
  })

  it('rejects forwarding deleted source messages', async () => {
    const { convId, msgId } = await setupConvAndMessage(1, 2, 'to be deleted')
    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })

    // Delete the source message
    await alice(`/api/chat/conversations/${convId}/messages/delete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message_ids: [msgId] }),
    })

    const res = await alice('/api/chat/messages/forward', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source_type: 'direct',
        source_conversation_id: convId,
        message_ids: [msgId],
        recipient_user_ids: [3],
      }),
    })
    const body = (await res.json()) as any
    assert.equal(res.status, 400)
    assert.ok(/deleted/i.test(body.error))
  })

  it('skips cross-tenant recipients silently', async () => {
    const { convId, msgId } = await setupConvAndMessage(1, 2, 'cross-tenant test')
    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })

    // Dave is in tenant 20 — should be skipped
    const res = await alice('/api/chat/messages/forward', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source_type: 'direct',
        source_conversation_id: convId,
        message_ids: [msgId],
        recipient_user_ids: [4, 3],
      }),
    })
    const body = (await res.json()) as any
    assert.equal(body.success, true)

    // Dave should have no conversation
    const dave = makeApp({ db, rooms, user: { userId: 4, tenantId: 20 } })
    const daveConvs = (await (await dave('/api/chat/conversations')).json()) as any
    assert.equal(daveConvs.conversations.length, 0)

    // Carol should have a conversation with the message
    const carol = makeApp({ db, rooms, user: { userId: 3, tenantId: 10 } })
    const carolConvs = (await (await carol('/api/chat/conversations')).json()) as any
    assert.ok(carolConvs.conversations.length > 0)
  })

  it('forwards broadcast message to direct conversation', async () => {
    const admin = makeApp({ db, rooms, user: { userId: 5, tenantId: 10, roleId: 2 } })
    const sendRes = await admin('/api/chat/broadcasts/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'broadcast text' }),
    })
    const { message: bcMsg } = (await sendRes.json()) as any

    // Alice forwards broadcast to Carol
    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })
    const res = await alice('/api/chat/messages/forward', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source_type: 'broadcast',
        message_ids: [bcMsg.id],
        recipient_user_ids: [3],
      }),
    })
    assert.equal((await res.json() as any).success, true)

    const carol = makeApp({ db, rooms, user: { userId: 3, tenantId: 10 } })
    const carolConvs = (await (await carol('/api/chat/conversations')).json()) as any
    assert.ok(carolConvs.conversations.length > 0)
    const carolConvId = carolConvs.conversations[0].id
    const carolHist = (await (await carol(`/api/chat/conversations/${carolConvId}/messages`)).json()) as any
    assert.ok(carolHist.messages.some((m: any) => m.body === 'broadcast text'))
  })

  it('returns 400 when source_type is missing', async () => {
    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })
    const res = await alice('/api/chat/messages/forward', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message_ids: [1], recipient_user_ids: [2] }),
    })
    assert.equal(res.status, 400)
  })

  it('returns 401 for unauthenticated requests', async () => {
    const anon = makeApp({ db, rooms, user: { userId: null, tenantId: null } })
    const res = await anon('/api/chat/messages/forward', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source_type: 'direct', message_ids: [1], recipient_user_ids: [2] }),
    })
    assert.equal(res.status, 401)
  })

  it('forwarded messages have is_forwarded=1 in recipient history', async () => {
    const { convId, msgId } = await setupConvAndMessage(1, 2, 'check forwarded flag')
    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })

    await alice('/api/chat/messages/forward', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source_type: 'direct',
        source_conversation_id: convId,
        message_ids: [msgId],
        recipient_user_ids: [3],
      }),
    })

    const carol = makeApp({ db, rooms, user: { userId: 3, tenantId: 10 } })
    const carolConvs = (await (await carol('/api/chat/conversations')).json()) as any
    const carolConvId = carolConvs.conversations[0].id
    const hist = (await (await carol(`/api/chat/conversations/${carolConvId}/messages`)).json()) as any
    assert.ok(hist.success, 'history should succeed')
    const fwdMsg = hist.messages.find((m: any) => m.body === 'check forwarded flag')
    assert.ok(fwdMsg, 'forwarded message should appear in history')
    assert.equal(fwdMsg.is_forwarded, 1, 'is_forwarded should be 1 for forwarded messages')
  })
})

describe('chat history resilience (pre-migration)', () => {
  let rooms: any
  let calls: { roomName: string; payload: any }[]

  beforeEach(() => {
    calls = []
    rooms = {
      idFromName(name: string) { return { __room: name } },
      get(id: { __room: string }) {
        return {
          async fetch(_url: string, init?: RequestInit) {
            const body = init?.body ? JSON.parse(String(init.body)) : null
            calls.push({ roomName: id.__room, payload: body })
            return new Response('ok')
          },
        }
      },
    } as any
  })

  it('history endpoint returns messages when is_forwarded column is absent (migration 0084 not applied)', async () => {
    // Simulate a pre-0084 database: chat_messages without is_forwarded
    const legacyRaw = new Database(':memory:')
    legacyRaw.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, full_name TEXT, name TEXT, email TEXT, tenant_id INTEGER, role_id INTEGER, assigned_bank_id INTEGER, is_active INTEGER DEFAULT 1);
      CREATE TABLE customers (id INTEGER PRIMARY KEY, tenant_id INTEGER, full_name TEXT, phone TEXT, assigned_bank_agent_id INTEGER, created_by INTEGER, is_completed INTEGER DEFAULT 0, is_archived INTEGER DEFAULT 0);
      CREATE TABLE customer_assignments (customer_id INTEGER, employee_id INTEGER);
      CREATE TABLE financing_requests (id INTEGER PRIMARY KEY, customer_id INTEGER, assigned_bank_agent_id INTEGER, created_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE chat_conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, participant_one_id INTEGER NOT NULL, participant_two_id INTEGER NOT NULL, last_message_id INTEGER, last_message_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE (tenant_id, participant_one_id, participant_two_id));
      CREATE TABLE chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL, tenant_id INTEGER NOT NULL, sender_id INTEGER NOT NULL, body TEXT, attachment_json TEXT, deleted_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE chat_message_reads (conversation_id INTEGER NOT NULL, user_id INTEGER NOT NULL, last_read_message_id INTEGER NOT NULL DEFAULT 0, last_read_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (conversation_id, user_id));
      CREATE TABLE chat_message_customer_tags (message_id INTEGER NOT NULL, customer_id INTEGER NOT NULL, display_name TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (message_id, customer_id));
      CREATE TABLE chat_broadcasts (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id INTEGER NOT NULL, sender_id INTEGER NOT NULL, body TEXT NOT NULL, deleted_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE chat_broadcast_reads (user_id INTEGER NOT NULL PRIMARY KEY, tenant_id INTEGER NOT NULL, last_read_broadcast_id INTEGER NOT NULL DEFAULT 0, last_read_at TEXT DEFAULT CURRENT_TIMESTAMP);
      INSERT INTO users (id, full_name, email, tenant_id, role_id, is_active) VALUES (1, 'Alice', 'alice@t1', 10, 4, 1), (2, 'Bob', 'bob@t1', 10, 4, 1);
    `)
    const db = createSqliteD1(legacyRaw)
    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })

    const createRes = await alice('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 2 }),
    })
    const { conversation_id: convId } = (await createRes.json()) as any

    await alice(`/api/chat/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'hello pre-migration' }),
    })

    const histRes = await alice(`/api/chat/conversations/${convId}/messages`)
    const hist = (await histRes.json()) as any
    assert.equal(histRes.status, 200, 'history must return 200 even without is_forwarded column')
    assert.equal(hist.success, true, 'history must succeed even without is_forwarded column')
    assert.ok(hist.messages.length > 0, 'messages must be returned')
    assert.equal(hist.messages[0].body, 'hello pre-migration')
  })
})
