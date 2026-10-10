// FORGED — motion + gesture engine.
// Springs (damping ratio + response), velocity tracking, momentum projection,
// rubber-banding, interruptible sheets, swipe actions, haptics.
// Everything a finger can touch is driven by a spring so it can be grabbed
// mid-flight and always starts from its current on-screen value.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ── Spring ─────────────────────────────────────────────────────────────────
// Apple's designer-friendly parameters: dampingRatio (1 = no overshoot) and
// response (seconds, roughly how fast it gets there). Mass = 1.
class Spring {
  constructor({ value = 0, damping = 1, response = 0.35, onUpdate = () => {}, onRest = null } = {}) {
    this.value = value;
    this.velocity = 0;
    this.target = value;
    this.damping = damping;
    this.response = response;
    this.onUpdate = onUpdate;
    this.onRest = onRest;
    this._raf = 0;
    this._last = 0;
  }
  get running() { return !!this._raf; }
  // Jump without animating (used while a finger is tracking 1:1).
  set(v) {
    this.stop();
    this.value = this.target = v;
    this.velocity = 0;
    this.onUpdate(v);
  }
  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }
  // Re-target. Keeps current value + velocity unless a velocity is handed off.
  to(target, opts = {}) {
    this.target = target;
    if (opts.velocity !== undefined) this.velocity = opts.velocity;
    if (opts.damping !== undefined) this.damping = opts.damping;
    if (opts.response !== undefined) this.response = opts.response;
    if (opts.onRest !== undefined) this.onRest = opts.onRest;
    if (reduceMotion.matches) {
      this.stop();
      this.value = target;
      this.velocity = 0;
      this.onUpdate(target);
      this._settle();
      return this;
    }
    if (!this._raf) {
      this._last = performance.now();
      this._raf = requestAnimationFrame(t => this._tick(t));
    }
    return this;
  }
  _settle() {
    const cb = this.onRest;
    if (cb) cb(this.value);
  }
  _tick(now) {
    let dt = Math.min((now - this._last) / 1000, 1 / 30);
    this._last = now;
    const k = Math.pow((2 * Math.PI) / this.response, 2);
    const c = (4 * Math.PI * this.damping) / this.response;
    const h = 1 / 240;
    while (dt > 0) {
      const step = Math.min(h, dt);
      const a = -k * (this.value - this.target) - c * this.velocity;
      this.velocity += a * step;
      this.value += this.velocity * step;
      dt -= step;
    }
    if (Math.abs(this.value - this.target) < 0.05 && Math.abs(this.velocity) < 0.5) {
      this.value = this.target;
      this.velocity = 0;
      this._raf = 0;
      this.onUpdate(this.value);
      this._settle();
      return;
    }
    this.onUpdate(this.value);
    this._raf = requestAnimationFrame(t => this._tick(t));
  }
}

// Where a flick would come to rest — Apple's scroll-deceleration projection.
function project(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

// Progressive resistance past a boundary.
function rubberband(overshoot, dimension, constant = 0.55) {
  const o = Math.abs(overshoot);
  const r = (o * dimension * constant) / (dimension + constant * o);
  return overshoot < 0 ? -r : r;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Keeps ~100ms of samples so release velocity reflects the end of the gesture.
class VelocityTracker {
  constructor() { this.samples = []; }
  reset() { this.samples = []; }
  add(x, t = performance.now()) {
    this.samples.push({ x, t });
    while (this.samples.length > 2 && t - this.samples[0].t > 100) this.samples.shift();
  }
  get() {
    const s = this.samples;
    if (s.length < 2) return 0;
    const last = s[s.length - 1];
    if (performance.now() - last.t > 60) return 0; // finger stopped before lifting
    const first = s[0];
    const dt = (last.t - first.t) / 1000;
    return dt > 0 ? (last.x - first.x) / dt : 0;
  }
}

// ── Haptics ────────────────────────────────────────────────────────────────
// Android: Vibration API. iOS Safari 18+: toggling a native <input switch>
// produces a system tick. Used only at meaningful moments.
const _hapticLabel = (() => {
  const label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:fixed;left:-200px;top:0;opacity:0;pointer-events:none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;
  label.appendChild(input);
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(label));
  return label;
})();
function haptic(pattern = 10) {
  if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} return; }
  try { _hapticLabel.click(); } catch (e) {}
}

