// FORGED — muscle map.
// Counts working sets per muscle over a window (primary = 1, secondary = ½)
// and draws a front/back body with each muscle tinted by how much it's worked.

let bodyRange = 7, bodySelected = null;

function exMuscles(id) {
  if (EX_MUSCLES[id]) return EX_MUSCLES[id];
  const ex = allEx()[id];
  return (ex && GROUP_MUSCLES[ex.muscle]) || {};
}

function muscleVolume(days) {
  const AX = allEx();
  const vol = {}, from = {};
  let cardio = 0;
  Object.keys(MUSCLES).forEach(m => { vol[m] = 0; from[m] = {}; });
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = dk(d);
    const logs = S.logs[key] || {}, ch = S.checked[key] || {};
    const ids = new Set([...Object.keys(logs), ...Object.keys(ch).filter(id => ch[id])]);
    ids.forEach(id => {
      const ex = AX[id];
      if (!ex) return;
      const log = logs[id];
      const sets = log ? doneSets(log).length : (ch[id] ? (ex.sets || 1) : 0);
      if (!sets) return;
      const map = exMuscles(id);
      if (map.cardio) cardio++;
      (map.p || []).forEach(m => { vol[m] += sets; from[m][ex.name] = (from[m][ex.name] || 0) + sets; });
      (map.s || []).forEach(m => { vol[m] += sets / 2; from[m][ex.name] = (from[m][ex.name] || 0) + sets / 2; });
    });
  }
  return { vol, from, cardio };
}

// Shapes are drawn for the left side of the figure and mirrored for the right.
const BODY_FRONT = {
  base: `<ellipse cx="60" cy="18" rx="11" ry="13"/><path d="M54 29h12v10H54z"/>
    <path d="M42 106Q60 115 78 106L77 123Q60 129 43 123Z"/>`,
  baseL: `<circle cx="27" cy="114" r="4.5"/><ellipse cx="50.5" cy="176" rx="5" ry="4"/><ellipse cx="50" cy="227" rx="5.5" ry="4"/>`,
  center: [['traps', 'M47 41Q54 36 60 37Q66 36 73 41L68 45H52Z'], ['abs', 'M52 74Q52 69 57 69H63Q68 69 68 74V104Q68 110 60 111Q52 110 52 104Z']],
  left: [
    ['shoulders', 'M40 41Q48 41 49 49Q47 58 40 59Q31 58 31 50Q32 42 40 41Z'],
    ['chest', 'M59 45V66Q50 71 43 65Q40 55 46 47Q52 43 59 45Z'],
    ['obliques', 'M43 68Q48 70 50 73V106Q45 104 42 98Q40 83 43 68Z'],
    ['biceps', 'M33 58Q39 59 39 66L38 78Q36 84 32 82Q28 78 28 70Q28 60 33 58Z'],
    ['forearms', 'M30 84Q35 85 34 92L32 108Q29 112 26 108Q24 98 25 90Q26 84 30 84Z'],
    ['quads', 'M43 124Q52 122 57 128L56 168Q50 176 45 170Q40 150 43 124Z'],
    ['adductors', 'M56 127H59.5V149Q56.5 145 56 136Z'],
    ['calves', 'M45 182Q51 178 55 182L54 214Q50 222 47 214Q44 198 45 182Z'],
  ],
};
const BODY_BACK = {
  base: `<ellipse cx="60" cy="18" rx="11" ry="13"/><path d="M54 29h12v10H54z"/>`,
  baseL: `<circle cx="27" cy="114" r="4.5"/><ellipse cx="50.5" cy="176" rx="5" ry="4"/><ellipse cx="50" cy="227" rx="5.5" ry="4"/>`,
  center: [['lower-back', 'M53 92Q60 88 67 92V106Q60 110 53 106Z']],
  left: [
    ['upper-back', 'M52 47L59 63L58 76Q49 74 45 62Q46 52 52 47Z'],
    ['lats', 'M44 63Q48 75 57 78L56 99Q48 97 44 89Q41 75 44 63Z'],
    ['shoulders', 'M40 41Q48 41 49 49Q47 58 40 59Q31 58 31 50Q32 42 40 41Z'],
    ['triceps', 'M33 58Q39 59 39 66L38 78Q36 84 32 82Q28 78 28 70Q28 60 33 58Z'],
    ['forearms', 'M30 84Q35 85 34 92L32 108Q29 112 26 108Q24 98 25 90Q26 84 30 84Z'],
    ['glutes', 'M51 108Q59 108 59.5 116Q59.5 127 51 128Q42 127 42 118Q43 109 51 108Z'],
    ['hamstrings', 'M43 130Q51 127 58 131L57 166Q51 174 46 168Q41 150 43 130Z'],
    ['calves', 'M45 180Q51 176 56 181L55 206Q50 220 46 208Q43 194 45 180Z'],
  ],
  centerTop: [['traps', 'M60 34L73 43L66 49L60 66L54 49L47 43Z']],
};

