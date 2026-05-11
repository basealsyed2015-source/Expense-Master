// Single source of truth for the row-actions dropdown used by the customers
// and requests tables.
//
// Why this design:
//
//   We tried the native popover API. It gives top-layer rendering for free,
//   but every variant we attempted ended up either (a) painting at the
//   browser's default (0, 0) — i.e. on top of the navbar — before our
//   positioning ran, or (b) not appearing at all when we hid it until JS
//   positioned it. The popover state machine and event timing across browsers
//   was too brittle for this codebase.
//
//   This implementation is deliberately small and synchronous:
//
//     1. The menu is a plain <div class="actions-dropdown-menu" hidden>.
//        It is `position: fixed; z-index: 10050` so it escapes any ancestor
//        overflow and stacks over the sidebar (z: 1000).
//     2. One delegated `click` handler:
//          - if click hit a trigger button, compute top/left from the
//            button's getBoundingClientRect, set them inline, then remove
//            the `hidden` attribute. Position is set BEFORE the element
//            paints, so there is no first-paint race.
//          - if click hit a menu item, defer-close so the item's own
//            handler (modal, navigation) runs first.
//          - otherwise close any open menu.
//     3. Escape closes. Resize / scroll reposition.
//     4. While open, other row trigger buttons in the same tbody are
//        visibility:hidden so clicks cannot reach stacked triggers behind the
//        fixed menu (same approach as full-admin-panel toggleActionsDropdown).
//     5. The menu top aligns to the trigger bottom (no empty gap). Visual
//        spacing uses padding-top instead, so moving from the button into the
//        menu never crosses “dead air” over the table.
//     6. While open, `body.actions-dropdown-open` sets pointer-events:none on
//        the admin table scrollers so rows/cells underneath cannot receive
//        :hover (the main flicker source). The menu and action triggers use
//        pointer-events:auto again (children can override the parent).
//
//   No globals beyond a small back-compat shim. No portaling. No popover.
//
// Markup contract:
//   <button type="button"
//           class="actions-dropdown-btn …"
//           data-actions-target="actions-menu-<unique-id>">…</button>
//   <div id="actions-menu-<unique-id>" hidden class="actions-dropdown-menu">
//     <a href="…" class="actions-dropdown-item">…</a>
//     <button type="button" onclick="…" class="actions-dropdown-item">…</button>
//   </div>

const MENU_WIDTH_PX = 208
/** Vertical gap between trigger and first row item; kept inside the panel as padding so there is no hover “dead zone”. */
const MENU_GAP_PX = 6

export const actionsDropdownCSS = `
  .actions-dropdown-menu {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10050;
    margin: 0;
    /* Top padding includes MENU_GAP_PX so the panel meets the trigger with no hit-test hole */
    padding: calc(0.25rem + ${MENU_GAP_PX}px) 0 0.25rem 0;
    width: ${MENU_WIDTH_PX}px;
    max-width: calc(100vw - 16px);
    background: #fff;
    border: 1px solid rgba(229, 231, 235, 1);
    border-radius: 0.5rem;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
    overflow: hidden;
  }
  .actions-dropdown-menu[hidden] { display: none !important; }
  .actions-dropdown-btn { cursor: pointer; }
  .actions-dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    text-align: right;
    white-space: nowrap;
    color: rgb(55, 65, 81);
    background: transparent;
    border: 0;
    cursor: pointer;
    text-decoration: none;
  }
  .actions-dropdown-item:hover { background: rgba(243, 244, 246, 1); }
  .actions-dropdown-item i { width: 1rem; flex-shrink: 0; text-align: center; }
  .actions-dropdown-divider { height: 1px; background: rgba(229, 231, 235, 1); margin: 0.25rem 0; }

  body.actions-dropdown-open #customersTableScroll,
  body.actions-dropdown-open #requestsTableScroll {
    pointer-events: none;
  }
  body.actions-dropdown-open .actions-dropdown-menu,
  body.actions-dropdown-open .actions-dropdown-btn {
    pointer-events: auto;
  }
`

