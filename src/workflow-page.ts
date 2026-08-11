// ============================================
// Workflow Timeline Page - صفحة مراحل سير العمل - v2
// ============================================

import { canAddWorkflowNote } from './notification-access'

const ACTION_TYPE_LABELS: Record<string, string> = {
  call: 'اتصال هاتفي',
  email: 'بريد إلكتروني',
  meeting: 'اجتماع',
  document: 'مستند',
  approval: 'موافقة',
  rejection: 'رفض',
  followup: 'متابعة',
  other: 'أخرى',
}

const PRE_WORKFLOW_STAGE_NAME = 'pre_workflow'
const PRE_WORKFLOW_STAGE_LABEL = 'قبل سير العمل'

function getActionTypeLabel(actionType?: string) {
  return ACTION_TYPE_LABELS[actionType || ''] || actionType || 'إجراء'
}

function sortNotesChronologically(notes: any[]): any[] {
  return [...notes].sort((a, b) => {
    const ta = parseStoredDateTime(a.created_at)?.getTime() ?? 0
    const tb = parseStoredDateTime(b.created_at)?.getTime() ?? 0
    return ta - tb
  })
}

function renderPhaseNoteRow(note: any): string {
  const noteText = String(note.note_text || '').trim()
  const performer = String(note.performed_by_name || '').trim() || '—'
  const when = formatKsaDateTime(note.created_at)
  const isAds = note.source === 'ads'
  return `
    <div class="phase-note-item${isAds ? ' phase-note-item--ads' : ''}">
      <div class="phase-note-meta">
        <span class="phase-note-author"><i class="fas fa-user ml-1"></i>${escapeHtml(performer)}</span>
        <span class="phase-note-time"><i class="fas fa-clock ml-1"></i>${escapeHtml(when)}</span>
        ${isAds ? `<span class="ads-note-badge"><i class="fas fa-bullhorn ml-1"></i>إعلانات</span>` : ''}
      </div>
      <div class="phase-note-text">${escapeHtml(noteText || '—')}</div>
    </div>
  `
}

function renderPhaseNotesBlock(
  stageNotes: any[],
  isCurrentPhase: boolean,
  collapseId: string
): string {
  if (stageNotes.length === 0) return ''
  const expanded = isCurrentPhase
  const sorted = sortNotesChronologically(stageNotes)
  return `
    <div class="stage-subsection phase-notes-block">
      <button type="button" class="phase-notes-toggle${expanded ? ' expanded' : ''}" data-notes-target="${escapeHtml(collapseId)}" aria-expanded="${expanded ? 'true' : 'false'}">
        <span class="phase-notes-toggle-label"><i class="fas fa-sticky-note ml-1 text-amber-600"></i>ملاحظات <span class="phase-notes-count">(${sorted.length})</span></span>
        <i class="fas fa-chevron-down phase-notes-chevron"></i>
      </button>
      <div id="${escapeHtml(collapseId)}" class="phase-notes-list${expanded ? '' : ' collapsed'}">
        ${sorted.map(renderPhaseNoteRow).join('')}
      </div>
    </div>
  `
}

/** Inline script helper: surface API failures instead of a generic network message. */
function workflowFetchErrorAlertScript(): string {
  return `
    async function wfAlertFetchFailure(resp, fallback) {
      let msg = fallback || 'فشلت العملية';
      try {
        const d = await resp.json();
        if (d && d.error) msg = String(d.error);
      } catch (_) {}
      alert(msg);
    }
`
}