// ── Sheets ─────────────────────────────────────────────────────────────────
// Bottom sheets that track the finger 1:1, inherit release velocity, project
// momentum to choose open vs. dismissed, rubber-band upward, push the layer
// beneath back, and can be grabbed again mid-animation.
const Sheets = {
  stack: [],
  _state: new Map(),

  _get(id) {
    let st = this._state.get(id);
    if (st) return st;
    const layer = document.getElementById(id);
    const sheet = layer.querySelector('.sheet');
    const scrim = layer.querySelector('.scrim');
    const body = layer.querySelector('.sheet-body');
    st = { id, layer, sheet, scrim, body, height: 0, progress: 0, onClose: null };
    st.spring = new Spring({
      value: 0,
      onUpdate: y => this._render(st, y),
    });
    scrim.addEventListener('click', () => this.close(id));
    layer.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => this.close(id)));
    this._bindDrag(st);
    this._state.set(id, st);
    return st;
  },

  _render(st, y) {
    const h = st.height || 1;
    st.progress = clamp(1 - y / h, 0, 1);
    st.sheet.style.transform = `translate3d(0,${y}px,0)`;
    st.scrim.style.opacity = st.progress;
    this._depth();
  },

  // Each sheet pushes the layer directly beneath it back and dims it.
  _depth() {
    const app = document.getElementById('app');
    const layers = [app, ...this.stack.map(s => s.sheet)];
    layers.forEach((el, i) => {
      const above = this.stack[i];
      const p = above ? above.progress : 0;
      if (i === 0) {
        el.style.transform = p ? `translate3d(0,${p * 8}px,0) scale(${1 - 0.06 * p})` : '';
        el.style.borderRadius = p ? `${p * 14}px` : '';
        el.style.filter = p ? `brightness(${1 - 0.15 * p})` : '';
      } else {
        const own = this.stack[i - 1];
        const base = `translate3d(0,${own.spring.value}px,0)`;
        el.style.transform = p ? `${base} translate3d(0,${-p * 10}px,0) scale(${1 - 0.05 * p})` : base;
        el.style.filter = p ? `brightness(${1 - 0.12 * p})` : '';
      }
    });
  },

  isOpen(id) { return this.stack.some(s => s.id === id); },

  open(id, { onClose } = {}) {
    const st = this._get(id);
    st.onClose = onClose || null;
    if (!this.isOpen(id)) this.stack.push(st);
    st.layer.classList.add('open');
    st.layer.setAttribute('aria-hidden', 'false');
    st.layer.style.zIndex = 300 + this.stack.indexOf(st) * 2;
    if (st.body) st.body.scrollTop = 0;
    // Measure, then start below the screen unless already mid-flight.
    st.height = st.sheet.offsetHeight;
    if (!st.spring.running && st.progress === 0) st.spring.set(st.height);
    st.spring.to(0, { damping: 1, response: 0.38, onRest: null });
    if (reduceMotion.matches) st.layer.classList.add('fade-in');
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
  },

  close(id, velocity) {
    const st = this._state.get(id);
    if (!st || !this.isOpen(id)) return;
    const active = document.activeElement;
    if (active && st.layer.contains(active)) active.blur();
    st.height = st.sheet.offsetHeight;
    st.spring.to(st.height, {
      damping: 1,
      response: 0.34,
      velocity: velocity !== undefined ? velocity : st.spring.velocity,
      onRest: () => this._finishClose(st),
    });
  },

  closeTop() {
    const top = this.stack[this.stack.length - 1];
    if (top) this.close(top.id);
  },

  _finishClose(st) {
    st.layer.classList.remove('open', 'fade-in');
    st.layer.setAttribute('aria-hidden', 'true');
    this.stack = this.stack.filter(s => s !== st);
    st.progress = 0;
    this._depth();
    const cb = st.onClose;
    st.onClose = null;
    if (cb) cb();
  },

  _settleAfterDrag(st, y, v) {
    const projected = y + project(v);
    const dismiss = v > 400 || (v > -400 && projected > st.height * 0.5);
    if (dismiss) {
      this.close(st.id, v);
      haptic();
    } else {
      // A flick carried momentum, so a touch of bounce reads as physical.
      st.spring.to(0, { velocity: v, damping: 0.85, response: 0.32, onRest: null });
    }
  },

  _bindDrag(st) {
    const { sheet, body } = st;
    const tracker = new VelocityTracker();
    let startX = 0, startY = 0, base = 0;
    let decided = false, dragging = false, fromHeader = false;

    const isHeader = t => !!t.closest('.sheet-grabber, .sheet-nav');
    const blocked = t => !!t.closest('textarea, input[type=range], [data-no-drag], [data-handle], .swipe');

    const begin = (x, y, target) => {
      startX = x; startY = y;
      decided = false; dragging = false;
      fromHeader = isHeader(target);
      if (blocked(target) && !fromHeader) decided = true; // let the control own it
    };
    const move = (x, y, e) => {
      const dx = x - startX, dy = y - startY;
      const atTop = !body || body.scrollTop <= 0;
      if (!decided) {
        // Cancel the scroll-view bounce early so the sheet can take over.
        if ((fromHeader || (atTop && dy > 0)) && Math.abs(dy) >= Math.abs(dx) && e && e.cancelable) e.preventDefault();
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        decided = true;
        const vertical = Math.abs(dy) > Math.abs(dx);
        if (vertical && (fromHeader || (atTop && dy > 0))) {
          dragging = true;
          st.height = sheet.offsetHeight;
          base = st.spring.value;      // grab from the live value — interruptible
          st.spring.stop();
          startY = y;                  // track from here, no jump
          tracker.reset();
          tracker.add(base);
          if (document.activeElement && sheet.contains(document.activeElement)) document.activeElement.blur();
        }
        return;
      }
      if (!dragging) return;
      if (e && e.cancelable) e.preventDefault();
      let ny = base + (y - startY);
      if (ny < 0) ny = rubberband(ny, st.height);
      st.spring.set(ny);
      tracker.add(ny);
    };
    const end = () => {
      if (!dragging) return;
      dragging = false;
      this._settleAfterDrag(st, st.spring.value, tracker.get());
    };

    sheet.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      begin(t.clientX, t.clientY, e.target);
    }, { passive: true });
    sheet.addEventListener('touchmove', e => {
      const t = e.touches[0];
      move(t.clientX, t.clientY, e);
    }, { passive: false });
    sheet.addEventListener('touchend', end);
    sheet.addEventListener('touchcancel', end);

    // Mouse (desktop testing): drag from the grabber / nav bar.
    sheet.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || !isHeader(e.target) || e.target.closest('button')) return;
      begin(e.clientX, e.clientY, e.target);
      const mm = ev => move(ev.clientX, ev.clientY, ev);
      const mu = () => { window.removeEventListener('pointermove', mm); window.removeEventListener('pointerup', mu); end(); };
      window.addEventListener('pointermove', mm);
      window.addEventListener('pointerup', mu);
    });
  },
};

