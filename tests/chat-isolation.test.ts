/**
 * Chat isolation tests: messages must only reach the conversation's two
 * participants. Cross-tenant access, cross-conversation access, and non-
 * participant access must all be rejected — and must not trigger a broadcast
 * (even to the "correct" room) because the request itself is unauthorized.
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { registerChatModuleApi } from '../src/chat-module-api.ts'
import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'

type Broadcast = { roomName: string; payload: any }

function makeFakeChatRooms(broadcasts: Broadcast[]) {
  return {
    idFromName(name: string) {
      return { __room: name }
    },
    get(id: { __room: string }) {
      return {
        async fetch(_url: string, init?: RequestInit) {
          const body = init?.body ? JSON.parse(String(init.body)) : null
          broadcasts.push({ roomName: id.__room, payload: body })
          return new Response('ok')
        },
      }
    },
  } as any
}

function makeApp(opts: {
  db: D1Database
  chatRooms: any
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
      ATTACHMENTS: { put: async () => {}, get: async () => null } as any,
      CHAT_ROOMS: opts.chatRooms,
    }
    const executionCtx = { waitUntil: (p: Promise<unknown>) => { void p } } as any
    const url = new URL(path, 'http://test.local').toString()
    return app.fetch(new Request(url, init), env, executionCtx)
  }
}

function seedUsers(rawDb: any) {
  rawDb.prepare(
    `INSERT INTO users (id, name, email, tenant_id, role_id, is_active) VALUES
     (1, 'Alice T1', 'alice@t1', 10, 4, 1),
     (2, 'Bob T1',   'bob@t1',   10, 4, 1),
     (3, 'Carol T1', 'carol@t1', 10, 4, 1),
     (4, 'Dave T2',  'dave@t2',  20, 4, 1)`
  ).run()
}

describe('chat isolation', () => {
  let rawDb: ReturnType<typeof createTestDb>
  let db: D1Database
  let broadcasts: Broadcast[]
  let chatRooms: any

  beforeEach(() => {
    rawDb = createTestDb()
    db = createSqliteD1(rawDb)
    seedUsers(rawDb)
    broadcasts = []
    chatRooms = makeFakeChatRooms(broadcasts)
  })

  it('creates a conversation that is only visible to its two participants', async () => {
    // Alice (1) starts conv with Bob (2).
    const aliceReq = makeApp({ db, chatRooms, user: { userId: 1, tenantId: 10 } })
    const create = await aliceReq('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 2 }),
    })
    const createBody = (await create.json()) as any
    assert.equal(createBody.success, true)
    const convId = createBody.conversation_id
    assert.ok(convId > 0)

    // Carol (1's tenant-mate, but not a participant) must NOT see the conv.
    const carolReq = makeApp({ db, chatRooms, user: { userId: 3, tenantId: 10 } })
    const carolList = await (await carolReq('/api/chat/conversations')).json() as any
    assert.equal(carolList.success, true)
    assert.equal(carolList.conversations.length, 0, 'Carol should not see a conversation she is not part of')

    // Both Alice and Bob should see it.
    const aliceList = await (await aliceReq('/api/chat/conversations')).json() as any
    assert.equal(aliceList.conversations.length, 1)
    const bobReq = makeApp({ db, chatRooms, user: { userId: 2, tenantId: 10 } })
    const bobList = await (await bobReq('/api/chat/conversations')).json() as any
    assert.equal(bobList.conversations.length, 1)
  })

  it('does not broadcast or persist a message when a non-participant tries to send', async () => {
    // Alice creates conv with Bob.
    const alice = makeApp({ db, chatRooms, user: { userId: 1, tenantId: 10 } })
    const { conversation_id: convId } = (await (await alice('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 2 }),
    })).json()) as any

    // Carol (same tenant, not a participant) tries to post a message.
    const carol = makeApp({ db, chatRooms, user: { userId: 3, tenantId: 10 } })
    const res = await carol(`/api/chat/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'leak attempt' }),
    })
    assert.equal(res.status, 404, 'non-participant must get 404')

    // No broadcast should have been triggered — to ANY room.
    assert.equal(broadcasts.length, 0, 'non-participant attempt must not broadcast')

    // No message row should exist.
    const row = rawDb.prepare('SELECT COUNT(*) AS n FROM chat_messages').get() as { n: number }
    assert.equal(row.n, 0)
  })

  it('rejects cross-tenant conversation creation and access', async () => {
    // Alice in tenant 10 tries to start a conv with Dave in tenant 20.
    const alice = makeApp({ db, chatRooms, user: { userId: 1, tenantId: 10 } })
    const res = await alice('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 4 }),
    })
    assert.equal(res.status, 404, 'cross-tenant direct conversation must be refused')

    // Even if a stray conv row existed cross-tenant, access checks reject it.
    rawDb.prepare(
      `INSERT INTO chat_conversations (id, tenant_id, participant_one_id, participant_two_id)
       VALUES (999, 20, 1, 4)`
    ).run()
    const messages = await alice('/api/chat/conversations/999/messages')
    assert.equal(messages.status, 404, 'tenant mismatch must block access')
  })

  it('broadcasts a sent message ONLY to its own conversation room', async () => {
    // Two parallel conversations: (Alice, Bob) and (Alice, Carol).
    const alice = makeApp({ db, chatRooms, user: { userId: 1, tenantId: 10 } })
    const convAB = (await (await alice('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 2 }),
    })).json() as any).conversation_id
    const convAC = (await (await alice('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 3 }),
    })).json() as any).conversation_id
    assert.notEqual(convAB, convAC)

    broadcasts.length = 0
    const sendRes = await alice(`/api/chat/conversations/${convAB}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ body: 'hi bob' }),
    })
    assert.equal(sendRes.status, 200)

    // Drain any waitUntil microtasks.
    await new Promise((r) => setTimeout(r, 0))

    assert.equal(broadcasts.length, 1, 'one broadcast per message')
    assert.equal(broadcasts[0].roomName, `conv:${convAB}`)
    assert.notEqual(broadcasts[0].roomName, `conv:${convAC}`, 'must not leak into the other conversation room')
    assert.equal(broadcasts[0].payload.type, 'message')
    assert.equal(broadcasts[0].payload.message.sender_id, 1)
    assert.equal(broadcasts[0].payload.message.body, 'hi bob')

    // Carol must not see this message in her own conv (AC) history.
    const carol = makeApp({ db, chatRooms, user: { userId: 3, tenantId: 10 } })
    const acHist = await (await carol(`/api/chat/conversations/${convAC}/messages`)).json() as any
    assert.equal(acHist.success, true)
    assert.equal(acHist.messages.length, 0, 'message must not appear in unrelated conversation')

    // And Carol cannot read the AB history at all.
    const abAccess = await carol(`/api/chat/conversations/${convAB}/messages`)
    assert.equal(abAccess.status, 404)
  })

  it('reuses the same conversation row for the same pair regardless of order', async () => {
    const alice = makeApp({ db, chatRooms, user: { userId: 1, tenantId: 10 } })
    const bob = makeApp({ db, chatRooms, user: { userId: 2, tenantId: 10 } })
    const a = (await (await alice('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 2 }),
    })).json() as any).conversation_id
    const b = (await (await bob('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 1 }),
    })).json() as any).conversation_id
    assert.equal(a, b, 'pair (1,2) and (2,1) must share one conversation')
  })

  it('surfaces and pairs role-5 bank agents (tenant backfilled by migration 0079)', async () => {
    // Migration 0079 makes users.tenant_id the source of truth even for role 5.
    // Seed Eve with tenant_id already set, matching the post-migration state.
    rawDb.prepare(`INSERT INTO banks (id, tenant_id) VALUES (?, ?)`).run(7, 10)
    rawDb.prepare(
      `INSERT INTO users (id, name, email, tenant_id, role_id, assigned_bank_id, is_active)
       VALUES (5, 'Eve Agent', 'eve@bank', 10, 5, 7, 1)`
    ).run()

    // Alice (admin, tenant 10) should see Eve in /api/chat/users.
    const alice = makeApp({ db, chatRooms, user: { userId: 1, tenantId: 10 } })
    const aliceUsers = await (await alice('/api/chat/users')).json() as any
    const seenByAlice = (aliceUsers.users || []).map((u: any) => u.id)
    assert.ok(seenByAlice.includes(5), 'admin must see bank agent with NULL tenant_id')

    // Eve (resolved to tenant 10 by getUserInfo) should see Alice/Bob/Carol but not Dave (tenant 20).
    const eve = makeApp({ db, chatRooms, user: { userId: 5, tenantId: 10, roleId: 5 } })
    const eveUsers = await (await eve('/api/chat/users')).json() as any
    const seenByEve = (eveUsers.users || []).map((u: any) => u.id)
    assert.ok(seenByEve.includes(1) && seenByEve.includes(2) && seenByEve.includes(3))
    assert.ok(!seenByEve.includes(4), 'bank agent must not see other-tenant users')

    // Direct conversation between Alice and Eve must succeed.
    const res = await alice('/api/chat/conversations/direct', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: 5 }),
    })
    const body = (await res.json()) as any
    assert.equal(body.success, true, 'admin must be able to start a conv with the bank agent')
    assert.ok(body.conversation_id > 0)
  })

  it('rejects unauthenticated requests', async () => {
    const anon = makeApp({ db, chatRooms, user: { userId: null, tenantId: null } })
    for (const path of [
      '/api/chat/users',
      '/api/chat/conversations',
      '/api/chat/conversations/1/messages',
    ]) {
      const res = await anon(path)
      assert.equal(res.status, 401, `unauthenticated ${path} must be 401`)
    }
    assert.equal(broadcasts.length, 0)
  })
})