function muscleFill(v, target) {
  if (!v) return 'var(--body-muscle)';
  const pct = Math.round(25 + 75 * clamp(v / target, 0, 1));
  return `color-mix(in srgb, var(--tint) ${pct}%, var(--body-muscle))`;
}

function bodySVG(view, vol, target, label) {
  const mz = (m, d) => `<path class="mz${bodySelected === m ? ' sel' : ''}" data-m="${m}" d="${d}" style="fill:${muscleFill(vol[m], target)}"><title>${MUSCLES[m]}</title></path>`;
  const left = view.left.map(([m, d]) => mz(m, d)).join('');
  return `<figure class="body-fig">
    <svg viewBox="16 0 88 236" role="img" aria-label="${label} muscle map">
      <g class="body-base">${view.base}${view.baseL}<g transform="translate(120 0) scale(-1 1)">${view.baseL}</g></g>
      ${view.center.map(([m, d]) => mz(m, d)).join('')}
      ${left}<g transform="translate(120 0) scale(-1 1)">${left}</g>
      ${(view.centerTop || []).map(([m, d]) => mz(m, d)).join('')}
    </svg>
    <figcaption>${label}</figcaption>
  </figure>`;
}

function renderBodyMap() {
  const el = $('body-map');
  if (!el) return;
  const { vol, from, cardio } = muscleVolume(bodyRange);
  // ~10–20 hard sets a week is a common growth target; 12 reads as "well trained".
  const target = 12 * (bodyRange / 7);
  const ranked = Object.keys(MUSCLES).sort((a, b) => vol[b] - vol[a]);
  const total = Object.values(vol).reduce((a, b) => a + b, 0);
  let readout;
  if (bodySelected) {
    const m = bodySelected;
    const names = Object.entries(from[m]).sort((a, b) => b[1] - a[1]).map(([n]) => n);
    readout = `<div class="body-read"><div class="k">${MUSCLES[m]}</div><div class="v">${fmtSets(vol[m])}</div>
      <div class="d">${names.length ? esc(names.slice(0, 3).join(', ')) + (names.length > 3 ? ` +${names.length - 3}` : '') : 'Not trained in this period'}</div></div>`;
  } else {
    readout = `<div class="body-read"><div class="k">Most trained</div><div class="v">${total ? MUSCLES[ranked[0]] : '—'}</div>
      <div class="d">${total ? `${fmtSets(vol[ranked[0]])} · tap a muscle for details` : 'Log a workout to light up the map'}</div></div>`;
  }
  const big = ['chest', 'shoulders', 'lats', 'upper-back', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps', 'abs'];
  const behind = total ? big.filter(m => vol[m] < target * 0.34).sort((a, b) => vol[a] - vol[b]).slice(0, 4) : [];
  el.innerHTML = `
    <div class="body-figs">${bodySVG(BODY_FRONT, vol, target, 'Front')}${bodySVG(BODY_BACK, vol, target, 'Back')}</div>
    <div class="body-legend"><span>Less</span><i></i><span>More</span></div>
    ${readout}
    ${behind.length ? `<div class="body-behind"><div class="k">Could use more work</div><div class="chips flush">${behind.map(m =>
      `<button class="chip" data-m="${m}" aria-pressed="${bodySelected === m}">${MUSCLES[m]} · ${fmtSets(vol[m], true)}</button>`).join('')}</div></div>` : ''}
    ${cardio ? `<div class="body-cardio">${I.walk}${plural(cardio, 'cardio session')}</div>` : ''}`;
}

function fmtSets(v, short) {
  const n = Math.round(v * 2) / 2;
  return short ? n + '' : n + ' set' + (n === 1 ? '' : 's');
}

function bindBodyMap() {
  segmented($('body-seg'), [{ v:'7', label:'7 Days' }, { v:'30', label:'30 Days' }], String(bodyRange), v => { bodyRange = +v; renderBodyMap(); });
  $('body-map').addEventListener('click', e => {
    const t = e.target.closest('[data-m]');
    if (!t) return;
    bodySelected = bodySelected === t.dataset.m ? null : t.dataset.m;
    haptic(5);
    renderBodyMap();
  });
}
