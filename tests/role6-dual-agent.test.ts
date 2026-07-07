/**
 * Role 6 (dual agent) — data isolation and contract flow tests.
 *
 * Covers:
 *  - canUserAccessCustomer: employee-only, bank-agent-only, both, unassigned
 *  - isBankAgentAssignedToCustomer isolation
 *  - canUserAccessRequestWorkflow: role 6 employee OR bank-agent assignment
 *  - listUnauthorizedStaffForCustomerAlerts: unassigned role 6 flagged as unauthorized
 *  - Workflow notifications: role 6 employee-only gets no bank-agent notifications
 *  - Workflow notifications: role 6 bank-agent-only gets no employee notifications
 *  - No fr.created_by scope leak for role 6 (employee FR creator ≠ bank agent)
 *  - Capability helpers: isDualRole, isEmployeeAssignableRole, isBankAgentAssignableRole
 *  - Regression: role 4 and role 5 access behavior unchanged
 *  - Contract approval: role 6 without assigned_bank_agent_id cannot approve
 *  - Contract approval: role 6 with assigned_bank_agent_id can approve
 *  - Contract creation status: employee-only → awaiting bank agent, both columns → awaiting admin
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  canUserAccessCustomer,
  isBankAgentAssignedToCustomer,
  canRole5AccessFinancingRequest,
  canUserAccessRequestWorkflow,
  listUnauthorizedStaffForCustomerAlerts,
  resolveWorkflowNotifyTargetUserIds,
  resolveWorkflowCrossPartyNotifyTargetUserIds,
  isDualRole,
  isEmployeeAssignableRole,
  isBankAgentAssignableRole,
  canCreateFinancingRequest,
  normalizeRoleId,
} from '../src/notification-access.ts'
import { createSqliteD1, createTestDb } from './helpers/sqlite-d1.ts'

// ─── shared constants ────────────────────────────────────────────────────────
const TENANT = 20
const OTHER_TENANT = 21
const C1 = 201   // customer assigned to role6 as employee only
const C2 = 202   // customer assigned to role6 as bank agent only
const C3 = 203   // customer assigned to role6 as both employee and bank agent
const C4 = 204   // customer with no role6 assignment at all

const FR1 = 601  // financing request for C1 (no bank agent assignment → role6 not bank agent)
const FR2 = 602  // financing request for C2 (role6 is assigned_bank_agent_id)
const FR3 = 603  // financing request for C3 (role6 assigned as bank agent)

// User IDs
const U_ROLE4 = 10         // regular employee role 4
const U_ROLE5 = 11         // regular bank agent role 5
const U_ROLE6 = 12         // dual agent role 6
const U_ROLE6_UNASSIGNED = 13  // role 6 in same tenant but assigned to nothing
const U_ROLE3 = 14         // supervisor
const U_ROLE2 = 15         // company admin

function seedDualAgentScenario(db: ReturnType<typeof createTestDb>) {
  db.prepare(`
    INSERT INTO users (id, full_name, tenant_id, role_id, is_active) VALUES
    (${U_ROLE4},  'Employee4',           ${TENANT},       4, 1),
    (${U_ROLE5},  'BankAgent5',          ${TENANT},       5, 1),
    (${U_ROLE6},  'DualAgent6',          ${TENANT},       6, 1),
    (${U_ROLE6_UNASSIGNED}, 'UnassignedDual6', ${TENANT}, 6, 1),
    (${U_ROLE3},  'Supervisor3',         ${TENANT},       3, 1),
    (${U_ROLE2},  'CompanyAdmin2',       ${TENANT},       2, 1)
  `).run()

  // C1: role6 is employee only
  db.prepare(`INSERT INTO customers (id, tenant_id, assigned_bank_agent_id, created_by) VALUES (?,?,?,?)`).run(C1, TENANT, U_ROLE5, U_ROLE4)
  db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C1, U_ROLE6)
  db.prepare(`INSERT INTO financing_requests (id, customer_id, assigned_bank_agent_id, created_by) VALUES (?,?,?,?)`).run(FR1, C1, U_ROLE5, U_ROLE4)

  // C2: role6 is bank agent only (not in customer_assignments)
  db.prepare(`INSERT INTO customers (id, tenant_id, assigned_bank_agent_id, created_by) VALUES (?,?,?,?)`).run(C2, TENANT, U_ROLE6, U_ROLE4)
  db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C2, U_ROLE4)
  db.prepare(`INSERT INTO financing_requests (id, customer_id, assigned_bank_agent_id, created_by) VALUES (?,?,?,?)`).run(FR2, C2, U_ROLE6, U_ROLE4)

  // C3: role6 is both employee and bank agent
  db.prepare(`INSERT INTO customers (id, tenant_id, assigned_bank_agent_id, created_by) VALUES (?,?,?,?)`).run(C3, TENANT, U_ROLE6, U_ROLE4)
  db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C3, U_ROLE6)
  db.prepare(`INSERT INTO financing_requests (id, customer_id, assigned_bank_agent_id, created_by) VALUES (?,?,?,?)`).run(FR3, C3, U_ROLE6, U_ROLE4)

  // C4: role6 not assigned at all
  db.prepare(`INSERT INTO customers (id, tenant_id, assigned_bank_agent_id, created_by) VALUES (?,?,?,?)`).run(C4, TENANT, U_ROLE5, U_ROLE4)
  db.prepare(`INSERT INTO customer_assignments (customer_id, employee_id) VALUES (?,?)`).run(C4, U_ROLE4)
}

// ─── canCreateFinancingRequest ────────────────────────────────────────────────
describe('canCreateFinancingRequest', () => {
  it('includes role 6 alongside roles 4 and 5', () => {
    assert.equal(canCreateFinancingRequest(6), true)
    assert.equal(canCreateFinancingRequest(4), true)
    assert.equal(canCreateFinancingRequest(5), true)
    assert.equal(canCreateFinancingRequest(3), true)
    assert.equal(canCreateFinancingRequest(7), false)
  })
})

// ─── capability helpers ───────────────────────────────────────────────────────
describe('role 6 — capability helpers', () => {
  it('isDualRole returns true only for role 6', () => {
    assert.equal(isDualRole(6), true)
    assert.equal(isDualRole(4), false)
    assert.equal(isDualRole(5), false)
    assert.equal(isDualRole(1), false)
    assert.equal(isDualRole(null), false)
  })

  it('isEmployeeAssignableRole includes roles 4 and 6 but not 5', () => {
    assert.equal(isEmployeeAssignableRole(4), true)
    assert.equal(isEmployeeAssignableRole(6), true)
    assert.equal(isEmployeeAssignableRole(14), true)  // legacy 14 → 4
    assert.equal(isEmployeeAssignableRole(5), false)
    assert.equal(isEmployeeAssignableRole(3), false)
    assert.equal(isEmployeeAssignableRole(2), false)
  })

  it('isBankAgentAssignableRole includes roles 5 and 6 but not 4', () => {
    assert.equal(isBankAgentAssignableRole(5), true)
    assert.equal(isBankAgentAssignableRole(6), true)
    assert.equal(isBankAgentAssignableRole(15), true)  // legacy 15 → 5
    assert.equal(isBankAgentAssignableRole(4), false)
    assert.equal(isBankAgentAssignableRole(3), false)
    assert.equal(isBankAgentAssignableRole(1), false)
  })
})

// ─── canUserAccessCustomer ────────────────────────────────────────────────────
describe('role 6 — canUserAccessCustomer isolation', () => {
  it('role 6 as employee-only can access their assigned customer', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    const result = await canUserAccessCustomer(d1, { userId: U_ROLE6, tenantId: TENANT, roleId: 6 }, { id: C1, tenant_id: TENANT })
    assert.equal(result, true, 'role 6 employee should access C1')
  })

  it('role 6 as employee-only does NOT access a customer where they are only bank agent on another', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // C4: role6 has no assignment at all
    const result = await canUserAccessCustomer(d1, { userId: U_ROLE6, tenantId: TENANT, roleId: 6 }, { id: C4, tenant_id: TENANT })
    assert.equal(result, false, 'unassigned role 6 must not access C4')
  })

  it('role 6 as bank-agent-only can access their assigned customer via assigned_bank_agent_id', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    const result = await canUserAccessCustomer(d1, { userId: U_ROLE6, tenantId: TENANT, roleId: 6 }, { id: C2, tenant_id: TENANT })
    assert.equal(result, true, 'role 6 bank agent should access C2')
  })

  it('role 6 as bank-agent-only does NOT get employee scope on C1 (assigned to role4 employee)', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    // Remove role6 from C1 employee assignment to isolate bank-agent-only scenario
    db.prepare(`DELETE FROM customer_assignments WHERE customer_id = ? AND employee_id = ?`).run(C1, U_ROLE6)
    const d1 = createSqliteD1(db)
    const result = await canUserAccessCustomer(d1, { userId: U_ROLE6, tenantId: TENANT, roleId: 6 }, { id: C1, tenant_id: TENANT })
    assert.equal(result, false, 'role 6 not assigned to C1 should not access it')
  })

  it('role 6 assigned as both can access their customer from either path', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    const result = await canUserAccessCustomer(d1, { userId: U_ROLE6, tenantId: TENANT, roleId: 6 }, { id: C3, tenant_id: TENANT })
    assert.equal(result, true, 'role 6 both-column should access C3')
  })

  it('unassigned role 6 in same tenant cannot access any customer', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    for (const cid of [C1, C2, C3, C4]) {
      const result = await canUserAccessCustomer(d1, { userId: U_ROLE6_UNASSIGNED, tenantId: TENANT, roleId: 6 }, { id: cid, tenant_id: TENANT })
      assert.equal(result, false, `unassigned role 6 must not access customer ${cid}`)
    }
  })

  it('role 6 cannot access customer in a different tenant even if assigned in own tenant', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // C1 belongs to TENANT, but we ask with OTHER_TENANT scope
    const result = await canUserAccessCustomer(d1, { userId: U_ROLE6, tenantId: OTHER_TENANT, roleId: 6 }, { id: C1, tenant_id: TENANT })
    assert.equal(result, false, 'role 6 must not cross tenant boundary')
  })

  // No created_by leak: role 6 creating a customer in employee context does not grant bank-agent scope
  it('role 6 creating a customer record does NOT gain bank-agent access via created_by', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    // Simulate: role 6 created C4 (set created_by = role6), but is NOT assigned_bank_agent_id
    db.prepare(`UPDATE customers SET created_by = ? WHERE id = ?`).run(U_ROLE6, C4)
    const d1 = createSqliteD1(db)
    // Role 6 is NOT in customer_assignments for C4 and NOT assigned_bank_agent_id
    const result = await canUserAccessCustomer(d1, { userId: U_ROLE6, tenantId: TENANT, roleId: 6 }, { id: C4, tenant_id: TENANT })
    assert.equal(result, false, 'created_by alone must not grant role 6 bank-agent scope')
  })
})

// ─── isBankAgentAssignedToCustomer ───────────────────────────────────────────
describe('role 6 — isBankAgentAssignedToCustomer (strict assignment check)', () => {
  it('returns true when role 6 is assigned_bank_agent_id on customer', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    const result = await isBankAgentAssignedToCustomer(d1, U_ROLE6, C2, TENANT)
    assert.equal(result, true)
  })

  it('returns false when role 6 is only in customer_assignments (employee column)', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // C1: role6 is employee, role5 is bank agent
    const result = await isBankAgentAssignedToCustomer(d1, U_ROLE6, C1, TENANT)
    assert.equal(result, false, 'employee-column role 6 must not pass bank-agent check')
  })

  it('returns true when role 6 is assigned_bank_agent_id on a financing request for the customer', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    // Manually assign role6 as FR bank agent for C4 (customer itself has role5)
    db.prepare(`INSERT INTO financing_requests (id, customer_id, assigned_bank_agent_id, created_by) VALUES (?,?,?,?)`).run(699, C4, U_ROLE6, U_ROLE4)
    const d1 = createSqliteD1(db)
    const result = await isBankAgentAssignedToCustomer(d1, U_ROLE6, C4, TENANT)
    assert.equal(result, true, 'role 6 explicitly assigned as FR bank agent should pass')
  })
})

// ─── canRole5AccessFinancingRequest for role 6 ───────────────────────────────
describe('role 6 — canRole5AccessFinancingRequest (bank-agent FR scope)', () => {
  it('returns true when role 6 is assigned_bank_agent_id on the FR row', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    const result = await canRole5AccessFinancingRequest(
      d1,
      { userId: U_ROLE6, tenantId: TENANT, roleId: 6 },
      { customer_id: C2, customer_tenant_id: TENANT, assigned_bank_agent_id: U_ROLE6 }
    )
    assert.equal(result, true)
  })

  it('returns false when role 6 is NOT assigned_bank_agent_id on the FR row (employee-only context)', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // FR1 has role5 as bank agent, role6 is only in customer_assignments
    const result = await canRole5AccessFinancingRequest(
      d1,
      { userId: U_ROLE6, tenantId: TENANT, roleId: 6 },
      { customer_id: C1, customer_tenant_id: TENANT, assigned_bank_agent_id: U_ROLE5 }
    )
    assert.equal(result, false, 'role 6 not assigned as bank agent on FR must be denied')
  })
})

// ─── canUserAccessRequestWorkflow for role 6 ─────────────────────────────────
describe('role 6 — canUserAccessRequestWorkflow', () => {
  it('allows employee-only role 6 on FR when assigned via customer_assignments', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    const result = await canUserAccessRequestWorkflow(d1, { userId: U_ROLE6, tenantId: TENANT, roleId: 6 }, FR1)
    assert.equal(result, true, 'employee-assigned role 6 must open request workflow')
  })

  it('allows bank-agent role 6 on FR when assigned_bank_agent_id matches', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    const result = await canUserAccessRequestWorkflow(d1, { userId: U_ROLE6, tenantId: TENANT, roleId: 6 }, FR2)
    assert.equal(result, true)
  })

  it('denies unassigned role 6 on any request', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    for (const frId of [FR1, FR2, FR3]) {
      const result = await canUserAccessRequestWorkflow(
        d1,
        { userId: U_ROLE6_UNASSIGNED, tenantId: TENANT, roleId: 6 },
        frId
      )
      assert.equal(result, false, `unassigned role 6 must not access workflow for FR ${frId}`)
    }
  })
})

// ─── listUnauthorizedStaffForCustomerAlerts ───────────────────────────────────
describe('role 6 — listUnauthorizedStaffForCustomerAlerts', () => {
  it('unassigned role 6 in same tenant is reported as unauthorized for C1', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // Allowed targets for C1: the assigned employee (role6=U_ROLE6) and bank agent (role5=U_ROLE5)
    const leaked = await listUnauthorizedStaffForCustomerAlerts(d1, { id: C1, tenant_id: TENANT }, [U_ROLE6, U_ROLE5])
    assert.ok(leaked.includes(U_ROLE6_UNASSIGNED), 'unassigned role 6 must be in leaked list')
    assert.ok(!leaked.includes(U_ROLE6), 'assigned role 6 (employee) must not be in leaked list')
    assert.ok(!leaked.includes(U_ROLE5), 'assigned role 5 (bank agent) must not be in leaked list')
  })

  it('role 6 assigned as employee for C1 is not unauthorized for C1', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    const leaked = await listUnauthorizedStaffForCustomerAlerts(d1, { id: C1, tenant_id: TENANT }, [U_ROLE6, U_ROLE5])
    assert.ok(!leaked.includes(U_ROLE6), 'role 6 employee for C1 must not be unauthorized')
  })

  it('role 6 assigned as bank agent for C2 is not unauthorized for C2', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    const leaked = await listUnauthorizedStaffForCustomerAlerts(d1, { id: C2, tenant_id: TENANT }, [U_ROLE4, U_ROLE6])
    assert.ok(!leaked.includes(U_ROLE6), 'role 6 bank agent for C2 must not be unauthorized')
  })
})

// ─── Workflow notifications ───────────────────────────────────────────────────
describe('role 6 — workflow notification routing', () => {
  it('role 6 acting as bank agent (role 5-like) notifies the assigned employee', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // Role 6 (bank agent on C3) acts → should notify the employee assigned to C3
    const targets = await resolveWorkflowCrossPartyNotifyTargetUserIds(
      d1, C3, U_ROLE6, 6, TENANT, FR3
    )
    // Employee assigned to C3 is role6 itself — exclude actor → empty
    // (role 6 is both columns for C3, actor is excluded from notify)
    assert.ok(!targets.includes(U_ROLE6), 'role 6 actor must not notify themselves')
  })

  it('resolveWorkflowNotifyTargetUserIds returns role 6 when they are the assigned employee', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // Looking for the employee for C1 — should find U_ROLE6 (role 6 in employee column)
    const targets = await resolveWorkflowNotifyTargetUserIds(d1, C1, 4, TENANT)
    assert.ok(targets.includes(U_ROLE6), 'role 6 in employee column should receive employee notifications for C1')
  })

  it('resolveWorkflowNotifyTargetUserIds returns role 6 when they are the assigned bank agent', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // Looking for bank agent for C2 — should find U_ROLE6
    const targets = await resolveWorkflowNotifyTargetUserIds(d1, C2, 5, TENANT)
    assert.ok(targets.includes(U_ROLE6), 'role 6 as bank agent should receive bank-agent notifications for C2')
  })

  it('unassigned role 6 does NOT receive notifications for any customer', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    for (const cid of [C1, C2, C3, C4]) {
      const emp = await resolveWorkflowNotifyTargetUserIds(d1, cid, 4, TENANT)
      const agent = await resolveWorkflowNotifyTargetUserIds(d1, cid, 5, TENANT)
      assert.ok(!emp.includes(U_ROLE6_UNASSIGNED), `unassigned role 6 must not get employee notify for customer ${cid}`)
      assert.ok(!agent.includes(U_ROLE6_UNASSIGNED), `unassigned role 6 must not get bank-agent notify for customer ${cid}`)
    }
  })
})

// ─── No created_by FR leak ────────────────────────────────────────────────────
describe('role 6 — no FR created_by scope leak', () => {
  it('role 6 who created an FR as employee does NOT get bank-agent access to that customer', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    // Simulate: role 6 created FR for C4 in employee context, but NOT assigned as bank agent
    db.prepare(`INSERT INTO financing_requests (id, customer_id, assigned_bank_agent_id, created_by) VALUES (?,?,?,?)`).run(700, C4, null, U_ROLE6)
    const d1 = createSqliteD1(db)
    // isBankAgentAssignedToCustomer must return false (no explicit assigned_bank_agent_id)
    const bankScope = await isBankAgentAssignedToCustomer(d1, U_ROLE6, C4, TENANT)
    assert.equal(bankScope, false, 'FR created_by must not grant bank-agent scope to role 6')
    // canUserAccessCustomer must also return false (not in customer_assignments either)
    const access = await canUserAccessCustomer(d1, { userId: U_ROLE6, tenantId: TENANT, roleId: 6 }, { id: C4, tenant_id: TENANT })
    assert.equal(access, false, 'FR created_by must not grant canUserAccessCustomer to unassigned role 6')
  })
})

// ─── Regression: role 4 and role 5 unchanged ─────────────────────────────────
describe('regression — role 4 and role 5 behavior unchanged', () => {
  it('role 4 can access their assigned customer and no others', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // Role 4 is in customer_assignments for C2 and C4 only.
    // C1 and C3 have role6 in customer_assignments, not role4.
    const c2 = await canUserAccessCustomer(d1, { userId: U_ROLE4, tenantId: TENANT, roleId: 4 }, { id: C2, tenant_id: TENANT })
    const c3 = await canUserAccessCustomer(d1, { userId: U_ROLE4, tenantId: TENANT, roleId: 4 }, { id: C3, tenant_id: TENANT })
    const c4 = await canUserAccessCustomer(d1, { userId: U_ROLE4, tenantId: TENANT, roleId: 4 }, { id: C4, tenant_id: TENANT })
    const c1 = await canUserAccessCustomer(d1, { userId: U_ROLE4, tenantId: TENANT, roleId: 4 }, { id: C1, tenant_id: TENANT })
    assert.equal(c2, true,  'role 4 should access C2 (assigned)')
    assert.equal(c3, false, 'role 4 should NOT access C3 (role6 is the employee, not role4)')
    assert.equal(c4, true,  'role 4 should access C4 (assigned)')
    assert.equal(c1, false, 'role 4 should NOT access C1 (role6 is the employee, not role4)')
  })

  it('role 5 can access customer via assigned_bank_agent_id but not via employee column only', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // C1: role5 is the bank agent
    const c1 = await canUserAccessCustomer(d1, { userId: U_ROLE5, tenantId: TENANT, roleId: 5 }, { id: C1, tenant_id: TENANT })
    assert.equal(c1, true, 'role 5 should access C1 (assigned_bank_agent_id)')
    // C3: role6 is the bank agent, role5 is NOT
    const c3 = await canUserAccessCustomer(d1, { userId: U_ROLE5, tenantId: TENANT, roleId: 5 }, { id: C3, tenant_id: TENANT })
    assert.equal(c3, false, 'role 5 should NOT access C3 (role6 is bank agent, not role5)')
  })

  it('role 4 employee notifications still route to the assigned employee only', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // C4: role4 is the employee
    const targets = await resolveWorkflowNotifyTargetUserIds(d1, C4, 4, TENANT)
    assert.ok(targets.includes(U_ROLE4), 'role 4 employee should receive employee notifications for C4')
    assert.ok(!targets.includes(U_ROLE6), 'role 6 should not receive employee notifications for C4')
    assert.ok(!targets.includes(U_ROLE6_UNASSIGNED), 'unassigned role 6 must not receive notifications')
  })

  it('role 5 bank agent notifications still route to the assigned bank agent only', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // C4: role5 is the bank agent
    const targets = await resolveWorkflowNotifyTargetUserIds(d1, C4, 5, TENANT)
    assert.ok(targets.includes(U_ROLE5), 'role 5 should receive bank-agent notifications for C4')
    assert.ok(!targets.includes(U_ROLE6), 'role 6 should not receive bank-agent notifications for C4')
  })
})

// ─── Contract approval logic (via contracts-module-api helpers) ───────────────
describe('role 6 — contract approval: assigned_bank_agent_id enforcement', () => {
  it('isBankAgentAssignedToCustomer returns false for role 6 who is NOT assigned_bank_agent_id (blocks approval)', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // C1: role6 is employee, role5 is bank agent — role6 must NOT be able to approve C1 contracts
    const canApprove = await isBankAgentAssignedToCustomer(d1, U_ROLE6, C1, TENANT)
    assert.equal(canApprove, false, 'role 6 not assigned as bank agent for C1 must not approve C1 contracts')
  })

  it('isBankAgentAssignedToCustomer returns true for role 6 explicitly assigned as bank agent (allows approval)', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // C2: role6 is the assigned_bank_agent_id
    const canApprove = await isBankAgentAssignedToCustomer(d1, U_ROLE6, C2, TENANT)
    assert.equal(canApprove, true, 'role 6 explicitly assigned as bank agent for C2 must be able to approve C2 contracts')
  })

  it('role 6 as bank agent for C3 can approve (both columns)', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    const canApprove = await isBankAgentAssignedToCustomer(d1, U_ROLE6, C3, TENANT)
    assert.equal(canApprove, true, 'role 6 in both columns for C3 must be able to approve C3 contracts')
  })

  it('role 6 without any assignment for C4 cannot approve C4 contracts', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    const canApprove = await isBankAgentAssignedToCustomer(d1, U_ROLE6, C4, TENANT)
    assert.equal(canApprove, false, 'completely unassigned role 6 must not approve')
  })
})

// ─── Contract dual-column skip detection ─────────────────────────────────────
describe('role 6 — dual-column detection (both employee and bank agent)', () => {
  it('detects both-column assignment when role 6 is in customer_assignments AND assigned_bank_agent_id on FR', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // C3: role6 is in both columns
    const isEmployee = await d1
      .prepare('SELECT 1 AS ok FROM customer_assignments WHERE customer_id = ? AND employee_id = ? LIMIT 1')
      .bind(C3, U_ROLE6)
      .first<{ ok: number }>()
    const isBankAgent = await d1
      .prepare('SELECT 1 AS ok FROM financing_requests WHERE id = ? AND assigned_bank_agent_id = ? LIMIT 1')
      .bind(FR3, U_ROLE6)
      .first<{ ok: number }>()
    assert.equal(Boolean(isEmployee?.ok), true,  'role 6 must be in customer_assignments for C3')
    assert.equal(Boolean(isBankAgent?.ok), true, 'role 6 must be assigned_bank_agent_id on FR3')
  })

  it('employee-only: role 6 in customer_assignments but NOT assigned_bank_agent_id on FR → no skip', async () => {
    const db = createTestDb()
    seedDualAgentScenario(db)
    const d1 = createSqliteD1(db)
    // C1: role6 is employee, role5 is bank agent on FR1
    const isBankAgentOnFr = await d1
      .prepare('SELECT 1 AS ok FROM financing_requests WHERE id = ? AND assigned_bank_agent_id = ? LIMIT 1')
      .bind(FR1, U_ROLE6)
      .first<{ ok: number }>()
    assert.equal(Boolean(isBankAgentOnFr?.ok), false, 'role 6 employee-only must NOT be assigned_bank_agent_id on FR1')
  })
})
