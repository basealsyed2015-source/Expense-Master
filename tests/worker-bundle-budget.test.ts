import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { WORKER_BUNDLE_SOFT_BUDGET_BYTES } from '../src/perf-helpers.ts'

describe('worker bundle budget', () => {
  it('dist/_worker.js stays under soft budget when built', () => {
    const workerPath = join(process.cwd(), 'dist', '_worker.js')
    if (!existsSync(workerPath)) {
      // Build artifact not present in CI/local without `npm run build` — skip soft check.
      return
    }
    const size = statSync(workerPath).size
    assert.ok(
      size <= WORKER_BUNDLE_SOFT_BUDGET_BYTES,
      `Worker bundle ${size} bytes exceeds soft budget ${WORKER_BUNDLE_SOFT_BUDGET_BYTES}`
    )
  })
})
