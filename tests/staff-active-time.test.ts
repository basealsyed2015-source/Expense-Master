import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  computeHeartbeatCredit,
  isStaffRoleForActivity,
  recordHeartbeat,
  getStaffActiveTimeReport,
  HEARTBEAT_MAX_DELTA_S,
} from '../src/staff-active-time.ts'
import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'

function seedActivityTables(db: ReturnType<typeof createTestDb>) {
  db.exec(`
    CREATE TABLE user_active_time_daily (
      user_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      activity_date TEXT NOT NULL,
      active_seconds INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, activity_date)
    );
    CREATE TABLE user_active_time_state (
      user_id INTEGER PRIMARY KEY,
      tenant_id INTEGER NOT NULL,
      last_heartbeat_at TEXT NOT NULL
    );
  `)
}

const TENANT_A = 100
const TENANT_B = 200

function seedUsers(db: ReturnType<typeof createTestDb>) {
  db.prepare(
    `INSERT INTO users (id, full_name, tenant_id, role_id, is_active) VALUES
     (1, 'Company Admin A', ?, 2, 1),
     (2, 'Employee A', ?, 4, 1),
     (3, 'Bank Agent A', ?, 5, 1),
     (4, 'Dual Agent A', ?, 6, 1),
     (5, 'Inactive Employee', ?, 4, 0),
     (6, 'Legacy Employee (14)', ?, 14, 1),
     (7, 'Company Admin B', ?, 2, 1),
     (8, 'Employee B', ?, 4, 1),
     (9, 'Sales Supervisor A', ?, 3, 1)`
  ).run(
    TENANT_A, TENANT_A, TENANT_A, TENANT_A, TENANT_A, TENANT_A,
    TENANT_B, TENANT_B, TENANT_A
  )
}

describe('computeHeartbeatCredit', () => {
  it('returns 0 when no previous heartbeat exists', () => {
    assert.equal(computeHeartbeatCredit(null, Date.now()), 0)
    assert.equal(computeHeartbeatCredit('', Date.now()), 0)
    assert.equal(computeHeartbeatCredit(undefined, Date.now()), 0)
  })

  it('returns 0 when previous timestamp is unparseable', () => {
    assert.equal(computeHeartbeatCredit('not-a-date', Date.now()), 0)
  })

  it('ignores deltas smaller than 5 seconds (noise)', () => {
    const now = Date.parse('2026-01-01T00:00:04.000Z')
    assert.equal(computeHeartbeatCredit('2026-01-01T00:00:00.000Z', now), 0)
  })

  it('credits exact delta when 5s <= delta <= 90s', () => {
    const now = Date.parse('2026-01-01T00:01:00.000Z')
    assert.equal(computeHeartbeatCredit('2026-01-01T00:00:00.000Z', now), 60)
  })

  it('caps credit at HEARTBEAT_MAX_DELTA_S for long gaps (idle recovery)', () => {
    const now = Date.parse('2026-01-01T00:10:00.000Z')
    const credit = computeHeartbeatCredit('2026-01-01T00:00:00.000Z', now)
    assert.equal(credit, HEARTBEAT_MAX_DELTA_S)
    assert.equal(credit, 90)
  })
})

describe('isStaffRoleForActivity', () => {
  it('accepts staff roles 4, 5, 6 and their legacy aliases 14, 15', () => {
    assert.equal(isStaffRoleForActivity(4), true)
    assert.equal(isStaffRoleForActivity(5), true)
    assert.equal(isStaffRoleForActivity(6), true)
    assert.equal(isStaffRoleForActivity(14), true)
    assert.equal(isStaffRoleForActivity(15), true)
  })

  it('rejects admin/supervisor roles and unknown values', () => {
    assert.equal(isStaffRoleForActivity(1), false)
    assert.equal(isStaffRoleForActivity(2), false)
    assert.equal(isStaffRoleForActivity(3), false)
    assert.equal(isStaffRoleForActivity(null), false)
    assert.equal(isStaffRoleForActivity('abc'), false)
  })
})

