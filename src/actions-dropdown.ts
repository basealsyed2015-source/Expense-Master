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
//        the admin table scrollers and tbody rows so nothing under the menu
//        receives :hover (flicker from overflow clipping + hit-testing).
//        The menu and action triggers use pointer-events:auto again.
//     7. While open, the active menu node is moved to document.body so
//        position:fixed is not clipped by #customersTableScroll / overflow-x.
//
//   No globals beyond a small back-compat shim. No popover.
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
    padding: calc(0.25rem + ${MENU_GAP_PX}px) 0 0.25rem 0;
    width: ${MENU_WIDTH_PX}px;
    max-width: calc(100vw - 16px);
    background: #fff;
    border: 1px solid rgba(229, 231, 235, 1);
    border-radius: 0.5rem;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
    overflow-x: hidden;
    overflow-y: auto;
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
  body.actions-dropdown-open #requestsTableScroll,
  body.actions-dropdown-open #usersTableScroll,
  body.actions-dropdown-open #followupsTableScroll {
    pointer-events: none;
  }
  body.actions-dropdown-open #customersTableScroll tbody tr,
  body.actions-dropdown-open #requestsTableScroll tbody tr,
  body.actions-dropdown-open #usersTableScroll tbody tr,
  body.actions-dropdown-open #followupsTableScroll tbody tr {
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

    /** Fixed menus inside overflow-x ancestors get clipped; hit-testing then misses the menu and hits rows behind it (flicker). */
    function portalMenuToBody(menu) {
      if (!menu || menu.parentElement === document.body) return;
      menu.__adRestore = {
        parent: menu.parentElement,
        next: menu.nextSibling
      };
      document.body.appendChild(menu);
    }

    function restoreMenuFromBody(menu) {
      if (!menu || !menu.__adRestore) return;
      var r = menu.__adRestore;
      menu.__adRestore = null;
      if (!r.parent) return;
      try {
        if (r.next && r.next.parentNode === r.parent) {
          r.parent.insertBefore(menu, r.next);
        } else {
          r.parent.appendChild(menu);
        }
      } catch (e) {
        try { document.body.appendChild(menu); } catch (e2) {}
      }
    }

    function place(btn, menu) {
      var br = btn.getBoundingClientRect();
      var w = MENU_WIDTH;
      var left = Math.max(PAD, Math.min(br.right - w, window.innerWidth - w - PAD));
      var spaceBelow = window.innerHeight - br.bottom - PAD;
      var spaceAbove = br.top - PAD - GAP;

      menu.style.left = Math.round(left) + 'px';
      menu.style.overflowY = 'auto';

      if (spaceBelow >= spaceAbove) {
        // Open downward — gap lives in padding-top.
        menu.style.top = Math.round(br.bottom) + 'px';
        menu.style.bottom = '';
        menu.style.maxHeight = Math.round(Math.max(80, spaceBelow)) + 'px';
        menu.style.paddingTop = 'calc(0.25rem + ' + GAP + 'px)';
        menu.style.paddingBottom = '0.25rem';
      } else {
        // Open upward — anchor menu bottom to trigger top, gap in padding-bottom.
        // Must use 'auto' not '' — clearing the inline style falls back to the CSS top:0,
        // which combined with bottom:X stretches the element between both anchors (whitespace).
        menu.style.top = 'auto';
        menu.style.bottom = Math.round(window.innerHeight - br.top + GAP) + 'px';
        menu.style.maxHeight = Math.round(Math.max(80, spaceAbove)) + 'px';
        menu.style.paddingTop = '0.25rem';
        menu.style.paddingBottom = 'calc(0.25rem + ' + GAP + 'px)';
      }
    }

    function close() {
      document.body.classList.remove('actions-dropdown-open');
      lastRepositionKey = '';
      if (!openMenu) return;
      var m = openMenu;
      openMenu = null;
      openBtn = null;
      m.setAttribute('hidden', '');
      m.style.left = '';
      m.style.top = '';
      m.style.bottom = '';
      m.style.maxHeight = '';
      m.style.overflowY = '';
      m.style.paddingTop = '';
      m.style.paddingBottom = '';
      restoreMenuFromBody(m);
      restoreTriggerButtons();
    }

    function open(btn) {
      var menu = getMenu(btn);
      if (!menu) return;
      // Reset any previous open menu first.
      close();
      portalMenuToBody(menu);
      // Position BEFORE unhiding so first paint is correct.
      place(btn, menu);
      menu.removeAttribute('hidden');
      openMenu = menu;
      openBtn = btn;
      hideOtherTriggers(btn);
      document.body.classList.add('actions-dropdown-open');
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
      });
    }
    window.addEventListener('resize', reposition);
    // Capture so scrolls inside nested containers (e.g. table scrollers) hit us.
    window.addEventListener('scroll', reposition, true);

    // Back-compat shim for legacy call sites.
    window.closeAllDropdowns = close;
  })();
`
