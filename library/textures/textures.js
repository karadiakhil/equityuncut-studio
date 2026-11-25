/* Procedural textures. Heavy noise textures (paper grain, wood, brushed metal) are baked once to PNG tiles by
 * tools/bake-textures.mjs from the SVG sources below; cheap ones (halftone, drafting grid, blueprint) are live SVG
 * patterns. Dust motes are seeded particles on finite tweens.
 */
(function (S) {
  'use strict';
  S.ASSET_BASE = S.ASSET_BASE || 'assets/';
  const T = S.Textures = {};
  // SVG sources for baking (size x size tiles). feTurbulence is deterministic for a given seed.
  T.sources = {
    'paper-grain': (n) => `<svg xmlns="${S.NS}" width="${n}" height="${n}"><filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.27  0 0 0 0.55 -0.12"/></filter><rect width="100%" height="100%" fill="#FFFFFF"/><rect width="100%" height="100%" filter="url(#f)"/><filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.06" numOctaves="2" seed="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.42  0 0 0 0 0.3  0 0 0 0.35 -0.08"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>`,
    'wood-grain': (n) => `<svg xmlns="${S.NS}" width="${n}" height="${n}"><filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="4" seed="11" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.29  0 0 0 0 0.17  0 0 0 0 0.10  0 0 0 1.1 -0.35"/></filter><rect width="100%" height="100%" fill="#8A5634"/><rect width="100%" height="100%" filter="url(#f)"/></svg>`,
    'brushed-metal': (n) => `<svg xmlns="${S.NS}" width="${n}" height="${n}"><filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.002 0.6" numOctaves="2" seed="5" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 -0.1"/></filter><linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9D1DB"/><stop offset="0.5" stop-color="#9AA5B4"/><stop offset="1" stop-color="#C2CAD4"/></linearGradient><rect width="100%" height="100%" fill="url(#l)"/><rect width="100%" height="100%" filter="url(#f)"/></svg>`,
    'grain-overlay': (n) => `<svg xmlns="${S.NS}" width="${n}" height="${n}"><filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="19" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.22  0 0 0 0.9 -0.32"/></filter><rect width="100%" height="100%" filter="url(#f)"/></svg>`
  };
  T.url = (name) => `${S.ASSET_BASE}textures/${name}.png`;
  // live SVG patterns ------------------------------------------------------------------------------------------
  T.pattern = function (defs, kind, o) {
    o = o || {}; const id = S.uid('pat-' + kind);
    if (kind === 'halftone') {
      const s = o.size || 9; const p = S.svg('pattern', {id, width: s, height: s, patternUnits: 'userSpaceOnUse', patternTransform: `rotate(${o.angle || 30})`}, defs);
      S.svg('circle', {cx: s / 2, cy: s / 2, r: o.r || s * 0.22, fill: o.color || S.INK, opacity: o.opacity == null ? 0.18 : o.opacity}, p);
    } else if (kind === 'grid' || kind === 'blueprint') {
      const s = o.size || 40; const p = S.svg('pattern', {id, width: s * 5, height: s * 5, patternUnits: 'userSpaceOnUse'}, defs);
      const c = o.color || (kind === 'blueprint' ? '#38BDF8' : '#94A3B8');
      for (let i = 0; i <= 5; i++) {
        const w = i % 5 === 0 ? 1.4 : 0.6, op = i % 5 === 0 ? 0.5 : 0.22;
        S.svg('line', {x1: i * s, y1: 0, x2: i * s, y2: s * 5, stroke: c, 'stroke-width': w, opacity: op}, p);
        S.svg('line', {x1: 0, y1: i * s, x2: s * 5, y2: i * s, stroke: c, 'stroke-width': w, opacity: op}, p);
      }
    } else if (kind === 'hatch') {
      const s = o.size || 7; const p = S.svg('pattern', {id, width: s, height: s, patternUnits: 'userSpaceOnUse', patternTransform: `rotate(${o.angle || 45})`}, defs);
      S.svg('line', {x1: 0, y1: 0, x2: 0, y2: s, stroke: o.color || S.INK, 'stroke-width': o.w || 1.2, opacity: o.opacity == null ? 0.25 : o.opacity}, p);
    }
    return `url(#${id})`;
  };
  // seeded dust motes drifting through a lit volume: SVG circles on finite tweens
  T.dust = function (tl, parent, o) {
    o = Object.assign({count: 40, x: 0, y: 0, w: 1920, h: 1080, seed: 9, start: 0, end: 12, color: '#FFF7E0', rMin: 1, rMax: 3.4, opacity: 0.6}, o || {});
    const r = S.rng(o.seed); const g = S.g(parent, {class: 'ss-dust'});
    for (let i = 0; i < o.count; i++) {
      const c = S.svg('circle', {cx: 0, cy: 0, r: (o.rMin + r() * (o.rMax - o.rMin)).toFixed(2), fill: o.color, opacity: 0}, g);
      const x0 = o.x + r() * o.w, y0 = o.y + r() * o.h, dx = (r() - 0.3) * 120, dy = -40 - r() * 90, op = o.opacity * (0.4 + r() * 0.6);
      const span = o.end - o.start;
      tl.fromTo(c, {attr: {cx: x0, cy: y0}}, {attr: {cx: x0 + dx, cy: y0 + dy}, duration: span, ease: 'sine.inOut'}, o.start);
      const tw = 1.2 + r() * 1.6, n = Math.max(1, Math.floor(span / tw));
      tl.fromTo(c, {opacity: op * 0.25}, {opacity: op, duration: tw / 2, repeat: n * 2 - 1, yoyo: true, ease: 'sine.inOut'}, o.start + r() * 0.5);
    }
    return g;
  };
})(window.Studio = window.Studio || {});
