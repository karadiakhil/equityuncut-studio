/* Equity Uncut studio engine: core.
 * Namespace, locked palette, line hierarchy, seeded RNG, SVG helpers, keyed tracks and the render hook.
 *
 * The render hook is the heart of seek safety. GSAP tweens plain proxy objects (joint angles, camera, counters);
 * after every timeline render, Studio.applyAll(t) writes those numbers to the DOM. Discrete state (visemes, hand
 * poses, prop visibility) lives in keyed tracks read by time, so any frame is a pure function of timeline time:
 * no requestAnimationFrame, no clocks, no unseeded randomness, no infinite repeats.
 */
(function (S) {
  'use strict';
  S.version = '1.0.0';
  S.NS = 'http://www.w3.org/2000/svg';

  // ---- locked studio palette -------------------------------------------------------------------------------
  S.INK = '#18181B';
  S.PAPER = '#FFFDF9';
  S.PALETTE = {
    ink: '#18181B', paper: '#FFFDF9', cream: '#F5F0E6', creamDeep: '#E9DFCC', sand: '#D9C7A7',
    crimson: '#DC2626', crimsonDeep: '#991B1B', coral: '#F87171',
    mustard: '#EAB308', mustardDeep: '#A16207', gold: '#F5C542',
    emerald: '#10B981', emeraldDeep: '#047857', mint: '#A7F3D0', leaf: '#4D9A3A', leafDeep: '#2F6B2A',
    sky: '#7DD3FC', skyDeep: '#0284C7', navy: '#0F172A', slate: '#334155', slateLight: '#94A3B8', steel: '#CBD5E1',
    charcoal: '#2A2D34', walnut: '#7C4A2D', walnutDeep: '#4A2C1A', oak: '#B9824F', amber: '#F59E0B',
    skinLight: '#F6CFAE', skinMid: '#E0A57C', skinDeep: '#9C6644', white: '#FFFFFF', blush: '#F28B82'
  };
  // Line hierarchy (px at character scale 1): outer silhouette, secondary structure, micro craft lines, props.
  S.LINE = {outer: 3.5, mid: 2.2, micro: 1.3, prop: 2.5};

  // ---- seeded RNG ---------------------------------------------------------------------------------------------
  S.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  S.hash = function (str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  // ---- DOM helpers ---------------------------------------------------------------------------------------------
  S.svg = function (tag, attrs, parent) {
    const e = document.createElementNS(S.NS, tag);
    if (attrs) for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  S.div = function (attrs, parent, tag) {
    const e = document.createElement(tag || 'div');
    if (attrs) for (const k in attrs) {
      if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  };
  S.g = (parent, attrs) => S.svg('g', attrs, parent);
  // ink path: tier = 'outer' | 'mid' | 'micro' | number
  S.path = function (parent, d, fill, tier, extra) {
    const w = tier == null ? null : (typeof tier === 'number' ? tier : S.LINE[tier]);
    return S.svg('path', Object.assign({d, fill: fill || 'none', stroke: w ? S.INK : 'none', 'stroke-width': w || undefined,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, extra || {}), parent);
  };
  S.line = (parent, d, tier, color, extra) => S.path(parent, d, 'none', tier, Object.assign(color ? {stroke: color} : {}, extra || {}));
  let _uid = 0;
  S.uid = (p) => (p || 'ss') + '-' + (++_uid).toString(36);
  S.resetUid = () => { _uid = 0; };

  // Tapered capsule between p1 (radius r1) and p2 (radius r2): limbs, sleeves, trouser legs.
  S.capsule = function (x1, y1, r1, x2, y2, r2, parts) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const s = Math.max(-1, Math.min(1, (r1 - r2) / L)), c = Math.sqrt(1 - s * s);
    const ax = nx * c + ux * s, ay = ny * c + uy * s;   // tangent normal (side A)
    const bx = -nx * c + ux * s, by = -ny * c + uy * s; // side B
    const f = (v) => v.toFixed(2);
    const open = `M${f(x1 + ax * r1)} ${f(y1 + ay * r1)} L${f(x2 + ax * r2)} ${f(y2 + ay * r2)} ` +
      `A${f(r2)} ${f(r2)} 0 0 0 ${f(x2 + bx * r2)} ${f(y2 + by * r2)} L${f(x1 + bx * r1)} ${f(y1 + by * r1)}`;
    const capArc = `A${f(r1)} ${f(r1)} 0 1 0 ${f(x1 + ax * r1)} ${f(y1 + ay * r1)}`;
    const full = open + ' ' + capArc + ' Z';
    // parts: open outline (sides + end cap) and the start cap alone (a joint crease line)
    return parts ? {full, open, cap: `M${f(x1 + bx * r1)} ${f(y1 + by * r1)} ` + capArc} : full;
  };

  // ---- keyed tracks (discrete state read by time) -----------------------------------------------------------------
  S.Track = function (initial) { this.keys = [[-1e9, initial]]; };
  S.Track.prototype.set = function (t, v) { this.keys.push([t, v]); this.keys.sort((a, b) => a[0] - b[0]); return this; };
  S.Track.prototype.at = function (t) {
    const k = this.keys; let lo = 0, hi = k.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (k[m][0] <= t + 1e-6) lo = m; else hi = m - 1; }
    return k[lo][1];
  };
  S.Track.prototype.keyAt = function (t) {   // [time, value] of the active key
    const k = this.keys; let lo = 0, hi = k.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (k[m][0] <= t + 1e-6) lo = m; else hi = m - 1; }
    return k[lo];
  };

  // ---- render hook -------------------------------------------------------------------------------------------------
  const appliers = [];
  S.onApply = function (fn, order) { appliers.push({fn, order: order || 0}); appliers.sort((a, b) => a.order - b.order); return fn; };
  S.applyAll = function (t) { for (const a of appliers) a.fn(t); };
  S.clearAppliers = function () { appliers.length = 0; };
  // Bind a root timeline: every render (seek, totalTime, progress) is followed by applyAll(time).
  S.bindTimeline = function (tl) {
    if (window.gsap) gsap.defaults({lazy: false});   // lazy tweens would flush after our apply and land a frame late
    const render = tl.render;
    tl.render = function () { const out = render.apply(this, arguments); S.applyAll(this.time()); return out; };
    S.tl = tl;
    // The HyperFrames renderer seeks through its own path (it may not call tl.render on this instance), and announces
    // every frame with an 'hf-seek' event. Apply after its synchronous seek finishes (microtask), and make the frame
    // capture wait for it. Proxies are already at the seeked values by then, so the frame is still a pure function of t.
    if (!S.__hfSeekBound) {
      S.__hfSeekBound = true;
      window.addEventListener('hf-seek', (e) => {
        const t = e.detail && typeof e.detail.time === 'number' ? e.detail.time : S.tl.time();
        S.applyAll(t);
        const p = Promise.resolve().then(() => S.applyAll(S.tl ? S.tl.time() : t));
        if (e.detail && e.detail.waitUntil) e.detail.waitUntil(p);
      });
    }
    return tl;
  };
  // Finite-repeat helper for loops that must cover [start, end): never repeat -1.
  S.loop = function (tl, target, vars, start, end, cycle) {
    const n = Math.max(1, Math.floor((end - start) / cycle));
    return tl.to(target, Object.assign({duration: cycle, repeat: n - 1}, vars), start);
  };
  S.smooth = (x) => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  S.lerp = (a, b, k) => a + (b - a) * k;
  S.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
})(window.Studio = window.Studio || {});
