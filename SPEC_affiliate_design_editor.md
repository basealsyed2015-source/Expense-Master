# Spec: Affiliate Link Visual Design Editor

## Goal
Upgrade the per-affiliate design panel on `/admin/contact-affiliates` with:
1. A **split-pane layout** (controls left, live preview right)
2. **Color palette presets** (one-click themes)
3. A **live preview canvas** that updates instantly as the user changes values
4. A **drag-and-drop custom field builder** with field type support

---

## File to edit
`src/index.tsx`

There is exactly **one** `app.get('/admin/contact-affiliates', ...)` route handler. All the HTML is returned inline as a template literal. Do not touch anything outside that handler except the `designPanelHtml(id)` JS function.

The server-side TypeScript functions `buildPublicContactPageHtml`, `withAffiliateContactDesign`, etc. — **do not touch those**. The preview is client-side only.

---

## Tech constraints
- **No React/Vue/Svelte.** Pure vanilla JS inside the HTML string.
- **Tailwind CDN** (`https://cdn.tailwindcss.com`) — use utility classes freely; CDN supports all of them at runtime.
- **FontAwesome 6.4** already loaded — use `<i class="fas fa-...">` icons.
- **Axios 1.6** already loaded — use for API calls.
- Page is `dir="rtl"` (Arabic). Keep all Arabic text as-is. Do not add or change Arabic copy.
- No extra CDN libraries except **SortableJS** (for drag-and-drop, see below).

---

## 1. Page-level layout change

Currently the page is a single `max-w-4xl` centered column.

Change the **design panel area** (`data-aff-panel`) to a horizontal split when open:

```
[ Link row header: label + URL + buttons ]
┌─────────────────────────────────────────────────────────┐
│ LEFT 42%                │ RIGHT 58%                      │
│ Controls panel          │ Live preview canvas            │
│ (colors, fields, etc.)  │ (scaled phone/desktop mock)    │
└─────────────────────────────────────────────────────────┘
```

Use `flex flex-col lg:flex-row gap-6` on the panel wrapper so it stacks on mobile and splits on `lg+`.

Left pane: `w-full lg:w-5/12 shrink-0`
Right pane: `w-full lg:flex-1 min-w-0`

---

## 2. Left pane – Controls

Keep all existing controls (bg color, form card color, text color toggle, custom fields), but apply these style upgrades:

### Section headers
```html
<p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">لون الخلفية</p>
```

### Color input row (background + form card)
Replace the plain `<input type="color">` + hex text box with this pattern for each color field:

```html
<div class="flex items-center gap-2">
  <!-- Native color picker (hidden, driven by the swatch button) -->
  <input type="color" id="..." class="sr-only" />
  <!-- Swatch button that opens the picker on click -->
  <button type="button" id="..._swatch"
    class="h-9 w-9 rounded-lg border-2 border-white shadow-md ring-1 ring-gray-200 shrink-0 cursor-pointer transition-transform hover:scale-110"
    style="background: <current_value>;"
    onclick="document.getElementById('...').click()">
  </button>
  <!-- Hex text input -->
  <input type="text" id="..._text" maxlength="9" dir="ltr" placeholder="#0f766e"
    class="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 bg-white font-mono text-sm text-left focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
  <!-- Clear -->
  <button type="button" id="..._clear" class="text-gray-300 hover:text-red-500 transition-colors">
    <i class="fas fa-times-circle text-sm"></i>
  </button>
</div>
```

Wire: picker `input` → update swatch background + hex text.  
Wire: hex text `input` → if valid 6-char hex → update swatch + picker value.  
Wire: swatch `input` (via the hidden picker) → same as picker.

### Color presets strip

Add this block **above** the color inputs, inside the left pane:

```html
<div class="mb-5">
  <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">ثيمات جاهزة</p>
  <div class="flex flex-wrap gap-2" id="presetsStrip_<id>"></div>
</div>
```

Render the swatches via JS using this preset list:

```js
var PRESETS = [
  { name: 'افتراضي',   bg: '#0f766e', form: '#ffffff', text: 'black' },
  { name: 'ليلي',      bg: '#0f172a', form: '#1e293b', text: 'white' },
  { name: 'بنفسجي',   bg: '#4f46e5', form: '#eef2ff', text: 'black' },
  { name: 'ذهبي',     bg: '#92400e', form: '#fffbeb', text: 'black' },
  { name: 'وردي',     bg: '#be185d', form: '#fff1f2', text: 'black' },
  { name: 'رمادي',    bg: '#374151', form: '#f9fafb', text: 'black' },
  { name: 'سماوي',    bg: '#0369a1', form: '#f0f9ff', text: 'black' },
  { name: 'أخضر',     bg: '#166534', form: '#f0fdf4', text: 'black' },
];
```

