// FORGED — app logic + rendering.
// Data model and storage key ('forged3') are unchanged from v1, so existing
// workouts, records, plans and settings carry over untouched.

const $ = id => document.getElementById(id);

let S = { checked:{}, logs:{}, records:{}, streak:0, bestStreak:0, name:'', startDate:null, customExercises:{}, customPlans:{},
  weekAssignment:{...DEFAULT_WEEK}, weekAssignmentB:{...DEFAULT_WEEK}, useAltWeeks:false, notes:[], bwEntries:[], bwUnit:'lbs',
  adhocExercises:{}, exUnits:{}, dayNotes:{}, hiddenExercises:{} };
let curDK = '', curDow = new Date().getDay();
let logExId = '', logFeel = 'good', logSetCount = 3, logWarmupCount = 0;
let editExId = null, editExType = 'reps';
let editPlanId = null, editPlanExes = [], editPlanColor = 'green', editPlanDays = [];
let exportText = '', exportType = 'csv';
const sessionPBs = new Set();

const PLAN_COLORS = { green:'var(--tint)', fire:'var(--orange)', purple:'var(--purple)', blue:'var(--blue)', gold:'var(--gold)' };
const MUSCLE_ORDER = ['legs','back','chest','shoulders','arms','cardio','balance','full'];
const MUSCLE_SHORT = { legs:'Legs', back:'Back', chest:'Chest', shoulders:'Shoulders', arms:'Arms', cardio:'Cardio', balance:'Balance', full:'Full Body' };
const TYPE_LABEL = { reps:'Reps', time:'Timed', weight:'Weight' };
const STRETCH_GROUPS = [
  { key:'hips',  label:'Hips',  ids:['hip-flexor','piriformis','glute','groin','it-band','hip-circle'] },
  { key:'legs',  label:'Legs',  ids:['quad','hamstring','calf','ankle','foam-quad','foam-it'] },
  { key:'back',  label:'Back',  ids:['lower-back','child','cat-cow','thoracic','spinal-twist','lat','foam-upper'] },
  { key:'chest', label:'Chest & Shoulders', ids:['chest','chest-floor','shoulder-cross','shoulder-up','rear-delt'] },
  { key:'arms',  label:'Arms & Neck', ids:['bicep','tricep','wrist','neck','neck-roll'] },
];

// SF Symbol–style glyphs
const I = {
  check: '<svg viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-9"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  ext: '<svg class="chev ext" viewBox="0 0 24 24"><path d="M8 16L16.5 7.5M9.5 7.5h7v7"/></svg>',
  updown: '<svg class="chev updown" viewBox="0 0 24 24"><path d="M8 9l4-4 4 4M8 15l4 4 4-4"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  flame: '<svg viewBox="0 0 24 24"><path d="M12 22c-4.4 0-7.5-2.9-7.5-7 0-4 3.4-6.3 4-10.5 2.7 1.7 4.1 4.1 4.1 6.4 1.1-.7 1.9-1.9 2.2-3.4 2 1.7 3.2 4.4 3.2 7.5 0 4.1-2.6 7-6 7z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24"><path d="M7 3h10v2h3v2.5A4.5 4.5 0 0116.3 12 5 5 0 0113 14.8V17h3v4H8v-4h3v-2.2A5 5 0 017.7 12 4.5 4.5 0 014 7.5V5h3zm0 4H6v.5a2.5 2.5 0 001.2 2.1A5 5 0 017 8zm10 0v1c0 .6-.1 1.1-.2 1.6A2.5 2.5 0 0018 7.5V7z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="M13.5 2L5 13.5h6L10 22l9-12h-6.5z"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24"><path d="M12 2l2.2 6.3L20.5 10.5l-6.3 2.2L12 19l-2.2-6.3-6.3-2.2 6.3-2.2zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg>',
  walk: '<svg viewBox="0 0 24 24"><circle cx="13" cy="4.5" r="2"/><path d="M9 21l2.5-6.5 3 3V21M7.5 11.5l2.5-3.5 4 1 2 3.5h3M10 8l-1.5 5.5"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.3 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.3-3.5-8.5s1-6 3.5-8.5z"/></svg>',
  handle: '<svg viewBox="0 0 24 24"><path d="M5 8h14M5 12h14M5 16h14"/></svg>',
  plates: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="3" height="10" rx="1"/><rect x="18" y="7" width="3" height="10" rx="1"/><rect x="6.5" y="5" width="3" height="14" rx="1"/><rect x="14.5" y="5" width="3" height="14" rx="1"/><path d="M9.5 12h5"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5zM4 20.5A2.5 2.5 0 006.5 23H20v-5"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M3.5 17l5.5-5.5 4 4 7.5-7.5"/></svg>',
};

// ── Storage + helpers ──────────────────────────────────────────────────────
function load() {
  try { const d = localStorage.getItem('forged3'); if (d) S = Object.assign({ notes:[], bwEntries:[], bwUnit:'lbs' }, JSON.parse(d)); } catch (e) {}
  if (!S.startDate) S.startDate = dk(new Date());
  if (!S.notes) S.notes = [];
  if (!S.bwEntries) S.bwEntries = [];
  if (!S.bwUnit) S.bwUnit = 'lbs';
  if (!S.adhocExercises) S.adhocExercises = {};
  if (!S.exUnits) S.exUnits = {};
  if (!S.dayNotes) S.dayNotes = {};
  if (!S.hiddenExercises) S.hiddenExercises = {};
  if (!S.customExercises) S.customExercises = {};
  if (!S.customPlans) S.customPlans = {};
  if (!S.weekAssignment) S.weekAssignment = { ...DEFAULT_WEEK };
  if (!S.weekAssignmentB) S.weekAssignmentB = { ...DEFAULT_WEEK };
  if (typeof S.useAltWeeks === 'undefined') S.useAltWeeks = false;
}
function save() { try { localStorage.setItem('forged3', JSON.stringify(S)); } catch (e) {} }

// Local calendar date (YYYY-MM-DD). v1 used toISOString(), which is UTC and
// rolled "today" over to tomorrow in the evening for North American users.
function dk(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dateOf(key) { return new Date(key + 'T12:00:00'); }
function fmtDate(key, opts) { return dateOf(key).toLocaleDateString('en-CA', opts || { month:'short', day:'numeric' }); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
function allEx() { return Object.assign({}, BX, S.customExercises); }
function allPlans() { return Object.assign({}, BUILTIN_PLANS, S.customPlans); }
function flattenExIds(exercises) { const out = []; (exercises || []).forEach(item => Array.isArray(item) ? item.forEach(id => out.push(id)) : out.push(item)); return out; }
function str(sid) { const s = STRETCHES[sid]; return s ? { name:s.n, dur:s.d, ace:s.a } : null; }
function fmtTime(s) { if (s >= 3600) return Math.round(s / 3600) + ' hr'; if (s >= 60) return Math.round(s / 60) + ' min'; return s + ' sec'; }
function fmtSecs(s) { if (s < 60) return s + ' sec'; const m = Math.floor(s / 60), r = s % 60; return r ? m + ':' + String(r).padStart(2, '0') : m + ' min'; }
function planColor(c) { return PLAN_COLORS[c] || 'var(--tint)'; }
function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

function getExUnit(exId) { return S.exUnits[exId] || 'lbs'; }
function displayWeight(val, unit) {
  if (!val) return '—';
  if (unit === 'kg') return Math.round(val * 0.453592 * 10) / 10 + ' kg';
  return val + ' lbs';
}
function storeWeight(val, unit) { return unit === 'kg' ? Math.round((val / 0.453592) * 10) / 10 : val; }
function convertBw(val, from, to) {
  if (from === to) return val;
  if (from === 'lbs' && to === 'kg') return val * 0.453592;
  if (from === 'kg' && to === 'lbs') return val / 0.453592;
  return val;
}
function targetText(ex) {
  if (ex.type === 'time') return (ex.sets > 1 ? ex.sets + ' × ' : '') + fmtTime(ex.val);
  return ex.sets + ' × ' + ex.val + ' reps';
}
function pbText(id, ex, pb) {
  if (!pb) return '';
  if (ex.type === 'weight') return displayWeight(pb.weight, getExUnit(id)) + ' × ' + (pb.reps || '—');
  if (ex.type === 'time') return fmtSecs(pb.best);
  return pb.totalReps + ' reps';
}

// ── Schedule ───────────────────────────────────────────────────────────────
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
function curWeekIsB() { return getISOWeek(new Date()) % 2 === 0; }
function weekFor(date) { return S.useAltWeeks && getISOWeek(date) % 2 === 0 ? S.weekAssignmentB : S.weekAssignment; }
function planIdForDate(date) { return weekFor(date)[date.getDay()]; }
function getPlanForDay(dow) { return weekFor(new Date())[dow]; }
function planFor(pid) { return pid && pid !== 'rest' && pid !== 'active' ? allPlans()[pid] || null : null; }
function getWeekLabel() { return S.useAltWeeks ? (curWeekIsB() ? 'Week B' : 'Week A') : null; }

function updateStreak() {
  const today = new Date();
  const AP = allPlans();
  let streak = 0;
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const k = dk(d), pid = planIdForDate(d);
    if (!pid || pid === 'rest') continue;               // rest days never count, never break
    const ch = S.checked[k] || {};
    const adhoc = S.adhocExercises[k] || [];
    let done = false;
    if (pid === 'active') {
      done = Object.keys(S.logs[k] || {}).length > 0 || (S.bwEntries || []).some(e => e.date === k) || !!(S.dayNotes || {})[k] || adhoc.some(id => ch[id]);
    } else {
      const plan = AP[pid];
      if (!plan || !plan.exercises.length) continue;
      done = flattenExIds(plan.exercises).some(id => ch[id]) || adhoc.some(id => ch[id]);
    }
    if (done) streak++;
    else if (i > 0) break;                              // today can't break it yet
  }
  S.streak = streak;
  if (streak > (S.bestStreak || 0)) S.bestStreak = streak;
}

// ── Feedback: HUD toast with optional Undo ─────────────────────────────────
const hud = { timer: 0, undo: null };
hud.spring = new Spring({
  onUpdate: p => {
    const el = $('toast');
    el.style.opacity = clamp(p, 0, 1);
    el.style.transform = `translate3d(-50%,${(1 - p) * -70}px,0) scale(${0.9 + 0.1 * p})`;
    el.style.filter = p < 0.99 ? `blur(${(1 - clamp(p, 0, 1)) * 6}px)` : '';
  },
});
function toast(msg, opts = {}) {
  const el = $('toast');
  $('toast-text').textContent = msg;
  $('toast-icon').innerHTML = opts.icon || '';
  $('toast-icon').style.color = opts.color || 'var(--tint)';
  const act = $('toast-action');
  hud.undo = opts.undo || null;
  act.hidden = !hud.undo;
  el.classList.add('show');
  hud.spring.to(1, { damping: 0.8, response: 0.36 });
  clearTimeout(hud.timer);
  hud.timer = setTimeout(hideToast, opts.undo ? 4000 : 2200);
}
function hideToast() {
  clearTimeout(hud.timer);
  $('toast').classList.remove('show');
  hud.spring.to(0, { damping: 1, response: 0.3 });
}
// Every removal is forgivable: snapshot, mutate, offer Undo.
function undoable(label, mutate, rerender) {
  const snap = JSON.stringify(S);
  mutate(); save(); rerender();
  toast(label, { undo: () => { S = JSON.parse(snap); save(); rerender(); haptic(); } });
}

// ── Segmented control ──────────────────────────────────────────────────────
function segmented(el, items, value, onChange) {
  const n = items.length;
  const idx = Math.max(0, items.findIndex(i => i.v === value));
  el.innerHTML = `<span class="seg-thumb" style="width:calc((100% - 4px) / ${n});transform:translateX(${idx * 100}%);left:2px"></span>` +
    items.map(i => `<button class="seg-btn" data-v="${esc(i.v)}" aria-pressed="${i.v === value}">${esc(i.label)}</button>`).join('');
  el.onclick = e => {
    const b = e.target.closest('.seg-btn');
    if (!b || b.getAttribute('aria-pressed') === 'true') return;
    const btns = [...el.querySelectorAll('.seg-btn')];
    btns.forEach(x => x.setAttribute('aria-pressed', x === b));
    el.querySelector('.seg-thumb').style.transform = `translateX(${btns.indexOf(b) * 100}%)`;
    onChange(b.dataset.v);
  };
}

// ── Tabs, nav bars, large titles ───────────────────────────────────────────
let curTab = 'today';
const tabOrder = ['today', 'history', 'plans', 'progress'];
const tabSpring = new Spring({
  onUpdate: v => { $('tab-indicator').style.transform = `translate3d(calc(${v * 100}% + 4px),0,0)`; },
});
function showScreen(name) {
  if (name === curTab) {
    const sc = $('screen-' + name);
    sc.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    return;
  }
  closeOpenSwipe();
  if (name === 'today') renderToday();
  if (name === 'history') renderHistory();
  if (name === 'plans') renderPlans();
  if (name === 'progress') renderStanding();
  const prev = $('screen-' + curTab), next = $('screen-' + name);
  // Tab switches are instant; a cross-fade only when Reduce Motion asks for it.
  if (reduceMotion.matches) { next.classList.add('fading'); setTimeout(() => next.classList.remove('fading'), 220); }
  prev.classList.remove('active');
  next.classList.add('active');
  curTab = name;
  document.querySelectorAll('.tab').forEach(t => {
    const on = t.dataset.tab === name;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on);
  });
  tabSpring.to(tabOrder.indexOf(name), { damping: 1, response: 0.4 });
  updateNavbar(next);
}

// Compact title fades in once the large title slides under the bar; the bar
// becomes material only where content actually scrolls beneath it.
function updateNavbar(sc) {
  const nav = sc.querySelector('.navbar');
  const titleRow = sc.querySelector('.title-row');
  if (!nav || !titleRow) return;
  const st = sc.scrollTop;
  const navH = nav.offsetHeight;
  const titleBottom = titleRow.offsetTop + titleRow.offsetHeight - 8;
  nav.style.setProperty('--edge', clamp(st / 16, 0, 1));
  nav.style.setProperty('--compact', clamp((st + navH - titleBottom) / 14, 0, 1));
  // Pull-down stretches the large title slightly, like iOS.
  const tb = titleRow.querySelector('.title-block');
  if (tb) tb.style.transform = st < 0 ? `scale(${1 + Math.min(-st / 600, 0.08)})` : '';
}
function bindScrollEffects() {
  document.querySelectorAll('.screen').forEach(sc => {
    let ticking = false;
    sc.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; updateNavbar(sc); });
    }, { passive: true });
  });
}

function updateInitials() {
  const n = (S.name || '').trim();
  const initials = n ? n.split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('') : '';
  document.querySelectorAll('.account-initial').forEach(el => { el.textContent = initials; });
}

// ═══ TODAY ═════════════════════════════════════════════════════════════════
let _motto = { key:'', text:'' };
const RING_C = 2 * Math.PI * 37;
const ringSpring = new Spring({
  onUpdate: v => {
    const f = $('ring-fill');
    if (!f) return;
    f.style.strokeDashoffset = RING_C * (1 - clamp(v, 0, 1));
    f.style.opacity = v > 0.004 ? 1 : 0; // a zero-length round cap would draw a dot
  },
});

function todayModel() {
  const now = new Date();
  const pid = planIdForDate(now), plan = planFor(pid);
  const AX = allEx();
  const hidden = (S.hiddenExercises || {})[curDK] || [];
  const blocks = [];
  if (plan) plan.exercises.forEach(item => {
    if (Array.isArray(item)) {
      const ids = item.filter(id => !hidden.includes(id) && AX[id]);
      if (ids.length > 1) blocks.push({ ids, ss:true });
      else if (ids.length) blocks.push({ ids });
    } else if (!hidden.includes(item) && AX[item]) blocks.push({ ids:[item] });
  });
  const planIds = blocks.flatMap(b => b.ids);
  (S.adhocExercises[curDK] || []).forEach(id => {
    if (AX[id] && !planIds.includes(id)) blocks.push({ ids:[id], extra:true });
  });
  const all = blocks.flatMap(b => b.ids);
  const ch = S.checked[curDK] || {};
  return { pid, plan, blocks, all, done: all.filter(id => ch[id]).length, total: all.length };
}