document.addEventListener('keydown', e => { if (e.key === 'Escape') Sheets.closeTop(); });

// ── Swipe actions (iOS list rows) ──────────────────────────────────────────
// Swipe left reveals a destructive action; a long or fast swipe commits it.
let _openSwipe = null;
function closeOpenSwipe(except) {
  if (_openSwipe && _openSwipe !== except) _openSwipe.close();
}
document.addEventListener('touchstart', e => {
  if (_openSwipe && !_openSwipe.el.contains(e.target)) _openSwipe.close();
}, { passive: true, capture: true });

function swipeRow(el, onCommit) {
  const content = el.querySelector('.swipe-content');
  const action = el.querySelector('.swipe-action');
  const ACTION_W = 88;
  const tracker = new VelocityTracker();
  let width = 0, startX = 0, startY = 0, base = 0;
  let decided = false, horizontal = false, armed = false, committed = false;

  const spring = new Spring({
    onUpdate: x => {
      content.style.transform = `translate3d(${x}px,0,0)`;
      const reveal = Math.max(0, -x);
      action.style.width = reveal + 'px';
      action.classList.toggle('visible', reveal > 0.5);
    },
  });

  const api = {
    el,
    close() { spring.to(0, { damping: 1, response: 0.3 }); if (_openSwipe === api) _openSwipe = null; },
    commit(v = 0) {
      if (committed) return;
      committed = true;
      haptic();
      spring.to(-width - 20, {
        velocity: v, damping: 1, response: 0.28,
        onRest: () => collapseAndRun(el, onCommit),
      });
      if (_openSwipe === api) _openSwipe = null;
    },
  };

  action.addEventListener('click', e => { e.stopPropagation(); width = el.offsetWidth; api.commit(); });

  // A tap on an open row closes it instead of activating the row.
  content.addEventListener('click', e => {
    if (spring.value < -2) { e.stopPropagation(); e.preventDefault(); api.close(); }
  }, true);

  el.addEventListener('touchstart', e => {
    if (committed || e.touches.length !== 1) return;
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    decided = false; horizontal = false;
    width = el.offsetWidth;
    closeOpenSwipe(api);
  }, { passive: true });

  el.addEventListener('touchmove', e => {
    if (committed) return;
    const t = e.touches[0];
    const dx = t.clientX - startX, dy = t.clientY - startY;
    if (!decided) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      decided = true;
      horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
      if (!horizontal) return;
      base = spring.value;
      spring.stop();
      startX = t.clientX;
      tracker.reset();
      armed = false;
    }
    if (!horizontal) return;
    if (e.cancelable) e.preventDefault();
    let x = base + (t.clientX - startX);
    if (x > 0) x = rubberband(x, width);
    const full = width * 0.6;
    const nowArmed = -x > full;
    if (nowArmed !== armed) { armed = nowArmed; el.classList.toggle('armed', armed); haptic(); }
    spring.set(x);
    tracker.add(x);
  }, { passive: false });

  const end = () => {
    if (!horizontal || committed) return;
    horizontal = false;
    const v = tracker.get();
    const x = spring.value;
    const projected = x + project(v, 0.99);
    el.classList.remove('armed');
    if (armed || (projected < -width * 0.75 && v < -800)) { api.commit(v); return; }
    if (v < -200 || (v < 200 && projected < -ACTION_W / 2)) {
      spring.to(-ACTION_W, { velocity: v, damping: 0.85, response: 0.32 });
      _openSwipe = api;
    } else {
      api.close();
    }
  };
  el.addEventListener('touchend', end);
  el.addEventListener('touchcancel', end);
  return api;
}

