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

// Anatomical figure, drawn as the left half (viewer's left) and mirrored.
// viewBox units: the body is ~430 tall, centred on x = 100.
const BODY_SILHOUETTE = `M100 8C86 8 78 20 78 34C78 46 83 56 90 60L90 70C82 76 66 80 56 86C46 90 41 100 41 114
  C40 128 38 148 37 168C36 182 35 192 34 200C32 220 29 240 28 258C26 266 24 274 24 282C24 292 28 300 33 302
  C38 303 41 297 42 290C46 287 48 281 46.5 276C45 272 44 268 44 264C46 246 50 226 53 206C55 196 56 186 57 176C58 160 59 146 61 132
  C62 150 64 172 66 196C67 212 64 228 63 244C62 270 63 300 68 330C70 342 70 352 69 362C66 380 66 396 72 412
  C74 420 74 426 72 430C70 436 76 440 84 440C92 440 95 436 94 430C93 422 93 414 94 404C96 388 96 372 94 360
  C93 350 94 342 95 334C97 310 99 285 100 266Z`;

const BODY_FRONT = {
  muscles: [
    ['traps', 'M90 72C84 78 74 82 62 86C74 91 86 93 94 92C92 86 91 78 90 72Z'],
    ['shoulders', 'M64 86C54 86 44 94 42 108C41 120 43 132 47 140C51 134 56 128 61 122C61 112 63 100 66 92C66 89 65 87 64 86Z'],
    ['chest', 'M99 100C88 96 75 98 67 105C63 111 61.5 121 63.5 130C67 138 78 143 90 141C94 140 97 138 99 136Z'],
    ['biceps', 'M47 141C52 135 58.5 135 60 141C61 154 59.5 168 56.5 180C52.5 186 45 184 43 174C41.5 162 42 150 47 141Z'],
    ['forearms', 'M37 206C42 200 52 200 55 206C53 222 49 238 44 252C40 256 33 254 31 248C30 234 32 218 37 206Z'],
    ['obliques', 'M66 143C72 145 80 149 83 155L84 224C78 222 72 218 69 210C67 192 66 167 66 143Z'],
    ['abs', 'M99 142V238C93 240 88 236 86.5 228L85.5 153C85.5 146 90 142 99 142Z'],
    ['quads', 'M65.5 250C73 254 81 262 88 274C90 293 89.5 313 87 330C81 337 74.5 336 70.5 330C66.5 312 64.5 282 65.5 250Z'],
    ['adductors', 'M90.5 268C94 264.5 99 266 99 271V296C98.5 308 96.5 316 93.5 322C91 310 89.8 296 89.8 284C89.8 278 90 272 90.5 268Z'],
    ['calves', 'M71 366C76 362 84 364 86 370C86 386 83 400 79 410C75 410 71 400 70 388C69 380 69 372 71 366Z'],
  ],
  // Gaps between ab segments, collarbones, kneecaps — quiet anatomical detail.
  seams: 'M86 166H114M86 189H114M86 212H114M100 142V238',
  detail: 'M92 62C94 72 96 81 98.5 89M74 87C82 91 90 92 98 90M70 238C77 249 86 257 95 263M77 349C81 353 87 353 91 349',
};
const BODY_BACK = {
  muscles: [
    ['lats', 'M66 130C74 132 86 136 96 146L97 197C90 201 80 206 70 212C67 196 65 160 66 130Z'],
    ['upper-back', 'M64 100C72 98 82 102 90 112L94 130C86 130 76 128 68 124C64 118 63 108 64 100Z'],
    ['traps', 'M100 66C96 72 88 80 64 88C76 94 86 104 92 118C95 128 97 140 100 152Z'],
    ['shoulders', 'M64 86C54 86 44 94 42 108C41 120 43 132 47 140C51 134 56 128 61 122C61 112 63 100 66 92C66 89 65 87 64 86Z'],
    ['triceps', 'M47 141C52 135 58.5 135 60 141C61 154 59.5 168 56.5 180C52.5 186 45 184 43 174C41.5 162 42 150 47 141Z'],
    ['forearms', 'M37 206C42 200 52 200 55 206C53 222 49 238 44 252C40 256 33 254 31 248C30 234 32 218 37 206Z'],
    ['lower-back', 'M86 200C91 196 98 197 98.5 202V238C92 240 84 237 77 231C76.5 219 80 207 86 200Z'],
    ['glutes', 'M65 238C72 231 88 233 99 241V272C90 282 74 282 66 272C63 262 63 248 65 238Z'],
    ['hamstrings', 'M67 284C75 290 86 290 95 286C95 304 93 320 89 334C83 340 75 338 71 330C67 314 66 300 67 284Z'],
    ['calves', 'M71 362C77 356 90 358 94 366C94 382 90 396 84 402C78 404 72 398 70 388C68 378 69 368 71 362Z'],
  ],
  seams: 'M100 66V272',
  detail: 'M92 62C93 66 95 69 97 70M78 352C83 349 89 349 93 352',
};

// Three-stop scale so levels read at a glance: grey (none) → green (some)
// → sky blue (hit the target and beyond).
function muscleFill(v, target) {
  if (!v) return 'var(--body-muscle)';
  const r = clamp(v / target, 0, 1);
  if (r <= 0.5) return `color-mix(in srgb, var(--tint) ${Math.round(30 + 140 * r)}%, var(--body-muscle))`;
  return `color-mix(in srgb, var(--body-high) ${Math.round((r - 0.5) * 200)}%, var(--tint))`;
}

function bodySVG(view, vol, target, label) {
  const mz = (m, d) => `<path class="mz${bodySelected === m ? ' sel' : ''}" data-m="${m}" d="${d}" style="fill:${muscleFill(vol[m], target)}"><title>${MUSCLES[m]}</title></path>`;
  const half = `<path class="body-base" d="${BODY_SILHOUETTE}"/><path class="body-detail" d="${view.detail}"/>${view.muscles.map(([m, d]) => mz(m, d)).join('')}`;
  return `<figure class="body-fig">
    <svg viewBox="18 4 164 440" role="img" aria-label="${label} muscle map">
      ${half}<g transform="translate(200 0) scale(-1 1)">${half}</g>
      <path class="body-seam" d="${view.seams}"/>
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
    <div class="body-legend"><i></i><div class="body-ticks"><span>0</span><span>${Math.round(target / 2)}</span><span>${Math.round(target)}+ sets</span></div></div>
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
