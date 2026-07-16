import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { clampPage, parsePageParams, WORKER_BUNDLE_SOFT_BUDGET_BYTES } from '../src/perf-helpers.ts'

describe('perf-helpers pagination', () => {
  it('parsePageParams applies defaults and clamps pageSize', () => {
    assert.deepEqual(parsePageParams({}), { page: 1, pageSize: 15, offset: 0 })
    assert.deepEqual(parsePageParams({ page: '3', pageSize: '30' }), { page: 3, pageSize: 30, offset: 60 })
    assert.equal(parsePageParams({ page: '0', pageSize: '999' }).page, 1)
    assert.equal(parsePageParams({ pageSize: '999' }).pageSize, 100)
  })

  it('clampPage stays within bounds', () => {
    assert.equal(clampPage(5, 1), 1)
    assert.equal(clampPage(0, 10), 1)
    assert.equal(clampPage(99, 10), 10)
    assert.equal(clampPage(4, 10), 4)
  })

  it('exposes a soft worker bundle budget', () => {
    assert.ok(WORKER_BUNDLE_SOFT_BUDGET_BYTES > 1_000_000)
  })
})
