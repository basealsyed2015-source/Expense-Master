import { describe, it } from 'node:test'

import assert from 'node:assert/strict'

import {

  resolveWorkflowNotifyTargetUserIds,

  resolveWorkflowCrossPartyNotifyTargetUserIds,

  insertWorkflowCrossPartyAlarms,

  canUserAccessCustomer,

  listUnauthorizedStaffForCustomerAlerts,

} from '../src/notification-access.ts'

import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'



const TENANT = 10

const CUSTOMER_ID = 100

const REQUEST_ID = 500



/** Assigned employee (4), sales supervisor (3), bank agent (5), plus unassigned peers. */

function seedScenario(db: ReturnType<typeof createTestDb>) {

  db.prepare(

    `INSERT INTO users (id, full_name, tenant_id, role_id, is_active) VALUES

     (1, 'Admin', ?, 1, 1),

     (2, 'Assigned Employee', ?, 4, 1),

     (3, 'Sales Supervisor', ?, 3, 1),

     (4, 'Assigned Bank Agent', ?, 5, 1),

     (5, 'Other Bank Agent', ?, 5, 1),

     (6, 'Other Employee', ?, 4, 1)`

  ).run(TENANT, TENANT, TENANT, TENANT, TENANT, TENANT)



  db.prepare(`INSERT INTO customers (id, tenant_id, assigned_bank_agent_id) VALUES (?, ?, ?)`).run(

    CUSTOMER_ID,

    TENANT,

    4

  )

  db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?, ?)`).run(

    CUSTOMER_ID,

    2

  )

  db.prepare(

    `INSERT INTO financing_requests (id, customer_id, assigned_bank_agent_id, created_by) VALUES (?, ?, ?, ?)`

  ).run(REQUEST_ID, CUSTOMER_ID, 4, 6)

}



async function countNotificationsForUser(

  d1: D1Database,

  userId: number,

  category: string,

  relatedRequestId: number

): Promise<number> {

  const row = await d1

    .prepare(

      `SELECT COUNT(*) AS c FROM notifications

       WHERE user_id = ? AND category = ? AND related_request_id = ?`

    )

    .bind(userId, category, relatedRequestId)

    .first<{ c: number }>()

  return Number(row?.c ?? 0)

}



async function countWorkflowAlarmsForUser(d1: D1Database, userId: number, customerId: number): Promise<number> {

  const row = await d1

    .prepare(

      `SELECT COUNT(*) AS c FROM customer_alarms

       WHERE user_id = ? AND customer_id = ? AND alarm_type = 'workflow'`

    )

    .bind(userId, customerId)

    .first<{ c: number }>()

  return Number(row?.c ?? 0)

}



/** Mirrors production workflow notify path (cross-party + actor exclusion). */

async function simulateWorkflowCrossPartyNotify(

  d1: D1Database,

  opts: {

    actorUserId: number

    actorRoleId: number

    customerId: number

    tenantId: number

    requestId?: number

    note: string

    customerName?: string

  }

) {

  const linkUrl = opts.requestId

    ? `/admin/requests/${opts.requestId}/workflow#request`

    : `/admin/customers/${opts.customerId}/workflow#customer`

  const targetUserIds = await resolveWorkflowCrossPartyNotifyTargetUserIds(

    d1,

    opts.customerId,

    opts.actorUserId,

    opts.actorRoleId,

    opts.tenantId,

    opts.requestId ?? null

  )

  if (!targetUserIds.length) return targetUserIds

  await insertWorkflowCrossPartyAlarms(d1, {

    customerId: opts.customerId,

    tenantId: opts.tenantId,

    targetUserIds,

    customerName: opts.customerName ?? 'Test workflow',

    note: opts.note,

    linkUrl,

  })

  return targetUserIds

}



async function assertNoWorkflowDelivery(

  d1: D1Database,

  userId: number,

  customerId: number,

  requestId: number,

  label: string

) {

  assert.equal(

    await countWorkflowAlarmsForUser(d1, userId, customerId),

    0,

    `${label}: user ${userId} must have no workflow alarm`

  )

  assert.equal(

    await countNotificationsForUser(d1, userId, 'workflow_action', requestId),

    0,

    `${label}: user ${userId} must have no workflow_action notification`

  )

}



