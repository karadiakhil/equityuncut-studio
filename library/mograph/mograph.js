/* Broadcast motion-graphics primitives. All return their root element and add tweens at absolute times.
 * Text uses masked reveals (never fades alone), numbers use tabular JetBrains Mono, charts draw with stroke offsets.
 */
(function (S) {
  'use strict';
  const C = S.PALETTE, MG = S.MG = {};

  // kinetic masked text reveal: words rise out of a mask, staggered -------------------------------------------------------
  MG.kineticText = function (tl, parent, o) {
    o = Object.assign({x: 960, y: 540, size: 84, font: "'Archivo Black', sans-serif", color: C.ink, start: 0, stagger: 0.07, dur: 0.45,
      align: 'center', weight: 400, letter: '-0.01em', out: null}, o);
    const box = S.div({class: 'ss-ktext', id: o.id || null, 'data-collide': 'headline', style: {position: 'absolute', left: o.x + 'px', top: o.y + 'px', whiteSpace: 'nowrap',
      transform: `translate(${o.align === 'center' ? '-50%' : o.align === 'right' ? '-100%' : '0'}, -50%)`, font: `${o.weight} ${o.size}px ${o.font}`,
      color: o.color, letterSpacing: o.letter, lineHeight: 1.05}}, parent);
    const inners = [];
    o.text.split(' ').forEach((w, i) => {
      const m = S.div({style: {display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', padding: '0.06em 0.05em 0.1em', marginRight: '0.18em'}}, box, 'span');
      const inr = S.div({text: w, style: {display: 'inline-block'}}, m, 'span');
      if (o.highlight && o.highlight.includes(w)) inr.style.color = o.highlightColor || C.crimson;
      inners.push(inr);
    });
    inners.forEach((e, i) => tl.fromTo(e, {yPercent: 115, rotation: 4}, {yPercent: 0, rotation: 0, duration: o.dur, ease: 'power4.out'}, o.start + i * o.stagger));
    if (o.out != null) inners.forEach((e, i) => tl.to(e, {yPercent: -115, duration: 0.3, ease: 'power3.in'}, o.out + i * 0.03));
    return box;
  };

  // animated counter (values via proxy -> render hook) ----------------------------------------------------------------------
  MG.counter = function (tl, parent, o) {
    o = Object.assign({x: 0, y: 0, from: 0, to: 100, start: 0, dur: 1, size: 64, color: C.ink, prefix: '', suffix: '', ease: 'power3.out',
      font: "'JetBrains Mono', monospace", weight: 700, format: (v) => Math.round(v).toLocaleString('en-US')}, o);
    const el = S.div({class: 'ss-counter', id: o.id || null, style: {position: 'absolute', left: o.x + 'px', top: o.y + 'px', font: `${o.weight} ${o.size}px ${o.font}`,
      color: o.color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', transform: 'translate(-50%, -50%)'}}, parent);
    // exact counter lock: landAt = the spoken figure's word-end time; the roll finishes exactly there and the final
    // value is marked so tools/collision_check.mjs can prove it holds >= 0.6 s before any cut.
    if (o.landAt != null) o.start = o.landAt - o.dur;
    const p = {v: o.from};
    tl.fromTo(p, {v: o.from}, {v: o.to, duration: o.dur, ease: o.ease}, o.start);
    el.dataset.counterFinal = o.prefix + o.format(o.to) + o.suffix; el.dataset.counterLand = (o.start + o.dur).toFixed(3);
    el.setAttribute('data-collide', 'counter');
    S.onApply(() => { el.textContent = p.v === o.to ? el.dataset.counterFinal : o.prefix + o.format(p.v) + o.suffix; }, 20);
    el.textContent = o.prefix + o.format(o.from) + o.suffix;
    return {el, p};
  };

  // Bézier line chart with area fill, draws on ------------------------------------------------------------------------------
  MG.bezierChart = function (tl, parent, o) {
    o = Object.assign({x: 0, y: 0, w: 600, h: 300, data: [1, 3, 2, 5, 4, 8], start: 0, dur: 1.6, color: C.emerald, glow: false, axis: true, dots: true, min: null, max: null}, o);
    const g = S.g(parent, {class: 'ss-chart', transform: `translate(${o.x} ${o.y})`});
    const mn = o.min == null ? Math.min(...o.data) : o.min, mx = o.max == null ? Math.max(...o.data) : o.max;
    const pts = o.data.map((v, i) => [i / (o.data.length - 1) * o.w, o.h - (v - mn) / (mx - mn || 1) * o.h]);
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], cx = (b[0] - a[0]) * 0.5; d += ` C${a[0] + cx} ${a[1]} ${b[0] - cx} ${b[1]} ${b[0]} ${b[1]}`; }
    if (o.axis) {
      S.line(g, `M0 0 L0 ${o.h} L${o.w} ${o.h}`, 2, o.axisColor || C.slateLight);
      for (let i = 1; i <= 4; i++) S.line(g, `M0 ${o.h - i * o.h / 4} L${o.w} ${o.h - i * o.h / 4}`, 1, o.axisColor || C.slateLight, {opacity: 0.3, 'stroke-dasharray': '4 6'});
    }
    const clipId = S.uid('chart'); const cr = S.svg('rect', {x: -10, y: -40, width: 0, height: o.h + 80}, S.svg('clipPath', {id: clipId}, S.ensureDefs()));
    const area = S.path(g, d + ` L${o.w} ${o.h} L0 ${o.h} Z`, o.color, null, {opacity: 0.18, 'clip-path': `url(#${clipId})`});
    const line = S.path(g, d, 'none', null, {stroke: o.color, 'stroke-width': o.stroke || 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
    if (o.glow) line.setAttribute('filter', `url(#${S.glowFilter(o.color, 7)})`);
    const L = line.getTotalLength ? line.getTotalLength() : 2000;
    line.setAttribute('stroke-dasharray', L);
    tl.fromTo(line, {attr: {'stroke-dashoffset': L}}, {attr: {'stroke-dashoffset': 0}, duration: o.dur, ease: 'power2.inOut'}, o.start);
    tl.fromTo(cr, {attr: {width: 0}}, {attr: {width: o.w + 20}, duration: o.dur, ease: 'power2.inOut'}, o.start);
    const dots = [];
    if (o.dots) pts.forEach((p, i) => { const c = S.svg('circle', {cx: p[0], cy: p[1], r: 8, fill: C.paper, stroke: o.color, 'stroke-width': 4}, g); dots.push(c);
      tl.fromTo(c, {scale: 0, svgOrigin: `${p[0]} ${p[1]}`}, {scale: 1, duration: 0.25, ease: 'back.out(3)'}, o.start + o.dur * (i / (pts.length - 1)) * 0.95); });
    return {g, line, area, pts, dots};
  };

  // callout leader line + label -------------------------------------------------------------------------------------------
  MG.callout = function (tl, parent, o) {
    o = Object.assign({from: [0, 0], to: [100, -60], text: 'LABEL', start: 0, color: C.ink, size: 22, font: 'JetBrains Mono', glow: false}, o);
    const g = S.g(parent, {class: 'ss-callout'});
    const [x1, y1] = o.from, [x2, y2] = o.to, ex = x2 + (x2 > x1 ? 1 : -1) * 70;
    const dot = S.svg('circle', {cx: x1, cy: y1, r: 6, fill: o.color}, g);
    const ln = S.path(g, `M${x1} ${y1} L${x2} ${y2} L${ex} ${y2}`, 'none', null, {stroke: o.color, 'stroke-width': 2.6, 'stroke-linecap': 'round'});
    const t = S.svg('text', {x: ex + (x2 > x1 ? 10 : -10), y: y2 + o.size * 0.35, 'text-anchor': x2 > x1 ? 'start' : 'end', 'font-family': o.font, 'font-weight': 700, 'font-size': o.size, fill: o.color, 'letter-spacing': 1}, g);
    t.textContent = o.text;
    if (o.glow) g.setAttribute('filter', `url(#${S.glowFilter(o.color, 4)})`);
    const L = Math.hypot(x2 - x1, y2 - y1) + Math.abs(ex - x2);
    ln.setAttribute('stroke-dasharray', L);
    tl.fromTo(dot, {scale: 0, svgOrigin: `${x1} ${y1}`}, {scale: 1, duration: 0.2, ease: 'back.out(3)'}, o.start);
    tl.fromTo(ln, {attr: {'stroke-dashoffset': L}}, {attr: {'stroke-dashoffset': 0}, duration: 0.35, ease: 'power2.out'}, o.start + 0.08);
    tl.fromTo(t, {opacity: 0, x: (x2 > x1 ? -12 : 12)}, {opacity: 1, x: 0, duration: 0.25, ease: 'power2.out'}, o.start + 0.3);
    return g;
  };

  // comic impact burst + speed lines --------------------------------------------------------------------------------------
  MG.impactBurst = function (tl, parent, o) {
    o = Object.assign({x: 0, y: 0, r: 120, start: 0, color: C.mustard, seed: 3, points: 14, hold: 0.35}, o);
    const r = S.rng(o.seed); let d = '';
    for (let i = 0; i < o.points * 2; i++) { const a = i / (o.points * 2) * Math.PI * 2, rr = i % 2 ? o.r * (0.45 + r() * 0.12) : o.r * (0.85 + r() * 0.3); d += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1) + ' '; }
    const g = S.g(parent, {class: 'ss-burst', transform: `translate(${o.x} ${o.y})`});
    const inner = S.g(g, {opacity: 0});
    S.path(inner, d + 'Z', o.color, 4);
    S.path(inner, d + 'Z', C.paper, null, {transform: 'scale(0.55)'});
    if (o.text) { const t = S.svg('text', {x: 0, y: o.r * 0.12, 'text-anchor': 'middle', 'font-family': 'Archivo Black', 'font-size': o.r * 0.34, fill: S.INK, transform: 'rotate(-8)'}, inner); t.textContent = o.text; }
    tl.fromTo(inner, {opacity: 0}, {opacity: 1, duration: 0.01}, o.start);
    tl.fromTo(inner, {scale: 0.2, rotation: -20, svgOrigin: '0 0'}, {scale: 1, rotation: 0, duration: 0.14, ease: 'back.out(2.5)', immediateRender: false}, o.start);
    tl.to(inner, {scale: 1.12, opacity: 0, duration: 0.22, ease: 'power2.in'}, o.start + o.hold);
    return g;
  };
  MG.speedLines = function (tl, parent, o) {
    o = Object.assign({x: 960, y: 540, start: 0, dur: 0.45, count: 26, r0: 260, r1: 1300, color: S.INK, seed: 4, width: 7}, o);
    const r = S.rng(o.seed); const g = S.g(parent, {class: 'ss-speed'});
    for (let i = 0; i < o.count; i++) {
      const a = (i + r() * 0.6) / o.count * Math.PI * 2, r0 = o.r0 * (0.8 + r() * 0.5);
      const x1 = o.x + Math.cos(a) * r0, y1 = o.y + Math.sin(a) * r0, x2 = o.x + Math.cos(a) * o.r1, y2 = o.y + Math.sin(a) * o.r1;
      const w = o.width * (0.4 + r());
      const ln = S.path(g, `M${x1.toFixed(1)} ${y1.toFixed(1)} L${(x1 + Math.cos(a + 0.012) * 900).toFixed(1)} ${(y1 + Math.sin(a + 0.012) * 900).toFixed(1)} L${(x1 + Math.cos(a - 0.012) * 900).toFixed(1)} ${(y1 + Math.sin(a - 0.012) * 900).toFixed(1)} Z`, o.color, null, {opacity: 0});
      ln.setAttribute('stroke', 'none'); void x2; void y2; void w;
      tl.fromTo(ln, {opacity: 0}, {keyframes: [{opacity: 0.75, duration: 0.02}, {opacity: 0, duration: o.dur, ease: 'power2.in'}]}, o.start + r() * 0.05);
      tl.fromTo(ln, {x: 0, y: 0}, {x: Math.cos(a) * 60, y: Math.sin(a) * 60, duration: o.dur, ease: 'power1.out'}, o.start);
    }
    return g;
  };

  // classified dossier card with redaction bars -----------------------------------------------------------------------------
  MG.dossier = function (tl, parent, o) {
    o = Object.assign({x: 0, y: 0, w: 420, title: 'CLASSIFIED', lines: [], start: 0, stamp: 'TOP SECRET'}, o);
    const card = S.div({class: 'ss-dossier', style: {position: 'absolute', left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', padding: '26px 28px 30px',
      background: '#F7EBD0', border: `2.5px solid ${S.INK}`, borderRadius: '4px', boxShadow: `8px 10px 0 rgba(24,24,27,0.25), 0 0 0 4px ${S.PAPER}`,
      font: "600 19px 'Plus Jakarta Sans', sans-serif", color: C.slate}}, parent);
    S.div({text: o.title, style: {font: "400 30px 'Archivo Black'", color: S.INK, letterSpacing: '0.04em', marginBottom: '14px'}}, card);
    const bars = [];
    o.lines.forEach((ln) => {
      const row = S.div({style: {position: 'relative', margin: '8px 0', whiteSpace: 'nowrap'}}, card);
      S.div({text: ln.text, style: {display: 'inline-block'}}, row, 'span');
      if (ln.redact) { const b = S.div({style: {position: 'absolute', left: '0', top: '1px', height: '1.15em', width: (ln.redact * 100) + '%', background: S.INK, transformOrigin: '0 50%'}}, row); bars.push(b); }
    });
    const st = S.div({text: o.stamp, style: {position: 'absolute', right: '18px', top: '18px', font: "400 22px 'Archivo Black'", color: C.crimson,
      border: `4px solid ${C.crimson}`, padding: '2px 10px', transform: 'rotate(-12deg)', opacity: 0.85}}, card);
    bars.forEach((b, i) => tl.fromTo(b, {scaleX: 0}, {scaleX: 1, duration: 0.22, ease: 'power3.out'}, o.start + 0.3 + i * 0.12));
    tl.fromTo(st, {scale: 1.8, opacity: 0}, {scale: 1, opacity: 0.85, duration: 0.18, ease: 'back.out(2)'}, o.start + 0.3 + bars.length * 0.12 + 0.1);
    return card;
  };

  // SourceTag evidence badge -------------------------------------------------------------------------------------------------
  MG.sourceTag = function (tl, parent, o) {
    o = Object.assign({x: 0, y: 0, text: 'SOURCE: COURT FILING, 2023', start: 0}, o);
    const b = S.div({class: 'ss-source', 'data-collide': 'source', style: {position: 'absolute', left: o.x + 'px', top: o.y + 'px', display: 'flex', alignItems: 'center', gap: '10px',
      padding: '8px 14px 8px 10px', background: S.INK, color: '#F8FAFC', borderRadius: '6px', font: "700 16px 'JetBrains Mono'", letterSpacing: '0.04em',
      boxShadow: `0 0 0 3px ${S.PAPER}`}}, parent);
    S.div({style: {width: '12px', height: '12px', borderRadius: '50%', background: C.emerald, boxShadow: `0 0 10px ${C.emerald}`}}, b);
    S.div({text: o.text}, b, 'span');
    tl.fromTo(b, {clipPath: 'inset(0 100% 0 0)'}, {clipPath: 'inset(0 0% 0 0)', duration: 0.4, ease: 'power3.out'}, o.start);
    return b;
  };

  // transitions -------------------------------------------------------------------------------------------------------------
  // whip-pan: directional streak overlay that peaks mid-move (pair it with a fast camera pan)
  MG.whipPan = function (tl, parent, o) {
    o = Object.assign({start: 0, dur: 0.4, dir: 1, color: 'rgba(255,253,249,0.9)', seed: 8}, o);
    const el = S.div({class: 'ss-whip', style: {position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none', opacity: 0}}, parent);
    const svg = S.svg('svg', {width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: 'position:absolute;inset:0'}, el);
    const r = S.rng(o.seed);
    for (let i = 0; i < 46; i++) { const y = r() * 1080, h = 3 + r() * 22, w = 300 + r() * 1100, x = r() * 1920 - 300;
      S.svg('rect', {x, y, width: w, height: h, rx: h / 2, fill: i % 3 ? o.color : 'rgba(24,24,27,0.35)', opacity: 0.35 + r() * 0.5}, svg); }
    tl.fromTo(el, {opacity: 0, xPercent: -o.dir * 30}, {opacity: 1, xPercent: 0, duration: o.dur / 2, ease: 'power2.in'}, o.start);
    tl.to(el, {opacity: 0, xPercent: o.dir * 30, duration: o.dur / 2, ease: 'power2.out'}, o.start + o.dur / 2);
    return el;
  };
  MG.iris = function (tl, el, o) {
    o = Object.assign({start: 0, dur: 0.5, mode: 'open', cx: '50%', cy: '50%'}, o);
    const a = `circle(0% at ${o.cx} ${o.cy})`, b = `circle(75% at ${o.cx} ${o.cy})`;
    tl.fromTo(el, {clipPath: o.mode === 'open' ? a : b}, {clipPath: o.mode === 'open' ? b : a, duration: o.dur, ease: 'power3.inOut'}, o.start);
  };
  MG.paperFold = function (tl, el, o) {
    o = Object.assign({start: 0, dur: 0.6, mode: 'in'}, o);
    if (o.mode === 'in') tl.fromTo(el, {rotationY: -92, transformOrigin: '0% 50%', transformPerspective: 1500}, {rotationY: 0, duration: o.dur, ease: 'back.out(1.2)'}, o.start);
    else tl.to(el, {rotationY: 92, transformOrigin: '100% 50%', transformPerspective: 1500, duration: o.dur, ease: 'power3.in'}, o.start);
  };
})(window.Studio = window.Studio || {});