describe('recordHeartbeat', () => {
  it('rejects unauthenticated calls with 401', async () => {
    const db = createTestDb()
    seedActivityTables(db)
    const d1 = createSqliteD1(db)
    const res = await recordHeartbeat(d1, { userId: null, tenantId: 1, roleId: 4 })
    assert.equal(res.ok, false)
    if (!res.ok) assert.equal(res.status, 401)
  })

  it('rejects non-staff roles with 403 (role guard)', async () => {
    const db = createTestDb()
    seedActivityTables(db)
    seedUsers(db)
    const d1 = createSqliteD1(db)
    for (const roleId of [1, 2, 3]) {
      const res = await recordHeartbeat(d1, { userId: 1, tenantId: TENANT_A, roleId })
      assert.equal(res.ok, false, `role ${roleId} should be forbidden`)
      if (!res.ok) assert.equal(res.status, 403)
    }
  })

  it('first ping seeds the marker but credits 0 seconds', async () => {
    const db = createTestDb()
    seedActivityTables(db)
    seedUsers(db)
    const d1 = createSqliteD1(db)
    const t0 = Date.parse('2026-03-10T09:00:00.000Z')
    const res = await recordHeartbeat(d1, { userId: 2, tenantId: TENANT_A, roleId: 4 }, t0)
    assert.equal(res.ok, true)
    if (res.ok) assert.equal(res.credited, 0)

    const state = db.prepare('SELECT * FROM user_active_time_state WHERE user_id = 2').get() as {
      user_id: number; tenant_id: number; last_heartbeat_at: string
    }
    assert.equal(state.tenant_id, TENANT_A)
    assert.equal(state.last_heartbeat_at, new Date(t0).toISOString())

    const dailyCount = db.prepare('SELECT COUNT(*) AS n FROM user_active_time_daily').get() as { n: number }
    assert.equal(dailyCount.n, 0, 'no daily row should be written on the seeding ping')
  })

  it('credits capped delta on subsequent pings and accumulates into the daily row', async () => {
    const db = createTestDb()
    seedActivityTables(db)
    seedUsers(db)
    const d1 = createSqliteD1(db)

    const t0 = Date.parse('2026-03-10T09:00:00.000Z')
    const t1 = t0 + 60_000 // 60s later — normal heartbeat
    const t2 = t1 + 60_000 // 60s later — normal heartbeat
    const t3 = t2 + 10 * 60_000 // 10 min later — long gap, should be capped at 90s

    await recordHeartbeat(d1, { userId: 2, tenantId: TENANT_A, roleId: 4 }, t0)
    const r1 = await recordHeartbeat(d1, { userId: 2, tenantId: TENANT_A, roleId: 4 }, t1)
    const r2 = await recordHeartbeat(d1, { userId: 2, tenantId: TENANT_A, roleId: 4 }, t2)
    const r3 = await recordHeartbeat(d1, { userId: 2, tenantId: TENANT_A, roleId: 4 }, t3)

    if (r1.ok) assert.equal(r1.credited, 60)
    if (r2.ok) assert.equal(r2.credited, 60)
    if (r3.ok) assert.equal(r3.credited, 90, 'long gap must be capped, not credited in full')

    const total = db.prepare(
      'SELECT active_seconds FROM user_active_time_daily WHERE user_id = 2 AND activity_date = ?'
    ).get('2026-03-10') as { active_seconds: number }
    assert.equal(total.active_seconds, 60 + 60 + 90)
  })

  it('ignores sub-5s deltas without touching the daily rollup', async () => {
    const db = createTestDb()
    seedActivityTables(db)
    seedUsers(db)
    const d1 = createSqliteD1(db)

    const t0 = Date.parse('2026-03-10T09:00:00.000Z')
    await recordHeartbeat(d1, { userId: 2, tenantId: TENANT_A, roleId: 4 }, t0)
    const r = await recordHeartbeat(d1, { userId: 2, tenantId: TENANT_A, roleId: 4 }, t0 + 2_000)
    if (r.ok) assert.equal(r.credited, 0)

    const daily = db.prepare('SELECT COUNT(*) AS n FROM user_active_time_daily').get() as { n: number }
    assert.equal(daily.n, 0, 'noise pings must not create daily rows')
  })

  it('splits credit into the correct daily bucket by heartbeat timestamp', async () => {
    const db = createTestDb()
    seedActivityTables(db)
    seedUsers(db)
    const d1 = createSqliteD1(db)

    // Two heartbeats on day 1, two on day 2. Credit lands in the bucket of the
    // incoming heartbeat's UTC date, and day 2's first ping is a long gap → capped.
    const day1a = Date.parse('2026-03-10T23:00:00.000Z')
    const day1b = day1a + 60_000
    const day2a = Date.parse('2026-03-11T01:00:00.000Z')
    const day2b = day2a + 60_000

    await recordHeartbeat(d1, { userId: 2, tenantId: TENANT_A, roleId: 4 }, day1a)
    await recordHeartbeat(d1, { userId: 2, tenantId: TENANT_A, roleId: 4 }, day1b)
    await recordHeartbeat(d1, { userId: 2, tenantId: TENANT_A, roleId: 4 }, day2a)
    await recordHeartbeat(d1, { userId: 2, tenantId: TENANT_A, roleId: 4 }, day2b)

    const rows = db.prepare(
      'SELECT activity_date, active_seconds FROM user_active_time_daily WHERE user_id = 2 ORDER BY activity_date'
    ).all() as { activity_date: string; active_seconds: number }[]

    assert.deepEqual(rows, [
      // day1a seeded (0), day1b credited 60
      { activity_date: '2026-03-10', active_seconds: 60 },
      // day2a is a long gap → capped at 90, day2b credited 60
      { activity_date: '2026-03-11', active_seconds: 90 + 60 },
    ])
  })
})

