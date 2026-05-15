// ============================================
// Workflow Timeline Page - صفحة مراحل سير العمل
// ============================================

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

function getActionTypeLabel(actionType?: string) {
  return ACTION_TYPE_LABELS[actionType || ''] || actionType || 'إجراء'
}

function formatActionDisplay(action: { action_type?: string; notes?: string }) {
  if (action.notes?.trim()) return action.notes.trim()
  return getActionTypeLabel(action.action_type)
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

export function generateWorkflowTimelinePage(requestId: number, request: any, stages: any[], timeline: any, roleId?: number | null) {
  const { transitions = [], actions = [], tasks = [] } = timeline
  const normalizedRoleId = normalizeRoleId(roleId)
  const canUpdateStage = normalizedRoleId !== 4
  const canAddAction = normalizedRoleId !== 5

  // Calculate duration between stages
  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} يوم`
    return `${hours} ساعة`
  }

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مراحل الطلب - ${request.customer_name}</title>
  <link rel="stylesheet" href="/tailwind.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    /* Timeline Styles — compact rows for density */
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
    
    .stage-card:hover {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }
    
    .stage-card-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem 0.75rem;
      margin-bottom: 0.25rem;
    }
    
    .stage-card-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #1f2937;
      line-height: 1.25;
    }
    
    .stage-card-meta {
      font-size: 0.7rem;
      color: #6b7280;
      line-height: 1.2;
    }
    
    .stage-duration-badge {
      font-size: 0.65rem;
      padding: 0.1rem 0.4rem;
      border-radius: 0.25rem;
    }
    
    .stage-inline-note {
      font-size: 0.7rem;
      padding: 0.25rem 0.4rem;
      margin-bottom: 0.25rem;
      border-right-width: 2px;
    }
    
    .stage-subsection {
      margin-top: 0.25rem;
    }
    
    .stage-subsection-title {
      font-size: 0.65rem;
      font-weight: 700;
      color: #4b5563;
      margin-bottom: 0.15rem;
    }
    
    .action-badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.2rem;
    }
    
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
    
    .action-chip-btn:hover {
      background: #dcfce7;
      border-color: #4ade80;
    }
    
    .action-detail-body {
      font-size: 0.875rem;
      color: #374151;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .task-item {
      background: #F9FAFB;
      padding: 0.25rem 0.4rem;
      border-radius: 0.25rem;
      margin-bottom: 0.2rem;
      border-right: 2px solid;
      font-size: 0.7rem;
      line-height: 1.25;
    }
    
    .task-item:last-child {
      margin-bottom: 0;
    }
    
    .task-item.pending {
      border-right-color: #F59E0B;
    }
    
    .task-item.completed {
      border-right-color: #10B981;
      opacity: 0.7;
    }
    
    @media print {
      .no-print {
        display: none !important;
      }
    }
  </style>
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
          <p class="text-blue-100">الطلب رقم: ${requestId} | العميل: ${request.customer_name}</p>
        </div>
        <div class="flex gap-2">
          ${(roleId === 5 || roleId === 2) ? `
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
            <i class="fas fa-arrow-right ml-2"></i>
            العودة للتقرير
          </a>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Request Summary -->
  <div class="max-w-6xl mx-auto px-4 py-6">
    <div class="bg-white rounded-xl shadow-md p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <div class="text-gray-500 text-sm mb-1">المبلغ المطلوب</div>
          <div class="text-2xl font-bold text-blue-600">${Number(request.requested_amount).toLocaleString()} ريال</div>
        </div>
        <div>
          <div class="text-gray-500 text-sm mb-1">المرحلة الحالية</div>
          <div class="text-lg font-bold" style="color: ${request.stage_color || '#3B82F6'}">
            <i class="fas ${request.stage_icon || 'fa-circle'} ml-2"></i>
            ${request.stage_name_ar || 'غير محدد'}
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
              request.status}
          </div>
        </div>
        <div>
          <div class="text-gray-500 text-sm mb-1">تاريخ الطلب</div>
          <div class="text-lg font-bold text-gray-700">
            ${new Date(request.created_at).toLocaleDateString('ar-SA')}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Timeline -->
    <div class="bg-white rounded-xl shadow-md p-4">
      <h2 class="text-lg font-bold text-gray-800 mb-3">
        <i class="fas fa-timeline ml-2 text-blue-600"></i>
        المسار الزمني للطلب
      </h2>
      
      <div class="timeline-container">
        <div class="timeline-line"></div>
        
        ${transitions.length === 0 ? `
          <div class="text-center py-6 text-gray-500">
            <i class="fas fa-inbox fa-2x mb-2 text-gray-300"></i>
            <p class="text-sm">لم يتم تسجيل أي مراحل بعد</p>
          </div>
        ` : ''}
        
        ${transitions.map((transition: any, index: number) => {
          const isLast = index === transitions.length - 1
          const duration = index > 0 ? calculateDuration(transitions[index - 1].created_at, transition.created_at) : null
          
          // Get actions for this stage
          const stageActions = actions.filter((a: any) => a.stage_id === transition.to_stage_id)
          const stageTasks = tasks.filter((t: any) => t.stage_id === transition.to_stage_id)
          
          return `
            <div class="timeline-item">
              <div class="timeline-dot ${isLast ? 'current' : ''}" style="background-color: ${transition.to_stage_color}">
                <i class="fas ${transition.to_stage_icon}"></i>
              </div>
              
              <div class="stage-card" style="border-right-color: ${transition.to_stage_color}">
                <div class="stage-card-header">
                  <h3 class="stage-card-title">${index + 1}. ${transition.to_stage_name}</h3>
                  <span class="stage-card-meta">
                    <i class="fas fa-clock ml-1"></i>
                    ${new Date(transition.created_at).toLocaleString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  ${transition.transitioned_by_name ? `
                    <span class="stage-card-meta">
                      <i class="fas fa-user ml-1"></i>${transition.transitioned_by_name}
                    </span>
                  ` : ''}
                  ${duration ? `
                    <span class="stage-duration-badge bg-blue-50 text-blue-700 font-medium">
                      <i class="fas fa-hourglass-half ml-1"></i>${duration}
                    </span>
                  ` : ''}
                </div>
                
                ${transition.notes ? `
                  <div class="stage-inline-note bg-yellow-50 border-yellow-400 text-gray-700 rounded">
                    <i class="fas fa-sticky-note ml-1 text-yellow-600"></i>${transition.notes}
                  </div>
                ` : ''}
                
                ${stageActions.length > 0 ? `
                  <div class="stage-subsection">
                    <div class="stage-subsection-title"><i class="fas fa-tasks ml-1"></i>إجراءات</div>
                    <div class="action-badges-row">
                    ${stageActions.map((action: any) => {
                      const typeLabel = getActionTypeLabel(action.action_type)
                      const noteText = String(action.notes || '').trim()
                      const performer = String(action.performed_by_name || '').trim()
                      return `
                      <button
                        type="button"
                        class="action-chip-btn"
                        data-action-payload="${encodeActionPayload({ type: typeLabel, note: noteText, performer })}"
                        title="عرض تفاصيل الإجراء">
                        <i class="fas fa-circle-info text-[0.55rem] opacity-70"></i>
                        ${escapeHtml(typeLabel)}
                      </button>`
                    }).join('')}
                    </div>
                  </div>
                ` : ''}
                
                ${stageTasks.length > 0 ? `
                  <div class="stage-subsection">
                    <div class="stage-subsection-title"><i class="fas fa-list-check ml-1"></i>مهام</div>
                    ${stageTasks.map((task: any) => `
                      <div class="task-item ${task.status} flex justify-between items-center gap-2">
                        <span class="text-gray-800 font-medium truncate">${task.task_title}${task.assigned_to_name ? ` <span class="text-gray-500 font-normal">· ${task.assigned_to_name}</span>` : ''}</span>
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
    </div>
    
    <!-- Action Buttons -->
    <div class="mt-6 flex gap-3 no-print">
      ${canUpdateStage ? `
      <button onclick="updateStage()" class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
        <i class="fas fa-arrow-left ml-2"></i>
        تحديث المرحلة
      </button>
      ` : ''}
      ${canAddAction ? `
      <button onclick="addAction()" class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
        <i class="fas fa-plus ml-2"></i>
        إضافة إجراء
      </button>
      ` : ''}
      <button onclick="createTask()" class="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
        <i class="fas fa-tasks ml-2"></i>
        إنشاء مهمة
      </button>
    </div>
  </div>
  
  <script>
    const stages = ${JSON.stringify(stages)};
    const currentRequestId = ${requestId};
    const currentStageId = ${request.current_stage_id || 'null'};
    const canUpdateStage = ${canUpdateStage};
    const canAddAction = ${canAddAction};
    
    // Close modal utility function
    function closeModal() {
      const modal = document.body.querySelector('.fixed');
      if (modal) modal.remove();
    }
    
    function showActionDetail(typeLabel, note, performer) {
      closeModal();
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
      });
      const noteHtml = (note && String(note).trim())
        ? String(note).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        : '<span class="text-gray-400">لا توجد ملاحظات</span>';
      const performerHtml = (performer && String(performer).trim())
        ? '<p class="text-xs text-gray-500 mt-3"><i class="fas fa-user ml-1"></i>' +
          String(performer).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
          '</p>'
        : '';
      modal.innerHTML =
        '<div class="bg-white rounded-xl p-5 max-w-md w-full mx-4 shadow-xl" role="dialog" aria-modal="true">' +
          '<div class="flex justify-between items-start gap-3 mb-3">' +
            '<h3 class="text-lg font-bold text-gray-800">' +
              String(typeLabel).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
            '</h3>' +
            '<button type="button" onclick="closeModal()" class="text-gray-400 hover:text-gray-600 text-xl leading-none" aria-label="إغلاق">&times;</button>' +
          '</div>' +
          '<div class="action-detail-body">' + noteHtml + '</div>' +
          performerHtml +
          '<div class="mt-4 flex justify-end">' +
            '<button type="button" onclick="closeModal()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium">إغلاق</button>' +
          '</div>' +
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
      } catch (err) {
        console.error('action payload parse failed', err);
      }
    });
    
    function updateStage() {
      if (!canUpdateStage) return;
      // Create modal for stage selection
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = \`
        <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <h3 class="text-xl font-bold mb-4">تحديث مرحلة الطلب</h3>
          <select id="newStageId" class="w-full border rounded-lg p-2 mb-3">
            \${stages.map(s => \`
              <option value="\${s.id}" \${s.id === currentStageId ? 'selected' : ''}>
                \${s.stage_name_ar}
              </option>
            \`).join('')}
          </select>
          <textarea id="stageNotes" placeholder="ملاحظات (اختياري)" class="w-full border rounded-lg p-2 mb-3" rows="3"></textarea>
          <div class="flex gap-2">
            <button onclick="confirmStageUpdate()" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">تحديث</button>
            <button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>
          </div>
        </div>
      \`;
      document.body.appendChild(modal);
    }
    
    async function confirmStageUpdate() {
      if (!canUpdateStage) return;
      const newStageId = document.getElementById('newStageId').value;
      const notes = document.getElementById('stageNotes').value;
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      const response = await fetch('/api/workflow/update-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: currentRequestId,
          newStageId: parseInt(newStageId),
          notes: notes,
          userId: userData.id
        })
      });
      
      if (response.ok) {
        closeModal();
        location.reload();
      } else {
        alert('فشل تحديث المرحلة');
        closeModal();
      }
    }
    
    async function confirmAddAction() {
      if (!canAddAction) return;
      const actionType = document.getElementById('actionType').value;
      const notes = document.getElementById('actionNotes').value;
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      const response = await fetch('/api/workflow/add-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: currentRequestId,
          stageId: currentStageId,
          actionType: actionType,
          actionData: null,
          notes: notes,
          performedBy: userData.id
        })
      });
      
      if (response.ok) {
        closeModal();
        location.reload();
      } else {
        alert('فشل إضافة الإجراء');
        closeModal();
      }
    }
    
    async function confirmCreateTask() {
      const title = document.getElementById('taskTitle').value;
      const description = document.getElementById('taskDescription').value;
      const dueDate = document.getElementById('taskDueDate').value;
      const priority = document.getElementById('taskPriority').value;
      const assignedTo = document.getElementById('taskAssignedTo').value;
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      if (!title.trim()) {
        alert('الرجاء إدخال عنوان المهمة');
        return;
      }
      
      const response = await fetch('/api/workflow/create-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: currentRequestId,
          stageId: currentStageId,
          taskTitle: title,
          taskDescription: description,
          dueDate: dueDate || null,
          priority: priority,
          assignedTo: assignedTo ? parseInt(assignedTo) : null
        })
      });
      
      if (response.ok) {
        closeModal();
        location.reload();
      } else {
        alert('فشل إنشاء المهمة');
        closeModal();
      }
    }
    
    function addAction() {
      if (!canAddAction) return;
      if (!currentStageId) {
        alert('الرجاء تحديث المرحلة أولاً قبل إضافة إجراءات');
        return;
      }
      
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold mb-4">إضافة إجراء جديد</h3>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">نوع الإجراء</label>' +
        '<select id="actionType" class="w-full border rounded-lg p-2">' +
        '<option value="call">اتصال هاتفي</option>' +
        '<option value="email">بريد إلكتروني</option>' +
        '<option value="meeting">اجتماع</option>' +
        '<option value="document">مستند</option>' +
        '<option value="approval">موافقة</option>' +
        '<option value="rejection">رفض</option>' +
        '<option value="followup">متابعة</option>' +
        '<option value="other">أخرى</option>' +
        '</select></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">ملاحظات الإجراء</label>' +
        '<textarea id="actionNotes" placeholder="تفاصيل الإجراء..." class="w-full border rounded-lg p-2" rows="4"></textarea></div>' +
        '<div class="flex gap-2">' +
        '<button onclick="confirmAddAction()" class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">إضافة</button>' +
        '<button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>' +
        '</div></div>';
      document.body.appendChild(modal);
    }
    
    function createTask() {
      if (!currentStageId) {
        alert('الرجاء تحديث المرحلة أولاً قبل إنشاء مهام');
        return;
      }
      
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = '<div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">' +
        '<h3 class="text-xl font-bold mb-4">إنشاء مهمة جديدة</h3>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">عنوان المهمة</label>' +
        '<input type="text" id="taskTitle" placeholder="عنوان المهمة..." class="w-full border rounded-lg p-2"></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">وصف المهمة</label>' +
        '<textarea id="taskDescription" placeholder="وصف تفصيلي للمهمة..." class="w-full border rounded-lg p-2" rows="3"></textarea></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">تاريخ الاستحقاق</label>' +
        '<input type="date" id="taskDueDate" class="w-full border rounded-lg p-2"></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">الأولوية</label>' +
        '<select id="taskPriority" class="w-full border rounded-lg p-2">' +
        '<option value="low">منخفضة</option>' +
        '<option value="medium" selected>متوسطة</option>' +
        '<option value="high">عالية</option>' +
        '<option value="urgent">عاجلة</option>' +
        '</select></div>' +
        '<div class="mb-3"><label class="block text-sm font-medium mb-1">المسؤول عن المهمة</label>' +
        '<input type="text" id="taskAssignedTo" placeholder="معرف المستخدم (اختياري)" class="w-full border rounded-lg p-2">' +
        '<small class="text-gray-500">اترك فارغاً للتعيين لاحقاً</small></div>' +
        '<div class="flex gap-2">' +
        '<button onclick="confirmCreateTask()" class="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">إنشاء</button>' +
        '<button onclick="closeModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">إلغاء</button>' +
        '</div></div>';
      document.body.appendChild(modal);
    }

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
