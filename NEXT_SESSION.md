# Next Session Notes

## What we're in the middle of
Refactoring the `/admin/my-tasks` page from a single-column card list to a **master-detail split layout** (email-client style). The user approved the direction but we haven't written any code yet — the last agent call failed before doing anything.

---

## Completed this session (already built + in dist/)

### 1. Archive/No-Response buttons moved to registration form
- Removed from task cards on my-tasks
- Now appear on `/admin/customers/add` only when opened from my-tasks (via `task_id` query param)
- Same API calls, on success redirect back to `/admin/my-tasks`
- Uses `window.prompt` for archive reason (no SPA modal available on that page)
- Hidden input `<input type="hidden" name="task_id">` added to the form

### 2. Task ratings
- **Migration**: `migrations/0137_followup_task_rating.sql` — adds `rating INTEGER` and `rating_note TEXT` to `company_contact_followup_tasks`
- **API**: `PATCH /api/my-followup-tasks/:id/rating` — sets/clears rating + note, auth-gated to assigned user
- **SELECT query**: `GET /api/my-followup-tasks` tries `t.rating, t.rating_note` first; falls back gracefully if migration not applied yet
- **Card UI**: Single "تقييم العميل" button (purple outline if unrated, colored badge if rated)
- **Modal**: Same design as customer module — gradient header, rating dropdown, note textarea. Added to my-tasks page HTML as `#taskReviewModal`
- **Rating = 1 auto-archives**: After saving rating 1 (موقوف), automatically calls the archive endpoint
- **Card border**: 2px colored border matching rating color; gray default if unrated
- **Carry-over on registration**: `POST /api/customers` reads `task_id` from form, looks up task rating, inserts into `customer_reviews` for the new customer

### 3. DB migration to apply
```
wrangler d1 execute <db-name> --file=migrations/0137_followup_task_rating.sql
```

---

## What to do next session: Master-Detail Layout

### The plan
Split the my-tasks page into two panels side by side:
- **Left (40%)**: Compact scrollable list of task rows — customer name, phone, rating badge, scheduled date, priority dot
- **Right (60%)**: Full task detail card for the selected task — updates when you click a row
- **Mobile**: Full-width list, clicking a row hides the list and shows the detail with a back button

### Specific code changes needed

#### A. HTML (inside `app.get('/admin/my-tasks'` server template)
Replace the `<div id="cards" class="space-y-3"></div>` and its surrounding wrapper with a flex split:

```html
<div class="flex gap-4" style="height:calc(100vh - 280px);min-height:420px;">
  <!-- Left: list -->
  <div id="taskListPanel" class="w-full md:w-2/5 overflow-y-auto bg-white border border-gray-200 rounded-xl flex-shrink-0">
    <div id="taskList"></div>
  </div>
  <!-- Right: detail -->
  <div id="taskDetailPanel" class="hidden md:flex flex-col flex-1 overflow-y-auto">
    <button id="detailBackBtn" class="md:hidden mb-3 text-sm text-indigo-600 font-medium flex items-center gap-1 flex-shrink-0">
      <i class="fas fa-arrow-right"></i> العودة للقائمة
    </button>
    <div id="taskDetail">
      <!-- empty state placeholder -->
    </div>
  </div>
</div>
```

#### B. JS globals — add `let selectedTaskId = null;`

#### C. Extract `buildTaskCardHtml(task)` 
Move the card HTML generation out of `renderTasks` into a standalone function. It's the current map callback body (lines ~39391–39497). No logic changes, just extraction.

#### D. Add `renderTaskDetail(task)`
- Takes one task, injects `buildTaskCardHtml(task)` into `#taskDetail`
- Binds all events (data-note, data-pass-submit, data-pass-cancel, data-archive, data-no-response, data-review-task, data-history) against `#taskDetail` as root
- Event handlers reference `allTasks` instead of the local `tasks` parameter

#### E. Add `selectTask(taskId)`
- Sets `selectedTaskId`
- Updates row highlight in `#taskList` (adds `bg-indigo-50` + right border to selected row)
- Calls `renderTaskDetail(task)` for that task
- On mobile (`window.innerWidth < 768`): hides `#taskListPanel`, shows `#taskDetailPanel`

#### F. Rewrite `renderTasks(tasks)`
- Renders compact rows into `#taskList`
- Each row: priority dot (colored), customer name, rating badge, phone, scheduled date
- Binds row clicks → `selectTask(id)`
- Auto-selects: keeps `selectedTaskId` if still in list, else selects first task

#### G. Update `loadTasks()`
- Change all `document.getElementById('cards')` to `document.getElementById('taskList')`
- 3 occurrences total

#### H. Wire up the mobile back button
```javascript
document.getElementById('detailBackBtn').addEventListener('click', function() {
  document.getElementById('taskDetailPanel').classList.add('hidden');
  document.getElementById('taskDetailPanel').style.display = '';
  document.getElementById('taskListPanel').style.display = '';
});
```

### Key lines to edit (may shift slightly by next session)
- HTML `#tasksPage` block: ~38933–38956
- `renderTasks` function: ~39385–39593
- `loadTasks` function: ~39674–39702 (3x `getElementById('cards')`)
- Global state declarations: ~39096 (add `selectedTaskId`)

### Important: user wants easy revert
Do this in a git branch or worktree so it can be reverted cleanly if the user doesn't like the result.

---

## Files modified this session
- `src/index.tsx` — all changes above
- `dist/_worker.js` — rebuilt (auto-generated, don't touch manually)
- `migrations/0137_followup_task_rating.sql` — new file
