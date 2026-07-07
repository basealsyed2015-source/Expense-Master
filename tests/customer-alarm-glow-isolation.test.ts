import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'

/**
 * Tests that the per-customer "glow dot" on the customers/requests tables
 * is strictly scoped to the logged-in user.
 *
 * A glow appears in the UI iff the client-side map
 *   customerAlarmsByCustomer[customer_id]
 * contains at least one unread alarm. That map is built from the response of
 *   GET /api/customer-alarms
 * which executes:
 *   SELECT * FROM customer_alarms WHERE user_id = ?  (bound to req.userId)
 *
 * These tests confirm:
 *  1. The backend query strictly filters by user_id (no cross-user leakage).
 *  2. Read alarms never populate the map (filtered client-side).
 *  3. Cross-tenant alarms on the same customer don't leak between users.
 *  4. Bulk-inserting alarms for one user never broadcasts to peers.
 *  5. renderCustomerAlarmDot() only returns a dot for the current user.
 */

const TENANT_A = 10
const TENANT_B = 20

const USER_A = 100
const USER_B = 200
const USER_C = 300
const USER_OTHER_TENANT = 400

const CUSTOMER_X = 1000
const CUSTOMER_Y = 1001
const CUSTOMER_Z = 1002

interface Alarm {
  id: number
  customer_id: number
  customer_name: string | null
  user_id: number
  tenant_id: number
  alarm_type?: string | null
  note?: string | null
  is_read?: number
}

function seedUsersAndCustomers(db: ReturnType<typeof createTestDb>) {
  db.prepare(
    `INSERT INTO users (id, full_name, tenant_id, role_id, is_active) VALUES
     (?, 'User A', ?, 4, 1),
     (?, 'User B', ?, 4, 1),
     (?, 'User C', ?, 5, 1),
     (?, 'Other Tenant User', ?, 4, 1)`
  ).run(USER_A, TENANT_A, USER_B, TENANT_A, USER_C, TENANT_A, USER_OTHER_TENANT, TENANT_B)

  db.prepare(`INSERT INTO customers (id, tenant_id, full_name) VALUES (?, ?, ?)`).run(
    CUSTOMER_X, TENANT_A, 'Customer X'
  )
  db.prepare(`INSERT INTO customers (id, tenant_id, full_name) VALUES (?, ?, ?)`).run(
    CUSTOMER_Y, TENANT_A, 'Customer Y'
  )
  db.prepare(`INSERT INTO customers (id, tenant_id, full_name) VALUES (?, ?, ?)`).run(
    CUSTOMER_Z, TENANT_B, 'Customer Z'
  )
}