function renderToday() {
  const now = new Date();
  curDow = now.getDay();
  curDK = dk(now);
  const m = todayModel();
  const wk = getWeekLabel();
  $('today-date').textContent = now.toLocaleDateString('en-CA', { weekday:'long', month:'long', day:'numeric' }) + (wk ? ' · ' + wk : '');
  const mk = curDK + '|' + m.pid;
  if (_motto.key !== mk) _motto = { key: mk, text: getMotivMsg(now.getHours(), m.pid, m.plan, S.streak || 0) };
  $('today-motto').textContent = _motto.text;

  const c = $('today-content');
  let h = '';
  if (m.plan) {
    h += `<section class="card summary">
      <div class="ring" role="img" aria-label="Workout progress"><svg viewBox="0 0 84 84"><circle class="track" cx="42" cy="42" r="37"/><circle class="fill" id="ring-fill" cx="42" cy="42" r="37" stroke-dasharray="${RING_C.toFixed(1)}" stroke-dashoffset="${RING_C.toFixed(1)}"/></svg><div class="ring-label" id="ring-label"></div></div>
      <div class="summary-main">
        <div class="summary-kicker">${wk ? esc(wk) : 'Workout'}</div>
        <div class="summary-title">${esc(m.plan.name)}</div>
        <div class="summary-sub" id="summary-sub"></div>
        <div class="streak" id="today-streak"></div>
      </div>
    </section>`;
  } else {
    const active = m.pid === 'active';
    h += `<section class="card rest-hero">
      <div class="glyph">${active ? I.walk : I.moon}</div>
      <h2>${active ? 'Active Day' : 'Rest Day'}</h2>
      <p>${active ? 'Go do something you love. This is the whole point.' : 'Muscles grow during recovery. Rest hard.'}</p>
      <div class="streak" id="today-streak"></div>
    </section>`;
  }

  // Workout list (plan + extras) with Add as the last row
  h += `<div class="section-title-row"><h2 class="section-title">${m.plan ? 'Workout' : 'Extras'}</h2><span class="section-meta" id="summary-count"></span></div>`;
  h += '<div class="list" id="workout-list">';
  m.blocks.forEach(b => {
    if (b.ss) h += `<div class="ss-group"><div class="ss-label">Superset</div>${b.ids.map(id => exRowHTML(id, b)).join('')}</div>`;
    else h += exRowHTML(b.ids[0], b);
  });
  h += `<button class="row add-row nav-row" data-action="add">${I.plus}<span class="row-main"><span class="row-title">Add Exercise</span></span></button>`;
  h += '</div>';
  if (m.pid === 'active') h += '<p class="list-footer">Anything you log today keeps your streak going.</p>';

  h += '<div id="today-stretches"></div>';

  // Session note — saves as you type
  h += `<h2 class="section-title">Notes</h2><div class="list"><textarea class="note-area" id="day-note-input" rows="1" placeholder="How are you feeling today?">${esc((S.dayNotes || {})[curDK] || '')}</textarea></div>`;

  h += renderUpcomingHTML();
  c.innerHTML = h;

  c.querySelectorAll('#workout-list .swipe').forEach(el => {
    const id = el.dataset.id, extra = el.dataset.extra === '1';
    swipeRow(el, () => removeFromToday(id, extra));
  });
  const ta = $('day-note-input');
  const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
  fit();
  ta.addEventListener('input', () => {
    fit();
    const t = ta.value.trim();
    if (t) S.dayNotes[curDK] = t; else delete S.dayNotes[curDK];
    save();
  });
  ta.addEventListener('blur', () => { updateStreak(); save(); updateTodaySummary(); });

  renderTodayStretches();
  ringSpring.set(0);
  updateTodaySummary();
}

function exRowHTML(id, block) {
  const AX = allEx(), ex = AX[id];
  const ch = S.checked[curDK] || {};
  const done = !!ch[id];
  const log = (S.logs[curDK] || {})[id];
  const pb = S.records[id];
  const last = getLastSession(id, curDK);
  const bits = [];
  if (pb) bits.push(`<span class="pb-text">PB ${esc(pbText(id, ex, pb))}</span>`);
  if (last) bits.push(`<span>Last ${esc(last)}</span>`);
  return `<div class="swipe" data-id="${id}" data-extra="${block.extra ? 1 : 0}">
    <div class="swipe-action"><span>Remove</span></div>
    <div class="swipe-content row ex-row${done ? ' done' : ''}">
      <button class="check${done ? ' done' : ''}" data-check="${id}" aria-label="Mark ${esc(ex.name)} done" aria-pressed="${done}">${I.check}</button>
      <div class="row-main" data-log="${id}">
        <div class="row-title">${esc(ex.name)}${block.extra ? '<span class="tag">Extra</span>' : ''}${sessionPBs.has(id) ? '<span class="tag pb">New PB</span>' : ''}</div>
        <div class="row-sub">${esc(targetText(ex))}</div>
        ${bits.length ? `<div class="row-sub ex-meta-line">${bits.join('')}</div>` : ''}
      </div>
      <button class="pill${log ? ' done' : ''}" data-log="${id}">${log ? I.check + 'Logged' : 'Log'}</button>
    </div>
  </div>`;
}

function updateTodaySummary() {
  const m = todayModel();
  const pct = m.total ? m.done / m.total : 0;
  const lbl = $('ring-label');
  if (lbl) lbl.textContent = Math.round(pct * 100) + '%';
  const sub = $('summary-sub');
  if (sub) sub.textContent = m.total ? `${m.done} of ${m.total} done` : 'Nothing scheduled';
  const cnt = $('summary-count');
  if (cnt) cnt.textContent = m.total ? `${m.done} of ${m.total}` : '';
  const st = $('today-streak');
  if (st) st.innerHTML = S.streak ? `${I.flame}${S.streak}-day streak` : '';
  ringSpring.to(pct, { damping: 1, response: 0.5 });
}

function toggleCheck(id) {
  if (!S.checked[curDK]) S.checked[curDK] = {};
  const v = !S.checked[curDK][id];
  S.checked[curDK][id] = v;
  updateStreak(); save();
  document.querySelectorAll(`#today-content [data-check="${id}"]`).forEach(b => {
    b.classList.toggle('done', v);
    b.setAttribute('aria-pressed', v);
    b.closest('.ex-row').classList.toggle('done', v);
  });
  const m = todayModel();
  if (v) {
    haptic(m.done === m.total ? [12, 60, 12] : 10);
    if (m.done === m.total && m.total > 1) toast('Workout complete', { icon: I.check.replace('<svg', '<svg style="stroke:currentColor;stroke-width:3;fill:none;stroke-linecap:round"') });
  }
  updateTodaySummary();
  renderTodayStretches();
}

function removeFromToday(id, extra) {
  undoable('Removed from today', () => {
    if (extra) {
      S.adhocExercises[curDK] = (S.adhocExercises[curDK] || []).filter(x => x !== id);
    } else {
      if (!S.hiddenExercises[curDK]) S.hiddenExercises[curDK] = [];
      if (!S.hiddenExercises[curDK].includes(id)) S.hiddenExercises[curDK].push(id);
    }
  }, renderToday);
}

function addAdhocEx(id) {
  if (!id) return;
  if (!S.adhocExercises[curDK]) S.adhocExercises[curDK] = [];
  if (S.adhocExercises[curDK].includes(id)) return;
  S.adhocExercises[curDK].push(id);
  // Re-adding a plan exercise that was swiped away un-hides it instead.
  const hid = S.hiddenExercises[curDK];
  if (hid && hid.includes(id)) S.hiddenExercises[curDK] = hid.filter(x => x !== id);
  save();
  renderToday();
}

function stretchRowsHTML(ids) {
  return ids.map(sid => {
    const s = str(sid); if (!s) return '';
    const link = s.ace && s.ace !== '#';
    return `<${link ? `a href="${esc(s.ace)}" target="_blank" rel="noopener"` : 'div'} class="row${link ? ' nav-row' : ''}">
      <span class="row-main"><span class="row-title">${esc(s.name)}</span></span>
      <span class="row-value">${esc(s.dur)}</span>${link ? I.ext : ''}
    </${link ? 'a' : 'div'}>`;
  }).join('');
}

function renderTodayStretches() {
  const el = $('today-stretches');
  if (!el) return;
  const AX = allEx();
  const m = todayModel();
  const ch = S.checked[curDK] || {};
  let title, meta = '', ids = [];
  if (m.plan) {
    const doneIds = m.all.filter(id => ch[id]);
    if (!doneIds.length) { el.innerHTML = ''; return; }
    const set = new Set();
    doneIds.forEach(id => (AX[id].stretches || []).forEach(s => set.add(s)));
    ids = [...set].slice(0, 8);
    const all = m.done === m.total;
    title = all ? 'Cool-Down' : 'Stretches';
    meta = all ? 'Workout complete' : 'For what you’ve finished';
  } else {
    // Rest day: prime tomorrow's muscles, or a general routine
    const MUSCLE_STRETCHES = {
      legs:['hip-flexor','quad','hamstring','calf','piriformis','glute','it-band'], back:['child','lower-back','spinal-twist','thoracic','lat','cat-cow'],
      chest:['chest','chest-floor','shoulder-cross','thoracic','rear-delt'], shoulders:['shoulder-cross','shoulder-up','neck','rear-delt','thoracic'],
      arms:['bicep','tricep','wrist','shoulder-cross'], cardio:['hip-flexor','hamstring','calf','quad','lower-back','it-band'],
      balance:['hip-flexor','hamstring','ankle','hip-circle','child'], full:['hip-flexor','hamstring','chest','thoracic','lower-back','child'],
    };
    const GENERAL = ['hip-flexor','hamstring','piriformis','calf','chest','child','spinal-twist','lower-back'];
    const set = new Set(), muscles = new Set();
    const tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
    const tPlan = planFor(planIdForDate(tmr));
    const adhoc = S.adhocExercises[curDK] || [];
    adhoc.forEach(id => AX[id] && muscles.add(AX[id].muscle));
    title = 'Daily Stretch';
    if (tPlan) {
      flattenExIds(tPlan.exercises).forEach(id => { const ex = AX[id]; if (ex) { muscles.add(ex.muscle); (ex.stretches || []).forEach(s => set.add(s)); } });
      title = 'Pre-Workout Stretch';
      meta = 'For tomorrow';
    }
    adhoc.forEach(id => { const ex = AX[id]; if (ex) (ex.stretches || []).forEach(s => set.add(s)); });
    if (!set.size) muscles.forEach(mu => (MUSCLE_STRETCHES[mu] || []).forEach(s => set.add(s)));
    ids = set.size ? [...set].slice(0, 8) : GENERAL;
  }
  el.innerHTML = `<div class="section-title-row"><h2 class="section-title">${title}</h2><span class="section-meta">${esc(meta)}</span></div>
    <div class="list">${stretchRowsHTML(ids)}</div>`;
}

function renderUpcomingHTML() {
  const AX = allEx();
  let rows = '';
  for (let i = 1; i <= 6; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const pid = planIdForDate(d), plan = planFor(pid);
    let name, sub;
    if (plan) {
      const ids = flattenExIds(plan.exercises);
      name = plan.name;
      sub = ids.slice(0, 3).map(id => AX[id] ? AX[id].name : '').filter(Boolean).join(' · ') + (ids.length > 3 ? ` +${ids.length - 3}` : '');
    } else if (pid === 'active') { name = 'Active day'; sub = 'Go do something you love'; }
    else { name = 'Rest day'; sub = ''; }
    rows += `<div class="row">
      <span class="day-name">${DAYS_S[d.getDay()]}</span>
      <span class="dot" style="--c:${plan ? planColor(plan.color) : 'var(--fill)'}"></span>
      <span class="row-main"><span class="row-title one-line${plan ? '' : '" style="color:var(--label2)'}">${esc(name)}</span>${sub ? `<span class="row-sub one-line">${esc(sub)}</span>` : ''}</span>
    </div>`;
  }
  return `<h2 class="section-title">Coming Up</h2><div class="list">${rows}</div>`;
}

function getLastSession(exId, excludeDate) {
  const ex = allEx()[exId];
  if (!ex) return null;
  const dates = Object.keys(S.logs).sort().reverse();
  for (const d of dates) {
    if (d === excludeDate) continue;
    const log = (S.logs[d] || {})[exId];
    if (!log || !log.sets || !log.sets.length) continue;
    if (ex.type === 'weight') {
      const mW = Math.max(...log.sets.map(s => s.weight || 0)), mR = Math.max(...log.sets.map(s => s.reps || 0));
      if (mW > 0) return displayWeight(mW, getExUnit(exId)) + ' × ' + mR;
    } else if (ex.type === 'time') return fmtSecs(Math.max(...log.sets.map(s => s.secs || 0)));
    else return log.sets.reduce((a, b) => a + (b.reps || 0), 0) + ' reps';
  }
  return null;
}

// ═══ LOG SHEET ═════════════════════════════════════════════════════════════
function openLogModal(exId) {
  const ex = allEx()[exId];
  if (!ex) return;
  logExId = exId;
  const isTime = ex.type === 'time', isWeight = ex.type === 'weight';
  $('lm-title').textContent = ex.name;
  $('lm-sub').textContent = isWeight ? 'Weight × reps' : isTime ? 'Time held' : 'Reps per set';
  $('lm-note').value = '';

  // Benchmarks
  const pb = S.records[exId], last = getLastSession(exId, curDK);
  let h = '';
  if (pb) {
    const tiles = [];
    if (isWeight) {
      tiles.push(['Record', pb.weight ? displayWeight(pb.weight, getExUnit(exId)) : '—', 'var(--gold)']);
      tiles.push(['Reps', pb.reps || '—', '']);
    } else if (isTime) tiles.push(['Best', fmtSecs(pb.best), 'var(--gold)']);
    else tiles.push(['Best total', pb.totalReps + ' reps', 'var(--gold)']);
    tiles.push(['Set on', pb.date ? fmtDate(pb.date) : '—', '']);
    h += `<div class="bench" style="grid-template-columns:repeat(${tiles.length},1fr)">${tiles.map(([l, v, c]) =>
      `<div class="tile"><div class="tile-label" ${c ? `style="--c:${c}"` : ''}>${l}</div><div class="tile-value">${esc(v)}</div></div>`).join('')}</div>`;
  }
  if (last) h += `<div class="last-line">Last session: <strong>${esc(last)}</strong></div>`;
  $('lm-prev').innerHTML = h;

  // Progression suggestion
  const prog = calcProgression(exId);
  let ph = '';
  if (prog) {
    let big = '', sub = '';
    if (prog.type === 'weight') {
      big = `${displayWeight(prog.suggestedWeight, getExUnit(exId))} × ${prog.suggestedReps}`;
      sub = `${prog.targetSets} sets · est. 1RM ${displayWeight(prog.e1rm, getExUnit(exId))}`;
    } else if (prog.type === 'time') big = `${prog.suggestedSecs} sec hold`;
    else big = `${prog.suggestedReps} reps per set`;
    ph = `<div class="suggest">
      <div class="suggest-head">${I.sparkle}Suggested today</div>
      <div class="suggest-big">${esc(big)}</div>${sub ? `<div class="suggest-sub">${esc(sub)}</div>` : ''}
      <div class="suggest-reason">${esc(prog.reason)}</div>
      <button class="btn gray" onclick="applyProgression('${exId}')">Use Suggestion</button>
    </div>`;
  }
  $('lm-prog').innerHTML = ph;

  const existing = (S.logs[curDK] || {})[exId];
  logSetCount = existing ? existing.sets.length : (ex.sets || 3);
  logWarmupCount = existing && existing.warmups ? existing.warmups.length : 0;
  renderLogOptions(ex);
  renderWarmupGrid(ex, existing);
  renderSetRows(ex, existing);

  logFeel = existing ? existing.feel || 'good' : 'good';
  segmented($('feel-seg'), [{ v:'easy', label:'Easy' }, { v:'good', label:'Good' }, { v:'hard', label:'Hard' }], logFeel, v => { logFeel = v; });

  let links = '';
  if (isWeight) links += `<button class="btn plain" onclick="openPlatesFromLog()">${I.plates.replace('<svg', '<svg style="stroke-width:1.8"')}Plate Calculator</button>`;
  if (ex.ace || ex.yt) links += `<a class="btn plain" href="${esc(ex.ace || ex.yt)}" target="_blank" rel="noopener">${I.book.replace('<svg', '<svg style="stroke-width:1.8"')}How to Do It</a>`;
  $('lm-links').innerHTML = links;
  Sheets.open('log-modal');
}

