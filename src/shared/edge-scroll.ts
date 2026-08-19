// RTL-safe horizontal table edge-scroll.
//
// Chrome (and some WebKit) RTL uses a *negative* scrollLeft range: start=0,
// fully scrolled left = -max. `el.scrollBy({ left, behavior: 'smooth' })`
// internally clamps to [0, max], so the click is a silent no-op.
//
// Fix: probe which scrollLeft assignment actually moves, then animate by
// writing scrollLeft directly. Do not use scrollBy/scrollTo with smooth.

export const EDGE_SCROLL_STEP_PX = 360

export type VisualScrollDirection = 'left' | 'right'

export type EdgeScroller = {
  scrollLeft: number
}

/** True if assigning scrollLeft ±1 in `direction` actually moves (all RTL modes). */
export function canScrollPhysically(el: EdgeScroller, direction: VisualScrollDirection): boolean {
  const before = el.scrollLeft
  el.scrollLeft = before + (direction === 'left' ? -1 : 1)
  const moved = el.scrollLeft !== before
  el.scrollLeft = before
  return moved
}

/** Next scrollLeft after an edge-arrow click, or the current value if that way is exhausted. */
export function nextEdgeScrollLeft(
  el: EdgeScroller,
  visualDirection: VisualScrollDirection,
  step = EDGE_SCROLL_STEP_PX,
): number {
  const before = el.scrollLeft
  const probe = visualDirection === 'left' ? -1 : 1
  el.scrollLeft = before + probe
  const after = el.scrollLeft
  el.scrollLeft = before
  if (after === before) return before
  const sign = after > before ? 1 : -1
  return before + sign * step
}

/**
 * Inline browser JS for admin table pages. `leftBtnId` / `rightBtnId` are the
 * existing edge-arrow wrapper ids (e.g. customersEdgeLeft).
 */
export function edgeScrollClientScript(leftBtnId: string, rightBtnId: string): string {
  if (!/^[A-Za-z][\w-]*$/.test(leftBtnId) || !/^[A-Za-z][\w-]*$/.test(rightBtnId)) {
    throw new Error('edgeScrollClientScript: invalid button id')
  }
  return `
          // EDGE_SCROLL_RTL_SAFE
          function canScrollPhysically(el, direction) {
            const before = el.scrollLeft;
            el.scrollLeft = before + (direction === 'left' ? -1 : 1);
            const moved = el.scrollLeft !== before;
            el.scrollLeft = before;
            return moved;
          }

          function animateRawScrollLeft(el, target, durationMs) {
            const from = el.scrollLeft;
            const delta = target - from;
            if (Math.abs(delta) < 1) return;
            const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReduced) { el.scrollLeft = target; return; }
            const start = performance.now();
            const duration = Math.max(120, Number(durationMs) || 260);
            const animToken = String(Number(el.dataset.edgeScrollAnimToken || '0') + 1);
            el.dataset.edgeScrollAnimToken = animToken;
            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
            const tick = (now) => {
              if (el.dataset.edgeScrollAnimToken !== animToken) return;
              const t = Math.min(1, (now - start) / duration);
              el.scrollLeft = from + delta * easeOutCubic(t);
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }

          window.edgeScrollStep = function(scrollElId, visualDirection) {
            const el = document.getElementById(scrollElId);
            if (!el) return;
            const step = ${EDGE_SCROLL_STEP_PX};
            const before = el.scrollLeft;
            const probe = visualDirection === 'left' ? -1 : 1;
            el.scrollLeft = before + probe;
            const after = el.scrollLeft;
            el.scrollLeft = before;
            if (after === before) return;
            const sign = after > before ? 1 : -1;
            animateRawScrollLeft(el, before + sign * step, 260);
            setTimeout(function() {
              updateEdgeScrollControls(scrollElId, '${leftBtnId}', '${rightBtnId}');
            }, 280);
          };

          function positionEdgeArrowAtViewportCenter(scrollElId, arrowBtnId) {
            const el = document.getElementById(scrollElId);
            const arrow = document.getElementById(arrowBtnId);
            if (!el || !arrow) return;
            const wrap = el.closest('.edge-scroll-wrap');
            if (!wrap) return;
            const wrapRect = wrap.getBoundingClientRect();
            const vhCenter = window.innerHeight / 2;
            const padding = 16;
            const minY = wrapRect.top + padding;
            const maxY = wrapRect.bottom - padding;
            const clamped = Math.max(minY, Math.min(maxY, vhCenter));
            arrow.style.top = String(clamped - wrapRect.top) + 'px';
          }

          function updateEdgeScrollControls(scrollElId, leftBtnId, rightBtnId) {
            const el = document.getElementById(scrollElId);
            const leftWrap = document.getElementById(leftBtnId);
            const rightWrap = document.getElementById(rightBtnId);
            if (!el || !leftWrap || !rightWrap) return;
            const canScroll = (el.scrollWidth - el.clientWidth) > 0.5;
            if (!canScroll) {
              leftWrap.classList.add('edge-hidden');
              rightWrap.classList.add('edge-hidden');
              return;
            }
            const showLeft = canScrollPhysically(el, 'left');
            const showRight = canScrollPhysically(el, 'right');
            leftWrap.classList.toggle('edge-hidden', !showLeft);
            rightWrap.classList.toggle('edge-hidden', !showRight);
            if (showLeft) positionEdgeArrowAtViewportCenter(scrollElId, leftBtnId);
            if (showRight) positionEdgeArrowAtViewportCenter(scrollElId, rightBtnId);
          }

          function setupEdgeScrollOnce(scrollElId, leftBtnId, rightBtnId) {
            const el = document.getElementById(scrollElId);
            if (!el) return;
            if (el.dataset.edgeScrollBound === '1') return;
            el.dataset.edgeScrollBound = '1';
            const tick = () => updateEdgeScrollControls(scrollElId, leftBtnId, rightBtnId);
            el.addEventListener('scroll', tick, { passive: true });
            window.addEventListener('resize', tick);
            window.addEventListener('scroll', tick, { passive: true });
            window.addEventListener('load', tick, { passive: true });
            setTimeout(tick, 0);
            setTimeout(tick, 150);
            setTimeout(tick, 500);
            if (typeof ResizeObserver !== 'undefined') {
              try {
                const ro = new ResizeObserver(tick);
                ro.observe(el);
                const tbl = el.querySelector('table');
                if (tbl) ro.observe(tbl);
              } catch (e) {}
            }
          }
`
}