// Fold a row's height away before removing it (content already slid off).
function collapseAndRun(el, fn) {
  const h = el.offsetHeight;
  el.style.height = h + 'px';
  el.style.overflow = 'hidden';
  const s = new Spring({
    value: h,
    onUpdate: v => { el.style.height = Math.max(0, v) + 'px'; el.style.opacity = clamp(v / h, 0, 1); },
  });
  s.to(0, { damping: 1, response: 0.28, onRest: () => fn() });
}

// ── Horizontal pager (calendar months) ─────────────────────────────────────
// 1:1 tracking, rubber-bands where there's nothing more, projects the flick to
// decide, exits and enters along the same axis.
function pager(el, { canPrev, canNext, onPrev, onNext }) {
  const tracker = new VelocityTracker();
  let startX = 0, startY = 0, decided = false, horizontal = false, width = 0;
  const spring = new Spring({
    onUpdate: x => {
      el.style.transform = `translate3d(${x}px,0,0)`;
      el.style.opacity = 1 - Math.min(Math.abs(x) / (width || 1), 1) * 0.6;
    },
  });

  function go(dir, v = 0) {
    width = el.offsetWidth;
    const exit = dir > 0 ? -width : width;
    spring.to(exit, {
      velocity: v, damping: 1, response: 0.26,
      onRest: () => {
        dir > 0 ? onNext() : onPrev();
        spring.set(-exit * 0.6);
        spring.to(0, { velocity: v * 0.5, damping: 1, response: 0.32, onRest: null });
      },
    });
    haptic();
  }

  el.addEventListener('touchstart', e => {
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    decided = false; horizontal = false;
    width = el.offsetWidth;
  }, { passive: true });
  el.addEventListener('touchmove', e => {
    const t = e.touches[0];
    const dx = t.clientX - startX, dy = t.clientY - startY;
    if (!decided) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      decided = true;
      horizontal = Math.abs(dx) > Math.abs(dy);
      if (!horizontal) return;
      startX = t.clientX - spring.value;
      spring.stop();
      tracker.reset();
    }
    if (!horizontal) return;
    if (e.cancelable) e.preventDefault();
    let x = t.clientX - startX;
    if ((x < 0 && !canNext()) || (x > 0 && !canPrev())) x = rubberband(x, width, 0.35);
    spring.set(x);
    tracker.add(x);
  }, { passive: false });
  const end = () => {
    if (!horizontal) return;
    horizontal = false;
    const v = tracker.get();
    const projected = spring.value + project(v, 0.99);
    if (projected < -width / 2 && canNext() && v <= 300) go(1, v);
    else if (projected > width / 2 && canPrev() && v >= -300) go(-1, v);
    else spring.to(0, { velocity: v, damping: 0.85, response: 0.32, onRest: null });
  };
  el.addEventListener('touchend', end);
  el.addEventListener('touchcancel', end);
  return { next: () => canNext() && go(1), prev: () => canPrev() && go(-1) };
}