function renderLogOptions(ex) {
  const el = $('lm-options');
  if (ex.type !== 'weight') { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="form-list options">
    <div class="form-row"><span class="form-key">Unit</span><span style="flex:1"></span><div class="segmented small" id="lm-unit-seg" style="width:120px"></div></div>
    <div class="form-row"><span class="form-key">Warm-up sets</span><span style="flex:1"></span>
      <div class="stepper"><button onclick="adjustWarmup(-1)" aria-label="Fewer warm-up sets"><svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg></button><i></i><span id="warmup-count-display">${logWarmupCount}</span><i></i><button onclick="adjustWarmup(1)" aria-label="More warm-up sets"><svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg></button></div>
    </div>
  </div>`;
  segmented($('lm-unit-seg'), [{ v:'lbs', label:'lbs' }, { v:'kg', label:'kg' }], getExUnit(logExId), setExUnit);
}

function setExUnit(unit) {
  const from = getExUnit(logExId);
  // Typed weights convert with the unit so 100 lbs doesn't become 100 kg.
  const vals = readSetInputs().map(v => ({ r: v.r, w: v.w === '' ? '' : Math.round(convertBw(parseFloat(v.w) || 0, from, unit) * 10) / 10 }));
  S.exUnits[logExId] = unit;
  save();
  const ex = allEx()[logExId];
  renderWarmupGrid(ex, (S.logs[curDK] || {})[logExId]);
  renderSetRows(ex, null, vals);
}

// Current typed values, so re-rendering (add set, unit change) never loses input.
function readSetInputs() {
  const out = [];
  for (let i = 0; i < logSetCount; i++) {
    const r = $('si-r-' + i), w = $('si-w-' + i);
    out.push({ r: r ? r.value : '', w: w ? w.value : '' });
  }
  return out;
}

function renderSetRows(ex, existing, typed) {
  const isTime = ex.type === 'time', isWeight = ex.type === 'weight';
  const unit = isWeight ? getExUnit(logExId) : '';
  const cls = isWeight ? '' : ' two';
  let h = '';
  if (logWarmupCount > 0 && isWeight) h += '<div class="sets-caption">Working sets</div>';
  h += `<div class="sets-head${cls}"><span>Set</span><span>${isTime ? 'Seconds' : 'Reps'}</span>${isWeight ? `<span>${unit}</span>` : ''}</div>`;
  for (let i = 0; i < logSetCount; i++) {
    const pset = existing && existing.sets[i] ? existing.sets[i] : {};
    let r = isTime ? (pset.secs || ex.val) : (pset.reps || ex.val);
    let w = pset.weight ? (unit === 'kg' ? Math.round(pset.weight * 0.453592 * 10) / 10 : pset.weight) : '';
    if (typed && typed[i]) { r = typed[i].r; w = typed[i].w; }
    else if (typed && i > 0 && typed[i - 1]) { r = typed[i - 1].r; w = typed[i - 1].w; } // new set copies the one above
    h += `<div class="set-row${cls}"><span class="set-num">${i + 1}</span>
      <input class="set-input" type="number" inputmode="numeric" id="si-r-${i}" value="${esc(r)}" min="0" aria-label="Set ${i + 1} ${isTime ? 'seconds' : 'reps'}">
      ${isWeight ? `<input class="set-input" type="number" inputmode="decimal" id="si-w-${i}" value="${esc(w)}" placeholder="${unit}" min="0" aria-label="Set ${i + 1} weight">` : ''}
    </div>`;
  }
  $('sets-grid').innerHTML = h;
}

function addSetRow() {
  const typed = readSetInputs();
  logSetCount++;
  typed.push(typed[typed.length - 1] || null);
  renderSetRows(allEx()[logExId], null, typed);
  haptic();
}

function adjustWarmup(delta) {
  const n = Math.max(0, Math.min(5, logWarmupCount + delta));
  if (n === logWarmupCount) return;
  const typed = readSetInputs();
  logWarmupCount = n;
  $('warmup-count-display').textContent = n;
  const ex = allEx()[logExId];
  renderWarmupGrid(ex, (S.logs[curDK] || {})[logExId]);
  renderSetRows(ex, null, typed);
}

function renderWarmupGrid(ex, existing) {
  const grid = $('warmup-grid');
  if (!logWarmupCount || !ex || ex.type !== 'weight') { grid.innerHTML = ''; return; }
  const unit = getExUnit(logExId);
  const prevWarm = existing && existing.warmups ? existing.warmups : [];
  // Reference: most recent working weight, else the record
  let ref = (S.records[logExId] || {}).weight || 0;
  for (const d of Object.keys(S.logs).sort().reverse()) {
    const lg = (S.logs[d] || {})[logExId];
    if (lg && lg.sets) { const mx = Math.max(...lg.sets.map(s => s.weight || 0)); if (mx > 0) { ref = mx; break; } }
  }
  const pcts = [0.5, 0.7, 0.85, 0.9, 0.95];
  let h = `<div class="sets-caption warm">Warm-up <span>Not counted toward records</span></div>
    <div class="sets-head"><span>Set</span><span>Reps</span><span>${unit}</span></div>`;
  for (let i = 0; i < logWarmupCount; i++) {
    const pw = prevWarm[i] || {};
    const w = pw.weight ? (unit === 'kg' ? Math.round(pw.weight * 0.453592 * 10) / 10 : pw.weight)
      : ref ? Math.round(ref * (pcts[i] || 0.5) / 5) * 5 : '';
    const r = pw.reps || [8, 5, 3, 2, 1][i] || 5;
    h += `<div class="set-row"><span class="set-num" style="color:var(--orange)">W${i + 1}</span>
      <input class="set-input warm" type="number" inputmode="numeric" id="wu-r-${i}" value="${esc(r)}" min="0">
      <input class="set-input warm" type="number" inputmode="decimal" id="wu-w-${i}" value="${esc(w)}" placeholder="${unit}" min="0">
    </div>`;
  }
  grid.innerHTML = h;
}

function applyProgression(exId) {
  const prog = calcProgression(exId);
  if (!prog) return;
  const unit = getExUnit(exId);
  for (let i = 0; i < logSetCount; i++) {
    const w = $('si-w-' + i), r = $('si-r-' + i);
    if (prog.type === 'weight') {
      if (w) w.value = unit === 'kg' ? Math.round(prog.suggestedWeight * 0.453592 * 10) / 10 : prog.suggestedWeight;
      if (r) r.value = prog.suggestedReps;
    } else if (prog.type === 'time') { if (r) r.value = prog.suggestedSecs; }
    else if (r) r.value = prog.suggestedReps;
  }
  haptic();
  toast('Targets filled in');
}

function saveLog() {
  const ex = allEx()[logExId];
  if (!ex) return;
  const isTime = ex.type === 'time', isWeight = ex.type === 'weight';
  const unit = getExUnit(logExId);
  const warmups = [];
  if (isWeight) for (let i = 0; i < logWarmupCount; i++) {
    const wr = $('wu-r-' + i), ww = $('wu-w-' + i);
    warmups.push({ reps: parseInt(wr ? wr.value : 0) || 0, weight: storeWeight(parseFloat(ww ? ww.value : 0) || 0, unit), unit, warmup: true });
  }
  const sets = [];
  let bestVal = 0, bestW = 0, bestR = 0;
  for (let i = 0; i < logSetCount; i++) {
    const r = $('si-r-' + i), rv = parseInt(r ? r.value : 0) || 0;
    if (isWeight) {
      const w = $('si-w-' + i), wv = storeWeight(parseFloat(w ? w.value : 0) || 0, unit);
      sets.push({ reps: rv, weight: wv, unit });
      const vol = wv * rv;
      if (vol > bestVal) { bestVal = vol; bestW = wv; bestR = rv; }
    } else if (isTime) { sets.push({ secs: rv }); bestVal = Math.max(bestVal, rv); }
    else { sets.push({ reps: rv }); bestVal += rv; }
  }
  const note = $('lm-note').value.trim();
  if (!S.logs[curDK]) S.logs[curDK] = {};
  S.logs[curDK][logExId] = { sets, warmups: warmups.length ? warmups : undefined, feel: logFeel };
  if (note) S.notes.unshift({ exId: logExId, text: note, date: curDK });
  const prev = S.records[logExId];
  const prevVal = prev ? (isTime ? prev.best : isWeight ? prev.best : prev.totalReps) : 0;
  let isPB = false;
  if (bestVal > prevVal) {
    if (isWeight) S.records[logExId] = { best: bestVal, weight: bestW, reps: bestR, date: curDK, feel: logFeel };
    else if (isTime) S.records[logExId] = { best: bestVal, date: curDK, feel: logFeel };
    else S.records[logExId] = { totalReps: bestVal, date: curDK, feel: logFeel };
    sessionPBs.add(logExId);
    isPB = true;
  }
  if (!S.checked[curDK]) S.checked[curDK] = {};
  S.checked[curDK][logExId] = true;
  updateStreak(); save();
  Sheets.close('log-modal');
  renderToday();
  if (isPB) { haptic([12, 50, 12]); toast('New personal best', { icon: I.trophy.replace('<svg', '<svg style="fill:currentColor"'), color: 'var(--gold)' }); }
  else haptic();
  const logged = sets.filter(s => (s.reps || 0) > 0 || (s.secs || 0) > 0 || (s.weight || 0) > 0).length;
  startRestTimer(ex.type, ex.name, logged, ex.sets || logSetCount);
}

// ═══ EXERCISE PICKER ═══════════════════════════════════════════════════════
let pickerMode = 'today', pickerMuscle = 'all';
function openPicker(mode) {
  pickerMode = mode;
  pickerMuscle = 'all';
  $('picker-search').value = '';
  $('picker-title').textContent = mode === 'plan' ? 'Exercises' : 'Add to Today';
  renderPickerChips();
  renderPicker();
  Sheets.open('picker-modal');
}
function muscleChips(el, active, onPick) {
  const AX = allEx();
  const groups = MUSCLE_ORDER.filter(m => Object.values(AX).some(e => e.muscle === m));
  el.innerHTML = [['all', 'All'], ...groups.map(m => [m, MUSCLE_SHORT[m]])].map(([v, l]) =>
    `<button class="chip" data-v="${v}" aria-pressed="${v === active}">${l}</button>`).join('');
  el.onclick = e => {
    const b = e.target.closest('.chip'); if (!b) return;
    el.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b));
    onPick(b.dataset.v);
  };
}
function renderPickerChips() { muscleChips($('picker-chips'), pickerMuscle, v => { pickerMuscle = v; $('picker-list').scrollTop = 0; renderPicker(); }); }

function pickerState(id) {
  if (pickerMode === 'plan') return flattenExIds(editPlanExes).includes(id) ? 'on' : 'off';
  if ((S.adhocExercises[curDK] || []).includes(id)) return 'on';
  const m = todayModel();
  return m.all.includes(id) ? 'plan' : 'off';
}

function filteredExIds(query, muscle) {
  const AX = allEx();
  const q = (query || '').trim().toLowerCase();
  return Object.keys(AX).filter(id => (muscle === 'all' || AX[id].muscle === muscle) && (!q || AX[id].name.toLowerCase().includes(q)));
}

function renderPicker() {
  const AX = allEx();
  const ids = filteredExIds($('picker-search').value, pickerMuscle);
  let h = '';
  MUSCLE_ORDER.forEach(mu => {
    const group = ids.filter(id => AX[id].muscle === mu).sort((a, b) => AX[a].name.localeCompare(AX[b].name));
    if (!group.length) return;
    h += `<div class="lib-section">${MUSCLE_LABELS[mu] || mu}</div><div class="list">`;
    group.forEach(id => {
      const ex = AX[id], st = pickerState(id), pb = S.records[id];
      h += `<button class="row tap-row" data-pick="${id}" ${st === 'plan' ? 'disabled' : ''}>
        <span class="row-main"><span class="row-title">${esc(ex.name)}</span>
        <span class="row-sub">${st === 'plan' ? 'Already in today’s plan' : esc(targetText(ex))}${pb && st !== 'plan' ? ` · <span class="pb-text">PB ${esc(pbText(id, ex, pb))}</span>` : ''}</span></span>
        <span class="sel-mark${st !== 'off' ? ' on' : ''}${st === 'plan' ? ' dim' : ''}">${I.check}</span>
      </button>`;
    });
    h += '</div>';
  });
  if (!h) h = '<div class="empty"><strong>No Results</strong>Try a different search or create your own.</div>';
  h += `<div class="list" style="margin-top:24px"><button class="row add-row nav-row" onclick="openAddExModal()">${I.plus}<span class="row-main"><span class="row-title">New Custom Exercise</span></span></button></div>`;
  const list = $('picker-list');
  list.innerHTML = h;
  list.onclick = e => {
    const r = e.target.closest('[data-pick]');
    if (!r || r.disabled) return;
    togglePick(r.dataset.pick, r);
  };
}

function togglePick(id, row) {
  const st = pickerState(id);
  if (pickerMode === 'plan') {
    if (st === 'on') {
      editPlanExes = editPlanExes.map(it => Array.isArray(it) ? it.filter(x => x !== id) : it).filter(it => Array.isArray(it) ? it.length : it !== id)
        .map(it => Array.isArray(it) && it.length === 1 ? it[0] : it);
    } else editPlanExes.push(id);
    renderPlanExList();
  } else {
    if (st === 'on') S.adhocExercises[curDK] = (S.adhocExercises[curDK] || []).filter(x => x !== id);
    else addAdhocEx(id);
    save();
    renderToday();
  }
  const on = pickerState(id) === 'on';
  row.querySelector('.sel-mark').classList.toggle('on', on);
  haptic();
}

// ═══ REST TIMER ════════════════════════════════════════════════════════════
const REST_DURATIONS = { weight: 90, reps: 60, time: 30 };
const REST_C = 2 * Math.PI * 19;
const rest = { endAt: 0, total: 0, interval: 0, setsDone: 0, setsTotal: 0, name: '', finished: false, drag: 0 };
rest.presence = new Spring({ onUpdate: () => paintRestPill() });
rest.dragSpring = new Spring({ onUpdate: v => { rest.drag = v; paintRestPill(); } });

function paintRestPill() {
  const el = $('rest-timer-bar');
  const p = clamp(rest.presence.value, 0, 1.2);
  const y = (1 - p) * 30 + rest.drag;
  el.style.transform = `translate3d(-50%,${y}px,0) scale(${0.92 + 0.08 * Math.min(p, 1)})`;
  el.style.opacity = clamp(p, 0, 1) * (1 - clamp(rest.drag / 120, 0, 1) * 0.7);
  el.style.filter = p < 0.98 ? `blur(${(1 - clamp(p, 0, 1)) * 8}px)` : '';
}

function startRestTimer(exType, exName, setsDone, setsTotal) {
  rest.total = REST_DURATIONS[exType] || 60;
  rest.endAt = Date.now() + rest.total * 1000;
  rest.name = exName;
  rest.setsDone = setsDone || 0;
  rest.setsTotal = setsTotal || 0;
  rest.finished = false;
  $('rest-timer-bar').classList.remove('warn');
  const el = $('rest-timer-bar');
  if (!el.classList.contains('show')) {
    el.classList.add('show');
    rest.drag = 0;
    rest.presence.set(0);
  }
  rest.presence.to(1, { damping: 0.82, response: 0.42, onRest: null });
  clearInterval(rest.interval);
  rest.interval = setInterval(tickRest, 250);
  tickRest();
}

function fmtClock(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

function tickRest() {
  const remaining = (rest.endAt - Date.now()) / 1000;
  const fg = $('rest-ring-fg');
  const nextSet = rest.setsTotal > 0 && rest.setsDone < rest.setsTotal ? rest.setsDone + 1 : 0;
  if (remaining > 0) {
    $('rest-timer-num').textContent = fmtClock(remaining);
    $('rest-timer-label').textContent = nextSet ? `Rest · then set ${nextSet} of ${rest.setsTotal}` : `Rest · ${rest.name}`;
    fg.style.strokeDashoffset = REST_C * (1 - remaining / rest.total);
    $('rest-timer-bar').classList.toggle('warn', remaining <= 10);
    return;
  }
  if (rest.finished) return;
  rest.finished = true;
  clearInterval(rest.interval);
  fg.style.strokeDashoffset = REST_C;
  $('rest-timer-num').textContent = 'Go';
  $('rest-timer-label').textContent = nextSet ? `Set ${nextSet} — start now` : 'Time for your next set';
  playRestDoneSound();
  haptic([100, 50, 100]);
  setTimeout(() => { if (rest.finished) hideRestTimer(); }, 6000);
}

function playRestDoneSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[0, 880], [0.2, 1046]].forEach(([when, freq]) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.15);
      osc.start(ctx.currentTime + when); osc.stop(ctx.currentTime + when + 0.15);
    });
  } catch (e) {}
}

function addRestTime(secs) {
  if (rest.finished) { rest.finished = false; rest.endAt = Date.now(); rest.total = 0; clearInterval(rest.interval); rest.interval = setInterval(tickRest, 250); }
  rest.endAt += secs * 1000;
  rest.total += secs;
  haptic();
  tickRest();
}
function skipRest() { hideRestTimer(); }
function hideRestTimer(velocity) {
  clearInterval(rest.interval);
  rest.finished = false;
  rest.presence.to(0, {
    damping: 1, response: 0.3, velocity: velocity !== undefined ? -velocity / 60 : undefined,
    onRest: () => { $('rest-timer-bar').classList.remove('show'); rest.dragSpring.set(0); },
  });
}

// Swipe the pill down to dismiss — tracks 1:1, resists upward.
function bindRestPillGesture() {
  const el = $('rest-timer-bar');
  const tracker = new VelocityTracker();
  let startY = 0, active = false, base = 0;
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    active = true;
    startY = e.clientY;
    base = rest.dragSpring.value;
    rest.dragSpring.stop();
    tracker.reset();
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', e => {
    if (!active) return;
    let y = base + e.clientY - startY;
    if (y < 0) y = rubberband(y, 80);
    rest.dragSpring.set(y);
    tracker.add(y);
  });
  const end = () => {
    if (!active) return;
    active = false;
    const v = tracker.get();
    if (rest.drag + project(v) > 60) { haptic(); hideRestTimer(v); rest.dragSpring.to(140, { velocity: v, damping: 1, response: 0.3 }); }
    else rest.dragSpring.to(0, { velocity: v, damping: 0.8, response: 0.3 });
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

// ═══ HISTORY ═══════════════════════════════════════════════════════════════
let calYear = new Date().getFullYear(), calMonth = new Date().getMonth();
let histView = 'cal', calSelected = null, calPager = null;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function renderHistory() {
  calYear = new Date().getFullYear();
  calMonth = new Date().getMonth();
  calSelected = null;
  segmented($('hist-seg'), [{ v:'cal', label:'Calendar' }, { v:'list', label:'List' }], histView, setHistView);
  setHistView(histView);
}
function setHistView(v) {
  histView = v;
  $('hist-cal-view').hidden = v !== 'cal';
  $('hist-list-view').hidden = v !== 'list';
  if (v === 'cal') { renderCalendar(); renderFreqChart(); }
  else renderHistoryList();
}
function canCalNext() { const n = new Date(); return calYear < n.getFullYear() || (calYear === n.getFullYear() && calMonth < n.getMonth()); }
function calShift(d) {
  calMonth += d;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0; calYear++; }
  calSelected = null;
  renderCalendar();
}

function dayStatus(dateObj) {
  const key = dk(dateObj);
  const pid = planIdForDate(dateObj);
  const restish = !pid || pid === 'rest' || pid === 'active';
  const ch = S.checked[key] || {};
  const doneIds = Object.keys(ch).filter(id => ch[id]);
  const plan = restish ? null : planFor(pid);
  const total = plan ? flattenExIds(plan.exercises).length : 0;
  let status;
  if (restish) status = 'rest';
  else if (!doneIds.length) status = 'missed';
  else if (doneIds.length >= total) status = 'complete';
  else status = 'partial';
  return { key, pid, restish, doneIds, status };
}

function renderCalendar() {
  const todayStr = dk(new Date());
  $('cal-month-label').textContent = MONTHS[calMonth] + ' ' + calYear;
  $('cal-next-btn').disabled = !canCalNext();
  const first = new Date(calYear, calMonth, 1).getDay();
  const days = new Date(calYear, calMonth + 1, 0).getDate();
  let h = '';
  for (let i = 0; i < first; i++) h += '<div class="cal-cell blank"></div>';
  for (let d = 1; d <= days; d++) {
    const date = new Date(calYear, calMonth, d);
    const key = dk(date);
    let cls = 'cal-cell';
    if (key > todayStr) cls += ' future';
    else cls += ' ' + dayStatus(date).status;
    if (key === todayStr) cls += ' today';
    if (key === calSelected) cls += ' selected';
    h += `<div class="${cls}" data-day="${key}" role="button" aria-label="${fmtDate(key, { month:'long', day:'numeric' })}"><span>${d}</span></div>`;
  }
  $('cal-grid').innerHTML = h;
  renderCalDetail();
}

function renderCalDetail() {
  const el = $('cal-detail');
  if (!calSelected) { el.innerHTML = ''; return; }
  const AX = allEx();
  const st = dayStatus(dateOf(calSelected));
  const label = fmtDate(calSelected, { weekday:'long', month:'long', day:'numeric' });
  const statusText = { complete:'Complete', partial:'Partial', missed:'Missed', rest: st.pid === 'active' ? 'Active day' : 'Rest day' }[st.status];
  let h = `<div class="list"><div class="row"><span class="row-main"><span class="row-title detail-head">${esc(label)}</span></span><span class="row-value">${statusText}</span></div>`;
  st.doneIds.forEach(id => {
    const ex = AX[id]; if (!ex) return;
    const log = (S.logs[calSelected] || {})[id];
    let sub = '';
    if (log && log.sets && log.sets.length) {
      if (ex.type === 'weight') { const mW = Math.max(...log.sets.map(s => s.weight || 0)); sub = plural(log.sets.length, 'set') + (mW ? ' · top ' + displayWeight(mW, getExUnit(id)) : ''); }
      else if (ex.type === 'time') sub = 'Best ' + Math.max(...log.sets.map(s => s.secs || 0)) + ' sec';
      else sub = log.sets.reduce((a, b) => a + (b.reps || 0), 0) + ' reps total';
    }
    h += `<div class="row"><span class="dot" style="--c:var(--tint)"></span><span class="row-main"><span class="row-title">${esc(ex.name)}</span>${sub ? `<span class="row-sub">${esc(sub)}</span>` : ''}</span></div>`;
  });
  const note = (S.dayNotes || {})[calSelected];
  if (note) h += `<div class="row"><span class="row-main"><span class="row-sub">Note</span><span class="row-title">${esc(note)}</span></span></div>`;
  if (!st.doneIds.length && !note && !st.restish) h += '<div class="row"><span class="row-main"><span class="row-sub">Nothing logged</span></span></div>';
  el.innerHTML = h + '</div>';
}

function renderFreqChart() {
  const now = new Date();
  const weeks = [];
  for (let w = 7; w >= 0; w--) {
    let c = 0;
    for (let i = 0; i < 7; i++) {
      const day = new Date(now); day.setDate(day.getDate() - (w * 7 + i));
      if (Object.values(S.checked[dk(day)] || {}).some(v => v)) c++;
    }
    weeks.push({ l: w === 0 ? 'Now' : w + 'w', c });
  }
  const max = Math.max(...weeks.map(w => w.c), 1);
  $('freq-chart').innerHTML = weeks.map((w, i) =>
    `<div class="freq-col"><span class="freq-val">${w.c || ''}</span><div class="freq-bar${i === 7 ? ' now' : ''}" style="height:${Math.round((w.c / max) * 70) + 4}%;animation-delay:${i * 25}ms"></div><span class="freq-lbl">${w.l}</span></div>`).join('');
}

function renderHistoryList() {
  const AX = allEx();
  const dates = Object.keys(S.checked).filter(k => Object.values(S.checked[k] || {}).some(v => v)).sort().reverse();
  const el = $('history-content');
  if (!dates.length) { el.innerHTML = '<div class="list" style="margin-top:16px"><div class="empty"><strong>No Sessions Yet</strong>Your workouts will appear here.</div></div>'; return; }
  let h = '', month = '';
  dates.forEach(k => {
    const mo = fmtDate(k, { month:'long', year:'numeric' });
    if (mo !== month) { if (month) h += '</div>'; h += `<div class="month-head">${mo}</div><div class="list">`; month = mo; }
    const done = Object.keys(S.checked[k]).filter(id => S.checked[k][id]);
    const names = done.map(id => AX[id] ? AX[id].name : id).join(', ');
    h += `<div class="row"><span class="row-main"><span class="row-title strong">${fmtDate(k, { weekday:'long', day:'numeric' })}</span><span class="row-sub">${esc(names)}</span></span><span class="row-value">${done.length}</span></div>`;
  });
  el.innerHTML = h + '</div>';
}

// ═══ PLANS ═════════════════════════════════════════════════════════════════
let planTab = 'week', _weekTab = 'a', libMuscle = 'all';
function renderPlans() {
  segmented($('plan-seg'), [{ v:'week', label:'Schedule' }, { v:'ex', label:'Exercises' }, { v:'stretch', label:'Stretches' }], planTab, setPlanTab);
  setPlanTab(planTab);
}
function setPlanTab(tab) {
  planTab = tab;
  ['week', 'ex', 'stretch'].forEach(t => { $('plan-tab-' + t).hidden = t !== tab; });
  const add = $('plans-add-btn');
  add.hidden = tab === 'stretch';
  add.setAttribute('aria-label', tab === 'ex' ? 'New exercise' : 'New plan');
  if (tab === 'week') renderSchedule();
  if (tab === 'ex') { muscleChips($('lib-chips'), libMuscle, v => { libMuscle = v; renderExLib(); }); renderExLib(); }
  if (tab === 'stretch') renderStretchLib();
}
function plansAdd() { if (planTab === 'ex') openAddExModal(); else openNewPlanModal(); }

function renderSchedule() {
  const AP = allPlans();
  const editingB = S.useAltWeeks && _weekTab === 'b';
  const wa = editingB ? S.weekAssignmentB : S.weekAssignment;
  const todayDow = new Date().getDay();
  const thisWeekIsEditing = !S.useAltWeeks || (curWeekIsB() === editingB);
  let h = `<div class="row"><span class="row-main"><span class="row-title">Alternating Weeks</span></span>
    <button class="switch" role="switch" aria-checked="${S.useAltWeeks}" onclick="toggleAltWeeks()" aria-label="Alternating weeks"></button></div>`;
  if (S.useAltWeeks) h += `<div class="row"><div class="segmented full" id="week-ab-seg"></div></div>`;
  const opts = `<option value="rest">Rest</option><option value="active">Active</option>` +
    Object.entries(AP).map(([id, p]) => `<option value="${id}">${esc(p.name)}</option>`).join('');
  [1, 2, 3, 4, 5, 6, 0].forEach(dow => {
    const pid = wa[dow], plan = planFor(pid);
    const label = plan ? plan.name : pid === 'active' ? 'Active day' : 'Rest day';
    h += `<label class="row day-row nav-row${plan ? ' has-plan' : ''}${thisWeekIsEditing && dow === todayDow ? ' today' : ''}">
      <span class="day-name">${DAYS_S[dow]}</span>
      <span class="dot" style="--c:${plan ? planColor(plan.color) : 'var(--fill)'}"></span>
      <span class="row-main"><span class="row-title one-line">${esc(label)}</span></span>${I.updown}
      <select data-dow="${dow}" aria-label="${DAYS_L[dow]} plan">${opts.replace(`value="${pid}"`, `value="${pid}" selected`)}</select>
    </label>`;
  });
  $('week-assignment').innerHTML = h;
  $('week-assignment').onchange = e => {
    const s = e.target.closest('select[data-dow]');
    if (s) assignDay(parseInt(s.dataset.dow), s.value, editingB ? 'B' : 'A');
  };
  if (S.useAltWeeks) segmented($('week-ab-seg'), [{ v:'a', label:'Week A' }, { v:'b', label:'Week B' }], _weekTab, v => { _weekTab = v; renderSchedule(); });
  $('week-footer').textContent = S.useAltWeeks
    ? `This is ${curWeekIsB() ? 'Week B' : 'Week A'}. Weeks alternate automatically.`
    : 'Tap a day to change what’s scheduled.';

  // My plans
  let p = '';
  Object.entries(AP).forEach(([id, plan]) => {
    const days = [1, 2, 3, 4, 5, 6, 0].filter(d => S.weekAssignment[d] === id).map(d => DAYS_S[d]);
    const n = flattenExIds(plan.exercises).length;
    p += `<button class="row nav-row" onclick="openPlanModal('${id}')">
      <span class="dot" style="--c:${planColor(plan.color)}"></span>
      <span class="row-main"><span class="row-title">${esc(plan.name)}</span><span class="row-sub">${plural(n, 'exercise')}${days.length ? ' · ' + days.join(', ') : ''}</span></span>${I.chev}
    </button>`;
  });
  p += `<button class="row add-row nav-row" onclick="openNewPlanModal()">${I.plus}<span class="row-main"><span class="row-title">New Plan</span></span></button>`;
  $('plans-list').innerHTML = p;
  renderPacksList();
}

function assignDay(dow, pid, week) {
  if (week === 'B') S.weekAssignmentB[dow] = pid; else S.weekAssignment[dow] = pid;
  save(); haptic();
  renderSchedule(); renderToday();
}
function toggleAltWeeks() {
  S.useAltWeeks = !S.useAltWeeks;
  if (!S.weekAssignmentB) S.weekAssignmentB = { ...DEFAULT_WEEK };
  save(); haptic();
  renderSchedule(); renderToday();
}

function renderPacksList() {
  const AP = allPlans();
  $('packs-list').innerHTML = Object.entries(PLAN_PACKS).map(([packId, pack]) => {
    const days = [1, 2, 3, 4, 5, 6, 0].map(d => {
      const plan = planFor(pack.days[d]);
      return `<div class="program-day"><b style="${plan ? `--c:${planColor(plan.color)}` : ''}"></b>${DAYS_S[d][0]}</div>`;
    }).join('');
    return `<section class="card program">
      <div class="program-head"><div class="program-badge" style="--c:${planColor(pack.color)}">${I.globe}</div>
        <div><h3>${esc(pack.name)}</h3><p>${esc(pack.desc)}</p></div></div>
      <div class="program-days">${days}</div>
      <button class="btn gray" onclick="applyPack('${packId}')">Use This Program</button>
    </section>`;
  }).join('');
}
function applyPack(packId) {
  const pack = PLAN_PACKS[packId];
  if (!pack) return;
  if (!confirm(`Use “${pack.name}”? This replaces your current weekly schedule.`)) return;
  Object.entries(pack.days).forEach(([dow, pid]) => { S.weekAssignment[parseInt(dow)] = pid; });
  save(); haptic([12, 50, 12]);
  renderSchedule(); renderToday();
  $('screen-plans').scrollTo({ top: 0, behavior: 'smooth' });
  toast(pack.name + ' scheduled');
}

// ── Plan editor ────────────────────────────────────────────────────────────
function openPlanModal(id) {
  const plan = allPlans()[id];
  if (!plan) return;
  editPlanId = id;
  editPlanExes = JSON.parse(JSON.stringify(plan.exercises));
  editPlanColor = plan.color || 'green';
  editPlanDays = Object.entries(S.weekAssignment).filter(([, pid]) => pid === id).map(([d]) => parseInt(d));
  $('pm-title').textContent = 'Edit Plan';
  $('pm-name').value = plan.name;
  $('pm-delete-btn').hidden = !!BUILTIN_PLANS[id];
  renderPlanColors(); renderPlanDays(); renderPlanExList();
  Sheets.open('plan-modal');
}
function openNewPlanModal() {
  editPlanId = null; editPlanExes = []; editPlanColor = 'green'; editPlanDays = [];
  $('pm-title').textContent = 'New Plan';
  $('pm-name').value = '';
  $('pm-delete-btn').hidden = true;
  renderPlanColors(); renderPlanDays(); renderPlanExList();
  Sheets.open('plan-modal');
}
function renderPlanColors() {
  const names = { green:'Green', fire:'Orange', purple:'Purple', blue:'Blue' };
  const el = $('pm-colors');
  el.innerHTML = Object.keys(names).map(c =>
    `<button class="swatch" style="--c:${planColor(c)}" data-c="${c}" aria-label="${names[c]}" aria-pressed="${c === editPlanColor}"></button>`).join('');
  el.onclick = e => { const b = e.target.closest('.swatch'); if (!b) return; editPlanColor = b.dataset.c; renderPlanColors(); };
}
function renderPlanDays() {
  const el = $('pm-days');
  el.innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d =>
    `<button class="day-toggle" data-d="${d}" aria-label="${DAYS_L[d]}" aria-pressed="${editPlanDays.includes(d)}">${DAYS_S[d][0]}</button>`).join('');
  el.onclick = e => {
    const b = e.target.closest('.day-toggle'); if (!b) return;
    const d = parseInt(b.dataset.d), i = editPlanDays.indexOf(d);
    if (i >= 0) editPlanDays.splice(i, 1); else editPlanDays.push(d);
    b.setAttribute('aria-pressed', i < 0);
  };
}

function planExRowHTML(id, idx, si) {
  const ex = allEx()[id];
  if (!ex) return '';
  const inPair = si !== undefined;
  return `<div class="row plan-ex">
    <button class="minus" data-rm="${idx}" ${inPair ? `data-si="${si}"` : ''} aria-label="Remove ${esc(ex.name)}"></button>
    <span class="row-main"><span class="row-title">${esc(ex.name)}</span><span class="row-sub">${esc(targetText(ex))}</span></span>
    ${inPair ? '' : `${idx < editPlanExes.length - 1 && !Array.isArray(editPlanExes[idx + 1]) ? `<button class="link-btn" data-ss="${idx}">Superset</button>` : ''}<span class="handle" data-handle aria-label="Reorder">${I.handle}</span>`}
  </div>`;
}
function renderPlanExList() {
  const el = $('pm-ex-list');
  if (!editPlanExes.length) { el.innerHTML = '<div class="empty">No exercises yet.</div>'; return; }
  el.innerHTML = editPlanExes.map((item, idx) => Array.isArray(item)
    ? `<div class="plan-block ss" data-idx="${idx}"><div class="ss-label" style="justify-content:space-between;padding-right:16px">Superset<span style="display:flex;align-items:center;gap:6px"><button class="link-btn" data-unlink="${idx}">Unlink</button><span class="handle" data-handle aria-label="Reorder">${I.handle}</span></span></div>${item.map((id, si) => planExRowHTML(id, idx, si)).join('')}</div>`
    : `<div class="plan-block" data-idx="${idx}">${planExRowHTML(item, idx)}</div>`).join('');
  if (Sheets.isOpen('picker-modal') && pickerMode === 'plan') renderPicker();
}

function bindPlanListEvents() {
  const el = $('pm-ex-list');
  el.addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]');
    if (rm) {
      const idx = +rm.dataset.rm;
      if (rm.dataset.si !== undefined) {
        const pair = editPlanExes[idx];
        pair.splice(+rm.dataset.si, 1);
        editPlanExes.splice(idx, 1, ...(pair.length === 1 ? [pair[0]] : pair.length ? [pair] : []));
      } else editPlanExes.splice(idx, 1);
      haptic(); renderPlanExList(); return;
    }
    const ss = e.target.closest('[data-ss]');
    if (ss) {
      const idx = +ss.dataset.ss;
      const a = editPlanExes[idx], b = editPlanExes[idx + 1];
      if (b === undefined) { toast('Add another exercise to pair with'); return; }
      if (Array.isArray(b)) { toast('Unlink that superset first'); return; }
      editPlanExes.splice(idx, 2, [a, b]);
      haptic(); renderPlanExList(); return;
    }
    const un = e.target.closest('[data-unlink]');
    if (un) { const idx = +un.dataset.unlink; editPlanExes.splice(idx, 1, ...editPlanExes[idx]); haptic(); renderPlanExList(); }
  });

  // Drag-to-reorder: the lifted block follows the finger 1:1 (respecting the
  // grab offset), neighbours spring out of the way, and the drop settles
  // from wherever the finger let go.
  el.addEventListener('pointerdown', e => {
    const handle = e.target.closest('[data-handle]');
    if (!handle) return;
    e.preventDefault();
    const blocks = [...el.querySelectorAll('.plan-block')];
    const block = handle.closest('.plan-block');
    const from = blocks.indexOf(block);
    const rects = blocks.map(b => b.getBoundingClientRect());
    const startY = e.clientY;
    const minDy = rects[0].top - rects[from].top, maxDy = rects[rects.length - 1].bottom - rects[from].bottom;
    let to = from, dy = 0;
    block.classList.add('lifted');
    block.style.transform = 'scale(1.02)';
    haptic();
    try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    const move = ev => {
      dy = ev.clientY - startY;
      if (dy < minDy) dy = minDy + rubberband(dy - minDy, 120);
      if (dy > maxDy) dy = maxDy + rubberband(dy - maxDy, 120);
      block.style.transform = `translate3d(0,${dy}px,0) scale(1.02)`;
      const center = rects[from].top + rects[from].height / 2 + dy;
      let nt = from;
      for (let i = 0; i < from; i++) if (center < rects[i].top + rects[i].height / 2) { nt = i; break; }
      for (let i = rects.length - 1; i > from; i--) if (center > rects[i].top + rects[i].height / 2) { nt = i; break; }
      if (nt !== to) {
        to = nt; haptic();
        const H = rects[from].height;
        blocks.forEach((b, i) => {
          if (i === from) return;
          let shift = 0;
          if (from < to && i > from && i <= to) shift = -H;
          if (from > to && i < from && i >= to) shift = H;
          b.classList.add('shifting');
          b.style.transform = shift ? `translate3d(0,${shift}px,0)` : '';
        });
      }
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
      const target = to > from ? rects[to].bottom - rects[from].bottom : to < from ? rects[to].top - rects[from].top : 0;
      const sp = new Spring({ value: dy, onUpdate: v => { block.style.transform = `translate3d(0,${v}px,0) scale(${1 + 0.02 * clamp(Math.abs(v - target) / 20, 0, 1)})`; } });
      sp.to(target, { damping: 1, response: 0.28, onRest: () => {
        if (to !== from) { const [it] = editPlanExes.splice(from, 1); editPlanExes.splice(to, 0, it); }
        renderPlanExList();
      } });
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  });
}

function savePlan() {
  const name = $('pm-name').value.trim();
  if (!name) { $('pm-name').focus(); toast('Give the plan a name'); return; }
  const id = editPlanId || ('pc-' + Date.now());
  const plan = { name, color: editPlanColor, exercises: JSON.parse(JSON.stringify(editPlanExes)) };
  if (editPlanId && BUILTIN_PLANS[editPlanId]) S.customPlans[editPlanId] = { ...BUILTIN_PLANS[editPlanId], ...plan };
  else S.customPlans[id] = { ...(S.customPlans[id] || {}), ...plan };
  // Days unticked here go back to rest; ticked days point at this plan.
  [0, 1, 2, 3, 4, 5, 6].forEach(d => {
    if (editPlanDays.includes(d)) S.weekAssignment[d] = id;
    else if (S.weekAssignment[d] === id) S.weekAssignment[d] = 'rest';
  });
  save(); haptic();
  Sheets.close('plan-modal');
  renderSchedule(); renderToday();
  toast(editPlanId ? 'Plan saved' : 'Plan created');
}
function deletePlan() {
  if (!editPlanId || !confirm('Delete this plan? Days it’s scheduled on become rest days.')) return;
  delete S.customPlans[editPlanId];
  [S.weekAssignment, S.weekAssignmentB].forEach(wa => Object.keys(wa).forEach(d => { if (wa[d] === editPlanId) wa[d] = 'rest'; }));
  save();
  Sheets.close('plan-modal');
  renderSchedule(); renderToday();
  toast('Plan deleted');
}

// ── Exercise library ───────────────────────────────────────────────────────
function renderExLib() {
  const AX = allEx();
  const ids = filteredExIds($('lib-search').value, libMuscle);
  let h = '';
  MUSCLE_ORDER.forEach(mu => {
    const group = ids.filter(id => AX[id].muscle === mu).sort((a, b) => AX[a].name.localeCompare(AX[b].name));
    if (!group.length) return;
    h += `<div class="lib-section">${MUSCLE_LABELS[mu] || mu}</div><div class="list">`;
    group.forEach(id => {
      const ex = AX[id], pb = S.records[id];
      h += `<button class="row nav-row" onclick="openExDetail('${id}')">
        <span class="row-main"><span class="row-title">${esc(ex.name)}${S.customExercises[id] ? '<span class="tag">Custom</span>' : ''}</span>
        <span class="row-sub">${esc(targetText(ex))}${pb ? ` · <span class="pb-text">PB ${esc(pbText(id, ex, pb))}</span>` : ''}</span></span>${I.chev}
      </button>`;
    });
    h += '</div>';
  });
  $('ex-lib').innerHTML = h || '<div class="list" style="margin-top:16px"><div class="empty"><strong>No Results</strong>Try another search, or tap + to create an exercise.</div></div>';
}

let exdId = null;
function openExDetail(id) {
  exdId = id;
  renderExDetail();
  Sheets.open('exd-modal');
}
function renderExDetail() {
  const id = exdId, ex = allEx()[id];
  if (!ex) { Sheets.close('exd-modal'); return; }
  const pb = S.records[id];
  const hasLogs = Object.values(S.logs).some(d => d && d[id]);
  const inToday = (S.adhocExercises[curDK] || []).includes(id) || todayModel().all.includes(id);
  $('exd-title').textContent = ex.name;
  const edit = $('exd-edit');
  edit.style.visibility = S.customExercises[id] ? 'visible' : 'hidden';
  edit.onclick = () => openEditExModal(id);
  let h = `<div class="tiles three" style="padding-top:4px">
    <div class="tile"><div class="tile-label">Muscle</div><div class="tile-value" style="font-size:1rem">${esc(MUSCLE_SHORT[ex.muscle] || ex.muscle)}</div></div>
    <div class="tile"><div class="tile-label">Target</div><div class="tile-value" style="font-size:1rem">${esc(targetText(ex))}</div></div>
    <div class="tile"><div class="tile-label" style="--c:var(--gold)">Record</div><div class="tile-value" style="font-size:1rem">${pb ? esc(pbText(id, ex, pb)) : '—'}</div></div>
  </div>
  <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">
    <button class="btn tint" id="exd-add" ${inToday ? 'disabled style="opacity:.5"' : ''}>${inToday ? I.check.replace('<svg', '<svg style="stroke-width:3"') + 'In Today’s Workout' : I.plus + 'Add to Today'}</button>
    ${hasLogs ? `<button class="btn gray" onclick="openChart('${id}')">${I.chart}Progress Chart</button>` : ''}
  </div>`;
  if (ex.stretches && ex.stretches.length) h += `<div class="field-label">Paired Stretches</div><div class="list">${stretchRowsHTML(ex.stretches)}</div>`;
  if (ex.ace || ex.yt) h += `<div class="list" style="margin-top:24px"><a class="row nav-row" href="${esc(ex.ace || ex.yt)}" target="_blank" rel="noopener"><span class="row-main"><span class="row-title" style="color:var(--tint)">How to Do It</span></span>${I.ext}</a></div>`;
  $('exd-body').innerHTML = h;
  const add = $('exd-add');
  if (add && !inToday) add.onclick = () => { addAdhocEx(id); haptic(); toast('Added to today'); renderExDetail(); };
}

// ── Add / edit exercise ────────────────────────────────────────────────────
function openAddExModal() {
  editExId = null; editExType = 'reps';
  $('em-title').textContent = 'New Exercise';
  $('em-name').value = ''; $('em-link').value = '';
  $('em-muscle').value = 'legs';
  $('em-sets').value = '3'; $('em-val').value = '12';
  $('em-delete-btn').hidden = true;
  renderExTypeSeg();
  renderStretchChecks([]);
  Sheets.open('ex-modal');
}
function openEditExModal(id) {
  const ex = S.customExercises[id];
  if (!ex) return;
  editExId = id; editExType = ex.type || 'reps';
  $('em-title').textContent = 'Edit Exercise';
  $('em-name').value = ex.name || '';
  $('em-muscle').value = ex.muscle || 'legs';
  $('em-sets').value = ex.sets || 3;
  $('em-val').value = ex.val || 12;
  $('em-link').value = ex.ace || '';
  $('em-delete-btn').hidden = false;
  renderExTypeSeg();
  renderStretchChecks(ex.stretches || []);
  Sheets.open('ex-modal');
}
function renderExTypeSeg() {
  $('em-val-label').textContent = editExType === 'time' ? 'Target seconds' : 'Target reps';
  segmented($('em-type-seg'), [{ v:'reps', label:'Reps' }, { v:'time', label:'Timed' }, { v:'weight', label:'Weight' }], editExType, v => {
    editExType = v;
    $('em-val-label').textContent = v === 'time' ? 'Target seconds' : 'Target reps';
  });
}
function renderStretchChecks(sel) {
  const el = $('em-stretches');
  el.innerHTML = Object.entries(STRETCHES).map(([sid, s]) =>
    `<button class="row tap-row" data-sid="${sid}" aria-pressed="${sel.includes(sid)}"><span class="row-main"><span class="row-title">${esc(s.n)}</span><span class="row-sub">${esc(s.d)}</span></span><span class="sel-mark${sel.includes(sid) ? ' on' : ''}">${I.check}</span></button>`).join('');
  el.onclick = e => {
    const r = e.target.closest('[data-sid]'); if (!r) return;
    const on = r.getAttribute('aria-pressed') !== 'true';
    r.setAttribute('aria-pressed', on);
    r.querySelector('.sel-mark').classList.toggle('on', on);
  };
}
function saveExercise() {
  const name = $('em-name').value.trim();
  if (!name) { $('em-name').focus(); toast('Give the exercise a name'); return; }
  const muscle = $('em-muscle').value;
  const cm = { legs:'green', back:'purple', chest:'fire', shoulders:'gold', arms:'blue', cardio:'blue', balance:'blue', full:'green' };
  const id = editExId || ('cx-' + Date.now());
  const link = $('em-link').value.trim();
  S.customExercises[id] = {
    name, type: editExType, sets: parseInt($('em-sets').value) || 3, val: parseInt($('em-val').value) || 12,
    muscle, color: cm[muscle] || 'green',
    stretches: [...$('em-stretches').querySelectorAll('[aria-pressed="true"]')].map(r => r.dataset.sid),
    ace: link || undefined, custom: true,
  };
  save(); haptic();
  Sheets.close('ex-modal');
  if (planTab === 'ex') renderExLib();
  if (Sheets.isOpen('exd-modal')) renderExDetail();
  if (Sheets.isOpen('picker-modal')) { renderPickerChips(); renderPicker(); }
  toast(editExId ? 'Exercise saved' : 'Exercise created');
}
function deleteCustomEx() {
  if (!editExId || !confirm('Delete this exercise? Its logged history stays in your records.')) return;
  delete S.customExercises[editExId];
  save();
  Sheets.close('ex-modal');
  if (Sheets.isOpen('exd-modal')) Sheets.close('exd-modal');
  renderExLib();
  toast('Exercise deleted');
}

// ── Stretch library ────────────────────────────────────────────────────────
function renderStretchLib() {
  $('stretch-lib').innerHTML = STRETCH_GROUPS.map(g =>
    `<div class="lib-section">${g.label}</div><div class="list">${stretchRowsHTML(g.ids.filter(id => STRETCHES[id]))}</div>`).join('');
}

// ═══ PROGRESS ══════════════════════════════════════════════════════════════
const BADGE_ICONS = {
  first: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
  week: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8.5 15l2.5 2.5 4.5-4.5"/>',
  thirty: '<path d="M4 19h16M6.5 15h11M9 11h6M11 7h2"/>',
  fire: '<path d="M12 21c-4 0-6.5-2.6-6.5-6.2 0-3.6 3-5.6 3.5-9.3 2.4 1.5 3.6 3.6 3.6 5.6 1-.6 1.7-1.7 1.9-3 1.8 1.5 3 3.9 3 6.7 0 3.6-1.5 6.2-5.5 6.2z"/>',
  bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  mountain: '<path d="M2.5 20l6.5-11 3.5 5.5 2.5-3.5 6.5 9z"/>',
  trophy: '<path d="M7.5 4h9v5a4.5 4.5 0 01-9 0zM7.5 6h-3a3 3 0 003 4M16.5 6h3a3 3 0 01-3 4M12 13.5V17M8.5 20.5h7"/>',
  crown: '<path d="M4 8l4 4 4-6 4 6 4-4-1.5 10h-13z"/>',
  note: '<path d="M6 3.5h8.5L18 7v13.5H6z"/><path d="M9 11h6M9 15h6"/>',
  planner: '<path d="M10 7h10M10 12h10M10 17h10M3.5 7l1.5 1.5L7.5 6M3.5 12l1.5 1.5 2.5-2.5M3.5 17l1.5 1.5 2.5-2.5"/>',
  wrench: '<path d="M14.5 6.5a4 4 0 00-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 005.3-5.3l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  diamond: '<path d="M6 4h12l3.5 5L12 20.5 2.5 9z"/><path d="M2.5 9h19"/>',
};

function totalSessions() { return Object.keys(S.checked).filter(k => Object.values(S.checked[k] || {}).some(v => v)).length; }

function renderStanding() {
  const AX = allEx();
  updateInitials();
  $('progress-name').textContent = S.name ? S.name : '';
  const totalW = totalSessions();
  const totalPBs = Object.keys(S.records).length;
  $('standing-stats').innerHTML = `
    <div class="tile"><div class="tile-label" style="--c:var(--orange)">${I.flame}Streak</div><div class="tile-value">${S.streak || 0}<small>days</small></div><div class="tile-sub">Best ${S.bestStreak || 0}</div></div>
    <div class="tile"><div class="tile-label" style="--c:var(--tint)">${I.bolt}Sessions</div><div class="tile-value">${totalW}</div><div class="tile-sub">${S.startDate ? 'Since ' + fmtDate(S.startDate) : 'All time'}</div></div>
    <div class="tile tappable" onclick="document.getElementById('pb-showcase').scrollIntoView({behavior:'smooth',block:'center'})" style="grid-column:1/-1;display:flex;align-items:center;gap:12px">
      <div style="flex:1"><div class="tile-label" style="--c:var(--gold)">${I.trophy}Personal Records</div><div class="tile-sub" style="margin-top:4px">${totalPBs ? 'Across ' + plural(totalPBs, 'exercise') : 'Log a workout to set your first'}</div></div>
      <div class="tile-value" style="margin:0">${totalPBs}</div>
    </div>`;
  initSummaryMonth();
  renderMonthlySummary();

  // Records
  const rids = Object.keys(S.records).filter(id => AX[id]).sort((a, b) => {
    const mo = MUSCLE_ORDER.indexOf(AX[a].muscle) - MUSCLE_ORDER.indexOf(AX[b].muscle);
    return mo || AX[a].name.localeCompare(AX[b].name);
  });
  $('pb-showcase').innerHTML = rids.length ? rids.map(id => {
    const ex = AX[id], rec = S.records[id];
    return `<button class="row nav-row" onclick="openChart('${id}')">
      <span class="row-main"><span class="row-title">${esc(ex.name)}</span><span class="row-sub">${rec.date ? fmtDate(rec.date, { month:'short', day:'numeric', year:'numeric' }) : ''}</span></span>
      <span class="row-value gold">${esc(pbText(id, ex, rec))}</span>${I.chev}
    </button>`;
  }).join('') : '<div class="empty"><strong>No Records Yet</strong>Log a workout and your bests show up here.</div>';

  renderBwSection();

  // Awards
  const BADGES = [
    { i:'first', name:'First Rep', desc:'Log your first workout', earn: totalW >= 1 },
    { i:'week', name:'Full Week', desc:'7 workouts logged', earn: totalW >= 7 },
    { i:'thirty', name:'30 Sessions', desc:'One month of work', earn: totalW >= 30 },
    { i:'fire', name:'On Fire', desc:'3-day streak', earn: (S.bestStreak || 0) >= 3 },
    { i:'bolt', name:'Unstoppable', desc:'7-day streak', earn: (S.bestStreak || 0) >= 7 },
    { i:'mountain', name:'Volcanic', desc:'30-day streak', earn: (S.bestStreak || 0) >= 30 },
    { i:'trophy', name:'Record Breaker', desc:'5 personal bests', earn: totalPBs >= 5 },
    { i:'crown', name:'Champion', desc:'20 personal bests', earn: totalPBs >= 20 },
    { i:'note', name:'Coach Log', desc:'Add your first note', earn: (S.notes || []).length >= 1 },
    { i:'planner', name:'Planner', desc:'Create a custom plan', earn: Object.keys(S.customPlans).length >= 1 },
    { i:'wrench', name:'Builder', desc:'Add a custom exercise', earn: Object.keys(S.customExercises).length >= 1 },
    { i:'diamond', name:'Diamond', desc:'50 sessions logged', earn: totalW >= 50 },
  ];
  $('badge-count').textContent = `${BADGES.filter(b => b.earn).length} of ${BADGES.length}`;
  $('badges-grid').innerHTML = BADGES.map(b =>
    `<button class="badge${b.earn ? ' earned' : ''}" data-desc="${esc(b.desc)}" data-earn="${b.earn ? 1 : 0}"><span class="medal"><svg viewBox="0 0 24 24">${BADGE_ICONS[b.i]}</svg></span><span class="badge-name">${b.name}</span></button>`).join('');
  $('badges-grid').onclick = e => {
    const b = e.target.closest('.badge'); if (!b) return;
    toast((b.dataset.earn === '1' ? 'Earned · ' : 'Locked · ') + b.dataset.desc);
  };

  // Notes
  const nl = $('notes-list');
  if (!(S.notes || []).length) { nl.innerHTML = '<div class="empty"><strong>No Notes Yet</strong>Add one here, or while logging a set.</div>'; return; }
  nl.innerHTML = S.notes.slice(0, 20).map((n, idx) => {
    const ex = n.exId ? AX[n.exId] : null;
    return `<div class="swipe" data-idx="${idx}"><div class="swipe-action"><span>Delete</span></div>
      <div class="swipe-content row" style="align-items:flex-start">
        <span class="row-main"><span class="row-title strong">${esc(ex ? ex.name : 'General')}</span><span class="row-sub" style="color:var(--label)">${esc(n.text)}</span></span>
        <span class="row-sub" style="flex-shrink:0">${n.date ? fmtDate(n.date) : ''}</span>
      </div></div>`;
  }).join('');
  nl.querySelectorAll('.swipe').forEach(el => swipeRow(el, () => deleteNote(+el.dataset.idx)));
}

function deleteNote(idx) { undoable('Note deleted', () => S.notes.splice(idx, 1), renderStanding); }

function openNoteModal() {
  const sel = $('note-ex-sel');
  const AX = allEx();
  sel.innerHTML = '<option value="">General</option>' + Object.entries(AX).sort((a, b) => a[1].name.localeCompare(b[1].name))
    .map(([id, ex]) => `<option value="${id}">${esc(ex.name)}</option>`).join('');
  $('note-text').value = '';
  Sheets.open('note-modal');
  setTimeout(() => $('note-text').focus(), 350);
}
function saveNote() {
  const text = $('note-text').value.trim();
  if (!text) { $('note-text').focus(); return; }
  S.notes.unshift({ exId: $('note-ex-sel').value || null, text, date: dk(new Date()) });
  save(); haptic();
  Sheets.close('note-modal');
  renderStanding();
  toast('Note saved');
}

// ── Monthly summary ────────────────────────────────────────────────────────
let summaryYear = new Date().getFullYear(), summaryMonth = new Date().getMonth();
function initSummaryMonth() { const n = new Date(); summaryMonth = n.getMonth(); summaryYear = n.getFullYear(); }
function summaryPrev() { summaryMonth--; if (summaryMonth < 0) { summaryMonth = 11; summaryYear--; } renderMonthlySummary(); }
function summaryNext() {
  const n = new Date();
  if (summaryYear < n.getFullYear() || (summaryYear === n.getFullYear() && summaryMonth < n.getMonth())) {
    summaryMonth++; if (summaryMonth > 11) { summaryMonth = 0; summaryYear++; }
    renderMonthlySummary();
  }
}
function renderMonthlySummary() {
  const AX = allEx(), unit = S.bwUnit || 'lbs';
  const firstDay = new Date(summaryYear, summaryMonth, 1), lastDay = new Date(summaryYear, summaryMonth + 1, 0);
  const todayKey = dk(new Date());
  let complete = 0, partial = 0, missed = 0, exDone = 0;
  let bestStreak = 0, cur = 0;
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const key = dk(d);
    if (key > todayKey) break;
    const pid = planIdForDate(d), ch = S.checked[key] || {}, adhoc = S.adhocExercises[key] || [];
    const plan = planFor(pid);
    if (plan && plan.exercises.length) {
      const flat = flattenExIds(plan.exercises);
      const done = flat.filter(id => ch[id]).length;
      if (done === flat.length) complete++; else if (done > 0) partial++; else if (key !== todayKey) missed++;
      exDone += done;
    }
    if (!pid || pid === 'rest') continue;
    let ok;
    if (pid === 'active') ok = Object.keys(S.logs[key] || {}).length > 0 || (S.bwEntries || []).some(e => e.date === key) || !!(S.dayNotes || {})[key] || adhoc.some(id => ch[id]);
    else { if (!plan || !plan.exercises.length) continue; ok = flattenExIds(plan.exercises).some(id => ch[id]) || adhoc.some(id => ch[id]); }
    if (ok) { cur++; bestStreak = Math.max(bestStreak, cur); } else if (key !== todayKey) cur = 0;
  }
  const monthStr = `${summaryYear}-${String(summaryMonth + 1).padStart(2, '0')}`;
  const newPRs = Object.values(S.records).filter(r => r.date && r.date.startsWith(monthStr)).length;
  const bw = (S.bwEntries || []).filter(e => e.date.startsWith(monthStr)).sort((a, b) => a.date.localeCompare(b.date));
  let bwChange = null;
  if (bw.length >= 2) bwChange = Math.round((convertBw(bw[bw.length - 1].val, bw[bw.length - 1].unit, unit) - convertBw(bw[0].val, bw[0].unit, unit)) * 10) / 10;
  const muscleCounts = {};
  Object.keys(S.logs).filter(d => d.startsWith(monthStr)).forEach(d => Object.keys(S.logs[d]).forEach(id => { const ex = AX[id]; if (ex) muscleCounts[ex.muscle] = (muscleCounts[ex.muscle] || 0) + 1; }));
  const top = Object.entries(muscleCounts).sort((a, b) => b[1] - a[1])[0];
  const n = new Date();
  const canNext = summaryYear < n.getFullYear() || (summaryYear === n.getFullYear() && summaryMonth < n.getMonth());

  const hl = [];
  if (complete + partial === 0) hl.push(['var(--label3)', 'No workouts logged this month.']);
  else {
    if (complete) hl.push(['var(--tint)', `<strong>${complete}</strong> workout${complete !== 1 ? 's' : ''} fully completed`]);
    if (partial) hl.push(['var(--gold)', `<strong>${partial}</strong> partial session${partial !== 1 ? 's' : ''}`]);
    if (missed) hl.push(['var(--red)', `<strong>${missed}</strong> planned workout${missed !== 1 ? 's' : ''} missed`]);
    if (top) hl.push(['var(--purple)', `Most trained: <strong>${MUSCLE_LABELS[top[0]] || top[0]}</strong> (${top[1]} sessions)`]);
    if (bwChange !== null) hl.push([bwChange < 0 ? 'var(--tint)' : bwChange > 0 ? 'var(--orange)' : 'var(--label3)', `Body weight <strong>${bwChange === 0 ? 'unchanged' : (bwChange > 0 ? '+' : '') + bwChange + ' ' + unit}</strong>`]);
  }
  $('monthly-summary-wrap').innerHTML = `<section class="card month-card" style="margin:12px var(--gutter) 0">
    <div class="month-card-head">
      <div><div class="kicker">Monthly Summary</div><h3>${MONTHS[summaryMonth]} ${summaryYear}</h3></div>
      <div class="cal-arrows">
        <button class="icon-btn" onclick="summaryPrev()" aria-label="Previous month" style="background:none"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
        <button class="icon-btn" onclick="summaryNext()" aria-label="Next month" style="background:none" ${canNext ? '' : 'disabled'}><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      </div>
    </div>
    <div class="month-grid">
      <div class="month-cell"><div class="v" style="--c:var(--tint)">${complete + partial}</div><div class="l">Workouts</div></div>
      <div class="month-cell"><div class="v" style="--c:var(--gold)">${newPRs}</div><div class="l">New records</div></div>
      <div class="month-cell"><div class="v" style="--c:var(--orange)">${bestStreak}</div><div class="l">Best streak</div></div>
      <div class="month-cell"><div class="v" style="--c:var(--purple)">${exDone}</div><div class="l">Exercises done</div></div>
    </div>
    <div class="month-highlights">${hl.map(([c, t]) => `<div class="hl"><i style="--c:${c}"></i><span>${t}</span></div>`).join('')}</div>
  </section>`;
}

// ── Body weight ────────────────────────────────────────────────────────────
function setBwUnit(unit) { S.bwUnit = unit; save(); renderBwSection(); renderMonthlySummary(); }
function saveBwEntry() {
  const input = $('bw-val-input');
  const val = parseFloat(input.value);
  if (!val || val <= 0) { input.focus(); toast('Enter a weight first'); return; }
  const today = dk(new Date());
  S.bwEntries = S.bwEntries.filter(e => e.date !== today);
  S.bwEntries.push({ date: today, val, unit: S.bwUnit });
  S.bwEntries.sort((a, b) => a.date.localeCompare(b.date));
  updateStreak(); save();
  input.value = '';
  input.blur();
  haptic();
  renderBwSection();
  toast('Weight logged');
}
function deleteBwEntry(date) { undoable('Entry deleted', () => { S.bwEntries = S.bwEntries.filter(e => e.date !== date); }, renderBwSection); }

function renderBwSection() {
  const unit = S.bwUnit || 'lbs';
  segmented($('bw-seg'), [{ v:'lbs', label:'lbs' }, { v:'kg', label:'kg' }], unit, setBwUnit);
  const display = (S.bwEntries || []).map(e => ({ date: e.date, val: Math.round(convertBw(e.val, e.unit, unit) * 10) / 10 }));
  if (!display.length) {
    $('bw-stats-row').innerHTML = '<div class="bw-range" style="font-size:.882rem">No entries yet. Log today’s weight below.</div>';
    $('bw-chart-area').innerHTML = '';
    $('bw-entries').innerHTML = '';
    return;
  }
  const latest = display[display.length - 1].val, first = display[0].val;
  const low = Math.min(...display.map(e => e.val)), high = Math.max(...display.map(e => e.val));
  const change = Math.round((latest - first) * 10) / 10;
  const dir = change < 0 ? 'down' : change > 0 ? 'up' : 'same';
  $('bw-stats-row').innerHTML = `<div class="bw-head"><div class="bw-now">${latest}<small>${unit}</small></div>
    ${display.length > 1 ? `<div class="bw-delta ${dir}">${change > 0 ? '+' : ''}${change} ${unit} overall</div>` : ''}</div>
    <div class="bw-range">Low ${low} · High ${high}</div>`;

  const el = $('bw-chart-area');
  if (display.length >= 2) {
    const W = 340, H = 90, P = { t: 8, r: 4, b: 18, l: 4 };
    const cW = W - P.l - P.r, cH = H - P.t - P.b;
    const vals = display.map(e => e.val);
    const yMin = Math.min(...vals) - 1, yMax = Math.max(...vals) + 1, yR = yMax - yMin || 1;
    const x = i => P.l + (i / (display.length - 1)) * cW, y = v => P.t + cH - ((v - yMin) / yR) * cH;
    const path = display.map((e, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(e.val).toFixed(1)}`).join(' ');
    const area = `${path} L${x(display.length - 1).toFixed(1)},${P.t + cH} L${x(0).toFixed(1)},${P.t + cH} Z`;
    const n = display.length, sx = n * (n - 1) / 2, sy = vals.reduce((a, b) => a + b, 0);
    const sxy = vals.reduce((a, v, i) => a + i * v, 0), sx2 = vals.reduce((a, _, i) => a + i * i, 0);
    const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx || 1), icpt = (sy - slope * sx) / n;
    const lbl = i => `<text class="lc-axis" x="${x(i).toFixed(1)}" y="${H - 2}" text-anchor="${i === 0 ? 'start' : 'end'}">${fmtDate(display[i].date)}</text>`;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Body weight trend">
      <defs><linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--tint)" stop-opacity=".22"/><stop offset="1" stop-color="var(--tint)" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#bwGrad)"/>
      <line x1="${x(0)}" y1="${y(icpt).toFixed(1)}" x2="${x(n - 1)}" y2="${y(slope * (n - 1) + icpt).toFixed(1)}" stroke="var(--label3)" stroke-width="1.5" stroke-dasharray="3 4"/>
      <path class="lc-line" d="${path}"/>
      <circle class="lc-knob" cx="${x(n - 1).toFixed(1)}" cy="${y(latest).toFixed(1)}" r="4.5"/>
      ${lbl(0)}${lbl(n - 1)}
    </svg>`;
  } else el.innerHTML = '';

  const list = $('bw-entries');
  const rev = [...display].reverse().slice(0, 7);
  list.innerHTML = rev.map((e, i) => {
    const prev = display[display.length - 2 - i];
    const ch = prev ? Math.round((e.val - prev.val) * 10) / 10 : null;
    const col = ch === null ? '' : ch < 0 ? 'var(--tint)' : ch > 0 ? 'var(--orange)' : 'var(--label2)';
    return `<div class="swipe" data-date="${e.date}"><div class="swipe-action"><span>Delete</span></div>
      <div class="swipe-content row"><span class="row-main"><span class="row-title">${e.val} ${unit}</span><span class="row-sub">${fmtDate(e.date, { weekday:'short', month:'short', day:'numeric' })}</span></span>
      ${ch !== null ? `<span class="row-value" style="color:${col}">${ch > 0 ? '+' : ''}${ch}</span>` : ''}</div></div>`;
  }).join('');
  list.querySelectorAll('.swipe').forEach(r => swipeRow(r, () => deleteBwEntry(r.dataset.date)));
}

// ═══ CHART SHEET ═══════════════════════════════════════════════════════════
let chartExId = null, chartMetric = 'weight', chartPoints = [], chartUnit = '';
function openChart(exId) {
  const ex = allEx()[exId];
  if (!ex) return;
  chartExId = exId;
  chartMetric = ex.type === 'weight' ? 'weight' : ex.type === 'time' ? 'time' : 'reps';
  $('chart-title').textContent = ex.name;
  const tog = $('metric-toggle');
  if (ex.type === 'weight') {
    tog.hidden = false;
    segmented(tog, [{ v:'weight', label:'Weight' }, { v:'reps', label:'Reps' }, { v:'volume', label:'Volume' }], chartMetric, v => { chartMetric = v; renderChart(); });
  } else tog.hidden = true;
  renderChart();
  Sheets.open('chart-modal');
}
function getChartData(exId) {
  const ex = allEx()[exId];
  const pts = [];
  Object.keys(S.logs).sort().forEach(date => {
    const log = (S.logs[date] || {})[exId];
    if (!log || !log.sets || !log.sets.length) return;
    const s = log.sets;
    let val = 0;
    if (chartMetric === 'weight') val = Math.max(...s.map(x => x.weight || 0));
    else if (chartMetric === 'reps') val = ex.type === 'weight' ? Math.max(...s.map(x => x.reps || 0)) : s.reduce((a, b) => a + (b.reps || 0), 0);
    else if (chartMetric === 'volume') val = s.reduce((a, b) => a + (b.weight || 0) * (b.reps || 0), 0);
    else if (chartMetric === 'time') val = Math.max(...s.map(x => x.secs || 0));
    if (val > 0) pts.push({ date, label: fmtDate(date), val: Math.round(val * 10) / 10, feel: log.feel || 'good' });
  });
  return pts;
}
function chartReadout(p, title) {
  $('chart-readout').innerHTML = p
    ? `<div class="k">${title}</div><div class="v">${p.val.toLocaleString()}<small>${chartUnit}</small></div><div class="d">${fmtDate(p.date, { weekday:'short', month:'short', day:'numeric', year:'numeric' })} · felt ${p.feel}</div>`
    : '';
}
function renderChart() {
  const exId = chartExId;
  const pts = getChartData(exId);
  chartPoints = pts;
  chartUnit = { weight:' lbs', reps:' reps', volume:' lbs', time:' sec' }[chartMetric] || '';
  const wrap = $('line-chart-wrap');
  if (!pts.length) {
    chartReadout(null);
    wrap.innerHTML = '<div class="empty"><strong>No Data Yet</strong>Log this exercise to see your progress.</div>';
    $('chart-stats').innerHTML = ''; $('chart-hist-list').innerHTML = '';
    return;
  }
  const vals = pts.map(p => p.val);
  const max = Math.max(...vals), min = Math.min(...vals), latest = vals[vals.length - 1], change = Math.round((latest - vals[0]) * 10) / 10;
  chartReadout(pts[pts.length - 1], 'Latest');
  $('chart-stats').innerHTML = `
    <div class="tile"><div class="tile-label" style="--c:var(--gold)">Best</div><div class="tile-value">${max.toLocaleString()}</div></div>
    <div class="tile"><div class="tile-label">Sessions</div><div class="tile-value">${pts.length}</div></div>
    <div class="tile"><div class="tile-label" style="--c:${change >= 0 ? 'var(--tint)' : 'var(--orange)'}">Change</div><div class="tile-value">${change > 0 ? '+' : ''}${change.toLocaleString()}</div></div>`;

  const W = 360, H = 170, P = { t: 12, r: 10, b: 22, l: 34 };
  const cW = W - P.l - P.r, cH = H - P.t - P.b;
  const yMin = min * 0.92, yMax = max * 1.06 || 1, yR = yMax - yMin || 1;
  const x = i => P.l + (pts.length === 1 ? cW / 2 : (i / (pts.length - 1)) * cW);
  const y = v => P.t + cH - ((v - yMin) / yR) * cH;
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.val).toFixed(1)}`).join(' ');
  const area = `${path} L${x(pts.length - 1).toFixed(1)},${P.t + cH} L${x(0).toFixed(1)},${P.t + cH} Z`;
  const ticks = [yMin, (yMin + yMax) / 2, yMax];
  const step = Math.ceil(pts.length / 5);
  const pb = S.records[exId];
  const pbVal = pb ? (chartMetric === 'weight' ? pb.weight : chartMetric === 'time' ? pb.best : chartMetric === 'reps' && !pb.weight ? pb.totalReps : null) : null;
  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Progress chart">
    <defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--tint)" stop-opacity=".25"/><stop offset="1" stop-color="var(--tint)" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(v => `<line class="lc-grid" x1="${P.l}" x2="${W - P.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="lc-axis" x="${P.l - 6}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end">${Math.round(v)}</text>`).join('')}
    ${pts.map((p, i) => (i % step === 0 || i === pts.length - 1) ? `<text class="lc-axis" x="${x(i).toFixed(1)}" y="${H - 4}" text-anchor="middle">${p.label}</text>` : '').join('')}
    <path d="${area}" fill="url(#chartGrad)"/>
    <path class="lc-line" d="${path}"/>
    ${pts.map((p, i) => `<circle class="lc-dot${pbVal !== null && p.val >= pbVal ? ' pb' : ''}" cx="${x(i).toFixed(1)}" cy="${y(p.val).toFixed(1)}" r="3"/>`).join('')}
    <g id="lc-cursor" style="display:none"><line class="lc-cursor" y1="${P.t}" y2="${P.t + cH}"/><circle class="lc-knob" r="6"/></g>
  </svg>`;

  // Scrub: drag across to read any session (1:1, selection tick per point).
  const svg = wrap.querySelector('svg');
  const cursor = svg.querySelector('#lc-cursor');
  let lastIdx = -1;
  const pick = clientX => {
    const r = svg.getBoundingClientRect();
    const sx = ((clientX - r.left) / r.width) * W;
    let best = 0, bd = Infinity;
    pts.forEach((p, i) => { const d = Math.abs(x(i) - sx); if (d < bd) { bd = d; best = i; } });
    if (best !== lastIdx) {
      lastIdx = best;
      const cx = x(best), cy = y(pts[best].val);
      cursor.style.display = '';
      cursor.querySelector('line').setAttribute('x1', cx); cursor.querySelector('line').setAttribute('x2', cx);
      cursor.querySelector('circle').setAttribute('cx', cx); cursor.querySelector('circle').setAttribute('cy', cy);
      chartReadout(pts[best], best === pts.length - 1 ? 'Latest' : 'Session');
      haptic(5);
    }
  };
  wrap.onpointerdown = e => { wrap.setPointerCapture(e.pointerId); lastIdx = -1; pick(e.clientX); };
  wrap.onpointermove = e => { if (wrap.hasPointerCapture(e.pointerId)) pick(e.clientX); };
  wrap.onpointerup = wrap.onpointercancel = () => { cursor.style.display = 'none'; lastIdx = -1; chartReadout(pts[pts.length - 1], 'Latest'); };

  $('chart-hist-list').innerHTML = [...pts].reverse().map(p =>
    `<div class="row"><span class="row-main"><span class="row-title">${fmtDate(p.date, { weekday:'short', month:'short', day:'numeric' })}</span><span class="row-sub">Felt ${p.feel}</span></span><span class="row-value" style="color:var(--label)">${p.val.toLocaleString()}${chartUnit}</span></div>`).join('');
}