Each swatch:
```html
<button type="button" title="<name>"
  style="background:<bg>;"
  class="h-7 w-7 rounded-full border-2 border-white shadow ring-1 ring-gray-200 cursor-pointer hover:scale-110 transition-transform"
  onclick="applyPreset(id, preset)">
</button>
```

`applyPreset(id, preset)` sets bg color, form color, and text-color toggle, then calls `updatePreview(id)`.

### Text color toggle
Keep the two-button toggle (أسود / أبيض) exactly as-is, same Tailwind classes. Just ensure it calls `updatePreview(id)` on click.

---

## 3. Right pane – Live preview canvas

The canvas shows a scaled-down phone frame containing a mini version of the actual public contact page. It should look like a real phone mockup, not a flat rectangle.

### Phone frame shell
```html
<div class="flex flex-col items-center">
  <p class="text-xs text-gray-400 uppercase tracking-widest mb-3 font-bold">معاينة مباشرة</p>
  <div class="relative mx-auto"
       style="width:280px; height:520px; background:#111827; border-radius:36px;
              padding:12px; box-shadow:0 25px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.08);">
    <!-- notch -->
    <div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);
                width:80px;height:20px;background:#111827;border-radius:0 0 14px 14px;z-index:10;"></div>
    <!-- screen -->
    <div id="previewScreen_<id>"
         style="width:100%;height:100%;border-radius:26px;overflow:hidden;position:relative;">
      <!-- content injected by JS -->
    </div>
  </div>
</div>
```

### Preview content (injected into `#previewScreen_<id>`)

`updatePreview(id)` reads current control values and writes this innerHTML into the screen div:

```js
function updatePreview(id) {
  var screen = document.getElementById('previewScreen_' + id);
  if (!screen) return;

  var bg = getAffBg(id) || 'linear-gradient(135deg,#0f766e,#14b8a6)';
  if (bg && bg.startsWith('#')) bg = bg; // solid
  var formBg = getAffForm(id) || '#ffffff';
  var isWhiteText = getAffTextColor(id) === 'white';
  var textClass = isWhiteText ? 'color:rgba(255,255,255,0.88)' : 'color:#111827';
  var subTextStyle = isWhiteText ? 'color:rgba(255,255,255,0.6)' : 'color:#6b7280';
  var fields = getAffFields(id); // array of {label, required}

  var fieldsHtml = fields.map(function(f) {
    return '<div style="margin-bottom:6px;">'
      + '<div style="font-size:8px;margin-bottom:3px;' + textClass + '">' + escapeHtml(f.label) + (f.required ? ' *' : '') + '</div>'
      + '<div style="background:' + (isWhiteText ? 'rgba(255,255,255,0.1)' : '#f3f4f6') + ';border-radius:5px;height:18px;border:1px solid ' + (isWhiteText ? 'rgba(255,255,255,0.2)' : '#d1d5db') + ';"></div>'
      + '</div>';
  }).join('');

  screen.innerHTML =
    '<div style="min-height:100%;background:' + (bg.startsWith('#') ? bg : 'linear-gradient(135deg,#0f766e,#14b8a6)') + ';padding:12px;display:flex;align-items:flex-start;justify-content:center;">'
    + '<div style="background:' + formBg + ';border-radius:14px;padding:14px;width:100%;box-shadow:0 8px 24px rgba(0,0,0,0.18);">'
    + '<div style="text-align:center;margin-bottom:10px;">'
    + '<div style="width:32px;height:32px;border-radius:50%;background:#0f766e;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;">'
    + '<i class="fas fa-comments" style="color:#fff;font-size:12px;"></i></div>'
    + '<div style="font-size:10px;font-weight:700;' + textClass + '">اسم الشركة</div>'
    + '<div style="font-size:7.5px;margin-top:2px;' + subTextStyle + '">أرسل بياناتك وسيتم التواصل معك</div>'
    + '</div>'
    + '<div style="margin-bottom:6px;"><div style="font-size:8px;margin-bottom:3px;' + textClass + '">الاسم *</div>'
    + '<div style="background:' + (isWhiteText ? 'rgba(255,255,255,0.1)' : '#f3f4f6') + ';border-radius:5px;height:18px;border:1px solid ' + (isWhiteText ? 'rgba(255,255,255,0.2)' : '#d1d5db') + ';"></div></div>'
    + '<div style="margin-bottom:6px;"><div style="font-size:8px;margin-bottom:3px;' + textClass + '">رقم الجوال *</div>'
    + '<div style="background:' + (isWhiteText ? 'rgba(255,255,255,0.1)' : '#f3f4f6') + ';border-radius:5px;height:18px;border:1px solid ' + (isWhiteText ? 'rgba(255,255,255,0.2)' : '#d1d5db') + ';"></div></div>'
    + fieldsHtml
    + '<div style="margin-bottom:6px;"><div style="font-size:8px;margin-bottom:3px;' + textClass + '">رسالتك *</div>'
    + '<div style="background:' + (isWhiteText ? 'rgba(255,255,255,0.1)' : '#f3f4f6') + ';border-radius:5px;height:36px;border:1px solid ' + (isWhiteText ? 'rgba(255,255,255,0.2)' : '#d1d5db') + ';"></div></div>'
    + '<div style="background:#0f766e;border-radius:7px;height:24px;display:flex;align-items:center;justify-content:center;">'
    + '<span style="color:#fff;font-size:9px;font-weight:700;">إرسال</span></div>'
    + '</div>'
    + '</div>';
}
```