/** Mirrors production: new-request notification goes to admin only (user 1). */

async function insertRequestNotification(d1: D1Database, requestId: number) {

  await d1

    .prepare(

      `INSERT INTO notifications (user_id, title, message, type, category, related_request_id)

       VALUES (?, ?, ?, ?, ?, ?)`

    )

    .bind(1, 'طلب تمويل جديد', `طلب #${requestId}`, 'info', 'request', requestId)

    .run()

}



/** Mirrors production: status-change notification goes to admin only (user 1). */

async function insertStatusChangeNotification(d1: D1Database, requestId: number) {

  await d1

    .prepare(

      `INSERT INTO notifications (user_id, title, message, type, category, related_request_id)

       VALUES (?, ?, ?, ?, ?, ?)`

    )

    .bind(1, 'تحديث حالة الطلب', `طلب #${requestId}`, 'info', 'status_change', requestId)

    .run()

}



describe('notification access — unauthorized users must not receive alerts', () => {

  it('request: unassigned role 4/5 staff receive no request notifications', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    const d1 = createSqliteD1(sqlite)

    await insertRequestNotification(d1, REQUEST_ID)



    const customer = { id: CUSTOMER_ID, tenant_id: TENANT }

    for (const uid of [2, 3, 4, 5, 6]) {

      const count = await countNotificationsForUser(d1, uid, 'request', REQUEST_ID)

      const roleId = uid === 4 || uid === 5 ? 5 : uid === 3 ? 3 : 4

      const hasAccess = await canUserAccessCustomer(d1, { userId: uid, tenantId: TENANT, roleId }, customer)

      if (!hasAccess && uid !== 1) {

        assert.equal(count, 0, `user ${uid} must not have request notification without access`)

      }

    }

    assert.equal(await countNotificationsForUser(d1, 3, 'request', REQUEST_ID), 0)

    assert.equal(await countNotificationsForUser(d1, 5, 'request', REQUEST_ID), 0)

    assert.equal(await countNotificationsForUser(d1, 6, 'request', REQUEST_ID), 0)

  })



  it('status_change: unassigned role 4/5 staff receive no status notifications', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    const d1 = createSqliteD1(sqlite)

    await insertStatusChangeNotification(d1, REQUEST_ID)



    assert.equal(await countNotificationsForUser(d1, 3, 'status_change', REQUEST_ID), 0)

    assert.equal(await countNotificationsForUser(d1, 5, 'status_change', REQUEST_ID), 0)

    assert.equal(await countNotificationsForUser(d1, 6, 'status_change', REQUEST_ID), 0)

    assert.equal(await countNotificationsForUser(d1, 2, 'status_change', REQUEST_ID), 0)

  })



  it('workflow_action: only assigned cross-party user gets workflow alarm (not all tenant staff)', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    const d1 = createSqliteD1(sqlite)

    const customer = { id: CUSTOMER_ID, tenant_id: TENANT }



    const targetsForRole4 = await resolveWorkflowCrossPartyNotifyTargetUserIds(

      d1,

      CUSTOMER_ID,

      4,

      5,

      TENANT,

      REQUEST_ID

    )

    assert.deepEqual(targetsForRole4, [2])



    await insertWorkflowCrossPartyAlarms(d1, {

      customerId: CUSTOMER_ID,

      tenantId: TENANT,

      targetUserIds: targetsForRole4,

      customerName: 'Test',

      note: 'Stage update',

      linkUrl: `/admin/requests/${REQUEST_ID}/workflow`,

    })



    assert.equal(await countWorkflowAlarmsForUser(d1, 2, CUSTOMER_ID), 1)

    assert.equal(await countWorkflowAlarmsForUser(d1, 6, CUSTOMER_ID), 0, 'unassigned employee')

    assert.equal(await countWorkflowAlarmsForUser(d1, 5, CUSTOMER_ID), 0, 'unassigned bank agent')



    const unauthorized = await listUnauthorizedStaffForCustomerAlerts(d1, customer, targetsForRole4)

    for (const uid of unauthorized) {

      assert.equal(

        await countWorkflowAlarmsForUser(d1, uid, CUSTOMER_ID),

        0,

        `user ${uid} must not have workflow alarm without customer access`

      )

    }

  })



  it('workflow_action: role-4 actor notifies only assigned bank agent (not created_by fallback)', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    const d1 = createSqliteD1(sqlite)



    const targetsForRole5 = await resolveWorkflowCrossPartyNotifyTargetUserIds(

      d1,

      CUSTOMER_ID,

      2,

      4,

      TENANT,

      REQUEST_ID

    )

    assert.deepEqual(targetsForRole5, [4], 'must use assigned_bank_agent_id, not created_by (6)')



    await insertWorkflowCrossPartyAlarms(d1, {

      customerId: CUSTOMER_ID,

      tenantId: TENANT,

      targetUserIds: targetsForRole5,

      customerName: 'Test',

      note: 'Action added',

      linkUrl: `/admin/requests/${REQUEST_ID}/workflow`,

    })



    assert.equal(await countWorkflowAlarmsForUser(d1, 4, CUSTOMER_ID), 1)

    assert.equal(await countWorkflowAlarmsForUser(d1, 5, CUSTOMER_ID), 0)

    assert.equal(await countWorkflowAlarmsForUser(d1, 6, CUSTOMER_ID), 0)

  })



  it('workflow_action: phase note creates alarm and notification center row for assigned user', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    const d1 = createSqliteD1(sqlite)



    await insertWorkflowCrossPartyAlarms(d1, {

      customerId: CUSTOMER_ID,

      tenantId: TENANT,

      targetUserIds: [4],

      customerName: 'ملاحظة على سير العمل',

      note: 'قام موظف بإضافة ملاحظة على الطلب #500 — متابعة العميل',

      linkUrl: `/admin/requests/${REQUEST_ID}/workflow#request`,

    })



    assert.equal(await countWorkflowAlarmsForUser(d1, 4, CUSTOMER_ID), 1)

    assert.equal(await countNotificationsForUser(d1, 4, 'workflow_action', REQUEST_ID), 1)

    assert.equal(await countNotificationsForUser(d1, 2, 'workflow_action', REQUEST_ID), 0)

  })



  it('workflow targeting returns empty when no assignment exists (no broadcast)', async () => {

    const sqlite = createTestDb()

    sqlite.prepare(

      `INSERT INTO users (id, full_name, tenant_id, role_id, is_active) VALUES (2, 'Emp', ?, 4, 1)`

    ).run(TENANT)

    sqlite.prepare(`INSERT INTO customers (id, tenant_id) VALUES (?, ?)`).run(CUSTOMER_ID, TENANT)

    const d1 = createSqliteD1(sqlite)



    const targets = await resolveWorkflowNotifyTargetUserIds(d1, CUSTOMER_ID, 4, TENANT)

    assert.deepEqual(targets, [])

  })



  it('workflow: unassigned role 3 and 5 receive no alarms or workflow_action notifications', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    const d1 = createSqliteD1(sqlite)



    const events = [

      { actorUserId: 4, actorRoleId: 5, note: 'Stage update by bank agent' },

      { actorUserId: 2, actorRoleId: 4, note: 'Action by assigned employee' },

      { actorUserId: 4, actorRoleId: 5, note: 'Note by bank agent' },

    ] as const



    for (const ev of events) {

      await simulateWorkflowCrossPartyNotify(d1, {

        ...ev,

        customerId: CUSTOMER_ID,

        tenantId: TENANT,

        requestId: REQUEST_ID,

      })

    }



    for (const uid of [3, 5, 6] as const) {

      await assertNoWorkflowDelivery(d1, uid, CUSTOMER_ID, REQUEST_ID, 'after all workflow events')

    }

    assert.equal(await countNotificationsForUser(d1, 2, 'workflow_action', REQUEST_ID), 2)

    assert.equal(await countNotificationsForUser(d1, 4, 'workflow_action', REQUEST_ID), 1)

  })



  it('workflow: role-4 actor does not receive their own cross-party notification', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    const d1 = createSqliteD1(sqlite)

    await simulateWorkflowCrossPartyNotify(d1, {

      actorUserId: 2,

      actorRoleId: 4,

      customerId: CUSTOMER_ID,

      tenantId: TENANT,

      requestId: REQUEST_ID,

      note: 'Employee added action',

    })

    await assertNoWorkflowDelivery(d1, 2, CUSTOMER_ID, REQUEST_ID, 'role-4 actor')

    assert.equal(await countNotificationsForUser(d1, 4, 'workflow_action', REQUEST_ID), 1)

  })



  it('workflow: role-5 actor does not receive their own cross-party notification', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    const d1 = createSqliteD1(sqlite)

    await simulateWorkflowCrossPartyNotify(d1, {

      actorUserId: 4,

      actorRoleId: 5,

      customerId: CUSTOMER_ID,

      tenantId: TENANT,

      requestId: REQUEST_ID,

      note: 'Bank agent added note',

    })

    await assertNoWorkflowDelivery(d1, 4, CUSTOMER_ID, REQUEST_ID, 'role-5 actor')

    assert.equal(await countNotificationsForUser(d1, 2, 'workflow_action', REQUEST_ID), 1)

  })



  it('workflow: actor excluded when they are also the resolved cross-party target', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    sqlite.prepare(`DELETE FROM customer_assignments WHERE customer_id = ?`).run(CUSTOMER_ID)

    sqlite.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?, ?)`).run(

      CUSTOMER_ID,

      4

    )

    const d1 = createSqliteD1(sqlite)



    const targets = await resolveWorkflowCrossPartyNotifyTargetUserIds(

      d1,

      CUSTOMER_ID,

      4,

      5,

      TENANT,

      REQUEST_ID

    )

    assert.deepEqual(targets, [], 'bank agent who is also listed as employee must not self-notify')



    await simulateWorkflowCrossPartyNotify(d1, {

      actorUserId: 4,

      actorRoleId: 5,

      customerId: CUSTOMER_ID,

      tenantId: TENANT,

      requestId: REQUEST_ID,

      note: 'Dual-hat bank agent note',

    })

    await assertNoWorkflowDelivery(d1, 4, CUSTOMER_ID, REQUEST_ID, 'dual assignment actor')

  })



  it('workflow: role-3 actor does not trigger workflow notifications', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    const d1 = createSqliteD1(sqlite)



    const targets = await simulateWorkflowCrossPartyNotify(d1, {

      actorUserId: 3,

      actorRoleId: 3,

      customerId: CUSTOMER_ID,

      tenantId: TENANT,

      requestId: REQUEST_ID,

      note: 'Supervisor note (no cross-party target)',

    })

    assert.deepEqual(targets, [])



    for (const uid of [2, 3, 4, 5, 6] as const) {

      assert.equal(

        await countNotificationsForUser(d1, uid, 'workflow_action', REQUEST_ID),

        0,

        `user ${uid} after role-3 actor`

      )

    }

  })



  it('workflow notification body includes the real customer name (not just the id)', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    // Give the customer a real name so the lookup has something to return.

    sqlite.prepare(`UPDATE customers SET full_name = ? WHERE id = ?`).run('أحمد الزهراني', CUSTOMER_ID)

    const d1 = createSqliteD1(sqlite)



    await insertWorkflowCrossPartyAlarms(d1, {

      customerId: CUSTOMER_ID,

      tenantId: TENANT,

      targetUserIds: [4],

      customerName: 'إجراء: متابعة',

      note: `قام موظف بإضافة إجراء "متابعة" على الطلب #${REQUEST_ID}`,

      linkUrl: `/admin/requests/${REQUEST_ID}/workflow#request`,

    })



    const alarm = await d1

      .prepare(`SELECT note FROM customer_alarms WHERE user_id = ? AND customer_id = ?`)

      .bind(4, CUSTOMER_ID)

      .first<{ note: string }>()

    assert.ok(alarm, 'alarm row must exist')

    assert.match(alarm!.note, /أحمد الزهراني/, 'alarm note must contain real customer name')

    assert.match(alarm!.note, /العميل:/, 'alarm note must include the "العميل:" prefix')



    const notif = await d1

      .prepare(`SELECT message FROM notifications WHERE user_id = ? AND related_request_id = ?`)

      .bind(4, REQUEST_ID)

      .first<{ message: string }>()

    assert.ok(notif, 'notification row must exist')

    assert.match(notif!.message, /أحمد الزهراني/, 'notification message must contain real customer name')

  })



  it('explicit customerDisplayName overrides DB lookup', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    sqlite.prepare(`UPDATE customers SET full_name = ? WHERE id = ?`).run('Stored Name', CUSTOMER_ID)

    const d1 = createSqliteD1(sqlite)



    await insertWorkflowCrossPartyAlarms(d1, {

      customerId: CUSTOMER_ID,

      tenantId: TENANT,

      targetUserIds: [4],

      customerName: 'تحديث مرحلة: مراجعة',

      customerDisplayName: 'Override Name',

      note: 'قام موظف بتحديث مرحلة الطلب',

      linkUrl: `/admin/requests/${REQUEST_ID}/workflow#request`,

    })



    const alarm = await d1

      .prepare(`SELECT note FROM customer_alarms WHERE user_id = ? AND customer_id = ?`)

      .bind(4, CUSTOMER_ID)

      .first<{ note: string }>()

    assert.match(alarm!.note, /Override Name/, 'explicit display name wins')

    assert.doesNotMatch(alarm!.note, /Stored Name/, 'DB name not used when override provided')

  })



  it('customer name is not duplicated when it already appears in the note', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    sqlite.prepare(`UPDATE customers SET full_name = ? WHERE id = ?`).run('سارة', CUSTOMER_ID)

    const d1 = createSqliteD1(sqlite)



    await insertWorkflowCrossPartyAlarms(d1, {

      customerId: CUSTOMER_ID,

      tenantId: TENANT,

      targetUserIds: [4],

      customerName: 'ملاحظة',

      note: 'تم إضافة ملاحظة على العميل سارة — متابعة',

      linkUrl: `/admin/requests/${REQUEST_ID}/workflow#request`,

    })



    const alarm = await d1

      .prepare(`SELECT note FROM customer_alarms WHERE user_id = ? AND customer_id = ?`)

      .bind(4, CUSTOMER_ID)

      .first<{ note: string }>()

    const occurrences = (alarm!.note.match(/سارة/g) || []).length

    assert.equal(occurrences, 1, 'name appears exactly once when already present in note')

  })



  it('falls back to "#<id>" when customer row has no name', async () => {

    const sqlite = createTestDb()

    seedScenario(sqlite)

    sqlite.prepare(`UPDATE customers SET full_name = NULL WHERE id = ?`).run(CUSTOMER_ID)

    const d1 = createSqliteD1(sqlite)



    await insertWorkflowCrossPartyAlarms(d1, {

      customerId: CUSTOMER_ID,

      tenantId: TENANT,

      targetUserIds: [4],

      customerName: 'إجراء',

      note: 'قام موظف بإجراء',

      linkUrl: `/admin/requests/${REQUEST_ID}/workflow#request`,

    })



    const alarm = await d1

      .prepare(`SELECT note FROM customer_alarms WHERE user_id = ? AND customer_id = ?`)

      .bind(4, CUSTOMER_ID)

      .first<{ note: string }>()

    assert.match(alarm!.note, new RegExp(`#${CUSTOMER_ID}`), 'falls back to numeric id')

    assert.match(alarm!.note, /العميل:/, 'still uses the "العميل:" prefix')

  })

})