describe('getStaffActiveTimeReport', () => {
  it('rejects unauthenticated with 401 and non-role-2 with 403', async () => {
    const db = createTestDb()
    seedActivityTables(db)
    seedUsers(db)
    const d1 = createSqliteD1(db)

    const unauth = await getStaffActiveTimeReport(d1, { userId: null, tenantId: TENANT_A, roleId: 2 }, {})
    assert.equal(unauth.ok, false)
    if (!unauth.ok) assert.equal(unauth.status, 401)

    for (const roleId of [1, 3, 4, 5, 6]) {
      const res = await getStaffActiveTimeReport(
        d1,
        { userId: 1, tenantId: TENANT_A, roleId },
        {}
      )
      assert.equal(res.ok, false, `role ${roleId} must not read the report`)
      if (!res.ok) assert.equal(res.status, 403)
    }
  })

  it('returns aggregates only for active staff (4/5/6/14/15) in the same tenant', async () => {
    const db = createTestDb()
    seedActivityTables(db)
    seedUsers(db)
    const d1 = createSqliteD1(db)

    // Seed some daily rows across both tenants.
    db.prepare(
      `INSERT INTO user_active_time_daily (user_id, tenant_id, activity_date, active_seconds) VALUES
       (2, ?, '2026-03-10', 3600),
       (2, ?, '2026-03-11', 1800),
       (3, ?, '2026-03-10', 900),
       (4, ?, '2026-03-10', 7200),
       (5, ?, '2026-03-10', 5000), -- inactive user, must be excluded
       (6, ?, '2026-03-10', 300),  -- legacy role 14, must be included
       (8, ?, '2026-03-10', 9999), -- other tenant, must be excluded
       (9, ?, '2026-03-10', 500)   -- role 3 supervisor, must be excluded`
    ).run(
      TENANT_A, TENANT_A, TENANT_A, TENANT_A, TENANT_A, TENANT_A, TENANT_B, TENANT_A
    )

    const res = await getStaffActiveTimeReport(
      d1,
      { userId: 1, tenantId: TENANT_A, roleId: 2 },
      { start_date: '2026-03-01', end_date: '2026-03-31' }
    )
    assert.equal(res.ok, true)
    if (!res.ok) return

    assert.equal(res.start_date, '2026-03-01')
    assert.equal(res.end_date, '2026-03-31')

    const byId = new Map(res.rows.map((r) => [r.user_id, r]))
    assert.equal(byId.has(5), false, 'inactive user must not appear')
    assert.equal(byId.has(8), false, 'other tenant must not appear')
    assert.equal(byId.has(9), false, 'role 3 must not appear')

    // Employee A: 3600 + 1800 across 2 days.
    assert.equal(byId.get(2)?.total_active_seconds, 5400)
    assert.equal(byId.get(2)?.days_active, 2)

    // Dual agent (role 6) included.
    assert.equal(byId.get(4)?.total_active_seconds, 7200)

    // Legacy role 14 is included and normalized to role 4 in output.
    const legacy = byId.get(6)
    assert.ok(legacy, 'legacy role 14 user must appear')
    assert.equal(legacy?.role_id, 4, 'legacy role must be normalized in output')

    // Sorted by total desc.
    assert.deepEqual(res.rows.map((r) => r.user_id), [4, 2, 3, 6])
  })

  it('lists staff with zero active seconds when they have no daily rows in range', async () => {
    const db = createTestDb()
    seedActivityTables(db)
    seedUsers(db)
    const d1 = createSqliteD1(db)

    const res = await getStaffActiveTimeReport(
      d1,
      { userId: 1, tenantId: TENANT_A, roleId: 2 },
      { start_date: '2026-03-01', end_date: '2026-03-31' }
    )
    assert.equal(res.ok, true)
    if (!res.ok) return
    for (const row of res.rows) {
      assert.equal(row.total_active_seconds, 0)
      assert.equal(row.days_active, 0)
    }
    // Employee A, Bank Agent A, Dual Agent A, Legacy Employee → 4 rows
    assert.equal(res.rows.length, 4)
  })

  it('falls back to a default 30-day window when dates are missing or malformed', async () => {
    const db = createTestDb()
    seedActivityTables(db)
    seedUsers(db)
    const d1 = createSqliteD1(db)

    const now = Date.parse('2026-04-15T12:00:00.000Z')
    const res = await getStaffActiveTimeReport(
      d1,
      { userId: 1, tenantId: TENANT_A, roleId: 2 },
      { start_date: 'garbage', end_date: '' },
      now
    )
    assert.equal(res.ok, true)
    if (!res.ok) return
    assert.equal(res.end_date, '2026-04-15')
    assert.equal(res.start_date, '2026-03-16') // 30 days back
  })

  it('date-range filter excludes rows outside the window', async () => {
    const db = createTestDb()
    seedActivityTables(db)
    seedUsers(db)
    const d1 = createSqliteD1(db)

    db.prepare(
      `INSERT INTO user_active_time_daily (user_id, tenant_id, activity_date, active_seconds) VALUES
       (2, ?, '2026-02-01', 1000),
       (2, ?, '2026-03-15', 2000),
       (2, ?, '2026-04-01', 3000)`
    ).run(TENANT_A, TENANT_A, TENANT_A)

    const res = await getStaffActiveTimeReport(
      d1,
      { userId: 1, tenantId: TENANT_A, roleId: 2 },
      { start_date: '2026-03-01', end_date: '2026-03-31' }
    )
    assert.equal(res.ok, true)
    if (!res.ok) return
    const row = res.rows.find((r) => r.user_id === 2)
    assert.equal(row?.total_active_seconds, 2000)
    assert.equal(row?.days_active, 1)
  })
})
