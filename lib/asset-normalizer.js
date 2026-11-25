/* Visual normalizer. Every downloaded SVG prop or icon passes through here before it reaches a scene:
 *  1. colours remapped into the locked studio palette (nearest in CIE Lab),
 *  2. consistent ink contour (#18181B, 2.5 px at the placed size; small details get the micro weight),
 *  3. paper mode: 4 px #FFFDF9 cardstock border + lower-right cel crescent + directional cast shadow (one SVG filter),
 *  4. a clean pivot (bottom-centre or centre) so props sit on desks and floors at (0, 0).
 * Hand-built studio props use the same filter (Studio.paper(g)) so everything reads as one art director's work.
 */
(function (S) {
  'use strict';
  const REMAP = ['cream', 'creamDeep', 'sand', 'crimson', 'crimsonDeep', 'coral', 'mustard', 'mustardDeep', 'gold', 'emerald', 'emeraldDeep',
    'mint', 'leaf', 'leafDeep', 'sky', 'skyDeep', 'navy', 'slate', 'slateLight', 'steel', 'charcoal', 'walnut', 'walnutDeep', 'oak', 'amber',
    'skinLight', 'skinMid', 'skinDeep', 'paper', 'blush'];
  function hexRgb(h) {
    h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function lab(rgb) {
    const f = (c) => { c /= 255; return c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92; };
    const [r, g, b] = rgb.map(f);
    let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047, y = r * 0.2126 + g * 0.7152 + b * 0.0722, z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
    const h = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    x = h(x); y = h(y); z = h(z);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }
  const PAL = REMAP.map((k) => ({k, hex: S.PALETTE[k], lab: lab(hexRgb(S.PALETTE[k]))}));
  const cache = {};
  S.nearestColor = function (hex) {
    if (!hex || hex === 'none' || hex.startsWith('url')) return hex;
    if (/^#?[0-9a-f]{3,6}$/i.test(hex) === false) return hex;
    if (cache[hex]) return cache[hex];
    const L = lab(hexRgb(hex)); let best = PAL[0], bd = 1e9;
    for (const p of PAL) { const d = (p.lab[0] - L[0]) ** 2 * 0.6 + (p.lab[1] - L[1]) ** 2 + (p.lab[2] - L[2]) ** 2; if (d < bd) { bd = d; best = p; } }
    return (cache[hex] = best.hex);
  };

  // ---- shared defs + paper-cut filter -----------------------------------------------------------------------------
  S.ensureDefs = function () {
    let host = document.getElementById('ss-global-defs');
    if (!host) {
      host = S.svg('svg', {id: 'ss-global-defs', width: 0, height: 0, style: 'position:absolute;width:0;height:0;overflow:hidden'}, document.body);
      S.svg('defs', null, host);
    }
    return host.firstChild;
  };
  S.paperFilter = function (opts) {
    opts = opts || {};
    const border = opts.border == null ? 4 : opts.border, sx = opts.shadowX == null ? 7 : opts.shadowX, sy = opts.shadowY == null ? 9 : opts.shadowY;
    const id = `ss-paper-${border}-${sx}-${sy}${opts.noCel ? '-nc' : ''}`;
    if (document.getElementById(id)) return id;
    const f = S.svg('filter', {id, x: '-25%', y: '-25%', width: '150%', height: '150%', 'color-interpolation-filters': 'sRGB'}, S.ensureDefs());
    const fe = (tag, a) => S.svg(tag, a, f);
    // inner cel crescent on the unlit (lower-right) edge
    fe('feOffset', {in: 'SourceAlpha', dx: -5, dy: -5, result: 'off'});
    fe('feComposite', {in: 'SourceAlpha', in2: 'off', operator: 'out', result: 'cres'});
    fe('feFlood', {'flood-color': S.INK, 'flood-opacity': opts.noCel ? 0 : 0.2, result: 'cf'});
    fe('feComposite', {in: 'cf', in2: 'cres', operator: 'in', result: 'shade'});
    fe('feMerge', {result: 'obj'}).append(S.svg('feMergeNode', {in: 'SourceGraphic'}), S.svg('feMergeNode', {in: 'shade'}));
    // cardstock border
    fe('feMorphology', {in: 'SourceAlpha', operator: 'dilate', radius: border, result: 'dil'});
    fe('feFlood', {'flood-color': S.PAPER, result: 'pf'});
    fe('feComposite', {in: 'pf', in2: 'dil', operator: 'in', result: 'border'});
    // directional cast shadow
    fe('feOffset', {in: 'dil', dx: sx, dy: sy, result: 'so'});
    fe('feGaussianBlur', {in: 'so', stdDeviation: 1.6, result: 'sb'});
    fe('feFlood', {'flood-color': S.INK, 'flood-opacity': 0.26, result: 'sf'});
    fe('feComposite', {in: 'sf', in2: 'sb', operator: 'in', result: 'cast'});
    const m = fe('feMerge', {});
    ['cast', 'border', 'obj'].forEach((k) => m.append(S.svg('feMergeNode', {in: k})));
    return id;
  };
  S.paper = function (g, opts) { g.setAttribute('filter', `url(#${S.paperFilter(opts)})`); return g; };
  // soft glow filter for neon / blueprint vector callouts
  S.glowFilter = function (color, r) {
    const id = `ss-glow-${(color || '#fff').replace('#', '')}-${r || 6}`;
    if (document.getElementById(id)) return id;
    const f = S.svg('filter', {id, x: '-40%', y: '-40%', width: '180%', height: '180%'}, S.ensureDefs());
    S.svg('feGaussianBlur', {in: 'SourceGraphic', stdDeviation: r || 6, result: 'b'}, f);
    S.svg('feFlood', {'flood-color': color || '#fff', 'flood-opacity': 0.9, result: 'c'}, f);
    S.svg('feComposite', {in: 'c', in2: 'b', operator: 'in', result: 'g'}, f);
    const m = S.svg('feMerge', {}, f); ['g', 'g', 'SourceGraphic'].forEach((k) => m.append(S.svg('feMergeNode', {in: k})));
    return id;
  };

  // ---- normalize an SVG (string or element) into a studio prop group -----------------------------------------------
  // opts: {size (px of the longer side), pivot: 'bottom'|'center', paper (bool), ink (px), remap (bool), id}
  S.normalizeSVG = function (parent, src, viewBox, opts) {
    opts = Object.assign({size: 120, pivot: 'bottom', paper: true, ink: S.LINE.prop, remap: true}, opts || {});
    const [vx, vy, vw, vh] = viewBox;
    const k = opts.size / Math.max(vw, vh);
    const outer = S.g(parent, {class: 'ss-prop', id: opts.id || null});
    const px = vx + vw / 2, py = opts.pivot === 'center' ? vy + vh / 2 : vy + vh;
    const inner = S.g(outer, {transform: `scale(${k.toFixed(4)}) translate(${-px} ${-py})`});
    const doc = new DOMParser().parseFromString(`<svg xmlns="${S.NS}" viewBox="${viewBox.join(' ')}">${typeof src === 'string' ? src : src.outerHTML}</svg>`, 'image/svg+xml');
    for (const ch of Array.from(doc.documentElement.childNodes)) inner.appendChild(document.importNode(ch, true));
    // unique ids for any internal defs
    inner.querySelectorAll('[id]').forEach((e) => { const nid = S.uid('nz'); inner.querySelectorAll('*').forEach((x) => { for (const a of ['fill', 'stroke', 'clip-path', 'mask', 'href']) { const v = x.getAttribute(a); if (v && v.includes('#' + e.id)) x.setAttribute(a, v.replace('#' + e.id, '#' + nid)); } }); e.id = nid; });
    const shapes = inner.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line');
    const area = vw * vh;
    shapes.forEach((e) => {
      ['fill', 'stroke'].forEach((a) => { const v = e.getAttribute(a); if (v && opts.remap) e.setAttribute(a, S.nearestColor(v)); });
      if (opts.remap && e.style && e.style.fill) e.style.fill = S.nearestColor(e.style.fill);
      const fill = e.getAttribute('fill') || (e.closest('[fill]') && e.closest('[fill]').getAttribute('fill'));
      if (fill === 'none' && !e.getAttribute('stroke')) return;
      let bb = {width: vw, height: vh}; try { bb = e.getBBox(); } catch (err) { /* detached */ }
      const rel = (bb.width * bb.height) / area;
      const w = rel > 0.12 ? opts.ink : rel > 0.025 ? S.LINE.micro + 0.3 : rel > 0.006 ? S.LINE.micro * 0.8 : 0;
      if (!w) return;
      e.setAttribute('stroke', S.INK); e.setAttribute('stroke-width', (w / k).toFixed(3));
      e.setAttribute('stroke-linejoin', 'round'); e.setAttribute('stroke-linecap', 'round'); e.setAttribute('paint-order', 'stroke fill');
    });
    // keep a strong outer contour: a stroked copy of the whole silhouette behind everything
    const sil = inner.cloneNode(true); sil.removeAttribute('transform');
    sil.querySelectorAll('*').forEach((e) => { if (e.getAttribute('fill') !== 'none') { e.setAttribute('fill', S.INK); } e.setAttribute('stroke', S.INK); e.setAttribute('stroke-width', (opts.ink * 2 / k).toFixed(3)); });
    inner.insertBefore(sil, inner.firstChild);
    if (opts.paper) S.paper(outer, opts.paperOpts);
    outer.__size = {w: vw * k, h: vh * k};
    return outer;
  };
  S.icon = function (parent, name, opts) {
    const I = S.ICONS; if (!I || !I.icons[name]) throw new Error('icon not bundled: ' + name);
    return S.normalizeSVG(parent, I.icons[name], [0, 0, I.w, I.h], opts);
  };
})(window.Studio = window.Studio || {});