// ═══ SETTINGS ══════════════════════════════════════════════════════════════
function openSettings() { renderSettings(); Sheets.open('settings-modal'); }
function renderSettings() {
  $('setting-name').value = S.name || '';
  $('setting-start').textContent = S.startDate ? 'Training since ' + fmtDate(S.startDate, { month:'long', day:'numeric', year:'numeric' }) : '';
  $('setting-total').textContent = totalSessions();
  $('setting-best-streak').textContent = plural(S.bestStreak || 0, 'day');
  $('setting-days').textContent = Object.keys(S.logs).length;
  segmented($('theme-seg'), [{ v:'system', label:'Automatic' }, { v:'light', label:'Light' }, { v:'dark', label:'Dark' }], currentThemePref(), applyTheme);
  updateInitials();
}
function currentThemePref() { let t; try { t = localStorage.getItem('forged_theme'); } catch (e) {} return t === 'light' || t === 'dark' ? t : 'system'; }
function applyTheme(t) {
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
  try { localStorage.setItem('forged_theme', t); } catch (e) {}
  syncThemeColor();
}
function syncThemeColor() {
  const pref = currentThemePref();
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta-theme').setAttribute('content', dark ? '#000000' : '#F2F2F7');
}

function confirmClear() { if (confirm('Clear all workout data? This can’t be undone.')) clearAll(); }
function clearAll() {
  Object.assign(S, { checked:{}, logs:{}, records:{}, streak:0, bestStreak:0, notes:[], bwEntries:[], adhocExercises:{}, exUnits:{}, dayNotes:{}, hiddenExercises:{} });
  save();
  sessionPBs.clear();
  renderAll();
  renderSettings();
  toast('All data cleared');
}