export const actionsDropdownScript = `
  (function() {
    if (window.__actionsDropdownInit) {
      console.log('[actions-dropdown] already initialized, skipping');
      return;
    }
    window.__actionsDropdownInit = true;
    console.log('[actions-dropdown] init');

    var MENU_WIDTH = ${MENU_WIDTH_PX};
    var PAD = 8;
    var GAP = ${MENU_GAP_PX};

    var openMenu = null;
    var openBtn = null;
    var lastRepositionKey = '';

    function restoreTriggerButtons() {
      document.querySelectorAll('tbody .actions-dropdown-btn').forEach(function(b) {
        b.style.visibility = '';
      });
    }

    /** Hide every row actions trigger in the same tbody except the active one. */
    function hideOtherTriggers(activeBtn) {
      var tbody = activeBtn.closest('tbody');
      if (!tbody) return;
      tbody.querySelectorAll('.actions-dropdown-btn').forEach(function(b) {
        b.style.visibility = (b === activeBtn) ? '' : 'hidden';
      });
    }

    function getMenu(btn) {
      if (!btn) return null;
      var id = btn.getAttribute('data-actions-target');
      if (!id) return null;
      var menu = document.getElementById(id);
      return menu && menu.classList && menu.classList.contains('actions-dropdown-menu') ? menu : null;
    }

    function place(btn, menu) {
      var br = btn.getBoundingClientRect();
      var w = MENU_WIDTH;
      // offsetHeight is 0 while hidden — compute below first, refine if needed
      // after we unhide.
      var left = Math.max(PAD, Math.min(br.right - w, window.innerWidth - w - PAD));
      // Top flush with trigger — spacing is CSS padding-top (avoids hover gaps).
      var top = br.bottom;
      menu.style.left = Math.round(left) + 'px';
      menu.style.top = Math.round(top) + 'px';
    }

    function refineAfterOpen(btn, menu) {
      var br = btn.getBoundingClientRect();
      var h = menu.offsetHeight;
      if (!h) return;
      var topBelow = br.bottom;
      // Flip above if the menu would overflow the viewport.
      if (topBelow + h > window.innerHeight - PAD && br.top - h - GAP > PAD) {
        menu.style.top = Math.round(br.top - h - GAP) + 'px';
      }
    }

    function close() {
      document.body.classList.remove('actions-dropdown-open');
      lastRepositionKey = '';
      if (!openMenu) return;
      openMenu.setAttribute('hidden', '');
      openMenu.style.left = '';
      openMenu.style.top = '';
      openMenu = null;
      openBtn = null;
      restoreTriggerButtons();
    }

    function open(btn) {
      var menu = getMenu(btn);
      if (!menu) return;
      // Reset any previous open menu first.
      close();
      // Position BEFORE unhiding so first paint is correct.
      place(btn, menu);
      menu.removeAttribute('hidden');
      openMenu = menu;
      openBtn = btn;
      hideOtherTriggers(btn);
      document.body.classList.add('actions-dropdown-open');
      // Now we can measure height and flip above if needed.
      refineAfterOpen(btn, menu);
      var br0 = btn.getBoundingClientRect();
      lastRepositionKey = [Math.round(br0.left), Math.round(br0.top), Math.round(br0.right), Math.round(br0.bottom)].join(',');
    }

    document.addEventListener('click', function(e) {
      var t = e.target;
      if (!t || typeof t.closest !== 'function') {
        close();
        return;
      }
      // Click on a trigger button: open / toggle.
      var trigger = t.closest('.actions-dropdown-btn[data-actions-target]');
      if (trigger) {
        console.log('[actions-dropdown] trigger clicked', trigger.getAttribute('data-actions-target'));
        e.preventDefault();
        if (openBtn === trigger) close();
        else open(trigger);
        return;
      }
      // Click on a menu item: defer-close so the item's own onclick/href runs first.
      var item = t.closest('.actions-dropdown-menu a, .actions-dropdown-menu button');
      if (item) {
        setTimeout(close, 0);
        return;
      }
      // Click outside any open menu: close.
      if (!t.closest('.actions-dropdown-menu')) close();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') close();
    });

    var repositionScheduled = false;
    function reposition() {
      if (!openMenu || !openBtn) return;
      if (repositionScheduled) return;
      repositionScheduled = true;
      requestAnimationFrame(function() {
        repositionScheduled = false;
        if (!openMenu || !openBtn) return;
        var br = openBtn.getBoundingClientRect();
        var key = [Math.round(br.left), Math.round(br.top), Math.round(br.right), Math.round(br.bottom)].join(',');
        if (key === lastRepositionKey) return;
        lastRepositionKey = key;
        place(openBtn, openMenu);
        refineAfterOpen(openBtn, openMenu);
      });
    }
    window.addEventListener('resize', reposition);
    // Capture so scrolls inside nested containers (e.g. table scrollers) hit us.
    window.addEventListener('scroll', reposition, true);

    // Back-compat shim for legacy call sites.
    window.closeAllDropdowns = close;
  })();
`
