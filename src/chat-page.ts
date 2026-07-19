/**
 * Full-screen /admin/chat page: two-column layout (conversations + active thread).
 * Uses the same /api/chat REST + WS endpoints as the widget.
 */

import { CHAT_ADMIN_DRILLDOWN_ENABLED } from './chat-module-api.ts'

export function chatPage(opts: { userId: number; tenantId: number | null; roleId: number | null }): string {
  const adminDrilldown = Number(opts.roleId) === 2 && CHAT_ADMIN_DRILLDOWN_ENABLED
  const userId = Number(opts.userId)
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <title>محادثة الشركة</title>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link href="/tailwind.css" rel="stylesheet"/>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"/>
  <style>
    body { font-family: 'Tajawal', system-ui, sans-serif; background: #f1f5f9; color: #0f172a; }
    .cp-layout { display: flex; height: 100vh; width: 100%; box-sizing: border-box; }
    .cp-sidebar { width: 320px; background: #fff; border-left: 1px solid #e2e8f0; display: flex; flex-direction: column; }
    .cp-sidebar header { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .cp-sidebar header h1 { margin: 0; font-size: 16px; }
    .cp-sidebar header button { background: #1e40af; color: #fff; border: none; border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 13px; }
    .cp-back { color: #1e40af; text-decoration: none; font-size: 13px; }
    .cp-conv-list { flex: 1; overflow-y: auto; }
    .cp-conv-row { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .cp-conv-row.active { background: #eff6ff; }
    .cp-conv-row:hover { background: #f8fafc; }
    .cp-conv-row.has-unread { background: #eff6ff; }
    .cp-conv-row.has-unread:hover { background: #e0edff; }
    .cp-conv-name { font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cp-conv-row.has-unread .cp-conv-name { font-weight: 700; color: #1e3a8a; }
    .cp-conv-snippet { font-size: 12px; color: #64748b; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cp-conv-row.has-unread .cp-conv-snippet { color: #334155; }
    .cp-unread { background: #1e40af; color: #fff; font-size: 11px; font-weight: 700; min-width: 20px; height: 20px; line-height: 20px; border-radius: 10px; padding: 0 6px; text-align: center; flex-shrink: 0; }
    .cp-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .cp-main-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 14px; }
    /* Thread header: normal + select mode */
    .cp-thread-header {
      padding: 10px 16px;
      border-bottom: 1px solid #e2e8f0;
      background: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 48px;
    }
    #cp-header-normal { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; font-weight: 600; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #cp-header-select { display: none; align-items: center; gap: 10px; flex: 1; }
    #cp-header-select.active { display: flex; }
    #cp-select-cancel { background: none; border: none; cursor: pointer; font-size: 13px; color: #64748b; padding: 2px 8px; }
    #cp-select-count { font-size: 13px; font-weight: 600; flex: 1; }
    #cp-delete-selected, #cp-forward-selected {
      background: #1e40af; color: #fff; border: none; border-radius: 8px; padding: 5px 12px; cursor: pointer; font-size: 13px;
    }
    #cp-delete-selected:disabled { opacity: 0.35; cursor: default; }
    #cp-forward-selected:disabled { opacity: 0.35; cursor: default; }
    .cp-thread-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; background-color: #edf2fb; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cg transform='translate(4,6) rotate(-8,27,16)' fill='none' stroke='%231e40af' stroke-width='1.5' stroke-linecap='round' opacity='.2'%3E%3Crect x='0' y='0' width='54' height='32' rx='4'/%3E%3Cellipse cx='27' cy='16' rx='10' ry='8'/%3E%3Cline x1='0' y1='8' x2='8' y2='8'/%3E%3Cline x1='0' y1='24' x2='8' y2='24'/%3E%3Cline x1='46' y1='8' x2='54' y2='8'/%3E%3Cline x1='46' y1='24' x2='54' y2='24'/%3E%3C/g%3E%3Cg transform='translate(96,10) rotate(6,25,22)' fill='none' stroke='%231e40af' stroke-linecap='round' opacity='.2'%3E%3Cline x1='0' y1='0' x2='0' y2='44' stroke-width='1'/%3E%3Cline x1='0' y1='42' x2='50' y2='42' stroke-width='1'/%3E%3Crect x='4' y='30' width='8' height='12' fill='%231e40af' stroke='none' opacity='.55'/%3E%3Crect x='17' y='20' width='8' height='22' fill='%231e40af' stroke='none' opacity='.55'/%3E%3Crect x='30' y='10' width='8' height='32' fill='%231e40af' stroke='none' opacity='.55'/%3E%3Crect x='43' y='2' width='8' height='40' fill='%231e40af' stroke='none' opacity='.55'/%3E%3Cpolyline points='8,26 21,16 34,6 47,-2' stroke-width='2' stroke='%231e40af'/%3E%3C/g%3E%3Cg transform='translate(8,94) rotate(7,19,24)' fill='none' stroke='%231e40af' stroke-width='1.5' stroke-linecap='round' opacity='.2'%3E%3Ccircle cx='19' cy='30' r='18'/%3E%3Cpath d='M12 12 Q19 3 26 12'/%3E%3Cpath d='M15 5 L13 0 L25 0 L23 5'/%3E%3Cline x1='13' y1='27' x2='25' y2='27'/%3E%3Cline x1='13' y1='34' x2='25' y2='34'/%3E%3C/g%3E%3Cg transform='translate(104,100) rotate(-7,16,16)' fill='none' stroke='%231e40af' stroke-width='1.8' stroke-linecap='round' opacity='.2'%3E%3Ccircle cx='7' cy='7' r='5.5'/%3E%3Cline x1='2' y1='30' x2='30' y2='2' stroke-width='2.2'/%3E%3Ccircle cx='25' cy='25' r='5.5'/%3E%3C/g%3E%3C/svg%3E"); background-repeat: repeat; background-size: 160px 160px; }
    /* Message rows */
    .cp-msg-row { display: flex; align-items: flex-end; width: 100%; }
    .cp-date-sep-row { display: flex; justify-content: center; width: 100%; margin: 4px 0 2px; }
    .cp-date-sep { background: rgba(255,255,255,.9); border: 1px solid #dbe3f3; color: #334155; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 600; box-shadow: 0 1px 2px rgba(15,23,42,.08); }
    .cp-msg { max-width: 60%; padding: 8px 12px; border-radius: 12px; font-size: 14px; word-wrap: break-word; flex-shrink: 0; position: relative; }
    .cp-msg.self { background: #1e40af; color: #fff; margin-inline-start: auto; }
    .cp-msg.peer { background: #fff; border: 1px solid #e2e8f0; margin-inline-end: auto; }
    /* Tombstone */
    .cp-msg.deleted { background: #f1f5f9; color: #94a3b8; font-style: italic; border: 1px dashed #cbd5e1; }
    .cp-msg.deleted.self { background: rgba(30,64,175,0.08); color: #94a3b8; border: 1px dashed #93c5fd; }
    /* Forwarded label */
    .cp-fwd-label { font-size: 11px; opacity: .65; font-style: italic; margin-bottom: 3px; }
    /* Menu button: pinned to top corner of bubble facing chat center (WhatsApp style) */
    .cp-msg-menu {
      position: absolute; top: 4px;
      background: rgba(0,0,0,0.15); border: none; border-radius: 3px; color: inherit;
      cursor: pointer; font-size: 11px; padding: 1px 5px;
      opacity: 0; transition: opacity 0.15s; line-height: 1.5; z-index: 2;
    }
    .cp-msg.self .cp-msg-menu { right: 4px; background: rgba(255,255,255,0.2); }
    .cp-msg.peer .cp-msg-menu { right: 4px; }
    .cp-msg:hover .cp-msg-menu { opacity: 1; }
    /* Select mode */
    .cp-msg-row.selected .cp-msg { outline: 2px solid #1e40af; outline-offset: 2px; }
    .cp-msg-row.selected .cp-msg.self { outline-color: #93c5fd; }
    #cp-thread-messages.select-mode .cp-msg { cursor: pointer; }
    #cp-thread-messages.select-mode .cp-msg * { pointer-events: none; }
    #cp-thread-messages.select-mode .cp-msg-menu { display: none !important; }
    /* Dropdown — appended to body so it's never clipped by overflow containers */
    .cp-msg-dropdown {
      position: fixed;
      background: #fff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px;
      box-shadow: 0 6px 22px rgba(15,23,42,.15); z-index: 9999; min-width: 130px; display: none;
    }
    .cp-msg-dropdown.open { display: block; }
    .cp-msg-dropdown .cp-dd-item { padding: 6px 12px; font-size: 12px; color: #0f172a; cursor: pointer; border-bottom: 1px solid #f8fafc; white-space: nowrap; }
    .cp-msg-dropdown .cp-dd-item:last-child { border-bottom: none; }
    .cp-msg-dropdown .cp-dd-item:hover { background: #f1f5f9; }
    .cp-msg .cp-time { font-size: 10px; opacity: .7; margin-top: 3px; }
    .cp-msg a { color: inherit; text-decoration: underline; }
    /* Reply bar shown above input when composing a reply */
    .cp-reply-bar { display: none; background: #eff6ff; border-top: 3px solid #1e40af; padding: 6px 12px; align-items: center; gap: 8px; font-size: 12px; color: #334155; }
    .cp-reply-bar.active { display: flex; }
    .cp-reply-bar-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cp-reply-bar-close { background: none; border: none; cursor: pointer; font-size: 18px; color: #64748b; padding: 0 2px; line-height: 1; }
    /* Reply preview inside a message bubble */
    .cp-reply-preview { background: rgba(0,0,0,0.07); border-inline-start: 3px solid rgba(255,255,255,0.5); border-radius: 6px; padding: 4px 8px; margin-bottom: 5px; font-size: 11px; cursor: pointer; overflow: hidden; max-width: 100%; }
    .cp-msg.peer .cp-reply-preview { background: #f0f4ff; border-inline-start-color: #1e40af; color: #1e3a8a; }
    .cp-reply-preview-author { font-weight: 700; font-size: 10px; margin-bottom: 1px; opacity: 0.9; }
    .cp-reply-preview-body { opacity: 0.85; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cp-reply-preview:hover { opacity: 0.8; }
    @keyframes cp-reply-flash { from { box-shadow: 0 0 0 3px #fbbf24; } to { box-shadow: none; } }
    .cp-msg.reply-flash { animation: cp-reply-flash 1s ease-out; }
    .cp-img-thumb { max-width: 220px; max-height: 200px; border-radius: 8px; display: block; cursor: pointer; }
    .cp-att-preview { display: flex; flex-direction: column; gap: 4px; }
    .cp-att-actions { display: flex; gap: 10px; font-size: 11px; margin-top: 2px; }
    .cp-att-actions a { text-decoration: none; opacity: .85; }
    .cp-att-actions a:hover { opacity: 1; }
    .cp-pdf-box { width: 180px; min-height: 100px; max-height: 160px; background: rgba(0,0,0,.08); border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: pointer; text-decoration: none; }
    .cp-pdf-box canvas { max-width: 100%; display: block; pointer-events: none; }
    .cp-input-row { display: flex; padding: 10px; gap: 6px; border-top: 1px solid #e2e8f0; background: #fff; }
    .cp-input-row input[type="text"] { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 10px; font-size: 14px; }
    .cp-input-row button { background: #1e40af; color: #fff; border: none; border-radius: 10px; padding: 6px 16px; cursor: pointer; }
    .cp-input-row label.cp-att { border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 10px; background: #fff; cursor: pointer; }
    .cp-input-row label.cp-att input { display: none; }
    .cp-mention-box { position: absolute; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 6px 22px rgba(15,23,42,.15); max-height: 220px; overflow-y: auto; width: 280px; z-index: 50; display: none; }
    .cp-mention-box.open { display: block; }
    .cp-mention-row { padding: 8px 12px; cursor: pointer; font-size: 13px; border-bottom: 1px solid #f8fafc; }
    .cp-mention-row:hover, .cp-mention-row.active { background: #eff6ff; }
    .cp-mention-row .cp-mention-phone { color: #64748b; font-size: 11px; margin-top: 2px; }
    .cp-chip { display: inline-block; background: #dbeafe; color: #1e3a8a; border-radius: 6px; padding: 1px 6px; margin: 0 2px; font-weight: 600; }
    .cp-msg a.cp-tag-link { display: inline-block; background: #dbeafe; color: #1e3a8a; border-radius: 6px; padding: 1px 6px; text-decoration: none; font-weight: 600; font-size: 12px; margin: 2px 2px 0 0; unicode-bidi: isolate; direction: ltr; }
    .cp-msg.self a.cp-tag-link { background: #93c5fd; color: #0c1e4e; }
    .cp-msg .cp-tag-plain { display: inline-block; background: #e2e8f0; color: #475569; border-radius: 6px; padding: 1px 6px; font-weight: 600; font-size: 12px; margin: 2px 2px 0 0; }
    .cp-msg.self .cp-tag-plain { background: #cbd5e1; color: #334155; }
    .cp-msg-tags { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; }
    /* Admin oversight — tabs, drill-down, read-only banner */
    .cp-admin-tabs { display: flex; border-bottom: 1px solid #e2e8f0; }
    .cp-admin-tab { flex: 1; padding: 8px 4px; font-size: 13px; font-weight: 600; text-align: center; cursor: pointer; color: #64748b; border-bottom: 2px solid transparent; transition: color .15s, border-color .15s; }
    .cp-admin-tab.active { color: #1e40af; border-bottom-color: #1e40af; }
    .cp-admin-back-bar { padding: 7px 12px; border-bottom: 1px solid #f1f5f9; }
    .cp-admin-back-btn { background: none; border: none; cursor: pointer; font-size: 12px; color: #1e40af; display: flex; align-items: center; gap: 4px; padding: 0; }
    .cp-readonly-banner { background: #fef9c3; border-bottom: 1px solid #fde047; padding: 6px 14px; font-size: 12px; color: #713f12; display: none; align-items: center; gap: 6px; }
    .cp-readonly-banner.visible { display: flex; }
    /* Users modal (normal new-chat) */
    #cp-users-modal { position: fixed; inset: 0; background: rgba(15,23,42,.4); display: none; align-items: center; justify-content: center; z-index: 100; }
    #cp-users-modal.open { display: flex; }
    .cp-users-card { background: #fff; border-radius: 12px; width: 340px; max-height: 60vh; display: flex; flex-direction: column; }
    .cp-users-card header { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .cp-users-card header button { background: none; border: none; cursor: pointer; font-size: 18px; }
    .cp-users-list { overflow-y: auto; }
    .cp-user-row { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f8fafc; font-size: 14px; display: flex; align-items: center; gap: 8px; }
    .cp-user-row:hover { background: #f1f5f9; }
    /* Forward modal */
    #cp-forward-modal { position: fixed; inset: 0; background: rgba(15,23,42,.4); display: none; align-items: center; justify-content: center; z-index: 100; }
    #cp-forward-modal.open { display: flex; }
    .cp-fwd-card { background: #fff; border-radius: 12px; width: 360px; max-height: 65vh; display: flex; flex-direction: column; }
    .cp-fwd-card header { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
    .cp-fwd-card header button { background: none; border: none; cursor: pointer; font-size: 18px; }
    .cp-fwd-list { overflow-y: auto; flex: 1; }
    .cp-fwd-footer { padding: 10px 14px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 8px; }
    .cp-fwd-footer button { border: none; border-radius: 8px; padding: 7px 16px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .cp-fwd-footer .cp-fwd-confirm { background: #1e40af; color: #fff; }
    .cp-fwd-footer .cp-fwd-cancel-btn { background: #f1f5f9; color: #334155; }
  </style>
</head>
<body>
<div class="cp-layout">
  <aside class="cp-sidebar">
    <header>
      <div>
        <a class="cp-back" href="/admin/dashboard">← الرجوع</a>
        <h1>المحادثات</h1>
      </div>
      <button id="cp-new">＋ جديدة</button>
    </header>
    ${adminDrilldown ? `<div class="cp-admin-tabs">
      <div class="cp-admin-tab active" id="cp-tab-my">محادثاتي</div>
      <div class="cp-admin-tab" id="cp-tab-company">محادثات الشركة</div>
    </div>` : ''}
    <div class="cp-conv-list" id="cp-conv-list"></div>
    ${adminDrilldown ? `<div id="cp-admin-panel" style="display:none;flex:1;overflow-y:auto;flex-direction:column;">
      <div id="cp-admin-users-list"></div>
      <div id="cp-admin-conv-list" style="display:none;"></div>
    </div>` : ''}
  </aside>
  <main class="cp-main">
    <div class="cp-main-empty" id="cp-empty">اختر محادثة للبدء</div>
    <div class="cp-thread-header" id="cp-thread-header" style="display:none;">
      <div id="cp-header-normal"></div>
      <div id="cp-header-select">
        <button id="cp-select-cancel">إلغاء</button>
        <span id="cp-select-count">0 محدد</span>
        <button id="cp-delete-selected" disabled><i class="fas fa-trash-alt"></i> حذف</button>
        <button id="cp-forward-selected"><i class="fas fa-share"></i> إعادة توجيه</button>
      </div>
    </div>
    <div class="cp-readonly-banner" id="cp-readonly-banner">
      <i class="fas fa-eye"></i>
      <span id="cp-readonly-text"></span>
    </div>
    <div class="cp-thread-messages" id="cp-thread-messages" style="display:none;"></div>
    <div id="cp-tag-tray" style="display:none; padding: 4px 10px; background: #fff; border-top: 1px solid #f1f5f9; flex-wrap: wrap; gap: 4px;"></div>
    <div class="cp-reply-bar" id="cp-reply-bar">
      <i class="fas fa-reply" style="opacity:.7;color:#1e40af;"></i>
      <div class="cp-reply-bar-text" id="cp-reply-bar-text"></div>
      <button type="button" class="cp-reply-bar-close" id="cp-reply-bar-close" title="إلغاء الرد">×</button>
    </div>
    <form class="cp-input-row" id="cp-input-form" style="display:none; position: relative;">
      <label class="cp-att" title="مرفق">📎<input type="file" id="cp-att-input"/></label>
      <input type="text" id="cp-msg-input" placeholder="اكتب رسالة... (اكتب @ للإشارة لعميل)" maxlength="8000" autocomplete="off"/>
      <button type="submit">إرسال</button>
      <div class="cp-mention-box" id="cp-mention-box"></div>
    </form>
  </main>
</div>
<!-- Normal new-chat modal -->
<div id="cp-users-modal">
  <div class="cp-users-card">
    <header><strong>مستخدم للمحادثة</strong><button id="cp-users-close">×</button></header>
    <div class="cp-users-list" id="cp-users-list"></div>
  </div>
</div>
<!-- Forward-to modal -->
<div id="cp-forward-modal">
  <div class="cp-fwd-card">
    <header><span id="cp-fwd-title">إعادة توجيه</span><button id="cp-fwd-close">×</button></header>
    <div class="cp-fwd-list" id="cp-fwd-list"></div>
    <div class="cp-fwd-footer">
      <button class="cp-fwd-cancel-btn" id="cp-fwd-cancel-btn">إلغاء</button>
      <button class="cp-fwd-confirm" id="cp-fwd-confirm-btn">إرسال</button>
    </div>
  </div>
</div>
<script>
window.CC_USER_ID = ${userId};
(function(){
  const $ = (id) => document.getElementById(id);
  const convList = $('cp-conv-list');
  const empty = $('cp-empty');
  const header = $('cp-thread-header');
  const headerNormal = $('cp-header-normal');
  const headerSelect = $('cp-header-select');
  const messages = $('cp-thread-messages');
  const form = $('cp-input-form');
  const msgInput = $('cp-msg-input');
  const attInput = $('cp-att-input');
  const newBtn = $('cp-new');
  const usersModal = $('cp-users-modal');
  const usersList = $('cp-users-list');
  const selectCancel = $('cp-select-cancel');
  const selectCount = $('cp-select-count');
  const deleteBtn = $('cp-delete-selected');
  const forwardBtnEl = $('cp-forward-selected');
  const forwardModal = $('cp-forward-modal');
  const fwdList = $('cp-fwd-list');
  const fwdConfirmBtn = $('cp-fwd-confirm-btn');
  $('cp-users-close').addEventListener('click', () => usersModal.classList.remove('open'));
  $('cp-fwd-close').addEventListener('click', () => forwardModal.classList.remove('open'));
  $('cp-fwd-cancel-btn').addEventListener('click', () => forwardModal.classList.remove('open'));

  const PAGE_ROLE_ID = ${Number(opts.roleId) || 'null'};
  const ADMIN_DRILLDOWN_ENABLED = ${CHAT_ADMIN_DRILLDOWN_ENABLED};
  let currentConv = null;
  let currentBroadcasts = false;
  let ws = null;
  let wsRetry = 0;
  let threadPoll = null;
  let lastSeenMsgId = 0;

  // Select mode state
  let selectMode = false;
  const selectedIds = new Set();

  // Forward state
  let pendingForward = null;
  const forwardRecipients = new Set();

  // Reply state
  let pendingReply = null; // { id, body, senderId }
  $('cp-reply-bar-close').addEventListener('click', () => {
    pendingReply = null;
    $('cp-reply-bar').classList.remove('active');
  });

  // ── Select mode ──────────────────────────────────────────────────────────

  function enterSelectMode() {
    selectMode = true;
    selectedIds.clear();
    messages.classList.add('select-mode');
    headerNormal.style.display = 'none';
    headerSelect.classList.add('active');
    updateSelectBar();
  }

  function exitSelectMode() {
    selectMode = false;
    selectedIds.clear();
    messages.classList.remove('select-mode');
    headerNormal.style.display = '';
    headerSelect.classList.remove('active');
    messages.querySelectorAll('.cp-msg-row.selected').forEach(el => el.classList.remove('selected'));
  }

  function updateSelectBar() {
    const n = selectedIds.size;
    selectCount.textContent = n + ' محدد';
    let allOwn = true;
    selectedIds.forEach(key => {
      const row = messages.querySelector('[data-msg-row-id="' + key + '"]');
      if (!row || row.dataset.senderId !== String(window.CC_USER_ID)) allOwn = false;
    });
    deleteBtn.disabled = n === 0 || !allOwn;
    forwardBtnEl.disabled = n === 0;
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

  forwardBtnEl.addEventListener('click', () => {
    if (!selectedIds.size) return;
    const isBroadcast = currentBroadcasts;
    const ids = Array.from(selectedIds).map(k => isBroadcast ? Number(String(k).replace('bc-', '')) : Number(k)).filter(n => n > 0);
    pendingForward = { source_type: isBroadcast ? 'broadcast' : 'direct', source_conversation_id: isBroadcast ? null : currentConv, message_ids: ids };
    exitSelectMode();
    openForwardModal();
  });

  function openForwardModal() {
    forwardRecipients.clear();
    fwdList.innerHTML = '';
    $('cp-fwd-title').textContent = 'إعادة توجيه ' + (pendingForward.message_ids.length) + ' رسالة';
    api('/api/chat/users').then(data => {
      (data.users || []).forEach(u => {
        const row = document.createElement('div');
        row.className = 'cp-user-row';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.style.flexShrink = '0';
        row.appendChild(cb);
        const lbl = document.createElement('span');
        lbl.textContent = u.name || u.email;
        row.appendChild(lbl);
        cb.addEventListener('change', () => { if (cb.checked) forwardRecipients.add(u.id); else forwardRecipients.delete(u.id); });
        row.addEventListener('click', (e) => { if (e.target !== cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); } });
        fwdList.appendChild(row);
      });
    });
    forwardModal.classList.add('open');
  }

  fwdConfirmBtn.addEventListener('click', async () => {
    if (!pendingForward || !forwardRecipients.size) return;
    const body = { source_type: pendingForward.source_type, message_ids: pendingForward.message_ids, recipient_user_ids: Array.from(forwardRecipients) };
    if (pendingForward.source_conversation_id) body.source_conversation_id = pendingForward.source_conversation_id;
    pendingForward = null;
    forwardRecipients.clear();
    forwardModal.classList.remove('open');
    await api('/api/chat/messages/forward', { method: 'POST', body: JSON.stringify(body) });
    loadConversations();
  });

  function applyTombstoneToRow(key) {
    const row = messages.querySelector('[data-msg-row-id="' + key + '"]');
    if (!row) return;
    const bubble = row.querySelector('.cp-msg');
    if (!bubble || bubble.classList.contains('deleted')) return;
    const created = row.dataset.created || '';
    bubble.classList.add('deleted');
    bubble.innerHTML = '<span><i class="fas fa-ban"></i> تم حذف هذه الرسالة</span><div class="cp-time">' + fmt(created) + '</div>';
    row.dataset.deleted = '1';
  }

  // ── Message rendering ────────────────────────────────────────────────────

  function appendIfNew(m){
    if (!m || !m.id) return;
    const key = String(m.id);
    const existing = messages.querySelector('[data-msg-row-id="' + key + '"]');
    if (existing) {
      if (m.deleted_at) applyTombstoneToRow(key);
      return;
    }
    appendDateSeparatorIfNeeded(m.created_at);
    messages.appendChild(renderMessage(m));
    messages.scrollTop = messages.scrollHeight;
    if (m.id > lastSeenMsgId) lastSeenMsgId = m.id;
    renderPdfThumbs();
  }

  async function pollNewMessages(){
    if (!currentConv) return;
    try {
      const data = await api('/api/chat/conversations/' + currentConv + '/messages?after=' + lastSeenMsgId);
      if (data.success && data.messages){
        data.messages.forEach(m => { if (m.id > lastSeenMsgId) appendIfNew(m); });
        if (data.messages.length){ markRead(currentConv, lastSeenMsgId); loadConversations(); }
      }
    } catch(e){}
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function fmt(d){ try { return new Date(d).toLocaleString(); } catch(e){ return ''; } }
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
    const rows = messages.children;
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
    sepRow.className = 'cp-date-sep-row';
    sepRow.dataset.kind = 'date-separator';
    sepRow.dataset.msgDayKey = k;
    const bubble = document.createElement('div');
    bubble.className = 'cp-date-sep';
    bubble.textContent = dayLabel(createdAt);
    sepRow.appendChild(bubble);
    messages.appendChild(sepRow);
  }

  async function api(path, opts){
    try {
      const res = await fetch(path, Object.assign({ credentials:'same-origin', headers:{'content-type':'application/json'} }, opts||{}));
      const text = await res.text();
      try { return JSON.parse(text); } catch(e) { console.error('[chat] non-JSON from', path, res.status, text.slice(0, 200)); return { success: false, error: 'parse_error', status: res.status }; }
    } catch(e) { console.error('[chat] fetch failed', path, e); return { success: false, error: 'network_error' }; }
  }

  function renderBodyWithTags(body, tags){
    let html = escapeHtml(body || '');
    if (!tags || !tags.length) return html;
    const chips = tags.map(t => {
      const name = t.display_name || 'عميل';
      if (t.can_link && t.customer_id) {
        return '<a class="cp-tag-link" href="/admin/customers/' + Number(t.customer_id) + '" target="_blank" rel="noopener">' + escapeHtml(name) + '</a>';
      }
      return '<span class="cp-tag-plain">' + escapeHtml(name) + '</span>';
    }).join('');
    return html + '<div class="cp-msg-tags">' + chips + '</div>';
  }

  async function resolveMessageTagsForViewer(convId, msg){
    if (!msg || !msg.id || !msg.tags || !msg.tags.length) return msg;
    try {
      const after = Math.max(0, msg.id - 1);
      const data = await api('/api/chat/conversations/' + convId + '/messages?after=' + after + '&limit=10');
      if (data.success && data.messages) {
        const found = data.messages.find(x => x.id === msg.id);
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
          const vp = page.getViewport({ scale: 0.45 });
          canvas.width = vp.width;
          canvas.height = vp.height;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        } catch(e) {
          if (canvas.parentElement) canvas.parentElement.innerHTML = '<span style="font-size:22px;opacity:.4">📄</span>';
        }
      }
    } catch(e) {}
  }

  function renderMessage(m){
    const self = m.sender_id === window.CC_USER_ID;
    const key = String(m.id);

    const row = document.createElement('div');
    row.className = 'cp-msg-row';
    row.dataset.kind = 'message';
    row.dataset.msgRowId = key;
    row.dataset.senderId = String(m.sender_id);
    if (m.created_at) row.dataset.created = m.created_at;
    row.dataset.msgDayKey = dayKey(m.created_at || '');

    const div = document.createElement('div');
    div.className = 'cp-msg ' + (self ? 'self' : 'peer');
    div.dataset.msgId = key;

    if (m.deleted_at) {
      div.classList.add('deleted');
      div.innerHTML = '<span><i class="fas fa-ban"></i> تم حذف هذه الرسالة</span><div class="cp-time">' + fmt(m.created_at) + '</div>';
      row.appendChild(div);
      return row;
    }

    let inner = '';
    if (m.reply_preview) {
      const rp = m.reply_preview;
      const rpSelf = rp.sender_id === window.CC_USER_ID;
      const rpAuthor = rpSelf ? 'أنت' : (headerNormal.textContent || '');
      let rpBody = '';
      if (rp.deleted_at) {
        rpBody = '<i style="opacity:.6">تم حذف هذه الرسالة</i>';
      } else if (rp.attachment_json) {
        try { const meta = JSON.parse(rp.attachment_json); rpBody = meta.mime && meta.mime.startsWith('image/') ? '🖼 صورة' : '📄 مستند'; } catch(e) { rpBody = '📎 مرفق'; }
      } else {
        rpBody = escapeHtml((rp.body || '').slice(0, 80));
      }
      inner += '<div class="cp-reply-preview" data-reply-to="' + rp.id + '">'
        + '<div class="cp-reply-preview-author">' + escapeHtml(rpAuthor) + '</div>'
        + '<div class="cp-reply-preview-body">' + rpBody + '</div>'
        + '</div>';
    }
    if (m.is_forwarded) inner += '<div class="cp-fwd-label"><i class="fas fa-share"></i> تم التوجيه</div>';
    if (m.body) inner += renderBodyWithTags(m.body, m.tags);
    if (m.attachment_json){
      try {
        const meta = JSON.parse(m.attachment_json);
        if (meta && meta.name){
          const href = '/api/chat/attachments/' + currentConv + '/' + m.id + '/' + encodeURIComponent(meta.name);
          const dlHref = href + '?dl=1';
          const sep = inner ? '<br/>' : '';
          if (meta.mime && meta.mime.startsWith('image/')) {
            inner += sep + '<div class="cp-att-preview">'
              + '<a href="' + href + '" target="_blank" rel="noopener"><img class="cp-img-thumb" src="' + href + '" loading="lazy" alt="' + escapeHtml(meta.name) + '"></a>'
              + '<div class="cp-att-actions"><a href="' + dlHref + '" download="' + escapeHtml(meta.name) + '">⬇ تحميل</a></div>'
              + '</div>';
          } else if (meta.mime === 'application/pdf') {
            inner += sep + '<div class="cp-att-preview">'
              + '<a class="cp-pdf-box" href="' + href + '" target="_blank" rel="noopener"><canvas data-pdf-url="' + href + '"></canvas></a>'
              + '<div class="cp-att-actions">'
              + '<span style="font-size:11px">📄 ' + escapeHtml(meta.name) + '</span>'
              + '<a href="' + href + '" target="_blank" rel="noopener">فتح</a>'
              + '<a href="' + dlHref + '" download="' + escapeHtml(meta.name) + '">⬇ تحميل</a>'
              + '</div></div>';
          } else {
            inner += sep + '<a href="' + href + '" target="_blank" rel="noopener">📎 ' + escapeHtml(meta.name) + '</a>'
              + ' <a href="' + dlHref + '" download="' + escapeHtml(meta.name) + '" style="font-size:12px">⬇</a>';
          }
        }
      } catch(e){}
    }
    inner += '<div class="cp-time">' + fmt(m.created_at) + '</div>';
    inner += '<button class="cp-msg-menu" title="خيارات"><i class="fas fa-ellipsis-v"></i></button>';
    div.innerHTML = inner;

    const rpEl = div.querySelector('.cp-reply-preview');
    if (rpEl) {
      rpEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetKey = rpEl.getAttribute('data-reply-to');
        const targetRow = messages.querySelector('[data-msg-row-id="' + targetKey + '"]');
        if (targetRow) {
          targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const bubble = targetRow.querySelector('.cp-msg');
          if (bubble) {
            bubble.classList.add('reply-flash');
            setTimeout(() => bubble.classList.remove('reply-flash'), 1100);
          }
        }
      });
    }

    div.querySelector('.cp-msg-menu').addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.cp-msg-dropdown.open').forEach(el => { el.classList.remove('open'); el.remove(); });
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const dd = document.createElement('div');
      dd.className = 'cp-msg-dropdown open';
      dd.innerHTML = '<div class="cp-dd-item" data-action="reply">رد</div><div class="cp-dd-item" data-action="select">تحديد</div>';
      dd.querySelector('[data-action="reply"]').addEventListener('click', () => {
        dd.classList.remove('open'); dd.remove();
        let bodyText = m.body ? m.body.slice(0, 100) : '';
        if (!bodyText && m.attachment_json) {
          try { const meta = JSON.parse(m.attachment_json); bodyText = meta.mime && meta.mime.startsWith('image/') ? '🖼 صورة' : '📄 مستند'; } catch(e) { bodyText = '📎 مرفق'; }
        }
        pendingReply = { id: Number(key), body: bodyText, senderId: m.sender_id };
        const isOwn = m.sender_id === window.CC_USER_ID;
        $('cp-reply-bar-text').textContent = (isOwn ? 'أنت' : headerNormal.textContent) + ': ' + bodyText;
        $('cp-reply-bar').classList.add('active');
        msgInput.focus();
      });
      dd.querySelector('[data-action="select"]').addEventListener('click', () => {
        dd.classList.remove('open'); dd.remove();
        if (!selectMode) enterSelectMode();
        toggleSelectRow(key, row);
      });
      document.body.appendChild(dd);
      const ddW = dd.offsetWidth || 140;
      const left = Math.max(4, Math.min(rect.right - ddW, window.innerWidth - ddW - 4));
      dd.style.top = (rect.bottom + 4) + 'px';
      dd.style.left = left + 'px';
    });

    div.addEventListener('click', () => { if (selectMode) toggleSelectRow(key, row); });
    row.appendChild(div);
    return row;
  }

  document.addEventListener('click', () => {
    document.querySelectorAll('.cp-msg-dropdown.open').forEach(el => { el.classList.remove('open'); el.remove(); });
  });

  async function loadConversations(){
    const data = await api('/api/chat/conversations') || {};
    convList.innerHTML = '';
    const broadcastUnread = data.broadcast_unread_count || 0;
    const bcRow = document.createElement('div');
    bcRow.className = 'cp-conv-row' + (currentBroadcasts ? ' active' : '') + (broadcastUnread > 0 ? ' has-unread' : '');
    bcRow.innerHTML = '<div style="min-width:0;flex:1"><div class="cp-conv-name">📢 إعلانات</div><div class="cp-conv-snippet">رسائل الشركة</div></div>' + (broadcastUnread > 0 ? '<div class="cp-unread">' + broadcastUnread + '</div>' : '');
    bcRow.addEventListener('click', () => openBroadcasts());
    convList.appendChild(bcRow);
    if (!data.success || !data.conversations || !data.conversations.length) return;
    data.conversations.forEach(conv => {
      const isUnread = conv.unread_count > 0 && currentConv !== conv.id;
      const row = document.createElement('div');
      row.className = 'cp-conv-row' + (currentConv === conv.id ? ' active' : '') + (isUnread ? ' has-unread' : '');
      const lm = conv.last_message;
      const snippet = lm ? (lm.deleted_at ? '[محذوفة]' : (lm.body || '[مرفق]')) : '';
      row.innerHTML = '<div style="min-width:0;flex:1"><div class="cp-conv-name">' + escapeHtml(conv.other_user?.name || '') + '</div><div class="cp-conv-snippet">' + escapeHtml(snippet).slice(0,80) + '</div></div>' + (isUnread ? '<div class="cp-unread">' + conv.unread_count + '</div>' : '');
      row.addEventListener('click', () => openConversation(conv.id, conv.other_user));
      convList.appendChild(row);
    });
  }

  async function loadUsers(){
    usersList.innerHTML = '<div style="padding:10px;font-size:12px;color:#64748b">جاري التحميل...</div>';
    usersModal.classList.add('open');
    const data = await api('/api/chat/users');
    usersList.innerHTML = '';
    if (!data.success || !data.users) {
      usersList.innerHTML = '<div style="padding:10px;font-size:12px;color:#ef4444">تعذر التحميل</div>';
      return;
    }
    (data.users||[]).forEach(u => {
      const row = document.createElement('div');
      row.className = 'cp-user-row';
      const lbl = document.createElement('span');
      lbl.textContent = u.name || u.email;
      row.appendChild(lbl);
      row.addEventListener('click', async () => {
        const r = await api('/api/chat/conversations/direct', { method:'POST', body: JSON.stringify({ user_id: u.id }) });
        usersModal.classList.remove('open');
        if (r.success){ await loadConversations(); openConversation(r.conversation_id, u); }
      });
      usersList.appendChild(row);
    });
    if (!data.users.length) {
      usersList.innerHTML = '<div style="padding:10px;font-size:12px;color:#64748b">لا يوجد مستخدمون</div>';
    }
  }
  newBtn.addEventListener('click', loadUsers);

  function connectWs(convId){
    if (ws){ try { ws.close(); } catch(e){} ws = null; }
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    try {
      ws = new WebSocket(proto + '://' + location.host + '/api/chat/ws/' + convId);
      ws.addEventListener('open', () => { wsRetry = 0; });
      ws.addEventListener('message', async (ev) => {
        try {
          const d = JSON.parse(ev.data);
          if (d.type === 'message' && currentConv === convId){
            let msg = d.message;
            msg = await resolveMessageTagsForViewer(convId, msg);
            appendIfNew(msg);
            markRead(convId, msg.id);
            loadConversations();
          } else if (d.type === 'message_deleted' && currentConv === convId) {
            (d.message_ids || []).forEach(id => applyTombstoneToRow(String(id)));
          }
        } catch(e){}
      });
      ws.addEventListener('close', () => {
        if (currentConv === convId){
          wsRetry = Math.min(wsRetry + 1, 6);
          setTimeout(() => { if (currentConv === convId) connectWs(convId); }, 1000 * wsRetry);
        }
      });
    } catch(e){}
  }

  async function markRead(convId, lastId){
    try { await api('/api/chat/conversations/' + convId + '/read', { method:'POST', body: JSON.stringify({ last_read_message_id: lastId }) }); } catch(e){}
  }

  function appendBroadcastMsg(m){
    if (!m || !m.id) return;
    const key = 'bc-' + m.id;
    const existing = messages.querySelector('[data-msg-row-id="' + key + '"]');
    if (existing) {
      if (m.deleted_at) applyTombstoneToRow(key);
      return;
    }
    appendDateSeparatorIfNeeded(m.created_at);
    const self = m.sender_id === ${userId};
    const row = document.createElement('div');
    row.className = 'cp-msg-row';
    row.dataset.kind = 'message';
    row.dataset.msgRowId = key;
    row.dataset.senderId = String(m.sender_id);
    if (m.created_at) row.dataset.created = m.created_at;
    row.dataset.msgDayKey = dayKey(m.created_at || '');

    const div = document.createElement('div');
    div.className = 'cp-msg ' + (self ? 'self' : 'peer');

    if (m.deleted_at) {
      div.classList.add('deleted');
      div.innerHTML = '<span><i class="fas fa-ban"></i> تم حذف هذه الرسالة</span><div class="cp-time">' + fmt(m.created_at) + '</div>';
      row.appendChild(div);
    } else {
      let inner = (m.sender_name ? '<div style="font-size:10px;opacity:.6;margin-bottom:2px">' + escapeHtml(m.sender_name) + '</div>' : '') + escapeHtml(m.body || '') + '<div class="cp-time">' + fmt(m.created_at) + '</div>';
      inner += '<button class="cp-msg-menu" title="خيارات"><i class="fas fa-ellipsis-v"></i></button>';
      div.innerHTML = inner;

      div.querySelector('.cp-msg-menu').addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.cp-msg-dropdown.open').forEach(el => { el.classList.remove('open'); el.remove(); });
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const dd = document.createElement('div');
        dd.className = 'cp-msg-dropdown open';
        dd.innerHTML = '<div class="cp-dd-item" data-action="select">تحديد</div>';
        dd.querySelector('[data-action="select"]').addEventListener('click', () => {
          dd.classList.remove('open'); dd.remove();
          if (!selectMode) enterSelectMode();
          toggleSelectRow(key, row);
        });
        document.body.appendChild(dd);
        const ddW = dd.offsetWidth || 140;
        const left = Math.max(4, Math.min(rect.right - ddW, window.innerWidth - ddW - 4));
        dd.style.top = (rect.bottom + 4) + 'px';
        dd.style.left = left + 'px';
      });
      div.addEventListener('click', () => { if (selectMode) toggleSelectRow(key, row); });

      row.appendChild(div);
    }

    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    if (m.id > lastSeenMsgId) lastSeenMsgId = m.id;
  }

  function setReadOnly(name) {
    const banner = $('cp-readonly-banner');
    if (!banner) return;
    if (name) {
      banner.classList.add('visible');
      const txt = $('cp-readonly-text');
      if (txt) txt.textContent = 'عرض محادثات ' + name + ' (للقراءة فقط)';
    } else {
      banner.classList.remove('visible');
    }
  }

  async function openBroadcasts(){
    currentConv = null;
    currentBroadcasts = true;
    exitSelectMode();
    pendingReply = null;
    setReadOnly(null);
    $('cp-reply-bar').classList.remove('active');
    if (ws){ try { ws.close(); } catch(e){} ws = null; }
    if (threadPoll){ clearInterval(threadPoll); threadPoll = null; }
    empty.style.display = 'none';
    header.style.display = 'flex';
    messages.style.display = 'flex';
    form.style.display = PAGE_ROLE_ID === 2 ? 'flex' : 'none';
    headerNormal.textContent = '📢 إعلانات';
    messages.innerHTML = '';
    lastSeenMsgId = 0;
    const data = await api('/api/chat/broadcasts/messages');
    if (data.success && data.messages){
      data.messages.forEach(m => appendBroadcastMsg(m));
      if (lastSeenMsgId){
        await api('/api/chat/broadcasts/read', { method:'POST', body: JSON.stringify({ last_read_broadcast_id: lastSeenMsgId }) });
        loadConversations();
      }
    }
    // Connect broadcast WS
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
    loadConversations();
  }

  async function openConversation(convId, other){
    currentConv = convId;
    currentBroadcasts = false;
    exitSelectMode();
    pendingReply = null;
    setReadOnly(null);
    $('cp-reply-bar').classList.remove('active');
    empty.style.display = 'none';
    header.style.display = 'flex';
    messages.style.display = 'flex';
    form.style.display = 'flex';
    headerNormal.textContent = (other && other.name) || '';
    messages.innerHTML = '';
    lastSeenMsgId = 0;
    const data = await api('/api/chat/conversations/' + convId + '/messages');
    if (data.success){
      data.messages.forEach(m => appendIfNew(m));
      if (lastSeenMsgId) markRead(convId, lastSeenMsgId).then(() => loadConversations());
    }
    connectWs(convId);
    if (threadPoll) clearInterval(threadPoll);
    threadPoll = setInterval(pollNewMessages, 4000);
    loadConversations();
  }

  // ── @-mention picker ────────────────────────────────────────────────────
  const mentionBox = $('cp-mention-box');
  let mentionState = null;
  const taggedCustomers = new Map();

  const tagTray = $('cp-tag-tray');
  function renderTagTray(){
    if (!taggedCustomers.size){ tagTray.style.display = 'none'; tagTray.innerHTML = ''; return; }
    tagTray.style.display = 'flex';
    tagTray.innerHTML = Array.from(taggedCustomers.entries()).map(([id, name]) =>
      '<span style="display:inline-flex;align-items:center;gap:4px;background:#dbeafe;color:#1e3a8a;border-radius:8px;padding:2px 8px;font-size:12px;font-weight:600;unicode-bidi:isolate;">' + escapeHtml(name) +
      ' <button type="button" data-tag-id="' + Number(id) + '" style="background:none;border:none;color:#1e3a8a;cursor:pointer;font-size:14px;line-height:1;padding:0;">×</button></span>'
    ).join('');
    Array.from(tagTray.querySelectorAll('button[data-tag-id]')).forEach(btn => {
      btn.addEventListener('click', () => {
        taggedCustomers.delete(Number(btn.getAttribute('data-tag-id')));
        renderTagTray();
      });
    });
  }

  function closeMention(){ mentionState = null; mentionBox.classList.remove('open'); mentionBox.innerHTML = ''; }

  function detectMentionTrigger(){
    const v = msgInput.value;
    const caret = msgInput.selectionStart || v.length;
    let i = caret - 1;
    while (i >= 0 && v[i] !== '@' && !/\\s/.test(v[i])) i--;
    if (i < 0 || v[i] !== '@') { closeMention(); return; }
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
      if (!items.length){ mentionBox.classList.remove('open'); mentionBox.innerHTML = '<div class="cp-mention-row" style="color:#94a3b8">لا توجد نتائج</div>'; mentionBox.classList.add('open'); return; }
      mentionBox.innerHTML = items.map((c, idx) =>
        '<div class="cp-mention-row' + (idx === 0 ? ' active' : '') + '" data-idx="' + idx + '">' +
          '<div>' + escapeHtml(c.full_name || '') + '</div>' +
          (c.phone ? '<div class="cp-mention-phone">' + escapeHtml(c.phone) + '</div>' : '') +
        '</div>'
      ).join('');
      mentionBox.classList.add('open');
      Array.from(mentionBox.querySelectorAll('.cp-mention-row')).forEach((row) => {
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
    const newCaret = (before + insert).length;
    msgInput.focus();
    msgInput.setSelectionRange(newCaret, newCaret);
    taggedCustomers.set(c.id, name);
    closeMention();
    renderTagTray();
  }

  msgInput.addEventListener('input', detectMentionTrigger);
  msgInput.addEventListener('keydown', (e) => {
    if (!mentionState || !mentionBox.classList.contains('open') || !mentionState.items.length) return;
    if (e.key === 'ArrowDown'){ e.preventDefault(); mentionState.active = (mentionState.active + 1) % mentionState.items.length; }
    else if (e.key === 'ArrowUp'){ e.preventDefault(); mentionState.active = (mentionState.active - 1 + mentionState.items.length) % mentionState.items.length; }
    else if (e.key === 'Enter' || e.key === 'Tab'){ e.preventDefault(); pickMention(mentionState.active); return; }
    else if (e.key === 'Escape'){ closeMention(); return; }
    else { return; }
    Array.from(mentionBox.querySelectorAll('.cp-mention-row')).forEach((row, i) => row.classList.toggle('active', i === mentionState.active));
  });
  msgInput.addEventListener('blur', () => setTimeout(closeMention, 150));

  function collectActiveTags(){
    return Array.from(taggedCustomers.keys());
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = msgInput.value.trim();
    if (!text) return;
    const customer_ids = collectActiveTags();
    const replyId = pendingReply ? pendingReply.id : null;
    msgInput.value = '';
    closeMention();
    pendingReply = null;
    $('cp-reply-bar').classList.remove('active');
    if (currentBroadcasts) {
      const r = await api('/api/chat/broadcasts/messages', { method:'POST', body: JSON.stringify({ body: text }) });
      if (r.success) appendBroadcastMsg(r.message);
    } else if (currentConv) {
      const payload = { body: text, customer_ids };
      if (replyId) payload.replied_to_message_id = replyId;
      const r = await api('/api/chat/conversations/' + currentConv + '/messages', { method:'POST', body: JSON.stringify(payload) });
      if (r.success){ appendIfNew(r.message); taggedCustomers.clear(); renderTagTray(); }
    }
  });

  attInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!currentConv) { alert('افتح محادثة أولاً لإرسال مرفق'); attInput.value = ''; return; }
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/chat/conversations/' + currentConv + '/attachments', { method:'POST', credentials:'same-origin', body: fd });
      const d = await res.json().catch(()=>({}));
      if (d.success && d.message){ appendIfNew(d.message); }
      else {
        const err = d.error || ('HTTP ' + res.status);
        alert(err === 'too large' ? 'الملف أكبر من 10 ميجابايت' : err === 'mime not allowed' ? 'نوع الملف غير مدعوم' : 'تعذر رفع المرفق');
        console.warn('[chat] attachment upload failed', err);
      }
    } catch (err) {
      console.warn('[chat] attachment upload error', err);
      alert('تعذر رفع المرفق');
    }
    attInput.value = '';
  });

  // ── Role 2: admin drill-down ("Company chats" tab) ──────────────────────
  if (PAGE_ROLE_ID === 2 && ADMIN_DRILLDOWN_ENABLED) {
    const tabMy = $('cp-tab-my');
    const tabCompany = $('cp-tab-company');
    const adminPanel = $('cp-admin-panel');
    const adminUsersList = $('cp-admin-users-list');
    const adminConvListEl = $('cp-admin-conv-list');
    let adminUser = null; // { id, name }

    if (tabMy) tabMy.addEventListener('click', () => {
      if (tabMy) tabMy.classList.add('active');
      if (tabCompany) tabCompany.classList.remove('active');
      convList.style.display = '';
      if (adminPanel) adminPanel.style.display = 'none';
      newBtn.style.display = '';
      setReadOnly(null);
      if (currentConv) { /* keep thread open if it belongs to admin */ }
      loadConversations();
    });

    if (tabCompany) tabCompany.addEventListener('click', () => {
      if (tabCompany) tabCompany.classList.add('active');
      if (tabMy) tabMy.classList.remove('active');
      convList.style.display = 'none';
      if (adminPanel) adminPanel.style.display = 'flex';
      newBtn.style.display = 'none';
      if (!adminUser) loadAdminUsers();
    });

    async function loadAdminUsers() {
      adminUser = null;
      adminUsersList.innerHTML = '<div style="padding:10px;font-size:12px;color:#64748b">جاري التحميل...</div>';
      adminConvListEl.style.display = 'none';
      adminUsersList.style.display = '';
      const data = await api('/api/chat/users');
      adminUsersList.innerHTML = '';
      const list = data.users || [];
      if (!list.length) {
        adminUsersList.innerHTML = '<div style="padding:10px;font-size:12px;color:#64748b">لا يوجد مستخدمون</div>';
        return;
      }
      list.forEach(u => {
        const row = document.createElement('div');
        row.className = 'cp-user-row';
        row.innerHTML = '<span>' + escapeHtml(u.name || u.email) + '</span><span style="margin-inline-start:auto;font-size:11px;color:#94a3b8">←</span>';
        row.addEventListener('click', () => loadAdminConversations(u));
        adminUsersList.appendChild(row);
      });
    }

    async function loadAdminConversations(u) {
      adminUser = u;
      adminConvListEl.innerHTML = '';
      adminConvListEl.style.display = '';
      adminUsersList.style.display = 'none';

      const backBar = document.createElement('div');
      backBar.className = 'cp-admin-back-bar';
      backBar.innerHTML = '<button class="cp-admin-back-btn"><i class="fas fa-arrow-right"></i> ' + escapeHtml(u.name || u.email) + '</button>';
      backBar.querySelector('button').addEventListener('click', () => {
        adminUser = null;
        loadAdminUsers();
      });
      adminConvListEl.appendChild(backBar);

      const loading = document.createElement('div');
      loading.style.cssText = 'padding:10px;font-size:12px;color:#64748b;';
      loading.textContent = 'جاري التحميل...';
      adminConvListEl.appendChild(loading);

      const data = await api('/api/chat/admin/users/' + u.id + '/conversations');
      adminConvListEl.removeChild(loading);

      if (!data.success) {
        const err = document.createElement('div');
        err.style.cssText = 'padding:10px;font-size:12px;color:#ef4444;';
        err.textContent = 'خطأ في التحميل';
        adminConvListEl.appendChild(err);
        return;
      }
      const convs = data.conversations || [];
      if (!convs.length) {
        const emptyEl = document.createElement('div');
        emptyEl.style.cssText = 'padding:10px;font-size:12px;color:#64748b;';
        emptyEl.textContent = 'لا توجد محادثات';
        adminConvListEl.appendChild(emptyEl);
        return;
      }
      convs.forEach(conv => {
        const row = document.createElement('div');
        row.className = 'cp-conv-row';
        const lm = conv.last_message;
        const snippet = lm ? (lm.deleted_at ? '[محذوفة]' : (lm.body || '[مرفق]')) : '';
        row.innerHTML = '<div style="min-width:0;flex:1"><div class="cp-conv-name">' + escapeHtml(conv.other_user?.name || '') + '</div><div class="cp-conv-snippet">' + escapeHtml(snippet).slice(0, 80) + '</div></div>';
        row.addEventListener('click', () => openAdminConversation(conv.id, conv.other_user, u.name || u.email));
        adminConvListEl.appendChild(row);
      });
    }

    function openAdminConversation(convId, otherUser, adminUserName) {
      currentConv = convId;
      currentBroadcasts = false;
      exitSelectMode();
      pendingReply = null;
      $('cp-reply-bar').classList.remove('active');
      if (ws) { try { ws.close(); } catch(e){} ws = null; }
      if (threadPoll) { clearInterval(threadPoll); threadPoll = null; }
      empty.style.display = 'none';
      header.style.display = 'flex';
      messages.style.display = 'flex';
      form.style.display = 'none'; // read-only — admin does not send
      headerNormal.textContent = (otherUser && otherUser.name) || '';
      messages.innerHTML = '';
      lastSeenMsgId = 0;
      setReadOnly(adminUserName);
      api('/api/chat/conversations/' + convId + '/messages').then(data => {
        if (data.success) data.messages.forEach(m => appendIfNew(m));
      });
      connectWs(convId);
      threadPoll = setInterval(() => {
        if (!currentConv) return;
        api('/api/chat/conversations/' + currentConv + '/messages?after=' + lastSeenMsgId)
          .then(data => { if (data.success && data.messages) data.messages.forEach(m => { if (m.id > lastSeenMsgId) appendIfNew(m); }); })
          .catch(() => {});
      }, 4000);
    }
  }

  loadConversations();

  // Persistent notification WS
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
  connectNotifyWs();

  setInterval(loadConversations, 10000);
})();
</script>
</body>
</html>`
}