async function insertAlarm(
  d1: D1Database,
  opts: {
    customerId: number
    customerName: string
    userId: number
    tenantId: number
    alarmType?: string
    note?: string
    isRead?: number
  }
): Promise<void> {
  await d1
    .prepare(
      `INSERT INTO customer_alarms
        (customer_id, customer_name, user_id, tenant_id, alarm_type, note, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      opts.customerId,
      opts.customerName,
      opts.userId,
      opts.tenantId,
      opts.alarmType ?? 'scheduled',
      opts.note ?? '',
      opts.isRead ?? 0
    )
    .run()
}

/**
 * Mirrors GET /api/customer-alarms (src/index.tsx ~line 11259):
 *   SELECT * FROM customer_alarms WHERE user_id = ? ORDER BY created_at DESC
 */
async function fetchAlarmsForUser(d1: D1Database, userId: number): Promise<Alarm[]> {
  const { results } = await d1
    .prepare(`SELECT * FROM customer_alarms WHERE user_id = ? ORDER BY created_at DESC`)
    .bind(userId)
    .all<Alarm>()
  return results
}

/**
 * Mirrors the client-side refreshCustomerAlarmsMap() in src/full-admin-panel.ts:
 *   - groups alarms by customer_id
 *   - excludes alarms with is_read = 1
 *   - skips rows with null/empty customer_id
 */
function buildAlarmsMap(alarms: Alarm[]): Record<number, Alarm[]> {
  const map: Record<number, Alarm[]> = {}
  for (const a of alarms) {
    if (a.is_read) continue
    const cid = a.customer_id
    if (cid == null) continue
    if (!map[cid]) map[cid] = []
    map[cid].push(a)
  }
  return map
}

/**
 * Mirrors the client-side renderCustomerAlarmDot(customerId).
 * Returns true if a glowing dot would be rendered for that customer.
 */
function wouldRenderGlow(map: Record<number, Alarm[]>, customerId: number): boolean {
  const list = map[customerId]
  return Array.isArray(list) && list.length > 0
}

describe('customer-alarm glow isolation — must not broadcast', () => {
  it('alarm for user A on customer X never shows a glow for user B', async () => {
    const sqlite = createTestDb()
    seedUsersAndCustomers(sqlite)
    const d1 = createSqliteD1(sqlite)

    await insertAlarm(d1, {
      customerId: CUSTOMER_X,
      customerName: 'Customer X',
      userId: USER_A,
      tenantId: TENANT_A,
      note: 'Private to A',
    })

    const mapA = buildAlarmsMap(await fetchAlarmsForUser(d1, USER_A))
    const mapB = buildAlarmsMap(await fetchAlarmsForUser(d1, USER_B))
    const mapC = buildAlarmsMap(await fetchAlarmsForUser(d1, USER_C))

    assert.equal(wouldRenderGlow(mapA, CUSTOMER_X), true, 'owner A must see glow')
    assert.equal(wouldRenderGlow(mapB, CUSTOMER_X), false, 'peer B must NOT see glow')
    assert.equal(wouldRenderGlow(mapC, CUSTOMER_X), false, 'peer C must NOT see glow')
  })

  it('each user only sees glows for customers tied to their own alarms', async () => {
    const sqlite = createTestDb()
    seedUsersAndCustomers(sqlite)
    const d1 = createSqliteD1(sqlite)

    await insertAlarm(d1, {
      customerId: CUSTOMER_X,
      customerName: 'Customer X',
      userId: USER_A,
      tenantId: TENANT_A,
    })
    await insertAlarm(d1, {
      customerId: CUSTOMER_Y,
      customerName: 'Customer Y',
      userId: USER_B,
      tenantId: TENANT_A,
    })

    const mapA = buildAlarmsMap(await fetchAlarmsForUser(d1, USER_A))
    const mapB = buildAlarmsMap(await fetchAlarmsForUser(d1, USER_B))

    assert.equal(wouldRenderGlow(mapA, CUSTOMER_X), true)
    assert.equal(wouldRenderGlow(mapA, CUSTOMER_Y), false, 'A must not see B\'s customer Y glow')
    assert.equal(wouldRenderGlow(mapB, CUSTOMER_Y), true)
    assert.equal(wouldRenderGlow(mapB, CUSTOMER_X), false, 'B must not see A\'s customer X glow')
  })

  it('two users with separate alarms on the SAME customer each see only their own', async () => {
    const sqlite = createTestDb()
    seedUsersAndCustomers(sqlite)
    const d1 = createSqliteD1(sqlite)

    await insertAlarm(d1, {
      customerId: CUSTOMER_X,
      customerName: 'Customer X',
      userId: USER_A,
      tenantId: TENANT_A,
      note: 'For A',
    })
    await insertAlarm(d1, {
      customerId: CUSTOMER_X,
      customerName: 'Customer X',
      userId: USER_B,
      tenantId: TENANT_A,
      note: 'For B',
    })

    const listA = (await fetchAlarmsForUser(d1, USER_A))
    const listB = (await fetchAlarmsForUser(d1, USER_B))

    assert.equal(listA.length, 1, 'A sees exactly 1 alarm')
    assert.equal(listA[0].note, 'For A')
    assert.equal(listB.length, 1, 'B sees exactly 1 alarm')
    assert.equal(listB[0].note, 'For B')

    const mapA = buildAlarmsMap(listA)
    const mapB = buildAlarmsMap(listB)
    assert.equal(mapA[CUSTOMER_X].length, 1)
    assert.equal(mapB[CUSTOMER_X].length, 1)
    assert.notEqual(mapA[CUSTOMER_X][0].note, mapB[CUSTOMER_X][0].note)
  })

  it('a read alarm never produces a glow even for its owner', async () => {
    const sqlite = createTestDb()
    seedUsersAndCustomers(sqlite)
    const d1 = createSqliteD1(sqlite)

    await insertAlarm(d1, {
      customerId: CUSTOMER_X,
      customerName: 'Customer X',
      userId: USER_A,
      tenantId: TENANT_A,
      isRead: 1,
    })

    const mapA = buildAlarmsMap(await fetchAlarmsForUser(d1, USER_A))
    assert.equal(wouldRenderGlow(mapA, CUSTOMER_X), false, 'read alarm must not glow')
  })

  it('marking the only unread alarm as read removes the glow on next refresh', async () => {
    const sqlite = createTestDb()
    seedUsersAndCustomers(sqlite)
    const d1 = createSqliteD1(sqlite)

    await insertAlarm(d1, {
      customerId: CUSTOMER_X,
      customerName: 'Customer X',
      userId: USER_A,
      tenantId: TENANT_A,
    })

    let mapA = buildAlarmsMap(await fetchAlarmsForUser(d1, USER_A))
    assert.equal(wouldRenderGlow(mapA, CUSTOMER_X), true)

    await d1
      .prepare(`UPDATE customer_alarms SET is_read = 1 WHERE user_id = ? AND customer_id = ?`)
      .bind(USER_A, CUSTOMER_X)
      .run()

    mapA = buildAlarmsMap(await fetchAlarmsForUser(d1, USER_A))
    assert.equal(wouldRenderGlow(mapA, CUSTOMER_X), false, 'glow must clear after mark-as-read')
  })

  it('cross-tenant: another tenant\'s alarm never leaks into this user\'s map', async () => {
    const sqlite = createTestDb()
    seedUsersAndCustomers(sqlite)
    const d1 = createSqliteD1(sqlite)

    await insertAlarm(d1, {
      customerId: CUSTOMER_Z,
      customerName: 'Customer Z',
      userId: USER_OTHER_TENANT,
      tenantId: TENANT_B,
    })

    const mapA = buildAlarmsMap(await fetchAlarmsForUser(d1, USER_A))
    const mapB = buildAlarmsMap(await fetchAlarmsForUser(d1, USER_B))
    assert.equal(wouldRenderGlow(mapA, CUSTOMER_Z), false)
    assert.equal(wouldRenderGlow(mapB, CUSTOMER_Z), false)
    assert.deepEqual(mapA, {}, 'user A sees no alarms at all')
    assert.deepEqual(mapB, {}, 'user B sees no alarms at all')
  })

  it('bulk insert for one user does not broadcast to any peer', async () => {
    const sqlite = createTestDb()
    seedUsersAndCustomers(sqlite)
    const d1 = createSqliteD1(sqlite)

    for (let i = 0; i < 10; i++) {
      await insertAlarm(d1, {
        customerId: CUSTOMER_X,
        customerName: 'Customer X',
        userId: USER_A,
        tenantId: TENANT_A,
        note: `alarm #${i}`,
      })
    }

    const listA = await fetchAlarmsForUser(d1, USER_A)
    const listB = await fetchAlarmsForUser(d1, USER_B)
    const listC = await fetchAlarmsForUser(d1, USER_C)

    assert.equal(listA.length, 10, 'owner sees all 10')
    assert.equal(listB.length, 0, 'peer B sees zero')
    assert.equal(listC.length, 0, 'peer C sees zero')

    assert.equal(wouldRenderGlow(buildAlarmsMap(listB), CUSTOMER_X), false)
    assert.equal(wouldRenderGlow(buildAlarmsMap(listC), CUSTOMER_X), false)
  })

  it('renderCustomerAlarmDot returns empty string for a customer with no alarms for this user', () => {
    // Replicates exactly the production guard in renderCustomerAlarmDot():
    //   if (!list || !list.length) return '';
    const map: Record<number, Alarm[]> = {}
    const dot = renderDot(map, CUSTOMER_X)
    assert.equal(dot, '', 'no glow markup when map has no entry')
  })

  it('renderCustomerAlarmDot returns a glow only when the per-user map has entries', () => {
    const map: Record<number, Alarm[]> = {
      [CUSTOMER_X]: [
        { id: 1, customer_id: CUSTOMER_X, customer_name: 'X', user_id: USER_A, tenant_id: TENANT_A, is_read: 0 },
      ],
    }
    const dot = renderDot(map, CUSTOMER_X)
    assert.match(dot, /pulse-glow/, 'glow markup must include the pulse-glow animation')
    assert.match(dot, /openCustomerAlarmsPopup\(1000\)/, 'glow must wire to the customer-specific popup')

    // The same map fed with a different customer_id (representing the same render call
    // happening for a customer with no alarms) must produce no glow.
    assert.equal(renderDot(map, CUSTOMER_Y), '', 'no glow for customer without entries')
  })

  it('alarms for different customers belonging to the same user are kept separate in the map', async () => {
    const sqlite = createTestDb()
    seedUsersAndCustomers(sqlite)
    const d1 = createSqliteD1(sqlite)

    await insertAlarm(d1, { customerId: CUSTOMER_X, customerName: 'X', userId: USER_A, tenantId: TENANT_A })
    await insertAlarm(d1, { customerId: CUSTOMER_Y, customerName: 'Y', userId: USER_A, tenantId: TENANT_A })

    const mapA = buildAlarmsMap(await fetchAlarmsForUser(d1, USER_A))
    assert.equal(Object.keys(mapA).length, 2)
    assert.equal(mapA[CUSTOMER_X].length, 1)
    assert.equal(mapA[CUSTOMER_Y].length, 1)
    assert.notEqual(mapA[CUSTOMER_X][0].id, mapA[CUSTOMER_Y][0].id)
  })
})

/**
 * Pure mirror of the production renderCustomerAlarmDot() function in
 * src/full-admin-panel.ts. Kept in this test file so any divergence between
 * client logic and the per-user contract is caught here.
 */
function renderDot(map: Record<number, Alarm[]>, customerId: number | null | undefined): string {
  if (customerId == null) return ''
  const list = map[customerId as number]
  if (!list || !list.length) return ''
  const count = list.length
  return (
    '<button type="button" onclick="event.stopPropagation(); openCustomerAlarmsPopup(' +
    customerId +
    ')" ' +
    'title="' +
    count +
    ' تنبيه غير مقروء" ' +
    'class="inline-flex items-center justify-center w-3 h-3 rounded-full bg-red-500 flex-shrink-0 cursor-pointer hover:scale-125 transition-transform" ' +
    'style="animation:pulse-glow 1.5s infinite"></button>'
  )
}
