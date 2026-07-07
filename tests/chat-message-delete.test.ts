/**
 * Delete (tombstone) tests for direct messages and broadcasts.
 * - Sender may delete their own messages.
 * - Non-sender is forbidden.
 * - Deleted rows appear in history with deleted_at set, body/attachment cleared.
 * - Attachment download returns 404 after tombstone.
 * - Broadcast delete: sender ok, non-sender forbidden.
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { registerChatModuleApi } from '../src/chat-module-api.ts'
import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'

type BroadcastCall = { roomName: string; payload: any }

function makeFakeRooms(broadcastCalls: BroadcastCall[]) {
  const handler = {
    idFromName(name: string) { return { __room: name } },
    get(id: { __room: string }) {
      return {
        async fetch(_url: string, init?: RequestInit) {
          const body = init?.body ? JSON.parse(String(init.body)) : null
          broadcastCalls.push({ roomName: id.__room, payload: body })
          return new Response('ok')
        },
      }
    },
  } as any
  return handler
}

function makeApp(opts: {
  db: D1Database
  rooms: any
  user: { userId: number | null; tenantId: number | null; roleId?: number | null }
  attachments?: any
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
      ATTACHMENTS: opts.attachments ?? { put: async () => {}, get: async () => null, delete: async () => {} } as any,
      CHAT_ROOMS: opts.rooms,
      USER_NOTIFICATIONS: makeFakeRooms([]),
      BROADCAST_ROOMS: opts.rooms,
    }
    const executionCtx = { waitUntil: (p: Promise<unknown>) => { void p } } as any
    const url = new URL(path, 'http://test.local').toString()
    return app.fetch(new Request(url, init), env, executionCtx)
  }
}

function seedUsers(rawDb: any) {
  rawDb.prepare(
    `INSERT INTO users (id, full_name, email, tenant_id, role_id, is_active) VALUES
     (1, 'Alice', 'alice@t1', 10, 4, 1),
     (2, 'Bob',   'bob@t1',   10, 4, 1),
     (3, 'Carol', 'carol@t1', 10, 4, 1)`
  ).run()
}

describe('chat message delete (direct)', () => {
  let rawDb: ReturnType<typeof createTestDb>
  let db: D1Database
  let broadcasts: BroadcastCall[]
  let rooms: any

  beforeEach(() => {
    rawDb = createTestDb()
    db = createSqliteD1(rawDb)
    seedUsers(rawDb)
    broadcasts = []
    rooms = makeFakeRooms(broadcasts)
  })

  async function setupConversationWithMessage(): Promise<{ convId: number; msgId: number }> {
    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })
    const createRes = await alice('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 2 }),
    })
    const { conversation_id: convId } = (await createRes.json()) as any

    const sendRes = await alice(`/api/chat/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'hello' }),
    })
    const { message } = (await sendRes.json()) as any
    return { convId, msgId: message.id }
  }

  it('sender can delete their own message', async () => {
    const { convId, msgId } = await setupConversationWithMessage()
    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })

    const res = await alice(`/api/chat/conversations/${convId}/messages/delete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message_ids: [msgId] }),
    })
    const body = (await res.json()) as any
    assert.equal(res.status, 200)
    assert.equal(body.success, true)
    assert.ok(body.deleted_ids.includes(msgId))

    // Row should have deleted_at set, body cleared
    const row = rawDb.prepare(`SELECT body, attachment_json, deleted_at FROM chat_messages WHERE id = ?`).get(msgId) as any
    assert.ok(row.deleted_at, 'deleted_at should be set')
    assert.equal(row.body, null)
    assert.equal(row.attachment_json, null)
  })

  it('deleted messages appear in history with tombstone fields', async () => {
    const { convId, msgId } = await setupConversationWithMessage()
    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })

    await alice(`/api/chat/conversations/${convId}/messages/delete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message_ids: [msgId] }),
    })

    const histRes = await alice(`/api/chat/conversations/${convId}/messages`)
    const hist = (await histRes.json()) as any
    assert.equal(hist.success, true)
    assert.equal(hist.messages.length, 1)
    const m = hist.messages[0]
    assert.ok(m.deleted_at, 'history should include deleted_at')
    assert.equal(m.body, null, 'body should be null in history')
    assert.equal(m.attachment_json, null)
    assert.deepEqual(m.tags, [])
    // created_at should be preserved
    assert.ok(m.created_at, 'created_at should be preserved')
  })

  it('peer cannot delete sender message', async () => {
    const { convId, msgId } = await setupConversationWithMessage()
    const bob = makeApp({ db, rooms, user: { userId: 2, tenantId: 10 } })

    const res = await bob(`/api/chat/conversations/${convId}/messages/delete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message_ids: [msgId] }),
    })
    const body = (await res.json()) as any
    assert.equal(body.success, true)
    assert.deepEqual(body.deleted_ids, [], 'peer must not be able to delete sender message')

    // Row should be untouched
    const row = rawDb.prepare(`SELECT deleted_at FROM chat_messages WHERE id = ?`).get(msgId) as any
    assert.equal(row.deleted_at, null)
  })

  it('non-participant cannot call delete endpoint', async () => {
    const { convId, msgId } = await setupConversationWithMessage()
    const carol = makeApp({ db, rooms, user: { userId: 3, tenantId: 10 } })

    const res = await carol(`/api/chat/conversations/${convId}/messages/delete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message_ids: [msgId] }),
    })
    assert.equal(res.status, 404)
  })

  it('deleted message attachment returns 404 on download', async () => {
    const { convId } = await setupConversationWithMessage()
    // Insert a message with fake attachment
    rawDb.prepare(
      `INSERT INTO chat_messages (conversation_id, tenant_id, sender_id, body, attachment_json, deleted_at, created_at)
       VALUES (?, 10, 1, NULL, '{"key":"chat/10/1/99/file.pdf","name":"file.pdf","mime":"application/pdf","size":100}', datetime('now'), datetime('now'))`
    ).run(convId)
    const deletedMsgId: number = (rawDb.prepare(`SELECT id FROM chat_messages WHERE deleted_at IS NOT NULL LIMIT 1`).get() as any).id

    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })
    const res = await alice(`/api/chat/attachments/${convId}/${deletedMsgId}/file.pdf`)
    assert.equal(res.status, 404)
  })

  it('broadcasts a message_deleted event after tombstone', async () => {
    const { convId, msgId } = await setupConversationWithMessage()
    broadcasts.length = 0
    const alice = makeApp({ db, rooms, user: { userId: 1, tenantId: 10 } })

    await alice(`/api/chat/conversations/${convId}/messages/delete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message_ids: [msgId] }),
    })
    await new Promise((r) => setTimeout(r, 0))

    const deleteEvents = broadcasts.filter((b) => b.payload?.type === 'message_deleted')
    assert.ok(deleteEvents.length > 0, 'should broadcast message_deleted')
    assert.ok(deleteEvents[0].payload.message_ids.includes(msgId))
    assert.equal(deleteEvents[0].roomName, `conv:${convId}`)
  })
})

describe('chat broadcast delete', () => {
  let rawDb: ReturnType<typeof createTestDb>
  let db: D1Database
  let broadcasts: BroadcastCall[]
  let rooms: any

  beforeEach(() => {
    rawDb = createTestDb()
    db = createSqliteD1(rawDb)
    rawDb.prepare(
      `INSERT INTO users (id, full_name, email, tenant_id, role_id, is_active) VALUES
       (1, 'Admin', 'admin@t1', 10, 2, 1),
       (2, 'User',  'user@t1',  10, 4, 1)`
    ).run()
    broadcasts = []
    rooms = makeFakeRooms(broadcasts)
  })

  it('admin can delete their own broadcast', async () => {
    const admin = makeApp({ db, rooms, user: { userId: 1, tenantId: 10, roleId: 2 } })

    const sendRes = await admin('/api/chat/broadcasts/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'announcement' }),
    })
    const { message } = (await sendRes.json()) as any
    broadcasts.length = 0

    const delRes = await admin('/api/chat/broadcasts/messages/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message_ids: [message.id] }),
    })
    const body = (await delRes.json()) as any
    assert.equal(body.success, true)
    assert.ok(body.deleted_ids.includes(message.id))

    const row = rawDb.prepare(`SELECT body, deleted_at FROM chat_broadcasts WHERE id = ?`).get(message.id) as any
    assert.ok(row.deleted_at)
    assert.equal(row.body, '')
  })

  it('non-sender cannot delete broadcast', async () => {
    const admin = makeApp({ db, rooms, user: { userId: 1, tenantId: 10, roleId: 2 } })
    const user = makeApp({ db, rooms, user: { userId: 2, tenantId: 10, roleId: 4 } })

    const sendRes = await admin('/api/chat/broadcasts/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'announcement' }),
    })
    const { message } = (await sendRes.json()) as any

    const delRes = await user('/api/chat/broadcasts/messages/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message_ids: [message.id] }),
    })
    const body = (await delRes.json()) as any
    assert.deepEqual(body.deleted_ids, [])
    const row = rawDb.prepare(`SELECT deleted_at FROM chat_broadcasts WHERE id = ?`).get(message.id) as any
    assert.equal(row.deleted_at, null)
  })

  it('deleted broadcast appears in history with tombstone', async () => {
    const admin = makeApp({ db, rooms, user: { userId: 1, tenantId: 10, roleId: 2 } })

    const sendRes = await admin('/api/chat/broadcasts/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'test broadcast' }),
    })
    const { message } = (await sendRes.json()) as any

    await admin('/api/chat/broadcasts/messages/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message_ids: [message.id] }),
    })

    const histRes = await admin('/api/chat/broadcasts/messages')
    const hist = (await histRes.json()) as any
    assert.equal(hist.success, true)
    const bc = hist.messages.find((m: any) => m.id === message.id)
    assert.ok(bc, 'deleted broadcast should appear in history')
    assert.ok(bc.deleted_at)
    assert.equal(bc.body, null)
  })
})
