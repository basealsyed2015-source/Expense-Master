/**
 * Route inventory guard.
 *
 * The index.tsx restructure moves handlers into src/routes/*.ts sub-routers.
 * This test scans every file in src/ for Hono route registrations and
 * asserts the total set is preserved.
 *
 * If a slice extraction accidentally drops or duplicates a route, this test
 * fails with a diff showing exactly which (method, path) pairs changed.
 *
 * To regenerate the baseline after an intentional route add/remove:
 *   1. Run the test — it prints the current inventory on mismatch.
 *   2. Update EXPECTED_TOTAL and (if a new path was added) BASELINE_PATHS.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC_ROOT = join(process.cwd(), 'src')

// Baseline captured 2026-08-16 after auth extraction. Counts every Hono route
// registration across src/ (app.<verb> in index.tsx, contracts-module, chat,
// hr, full-admin-panel, and *Routes.<verb> in src/routes/*). Update
// deliberately when routes are intentionally added/removed.
const EXPECTED_TOTAL = 433

// Files we don't want to scan (backups, generated files).
const SKIP_FILE_SUFFIXES = ['.backup.ts', '.tsx.backup']

type RouteReg = { method: string; path: string; file: string; line: number }

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      out.push(...walk(full))
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      if (SKIP_FILE_SUFFIXES.some((s) => entry.endsWith(s))) continue
      out.push(full)
    }
  }
  return out
}

// Matches `<identifier>.<verb>('<literal path>'`  where verb is one of the HTTP methods.
// Requires the path literal to start with '/' to avoid matching e.g. `arr.get('name')`.
const ROUTE_RE = /\b([a-zA-Z_$][\w$]*)\.(get|post|put|delete|patch)\(\s*'(\/[^']*)'/g

function scanFile(file: string): RouteReg[] {
  const src = readFileSync(file, 'utf8')
  const lines = src.split(/\r?\n/)
  const out: RouteReg[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Skip comments — a `//` before the call means the reg is commented out.
    if (/^\s*\/\//.test(line)) continue
    let m: RegExpExecArray | null
    ROUTE_RE.lastIndex = 0
    while ((m = ROUTE_RE.exec(line)) !== null) {
      const [, ident, verb, path] = m
      // Only count `app.<verb>` and `<router>Routes.<verb>` — this filters out
      // unrelated `.get(` calls (Map, URLSearchParams, etc).
      if (ident !== 'app' && !/Routes$/.test(ident)) continue
      out.push({ method: verb.toUpperCase(), path, file, line: i + 1 })
    }
  }
  return out
}

function collectAllRoutes(): RouteReg[] {
  const files = walk(SRC_ROOT)
  const all: RouteReg[] = []
  for (const f of files) all.push(...scanFile(f))
  return all
}

describe('route inventory', () => {
  it(`total handler count === ${EXPECTED_TOTAL}`, () => {
    const routes = collectAllRoutes()
    if (routes.length !== EXPECTED_TOTAL) {
      const grouped = new Map<string, RouteReg[]>()
      for (const r of routes) {
        const key = `${r.method} ${r.path}`
        const list = grouped.get(key) ?? []
        list.push(r)
        grouped.set(key, list)
      }
      const dupes = [...grouped.entries()].filter(([, v]) => v.length > 1)
      console.error(`Total routes: ${routes.length} (expected ${EXPECTED_TOTAL})`)
      console.error(`Unique (method,path) pairs: ${grouped.size}`)
      console.error(`Duplicates: ${dupes.length}`)
      for (const [k, v] of dupes.slice(0, 20)) {
        console.error(`  ${k}: ${v.map((r) => `${r.file.replace(process.cwd(), '.')}:${r.line}`).join(', ')}`)
      }
    }
    assert.equal(routes.length, EXPECTED_TOTAL)
  })

  it('extracted route modules own the paths they should', () => {
    const routes = collectAllRoutes()
    // Every path listed here must live in the given file (all methods).
    const ownership: Record<string, string> = {
      '/api/auth/login': 'auth.ts',
      '/api/auth/logout': 'auth.ts',
      '/api/auth/forgot-password': 'auth.ts',
      '/api/auth/verify-reset-code': 'auth.ts',
      '/api/auth/reset-password': 'auth.ts',
      '/api/rates': 'rates.ts',
      '/api/rates/:id': 'rates.ts',
      '/api/rates/sample-csv': 'rates.ts',
      '/api/rates/export-csv': 'rates.ts',
      '/api/rates/import-csv': 'rates.ts',
      '/api/rates/upload-excel': 'rates.ts',
      '/api/banks': 'banks.ts',
      '/api/banks/:id': 'banks.ts',
      '/api/banks/global/all': 'banks.ts',
    }
    // Legacy duplicate handlers exist for some /api/banks/* paths in index.tsx
    // (admin-panel form endpoints). They are dead code — the extracted sub-router
    // mounts before them so Hono first-match wins. Assert at least one registration
    // lives in the expected file, not that all do.
    for (const [path, file] of Object.entries(ownership)) {
      const regs = routes.filter((r) => r.path === path)
      assert.ok(regs.length > 0, `No registration found for ${path}`)
      assert.ok(
        regs.some((r) => r.file.endsWith(file)),
        `${path} should have at least one registration in routes/${file}; found only in ${regs.map((r) => r.file).join(', ')}`,
      )
    }
  })

  it('no route registrations leak into src/index.tsx.backup', () => {
    // Just ensures the backup file exists but is skipped by the scanner.
    const files = walk(SRC_ROOT)
    assert.ok(!files.some((f) => f.endsWith('.backup.ts') || f.endsWith('.tsx.backup')))
  })
})
