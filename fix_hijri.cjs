const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/index.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const MONTH_OPTS = '<option value="">الشهر</option><option value="1">محرم</option><option value="2">صفر</option><option value="3">ربيع الأول</option><option value="4">ربيع الثاني</option><option value="5">جمادى الأولى</option><option value="6">جمادى الثانية</option><option value="7">رجب</option><option value="8">شعبان</option><option value="9">رمضان</option><option value="10">شوال</option><option value="11">ذو القعدة</option><option value="12">ذو الحجة</option>';

function hijriDropdownDiv(prefix, indent) {
  return [
    indent + '<div id="' + prefix + '_hijri_wrap" style="display:none" class="flex-1 min-w-0 flex gap-1 items-center px-1 py-1">',
    indent + '  <select id="' + prefix + '_hijri_day" class="flex-1 min-w-0 px-1 py-2 text-sm border-0 focus:ring-2 focus:ring-blue-500 focus:ring-inset bg-transparent text-right" title="يوم">',
    indent + '    <option value="">يوم</option>',
    indent + '    ${Array.from({length:30},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join(\'\')}',
    indent + '  </select>',
    indent + '  <select id="' + prefix + '_hijri_month" class="flex-1 min-w-0 px-1 py-2 text-sm border-0 focus:ring-2 focus:ring-blue-500 focus:ring-inset bg-transparent text-right" title="الشهر">',
    indent + '    ' + MONTH_OPTS,
    indent + '  </select>',
    indent + '  <select id="' + prefix + '_hijri_year" class="flex-1 min-w-0 px-1 py-2 text-sm border-0 focus:ring-2 focus:ring-blue-500 focus:ring-inset bg-transparent text-right" title="السنة">',
    indent + '    <option value="">السنة</option>',
    indent + '    ${Array.from({length:161},(_,i)=>`<option value="${1300+i}">${1300+i}</option>`).join(\'\')}',
    indent + '  </select>',
    indent + '</div>'
  ];
}

function makeAddScript(prefix, ids, syncVar) {
  const i = '                    ';
  const si = '                  ';
  return [
    si + '<script>',
    si + "  document.addEventListener('DOMContentLoaded', function () {",
    i + "var g = document.getElementById('" + ids.g + "');",
    i + "var hidden = document.getElementById('" + ids.hidden + "');",
    i + "var type = document.getElementById('" + ids.type + "');",
    i + "var lbl = document.getElementById('" + ids.lbl + "');",
    i + "var btnG = document.getElementById('" + ids.btnG + "');",
    i + "var btnH = document.getElementById('" + ids.btnH + "');",
    i + "var hijriWrap = document.getElementById('" + ids.wrap + "');",
    i + "var hijriDay = document.getElementById('" + ids.day + "');",
    i + "var hijriMonth = document.getElementById('" + ids.month + "');",
    i + "var hijriYear = document.getElementById('" + ids.year + "');",
    i + 'var isSyncing = false;',
    i + 'if (!g || !hidden || !type || !lbl || !btnG || !btnH || !hijriWrap || !hijriDay || !hijriMonth || !hijriYear) return;',
    i + 'function extractHP(d) {',
    i + "  var parts = new Intl.DateTimeFormat('en-u-ca-islamic', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);",
    i + "  var y = Number((parts.find(function(p) { return p.type === 'year'; }) || {}).value);",
    i + "  var m = Number((parts.find(function(p) { return p.type === 'month'; }) || {}).value);",
    i + "  var dy = Number((parts.find(function(p) { return p.type === 'day'; }) || {}).value);",
    i + '  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(dy)) return null;',
    i + '  return { year: y, month: m, day: dy };',
    i + '}',
    i + "function gregStr(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }",
    i + 'function findGreg(hp) {',
    i + '  var start = new Date(hp.year + 577, 0, 1, 12, 0, 0), end = new Date(hp.year + 582, 11, 31, 12, 0, 0);',
    i + '  for (var c = new Date(start); c <= end; c.setDate(c.getDate() + 1)) { var cur = extractHP(c); if (cur && cur.year === hp.year && cur.month === hp.month && cur.day === hp.day) return gregStr(c); }',
    i + "  return '';",
    i + '}',
    i + 'function setDD(gv) {',
    i + "  if (!gv) { hijriDay.value = ''; hijriMonth.value = ''; hijriYear.value = ''; return; }",
    i + '  var pts = String(gv).split(\'-\').map(Number), d = new Date(pts[0], pts[1]-1, pts[2], 12, 0, 0);',
    i + '  if (isNaN(d.getTime())) return;',
    i + '  var hp = extractHP(d); if (!hp) return;',
    i + '  hijriYear.value = String(hp.year); hijriMonth.value = String(hp.month); hijriDay.value = String(hp.day);',
    i + '}',
    i + 'function syncFromGregorian() {',
    i + "  if (isSyncing) return; isSyncing = true; hidden.value = g.value || ''; type.value = 'gregorian'; setDD(g.value); isSyncing = false;",
    i + '}',
    i + 'function syncFromHijri() {',
    i + '  if (isSyncing) return;',
    i + '  var y = Number(hijriYear.value), m = Number(hijriMonth.value), d = Number(hijriDay.value);',
    i + '  if (!y || !m || !d) return;',
    i + "  var gv = findGreg({ year: y, month: m, day: d }); if (!gv) return;",
    i + "  isSyncing = true; g.value = gv; hidden.value = gv; type.value = 'hijri'; isSyncing = false;",
    i + '}',
    i + 'function setGregorian() {',
    i + "  g.style.display = ''; hijriWrap.style.display = 'none'; type.value = 'gregorian'; lbl.textContent = 'ميلادي'; hidden.value = g.value || '';",
    i + "  btnG.className = 'px-3 py-2 text-sm font-medium rounded-r-lg bg-blue-600 text-white';",
    i + "  btnH.className = 'px-3 py-2 text-sm font-medium rounded-l-lg text-gray-600 hover:bg-gray-100';",
    i + '}',
    i + 'function setHijri() {',
    i + "  g.style.display = 'none'; hijriWrap.style.display = ''; type.value = 'hijri'; lbl.textContent = 'هجري'; setDD(g.value); hidden.value = g.value || '';",
    i + "  btnG.className = 'px-3 py-2 text-sm font-medium rounded-r-lg text-gray-600 hover:bg-gray-100';",
    i + "  btnH.className = 'px-3 py-2 text-sm font-medium rounded-l-lg bg-blue-600 text-white';",
    i + '}',
    i + 'btnG.onclick = setGregorian; btnH.onclick = setHijri;',
    i + 'g.onchange = syncFromGregorian; g.oninput = syncFromGregorian;',
    i + 'hijriDay.onchange = syncFromHijri; hijriMonth.onchange = syncFromHijri; hijriYear.onchange = syncFromHijri;',
    i + 'syncFromGregorian(); setGregorian();',
    si + '  });',
    si + '</script>'
  ];
}