function backupToFile() {
  const payload = { _forgedBackup: true, _version: 1, _date: new Date().toISOString(), ...S };
  const date = dk(new Date());
  downloadBlob(JSON.stringify(payload, null, 2), 'application/json', 'forged-backup-' + date + '.json');
  const el = $('backup-status');
  el.textContent = 'Backup saved ' + fmtDate(date, { month:'long', day:'numeric' }) + '. Keep it in Files or iCloud Drive.';
  el.className = 'group-footer ok';
  haptic();
}
function restoreFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const el = $('backup-status');
    try {
      const data = JSON.parse(e.target.result);
      if (!data._forgedBackup) throw new Error('That isn’t a Forged backup file.');
      const { _forgedBackup, _version, _date, ...r } = data;
      Object.assign(S, {
        checked: r.checked || {}, logs: r.logs || {}, records: r.records || {}, streak: r.streak || 0, bestStreak: r.bestStreak || 0,
        name: r.name || '', startDate: r.startDate || S.startDate, customExercises: r.customExercises || {}, customPlans: r.customPlans || {},
        weekAssignment: r.weekAssignment || S.weekAssignment, weekAssignmentB: r.weekAssignmentB || { ...DEFAULT_WEEK }, useAltWeeks: r.useAltWeeks || false,
        notes: r.notes || [], bwEntries: r.bwEntries || [], bwUnit: r.bwUnit || 'lbs', adhocExercises: r.adhocExercises || {},
        exUnits: r.exUnits || {}, dayNotes: r.dayNotes || {}, hiddenExercises: r.hiddenExercises || {},
      });
      save();
      el.textContent = 'Restored backup from ' + (_date ? fmtDate(_date.split('T')[0], { month:'long', day:'numeric', year:'numeric' }) : 'an unknown date') + '.';
      el.className = 'group-footer ok';
      renderAll(); renderSettings();
      haptic([12, 50, 12]);
      toast('Backup restored');
    } catch (err) {
      el.textContent = err.message + ' Choose a file saved from Forged.';
      el.className = 'group-footer err';
      toast('Couldn’t restore that file');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function openExportModal(type) {
  const AX = allEx();
  exportType = type;
  exportText = type === 'csv' ? buildCSV(AX) : type === 'bwcsv' ? buildBWCSV() : buildJSON(AX);
  $('export-title').textContent = type === 'csv' ? 'Workouts CSV' : type === 'bwcsv' ? 'Body Weight CSV' : 'JSON Export';
  $('export-sub').textContent = (exportText.length / 1024).toFixed(1) + ' KB';
  $('export-preview').textContent = exportText.slice(0, 600) + (exportText.length > 600 ? '\n…' : '');
  $('export-health-tip').textContent = type === 'csv' ? 'Save as a .csv file, then import it into Strong or Hevy — both sync to Apple Health.'
    : type === 'bwcsv' ? 'Opens in Numbers or Excel, or any health app that imports weight CSV.'
    : 'Every workout, record, note and weigh-in as structured JSON.';
  Sheets.open('export-modal');
}
function copyExport() {
  const ok = () => { haptic(); toast('Copied'); };
  if (navigator.clipboard) navigator.clipboard.writeText(exportText).then(ok).catch(fallbackCopy);
  else fallbackCopy();
}
function fallbackCopy() {
  const ta = document.createElement('textarea');
  ta.value = exportText; ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast('Copied'); } catch (e) { toast('Select the text to copy it'); }
  document.body.removeChild(ta);
}
function downloadBlob(text, mime, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.style.display = 'none';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadExport() {
  if (!exportText) return;
  const date = dk(new Date());
  if (exportType === 'json') downloadBlob(exportText, 'application/json', 'forged-data-' + date + '.json');
  else downloadBlob(exportText, 'text/csv', (exportType === 'bwcsv' ? 'forged-bodyweight-' : 'forged-workout-') + date + '.csv');
  haptic();
}
function showHealthInfo() { Sheets.open('health-modal'); }

// ═══ TOOLS ═════════════════════════════════════════════════════════════════
let ormUnit = 'lbs';
function openORM() {
  segmented($('orm-unit-seg'), [{ v:'lbs', label:'lbs' }, { v:'kg', label:'kg' }], ormUnit, setORMUnit);
  populateORMPBSelect();
  calcORM();
  Sheets.open('orm-modal');
}
function setORMUnit(u) { ormUnit = u; calcORM(); }
function calcORM() {
  const w = parseFloat($('orm-weight').value) || 0, reps = parseInt($('orm-reps').value) || 0;
  const el = $('orm-results');
  if (!w || reps < 1) { el.innerHTML = '<p class="footnote" style="text-align:center;padding:18px 0 4px">Enter a weight and the reps you did with it.</p>'; return; }
  const lbs = ormUnit === 'kg' ? w / 0.453592 : w;
  const formulas = [
    { name:'Epley', fn:(w, r) => r === 1 ? w : w * (1 + r / 30) },
    { name:'Brzycki', fn:(w, r) => r === 1 ? w : w * (36 / (37 - r)) },
    { name:'Lander', fn:(w, r) => r === 1 ? w : (100 * w) / (101.3 - 2.67123 * r) },
    { name:'Lombardi', fn:(w, r) => r === 1 ? w : w * Math.pow(r, 0.10) },
    { name:"O'Conner", fn:(w, r) => r === 1 ? w : w * (1 + r / 40) },
  ];
  const num = v => ormUnit === 'kg' ? Math.round(v * 0.453592) : Math.round(v);
  const disp = v => num(v) + ' ' + ormUnit;
  const vals = formulas.map(f => f.fn(lbs, reps));
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  el.innerHTML = `<div class="orm-hero"><div class="k">Estimated 1 Rep Max</div><div class="v">${disp(avg)}</div></div>
    <div class="pct-grid">${[0.9, 0.8, 0.7, 0.6].map(p => `<div class="tile"><div class="tile-label">${p * 100}%</div><div class="tile-value">${disp(avg * p)}</div></div>`).join('')}</div>
    <div class="field-label">By Formula</div>
    <div class="list">${formulas.map((f, i) => `<div class="row formula-row"><span class="row-main"><span class="row-title">${f.name}</span><span class="row-sub">90% ${num(vals[i] * 0.9)} · 80% ${num(vals[i] * 0.8)} · 70% ${num(vals[i] * 0.7)}</span></span><span class="row-value">${disp(vals[i])}</span></div>`).join('')}</div>`;
}
function populateORMPBSelect() {
  const AX = allEx();
  $('orm-pb-select').innerHTML = '<option value="">Choose</option>' + Object.keys(S.records).filter(id => AX[id] && AX[id].type === 'weight' && S.records[id].weight && S.records[id].reps)
    .map(id => `<option value="${id}">${esc(AX[id].name)} — ${esc(displayWeight(S.records[id].weight, getExUnit(id)))} × ${S.records[id].reps}</option>`).join('');
}
function loadPBIntoORM() {
  const id = $('orm-pb-select').value;
  const rec = S.records[id];
  if (!rec || !rec.weight || !rec.reps) return;
  ormUnit = getExUnit(id);
  segmented($('orm-unit-seg'), [{ v:'lbs', label:'lbs' }, { v:'kg', label:'kg' }], ormUnit, setORMUnit);
  $('orm-weight').value = ormUnit === 'kg' ? Math.round(rec.weight * 0.453592 * 10) / 10 : rec.weight;
  $('orm-reps').value = rec.reps;
  calcORM();
  haptic();
}

let plateUnit = 'lbs';
function openPlates(weight, unit) {
  if (unit) plateUnit = unit;
  if (weight) $('plate-weight-input').value = weight;
  segmented($('plate-unit-seg'), [{ v:'lbs', label:'lbs' }, { v:'kg', label:'kg' }], plateUnit, u => { plateUnit = u; fillBarOptions(); calcPlates(); });
  fillBarOptions();
  calcPlates();
  Sheets.open('plates-modal');
}
function openPlatesFromLog() {
  let w = '';
  for (let i = 0; i < logSetCount; i++) { const el = $('si-w-' + i); if (el && parseFloat(el.value)) { w = el.value; break; } }
  openPlates(w, getExUnit(logExId));
}
function fillBarOptions() {
  const sel = $('plate-bar-select');
  const opts = plateUnit === 'kg' ? [[20, '20 kg · Standard'], [15, '15 kg · Women’s']] : [[45, '45 lbs · Standard'], [35, '35 lbs · Women’s'], [25, '25 lbs · Technique']];
  sel.innerHTML = opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
}
function calcPlates() {
  const target = parseFloat($('plate-weight-input').value) || 0;
  const bar = parseFloat($('plate-bar-select').value) || (plateUnit === 'kg' ? 20 : 45);
  const unit = plateUnit;
  const el = $('plate-result');
  if (!target) { el.innerHTML = '<p class="footnote" style="text-align:center;padding:18px 0 4px">Enter the total weight you want on the bar.</p>'; return; }
  if (target <= bar) { el.innerHTML = `<div class="plate-warn">That’s the bar alone. Enter more than ${bar} ${unit}.</div>`; return; }
  const plates = unit === 'kg' ? [20, 15, 10, 5, 2.5, 1.25] : [45, 35, 25, 10, 5, 2.5];
  const colors = unit === 'kg'
    ? { 20:'#D93A30', 15:'#2F7DD8', 10:'#2E9E5B', 5:'#E3A21A', 2.5:'#7E57C2', 1.25:'#8E8E93' }
    : { 45:'#D93A30', 35:'#2F7DD8', 25:'#2E9E5B', 10:'#E3A21A', 5:'#7E57C2', 2.5:'#8E8E93' };
  let rem = (target - bar) / 2;
  const side = [];
  plates.forEach(p => { const c = Math.floor(rem / p + 0.001); for (let i = 0; i < c; i++) side.push(p); rem = Math.round((rem - c * p) * 1000) / 1000; });
  if (rem > 0.01) {
    const step = unit === 'kg' ? 2.5 : 5;
    el.innerHTML = `<div class="plate-warn">Standard plates can’t make exactly ${target} ${unit}.<br>Try ${Math.floor(target / step) * step} or ${Math.ceil(target / step) * step} ${unit}.</div>`;
    return;
  }
  const maxP = plates[0];
  const block = p => `<div class="plate-block" style="background:${colors[p]};width:${p >= maxP * 0.5 ? 16 : 12}px;height:${Math.round(34 + (p / maxP) * 56)}px"></div>`;
  const counts = {};
  side.forEach(p => counts[p] = (counts[p] || 0) + 1);
  el.innerHTML = `<div class="plate-visual" role="img" aria-label="Barbell loading">
      ${[...side].reverse().map(block).join('')}<div class="plate-sleeve"></div><div class="plate-bar"></div><div class="plate-sleeve"></div>${side.map(block).join('')}
    </div>
    <div class="plate-total"><strong>${target} ${unit}</strong> · bar ${bar} + ${side.reduce((a, b) => a + b, 0) * 2} in plates</div>
    <div class="field-label">Each Side</div>
    <div class="list">${Object.entries(counts).sort((a, b) => b[0] - a[0]).map(([p, c]) =>
      `<div class="row"><span class="dot" style="--c:${colors[p]};width:14px;height:14px"></span><span class="row-main"><span class="row-title">${p} ${unit}</span></span><span class="row-value">× ${c}</span></div>`).join('')}</div>`;
}

// ═══ BOOT ══════════════════════════════════════════════════════════════════
function renderAll() {
  updateStreak();
  renderToday();
  if (curTab === 'history') renderHistory();
  if (curTab === 'plans') renderPlans();
  if (curTab === 'progress') renderStanding();
  updateInitials();
}

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('touchstart', () => {}, { passive: true }); // enables :active on iOS
  load();
  applyTheme(currentThemePref());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeColor);
  updateStreak();
  save();
  renderToday();
  updateInitials();
  tabSpring.set(0);
  bindScrollEffects();
  bindPlanListEvents();
  bindRestPillGesture();

  $('today-content').addEventListener('click', e => {
    const c = e.target.closest('[data-check]');
    if (c) { toggleCheck(c.dataset.check); return; }
    const l = e.target.closest('[data-log]');
    if (l) { openLogModal(l.dataset.log); return; }
    const a = e.target.closest('[data-action="add"]');
    if (a) openPicker('today');
  });
  $('cal-grid').addEventListener('click', e => {
    const c = e.target.closest('[data-day]');
    if (!c) return;
    calSelected = calSelected === c.dataset.day ? null : c.dataset.day;
    haptic(5);
    renderCalendar();
  });
  calPager = pager($('cal-grid'), { canPrev: () => true, canNext: canCalNext, onPrev: () => calShift(-1), onNext: () => calShift(1) });

  const name = $('setting-name');
  name.addEventListener('input', () => { S.name = name.value; save(); updateInitials(); });
  name.addEventListener('keydown', e => { if (e.key === 'Enter') name.blur(); });
  $('toast-action').addEventListener('click', () => { const u = hud.undo; hud.undo = null; hideToast(); if (u) u(); });

  // Day rollover while the app sits in the background.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && dk(new Date()) !== curDK) { updateStreak(); renderAll(); }
    if (document.visibilityState === 'visible' && rest.endAt && $('rest-timer-bar').classList.contains('show')) tickRest();
  });
});

