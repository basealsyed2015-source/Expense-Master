/**
 * Guards the RTL table edge-scroll buttons on /admin/users, /admin/customers,
 * and /admin/requests.
 *
 * Chrome RTL uses a negative scrollLeft range. scrollBy({ behavior:'smooth' })
 * clamps to [0, max] and the arrows look dead. These tests fail if that
 * pattern comes back, or if a page stops using the shared helper.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import vm from 'node:vm'
import {
  EDGE_SCROLL_STEP_PX,
  canScrollPhysically,
  nextEdgeScrollLeft,
  edgeScrollClientScript,
} from '../src/shared/edge-scroll.ts'

type ScrollMode = 'ltr' | 'chrome-rtl' | 'firefox-reverse-rtl'

function createScroller(mode: ScrollMode, overflow: number, clientWidth = 400) {
  let sl = mode === 'firefox-reverse-rtl' ? overflow : 0
  const clamp = (v: number) => {
    if (mode === 'chrome-rtl') return Math.max(-overflow, Math.min(0, v))
    return Math.max(0, Math.min(overflow, v))
  }
  return {
    get scrollLeft() {
      return sl
    },
    set scrollLeft(v: number) {
      sl = clamp(Number(v))
    },
    get scrollWidth() {
      return clientWidth + overflow
    },
    get clientWidth() {
      return clientWidth
    },
    dataset: {} as Record<string, string>,
    closest() {
      return null
    },
    querySelector() {
      return null
    },
    addEventListener() {},
    scrollBy(opts: { left: number; behavior?: string }) {
      // Reproduce the Chrome RTL bug: smooth scrollBy clamps as if LTR [0, max].
      if (opts && opts.behavior === 'smooth') {
        sl = Math.max(0, Math.min(overflow, sl + opts.left))
        return
      }
      sl = clamp(sl + opts.left)
    },
  }
}

function mockBtn() {
  const classes = new Set<string>(['edge-hidden'])
  return {
    classList: {
      add: (c: string) => {
        classes.add(c)
      },
      toggle: (c: string, force?: boolean) => {
        if (force === true) classes.add(c)
        else if (force === false) classes.delete(c)
        else if (classes.has(c)) classes.delete(c)
        else classes.add(c)
      },
      contains: (c: string) => classes.has(c),
    },
    style: {} as Record<string, string>,
    closest() {
      return null
    },
    _classes: classes,
  }
}

function loadClient(scrollEl: ReturnType<typeof createScroller>, ids: {
  scrollId: string
  leftId: string
  rightId: string
}) {
  const leftBtn = mockBtn()
  const rightBtn = mockBtn()
  const windowObj: Record<string, unknown> = {
    matchMedia: () => ({ matches: true }),
    addEventListener() {},
    innerHeight: 800,
  }
  const sandbox = {
    window: windowObj,
    document: {
      getElementById(id: string) {
        if (id === ids.scrollId) return scrollEl
        if (id === ids.leftId) return leftBtn
        if (id === ids.rightId) return rightBtn
        return null
      },
    },
    setTimeout: (fn: () => void) => {
      fn()
      return 0
    },
    requestAnimationFrame: (fn: (t: number) => void) => {
      fn(0)
      return 0
    },
    performance: { now: () => 0 },
    ResizeObserver: undefined,
  }
  vm.runInNewContext(edgeScrollClientScript(ids.leftId, ids.rightId), sandbox)
  return {
    edgeScrollStep: windowObj.edgeScrollStep as (id: string, dir: 'left' | 'right') => void,
    leftBtn,
    rightBtn,
  }
}

const PAGES = [
  {
    path: '/admin/customers',
    scrollId: 'customersTableScroll',
    left: 'customersEdgeLeft',
    right: 'customersEdgeRight',
  },
  {
    path: '/admin/requests',
    scrollId: 'requestsTableScroll',
    left: 'requestsEdgeLeft',
    right: 'requestsEdgeRight',
  },
  {
    path: '/admin/users',
    scrollId: 'usersTableScroll',
    left: 'usersEdgeLeft',
    right: 'usersEdgeRight',
  },
] as const

function routeSlice(src: string, path: string): string {
  const marker = `app.get('${path}', async`
  const idx = src.indexOf(marker)
  assert.ok(idx >= 0, `missing route ${path}`)
  const next = src.indexOf('\napp.get(', idx + marker.length)
  return src.slice(idx, next > 0 ? next : idx + 250_000)
}

describe('edge-scroll algorithm', () => {
  it('Chrome RTL: left arrow moves into the negative scrollLeft range', () => {
    const el = createScroller('chrome-rtl', 800)
    assert.equal(el.scrollLeft, 0)
    assert.equal(canScrollPhysically(el, 'left'), true)
    assert.equal(canScrollPhysically(el, 'right'), false)
    const next = nextEdgeScrollLeft(el, 'left')
    assert.equal(next, -EDGE_SCROLL_STEP_PX)
    el.scrollLeft = next
    assert.equal(el.scrollLeft, -EDGE_SCROLL_STEP_PX)
    assert.equal(canScrollPhysically(el, 'right'), true)
  })

  it('Chrome RTL: smooth scrollBy is a no-op (the bug we must not regress to)', () => {
    const el = createScroller('chrome-rtl', 800)
    el.scrollBy({ left: -EDGE_SCROLL_STEP_PX, behavior: 'smooth' })
    assert.equal(el.scrollLeft, 0)
  })

  it('LTR: right arrow advances, left is exhausted at start', () => {
    const el = createScroller('ltr', 800)
    assert.equal(canScrollPhysically(el, 'left'), false)
    assert.equal(canScrollPhysically(el, 'right'), true)
    assert.equal(nextEdgeScrollLeft(el, 'right'), EDGE_SCROLL_STEP_PX)
    assert.equal(nextEdgeScrollLeft(el, 'left'), 0)
  })

  it('Firefox reverse RTL: left arrow decreases from max', () => {
    const el = createScroller('firefox-reverse-rtl', 800)
    assert.equal(el.scrollLeft, 800)
    assert.equal(canScrollPhysically(el, 'left'), true)
    assert.equal(canScrollPhysically(el, 'right'), false)
    assert.equal(nextEdgeScrollLeft(el, 'left'), 800 - EDGE_SCROLL_STEP_PX)
  })
})

describe('edge-scroll client script', () => {
  it('is valid JavaScript and never uses smooth scrollBy', () => {
    const src = edgeScrollClientScript('usersEdgeLeft', 'usersEdgeRight')
    assert.match(src, /EDGE_SCROLL_RTL_SAFE/)
    assert.doesNotMatch(src, /scrollBy\s*\(/)
    assert.doesNotMatch(src, /behavior:\s*['"]smooth['"]/)
    new vm.Script(src)
  })

  it('Chrome RTL client click actually scrolls left', () => {
    const el = createScroller('chrome-rtl', 800)
    const { edgeScrollStep, leftBtn, rightBtn } = loadClient(el, {
      scrollId: 'usersTableScroll',
      leftId: 'usersEdgeLeft',
      rightId: 'usersEdgeRight',
    })
    edgeScrollStep('usersTableScroll', 'left')
    assert.equal(el.scrollLeft, -EDGE_SCROLL_STEP_PX)
    assert.equal(leftBtn.classList.contains('edge-hidden'), false)
    assert.equal(rightBtn.classList.contains('edge-hidden'), false)
  })

  it('Chrome RTL client right-click is a no-op at the start edge', () => {
    const el = createScroller('chrome-rtl', 800)
    const { edgeScrollStep, leftBtn, rightBtn } = loadClient(el, {
      scrollId: 'customersTableScroll',
      leftId: 'customersEdgeLeft',
      rightId: 'customersEdgeRight',
    })
    edgeScrollStep('customersTableScroll', 'right')
    assert.equal(el.scrollLeft, 0)
    edgeScrollStep('customersTableScroll', 'left')
    assert.ok(el.scrollLeft < 0)
    assert.equal(leftBtn.classList.contains('edge-hidden'), false)
    assert.equal(rightBtn.classList.contains('edge-hidden'), false)
  })
})

describe('edge-scroll page wiring', () => {
  const src = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8')

  for (const page of PAGES) {
    it(`${page.path} uses the shared RTL-safe helper and keeps the arrow markup`, () => {
      const slice = routeSlice(src, page.path)
      assert.match(
        slice,
        new RegExp(`edgeScrollClientScript\\(\\s*'${page.left}'\\s*,\\s*'${page.right}'\\s*\\)`),
        `${page.path} must interpolate edgeScrollClientScript('${page.left}', '${page.right}')`,
      )
      assert.match(slice, new RegExp(`id="${page.scrollId}"`))
      assert.match(slice, new RegExp(`id="${page.left}"`))
      assert.match(slice, new RegExp(`id="${page.right}"`))
      assert.match(
        slice,
        new RegExp(`edgeScrollStep\\('${page.scrollId}', 'left'\\)`),
      )
      assert.match(
        slice,
        new RegExp(`edgeScrollStep\\('${page.scrollId}', 'right'\\)`),
      )
      assert.doesNotMatch(
        slice,
        /scrollBy\s*\(\s*\{\s*left:\s*left\s*,\s*behavior:\s*'smooth'\s*\}/,
        `${page.path} must not use smooth scrollBy in the route handler`,
      )
    })
  }
})