const dobAddScript = makeAddScript('dob', {
  g: 'date_of_birth_gregorian', hidden: 'date_of_birth', type: 'dob_calendar_type',
  lbl: 'dob_calendar_label', btnG: 'dob_toggle_gregorian', btnH: 'dob_toggle_hijri',
  wrap: 'dob_hijri_wrap', day: 'dob_hijri_day', month: 'dob_hijri_month', year: 'dob_hijri_year'
});

const wsAddScript = makeAddScript('ws', {
  g: 'work_start_date_gregorian', hidden: 'work_start_date', type: 'work_start_calendar_type',
  lbl: 'work_start_calendar_label', btnG: 'work_start_toggle_gregorian', btnH: 'work_start_toggle_hijri',
  wrap: 'work_start_hijri_wrap', day: 'work_start_hijri_day', month: 'work_start_hijri_month', year: 'work_start_hijri_year'
});

const si = '                ';
const editDobScript = [
  si + "var g=document.getElementById('edit_date_of_birth_gregorian'),hidden=document.getElementById('edit_date_of_birth'),type=document.getElementById('edit_dob_calendar_type'),btnG=document.getElementById('edit_dob_toggle_gregorian'),btnH=document.getElementById('edit_dob_toggle_hijri'),hijriWrap=document.getElementById('edit_dob_hijri_wrap'),hijriDay=document.getElementById('edit_dob_hijri_day'),hijriMonth=document.getElementById('edit_dob_hijri_month'),hijriYear=document.getElementById('edit_dob_hijri_year');",
  si + 'if(g&&hidden&&type&&btnG&&btnH&&hijriWrap&&hijriDay&&hijriMonth&&hijriYear){',
  si + '  var isDobSyncing=false;',
  si + "  function editExtractHP(d){var parts=new Intl.DateTimeFormat('en-u-ca-islamic',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);var y=Number((parts.find(function(p){return p.type==='year';})||{}).value),m=Number((parts.find(function(p){return p.type==='month';})||{}).value),dy=Number((parts.find(function(p){return p.type==='day';})||{}).value);if(!Number.isFinite(y)||!Number.isFinite(m)||!Number.isFinite(dy))return null;return{year:y,month:m,day:dy};}",
  si + "  function editGregStr(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}",
  si + '  function editFindGreg(hp){var start=new Date(hp.year+577,0,1,12,0,0),end=new Date(hp.year+582,11,31,12,0,0);for(var c=new Date(start);c<=end;c.setDate(c.getDate()+1)){var cur=editExtractHP(c);if(cur&&cur.year===hp.year&&cur.month===hp.month&&cur.day===hp.day)return editGregStr(c);}return\'\';}',
  si + "  function editSetDD(gv){if(!gv){hijriDay.value='';hijriMonth.value='';hijriYear.value='';return;}var pts=String(gv).split('-').map(Number),d=new Date(pts[0],pts[1]-1,pts[2],12,0,0);if(isNaN(d.getTime()))return;var hp=editExtractHP(d);if(!hp)return;hijriYear.value=String(hp.year);hijriMonth.value=String(hp.month);hijriDay.value=String(hp.day);}",
  si + "  function editSyncFromGreg(){if(isDobSyncing)return;isDobSyncing=true;hidden.value=g.value||'';type.value='gregorian';editSetDD(g.value);isDobSyncing=false;}",
  si + "  function editSyncFromHijri(){if(isDobSyncing)return;var y=Number(hijriYear.value),m=Number(hijriMonth.value),d=Number(hijriDay.value);if(!y||!m||!d)return;var gv=editFindGreg({year:y,month:m,day:d});if(!gv)return;isDobSyncing=true;g.value=gv;hidden.value=gv;type.value='hijri';isDobSyncing=false;}",
  si + "  function setGregorian(){g.style.display='';hijriWrap.style.display='none';type.value='gregorian';hidden.value=g.value||'';btnG.className='px-3 py-2 text-sm font-medium rounded-r-lg bg-blue-600 text-white';btnH.className='px-3 py-2 text-sm font-medium rounded-l-lg text-gray-600 hover:bg-gray-100';}",
  si + "  function setHijri(){g.style.display='none';hijriWrap.style.display='';type.value='hijri';editSetDD(g.value);hidden.value=g.value||'';btnG.className='px-3 py-2 text-sm font-medium rounded-r-lg text-gray-600 hover:bg-gray-100';btnH.className='px-3 py-2 text-sm font-medium rounded-l-lg bg-blue-600 text-white';}",
  si + '  btnG.onclick=setGregorian;btnH.onclick=setHijri;',
  si + '  g.onchange=editSyncFromGreg;g.oninput=editSyncFromGreg;',
  si + '  hijriDay.onchange=editSyncFromHijri;hijriMonth.onchange=editSyncFromHijri;hijriYear.onchange=editSyncFromHijri;',
  si + "  if(cust.dob_calendar_type==='hijri'){setHijri();}else{setGregorian();}",
  si + '}'
];