// ═══ CARRIED OVER FROM v1 (unchanged logic) ════════════════════════════════
function getMotivMsg(h, pid, plan, streak){
  const fn=(S.name||'').split(/\s/)[0];
  const isRest=pid==='rest', isActive=pid==='active', hasWorkout=!!plan;
  const pn=plan?plan.name.toLowerCase():'';
  const isLegs=/leg|squat|glute|hamstring|quad/i.test(pn);
  const isBack=/back|pull|deadlift|row/i.test(pn);
  const isChest=/chest|push|bench/i.test(pn);
  const isShoulders=/shoulder|delt|overhead/i.test(pn);
  const isArms=/arm|bicep|tricep|curl/i.test(pn);
  const isCardio=/cardio|run|cycle|endur|conditioning/i.test(pn);

  const MORNING=[
    'Good morning. Time to build.',
    'Rise and lift.',
    'Early session. Most people are still asleep.',
    'Morning iron. Best decision you\'ll make today.',
    'Up before the excuses. Good.',
    'Quiet gym, loud results.',
    'The morning belongs to those who earn it.',
    'First rep of the day is always the hardest. Do it.',
    'Morning session locked in.',
    'The day starts right when it starts here.',
    'Early bird gets the gains.',
    'Coffee and iron. The morning formula.',
  ];
  const AFTERNOON=[
    'Midday grind. Good call.',
    'Lunch break well spent.',
    'Afternoon session hits different.',
    'Most people scrolled. You lifted.',
    'Energy up. Let\'s work.',
    'The afternoon belongs to you.',
    'No better way to break up the day.',
    'Second wind loading.',
    'Halfway through the day. Finish it strong.',
    'Afternoon iron. Underrated.',
  ];
  const EVENING=[
    'Evening session. End the day right.',
    'Day\'s not done until the iron is moved.',
    'End strong.',
    'Evening lifters are built different.',
    'Most people called it a day. Not you.',
    'Winding down? Not yet.',
    'The night shift. Let\'s work.',
    'Close the day the right way.',
    'Last push of the day. Make it count.',
    'Evening grind is quiet dedication.',
    'The hard part is showing up this late. You did.',
  ];
  const NIGHT=[
    'Late night. The dedication is real.',
    'When the world sleeps, you train.',
    'Midnight grind is a different breed.',
    'Not everyone would do this. You do.',
    'The late session. It counts double.',
    'Night owl. Iron bird.',
  ];
  const REST=[
    'Recovery is part of the process.',
    'Muscles grow on rest days. Take it seriously.',
    'Rest hard. Train harder tomorrow.',
    'Today the weights rest. Tomorrow they won\'t.',
    'The comeback is built on days like this.',
    'Sleep, eat, recover. That\'s the job today.',
    'Smart athletes rest on purpose.',
    'Stillness is strength too.',
    'Your body is repairing right now. Let it.',
    'The best sessions start with good recovery.',
    'Rest day is progress day in disguise.',
    'Earn the next session by recovering from the last.',
  ];
  const ACTIVE=[
    'Move your body however you want today.',
    'Active day. No rules. Just move.',
    'Scheduled freedom. Make it yours.',
    'Get outside. Do something you love.',
    'Movement is medicine.',
    'Today\'s workout is whatever makes you feel good.',
    'Active recovery still counts.',
    'No plan needed. Just go.',
  ];
  const LEGS=[
    'Leg day. The most feared, the most rewarding.',
    'Leg day separates the committed.',
    'Nobody wants to do leg day. You\'re doing it anyway.',
    'Quads, hamstrings, glutes. Let\'s go.',
    'Your legs are about to earn it.',
    'The biggest muscles deserve the most respect.',
    'Leg day is character day.',
  ];
  const BACK=[
    'Back day. Build the foundation.',
    'Strong back, strong everything.',
    'Pull heavy. The back that carries you.',
    'Back day is underrated. You know better.',
    'The muscles they can\'t see are the ones that matter.',
  ];
  const CHEST=[
    'Chest day. Classic.',
    'Push hard. Build the engine.',
    'Chest day means business.',
    'Bench day. Respect it.',
  ];
  const SHOULDERS=[
    'Shoulder day. Build the boulders.',
    'Delts incoming.',
    'Overhead press is king. You know this.',
    'Shoulder session. Press heavy, move well.',
  ];
  const ARMS=[
    'Arm day. You earned it.',
    'Curl season is year-round.',
    'Arms. The reward after a week of hard work.',
    'Biceps and triceps. Let\'s get it.',
  ];
  const CARDIO=[
    'Heart is a muscle. Train it.',
    'Conditioning work. This is where grit lives.',
    'Cardio hits different when you lean into it.',
    'Breathe through it. That\'s the whole skill.',
    'Cardio day — the discipline nobody posts about.',
  ];

  let pool=[];
  if(isRest) pool=REST;
  else if(isActive) pool=ACTIVE;
  else{
    if(h<5) pool=NIGHT;
    else if(h<12) pool=MORNING;
    else if(h<17) pool=AFTERNOON;
    else pool=EVENING;
    if(isLegs) pool=pool.concat(LEGS);
    if(isBack) pool=pool.concat(BACK);
    if(isChest) pool=pool.concat(CHEST);
    if(isShoulders) pool=pool.concat(SHOULDERS);
    if(isArms) pool=pool.concat(ARMS);
    if(isCardio) pool=pool.concat(CARDIO);
  }

  // Streak bonus messages mixed in
  if(streak>=3){
    const sm=[
      streak+' days straight. Keep the chain alive.',
      streak+'-day streak. This is who you are now.',
      streak+' in a row. Don\'t let today break it.',
      'Day '+streak+'. The streak is sacred.',
    ];
    if(Math.random()<0.35) pool=pool.concat(sm);
  }

  const msg=pool[Math.floor(Math.random()*pool.length)];
  // Prepend first name ~40% of the time if we have it
  if(fn&&Math.random()<0.4) return fn+'. '+msg;
  return msg;
}

