/**
 * Bottom-right company chat widget. Self-contained HTML + CSS + JS string
 * appended to admin pages by injectPersistentAdminSidebar. Talks to the
 * /api/chat REST endpoints and the per-conversation WebSocket.
 */

export function renderChatWidget(userId: number | null = null, roleId: number | null = null): string {
  return `
<script>window.CC_USER_ID = ${userId ? Number(userId) : 'null'};window.CC_ROLE_ID = ${roleId ? Number(roleId) : 'null'};</script>
<style>
  #cc-chat-launcher {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 1200;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: #1e40af;
    color: #fff;
    font-size: 24px;
    box-shadow: 0 6px 22px rgba(15,23,42,0.25);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #cc-chat-launcher .cc-badge {
    position: absolute;
    top: -4px;
    left: -4px;
    background: #dc2626;
    color: #fff;
    font-size: 11px;
    line-height: 18px;
    min-width: 18px;
    padding: 0 5px;
    border-radius: 9px;
    display: none;
  }
  #cc-chat-window {
    position: fixed;
    right: 16px;
    bottom: 84px;
    width: 340px;
    height: 480px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 12px 32px rgba(15,23,42,0.2);
    z-index: 1201;
    display: none;
    flex-direction: column;
    overflow: hidden;
    font-family: inherit;
  }
  #cc-chat-window.open { display: flex; }
  #cc-chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: #1e40af;
    color: #fff;
  }
  #cc-chat-header .cc-title { font-weight: 600; font-size: 14px; }
  #cc-chat-header button {
    background: transparent;
    color: #fff;
    border: none;
    cursor: pointer;
    font-size: 18px;
    padding: 0 4px;
  }
  #cc-chat-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .cc-pane { display: none; flex: 1; overflow-y: auto; }
  .cc-pane.active { display: flex; flex-direction: column; }
  #cc-conv-list .cc-conv-row {
    padding: 10px 12px;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  #cc-conv-list .cc-conv-row:hover { background: #f8fafc; }
  #cc-conv-list .cc-conv-row.has-unread { background: #eff6ff; }
  #cc-conv-list .cc-conv-row.has-unread:hover { background: #e0edff; }
  .cc-conv-name { font-size: 13px; font-weight: 600; color: #0f172a; }
  .cc-conv-row.has-unread .cc-conv-name { font-weight: 700; color: #1e3a8a; }
  .cc-conv-snippet { font-size: 11px; color: #64748b; margin-top: 2px; }
  .cc-conv-row.has-unread .cc-conv-snippet { color: #334155; }
  .cc-unread-dot {
    background: #1e40af;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    min-width: 18px;
    height: 18px;
    line-height: 18px;
    border-radius: 9px;
    padding: 0 5px;
    text-align: center;
    flex-shrink: 0;
  }
  #cc-thread-header {
    padding: 8px 12px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    min-height: 40px;
  }
  #cc-thread-header-normal { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
  #cc-thread-header-select { display: none; align-items: center; gap: 8px; flex: 1; }
  #cc-thread-header-select.active { display: flex; }
  #cc-thread-header .cc-back { background: none; border: none; cursor: pointer; font-size: 16px; padding: 0; color: inherit; }
  #cc-select-cancel { background: none; border: none; cursor: pointer; font-size: 12px; color: #64748b; padding: 2px 6px; }
  #cc-select-count { font-size: 12px; font-weight: 600; flex: 1; }
  #cc-delete-selected, #cc-forward-selected {
    background: none; border: none; cursor: pointer; font-size: 15px; padding: 2px 4px; color: #1e40af;
  }
  #cc-delete-selected:disabled { opacity: 0.3; cursor: default; }
  #cc-forward-selected:disabled { opacity: 0.3; cursor: default; }
  /* Forward pending banner */
  #cc-forward-banner {
    display: none;
    background: #1e40af;
    color: #fff;
    font-size: 11px;
    padding: 5px 10px;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  #cc-forward-banner.active { display: flex; }
  #cc-forward-banner button { background: #fff; color: #1e40af; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; padding: 2px 8px; cursor: pointer; }
  #cc-forward-banner .cc-fwd-cancel { background: transparent; color: #fff; font-size: 14px; font-weight: 600; padding: 0 4px; border-radius: 0; }
  #cc-thread-messages {
    flex: 1;
    overflow-y: auto;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    background-color: #edf2fb;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cg transform='translate(4,6) rotate(-8,27,16)' fill='none' stroke='%231e40af' stroke-width='1.5' stroke-linecap='round' opacity='.2'%3E%3Crect x='0' y='0' width='54' height='32' rx='4'/%3E%3Cellipse cx='27' cy='16' rx='10' ry='8'/%3E%3Cline x1='0' y1='8' x2='8' y2='8'/%3E%3Cline x1='0' y1='24' x2='8' y2='24'/%3E%3Cline x1='46' y1='8' x2='54' y2='8'/%3E%3Cline x1='46' y1='24' x2='54' y2='24'/%3E%3C/g%3E%3Cg transform='translate(96,10) rotate(6,25,22)' fill='none' stroke='%231e40af' stroke-linecap='round' opacity='.2'%3E%3Cline x1='0' y1='0' x2='0' y2='44' stroke-width='1'/%3E%3Cline x1='0' y1='42' x2='50' y2='42' stroke-width='1'/%3E%3Crect x='4' y='30' width='8' height='12' fill='%231e40af' stroke='none' opacity='.55'/%3E%3Crect x='17' y='20' width='8' height='22' fill='%231e40af' stroke='none' opacity='.55'/%3E%3Crect x='30' y='10' width='8' height='32' fill='%231e40af' stroke='none' opacity='.55'/%3E%3Crect x='43' y='2' width='8' height='40' fill='%231e40af' stroke='none' opacity='.55'/%3E%3Cpolyline points='8,26 21,16 34,6 47,-2' stroke-width='2' stroke='%231e40af'/%3E%3C/g%3E%3Cg transform='translate(8,94) rotate(7,19,24)' fill='none' stroke='%231e40af' stroke-width='1.5' stroke-linecap='round' opacity='.2'%3E%3Ccircle cx='19' cy='30' r='18'/%3E%3Cpath d='M12 12 Q19 3 26 12'/%3E%3Cpath d='M15 5 L13 0 L25 0 L23 5'/%3E%3Cline x1='13' y1='27' x2='25' y2='27'/%3E%3Cline x1='13' y1='34' x2='25' y2='34'/%3E%3C/g%3E%3Cg transform='translate(104,100) rotate(-7,16,16)' fill='none' stroke='%231e40af' stroke-width='1.8' stroke-linecap='round' opacity='.2'%3E%3Ccircle cx='7' cy='7' r='5.5'/%3E%3Cline x1='2' y1='30' x2='30' y2='2' stroke-width='2.2'/%3E%3Ccircle cx='25' cy='25' r='5.5'/%3E%3C/g%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 160px 160px;
  }
  /* Message rows */
  .cc-msg-row {
    display: flex;
    align-items: flex-end;
    width: 100%;
  }
  .cc-date-sep-row { display: flex; justify-content: center; width: 100%; margin: 4px 0 2px; }
  .cc-date-sep { background: rgba(255,255,255,.9); border: 1px solid #dbe3f3; color: #334155; border-radius: 999px; padding: 3px 9px; font-size: 10px; font-weight: 600; box-shadow: 0 1px 2px rgba(15,23,42,.08); }
  .cc-msg {
    max-width: 78%;
    padding: 6px 10px;
    border-radius: 10px;
    font-size: 13px;
    word-wrap: break-word;
    flex-shrink: 0;
    position: relative;
  }
  .cc-msg.self { background: #1e40af; color: #fff; margin-inline-start: auto; }
  .cc-msg.peer { background: #fff; color: #0f172a; border: 1px solid #e2e8f0; margin-inline-end: auto; }
  /* Tombstone */
  .cc-msg.deleted { background: #f1f5f9; color: #94a3b8; font-style: italic; border: 1px dashed #cbd5e1; }
  .cc-msg.deleted.self { background: rgba(30,64,175,0.08); color: #94a3b8; border: 1px dashed #93c5fd; }
  /* Forwarded label */
  .cc-fwd-label { font-size: 10px; opacity: .65; font-style: italic; margin-bottom: 2px; }
  /* Menu button: pinned to top corner of bubble facing chat center (WhatsApp style) */
  .cc-msg-menu {
    position: absolute;
    top: 4px;
    background: rgba(0,0,0,0.15);
    border: none;
    border-radius: 3px;
    color: inherit;
    cursor: pointer;
    font-size: 10px;
    padding: 1px 5px;
    opacity: 0;
    transition: opacity 0.15s;
    line-height: 1.5;
    z-index: 2;
  }
  .cc-msg.self .cc-msg-menu { right: 4px; background: rgba(255,255,255,0.2); }
  .cc-msg.peer .cc-msg-menu { right: 4px; }
  .cc-msg:hover .cc-msg-menu { opacity: 1; }
  /* Select mode: message highlight */
  .cc-msg-row.selected .cc-msg { outline: 2px solid #1e40af; outline-offset: 1px; }
  .cc-msg-row.selected .cc-msg.self { outline-color: #93c5fd; }
  /* Select mode: click cursor on messages; block link/preview clicks */
  #cc-thread-messages.select-mode .cc-msg { cursor: pointer; }
  #cc-thread-messages.select-mode .cc-msg * { pointer-events: none; }
  #cc-thread-messages.select-mode .cc-msg-menu { display: none !important; }
  /* Dropdown popup — appended to body so it's never clipped */
  .cc-msg-dropdown {
    position: fixed;
    background: #fff;
    color: #0f172a;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 6px 22px rgba(15,23,42,.15);
    z-index: 9999;
    min-width: 120px;
    display: none;
  }
  .cc-msg-dropdown.open { display: block; }
  .cc-msg-dropdown .cc-dd-item {
    padding: 5px 10px;
    font-size: 11px;
    color: #0f172a;
    cursor: pointer;
    border-bottom: 1px solid #f8fafc;
    white-space: nowrap;
  }
  .cc-msg-dropdown .cc-dd-item:last-child { border-bottom: none; }
  .cc-msg-dropdown .cc-dd-item:hover { background: #f1f5f9; }
  .cc-msg .cc-att-link { color: inherit; text-decoration: underline; font-size: 12px; }
  .cc-img-thumb { max-width: 200px; max-height: 180px; border-radius: 8px; display: block; cursor: pointer; }
  .cc-att-preview { display: flex; flex-direction: column; gap: 3px; }
  .cc-att-actions { display: flex; gap: 8px; font-size: 11px; margin-top: 2px; }
  .cc-att-actions a { color: inherit; text-decoration: none; opacity: .85; }
  .cc-att-actions a:hover { opacity: 1; text-decoration: underline; }
  .cc-pdf-box { width: 160px; min-height: 90px; max-height: 140px; background: rgba(0,0,0,.08); border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; }
  .cc-pdf-box canvas { max-width: 100%; display: block; pointer-events: none; }
  #cc-thread-input {
    border-top: 1px solid #f1f5f9;
    display: flex;
    padding: 6px;
    gap: 4px;
  }
  #cc-thread-input input[type="text"] {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 13px;
  }
  #cc-thread-input button {
    border: none;
    background: #1e40af;
    color: #fff;
    border-radius: 8px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 13px;
  }
  #cc-thread-input label.cc-att-btn {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 4px 8px;
    cursor: pointer;
    background: #fff;
  }
  #cc-thread-input label.cc-att-btn input { display: none; }
  #cc-mention-box { position: absolute; bottom: 44px; right: 8px; left: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 6px 22px rgba(15,23,42,.15); max-height: 180px; overflow-y: auto; z-index: 60; display: none; }
  #cc-mention-box.open { display: block; }
  #cc-mention-box .cc-mention-row { padding: 6px 10px; cursor: pointer; font-size: 12px; border-bottom: 1px solid #f8fafc; }
  #cc-mention-box .cc-mention-row:hover, #cc-mention-box .cc-mention-row.active { background: #eff6ff; }
  #cc-mention-box .cc-mention-phone { font-size: 10px; color: #64748b; margin-top: 1px; }
  .cc-msg a.cc-tag-link { display: inline-block; background: #dbeafe; color: #1e3a8a; border-radius: 6px; padding: 1px 6px; text-decoration: none; font-weight: 600; font-size: 11px; margin: 2px 2px 0 0; unicode-bidi: isolate; direction: ltr; }
  .cc-msg.self a.cc-tag-link { background: #93c5fd; color: #0c1e4e; }
  .cc-msg .cc-tag-plain { display: inline-block; background: #e2e8f0; color: #475569; border-radius: 6px; padding: 1px 6px; font-weight: 600; font-size: 11px; margin: 2px 2px 0 0; }
  .cc-msg.self .cc-tag-plain { background: #cbd5e1; color: #334155; }
  .cc-msg-tags { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; }
  /* Reply bar above widget input */
  #cc-reply-bar { display: none; background: #eff6ff; border-top: 3px solid #1e40af; padding: 4px 8px; align-items: center; gap: 6px; font-size: 11px; color: #334155; }
  #cc-reply-bar.active { display: flex; }
  #cc-reply-bar-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #cc-reply-bar-close { background: none; border: none; cursor: pointer; font-size: 16px; color: #64748b; padding: 0 2px; line-height: 1; }
  /* Reply preview inside widget message bubble */
  .cc-reply-preview { background: rgba(0,0,0,0.07); border-inline-start: 3px solid rgba(255,255,255,0.5); border-radius: 5px; padding: 3px 7px; margin-bottom: 4px; font-size: 10px; cursor: pointer; overflow: hidden; max-width: 100%; }
  .cc-msg.peer .cc-reply-preview { background: #f0f4ff; border-inline-start-color: #1e40af; color: #1e3a8a; }
  .cc-reply-preview-author { font-weight: 700; font-size: 9px; margin-bottom: 1px; opacity: 0.9; }
  .cc-reply-preview-body { opacity: 0.85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cc-reply-preview:hover { opacity: 0.8; }
  @keyframes cc-reply-flash { from { box-shadow: 0 0 0 3px #fbbf24; } to { box-shadow: none; } }
  .cc-msg.reply-flash { animation: cc-reply-flash 1s ease-out; }
  #cc-users-pane { padding: 6px 0; }
  #cc-users-pane .cc-user-row {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    border-bottom: 1px solid #f8fafc;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  #cc-users-pane .cc-user-row:hover { background: #f1f5f9; }
  #cc-users-pane .cc-fwd-header {
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 600;
    background: #eff6ff;
    color: #1e3a8a;
    border-bottom: 1px solid #dbeafe;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  #cc-users-pane .cc-fwd-header button { background: #1e40af; color: #fff; border: none; border-radius: 6px; padding: 3px 10px; font-size: 11px; cursor: pointer; }
  #cc-status { font-size: 11px; color: #64748b; padding: 4px 12px; }
</style>
<button id="cc-chat-launcher" aria-label="فتح المحادثة" title="محادثة الشركة">
  💬<span class="cc-badge" id="cc-launcher-badge"></span>
</button>
<div id="cc-chat-window" role="dialog" aria-label="محادثة">
  <div id="cc-chat-header">
    <span class="cc-title">المحادثة</span>
    <div>
      <button id="cc-new-chat" title="محادثة جديدة">＋</button>
      <a href="/admin/chat" title="فتح كامل" style="color:#fff;text-decoration:none;font-size:16px;margin:0 6px;">⛶</a>
      <button id="cc-close" title="إغلاق">×</button>
    </div>
  </div>
  <div id="cc-status"></div>
  <div id="cc-chat-body">
    <div id="cc-conv-pane" class="cc-pane active">
      <div id="cc-conv-list"></div>
    </div>
    <div id="cc-users-pane" class="cc-pane"></div>
    <div id="cc-thread-pane" class="cc-pane">
      <div id="cc-thread-header">
        <div id="cc-thread-header-normal">
          <button class="cc-back" title="رجوع">←</button>
          <span class="cc-thread-name" style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;"></span>
        </div>
        <div id="cc-thread-header-select">
          <button id="cc-select-cancel">إلغاء</button>
          <span id="cc-select-count">0 محدد</span>
          <button id="cc-delete-selected" title="حذف المحدد" disabled><i class="fas fa-trash-alt"></i></button>
          <button id="cc-forward-selected" title="إعادة التوجيه"><i class="fas fa-share"></i></button>
        </div>
      </div>
      <div id="cc-thread-messages"></div>
      <div id="cc-reply-bar">
        <i class="fas fa-reply" style="opacity:.7;color:#1e40af;font-size:11px;"></i>
        <div id="cc-reply-bar-text"></div>
        <button type="button" id="cc-reply-bar-close" title="إلغاء الرد">×</button>
      </div>
      <form id="cc-thread-input" style="position: relative;">
        <label class="cc-att-btn" title="مرفق">📎<input type="file" id="cc-att-input"/></label>
        <input type="text" id="cc-msg-input" placeholder="اكتب رسالة... (@ للإشارة)" maxlength="8000" autocomplete="off"/>
        <button type="submit">إرسال</button>
        <div id="cc-mention-box"></div>
      </form>
    </div>
  </div>
</div>
<script>
(function(){
  if (window.__ccChatInit) return;
  window.__ccChatInit = true;

  const $ = (id) => document.getElementById(id);
  const launcher = $('cc-chat-launcher');
  const win = $('cc-chat-window');
  const closeBtn = $('cc-close');
  const newBtn = $('cc-new-chat');
  const convPane = $('cc-conv-pane');
  const convList = $('cc-conv-list');
  const usersPane = $('cc-users-pane');
  const threadPane = $('cc-thread-pane');
  const threadMessages = $('cc-thread-messages');
  const threadInput = $('cc-thread-input');
  const msgInput = $('cc-msg-input');
  const attInput = $('cc-att-input');
  const threadBack = threadPane.querySelector('.cc-back');
  const threadName = threadPane.querySelector('.cc-thread-name');
  const status = $('cc-status');
  const launcherBadge = $('cc-launcher-badge');
  const headerNormal = $('cc-thread-header-normal');
  const headerSelect = $('cc-thread-header-select');
  const selectCancel = $('cc-select-cancel');
  const selectCount = $('cc-select-count');
  const deleteBtn = $('cc-delete-selected');
  const forwardBtn = $('cc-forward-selected');

  let currentConv = null;
  let currentOther = null;
  let currentBroadcasts = false;
  let ws = null;
  let wsRetry = 0;
  let threadPoll = null;
  let lastSeenMsgId = 0;

  // Select mode state
  let selectMode = false;
  const selectedIds = new Set(); // string keys like "123" or "bc-45"

  // Forward pending state
  let pendingForward = null; // { source_type, source_conversation_id, message_ids }
  const forwardRecipients = new Set(); // user ids picked for forward

  // Reply state
  let pendingReply = null; // { id, body, senderId }
  $('cc-reply-bar-close').addEventListener('click', () => {
    pendingReply = null;
    $('cc-reply-bar').classList.remove('active');
  });

  // ── Select mode ──────────────────────────────────────────────────────────

  function enterSelectMode() {
    selectMode = true;
    selectedIds.clear();
    threadMessages.classList.add('select-mode');
    headerNormal.style.display = 'none';
    headerSelect.classList.add('active');
    updateSelectBar();
  }

  function exitSelectMode() {
    selectMode = false;
    selectedIds.clear();
    threadMessages.classList.remove('select-mode');
    headerNormal.style.display = '';
    headerSelect.classList.remove('active');
    threadMessages.querySelectorAll('.cc-msg-row.selected').forEach(el => el.classList.remove('selected'));
  }

  function updateSelectBar() {
    const n = selectedIds.size;
    selectCount.textContent = n + ' محدد';
    // Determine if all selected messages were sent by current user
    let allOwn = true;
    selectedIds.forEach(key => {
      const row = threadMessages.querySelector('[data-msg-row-id="' + key + '"]');
      if (!row || row.dataset.senderId !== String(window.CC_USER_ID)) allOwn = false;
    });
    deleteBtn.disabled = n === 0 || !allOwn;
    forwardBtn.disabled = n === 0;
  }

  function toggleSelectRow(key, el) {
    if (selectedIds.has(key)) {
      selectedIds.delete(key);
      el.classList.remove('selected');
    } else {
      selectedIds.add(key);
      el.classList.add('selected');
    }
    updateSelectBar();
  }

  selectCancel.addEventListener('click', exitSelectMode);

  deleteBtn.addEventListener('click', async () => {
    if (!selectedIds.size) return;
    const isBroadcast = currentBroadcasts;
    const ids = Array.from(selectedIds).map(k => isBroadcast ? Number(String(k).replace('bc-', '')) : Number(k)).filter(n => n > 0);
    if (!ids.length) return;
    exitSelectMode();
    let result;
    if (isBroadcast) {
      result = await api('/api/chat/broadcasts/messages/delete', { method: 'POST', body: JSON.stringify({ message_ids: ids }) });
    } else {
      result = await api('/api/chat/conversations/' + currentConv + '/messages/delete', { method: 'POST', body: JSON.stringify({ message_ids: ids }) });
    }
    if (result && result.deleted_ids) {
      result.deleted_ids.forEach(id => applyTombstoneToRow(isBroadcast ? 'bc-' + id : String(id)));
    }
  });

  forwardBtn.addEventListener('click', () => {
    if (!selectedIds.size) return;
    const isBroadcast = currentBroadcasts;
    const ids = Array.from(selectedIds).map(k => isBroadcast ? Number(String(k).replace('bc-', '')) : Number(k)).filter(n => n > 0);
    pendingForward = {
      source_type: isBroadcast ? 'broadcast' : 'direct',
      source_conversation_id: isBroadcast ? null : currentConv,
      message_ids: ids,
    };
    exitSelectMode();
    loadUsersForForward();
  });

  // ── Forward flow ─────────────────────────────────────────────────────────

  function loadUsersForForward() {
    forwardRecipients.clear();
    usersPane.innerHTML = '';
    const hdr = document.createElement('div');
    hdr.className = 'cc-fwd-header';
    hdr.innerHTML = '<span>اختر مستلمين (' + pendingForward.message_ids.length + ' رسالة)</span><button id="cc-fwd-confirm">إرسال</button>';
    usersPane.appendChild(hdr);
    hdr.querySelector('#cc-fwd-confirm').addEventListener('click', confirmForward);
    api('/api/chat/users').then(data => {
      if (!data.success) return;
      (data.users || []).forEach(u => {
        const row = document.createElement('div');
        row.className = 'cc-user-row';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.style.flexShrink = '0';
        row.appendChild(cb);
        const lbl = document.createElement('span');
        lbl.textContent = u.name || u.email;
        row.appendChild(lbl);
        cb.addEventListener('change', () => {
          if (cb.checked) forwardRecipients.add(u.id);
          else forwardRecipients.delete(u.id);
        });
        row.addEventListener('click', (e) => { if (e.target !== cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); } });
        usersPane.appendChild(row);
      });
    });
    showPane(usersPane);
  }

  async function confirmForward() {
    if (!pendingForward || !forwardRecipients.size) return;
    const body = {
      source_type: pendingForward.source_type,
      message_ids: pendingForward.message_ids,
      recipient_user_ids: Array.from(forwardRecipients),
    };
    if (pendingForward.source_conversation_id) body.source_conversation_id = pendingForward.source_conversation_id;
    pendingForward = null;
    forwardRecipients.clear();
    await api('/api/chat/messages/forward', { method: 'POST', body: JSON.stringify(body) });
    showPane(convPane);
    loadConversations();
  }

  function applyTombstoneToRow(key) {
    const row = threadMessages.querySelector('[data-msg-row-id="' + key + '"]');
    if (!row) return;
    const bubble = row.querySelector('.cc-msg');
    if (!bubble || bubble.classList.contains('deleted')) return;
    const created = row.dataset.created || '';
    bubble.classList.add('deleted');
    bubble.innerHTML = '<span style="font-size:11px"><i class="fas fa-ban"></i> تم حذف هذه الرسالة</span><div style="font-size:10px;opacity:.7;margin-top:2px;">' + fmt(created) + '</div>';
    row.dataset.deleted = '1';
  }

  // ── Message rendering ────────────────────────────────────────────────────

  function appendIfNew(m){
    if (!m || !m.id) return;
    const key = String(m.id);
    if (threadMessages.querySelector('[data-msg-row-id="' + key + '"]')) {
      // Update tombstone if server reports deleted
      if (m.deleted_at) applyTombstoneToRow(key);
      return;
    }
    appendDateSeparatorIfNeeded(m.created_at);
    threadMessages.appendChild(renderMessage(m));
    threadMessages.scrollTop = threadMessages.scrollHeight;
    if (m.id > lastSeenMsgId) lastSeenMsgId = m.id;
    renderPdfThumbs();
  }

  async function pollNewMessages(){
    if (!currentConv) return;
    try {
      const data = await api('/api/chat/conversations/' + currentConv + '/messages?after=' + lastSeenMsgId);
      if (data.success && data.messages) {
        data.messages.forEach(m => { if (m.id > lastSeenMsgId) appendIfNew(m); });
        if (data.messages.length) markRead(currentConv, lastSeenMsgId);
      }
    } catch(e){}
  }

  function showPane(p){
    [convPane, usersPane, threadPane].forEach(x => x.classList.remove('active'));
    p.classList.add('active');
  }

  function fmt(d){ try { return new Date(d).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); } catch(e){ return ''; } }
  function dayKey(d){
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return '';
      return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    } catch(e){ return ''; }
  }
  function dayLabel(d){
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return '';
      const now = new Date();
      const today = dayKey(now.toISOString());
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      const yesterday = dayKey(y.toISOString());
      const k = dayKey(d);
      if (k === today) return 'اليوم';
      if (k === yesterday) return 'أمس';
      return dt.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch(e){ return ''; }
  }
  function lastMessageDayKey(){
    const rows = threadMessages.children;
    for (let i = rows.length - 1; i >= 0; i--) {
      const el = rows[i];
      if (el && el.dataset && el.dataset.kind === 'message') return el.dataset.msgDayKey || '';
    }
    return '';
  }
  function appendDateSeparatorIfNeeded(createdAt){
    const k = dayKey(createdAt);
    if (!k) return;
    const last = lastMessageDayKey();
    if (last === k) return;
    const sepRow = document.createElement('div');
    sepRow.className = 'cc-date-sep-row';
    sepRow.dataset.kind = 'date-separator';
    sepRow.dataset.msgDayKey = k;
    const bubble = document.createElement('div');
    bubble.className = 'cc-date-sep';
    bubble.textContent = dayLabel(createdAt);
    sepRow.appendChild(bubble);
    threadMessages.appendChild(sepRow);
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  async function api(path, opts){
    try {
      const res = await fetch(path, Object.assign({ credentials: 'same-origin', headers: { 'content-type': 'application/json' } }, opts || {}));
      const text = await res.text();
      try { return JSON.parse(text); } catch(e) { console.error('[chat-widget] non-JSON from', path, res.status, text.slice(0, 200)); return { success: false, error: 'parse_error', status: res.status }; }
    } catch(e) { console.error('[chat-widget] fetch failed', path, e); return { success: false, error: 'network_error' }; }
  }

  async function loadConversations(){
    status.textContent = 'جاري التحميل...';
    const data = await api('/api/chat/conversations');
    status.textContent = '';
    if (!data.success){ status.textContent = 'تعذر تحميل المحادثات'; return; }
    const broadcastUnread = data.broadcast_unread_count || 0;
    const totalUnread = (data.conversations||[]).reduce((s,c)=>s+(c.unread_count||0),0) + broadcastUnread;
    if (totalUnread > 0){ launcherBadge.style.display = 'inline-block'; launcherBadge.textContent = totalUnread; }
    else { launcherBadge.style.display = 'none'; }
    convList.innerHTML = '';
    const bcRow = document.createElement('div');
    bcRow.className = 'cc-conv-row' + (broadcastUnread > 0 ? ' has-unread' : '');
    bcRow.innerHTML = '<div style="min-width:0;flex:1"><div class="cc-conv-name">📢 إعلانات</div><div class="cc-conv-snippet" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">رسائل الشركة</div></div>' + (broadcastUnread > 0 ? '<div class="cc-unread-dot">' + broadcastUnread + '</div>' : '');
    bcRow.addEventListener('click', () => openBroadcasts());
    convList.appendChild(bcRow);
    if (!data.conversations || !data.conversations.length) return;
    data.conversations.forEach(conv => {
      const row = document.createElement('div');
      row.className = 'cc-conv-row' + (conv.unread_count > 0 ? ' has-unread' : '');
      const lm = conv.last_message;
      const snippet = lm ? (lm.deleted_at ? '[محذوفة]' : (lm.body || '[مرفق]')) : '';
      row.innerHTML = '<div style="min-width:0;flex:1"><div class="cc-conv-name">' + escapeHtml(conv.other_user?.name || '') + '</div><div class="cc-conv-snippet" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(snippet).slice(0,60) + '</div></div>' + (conv.unread_count > 0 ? '<div class="cc-unread-dot">' + conv.unread_count + '</div>' : '');
      row.addEventListener('click', () => { pendingForward = null; openConversation(conv.id, conv.other_user); });
      convList.appendChild(row);
    });
  }

  async function loadUsers(){
    pendingForward = null;
    usersPane.innerHTML = '<div style="padding:8px 12px;font-size:12px;color:#64748b;">اختر مستخدمًا لبدء محادثة:</div>';
    const data = await api('/api/chat/users');
    if (!data.success) return;
    (data.users||[]).forEach(u => {
      const row = document.createElement('div');
      row.className = 'cc-user-row';
      const lbl = document.createElement('span');
      lbl.textContent = u.name || u.email;
      row.appendChild(lbl);
      row.addEventListener('click', async () => {
        const r = await api('/api/chat/conversations/direct', { method: 'POST', body: JSON.stringify({ user_id: u.id }) });
        if (r.success){ await openConversation(r.conversation_id, u); }
      });
      usersPane.appendChild(row);
    });
    showPane(usersPane);
  }

  function renderBodyWithTags(body, tags){
    let html = escapeHtml(body || '');
    if (!tags || !tags.length) return html;
    const chips = tags.map(t => {
      const name = t.display_name || 'عميل';
      if (t.can_link && t.customer_id) {
        return '<a class="cc-tag-link" href="/admin/customers/' + Number(t.customer_id) + '" target="_blank" rel="noopener">' + escapeHtml(name) + '</a>';
      }
      return '<span class="cc-tag-plain">' + escapeHtml(name) + '</span>';
    }).join('');
    return html + '<div class="cc-msg-tags">' + chips + '</div>';
  }

  async function resolveMessageTagsForViewer(convId, msg){
    if (!msg || !msg.id || !msg.tags || !msg.tags.length) return msg;
    try {
      const after = Math.max(0, msg.id - 1);
      const data = await api('/api/chat/conversations/' + convId + '/messages?after=' + after + '&limit=10');
      if (data.success && data.messages) {
        const found = data.messages.find(function(x){ return x.id === msg.id; });
        if (found && found.tags && found.tags.length) return found;
      }
    } catch(e){}
    return msg;
  }

  let _pdfJsPromise = null;
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve();
    if (_pdfJsPromise) return _pdfJsPromise;
    _pdfJsPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
      s.onerror = () => reject(new Error('pdfjs load failed'));
      document.head.appendChild(s);
    });
    return _pdfJsPromise;
  }

  async function renderPdfThumbs() {
    const canvases = document.querySelectorAll('canvas[data-pdf-url]:not([data-rendered])');
    if (!canvases.length) return;
    try {
      await loadPdfJs();
      const pdfjsLib = window.pdfjsLib;
      for (const canvas of Array.from(canvases)) {
        canvas.dataset.rendered = '1';
        try {
          const pdf = await pdfjsLib.getDocument({ url: canvas.dataset.pdfUrl, withCredentials: true }).promise;
          const page = await pdf.getPage(1);
          const vp = page.getViewport({ scale: 0.4 });
          canvas.width = vp.width;
          canvas.height = vp.height;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        } catch(e) {
          if (canvas.parentElement) canvas.parentElement.innerHTML = '<span style="font-size:20px;opacity:.4">📄</span>';
        }
      }
    } catch(e) {}
  }

  function renderMessage(m){
    const self = m.sender_id === window.CC_USER_ID;
    const key = String(m.id);

    const row = document.createElement('div');
    row.className = 'cc-msg-row';
    row.dataset.kind = 'message';
    row.dataset.msgRowId = key;
    row.dataset.senderId = String(m.sender_id);
    if (m.created_at) row.dataset.created = m.created_at;
    row.dataset.msgDayKey = dayKey(m.created_at || '');

    const div = document.createElement('div');
    div.className = 'cc-msg ' + (self ? 'self' : 'peer');
    div.dataset.msgId = key;

    if (m.deleted_at) {
      div.classList.add('deleted');
      div.innerHTML = '<span style="font-size:11px"><i class="fas fa-ban"></i> تم حذف هذه الرسالة</span><div style="font-size:10px;opacity:.7;margin-top:2px;">' + fmt(m.created_at) + '</div>';
      row.appendChild(div);
      return row;
    }

    let inner = '';
    if (m.reply_preview) {
      const rp = m.reply_preview;
      const rpSelf = rp.sender_id === window.CC_USER_ID;
      const rpAuthor = rpSelf ? 'أنت' : (currentOther && currentOther.name ? escapeHtml(currentOther.name) : '');
      let rpBody = '';
      if (rp.deleted_at) {
        rpBody = '<i style="opacity:.6">تم حذف هذه الرسالة</i>';
      } else if (rp.attachment_json) {
        try { const meta = JSON.parse(rp.attachment_json); rpBody = meta.mime && meta.mime.startsWith('image/') ? '🖼 صورة' : '📄 مستند'; } catch(e) { rpBody = '📎 مرفق'; }
      } else {
        rpBody = escapeHtml((rp.body || '').slice(0, 60));
      }
      inner += '<div class="cc-reply-preview" data-reply-to="' + rp.id + '">'
        + '<div class="cc-reply-preview-author">' + rpAuthor + '</div>'
        + '<div class="cc-reply-preview-body">' + rpBody + '</div>'
        + '</div>';
    }
    if (m.is_forwarded) inner += '<div class="cc-fwd-label"><i class="fas fa-share"></i> تم التوجيه</div>';
    if (m.body) inner += renderBodyWithTags(m.body, m.tags);
    if (m.attachment_json){
      try {
        const meta = JSON.parse(m.attachment_json);
        if (meta && meta.name){
          const href = '/api/chat/attachments/' + currentConv + '/' + m.id + '/' + encodeURIComponent(meta.name);
          const dlHref = href + '?dl=1';
          const sep = inner ? '<br/>' : '';
          if (meta.mime && meta.mime.startsWith('image/')) {
            inner += sep + '<div class="cc-att-preview">'
              + '<a href="' + href + '" target="_blank" rel="noopener"><img class="cc-img-thumb" src="' + href + '" loading="lazy" alt="' + escapeHtml(meta.name) + '"></a>'
              + '<div class="cc-att-actions"><a href="' + dlHref + '" download="' + escapeHtml(meta.name) + '">⬇ تحميل</a></div>'
              + '</div>';
          } else if (meta.mime === 'application/pdf') {
            inner += sep + '<div class="cc-att-preview">'
              + '<a class="cc-pdf-box" href="' + href + '" target="_blank" rel="noopener"><canvas data-pdf-url="' + href + '"></canvas></a>'
              + '<div class="cc-att-actions">'
              + '<span style="font-size:11px">📄 ' + escapeHtml(meta.name) + '</span>'
              + '<a href="' + href + '" target="_blank" rel="noopener">فتح</a>'
              + '<a href="' + dlHref + '" download="' + escapeHtml(meta.name) + '">⬇ تحميل</a>'
              + '</div></div>';
          } else {
            inner += sep + '<a class="cc-att-link" href="' + href + '" target="_blank" rel="noopener">📎 ' + escapeHtml(meta.name) + '</a>'
              + ' <a class="cc-att-link" href="' + dlHref + '" download="' + escapeHtml(meta.name) + '">⬇</a>';
          }
        }
      } catch(e){}
    }
    inner += '<div style="font-size:10px;opacity:.7;margin-top:2px;" data-time="1">' + fmt(m.created_at) + '</div>';
    inner += '<button class="cc-msg-menu" title="خيارات"><i class="fas fa-ellipsis-v"></i></button>';
    div.innerHTML = inner;

    const rpEl = div.querySelector('.cc-reply-preview');
    if (rpEl) {
      rpEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetKey = rpEl.dataset.replyTo;
        const targetRow = threadMessages.querySelector('[data-msg-row-id="' + targetKey + '"]');
        if (targetRow) {
          targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const bubble = targetRow.querySelector('.cc-msg');
          if (bubble) {
            bubble.classList.add('reply-flash');
            setTimeout(() => bubble.classList.remove('reply-flash'), 1100);
          }
        }
      });
    }

    div.querySelector('.cc-msg-menu').addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.cc-msg-dropdown.open').forEach(el => { el.classList.remove('open'); el.remove(); });
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const dd = document.createElement('div');
      dd.className = 'cc-msg-dropdown open';
      dd.innerHTML = '<div class="cc-dd-item" data-action="reply">رد</div><div class="cc-dd-item" data-action="select">تحديد</div>';
      dd.querySelector('[data-action="reply"]').addEventListener('click', () => {
        dd.classList.remove('open'); dd.remove();
        let bodyText = m.body ? m.body.slice(0, 100) : '';
        if (!bodyText && m.attachment_json) {
          try { const meta = JSON.parse(m.attachment_json); bodyText = meta.mime && meta.mime.startsWith('image/') ? '🖼 صورة' : '📄 مستند'; } catch(e) { bodyText = '📎 مرفق'; }
        }
        pendingReply = { id: Number(key), body: bodyText, senderId: m.sender_id };
        const isOwn = m.sender_id === window.CC_USER_ID;
        const authorName = isOwn ? 'أنت' : (currentOther && currentOther.name ? currentOther.name : '');
        $('cc-reply-bar-text').textContent = authorName + ': ' + bodyText;
        $('cc-reply-bar').classList.add('active');
        msgInput.focus();
      });
      dd.querySelector('[data-action="select"]').addEventListener('click', () => {
        dd.classList.remove('open'); dd.remove();
        if (!selectMode) enterSelectMode();
        toggleSelectRow(key, row);
      });
      document.body.appendChild(dd);
      const ddW = dd.offsetWidth || 130;
      const left = Math.max(4, Math.min(rect.right - ddW, window.innerWidth - ddW - 4));
      dd.style.top = (rect.bottom + 4) + 'px';
      dd.style.left = left + 'px';
    });

    div.addEventListener('click', () => {
      if (selectMode) toggleSelectRow(key, row);
    });

    row.appendChild(div);
    return row;
  }

  // Close dropdowns on outside click
  document.addEventListener('click', () => {
    document.querySelectorAll('.cc-msg-dropdown.open').forEach(el => { el.classList.remove('open'); el.remove(); });
  });

  function connectWs(convId){
    if (ws){ try { ws.close(); } catch(e){} ws = null; }
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    try {
      ws = new WebSocket(proto + '://' + location.host + '/api/chat/ws/' + convId);
      ws.addEventListener('open', () => { wsRetry = 0; });
      ws.addEventListener('message', async (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === 'message' && currentConv === convId){
            let msg = data.message;
            msg = await resolveMessageTagsForViewer(convId, msg);
            appendIfNew(msg);
            markRead(convId, msg.id);
          } else if (data.type === 'message_deleted' && currentConv === convId) {
            (data.message_ids || []).forEach(id => applyTombstoneToRow(String(id)));
          }
        } catch(e){}
      });
      ws.addEventListener('close', () => {
        if (currentConv === convId){
          wsRetry = Math.min(wsRetry + 1, 6);
          setTimeout(() => { if (currentConv === convId) connectWs(convId); }, 1000 * wsRetry);
        }
      });
    } catch(e){ console.warn('ws failed', e); }
  }

  async function markRead(convId, lastId){
    try { await api('/api/chat/conversations/' + convId + '/read', { method:'POST', body: JSON.stringify({ last_read_message_id: lastId }) }); } catch(e){}
  }

  async function openConversation(convId, other){
    currentConv = convId;
    currentOther = other;
    currentBroadcasts = false;
    exitSelectMode();
    pendingReply = null;
    $('cc-reply-bar').classList.remove('active');
    threadName.textContent = (other && other.name) || '';
    threadMessages.innerHTML = '';
    lastSeenMsgId = 0;
    threadInput.style.display = '';
    showPane(threadPane);
    const data = await api('/api/chat/conversations/' + convId + '/messages');
    if (data.success && data.messages){
      data.messages.forEach(m => appendIfNew(m));
      if (lastSeenMsgId) markRead(convId, lastSeenMsgId).then(() => loadConversations());
    }
    connectWs(convId);
    if (threadPoll) clearInterval(threadPoll);
    threadPoll = setInterval(pollNewMessages, 4000);
  }

  async function openBroadcasts(){
    currentConv = null;
    currentOther = null;
    currentBroadcasts = true;
    exitSelectMode();
    pendingReply = null;
    $('cc-reply-bar').classList.remove('active');
    threadName.textContent = '📢 إعلانات';
    threadMessages.innerHTML = '';
    lastSeenMsgId = 0;
    const isAdmin = window.CC_ROLE_ID === 2;
    threadInput.style.display = isAdmin ? '' : 'none';
    showPane(threadPane);
    const data = await api('/api/chat/broadcasts/messages');
    if (data.success && data.messages){
      data.messages.forEach(m => appendBroadcastMsg(m));
      if (lastSeenMsgId) {
        await api('/api/chat/broadcasts/read', { method:'POST', body: JSON.stringify({ last_read_broadcast_id: lastSeenMsgId }) });
        loadConversations();
      }
    }
    if (ws){ try { ws.close(); } catch(e){} ws = null; }
    if (threadPoll) clearInterval(threadPoll);
    threadPoll = setInterval(async () => {
      if (!currentBroadcasts) return;
      const d = await api('/api/chat/broadcasts/messages?after=' + (lastSeenMsgId || 0));
      if (d.success && d.messages && d.messages.length){
        d.messages.forEach(m => appendBroadcastMsg(m));
        if (lastSeenMsgId){
          await api('/api/chat/broadcasts/read', { method:'POST', body: JSON.stringify({ last_read_broadcast_id: lastSeenMsgId }) });
          loadConversations();
        }
      }
    }, 4000);
    // Connect broadcast WS for live events (message_deleted etc.)
    try {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(proto + '://' + location.host + '/api/chat/broadcasts/ws');
      ws.addEventListener('message', (ev) => {
        try {
          const d = JSON.parse(ev.data);
          if (d.type === 'broadcast' && currentBroadcasts) appendBroadcastMsg(d.message);
          else if (d.type === 'broadcast_deleted' && currentBroadcasts) {
            (d.message_ids || []).forEach(id => applyTombstoneToRow('bc-' + id));
          }
        } catch(e){}
      });
    } catch(e){}
  }

  function appendBroadcastMsg(m){
    if (!m || !m.id) return;
    const key = 'bc-' + m.id;
    const existing = threadMessages.querySelector('[data-msg-row-id="' + key + '"]');
    if (existing) {
      if (m.deleted_at) applyTombstoneToRow(key);
      return;
    }
    appendDateSeparatorIfNeeded(m.created_at);
    const self = m.sender_id === window.CC_USER_ID;
    const row = document.createElement('div');
    row.className = 'cc-msg-row ' + (self ? 'self-row' : 'peer-row');
    row.dataset.kind = 'message';
    row.dataset.msgRowId = key;
    row.dataset.senderId = String(m.sender_id);
    if (m.created_at) row.dataset.created = m.created_at;
    row.dataset.msgDayKey = dayKey(m.created_at || '');

    const div = document.createElement('div');
    div.className = 'cc-msg ' + (self ? 'self' : 'peer');

    if (m.deleted_at) {
      div.classList.add('deleted');
      div.innerHTML = '<span style="font-size:11px"><i class="fas fa-ban"></i> تم حذف هذه الرسالة</span><div class="cc-msg-time">' + fmt(m.created_at) + '</div>';
      row.appendChild(div);
    } else {
      let inner = (m.sender_name ? '<div style="font-size:10px;opacity:.7;margin-bottom:2px">' + escapeHtml(m.sender_name) + '</div>' : '') + escapeHtml(m.body || '') + '<div class="cc-msg-time">' + fmt(m.created_at) + '</div>';
      inner += '<button class="cc-msg-menu" title="خيارات"><i class="fas fa-ellipsis-v"></i></button>';
      div.innerHTML = inner;

      div.querySelector('.cc-msg-menu').addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.cc-msg-dropdown.open').forEach(el => { el.classList.remove('open'); el.remove(); });
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const dd = document.createElement('div');
        dd.className = 'cc-msg-dropdown open';
        dd.innerHTML = '<div class="cc-dd-item" data-action="select">تحديد</div>';
        dd.querySelector('[data-action="select"]').addEventListener('click', () => {
          dd.classList.remove('open'); dd.remove();
          if (!selectMode) enterSelectMode();
          toggleSelectRow(key, row);
        });
        document.body.appendChild(dd);
        const ddW = dd.offsetWidth || 130;
        const left = Math.max(4, Math.min(rect.right - ddW, window.innerWidth - ddW - 4));
        dd.style.top = (rect.bottom + 4) + 'px';
        dd.style.left = left + 'px';
      });

      div.addEventListener('click', () => {
        if (selectMode) toggleSelectRow(key, row);
      });

      row.appendChild(div);
    }

    threadMessages.appendChild(row);
    threadMessages.scrollTop = threadMessages.scrollHeight;
    if (m.id > lastSeenMsgId) lastSeenMsgId = m.id;
  }

  // ── @-mention picker ────────────────────────────────────────────────────
  const mentionBox = document.getElementById('cc-mention-box');
  let mentionState = null;
  const taggedCustomers = new Map();
  function closeMention(){ mentionState = null; mentionBox.classList.remove('open'); mentionBox.innerHTML = ''; }
  function detectMentionTrigger(){
    const v = msgInput.value;
    const caret = msgInput.selectionStart || v.length;
    let i = caret - 1;
    while (i >= 0 && v[i] !== '@' && !/\\s/.test(v[i])) i--;
    if (i < 0 || v[i] !== '@'){ closeMention(); return; }
    const query = v.slice(i + 1, caret);
    mentionState = { start: i, query, items: [], active: 0 };
    runMentionSearch(query);
  }
  let mentionAbort = 0;
  async function runMentionSearch(query){
    const reqId = ++mentionAbort;
    try {
      const data = await api('/api/chat/customers/search?q=' + encodeURIComponent(query) + '&limit=8');
      if (reqId !== mentionAbort || !mentionState) return;
      const items = (data && data.success && data.customers) ? data.customers : [];
      mentionState.items = items;
      mentionState.active = 0;
      if (!items.length){ mentionBox.innerHTML = '<div class="cc-mention-row" style="color:#94a3b8">لا توجد نتائج</div>'; mentionBox.classList.add('open'); return; }
      mentionBox.innerHTML = items.map((c, idx) =>
        '<div class="cc-mention-row' + (idx === 0 ? ' active' : '') + '" data-idx="' + idx + '">' +
          '<div>' + escapeHtml(c.full_name || '') + '</div>' +
          (c.phone ? '<div class="cc-mention-phone">' + escapeHtml(c.phone) + '</div>' : '') +
        '</div>'
      ).join('');
      mentionBox.classList.add('open');
      Array.from(mentionBox.querySelectorAll('.cc-mention-row')).forEach((row) => {
        row.addEventListener('mousedown', (ev) => { ev.preventDefault(); pickMention(Number(row.getAttribute('data-idx'))); });
      });
    } catch(e){ closeMention(); }
  }
  function pickMention(idx){
    if (!mentionState || !mentionState.items[idx]) return;
    const c = mentionState.items[idx];
    const name = c.full_name || ('#' + c.id);
    const v = msgInput.value;
    const caret = msgInput.selectionStart || v.length;
    const before = v.slice(0, mentionState.start);
    const after = v.slice(caret);
    const insert = name + ' ';
    msgInput.value = before + insert + after;
    const nc = (before + insert).length;
    msgInput.focus();
    msgInput.setSelectionRange(nc, nc);
    taggedCustomers.set(c.id, name);
    closeMention();
  }
  msgInput.addEventListener('input', detectMentionTrigger);
  msgInput.addEventListener('keydown', (e) => {
    if (!mentionState || !mentionBox.classList.contains('open') || !mentionState.items.length) return;
    if (e.key === 'ArrowDown'){ e.preventDefault(); mentionState.active = (mentionState.active + 1) % mentionState.items.length; }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); mentionState.active = (mentionState.active - 1 + mentionState.items.length) % mentionState.items.length; }
    else if (e.key === 'Enter' || e.key === 'Tab'){ e.preventDefault(); pickMention(mentionState.active); return; }
    else if (e.key === 'Escape'){ closeMention(); return; }
    else return;
    Array.from(mentionBox.querySelectorAll('.cc-mention-row')).forEach((row, i) => row.classList.toggle('active', i === mentionState.active));
  });
  msgInput.addEventListener('blur', () => setTimeout(closeMention, 150));
  function collectActiveTags(){
    return Array.from(taggedCustomers.keys());
  }

  threadInput.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text) return;
    const customer_ids = collectActiveTags();
    const replyId = pendingReply ? pendingReply.id : null;
    msgInput.value = '';
    closeMention();
    pendingReply = null;
    $('cc-reply-bar').classList.remove('active');
    if (currentBroadcasts) {
      const data = await api('/api/chat/broadcasts/messages', { method: 'POST', body: JSON.stringify({ body: text }) });
      if (data.success && data.message) appendBroadcastMsg(data.message);
    } else if (currentConv) {
      const payload = { body: text, customer_ids };
      if (replyId) payload.replied_to_message_id = replyId;
      const data = await api('/api/chat/conversations/' + currentConv + '/messages', { method: 'POST', body: JSON.stringify(payload) });
      if (data.success && data.message){ appendIfNew(data.message); taggedCustomers.clear(); }
    }
  });

  attInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !currentConv) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/chat/conversations/' + currentConv + '/attachments', { method:'POST', credentials:'same-origin', body: fd });
    const data = await res.json().catch(()=>({}));
    if (data.success && data.message){
      appendIfNew(data.message);
    }
    attInput.value = '';
  });

  launcher.addEventListener('click', async () => {
    win.classList.toggle('open');
    if (win.classList.contains('open')) {
      loadConversations();
    }
  });
  closeBtn.addEventListener('click', () => win.classList.remove('open'));
  newBtn.addEventListener('click', loadUsers);
  threadBack.addEventListener('click', () => {
    if (ws){ try { ws.close(); } catch(e){} ws = null; }
    if (threadPoll){ clearInterval(threadPoll); threadPoll = null; }
    exitSelectMode();
    currentConv = null;
    currentBroadcasts = false;
    threadInput.style.display = '';
    showPane(convPane);
    loadConversations();
  });

  // Persistent notification WS — fires loadConversations() the instant a message arrives for this user.
  let _notifyWs = null;
  let _notifyRetry = 0;
  let _notifyRetryTimer = null;
  function connectNotifyWs() {
    if (_notifyWs) { try { _notifyWs.close(); } catch(e){} _notifyWs = null; }
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    try {
      _notifyWs = new WebSocket(proto + '://' + location.host + '/api/chat/notify/ws');
      _notifyWs.addEventListener('open', () => { _notifyRetry = 0; });
      _notifyWs.addEventListener('message', (ev) => {
        try { const d = JSON.parse(ev.data); if (d.type === 'unread_update') loadConversations(); } catch(e){}
      });
      _notifyWs.addEventListener('close', () => {
        _notifyWs = null;
        _notifyRetry = Math.min(_notifyRetry + 1, 6);
        clearTimeout(_notifyRetryTimer);
        _notifyRetryTimer = setTimeout(connectNotifyWs, Math.min(1000 * Math.pow(2, _notifyRetry), 30000));
      });
    } catch(e){ console.warn('[chat] notify ws failed', e); }
  }
  if (window.CC_USER_ID) connectNotifyWs();

  // Fallback poll (10 s) keeps badge fresh if WS is temporarily down.
  let _convTimer = null;
  function scheduleConvRefresh() {
    clearTimeout(_convTimer);
    _convTimer = setTimeout(async () => { await loadConversations(); scheduleConvRefresh(); }, 10000);
  }
  scheduleConvRefresh();
})();
</script>
`
}
