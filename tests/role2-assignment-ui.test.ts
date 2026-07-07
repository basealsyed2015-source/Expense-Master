import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { canInlineAssignCustomers, normalizeRoleId } from '../src/notification-access.ts'

describe('canInlineAssignCustomers — inline assignment dropdown visibility', () => {
  it('returns true for role 2 (company admin)', () => {
    assert.equal(canInlineAssignCustomers(2), true)
  })

  it('returns true for legacy role 12 (company admin)', () => {
    assert.equal(canInlineAssignCustomers(12), true)
  })

  it('returns false for role 1 (super admin)', () => {
    assert.equal(canInlineAssignCustomers(1), false)
  })

  it('returns false for legacy role 11 (super admin)', () => {
    assert.equal(canInlineAssignCustomers(11), false)
  })

  it('returns false for role 3 (supervisor)', () => {
    assert.equal(canInlineAssignCustomers(3), false)
  })

  it('returns false for legacy role 13 (supervisor)', () => {
    assert.equal(canInlineAssignCustomers(13), false)
  })

  it('returns false for role 4 (employee)', () => {
    assert.equal(canInlineAssignCustomers(4), false)
  })

  it('returns false for legacy role 14 (employee)', () => {
    assert.equal(canInlineAssignCustomers(14), false)
  })

  it('returns false for role 5 (bank agent)', () => {
    assert.equal(canInlineAssignCustomers(5), false)
  })

  it('returns false for legacy role 15 (bank agent)', () => {
    assert.equal(canInlineAssignCustomers(15), false)
  })

  it('returns false for null', () => {
    assert.equal(canInlineAssignCustomers(null), false)
  })

  it('returns false for undefined', () => {
    assert.equal(canInlineAssignCustomers(undefined), false)
  })

  it('returns false for unknown role 99', () => {
    assert.equal(canInlineAssignCustomers(99), false)
  })
})

describe('normalizeRoleId — legacy role mapping', () => {
  it('maps 12 to 2 (company admin)', () => {
    assert.equal(normalizeRoleId(12), 2)
  })

  it('maps 11 to 1 (super admin)', () => {
    assert.equal(normalizeRoleId(11), 1)
  })

  it('maps 13 to 3 (supervisor)', () => {
    assert.equal(normalizeRoleId(13), 3)
  })

  it('maps 14 to 4 (employee)', () => {
    assert.equal(normalizeRoleId(14), 4)
  })

  it('maps 15 to 5 (bank agent)', () => {
    assert.equal(normalizeRoleId(15), 5)
  })

  it('passes through canonical role IDs unchanged', () => {
    assert.equal(normalizeRoleId(1), 1)
    assert.equal(normalizeRoleId(2), 2)
    assert.equal(normalizeRoleId(3), 3)
    assert.equal(normalizeRoleId(4), 4)
    assert.equal(normalizeRoleId(5), 5)
  })
})