function escapeHtml(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function encodeActionPayload(payload: { type: string; note: string; performer: string }): string {
  return escapeHtml(JSON.stringify(payload))
}

function normalizeRoleId(roleId: unknown): number | null {
  const n = typeof roleId === 'number' ? roleId : parseInt(String(roleId ?? ''), 10)
  if (Number.isNaN(n)) return null
  const legacyMap: Record<number, number> = { 11: 1, 12: 2, 13: 3, 14: 4, 15: 5 }
  return legacyMap[n] ?? n
}

/** D1/SQLite timestamps are UTC; strings without offset must not be treated as local time. */
function parseStoredDateTime(value: string | null | undefined): Date | null {
  if (value == null || value === '') return null
  const s = String(value).trim()
  if (!s) return null
  if (/Z$|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s)
  const iso = s.includes('T') ? s : s.replace(' ', 'T')
  const d = new Date(iso + 'Z')
  return Number.isNaN(d.getTime()) ? null : d
}

const KSA_TZ = 'Asia/Riyadh'

function formatKsaDateTime(value: string | null | undefined): string {
  const d = parseStoredDateTime(value)
  if (!d) return '—'
  return d.toLocaleString('ar-SA', {
    timeZone: KSA_TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatKsaDate(value: string | null | undefined): string {
  const d = parseStoredDateTime(value)
  if (!d) return '—'
  return d.toLocaleDateString('ar-SA', {
    timeZone: KSA_TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function calculateDuration(startDate: string, endDate: string): string {
  const start = parseStoredDateTime(startDate)
  const end = parseStoredDateTime(endDate)
  if (!start || !end) return ''
  const diff = end.getTime() - start.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} يوم`
  return `${hours} ساعة`
}

/** Actions/tasks belong to the transition period they were created in, not every row with the same stage id. */
function itemBelongsToTransition(
  item: any,
  transition: any,
  transitions: any[],
  index: number,
  stageIdKey: 'customer_stage_id' | 'stage_id'
): boolean {
  const itemStageId = item[stageIdKey] ?? item.stage_id
  if (itemStageId !== transition.to_stage_id) return false
  if (transition.is_pre_workflow) return true
  const itemTime = parseStoredDateTime(item.created_at)?.getTime()
  const transTime = parseStoredDateTime(transition.created_at)?.getTime()
  if (itemTime == null || transTime == null) {
    return index === transitions.length - 1
  }
  const nextTrans = transitions[index + 1]
  const nextTime = nextTrans ? parseStoredDateTime(nextTrans.created_at)?.getTime() : null
  const upperBound = nextTime ?? Number.POSITIVE_INFINITY
  return itemTime >= transTime && itemTime < upperBound
}

function getEarliestItemCreatedAt(items: any[]): string | null {
  let earliest: { value: string; time: number } | null = null
  for (const item of items) {
    const value = item?.created_at
    const time = parseStoredDateTime(value)?.getTime()
    if (time == null) continue
    if (!earliest || time < earliest.time) earliest = { value, time }
  }
  return earliest?.value ?? null
}

function buildTimelineTransitions(
  transitions: any[],
  actions: any[],
  notes: any[],
  tasks: any[],
  stages: any[],
  stageIdKey: 'customer_stage_id' | 'stage_id'
): any[] {
  const preWorkflowStage = stages.find((stage: any) => stage.stage_name === PRE_WORKFLOW_STAGE_NAME)
  if (!preWorkflowStage?.id) return transitions

  const preWorkflowStageId = preWorkflowStage.id
  const preWorkflowItems = [...actions, ...notes, ...tasks].filter((item: any) => {
    const itemStageId = item[stageIdKey] ?? item.stage_id
    return itemStageId === preWorkflowStageId
  })
  if (preWorkflowItems.length === 0) return transitions

  return [
    {
      id: 'pre-workflow',
      to_stage_id: preWorkflowStageId,
      to_stage_name: preWorkflowStage.stage_name_ar || PRE_WORKFLOW_STAGE_LABEL,
      to_stage_name_ar: preWorkflowStage.stage_name_ar || PRE_WORKFLOW_STAGE_LABEL,
      to_stage_color: preWorkflowStage.stage_color || '#94A3B8',
      to_stage_icon: preWorkflowStage.stage_icon || 'fa-hourglass-start',
      created_at: getEarliestItemCreatedAt(preWorkflowItems),
      is_pre_workflow: true,
    },
    ...transitions,
  ]
}

const sharedStyles = `
  .timeline-container {
    position: relative;
    padding-right: 1.25rem;
  }
  .timeline-line {
    position: absolute;
    right: 0.5rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, #10B981 0%, #3B82F6 50%, #8B5CF6 100%);
  }
  .timeline-item {
    position: relative;
    margin-bottom: 0.375rem;
    padding-right: 1.75rem;
  }
  .timeline-dot {
    position: absolute;
    right: -0.25rem;
    top: 0.35rem;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.55rem;
    box-shadow: 0 0 0 2px white, 0 0 0 3px currentColor;
    z-index: 10;
  }
  .timeline-dot.current {
    animation: pulse 2s infinite;
    box-shadow: 0 0 0 2px white, 0 0 0 3px currentColor, 0 0 10px currentColor;
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }
  .stage-card {
    background: white;
    border-radius: 0.5rem;
    padding: 0.5rem 0.625rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    border-right: 3px solid;
    transition: box-shadow 0.2s;
  }
  .stage-card:hover { box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08); }
  .stage-card-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem 0.75rem;
    margin-bottom: 0.25rem;
  }
  .stage-card-title { font-size: 0.875rem; font-weight: 700; color: #1f2937; line-height: 1.25; }
  .stage-card-meta { font-size: 0.7rem; color: #6b7280; line-height: 1.2; }
  .stage-duration-badge { font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 0.25rem; }
  .stage-inline-note { font-size: 0.7rem; padding: 0.25rem 0.4rem; margin-bottom: 0.25rem; border-right-width: 2px; }
  .stage-subsection { margin-top: 0.25rem; }
  .stage-subsection-title { font-size: 0.65rem; font-weight: 700; color: #4b5563; margin-bottom: 0.15rem; }
  .action-badges-row { display: flex; flex-wrap: wrap; gap: 0.2rem; }
  .action-chip-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.45rem;
    border-radius: 0.25rem;
    font-size: 0.65rem;
    line-height: 1.2;
    margin: 0;
    border: 1px solid #86efac;
    background: #f0fdf4;
    color: #15803d;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }
  .action-chip-btn:hover { background: #dcfce7; border-color: #4ade80; }
  .phase-notes-block { margin-top: 0.35rem; }
  .phase-notes-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 0.5rem;
    padding: 0.2rem 0.35rem;
    margin-bottom: 0.2rem;
    border: none;
    background: transparent;
    font-size: 0.65rem;
    font-weight: 700;
    color: #4b5563;
    cursor: pointer;
    border-radius: 0.25rem;
    transition: background 0.15s;
  }
  .phase-notes-toggle:hover { background: #fffbeb; }
  .phase-notes-toggle-label { display: inline-flex; align-items: center; gap: 0.2rem; }
  .phase-notes-count { font-weight: 600; color: #92400e; }
  .phase-notes-chevron { font-size: 0.55rem; color: #b45309; transition: transform 0.2s; }
  .phase-notes-toggle.expanded .phase-notes-chevron { transform: rotate(180deg); }
  .phase-notes-list { display: flex; flex-direction: column; gap: 0.35rem; }
  .phase-notes-list.collapsed { display: none; }
  .phase-note-item {
    padding: 0.4rem 0.5rem;
    border-radius: 0.35rem;
    border: 1px dashed #fcd34d;
    background: #fffbeb;
    border-right: 3px solid #f59e0b;
  }
  .phase-note-item--ads {
    background: #eff6ff;
    border-color: #93c5fd;
    border-right-color: #3b82f6;
  }
  .ads-note-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.6rem;
    font-weight: 700;
    padding: 0.1rem 0.45rem;
    border-radius: 9999px;
    background: #dbeafe;
    color: #1d4ed8;
    border: 1px solid #93c5fd;
    letter-spacing: 0.01em;
  }
  .phase-note-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem 0.75rem;
    margin-bottom: 0.25rem;
    font-size: 0.65rem;
    color: #78716c;
  }
  .phase-note-author { font-weight: 600; color: #92400e; }
  .phase-note-item--ads .phase-note-author { color: #1d4ed8; }
  .phase-note-time { color: #6b7280; }
  .phase-note-text {
    font-size: 0.75rem;
    color: #1f2937;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .action-detail-body { font-size: 0.875rem; color: #374151; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
  .task-item {
    background: #F9FAFB;
    padding: 0.25rem 0.4rem;
    border-radius: 0.25rem;
    margin-bottom: 0.2rem;
    border-right: 2px solid;
    font-size: 0.7rem;
    line-height: 1.25;
  }
  .task-item:last-child { margin-bottom: 0; }
  .task-item.pending { border-right-color: #F59E0B; }
  .task-item.completed { border-right-color: #10B981; opacity: 0.7; }
  .wf-tabs { display: flex; border-bottom: 2px solid #e5e7eb; margin-bottom: 1.25rem; gap: 0.5rem; }
  .wf-tab-btn {
    padding: 0.5rem 1.25rem;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 0.5rem 0.5rem 0 0;
    border: 2px solid transparent;
    border-bottom: none;
    cursor: pointer;
    background: #f3f4f6;
    color: #6b7280;
    transition: all 0.15s;
    position: relative;
    bottom: -2px;
  }
  .wf-tab-btn.active { background: white; color: #1d4ed8; border-color: #e5e7eb; border-bottom-color: white; }
  .wf-tab-panel { display: none; }
  .wf-tab-panel.active { display: block; }
  @media print { .no-print { display: none !important; }     }
`

const workflowNotesToggleScript = `
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.phase-notes-toggle');
      if (!btn) return;
      e.preventDefault();
      const id = btn.getAttribute('data-notes-target');
      if (!id) return;
      const panel = document.getElementById(id);
      if (!panel) return;
      panel.classList.toggle('collapsed');
      const open = !panel.classList.contains('collapsed');
      btn.classList.toggle('expanded', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
`

/** Tab from URL hash on refresh; otherwise server default for this route (request vs customer module). */
function getWorkflowTabPersistenceScript(defaultTab: 'customer' | 'request'): string {
  return `
    const wfServerDefault = '${defaultTab}';
    function wfRouteDefaultTab() {
      const p = location.pathname || '';
      if (/\\/admin\\/customers\\/\\d+\\/workflow$/.test(p)) return 'customer';
      if (/\\/admin\\/requests\\/\\d+\\/workflow$/.test(p)) return 'request';
      return wfServerDefault;
    }
    function wfGetHashTab() {
      const hash = (location.hash || '').replace(/^#/, '');
      if (hash === 'request' || hash === 'request-add-note') return 'request';
      if (hash === 'customer' || hash === 'customer-add-note') return 'customer';
      return null;
    }
    function wfPendingAddNoteTab() {
      const hash = (location.hash || '').replace(/^#/, '');
      if (hash === 'customer-add-note') return 'customer';
      if (hash === 'request-add-note') return 'request';
      return null;
    }
    function wfPersistTab(tab) {
      history.replaceState(null, '', location.pathname + location.search + '#' + tab);
    }
    function wfApplyTab(tab) {
      document.querySelectorAll('.wf-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.wf-tab-panel').forEach(p => p.classList.remove('active'));
      const btn = [...document.querySelectorAll('.wf-tab-btn')].find(b => (b.getAttribute('onclick') || '').includes("switchTab('" + tab + "')"));
      if (btn) btn.classList.add('active');
      const panel = document.getElementById('tab-' + tab);
      if (panel) panel.classList.add('active');
    }
    function switchTab(tab) {
      if (tab !== 'request' && tab !== 'customer') return;
      wfApplyTab(tab);
      wfPersistTab(tab);
    }
    (function wfRestoreTabOnLoad() {
      const pendingNote = wfPendingAddNoteTab();
      const tab = wfGetHashTab() || wfRouteDefaultTab();
      wfApplyTab(tab);
      wfPersistTab(tab);
      if (pendingNote) {
        const open = function () {
          if (pendingNote === 'customer' && typeof addCustomerNote === 'function') addCustomerNote();
          else if (pendingNote === 'request' && typeof addRequestNote === 'function') addRequestNote();
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', open);
        else setTimeout(open, 0);
      }
    })();
`
}

const workflowModalSubmitGuardScript = `
    let wfModalSubmitting = false;
    function wfLockModalSubmit(btn, busyLabel) {
      if (wfModalSubmitting) return false;
      wfModalSubmitting = true;
      const modal = document.body.querySelector('.wf-modal');
      if (modal) {
        modal.querySelectorAll('button, select, textarea, input').forEach(el => { el.disabled = true; });
      }
      if (btn) {
        btn.dataset.wfOrigHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin ml-1"></i> ' + (busyLabel || 'جاري...');
      }
      return true;
    }
    function wfUnlockModalSubmit() {
      wfModalSubmitting = false;
      const modal = document.body.querySelector('.wf-modal');
      if (!modal) return;
      modal.querySelectorAll('button, select, textarea, input').forEach(el => { el.disabled = false; });
      const submitBtn = modal.querySelector('[data-wf-orig-html]');
      if (submitBtn) {
        submitBtn.innerHTML = submitBtn.dataset.wfOrigHtml;
        delete submitBtn.dataset.wfOrigHtml;
      }
    }
`

function renderTimelineSection(
  transitions: any[],
  actions: any[],
  notes: any[],
  tasks: any[],
  stages: any[],
  context: { stageId: number | null; canUpdateStage: boolean; canAddAction: boolean },
  mode: 'customer' | 'request',
  id: number,
  stageIdKey: 'customer_stage_id' | 'stage_id' = 'stage_id'
): string {
  const timelineTransitions = buildTimelineTransitions(transitions, actions, notes, tasks, stages, stageIdKey)
  const realIndexOffset = timelineTransitions[0]?.is_pre_workflow ? 1 : 0

  return `
    <div class="timeline-container">
      <div class="timeline-line"></div>
      ${timelineTransitions.length === 0 ? `
        <div class="text-center py-6 text-gray-500">
          <i class="fas fa-inbox fa-2x mb-2 text-gray-300"></i>
          <p class="text-sm">لم يتم تسجيل أي مراحل بعد</p>
        </div>
      ` : ''}
      ${timelineTransitions.map((transition: any, index: number) => {
        const isLast = index === timelineTransitions.length - 1
        const isPreWorkflow = !!transition.is_pre_workflow
        const phaseNumber = isPreWorkflow ? 0 : index + 1 - realIndexOffset
        const duration = !isPreWorkflow && index > realIndexOffset ? calculateDuration(timelineTransitions[index - 1].created_at, transition.created_at) : null
        const stageActions = actions.filter((a: any) => itemBelongsToTransition(a, transition, timelineTransitions, index, stageIdKey))
        const stageNotes = notes.filter((n: any) => itemBelongsToTransition(n, transition, timelineTransitions, index, stageIdKey))
        const stageTasks = tasks.filter((t: any) => itemBelongsToTransition(t, transition, timelineTransitions, index, stageIdKey))
        return `
          <div class="timeline-item">
            <div class="timeline-dot ${isLast ? 'current' : ''}" style="background-color: ${transition.to_stage_color || '#3B82F6'}">
              <i class="fas ${transition.to_stage_icon || 'fa-circle'}"></i>
            </div>
            <div class="stage-card" style="border-right-color: ${transition.to_stage_color || '#3B82F6'}">
              <div class="stage-card-header">
                <h3 class="stage-card-title">${phaseNumber}. ${transition.to_stage_name || transition.to_stage_name_ar || ''}</h3>
                <span class="stage-card-meta">
                  <i class="fas fa-clock ml-1"></i>
                  ${formatKsaDateTime(transition.created_at)}
                </span>
                ${transition.transitioned_by_name ? `<span class="stage-card-meta"><i class="fas fa-user ml-1"></i>${transition.transitioned_by_name}</span>` : ''}
                ${duration ? `<span class="stage-duration-badge bg-blue-50 text-blue-700 font-medium"><i class="fas fa-hourglass-half ml-1"></i>${duration}</span>` : ''}
              </div>
              ${transition.notes ? `<div class="stage-inline-note bg-yellow-50 border-yellow-400 text-gray-700 rounded"><i class="fas fa-sticky-note ml-1 text-yellow-600"></i>${escapeHtml(transition.notes)}</div>` : ''}
              ${stageActions.length > 0 ? `
                <div class="stage-subsection">
                  <div class="stage-subsection-title"><i class="fas fa-tasks ml-1"></i>إجراءات</div>
                  <div class="action-badges-row">
                  ${stageActions.map((action: any) => {
                    const typeLabel = getActionTypeLabel(action.action_type)
                    const noteText = String(action.notes || '').trim()
                    const performer = String(action.performed_by_name || '').trim()
                    return `<button type="button" class="action-chip-btn" data-action-payload="${encodeActionPayload({ type: typeLabel, note: noteText, performer })}" title="عرض تفاصيل الإجراء"><i class="fas fa-circle-info text-[0.55rem] opacity-70"></i>${escapeHtml(typeLabel)}</button>`
                  }).join('')}
                  </div>
                </div>
              ` : ''}
              ${renderPhaseNotesBlock(stageNotes, isLast, `wf-notes-${mode}-${id}-t${index}`)}
              ${stageTasks.length > 0 ? `
                <div class="stage-subsection">
                  <div class="stage-subsection-title"><i class="fas fa-list-check ml-1"></i>مهام</div>
                  ${stageTasks.map((task: any) => `
                    <div class="task-item ${task.status} flex justify-between items-center gap-2">
                      <span class="text-gray-800 font-medium truncate">${escapeHtml(task.task_title)}${task.assigned_to_name ? ` <span class="text-gray-500 font-normal">· ${escapeHtml(task.assigned_to_name)}</span>` : ''}</span>
                      <span class="shrink-0 ${task.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}">
                        ${task.status === 'completed' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-clock"></i>'}
                      </span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `
      }).join('')}
    </div>
  `
}

// ─── Customer Workflow Page (tabbed) ─────────────────────────────────────────

export function generateCustomerWorkflowPage(opts: {
  customerId: number
  customer: any
  stages: any[]
  customerTimeline: { transitions: any[]; actions: any[]; notes: any[]; tasks: any[] }
  requestId?: number | null
  request?: any
  requestTimeline?: { transitions: any[]; actions: any[]; notes: any[]; tasks: any[] }
  roleId?: number | null
  userId?: number | null
  activeTab?: 'customer' | 'request'
}) {
  const { customerId, customer, stages, customerTimeline, requestId, request, requestTimeline, roleId, userId } = opts
  const activeTab = opts.activeTab ?? 'customer'

  const normalizedRoleId = normalizeRoleId(roleId)
  const canUpdateStage = normalizedRoleId !== 4
  const canAddAction = normalizedRoleId !== 5
  const canAddNote = canAddWorkflowNote(roleId)

  const hasRequest = !!requestId && !!request

  const customerTransitions = customerTimeline.transitions ?? []
  const customerActions = customerTimeline.actions ?? []
  const customerNotes = customerTimeline.notes ?? []
  const customerTasks = customerTimeline.tasks ?? []

  const requestTransitions = requestTimeline?.transitions ?? []
  const requestActions = requestTimeline?.actions ?? []
  const requestNotes = requestTimeline?.notes ?? []
  const requestTasks = requestTimeline?.tasks ?? []

  const currentCustomerStageId = customer?.current_workflow_stage_id ?? null
  const currentRequestStageId = request?.current_stage_id ?? null

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>سير العمل - ${escapeHtml(customer?.full_name || customer?.name || customerId)}</title>
  <link rel="stylesheet" href="/tailwind.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>${sharedStyles}</style>
</head>
<body class="bg-gray-50">

  <!-- Header -->
  <div class="bg-gradient-to-l from-blue-600 to-purple-600 text-white py-6 no-print">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold mb-2">
            <i class="fas fa-route ml-2"></i>
            سير العمل
          </h1>
          <p class="text-blue-100">العميل: ${escapeHtml(customer?.full_name || customer?.name || String(customerId))}${hasRequest ? ` | الطلب رقم: ${requestId}` : ''}</p>
        </div>
        <div class="flex gap-2">
          <button onclick="window.print()" class="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
            <i class="fas fa-print ml-2"></i>
            طباعة
          </button>
          <a href="/admin/customers/${customerId}" class="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
            <i class="fas fa-user ml-2"></i>
            ملف العميل
          </a>
          <a href="/admin/customers" class="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
            <i class="fas fa-arrow-right ml-2"></i>
            العملاء
          </a>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-6xl mx-auto px-4 py-6">

    <!-- Tabs -->
    <div class="wf-tabs no-print">
      <button class="wf-tab-btn ${activeTab === 'customer' ? 'active' : ''}" onclick="switchTab('customer')">
        <i class="fas fa-user ml-1"></i> سير العمل (العميل)
      </button>
      ${hasRequest ? `
      <button class="wf-tab-btn ${activeTab === 'request' ? 'active' : ''}" onclick="switchTab('request')">
        <i class="fas fa-file-invoice ml-1"></i> سير العمل (الطلب #${requestId})
      </button>
      ` : ''}
    </div>

    <!-- ── Tab 1: Customer Workflow ── -->
    <div id="tab-customer" class="wf-tab-panel ${activeTab === 'customer' ? 'active' : ''}">
      <div class="bg-white rounded-xl shadow-md p-4 mb-4">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-bold text-gray-800">
            <i class="fas fa-timeline ml-2 text-blue-600"></i>
            المسار الزمني - العميل
          </h2>
          <div class="text-sm text-gray-500">
            ${currentCustomerStageId ? `المرحلة الحالية: <strong>${stages.find(s => s.id === currentCustomerStageId)?.stage_name_ar || '—'}</strong>` : 'لا توجد مرحلة محددة'}
          </div>
        </div>
        ${renderTimelineSection(customerTransitions, customerActions, customerNotes, customerTasks, stages, { stageId: currentCustomerStageId, canUpdateStage, canAddAction }, 'customer', customerId)}
      </div>

      <!-- Action buttons - customer -->
      <div class="mt-4 flex gap-3 no-print">
        ${canAddNote ? `
        <button onclick="addCustomerNote()" class="flex-1 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors">
          <i class="fas fa-sticky-note ml-2"></i>
          إضافة ملاحظة
        </button>
        ` : ''}
        ${canUpdateStage ? `
        <button onclick="updateCustomerStage()" class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          <i class="fas fa-arrow-left ml-2"></i>
          تحديث المرحلة
        </button>
        ` : ''}
        ${canAddAction ? `
        <button onclick="addCustomerAction()" class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
          <i class="fas fa-plus ml-2"></i>
          إضافة إجراء
        </button>
        ` : ''}
        <button onclick="createCustomerTask()" class="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
          <i class="fas fa-tasks ml-2"></i>
          إنشاء مهمة
        </button>
      </div>
    </div>

    <!-- ── Tab 2: Request Workflow ── -->
    ${hasRequest ? `
    <div id="tab-request" class="wf-tab-panel ${activeTab === 'request' ? 'active' : ''}">
      <!-- Request summary -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div class="text-gray-500 text-sm mb-1">المبلغ المطلوب</div>
            <div class="text-2xl font-bold text-blue-600">${Number(request.requested_amount || 0).toLocaleString()} ريال</div>
          </div>
          <div>
            <div class="text-gray-500 text-sm mb-1">المرحلة الحالية</div>
            <div class="text-lg font-bold" style="color: ${request.stage_color || '#3B82F6'}">
              <i class="fas ${request.stage_icon || 'fa-circle'} ml-2"></i>
              ${escapeHtml(request.stage_name_ar || 'غير محدد')}
            </div>
          </div>
          <div>
            <div class="text-gray-500 text-sm mb-1">الحالة</div>
            <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'}">
              ${request.status === 'pending' ? 'قيد الانتظار' :
                request.status === 'approved' ? 'موافق عليه' :
                request.status === 'rejected' ? 'مرفوض' :
                escapeHtml(request.status || '—')}
            </div>
          </div>
          <div>
            <div class="text-gray-500 text-sm mb-1">تاريخ الطلب</div>
            <div class="text-lg font-bold text-gray-700">
              ${request.created_at ? formatKsaDate(request.created_at) : '—'}
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-md p-4 mb-4">
        <h2 class="text-lg font-bold text-gray-800 mb-3">
          <i class="fas fa-timeline ml-2 text-blue-600"></i>
          المسار الزمني للطلب
        </h2>
        ${renderTimelineSection(requestTransitions, requestActions, requestNotes, requestTasks, stages, { stageId: currentRequestStageId, canUpdateStage, canAddAction }, 'request', requestId!)}
      </div>

      <!-- Action buttons - request -->
      <div class="mt-4 flex gap-3 no-print">
        ${canAddNote ? `
        <button onclick="addRequestNote()" class="flex-1 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors">
          <i class="fas fa-sticky-note ml-2"></i>
          إضافة ملاحظة
        </button>
        ` : ''}
        ${canUpdateStage ? `
        <button onclick="updateRequestStage()" class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          <i class="fas fa-arrow-left ml-2"></i>
          تحديث المرحلة
        </button>
        ` : ''}
        ${canAddAction ? `
        <button onclick="addRequestAction()" class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
          <i class="fas fa-plus ml-2"></i>
          إضافة إجراء
        </button>
        ` : ''}
        <button onclick="createRequestTask()" class="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
          <i class="fas fa-tasks ml-2"></i>
          إنشاء مهمة
        </button>
        ${(roleId === 5 || roleId === 2 || (roleId === 6 && request?.assigned_bank_agent_id != null && request.assigned_bank_agent_id === userId)) ? `
        <button onclick="completeRequest()" id="completeBtn" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg transition-colors font-bold">
          <i class="fas fa-check-double ml-2"></i>
          إتمام الإفراغ
        </button>
        ` : ''}
      </div>
    </div>
    ` : ''}

  </div>

  <script>
    const stages = ${JSON.stringify(stages)};
    const currentCustomerId = ${customerId};
    const currentRequestId = ${requestId ?? 'null'};
    const currentCustomerStageId = ${currentCustomerStageId ?? 'null'};
    const currentRequestStageId = ${currentRequestStageId ?? 'null'};
    const canUpdateStage = ${canUpdateStage};
    const canAddAction = ${canAddAction};
    const canAddNote = ${canAddNote};

    ${getWorkflowTabPersistenceScript(activeTab)}
    ${workflowModalSubmitGuardScript}
    ${workflowFetchErrorAlertScript()}
    ${workflowNotesToggleScript}

    function closeModal() {
      const modal = document.body.querySelector('.wf-modal');
      if (modal) modal.remove();
      wfModalSubmitting = false;
    }

    function showActionDetail(typeLabel, note, performer) {
      closeModal();
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
      const noteHtml = (note && String(note).trim())
        ? String(note).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        : '<span class="text-gray-400">لا توجد ملاحظات</span>';
      const performerHtml = (performer && String(performer).trim())
        ? '<p class="text-xs text-gray-500 mt-3"><i class="fas fa-user ml-1"></i>' + String(performer).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>'
        : '';
      modal.innerHTML =
        '<div class="bg-white rounded-xl p-5 max-w-md w-full mx-4 shadow-xl">' +
          '<div class="flex justify-between items-start gap-3 mb-3">' +
            '<h3 class="text-lg font-bold text-gray-800">' + String(typeLabel).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</h3>' +
            '<button type="button" onclick="closeModal()" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>' +
          '</div>' +
          '<div class="action-detail-body">' + noteHtml + '</div>' +
          performerHtml +
          '<div class="mt-4 flex justify-end"><button type="button" onclick="closeModal()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium">إغلاق</button></div>' +
        '</div>';
      document.body.appendChild(modal);
    }

    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.action-chip-btn');
      if (!btn) return;
      const raw = btn.getAttribute('data-action-payload');
      if (!raw) return;
      e.preventDefault();
      try {
        const d = JSON.parse(raw);
        showActionDetail(d.type || '', d.note || '', d.performer || '');
      } catch(err) { console.error('action payload parse failed', err); }
    });

    function stageSelectHtml(currentId) {
      return stages
        .filter(s => s.stage_name !== 'pre_workflow')
        .map(s => '<option value="' + s.id + '"' + (s.id === currentId ? ' selected' : '') + '>' + s.stage_name_ar + '</option>')
        .join('');
    }

    function actionTypeSelectHtml() {
      return ['call:اتصال هاتفي','email:بريد إلكتروني','meeting:اجتماع','document:مستند','approval:موافقة','rejection:رفض','followup:متابعة','other:أخرى']
        .map(x => { const [v,l] = x.split(':'); return '<option value="' + v + '">' + l + '</option>'; }).join('');
    }

    function addCustomerNote() {
      if (!canAddNote) return;
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold mb-4"><i class="fas fa-sticky-note text-amber-500 ml-2"></i>إضافة ملاحظة للعميل</h3>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">نص الملاحظة</label>' +
        '<textarea id="custPhaseNoteText" placeholder="اكتب ملاحظتك على المرحلة الحالية..." class="w-full border rounded-lg p-2" rows="5"></textarea></div>' +
        '<div class="flex gap-2">' +
        '<button type="button" onclick="confirmAddCustomerNote(this)" class="flex-1 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed">إضافة</button>' +
        '<button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>' +
        '</div></div>';
      document.body.appendChild(modal);
    }

    async function confirmAddCustomerNote(btn) {
      if (!canAddNote) return;
      const text = (document.getElementById('custPhaseNoteText')?.value || '').trim();
      if (!text) { alert('الرجاء إدخال نص الملاحظة'); return; }
      if (!wfLockModalSubmit(btn, 'جاري الإضافة...')) return;
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const resp = await fetch('/api/workflow/customer-add-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: currentCustomerId, stageId: currentCustomerStageId, noteText: text, performedBy: userData.id })
        });
        if (resp.ok) { closeModal(); location.reload(); }
        else { await wfAlertFetchFailure(resp, 'فشل إضافة الملاحظة'); wfUnlockModalSubmit(); }
      } catch (err) {
        console.error('add customer note failed', err);
        alert('تعذر الاتصال بالخادم — تأكد أن npm run dev يعمل');
        wfUnlockModalSubmit();
      }
    }

    function addRequestNote() {
      if (!canAddNote) return;
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold mb-4"><i class="fas fa-sticky-note text-amber-500 ml-2"></i>إضافة ملاحظة للطلب</h3>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">نص الملاحظة</label>' +
        '<textarea id="reqPhaseNoteText" placeholder="اكتب ملاحظتك على المرحلة الحالية..." class="w-full border rounded-lg p-2" rows="5"></textarea></div>' +
        '<div class="flex gap-2">' +
        '<button type="button" onclick="confirmAddRequestNote(this)" class="flex-1 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed">إضافة</button>' +
        '<button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>' +
        '</div></div>';
      document.body.appendChild(modal);
    }

    async function confirmAddRequestNote(btn) {
      if (!canAddNote) return;
      const text = (document.getElementById('reqPhaseNoteText')?.value || '').trim();
      if (!text) { alert('الرجاء إدخال نص الملاحظة'); return; }
      if (!wfLockModalSubmit(btn, 'جاري الإضافة...')) return;
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const resp = await fetch('/api/workflow/add-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: currentRequestId, stageId: currentRequestStageId, noteText: text, performedBy: userData.id })
        });
        if (resp.ok) { closeModal(); location.reload(); }
        else { await wfAlertFetchFailure(resp, 'فشل إضافة الملاحظة'); wfUnlockModalSubmit(); }
      } catch (err) {
        console.error('add request note failed', err);
        alert('تعذر الاتصال بالخادم — تأكد أن npm run dev يعمل');
        wfUnlockModalSubmit();
      }
    }

    // ── Customer workflow actions ──────────────────────────────────────────
    function updateCustomerStage() {
      if (!canUpdateStage) return;
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold mb-4">تحديث مرحلة العميل</h3>' +
        '<select id="custNewStageId" class="w-full border rounded-lg p-2 mb-3">' + stageSelectHtml(currentCustomerStageId) + '</select>' +
        '<textarea id="custStageNotes" placeholder="ملاحظات (اختياري)" class="w-full border rounded-lg p-2 mb-3" rows="3"></textarea>' +
        '<div class="flex gap-2">' +
        '<button type="button" onclick="confirmCustomerStageUpdate(this)" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">تحديث</button>' +
        '<button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>' +
        '</div></div>';
      document.body.appendChild(modal);
    }

    async function confirmCustomerStageUpdate(btn) {
      if (!wfLockModalSubmit(btn, 'جاري التحديث...')) return;
      try {
        const newStageId = document.getElementById('custNewStageId').value;
        const notes = document.getElementById('custStageNotes').value;
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const resp = await fetch('/api/workflow/customer-update-stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: currentCustomerId, newStageId: parseInt(newStageId), notes, userId: userData.id })
        });
        if (resp.ok) { closeModal(); location.reload(); }
        else { alert('فشل تحديث المرحلة'); wfUnlockModalSubmit(); }
      } catch (_) {
        alert('فشل الاتصال بالخادم');
        wfUnlockModalSubmit();
      }
    }

    function addCustomerAction() {
      if (!canAddAction) return;
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold mb-4">إضافة إجراء للعميل</h3>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">نوع الإجراء</label>' +
        '<select id="custActionType" class="w-full border rounded-lg p-2">' + actionTypeSelectHtml() + '</select></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">ملاحظات الإجراء</label>' +
        '<textarea id="custActionNotes" placeholder="تفاصيل الإجراء..." class="w-full border rounded-lg p-2" rows="4"></textarea></div>' +
        '<div class="flex gap-2">' +
        '<button type="button" onclick="confirmAddCustomerAction(this)" class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">إضافة</button>' +
        '<button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>' +
        '</div></div>';
      document.body.appendChild(modal);
    }

    async function confirmAddCustomerAction(btn) {
      if (!canAddAction) return;
      if (!wfLockModalSubmit(btn, 'جاري الإضافة...')) return;
      try {
        const actionType = document.getElementById('custActionType').value;
        const notes = document.getElementById('custActionNotes').value;
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const resp = await fetch('/api/workflow/customer-add-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: currentCustomerId, stageId: currentCustomerStageId, actionType, notes, performedBy: userData.id })
        });
        if (resp.ok) { closeModal(); location.reload(); }
        else { alert('فشل إضافة الإجراء'); wfUnlockModalSubmit(); }
      } catch (_) {
        alert('فشل الاتصال بالخادم');
        wfUnlockModalSubmit();
      }
    }

    function createCustomerTask() {
      if (!currentCustomerStageId) { alert('الرجاء تحديث المرحلة أولاً قبل إنشاء مهام'); return; }
      _showCreateTaskModal('customer');
    }

    async function confirmCreateCustomerTask() {
      const title = document.getElementById('taskTitle').value;
      if (!title.trim()) { alert('الرجاء إدخال عنوان المهمة'); return; }
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const resp = await fetch('/api/workflow/customer-create-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentCustomerId,
          stageId: currentCustomerStageId,
          taskTitle: title,
          taskDescription: document.getElementById('taskDescription').value,
          dueDate: document.getElementById('taskDueDate').value || null,
          priority: document.getElementById('taskPriority').value,
          assignedTo: document.getElementById('taskAssignedTo').value ? parseInt(document.getElementById('taskAssignedTo').value) : null
        })
      });
      if (resp.ok) { closeModal(); location.reload(); }
      else { alert('فشل إنشاء المهمة'); closeModal(); }
    }

    // ── Request workflow actions ───────────────────────────────────────────
    function updateRequestStage() {
      if (!canUpdateStage) return;
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold mb-4">تحديث مرحلة الطلب</h3>' +
        '<select id="reqNewStageId" class="w-full border rounded-lg p-2 mb-3">' + stageSelectHtml(currentRequestStageId) + '</select>' +
        '<textarea id="reqStageNotes" placeholder="ملاحظات (اختياري)" class="w-full border rounded-lg p-2 mb-3" rows="3"></textarea>' +
        '<div class="flex gap-2">' +
        '<button type="button" onclick="confirmRequestStageUpdate(this)" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">تحديث</button>' +
        '<button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>' +
        '</div></div>';
      document.body.appendChild(modal);
    }

    async function confirmRequestStageUpdate(btn) {
      if (!wfLockModalSubmit(btn, 'جاري التحديث...')) return;
      try {
        const newStageId = document.getElementById('reqNewStageId').value;
        const notes = document.getElementById('reqStageNotes').value;
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const resp = await fetch('/api/workflow/update-stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: currentRequestId, newStageId: parseInt(newStageId), notes, userId: userData.id })
        });
        if (resp.ok) { closeModal(); location.reload(); }
        else { alert('فشل تحديث المرحلة'); wfUnlockModalSubmit(); }
      } catch (_) {
        alert('فشل الاتصال بالخادم');
        wfUnlockModalSubmit();
      }
    }

    function addRequestAction() {
      if (!canAddAction) return;
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold mb-4">إضافة إجراء للطلب</h3>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">نوع الإجراء</label>' +
        '<select id="reqActionType" class="w-full border rounded-lg p-2">' + actionTypeSelectHtml() + '</select></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">ملاحظات الإجراء</label>' +
        '<textarea id="reqActionNotes" placeholder="تفاصيل الإجراء..." class="w-full border rounded-lg p-2" rows="4"></textarea></div>' +
        '<div class="flex gap-2">' +
        '<button type="button" onclick="confirmAddRequestAction(this)" class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">إضافة</button>' +
        '<button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>' +
        '</div></div>';
      document.body.appendChild(modal);
    }

    async function confirmAddRequestAction(btn) {
      if (!canAddAction) return;
      if (!wfLockModalSubmit(btn, 'جاري الإضافة...')) return;
      try {
        const actionType = document.getElementById('reqActionType').value;
        const notes = document.getElementById('reqActionNotes').value;
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const resp = await fetch('/api/workflow/add-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: currentRequestId, stageId: currentRequestStageId, actionType, notes, performedBy: userData.id })
        });
        if (resp.ok) { closeModal(); location.reload(); }
        else { alert('فشل إضافة الإجراء'); wfUnlockModalSubmit(); }
      } catch (_) {
        alert('فشل الاتصال بالخادم');
        wfUnlockModalSubmit();
      }
    }

    function createRequestTask() {
      if (!currentRequestStageId) { alert('الرجاء تحديث المرحلة أولاً قبل إنشاء مهام'); return; }
      _showCreateTaskModal('request');
    }

    async function confirmCreateRequestTask() {
      const title = document.getElementById('taskTitle').value;
      if (!title.trim()) { alert('الرجاء إدخال عنوان المهمة'); return; }
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const resp = await fetch('/api/workflow/create-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: currentRequestId,
          stageId: currentRequestStageId,
          taskTitle: title,
          taskDescription: document.getElementById('taskDescription').value,
          dueDate: document.getElementById('taskDueDate').value || null,
          priority: document.getElementById('taskPriority').value,
          assignedTo: document.getElementById('taskAssignedTo').value ? parseInt(document.getElementById('taskAssignedTo').value) : null
        })
      });
      if (resp.ok) { closeModal(); location.reload(); }
      else { alert('فشل إنشاء المهمة'); closeModal(); }
    }

    // ── Shared task modal ──────────────────────────────────────────────────
    function _showCreateTaskModal(mode) {
      const confirmFn = mode === 'customer' ? 'confirmCreateCustomerTask()' : 'confirmCreateRequestTask()';
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold mb-4">إنشاء مهمة جديدة</h3>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">عنوان المهمة</label><input type="text" id="taskTitle" placeholder="عنوان المهمة..." class="w-full border rounded-lg p-2"></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">وصف المهمة</label><textarea id="taskDescription" placeholder="وصف تفصيلي للمهمة..." class="w-full border rounded-lg p-2" rows="3"></textarea></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">تاريخ الاستحقاق</label><input type="date" id="taskDueDate" class="w-full border rounded-lg p-2"></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">الأولوية</label><select id="taskPriority" class="w-full border rounded-lg p-2"><option value="low">منخفضة</option><option value="medium" selected>متوسطة</option><option value="high">عالية</option><option value="urgent">عاجلة</option></select></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">المسؤول عن المهمة</label><input type="text" id="taskAssignedTo" placeholder="معرف المستخدم (اختياري)" class="w-full border rounded-lg p-2"><small class="text-gray-500">اترك فارغاً للتعيين لاحقاً</small></div>' +
        '<div class="flex gap-2">' +
        '<button onclick="' + confirmFn + '" class="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">إنشاء</button>' +
        '<button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>' +
        '</div></div>';
      document.body.appendChild(modal);
    }

    async function completeRequest() {
      if (!confirm('هل أنت متأكد من إتمام الإفراغ؟\\nسيتم إغلاق هذا الطلب ونقل العميل إلى صفحة المكتملة ولن يظهرا في القوائم الرئيسية.')) return;
      const btn = document.getElementById('completeBtn');
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i>جاري...'; }
      try {
        const resp = await fetch('/api/requests/${requestId ?? 0}/complete', { method: 'PUT', credentials: 'same-origin' });
        const data = await resp.json();
        if (data.success) {
          alert('✓ تم إتمام الإفراغ بنجاح');
          window.location.href = '/admin/requests/completed';
        } else {
          alert('حدث خطأ: ' + (data.error || 'غير معروف'));
          if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-double ml-2"></i>إتمام الإفراغ'; }
        }
      } catch(e) {
        alert('فشل الاتصال بالخادم');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-double ml-2"></i>إتمام الإفراغ'; }
      }
    }
  </script>
</body>
</html>
  `
}

// ─── Main Workflow Page (tabbed: customer + request) ─────────────────────────

export function generateWorkflowTimelinePage(
  requestId: number,
  request: any,
  stages: any[],
  requestTimeline: { transitions: any[]; actions: any[]; notes: any[]; tasks: any[] },
  customerTimeline: { transitions: any[]; actions: any[]; notes: any[]; tasks: any[] },
  roleId?: number | null,
  userId?: number | null,
  activeTab: 'customer' | 'request' = 'request'
) {
  const { transitions: reqTransitions = [], actions: reqActions = [], notes: reqNotes = [], tasks: reqTasks = [] } = requestTimeline
  const { transitions: custTransitions = [], actions: custActions = [], notes: custNotes = [], tasks: custTasks = [] } = customerTimeline
  const normalizedRoleId = normalizeRoleId(roleId)
  const canUpdateStage = normalizedRoleId !== 4
  const canAddAction = normalizedRoleId !== 5
  const canAddNote = canAddWorkflowNote(roleId)
  const currentRequestStageId = request.current_stage_id ?? null
  const currentCustomerStageId = request.current_workflow_stage_id ?? null
  const customerId = request.customer_id ?? null

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مراحل الطلب - ${escapeHtml(request.customer_name)}</title>
  <link rel="stylesheet" href="/tailwind.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>${sharedStyles}</style>
</head>
<body class="bg-gray-50">

  <!-- Header -->
  <div class="bg-gradient-to-l from-blue-600 to-purple-600 text-white py-6 no-print">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold mb-2">
            <i class="fas fa-route ml-2"></i>
            مراحل سير عمل الطلب
          </h1>
          <p class="text-blue-100">الطلب رقم: ${requestId} | العميل: ${escapeHtml(request.customer_name)}</p>
        </div>
        <div class="flex gap-2">
          ${(normalizedRoleId === 5 || normalizedRoleId === 2 || (normalizedRoleId === 6 && request?.assigned_bank_agent_id != null && request.assigned_bank_agent_id === userId)) ? `
          <button onclick="completeRequest()" id="completeBtn"
            class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors font-bold">
            <i class="fas fa-check-double ml-2"></i>
            إتمام الإفراغ
          </button>
          ` : ''}
          <button onclick="window.print()" class="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
            <i class="fas fa-print ml-2"></i>
            طباعة
          </button>
          <a href="/admin/requests/${requestId}/report" class="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
            <i class="fas fa-file-alt ml-2"></i>
            العودة للتقرير
          </a>
          <a href="/admin/requests" class="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors">
            <i class="fas fa-arrow-right ml-2"></i>
            الطلبات
          </a>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-6xl mx-auto px-4 py-6">

    <!-- Request Summary -->
    <div class="bg-white rounded-xl shadow-md p-6 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <div class="text-gray-500 text-sm mb-1">المبلغ المطلوب</div>
          <div class="text-2xl font-bold text-blue-600">${Number(request.requested_amount).toLocaleString()} ريال</div>
        </div>
        <div>
          <div class="text-gray-500 text-sm mb-1">المرحلة الحالية (الطلب)</div>
          <div class="text-lg font-bold" style="color: ${request.stage_color || '#3B82F6'}">
            <i class="fas ${request.stage_icon || 'fa-circle'} ml-2"></i>
            ${escapeHtml(request.stage_name_ar || 'غير محدد')}
          </div>
        </div>
        <div>
          <div class="text-gray-500 text-sm mb-1">الحالة</div>
          <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
            ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              request.status === 'approved' ? 'bg-green-100 text-green-800' :
              request.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'}">
            ${request.status === 'pending' ? 'قيد الانتظار' :
              request.status === 'approved' ? 'موافق عليه' :
              request.status === 'rejected' ? 'مرفوض' :
              escapeHtml(request.status)}
          </div>
        </div>
        <div>
          <div class="text-gray-500 text-sm mb-1">تاريخ الطلب</div>
          <div class="text-lg font-bold text-gray-700">
            ${formatKsaDate(request.created_at)}
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="wf-tabs no-print">
      <button class="wf-tab-btn ${activeTab === 'customer' ? 'active' : ''}" onclick="switchTab('customer')">
        <i class="fas fa-user ml-1"></i> سير العمل (العميل)
      </button>
      <button class="wf-tab-btn ${activeTab === 'request' ? 'active' : ''}" onclick="switchTab('request')">
        <i class="fas fa-file-invoice ml-1"></i> سير العمل (الطلب)
      </button>
    </div>

    <!-- ── Tab: Request Workflow ── -->
    <div id="tab-request" class="wf-tab-panel ${activeTab === 'request' ? 'active' : ''}">
      <div class="bg-white rounded-xl shadow-md p-4 mb-4">
        <h2 class="text-lg font-bold text-gray-800 mb-3">
          <i class="fas fa-timeline ml-2 text-blue-600"></i>
          المسار الزمني للطلب
        </h2>
        ${renderTimelineSection(reqTransitions, reqActions, reqNotes, reqTasks, stages, { stageId: currentRequestStageId, canUpdateStage, canAddAction }, 'request', requestId)}
      </div>
      <div class="mt-4 flex gap-3 no-print">
        ${canAddNote ? `<button onclick="addRequestNote()" class="flex-1 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors"><i class="fas fa-sticky-note ml-2"></i>إضافة ملاحظة</button>` : ''}
        ${canUpdateStage ? `<button onclick="updateRequestStage()" class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"><i class="fas fa-arrow-left ml-2"></i>تحديث المرحلة</button>` : ''}
        ${canAddAction ? `<button onclick="addRequestAction()" class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"><i class="fas fa-plus ml-2"></i>إضافة إجراء</button>` : ''}
        <button onclick="createRequestTask()" class="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"><i class="fas fa-tasks ml-2"></i>إنشاء مهمة</button>
      </div>
    </div>

    <!-- ── Tab: Customer Workflow ── -->
    <div id="tab-customer" class="wf-tab-panel ${activeTab === 'customer' ? 'active' : ''}">
      <div class="bg-white rounded-xl shadow-md p-4 mb-4">
        <h2 class="text-lg font-bold text-gray-800 mb-3">
          <i class="fas fa-timeline ml-2 text-purple-600"></i>
          المسار الزمني للعميل
        </h2>
        ${renderTimelineSection(custTransitions, custActions, custNotes, custTasks, stages, { stageId: currentCustomerStageId, canUpdateStage, canAddAction }, 'customer', customerId ?? 0)}
      </div>
      <div class="mt-4 flex gap-3 no-print">
        ${canAddNote ? `<button onclick="addCustomerNote()" class="flex-1 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors"><i class="fas fa-sticky-note ml-2"></i>إضافة ملاحظة</button>` : ''}
        ${canUpdateStage ? `<button onclick="updateCustomerStage()" class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"><i class="fas fa-arrow-left ml-2"></i>تحديث المرحلة</button>` : ''}
        ${canAddAction ? `<button onclick="addCustomerAction()" class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"><i class="fas fa-plus ml-2"></i>إضافة إجراء</button>` : ''}
        <button onclick="createCustomerTask()" class="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"><i class="fas fa-tasks ml-2"></i>إنشاء مهمة</button>
      </div>
    </div>

  </div>

  <script>
    const stages = ${JSON.stringify(stages)};
    const currentRequestId = ${requestId};
    const currentCustomerId = ${customerId ?? 'null'};
    const currentRequestStageId = ${currentRequestStageId ?? 'null'};
    const currentCustomerStageId = ${currentCustomerStageId ?? 'null'};
    const canUpdateStage = ${canUpdateStage};
    const canAddAction = ${canAddAction};
    const canAddNote = ${canAddNote};

    ${getWorkflowTabPersistenceScript(activeTab)}
    ${workflowModalSubmitGuardScript}
    ${workflowFetchErrorAlertScript()}
    ${workflowNotesToggleScript}

    function closeModal() {
      const modal = document.body.querySelector('.wf-modal');
      if (modal) modal.remove();
      wfModalSubmitting = false;
    }

    function showActionDetail(typeLabel, note, performer) {
      closeModal();
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
      const noteHtml = (note && String(note).trim())
        ? String(note).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        : '<span class="text-gray-400">لا توجد ملاحظات</span>';
      const performerHtml = (performer && String(performer).trim())
        ? '<p class="text-xs text-gray-500 mt-3"><i class="fas fa-user ml-1"></i>' + String(performer).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</p>'
        : '';
      modal.innerHTML =
        '<div class="bg-white rounded-xl p-5 max-w-md w-full mx-4 shadow-xl">' +
          '<div class="flex justify-between items-start gap-3 mb-3">' +
            '<h3 class="text-lg font-bold text-gray-800">' + String(typeLabel).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</h3>' +
            '<button type="button" onclick="closeModal()" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>' +
          '</div>' +
          '<div class="action-detail-body">' + noteHtml + '</div>' +
          performerHtml +
          '<div class="mt-4 flex justify-end"><button type="button" onclick="closeModal()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium">إغلاق</button></div>' +
        '</div>';
      document.body.appendChild(modal);
    }

    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.action-chip-btn');
      if (!btn) return;
      const raw = btn.getAttribute('data-action-payload');
      if (!raw) return;
      e.preventDefault();
      try { const d = JSON.parse(raw); showActionDetail(d.type||'', d.note||'', d.performer||''); }
      catch(err) { console.error('action payload parse failed', err); }
    });

    function stageSelectHtml(currentId) {
      return stages
        .filter(s => s.stage_name !== 'pre_workflow')
        .map(s => '<option value="' + s.id + '"' + (s.id === currentId ? ' selected' : '') + '>' + s.stage_name_ar + '</option>')
        .join('');
    }

    function actionTypeSelectHtml() {
      return 'call:اتصال هاتفي,email:بريد إلكتروني,meeting:اجتماع,document:مستند,approval:موافقة,rejection:رفض,followup:متابعة,other:أخرى'
        .split(',').map(x => { const [v,l] = x.split(':'); return '<option value="' + v + '">' + l + '</option>'; }).join('');
    }

    function addCustomerNote() {
      if (!canAddNote) return;
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4"><h3 class="text-xl font-bold mb-4"><i class="fas fa-sticky-note text-amber-500 ml-2"></i>إضافة ملاحظة للعميل</h3><div class="mb-3"><label class="block text-sm font-medium mb-1">نص الملاحظة</label><textarea id="custPhaseNoteText" placeholder="اكتب ملاحظتك على المرحلة الحالية..." class="w-full border rounded-lg p-2" rows="5"></textarea></div><div class="flex gap-2"><button type="button" onclick="confirmAddCustomerNote(this)" class="flex-1 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed">إضافة</button><button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button></div></div>';
      document.body.appendChild(modal);
    }

    async function confirmAddCustomerNote(btn) {
      if (!canAddNote) return;
      const text = (document.getElementById('custPhaseNoteText')?.value || '').trim();
      if (!text) { alert('الرجاء إدخال نص الملاحظة'); return; }
      if (!wfLockModalSubmit(btn, 'جاري الإضافة...')) return;
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const resp = await fetch('/api/workflow/customer-add-note', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: currentCustomerId, stageId: currentCustomerStageId, noteText: text, performedBy: userData.id })
        });
        if (resp.ok) { closeModal(); location.reload(); }
        else { await wfAlertFetchFailure(resp, 'فشل إضافة الملاحظة'); wfUnlockModalSubmit(); }
      } catch (err) {
        console.error('add customer note failed', err);
        alert('تعذر الاتصال بالخادم — تأكد أن npm run dev يعمل');
        wfUnlockModalSubmit();
      }
    }

    function addRequestNote() {
      if (!canAddNote) return;
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4"><h3 class="text-xl font-bold mb-4"><i class="fas fa-sticky-note text-amber-500 ml-2"></i>إضافة ملاحظة للطلب</h3><div class="mb-3"><label class="block text-sm font-medium mb-1">نص الملاحظة</label><textarea id="reqPhaseNoteText" placeholder="اكتب ملاحظتك على المرحلة الحالية..." class="w-full border rounded-lg p-2" rows="5"></textarea></div><div class="flex gap-2"><button type="button" onclick="confirmAddRequestNote(this)" class="flex-1 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed">إضافة</button><button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button></div></div>';
      document.body.appendChild(modal);
    }

    async function confirmAddRequestNote(btn) {
      if (!canAddNote) return;
      const text = (document.getElementById('reqPhaseNoteText')?.value || '').trim();
      if (!text) { alert('الرجاء إدخال نص الملاحظة'); return; }
      if (!wfLockModalSubmit(btn, 'جاري الإضافة...')) return;
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const resp = await fetch('/api/workflow/add-note', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: currentRequestId, stageId: currentRequestStageId, noteText: text, performedBy: userData.id })
        });
        if (resp.ok) { closeModal(); location.reload(); }
        else { await wfAlertFetchFailure(resp, 'فشل إضافة الملاحظة'); wfUnlockModalSubmit(); }
      } catch (err) {
        console.error('add request note failed', err);
        alert('تعذر الاتصال بالخادم — تأكد أن npm run dev يعمل');
        wfUnlockModalSubmit();
      }
    }

    function taskModalHtml(confirmFn) {
      return '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold mb-4">إنشاء مهمة جديدة</h3>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">عنوان المهمة</label><input type="text" id="taskTitle" placeholder="عنوان المهمة..." class="w-full border rounded-lg p-2"></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">وصف المهمة</label><textarea id="taskDescription" class="w-full border rounded-lg p-2" rows="3"></textarea></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">تاريخ الاستحقاق</label><input type="date" id="taskDueDate" class="w-full border rounded-lg p-2"></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">الأولوية</label><select id="taskPriority" class="w-full border rounded-lg p-2"><option value="low">منخفضة</option><option value="medium" selected>متوسطة</option><option value="high">عالية</option><option value="urgent">عاجلة</option></select></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">المسؤول عن المهمة</label><input type="text" id="taskAssignedTo" placeholder="معرف المستخدم (اختياري)" class="w-full border rounded-lg p-2"></div>' +
        '<div class="flex gap-2"><button onclick="' + confirmFn + '" class="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">إنشاء</button><button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button></div></div>';
    }

    // ── Request tab actions ────────────────────────────────────────────────

    function updateRequestStage() {
      if (!canUpdateStage) return;
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4"><h3 class="text-xl font-bold mb-4">تحديث مرحلة الطلب</h3><select id="reqNewStageId" class="w-full border rounded-lg p-2 mb-3">' + stageSelectHtml(currentRequestStageId) + '</select><textarea id="reqStageNotes" placeholder="ملاحظات (اختياري)" class="w-full border rounded-lg p-2 mb-3" rows="3"></textarea><div class="flex gap-2"><button type="button" onclick="confirmUpdateRequestStage(this)" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">تحديث</button><button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button></div></div>';
      document.body.appendChild(modal);
    }

    async function confirmUpdateRequestStage(btn) {
      if (!wfLockModalSubmit(btn, 'جاري التحديث...')) return;
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const resp = await fetch('/api/workflow/update-stage', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: currentRequestId, newStageId: parseInt(document.getElementById('reqNewStageId').value), notes: document.getElementById('reqStageNotes').value, userId: userData.id })
        });
        if (resp.ok) { closeModal(); location.reload(); }
        else { alert('فشل تحديث المرحلة'); wfUnlockModalSubmit(); }
      } catch (_) {
        alert('فشل الاتصال بالخادم');
        wfUnlockModalSubmit();
      }
    }

    function addRequestAction() {
      if (!canAddAction) return;
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4"><h3 class="text-xl font-bold mb-4">إضافة إجراء للطلب</h3><div class="mb-3"><label class="block text-sm font-medium mb-1">نوع الإجراء</label><select id="reqActionType" class="w-full border rounded-lg p-2">' + actionTypeSelectHtml() + '</select></div><div class="mb-3"><label class="block text-sm font-medium mb-1">ملاحظات الإجراء</label><textarea id="reqActionNotes" class="w-full border rounded-lg p-2" rows="4"></textarea></div><div class="flex gap-2"><button type="button" onclick="confirmAddRequestAction(this)" class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">إضافة</button><button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button></div></div>';
      document.body.appendChild(modal);
    }

    async function confirmAddRequestAction(btn) {
      if (!canAddAction) return;
      if (!wfLockModalSubmit(btn, 'جاري الإضافة...')) return;
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const resp = await fetch('/api/workflow/add-action', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: currentRequestId, stageId: currentRequestStageId, actionType: document.getElementById('reqActionType').value, actionData: null, notes: document.getElementById('reqActionNotes').value, performedBy: userData.id })
        });
        if (resp.ok) { closeModal(); location.reload(); }
        else { alert('فشل إضافة الإجراء'); wfUnlockModalSubmit(); }
      } catch (_) {
        alert('فشل الاتصال بالخادم');
        wfUnlockModalSubmit();
      }
    }

    function createRequestTask() {
      if (!currentRequestStageId) { alert('الرجاء تحديث المرحلة أولاً قبل إنشاء مهام'); return; }
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = taskModalHtml('confirmCreateRequestTask()');
      document.body.appendChild(modal);
    }

    async function confirmCreateRequestTask() {
      const title = document.getElementById('taskTitle').value;
      if (!title.trim()) { alert('الرجاء إدخال عنوان المهمة'); return; }
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const resp = await fetch('/api/workflow/create-task', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: currentRequestId, stageId: currentRequestStageId, taskTitle: title, taskDescription: document.getElementById('taskDescription').value, dueDate: document.getElementById('taskDueDate').value || null, priority: document.getElementById('taskPriority').value, assignedTo: document.getElementById('taskAssignedTo').value ? parseInt(document.getElementById('taskAssignedTo').value) : null })
      });
      if (resp.ok) { closeModal(); location.reload(); } else { alert('فشل إنشاء المهمة'); closeModal(); }
    }

    // ── Customer tab actions ───────────────────────────────────────────────

    function updateCustomerStage() {
      if (!canUpdateStage) return;
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4"><h3 class="text-xl font-bold mb-4">تحديث مرحلة العميل</h3><select id="custNewStageId" class="w-full border rounded-lg p-2 mb-3">' + stageSelectHtml(currentCustomerStageId) + '</select><textarea id="custStageNotes" placeholder="ملاحظات (اختياري)" class="w-full border rounded-lg p-2 mb-3" rows="3"></textarea><div class="flex gap-2"><button type="button" onclick="confirmUpdateCustomerStage(this)" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">تحديث</button><button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button></div></div>';
      document.body.appendChild(modal);
    }

    async function confirmUpdateCustomerStage(btn) {
      if (!wfLockModalSubmit(btn, 'جاري التحديث...')) return;
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const resp = await fetch('/api/workflow/customer-update-stage', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: currentCustomerId, newStageId: parseInt(document.getElementById('custNewStageId').value), notes: document.getElementById('custStageNotes').value, userId: userData.id })
        });
        if (resp.ok) { closeModal(); location.reload(); }
        else { alert('فشل تحديث المرحلة'); wfUnlockModalSubmit(); }
      } catch (_) {
        alert('فشل الاتصال بالخادم');
        wfUnlockModalSubmit();
      }
    }

    function addCustomerAction() {
      if (!canAddAction) return;
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4"><h3 class="text-xl font-bold mb-4">إضافة إجراء للعميل</h3><div class="mb-3"><label class="block text-sm font-medium mb-1">نوع الإجراء</label><select id="custActionType" class="w-full border rounded-lg p-2">' + actionTypeSelectHtml() + '</select></div><div class="mb-3"><label class="block text-sm font-medium mb-1">ملاحظات الإجراء</label><textarea id="custActionNotes" class="w-full border rounded-lg p-2" rows="4"></textarea></div><div class="flex gap-2"><button type="button" onclick="confirmAddCustomerAction(this)" class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed">إضافة</button><button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button></div></div>';
      document.body.appendChild(modal);
    }

    async function confirmAddCustomerAction(btn) {
      if (!canAddAction) return;
      if (!wfLockModalSubmit(btn, 'جاري الإضافة...')) return;
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const resp = await fetch('/api/workflow/customer-add-action', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: currentCustomerId, stageId: currentCustomerStageId, actionType: document.getElementById('custActionType').value, notes: document.getElementById('custActionNotes').value, performedBy: userData.id })
        });
        if (resp.ok) { closeModal(); location.reload(); }
        else { alert('فشل إضافة الإجراء'); wfUnlockModalSubmit(); }
      } catch (_) {
        alert('فشل الاتصال بالخادم');
        wfUnlockModalSubmit();
      }
    }

    function createCustomerTask() {
      if (!currentCustomerStageId) { alert('الرجاء تحديث مرحلة العميل أولاً قبل إنشاء مهام'); return; }
      const modal = document.createElement('div');
      modal.className = 'wf-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = taskModalHtml('confirmCreateCustomerTask()');
      document.body.appendChild(modal);
    }

    async function confirmCreateCustomerTask() {
      const title = document.getElementById('taskTitle').value;
      if (!title.trim()) { alert('الرجاء إدخال عنوان المهمة'); return; }
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const resp = await fetch('/api/workflow/customer-create-task', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: currentCustomerId, stageId: currentCustomerStageId, taskTitle: title, taskDescription: document.getElementById('taskDescription').value, dueDate: document.getElementById('taskDueDate').value || null, priority: document.getElementById('taskPriority').value, assignedTo: document.getElementById('taskAssignedTo').value ? parseInt(document.getElementById('taskAssignedTo').value) : null })
      });
      if (resp.ok) { closeModal(); location.reload(); } else { alert('فشل إنشاء المهمة'); closeModal(); }
    }

    // ── Complete request ───────────────────────────────────────────────────

    async function completeRequest() {
      if (!confirm('هل أنت متأكد من إتمام الإفراغ؟\\nسيتم إغلاق هذا الطلب ونقل العميل إلى صفحة المكتملة ولن يظهرا في القوائم الرئيسية.')) return;
      const btn = document.getElementById('completeBtn');
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i>جاري...'; }
      try {
        const resp = await fetch('/api/requests/${requestId}/complete', { method: 'PUT', credentials: 'same-origin' });
        const data = await resp.json();
        if (data.success) {
          alert('✓ تم إتمام الإفراغ بنجاح');
          window.location.href = '/admin/requests/completed';
        } else {
          alert('حدث خطأ: ' + (data.error || 'غير معروف'));
          if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-double ml-2"></i>إتمام الإفراغ'; }
        }
      } catch(e) {
        alert('فشل الاتصال بالخادم');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-double ml-2"></i>إتمام الإفراغ'; }
      }
    }
  </script>

</body>
</html>
  `
}