Call `updatePreview(id)` whenever any control changes (color pickers, text toggle, field labels/required).

Note: the bg helper should check if the stored value starts with `#`; if empty/null use the gradient fallback matching `buildPublicContactPageHtml` logic.

---

## 4. Custom fields – drag-and-drop builder

### Add SortableJS CDN to the `<head>`
```html
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
```

### Replace the rigid 3-slot grid with a dynamic list

Instead of 3 fixed slots keyed by index (0/1/2), render a `<ul id="fieldsList_<id>">` where each `<li>` is one field card. Users can add up to 3 fields via an "إضافة حقل" button, remove via an ✕ button on each row, and drag to reorder.

Each `<li>` structure:
```html
<li data-field-item class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white mb-2 cursor-grab active:cursor-grabbing"
    style="touch-action:none;">
  <!-- Drag handle -->
  <i class="fas fa-grip-vertical text-gray-300 text-xs shrink-0 cursor-grab"></i>
  <!-- Field type selector -->
  <select class="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white" data-field-type>
    <option value="text">نص</option>
    <option value="number">رقم</option>
    <option value="select">قائمة</option>
    <option value="checkbox">موافقة</option>
  </select>
  <!-- Label input -->
  <input type="text" maxlength="100" placeholder="اسم الحقل"
    class="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-right"
    data-field-label />
  <!-- Required toggle -->
  <label class="flex items-center gap-1 text-xs text-gray-500 shrink-0 select-none cursor-pointer">
    <input type="checkbox" class="rounded text-amber-500" data-field-required /> مطلوب
  </label>
  <!-- Remove -->
  <button type="button" class="text-gray-300 hover:text-red-500 transition-colors shrink-0" data-field-remove>
    <i class="fas fa-times"></i>
  </button>
</li>
```

Initialize SortableJS on the list:
```js
Sortable.create(document.getElementById('fieldsList_' + id), {
  animation: 150,
  handle: '[data-field-type]', // or the grip icon
  ghostClass: 'opacity-40',
  onEnd: function() { updatePreview(id); }
});
```

"إضافة حقل" button (shown only when < 3 fields exist):
```html
<button type="button" id="addFieldBtn_<id>"
  class="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-800 font-medium mt-1">
  <i class="fas fa-plus-circle"></i> إضافة حقل
</button>
```

### Reading fields for save/preview

```js
function getAffFields(id) {
  var list = document.getElementById('fieldsList_' + id);
  if (!list) return [];
  var items = list.querySelectorAll('[data-field-item]');
  var result = [];
  items.forEach(function(li) {
    var label = li.querySelector('[data-field-label]');
    var required = li.querySelector('[data-field-required]');
    var type = li.querySelector('[data-field-type]');
    if (label && label.value.trim()) {
      result.push({
        label: label.value.trim(),
        required: !!(required && required.checked),
        type: (type && type.value) || 'text'
      });
    }
  });
  return result;
}
```

### Save payload change

`collectDesignPayload(id)` should call `getAffFields(id)` instead of the old 3-slot loop. The JSON shape per field is `{ label, required, type }` (the backend already strips to `{ label, required }` — `type` can be passed; the backend ignores unknown keys gracefully, or you can update `parseContactDesignBodyFields` to preserve `type`).