function calcProgression(exId) {
  const ex = allEx()[exId];
  if (!ex) return null;

  // Get all previous logs for this exercise, sorted newest first
  const dates = Object.keys(S.logs).sort().reverse();
  const history = [];
  for (const d of dates) {
    const log = (S.logs[d] || {})[exId];
    if (log) history.push({ date: d, log });
  }
  if (!history.length) return null;

  const last = history[0].log;
  const pb = S.records[exId];

  if (ex.type === 'weight') {
    // Get last session stats
    const lastSets = last.sets.filter(s => s.reps > 0 && s.weight > 0);
    if (!lastSets.length) return null;
    const lastWeight = Math.max(...lastSets.map(s => s.weight));
    const lastReps = Math.max(...lastSets.map(s => s.reps));
    const targetSets = ex.sets || 3;
    const targetReps = ex.val || 10;

    // Progressive overload rules:
    // 1. If hit all target reps at current weight → add weight
    // 2. If couldn't complete all reps → keep weight, work up to target reps
    // 3. If surpassed target reps → bigger weight jump
    const completedAllSets = lastSets.length >= targetSets;
    const avgReps = lastSets.reduce((a, b) => a + b.reps, 0) / lastSets.length;

    let suggestedWeight, suggestedReps, reason;

    // Weight increment logic — smaller for upper body isolation, bigger for compounds
    const isCompound = ['squat','deadlift','bench','press','row','pull'].some(k => ex.name.toLowerCase().includes(k));
    const increment = isCompound ? 5 : 2.5;

    if (completedAllSets && avgReps >= targetReps) {
      // Ready to increase weight
      suggestedWeight = lastWeight + increment;
      suggestedReps = targetReps;
      reason = `You hit ${targetSets}×${Math.round(avgReps)} at ${lastWeight}lbs last session. Time to add ${increment}lbs.`;
    } else if (avgReps >= targetReps * 1.2) {
      // Exceeded reps significantly — bigger jump
      suggestedWeight = lastWeight + (increment * 2);
      suggestedReps = targetReps;
      reason = `You exceeded your target reps. Jump ${increment * 2}lbs.`;
    } else {
      // Keep same weight, aim for more reps or full sets
      suggestedWeight = lastWeight;
      suggestedReps = Math.min(targetReps, Math.round(avgReps) + 1);
      reason = `Keep weight at ${lastWeight}lbs and add ${Math.round(avgReps) + 1 - Math.round(avgReps)} rep per set. Hit all ${targetSets} sets before going heavier.`;
    }

    // Also compute estimated 1RM (Epley formula)
    const e1rm = lastWeight * (1 + lastReps / 30);

    return {
      type: 'weight',
      suggestedWeight,
      suggestedReps,
      targetSets,
      lastWeight,
      lastReps,
      e1rm: Math.round(e1rm),
      reason,
      increment
    };

  } else if (ex.type === 'time') {
    const lastSecs = Math.max(...last.sets.map(s => s.secs || 0));
    if (!lastSecs) return null;
    const targetSecs = ex.val || 30;
    const increment = lastSecs >= targetSecs ? 10 : 5;
    const suggested = lastSecs + increment;
    return {
      type: 'time',
      lastSecs,
      suggestedSecs: suggested,
      reason: `Last hold: ${lastSecs}s. Add ${increment}s this session.`
    };

  } else {
    // Reps-based
    const lastTotalReps = last.sets.reduce((a, b) => a + (b.reps || 0), 0);
    const lastSets = last.sets.filter(s => s.reps > 0);
    const avgReps = lastSets.length ? lastTotalReps / lastSets.length : 0;
    const targetReps = ex.val || 10;
    if (!avgReps) return null;
    const suggestedReps = avgReps >= targetReps
      ? Math.round(avgReps) + 1
      : Math.round(avgReps) + 1;
    return {
      type: 'reps',
      lastAvgReps: Math.round(avgReps),
      suggestedReps,
      reason: `Last session avg: ${Math.round(avgReps)} reps/set. Aim for ${suggestedReps} per set today.`
    };
  }
}