const editWsScript = [
  si + "var wsG=document.getElementById('edit_work_start_date_gregorian'),wsHidden=document.getElementById('edit_work_start_date'),wsBtnG=document.getElementById('edit_work_start_toggle_gregorian'),wsBtnH=document.getElementById('edit_work_start_toggle_hijri'),wsHijriWrap=document.getElementById('edit_work_start_hijri_wrap'),wsHijriDay=document.getElementById('edit_work_start_hijri_day'),wsHijriMonth=document.getElementById('edit_work_start_hijri_month'),wsHijriYear=document.getElementById('edit_work_start_hijri_year');",
  si + 'if(wsG&&wsHidden&&wsBtnG&&wsBtnH&&wsHijriWrap&&wsHijriDay&&wsHijriMonth&&wsHijriYear){',
  si + '  var isWSSyncing=false;',
  si + "  function wsExtractHP(d){var parts=new Intl.DateTimeFormat('en-u-ca-islamic',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);var y=Number((parts.find(function(p){return p.type==='year';})||{}).value),m=Number((parts.find(function(p){return p.type==='month';})||{}).value),dy=Number((parts.find(function(p){return p.type==='day';})||{}).value);if(!Number.isFinite(y)||!Number.isFinite(m)||!Number.isFinite(dy))return null;return{year:y,month:m,day:dy};}",
  si + "  function wsGregStr(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}",
  si + '  function wsFindGreg(hp){var start=new Date(hp.year+577,0,1,12,0,0),end=new Date(hp.year+582,11,31,12,0,0);for(var c=new Date(start);c<=end;c.setDate(c.getDate()+1)){var cur=wsExtractHP(c);if(cur&&cur.year===hp.year&&cur.month===hp.month&&cur.day===hp.day)return wsGregStr(c);}return\'\';}',
  si + "  function wsSetDD(gv){if(!gv){wsHijriDay.value='';wsHijriMonth.value='';wsHijriYear.value='';return;}var pts=String(gv).split('-').map(Number),d=new Date(pts[0],pts[1]-1,pts[2],12,0,0);if(isNaN(d.getTime()))return;var hp=wsExtractHP(d);if(!hp)return;wsHijriYear.value=String(hp.year);wsHijriMonth.value=String(hp.month);wsHijriDay.value=String(hp.day);}",
  si + "  function wsSyncFromGreg(){if(isWSSyncing)return;isWSSyncing=true;wsHidden.value=wsG.value||'';wsSetDD(wsG.value);isWSSyncing=false;}",
  si + "  function wsSyncFromHijri(){if(isWSSyncing)return;var y=Number(wsHijriYear.value),m=Number(wsHijriMonth.value),d=Number(wsHijriDay.value);if(!y||!m||!d)return;var gv=wsFindGreg({year:y,month:m,day:d});if(!gv)return;isWSSyncing=true;wsG.value=gv;wsHidden.value=gv;isWSSyncing=false;}",
  si + "  function wsSetGregorian(){wsG.style.display='';wsHijriWrap.style.display='none';wsHidden.value=wsG.value||'';wsBtnG.className='px-3 py-2 text-sm font-medium rounded-r-lg bg-blue-600 text-white';wsBtnH.className='px-3 py-2 text-sm font-medium rounded-l-lg text-gray-600 hover:bg-gray-100';}",
  si + "  function wsSetHijri(){wsG.style.display='none';wsHijriWrap.style.display='';wsSetDD(wsG.value);wsHidden.value=wsG.value||'';wsBtnG.className='px-3 py-2 text-sm font-medium rounded-r-lg text-gray-600 hover:bg-gray-100';wsBtnH.className='px-3 py-2 text-sm font-medium rounded-l-lg bg-blue-600 text-white';}",
  si + '  wsBtnG.onclick=wsSetGregorian;wsBtnH.onclick=wsSetHijri;',
  si + '  wsG.onchange=wsSyncFromGreg;wsG.oninput=wsSyncFromGreg;',
  si + '  wsHijriDay.onchange=wsSyncFromHijri;wsHijriMonth.onchange=wsSyncFromHijri;wsHijriYear.onchange=wsSyncFromHijri;',
  si + '  wsSetGregorian();',
  si + '}'
];