---

## 5. Backend – support `type` in custom fields

In `parseContactDesignBodyFields` inside `src/index.tsx`, update the map that builds `contact_custom_fields` JSON:

```ts
// old:
.map((f: any) => ({ label: String(f.label).trim().slice(0, 100), required: !!f.required }))
// new:
.map((f: any) => {
  const type = ['text','number','select','checkbox'].includes(String(f.type || 'text'))
    ? String(f.type)
    : 'text'
  return { label: String(f.label).trim().slice(0, 100), required: !!f.required, type }
})
```

Also update the same map inside `PATCH /api/my-tenant` (which calls the same helper after refactor — already done).

In `buildPublicContactPageHtml`, update the `CustomField` type and the input renderer to honour `type`:

```ts
type CustomField = { label: string; required: boolean; type?: string }
```

For the rendered input switch on `f.type`:
- `'text'` → `<input type="text" ...>` (current default)
- `'number'` → `<input type="number" inputmode="numeric" ...>`
- `'checkbox'` → `<label class="flex items-center gap-2 ..."><input type="checkbox" ...> ${escapeHtml(f.label)}</label>` (skip the separate `<label>` above)
- `'select'` → not rendered as a full dropdown since options aren't defined; fall back to `<input type="text">` with a note. Skip implementing select for now.

---

## 6. Helper changes summary

The `designPanelHtml(id)` function is currently inline JS inside the server route. After your changes it should:

1. Return the split-pane wrapper HTML (left controls + right preview frame)
2. Not contain any `fillDesignPanel` / `wireDesignPanel` logic — those are separate JS functions called after render

`wireDesignPanel(id, row)` should:
1. Wire all color pickers/texts/swatches → `updatePreview(id)`
2. Wire text color buttons → `updatePreview(id)`
3. Wire SortableJS on `#fieldsList_<id>`
4. Wire "إضافة حقل" and "✕ remove" buttons
5. Wire presets strip
6. Call `fillDesignPanel(id, row)` at the end to load initial data
7. Call `updatePreview(id)` once to initialize the canvas

`fillDesignPanel(id, design)` should:
1. Set swatch backgrounds
2. Set hex text inputs
3. Set text color toggle state
4. Clear `#fieldsList_<id>` and re-render `<li>` items from `design.contact_custom_fields`
5. Show/hide "إضافة حقل" based on field count

---

## 7. Styling rules — do not break these

| Rule | Detail |
|---|---|
| RTL | `lang="ar" dir="rtl"` on `<html>`. All layout should respect RTL. Use `ml-` for icon→text spacing (not `mr-`). |
| Accent color | `amber-500 / amber-600` for primary actions. Do NOT use blue or green as primary buttons. |
| Danger | `red-500 / red-600` for delete/clear actions only. |
| Border radius | Inputs: `rounded-lg`. Cards: `rounded-xl`. Full panels: `rounded-2xl`. |
| Input focus ring | `focus:ring-2 focus:ring-amber-400 focus:border-transparent` |
| Card backgrounds | `bg-white` with `border border-gray-200` or `border border-amber-100`. |
| Panel background | Left pane sections: `bg-gray-50 rounded-xl border border-gray-200 p-4`. |
| Font sizes | Labels: `text-xs`. Body: `text-sm`. Headings inside panels: `text-sm font-bold`. |
| Button sizes | Primary: `px-4 py-2 text-sm font-bold`. Icon buttons: no padding, just color. |
| Shadow on preview | The phone frame: `box-shadow:0 25px 60px rgba(0,0,0,0.45)`. The card inside: `box-shadow:0 8px 24px rgba(0,0,0,0.18)`. |
| No Tailwind `shadow-` for the phone frame | Use `style=` inline — Tailwind's shadow scale isn't deep enough. |

---

## 8. What NOT to change

- Do not touch `buildPublicContactPageHtml` except for the `CustomField` type and `type`-aware input switch described above.
- Do not change any routes outside `/admin/contact-affiliates` and `PATCH /api/tenant-contact-affiliates/:id`.
- Do not change the `/admin/follow-ups` customization panel — it is a separate, simpler panel for company-level settings and should stay as-is.
- Do not add any new CDN scripts other than SortableJS.
- Do not convert any function to async unless it already is.
- Do not change Arabic text in any UI element except what is explicitly listed in this spec.