function buildCSV(AX){
  const rows=['Date,Exercise,Muscle,Set,Reps,Weight (lbs),Duration (sec),Feel,Type'];
  Object.keys(S.logs).sort().forEach(date=>{
    Object.keys(S.logs[date]).forEach(exId=>{
      const log=S.logs[date][exId],ex=AX[exId];if(!log||!ex)return;
      if(log.warmups)log.warmups.forEach((set,i)=>{rows.push([date,'"'+ex.name+'"',ex.muscle,'W'+(i+1),set.reps||'',set.weight||'','',log.feel||'good','warmup'].join(','));});
      log.sets.forEach((set,i)=>{rows.push([date,'"'+ex.name+'"',ex.muscle,i+1,set.reps||'',set.weight||'',set.secs||'',log.feel||'good','working'].join(','));});
    });
  });
  return rows.join('\n');
}

function buildBWCSV() {
  const entries = S.bwEntries || [];
  if (!entries.length) return 'Date,Weight,Unit\n(no entries)';
  const rows = ['Date,Weight,Unit'];
  entries.slice().sort((a,b) => a.date.localeCompare(b.date)).forEach(e => {
    rows.push([e.date, e.val, e.unit || 'lbs'].join(','));
  });
  return rows.join('\n');
}

function buildJSON(AX){
  const workouts=[];
  Object.keys(S.logs).sort().forEach(date=>{
    const exes=[];
    Object.keys(S.logs[date]).forEach(exId=>{
      const log=S.logs[date][exId],ex=AX[exId];if(!log||!ex)return;
      exes.push({name:ex.name,type:ex.type,muscle:ex.muscle,feel:log.feel,sets:log.sets});
    });
    if(exes.length)workouts.push({date,exercises:exes});
  });
  return JSON.stringify({app:'FORGED',exported:new Date().toISOString(),user:S.name||'',workouts,records:S.records,notes:S.notes,bodyWeight:S.bwEntries},null,2);
}
