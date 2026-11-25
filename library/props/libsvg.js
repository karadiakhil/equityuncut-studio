/* Local prop-SVG library (story_video/assets/props, ~17k colour props) placed inline.
 *   Studio.libProp(parent, 'fluent-emoji/potted-plant.svg', {x, y, size, ink, rot, anchor, flip, opacity})
 * The SVG text is not bundled. tools/render-spec.mjs scans dist/studio.js and the spec for "<set>/<name>.svg" refs, reads
 * them under PROP_SVG_ROOT and injects them as window.__PROP_SVGS before the page boots. A page opened without them
 * still renders: libProp returns null and the caller keeps its built-in fallback.
 * ids inside each file get a per-instance prefix so gradients never clash. ink: true adds the house ink edge (sticker
 * outline) so emoji-style art sits with the outlined cast. anchor: 'bottom' (default, sits on y) or 'center'.
 */
(function (S) {
  'use strict';
  let seq = 0;
  const cache = {};
  function source(ref) {
    const lib = window.__PROP_SVGS || {};
    return lib[ref] || lib[String(ref).replace(/\\/g, '/')] || null;
  }
  function parse(ref) {
    if (ref in cache) return cache[ref];
    const txt = source(ref);
    if (!txt) return (cache[ref] = null);
    const doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg') return (cache[ref] = null);
    let vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
    if (vb.length !== 4 || vb.some(isNaN)) vb = [0, 0, +svg.getAttribute('width') || 32, +svg.getAttribute('height') || 32];
    return (cache[ref] = {vb, inner: svg.innerHTML});
  }
  function inkFilter(w) {
    const id = 'ss-ink-' + String(w).replace('.', '_');
    if (document.getElementById(id)) return id;
    const f = S.svg('filter', {id, x: '-20%', y: '-20%', width: '140%', height: '140%'}, S.ensureDefs());
    S.svg('feMorphology', {in: 'SourceAlpha', operator: 'dilate', radius: w, result: 'd'}, f);
    S.svg('feFlood', {'flood-color': S.INK, result: 'c'}, f);
    S.svg('feComposite', {in: 'c', in2: 'd', operator: 'in', result: 'o'}, f);
    const m = S.svg('feMerge', null, f);
    S.svg('feMergeNode', {in: 'o'}, m);
    S.svg('feMergeNode', {in: 'SourceGraphic'}, m);
    return id;
  }
  S.libHas = (ref) => !!parse(ref);
  S.libProp = function (parent, ref, o) {
    o = o || {};
    const def = parse(ref);
    if (!def) return null;
    const pre = 'lp' + (++seq) + '_';
    const body = def.inner.replace(/\bid="([^"]+)"/g, 'id="' + pre + '$1"').replace(/url\(#([^)]+)\)/g, 'url(#' + pre + '$1)')
      .replace(/(xlink:href|href)="#([^"]+)"/g, '$1="#' + pre + '$2"');
    const size = o.size || 120, [vx, vy, vw, vh] = def.vb, k = size / vw;
    const ax = o.anchorX == null ? 0.5 : o.anchorX, ay = o.anchor === 'center' ? 0.5 : (o.anchorY == null ? 1 : o.anchorY);
    const outer = S.g(parent, {class: 'ss-libprop', 'data-ref': ref, transform: `translate(${o.x || 0} ${o.y || 0}) rotate(${o.rot || 0})`});
    if (o.opacity != null) outer.setAttribute('opacity', o.opacity);
    if (o.shadow !== false && ay === 1) S.svg('ellipse', {cx: 0, cy: 2, rx: size * 0.42, ry: Math.max(2, size * 0.05), fill: '#000', opacity: 0.22}, outer);
    const g = S.g(outer, {transform: `scale(${(o.flip ? -k : k).toFixed(4)} ${k.toFixed(4)}) translate(${-vx - vw * ax} ${-vy - vh * ay})`});
    if (o.ink !== false) g.setAttribute('filter', `url(#${inkFilter(o.inkW || 0.9)})`);
    g.innerHTML = body;
    return outer;
  };
})(window.Studio = window.Studio || {});
