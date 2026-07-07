/**
 * Broadcasts channel tests.
 * - Only role_id=2 (admin) can post; all other roles get 403.
 * - Broadcasts are strictly tenant-scoped: another tenant's users see no messages.
 * - Sending a broadcast fires the BROADCAST_ROOMS DO for the sender's tenant only.
 * - No broadcast is emitted when the request is rejected (wrong role, wrong tenant, unauth).
 * - Read cursor moves forward only.
 * - Unauthenticated requests return 401.
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Hono } from 'hono'
import { registerChatModuleApi } from '../src/chat-module-api.ts'
import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'

type BroadcastCall = { roomName: string; payload: any }

function makeFakeBroadcastRooms(calls: BroadcastCall[]) {
  return {
    idFromName(name: string) {
      return { __room: name }
    },
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

function makeFakeUserNotifications(calls: { userId: string }[]) {
  return {
    idFromName(name: string) {
      return { __user: name }
    },
    get(id: { __user: string }) {
      return {
        async fetch(_url: string, _init?: RequestInit) {
          calls.push({ userId: id.__user })
          return new Response('ok')
        },
      }
    },
  } as any
}

function makeApp(opts: {
  db: D1Database
  broadcastRooms: any
  userNotifications?: any
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
      CHAT_ROOMS: makeFakeBroadcastRooms([]),
      USER_NOTIFICATIONS: opts.userNotifications ?? makeFakeUserNotifications([]),
      BROADCAST_ROOMS: opts.broadcastRooms,
    }
    const executionCtx = { waitUntil: (p: Promise<unknown>) => { void p } } as any
    const url = new URL(path, 'http://test.local').toString()
    return app.fetch(new Request(url, init), env, executionCtx)
  }
}

function seedUsers(rawDb: any) {
  rawDb.prepare(
    `INSERT INTO users (id, full_name, email, tenant_id, role_id, is_active) VALUES
     (1, 'Admin T1',   'admin@t1',  10, 2, 1),
     (2, 'Alice T1',   'alice@t1',  10, 4, 1),
     (3, 'Bob T1',     'bob@t1',    10, 4, 1),
     (4, 'Admin T2',   'admin@t2',  20, 2, 1),
     (5, 'Eve T2',     'eve@t2',    20, 4, 1)`
  ).run()
}

function post(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }
}

describe('broadcasts channel', () => {
  let rawDb: ReturnType<typeof createTestDb>
  let db: D1Database
  let broadcastCalls: BroadcastCall[]
  let notifyCalls: { userId: string }[]
  let broadcastRooms: any
  let userNotifications: any

  beforeEach(() => {
    rawDb = createTestDb()
    db = createSqliteD1(rawDb)
    seedUsers(rawDb)
    broadcastCalls = []
    notifyCalls = []
    broadcastRooms = makeFakeBroadcastRooms(broadcastCalls)
    userNotifications = makeFakeUserNotifications(notifyCalls)
  })

  it('admin (role 2) can post a broadcast and it is persisted', async () => {
    const admin = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 1, tenantId: 10, roleId: 2 } })
    const res = await admin('/api/chat/broadcasts/messages', post({ body: 'Hello company!' }))
    assert.equal(res.status, 200)
    const body = (await res.json()) as any
    assert.equal(body.success, true)
    assert.ok(body.message.id > 0)
    assert.equal(body.message.body, 'Hello company!')
    assert.equal(body.message.sender_id, 1)
    assert.equal(body.message.tenant_id, 10)

    const row = rawDb.prepare('SELECT COUNT(*) AS n FROM chat_broadcasts WHERE tenant_id = 10').get() as { n: number }
    assert.equal(row.n, 1)
  })

  it("sender's own broadcast does not count as unread for them", async () => {
    const admin = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 1, tenantId: 10, roleId: 2 } })
    await admin('/api/chat/broadcasts/messages', post({ body: 'Company update' }))

    // Admin's own conversations response must show 0 broadcast unread.
    const convRes = (await (await admin('/api/chat/conversations')).json()) as any
    assert.equal(convRes.broadcast_unread_count, 0, 'sender must not see their own broadcast as unread')

    // But a different tenant user who has not read it should see 1 unread.
    const alice = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 2, tenantId: 10, roleId: 4 } })
    const aliceRes = (await (await alice('/api/chat/conversations')).json()) as any
    assert.equal(aliceRes.broadcast_unread_count, 1, 'other tenant users must see it as unread')
  })

  it('non-admin (role 4) gets 403 and nothing is persisted or broadcast', async () => {
    const alice = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 2, tenantId: 10, roleId: 4 } })
    const res = await alice('/api/chat/broadcasts/messages', post({ body: 'I am not admin' }))
    assert.equal(res.status, 403)

    await new Promise((r) => setTimeout(r, 0))
    assert.equal(broadcastCalls.length, 0, 'must not broadcast on 403')

    const row = rawDb.prepare('SELECT COUNT(*) AS n FROM chat_broadcasts').get() as { n: number }
    assert.equal(row.n, 0)
  })

  it('broadcast fires ONLY the tenant-scoped BROADCAST_ROOMS DO, not another tenant room', async () => {
    const admin = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 1, tenantId: 10, roleId: 2 } })
    await admin('/api/chat/broadcasts/messages', post({ body: 'Tenant 10 news' }))
    await new Promise((r) => setTimeout(r, 0))

    const broadcastRoomCalls = broadcastCalls.filter((c) => c.roomName.startsWith('broadcast:'))
    assert.equal(broadcastRoomCalls.length, 1, 'one broadcast room call per message')
    assert.equal(broadcastRoomCalls[0].roomName, 'broadcast:10', 'must use sender tenant room')
    assert.ok(
      !broadcastRoomCalls.some((c) => c.roomName === 'broadcast:20'),
      'must not touch other tenant broadcast room'
    )
    assert.equal(broadcastRoomCalls[0].payload.type, 'broadcast')
    assert.equal(broadcastRoomCalls[0].payload.message.body, 'Tenant 10 news')
  })

  it('all tenant users are notified but not users from other tenants', async () => {
    const admin = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 1, tenantId: 10, roleId: 2 } })
    await admin('/api/chat/broadcasts/messages', post({ body: 'Notify all T1' }))
    await new Promise((r) => setTimeout(r, 0))

    const notifiedUserIds = notifyCalls.map((c) => c.userId)
    // T1 has users 1,2,3 — all should get notified.
    assert.ok(notifiedUserIds.includes('user:1'), 'admin should get their own notification')
    assert.ok(notifiedUserIds.includes('user:2'))
    assert.ok(notifiedUserIds.includes('user:3'))
    // T2 users must NOT be notified.
    assert.ok(!notifiedUserIds.includes('user:4'), 'T2 admin must not be notified')
    assert.ok(!notifiedUserIds.includes('user:5'), 'T2 user must not be notified')
  })

  it('all tenant users can read the broadcast channel; cross-tenant user cannot', async () => {
    // Admin T1 posts a broadcast.
    const admin = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 1, tenantId: 10, roleId: 2 } })
    await admin('/api/chat/broadcasts/messages', post({ body: 'T1 announcement' }))

    // Alice (T1, non-admin) can read it.
    const alice = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 2, tenantId: 10, roleId: 4 } })
    const aliceRes = await (await alice('/api/chat/broadcasts/messages')).json() as any
    assert.equal(aliceRes.success, true)
    assert.equal(aliceRes.messages.length, 1)
    assert.equal(aliceRes.messages[0].body, 'T1 announcement')

    // Admin T2 sees zero messages (different tenant).
    const adminT2 = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 4, tenantId: 20, roleId: 2 } })
    const t2Res = await (await adminT2('/api/chat/broadcasts/messages')).json() as any
    assert.equal(t2Res.success, true)
    assert.equal(t2Res.messages.length, 0, 'T2 must not see T1 broadcasts')
  })

  it('cross-tenant row injection is blocked by tenant_id filter', async () => {
    // Manually inject a stray broadcast row with the wrong tenant_id.
    rawDb
      .prepare(`INSERT INTO chat_broadcasts (tenant_id, sender_id, body) VALUES (10, 1, 'T1 secret')`)
      .run()

    // T2 admin queries — must get zero results despite the row existing.
    const adminT2 = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 4, tenantId: 20, roleId: 2 } })
    const res = await (await adminT2('/api/chat/broadcasts/messages')).json() as any
    assert.equal(res.messages.length, 0, 'injected T1 row must not leak to T2 query')
  })

  it('read cursor moves forward only (never backwards)', async () => {
    const admin = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 1, tenantId: 10, roleId: 2 } })
    await admin('/api/chat/broadcasts/messages', post({ body: 'msg 1' }))
    await admin('/api/chat/broadcasts/messages', post({ body: 'msg 2' }))
    await admin('/api/chat/broadcasts/messages', post({ body: 'msg 3' }))

    const msgs = rawDb.prepare('SELECT id FROM chat_broadcasts ORDER BY id').all() as { id: number }[]
    const [id1, _id2, id3] = msgs.map((m) => m.id)

    const alice = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 2, tenantId: 10, roleId: 4 } })

    // Mark read up to msg 3.
    await alice('/api/chat/broadcasts/read', post({ last_read_broadcast_id: id3 }))
    let readRow = rawDb
      .prepare('SELECT last_read_broadcast_id FROM chat_broadcast_reads WHERE user_id = 2')
      .get() as { last_read_broadcast_id: number }
    assert.equal(readRow.last_read_broadcast_id, id3)

    // Attempt to move cursor backwards to msg 1 — must be ignored.
    await alice('/api/chat/broadcasts/read', post({ last_read_broadcast_id: id1 }))
    readRow = rawDb
      .prepare('SELECT last_read_broadcast_id FROM chat_broadcast_reads WHERE user_id = 2')
      .get() as { last_read_broadcast_id: number }
    assert.equal(readRow.last_read_broadcast_id, id3, 'read cursor must not move backwards')
  })

  it('unread count is accurate after partial read', async () => {
    const admin = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 1, tenantId: 10, roleId: 2 } })
    await admin('/api/chat/broadcasts/messages', post({ body: 'msg A' }))
    await admin('/api/chat/broadcasts/messages', post({ body: 'msg B' }))
    await admin('/api/chat/broadcasts/messages', post({ body: 'msg C' }))

    const alice = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 2, tenantId: 10, roleId: 4 } })

    // No reads yet — all 3 unread.
    let unread = (await (await alice('/api/chat/broadcasts/unread')).json()) as any
    assert.equal(unread.unread_count, 3)

    // Mark first message as read.
    const firstId = (rawDb.prepare('SELECT MIN(id) AS id FROM chat_broadcasts').get() as { id: number }).id
    await alice('/api/chat/broadcasts/read', post({ last_read_broadcast_id: firstId }))

    // Now 2 unread.
    unread = (await (await alice('/api/chat/broadcasts/unread')).json()) as any
    assert.equal(unread.unread_count, 2)
  })

  it('rejects unauthenticated requests with 401 and no broadcast side effects', async () => {
    const anon = makeApp({ db, broadcastRooms, userNotifications, user: { userId: null, tenantId: null } })
    for (const [path, init] of [
      ['/api/chat/broadcasts/messages', undefined],
      ['/api/chat/broadcasts/messages', post({ body: 'hack' })],
      ['/api/chat/broadcasts/read', post({ last_read_broadcast_id: 1 })],
      ['/api/chat/broadcasts/unread', undefined],
    ] as [string, RequestInit | undefined][]) {
      const res = await anon(path, init)
      assert.equal(res.status, 401, `unauthenticated ${path} must be 401`)
    }
    assert.equal(broadcastCalls.length, 0)
    assert.equal(notifyCalls.length, 0)
  })

  it('empty body is rejected with 400', async () => {
    const admin = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 1, tenantId: 10, roleId: 2 } })
    const res = await admin('/api/chat/broadcasts/messages', post({ body: '   ' }))
    assert.equal(res.status, 400)
    assert.equal(broadcastCalls.length, 0)
  })

  it('broadcast_unread_count is included in GET /api/chat/conversations response', async () => {
    const admin = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 1, tenantId: 10, roleId: 2 } })
    // No broadcasts yet — count should be 0.
    let convRes = await (await admin('/api/chat/conversations')).json() as any
    assert.equal(convRes.broadcast_unread_count, 0)

    // Post two broadcasts.
    await admin('/api/chat/broadcasts/messages', post({ body: 'msg 1' }))
    await admin('/api/chat/broadcasts/messages', post({ body: 'msg 2' }))

    // Alice (has not read any) should see 2 unread.
    const alice = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 2, tenantId: 10, roleId: 4 } })
    convRes = await (await alice('/api/chat/conversations')).json() as any
    assert.equal(convRes.broadcast_unread_count, 2)

    // Mark one read.
    const firstId = (rawDb.prepare('SELECT MIN(id) AS id FROM chat_broadcasts').get() as { id: number }).id
    await alice('/api/chat/broadcasts/read', post({ last_read_broadcast_id: firstId }))

    convRes = await (await alice('/api/chat/conversations')).json() as any
    assert.equal(convRes.broadcast_unread_count, 1, 'after reading first message, 1 should remain unread')

    // T2 admin's conversations response should show 0 (different tenant).
    const adminT2 = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 4, tenantId: 20, roleId: 2 } })
    convRes = await (await adminT2('/api/chat/conversations')).json() as any
    assert.equal(convRes.broadcast_unread_count, 0, 'T2 must not see T1 broadcast unread count')
  })

  it('pagination: before cursor returns older messages, after cursor returns newer', async () => {
    const admin = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 1, tenantId: 10, roleId: 2 } })
    await admin('/api/chat/broadcasts/messages', post({ body: 'first' }))
    await admin('/api/chat/broadcasts/messages', post({ body: 'second' }))
    await admin('/api/chat/broadcasts/messages', post({ body: 'third' }))

    const ids = (rawDb.prepare('SELECT id FROM chat_broadcasts ORDER BY id').all() as { id: number }[]).map((r) => r.id)
    const [id1, id2, id3] = ids

    const alice = makeApp({ db, broadcastRooms, userNotifications, user: { userId: 2, tenantId: 10, roleId: 4 } })

    // before=id3 → should return id1 and id2 (oldest-first after reverse)
    const beforeRes = await (await alice(`/api/chat/broadcasts/messages?before=${id3}`)).json() as any
    assert.equal(beforeRes.messages.length, 2)
    assert.equal(beforeRes.messages[0].id, id1)
    assert.equal(beforeRes.messages[1].id, id2)

    // after=id1 → should return id2 and id3 (oldest-first)
    const afterRes = await (await alice(`/api/chat/broadcasts/messages?after=${id1}`)).json() as any
    assert.equal(afterRes.messages.length, 2)
    assert.equal(afterRes.messages[0].id, id2)
    assert.equal(afterRes.messages[1].id, id3)
  })
})