// ── Perform replacements bottom-to-top so indices stay valid ──────────────────

// 1. Edit WS JS: lines 23866-23883 (0-idx 23865-23882, 18 lines)
lines.splice(23865, 18, ...editWsScript);
console.log('After editWsScript splice, total lines:', lines.length);

// 2. Edit DOB JS: lines 23846-23865 (0-idx 23845-23864, 20 lines)
// editWsScript.length=17, removed 18 → -1 shift for indices above 23865, doesn't affect 23845
lines.splice(23845, 20, ...editDobScript);
console.log('After editDobScript splice, total lines:', lines.length);

// 3. Edit WS HTML: line 23539 (0-idx 23538, 1 line) → 13-line dropdown div
const wsEditDropdown = hijriDropdownDiv('edit_work_start', '                      ');
lines.splice(23538, 1, ...wsEditDropdown);
console.log('After wsEditDropdown splice, total lines:', lines.length);

// 4. Fix edit DOB gregorian input value (0-idx 23481) to always show birthdate
lines[23481] = lines[23481].replace(
  /value="\$\{\(customer as any\)\.birthdate && \(customer as any\)\.dob_calendar_type !== 'hijri' \? \(customer as any\)\.birthdate : ''\}"/,
  "value=\"${(customer as any).birthdate || ''}\""
);
console.log('Fixed edit DOB gregorian value. Line 23482:', lines[23481].substring(60, 130));

// 5. Edit DOB HTML: line 23483 (0-idx 23482, 1 line) → 13-line dropdown div
const dobEditDropdown = hijriDropdownDiv('edit_dob', '                      ');
lines.splice(23482, 1, ...dobEditDropdown);
console.log('After dobEditDropdown splice, total lines:', lines.length);

// 6. WS script (add form): lines 14709-14903 (0-idx 14708-14902, 195 lines)
lines.splice(14708, 195, ...wsAddScript);
console.log('After wsAddScript splice, total lines:', lines.length);

// 7. WS HTML input (add form): lines 14699-14701 (0-idx 14698-14700, 3 lines) → 13-line dropdown div
const wsAddDropdown = hijriDropdownDiv('work_start', '                    ');
lines.splice(14698, 3, ...wsAddDropdown);
console.log('After wsAddDropdown splice, total lines:', lines.length);

// 8. DOB script (add form): lines 14430-14625 (0-idx 14429-14624, 196 lines)
// Note: DOB HTML dropdown already inserted by prior Edit tool call.
lines.splice(14429, 196, ...dobAddScript);
console.log('After dobAddScript splice, total lines:', lines.length);

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done! File written successfully.');
