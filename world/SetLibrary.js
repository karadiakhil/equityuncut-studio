/* Parameterised interiors and the night street. Each set is a group on every parallax layer
 * plus an occluder group on the character FX plane, so a desk front can cover legs without
 * sliding away from the body. Density "bare" is the flat legacy room used for before-stills.
 *
 * Names: office, trading-floor, server-room, apartment, courtroom, dorm, factory, city-night, newsroom.
 */
(function (S) {
  'use strict';
  const INK = S.INK;
  const NAMES = ['office', 'trading-floor', 'server-room', 'apartment', 'courtroom', 'dorm', 'factory', 'city-night', 'newsroom'];

  function open(stage, name) {
    const L = [];
    for (let i = 0; i < 5; i++) L.push(S.g(stage.layers[i].svg, {'data-set': name}));
    const fx = S.g(stage.layers[3].fx, {'data-set': name});
    return {L: L, fx: fx, nodes: L.concat([fx]), name: name, floorY: 1000, slots: {}};
  }
  function rngOf(name, seed) { return S.rng(S.hash(name + ':' + (seed || 1))); }

  function outside(g, o) {
    const time = o.time || 'night';
    const sky = time === 'day' ? '#7DD3FC' : time === 'dusk' ? '#C2410C' : '#0B1220';
    const sky2 = time === 'day' ? '#E0F2FE' : time === 'dusk' ? '#FDBA74' : '#172033';
    const id = S.uid('out');
    const lg = S.svg('linearGradient', {id: id, x1: '0', y1: '0', x2: '0', y2: '1'}, S.ensureDefs());
    S.svg('stop', {offset: '0%', 'stop-color': sky}, lg);
    S.svg('stop', {offset: '100%', 'stop-color': sky2}, lg);
    S.svg('rect', {x: -600, y: -100, width: 4200, height: 980, fill: 'url(#' + id + ')'}, g);
    if (time === 'night') S.svg('circle', {cx: 280, cy: 120, r: 22, fill: '#F8FAFC', opacity: 0.85}, g);
    const rng = o.rng;
    let x = -200;
    const base = 470;
    while (x < 2800) {
      const bw = 34 + rng() * 64, bh = 90 + rng() * 220;
      S.svg('rect', {x: x, y: base - bh, width: bw, height: bh, fill: time === 'day' ? '#334155' : '#070B14'}, g);
      if (time !== 'day') {
        const dots = 2 + Math.floor(rng() * 4);
        for (let k = 0; k < dots; k++) S.svg('rect', {x: x + 6 + (k % 3) * 12, y: base - bh + 12 + Math.floor(k / 3) * 18, width: 5, height: 8, fill: '#FDE68A', opacity: 0.85}, g);
      }
      x += bw + 8;
    }
  }
  function punchedWall(layer, o) {
    const id = S.uid('wm');
    const mask = S.svg('mask', {id: id}, S.ensureDefs());
    S.svg('rect', {x: -400, y: -40, width: 3600, height: 820, fill: '#fff'}, mask);
    (o.windows || []).forEach((w) => S.svg('rect', {x: w.x, y: w.y, width: w.w, height: w.h, fill: '#000'}, mask));
    S.svg('rect', {x: -400, y: 0, width: 3600, height: o.wallH || 770, fill: o.wall, mask: 'url(#' + id + ')'}, layer);
    S.svg('rect', {x: -400, y: 0, width: 3600, height: 36, fill: o.ceiling || '#1F2937'}, layer);
    (o.windows || []).forEach((w) => {
      S.svg('rect', {x: w.x, y: w.y, width: w.w, height: w.h, fill: 'none', stroke: '#1F2937', 'stroke-width': 10}, layer);
      S.line(layer, 'M' + (w.x + w.w / 2) + ' ' + w.y + ' L' + (w.x + w.w / 2) + ' ' + (w.y + w.h), null, '#1F2937', {'stroke-width': 4});
      S.line(layer, 'M' + w.x + ' ' + (w.y + w.h / 2) + ' L' + (w.x + w.w) + ' ' + (w.y + w.h / 2), null, '#1F2937', {'stroke-width': 4});
      if (w.blinds) {
        for (let y = w.y + 8; y < w.y + w.h - 6; y += w.blinds) S.line(layer, 'M' + (w.x + 6) + ' ' + y + ' L' + (w.x + w.w - 6) + ' ' + y, null, 'rgba(255,253,249,0.45)', {'stroke-width': 2});
      }
      if (w.curtains) {
        S.svg('rect', {x: w.x, y: w.y, width: 18, height: w.h, fill: w.curtains, opacity: 0.85}, layer);
        S.svg('rect', {x: w.x + w.w - 18, y: w.y, width: 18, height: w.h, fill: w.curtains, opacity: 0.85}, layer);
      }
    });
  }
  function floor(g, o) {
    S.svg('rect', {x: -400, y: 760, width: 3600, height: 360, fill: o.floor}, g);
    const rng = o.rng;
    for (let x = -200; x < 3000; x += 42) S.line(g, 'M' + x + ' 760 L' + (x + 18) + ' 1080', null, 'rgba(0,0,0,0.18)', {'stroke-width': 1.2});
    if (o.weather === 'rain') S.svg('rect', {x: -400, y: 760, width: 3600, height: 360, fill: '#000', opacity: 0.12}, g);
    for (let i = 0; i < (o.bare ? 2 : 7); i++) {
      const x = 200 + rng() * 1800, y = 820 + rng() * 200;
      S.svg('ellipse', {cx: x, cy: y, rx: 18 + rng() * 30, ry: 4 + rng() * 3, fill: '#000', opacity: 0.08}, g);
    }
    S.svg('rect', {x: -400, y: 748, width: 3600, height: 16, fill: o.trim || '#3F2A1A'}, g);
  }
  function wear(g, rng, n) {
    for (let i = 0; i < n; i++) {
      const x = 80 + rng() * 1900, y = 60 + rng() * 640;
      S.line(g, 'M' + x.toFixed(0) + ' ' + y.toFixed(0) + ' l' + ((rng() - 0.3) * 36).toFixed(0) + ' ' + (rng() * 16).toFixed(0), null, 'rgba(0,0,0,0.28)', {'stroke-width': 1.3});
    }
  }
  function monitor(g, x, y, w, h, tint) {
    S.svg('rect', {x: x + w * 0.38, y: y + h, width: w * 0.24, height: 14, fill: '#111827'}, g);
    S.svg('rect', {x: x + w * 0.2, y: y + h + 12, width: w * 0.6, height: 5, fill: '#1F2937'}, g);
    S.svg('rect', {x: x, y: y, width: w, height: h, rx: 3, fill: '#0B0B0C', stroke: INK, 'stroke-width': 2.2}, g);
    S.svg('rect', {x: x + 5, y: y + 5, width: w - 10, height: h - 16, fill: tint || '#042F2E'}, g);
    for (let i = 0; i < 4; i++) S.svg('rect', {x: x + 10, y: y + 12 + i * (h / 7), width: (w - 24) * (0.35 + (i % 3) * 0.15), height: 3, fill: '#99F6E4', opacity: 0.85}, g);
    S.svg('ellipse', {cx: x + w / 2, cy: y + h + 16, rx: w * 0.4, ry: 8, fill: tint || '#22D3EE', opacity: 0.22}, g);
  }
  function laptop(g, x, y, tint) {
    S.svg('rect', {x: x, y: y - 8, width: 78, height: 10, rx: 2, fill: '#9CA3AF', stroke: INK, 'stroke-width': 1.3}, g);
    S.svg('rect', {x: x + 8, y: y - 52, width: 62, height: 44, rx: 2, fill: '#111827', stroke: INK, 'stroke-width': 1.5}, g);
    S.svg('rect', {x: x + 12, y: y - 48, width: 54, height: 34, fill: tint || '#042F2E'}, g);
    S.svg('ellipse', {cx: x + 39, cy: y - 4, rx: 30, ry: 6, fill: tint || '#22D3EE', opacity: 0.2}, g);
  }
  function cable(g, x1, y1, x2, y2) {
    S.path(g, 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + (y1 + 50) + ' ' + x2 + ' ' + (y2 - 30) + ' ' + x2 + ' ' + y2, 'none', null, {stroke: '#111827', 'stroke-width': 3, fill: 'none'});
  }
  function plant(g, x, y, s) {
    s = s || 1;
    const gg = S.g(g, {transform: 'translate(' + x + ' ' + y + ') scale(' + s + ')'});
    S.svg('path', {d: 'M-14,-4 L14,-4 L18,16 L-18,16 Z', fill: '#7C4A2D', stroke: INK, 'stroke-width': 1.4}, gg);
    S.svg('ellipse', {cx: 0, cy: -22, rx: 16, ry: 18, fill: '#15803D', stroke: INK, 'stroke-width': 1.3}, gg);
    S.svg('ellipse', {cx: -14, cy: -12, rx: 11, ry: 13, fill: '#166534', stroke: INK, 'stroke-width': 1.2}, gg);
    S.svg('ellipse', {cx: 14, cy: -14, rx: 10, ry: 12, fill: '#22C55E', stroke: INK, 'stroke-width': 1.2}, gg);
  }
  function poster(g, x, y, w, h, brand, title, rot) {
    const gg = S.g(g, {transform: 'translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ')'});
    S.svg('rect', {x: 0, y: 0, width: w, height: h, fill: '#FFFDF9', stroke: INK, 'stroke-width': 2}, gg);
    S.svg('rect', {x: 0, y: 0, width: w, height: 16, fill: brand.primary}, gg);
    const a = S.svg('text', {x: 6, y: 12, 'font-family': 'Archivo Black, sans-serif', 'font-size': 8, fill: brand.trim}, gg);
    a.textContent = brand.short || '';
    const b = S.svg('text', {x: 8, y: 40, 'font-family': 'Archivo Black, sans-serif', 'font-size': 13, fill: '#18181B'}, gg);
    b.textContent = title;
    S.svg('rect', {x: 8, y: -4, width: 10, height: 6, fill: '#FDE68A', opacity: 0.9}, gg);
    S.svg('rect', {x: w - 16, y: -3, width: 10, height: 6, fill: '#FDE68A', opacity: 0.9}, gg);
  }
  function papers(g, x, y, rng) {
    for (let i = 0; i < 3; i++) {
      const gg = S.g(g, {transform: 'translate(' + (x + i * 3) + ' ' + y + ') rotate(' + ((rng() - 0.5) * 14).toFixed(1) + ')'});
      S.svg('rect', {x: 0, y: 0, width: 34, height: 44, fill: i % 2 ? '#FFFDF9' : '#F5F0E6', stroke: INK, 'stroke-width': 1.1}, gg);
      for (let k = 0; k < 4; k++) S.line(gg, 'M4 ' + (8 + k * 8) + ' L28 ' + (8 + k * 8), 1, '#94A3B8');
    }
  }
  function crate(g, x, y, w, h, brand) {
    S.svg('rect', {x: x, y: y - h, width: w, height: h, fill: '#D6D3D1', stroke: INK, 'stroke-width': 1.6}, g);
    S.svg('rect', {x: x, y: y - h * 0.55, width: w, height: 12, fill: brand.accent}, g);
    const t = S.svg('text', {x: x + w / 2, y: y - h * 0.3, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 10, fill: brand.primary}, g);
    t.textContent = brand.short || '';
  }
  function chair(g, x, y) {
    S.svg('rect', {x: x - 18, y: y - 64, width: 6, height: 64, fill: '#334155'}, g);
    S.svg('rect', {x: x + 16, y: y - 64, width: 6, height: 64, fill: '#334155'}, g);
    S.svg('rect', {x: x - 22, y: y - 72, width: 48, height: 10, rx: 2, fill: '#1F2937', stroke: INK, 'stroke-width': 1.2}, g);
    S.svg('rect', {x: x - 20, y: y - 132, width: 44, height: 36, rx: 3, fill: '#111827', stroke: INK, 'stroke-width': 1.4}, g);
  }
  function desk(back, front, x, y, w, top) {
    top = top || '#A16207';
    S.svg('rect', {x: x, y: y - 16, width: w, height: 16, fill: top, stroke: INK, 'stroke-width': 2}, back);
    S.svg('rect', {x: x + 8, y: y - 4, width: w - 16, height: 3, fill: '#FDE68A', opacity: 0.35}, back);
    S.svg('rect', {x: x + 12, y: y, width: 8, height: 64, fill: '#78350F', stroke: INK, 'stroke-width': 1.2}, back);
    S.svg('rect', {x: x + w - 20, y: y, width: 8, height: 64, fill: '#78350F', stroke: INK, 'stroke-width': 1.2}, back);
    if (front) {
      S.svg('rect', {x: x, y: y, width: w, height: 78, fill: '#7C4A2D', stroke: INK, 'stroke-width': 2}, front);
      S.svg('rect', {x: x + 10, y: y + 12, width: w - 20, height: 6, fill: '#E9DFCC', opacity: 0.25}, front);
    }
  }
  function frameEdges(g) {
    S.svg('rect', {x: -40, y: 0, width: 36, height: 1080, fill: '#0B0B0C', opacity: 0.8}, g);
    S.svg('rect', {x: -6, y: 0, width: 8, height: 1080, fill: '#E7E5E4'}, g);
    S.svg('rect', {x: 2140, y: 0, width: 48, height: 1080, fill: '#0B0B0C', opacity: 0.8}, g);
  }
  function signBand(g, x, y, w, text, brand) {
    S.svg('rect', {x: x, y: y, width: w, height: 36, rx: 2, fill: brand.primary, stroke: INK, 'stroke-width': 2}, g);
    const t = S.svg('text', {x: x + 16, y: y + 25, 'font-family': 'Archivo Black, sans-serif', 'font-size': 18, fill: brand.trim, 'letter-spacing': '1.5'}, g);
    t.textContent = text;
  }
  function powerStrip(g, x, y) {
    S.svg('rect', {x: x, y: y, width: 70, height: 16, rx: 3, fill: '#1F2937', stroke: INK, 'stroke-width': 1.2}, g);
    for (let i = 0; i < 3; i++) S.svg('rect', {x: x + 8 + i * 18, y: y + 4, width: 8, height: 8, fill: '#0B0B0C'}, g);
  }
  function bulb(g, x, y) {
    S.path(g, 'M' + x + ' 40 L' + x + ' ' + (y - 16), 'none', null, {stroke: '#44403C', 'stroke-width': 2});
    S.svg('circle', {cx: x, cy: y, r: 12, fill: '#FDE68A', stroke: INK, 'stroke-width': 1.4}, g);
    S.svg('ellipse', {cx: x, cy: y + 30, rx: 70, ry: 28, fill: '#FDE68A', opacity: 0.18}, g);
  }

  function room(rec, o) {
    const G = rec.L;
    outside(G[0], o);
    punchedWall(G[1], o);
    if (!o.bare) wear(G[1], o.rng, o.wear || 8);
    floor(G[2], o);
    if (!o.bare && o.frame !== false) frameEdges(G[4]);
    return G;
  }

  const BUILDERS = {
    office(rec, o) {
      const brand = S.Brand.get(o.brands, o.brand || 'harbor');
      const bare = o.density === 'bare';
      room(rec, Object.assign({wall: '#D9C7A7', floor: '#8A5A32', ceiling: '#44403C', wallH: 770, bare: bare, windows: [{x: 180, y: 120, w: 420, h: 280, blinds: bare ? 0 : 14}, {x: 1500, y: 140, w: 280, h: 220, blinds: 18}]}, o));
      signBand(rec.L[1], 680, 108, 520, o.sign || 'FIELD OFFICE', brand);
      if (!bare && S.Props && S.Props.wallClock) S.Props.wallClock(rec.L[1], {x: 1380, y: 180, scale: 0.85, paper: false});
      if (!bare) {
        poster(rec.L[1], 1120, 200, 120, 90, brand, o.poster || 'QUIET', -2);
        plant(rec.L[2], 250, 760, 1.3);
        plant(rec.L[2], 1760, 760, 1);
      }
      desk(rec.L[2], rec.fx, 430, 800, 360, '#A16207');
      desk(rec.L[2], rec.fx, 1040, 800, 460, '#A16207');
      monitor(rec.L[2], 500, 640, 150, 100, '#0F172A');
      monitor(rec.L[2], 1120, 620, 180, 120, '#042F2E');
      if (!bare) {
        monitor(rec.L[2], 1320, 640, 120, 90, '#1E3A8A');
        chair(rec.L[2], 620, 1000);
        chair(rec.L[2], 1260, 1000);
        papers(rec.L[2], 700, 742, o.rng);
        papers(rec.L[2], 1460, 748, o.rng);
        cable(rec.L[2], 600, 740, 520, 900);
        cable(rec.L[2], 1200, 740, 1100, 940);
        powerStrip(rec.L[2], 500, 930);
        crate(rec.L[2], 200, 1000, 70, 48, brand);
        S.svg('rect', {x: 1680, y: 430, width: 70, height: 110, fill: brand.primary, stroke: INK, 'stroke-width': 1.5}, rec.L[1]);
        S.svg('rect', {x: 1692, y: 560, width: 6, height: 200, fill: '#44403C'}, rec.L[2]);
        S.svg('rect', {x: 1660, y: 860, width: 90, height: 140, fill: '#1F2937', stroke: INK, 'stroke-width': 1.5}, rec.L[2]);
        for (let i = 0; i < 4; i++) S.svg('rect', {x: 1672, y: 880 + i * 28, width: 66, height: 16, fill: i % 2 ? '#F5F0E6' : '#E7E5E4', stroke: INK, 'stroke-width': 0.8}, rec.L[2]);
      }
      monitor(rec.L[4], 1560, 860, 220, 150, '#020617');
      rec.slots['desk-main'] = {layer: 2, x: 1180, y: 784};
      rec.slots['stamp'] = {layer: 2, x: 1360, y: 786};
      rec.slots['foreground'] = {layer: 4, x: 400, y: 1000};
    },
    'trading-floor'(rec, o) {
      const brand = S.Brand.get(o.brands, o.brand || 'lumen');
      room(rec, Object.assign({wall: '#1F2937', floor: '#111827', ceiling: '#0B0B0C', wallH: 770, windows: [{x: 1400, y: 80, w: 460, h: 220, blinds: 0}], wear: 4}, o));
      signBand(rec.L[1], 80, 48, 460, o.sign || 'LUMEN DESK', brand);
      const board = S.svg('text', {x: 360, y: 250, 'font-family': 'JetBrains Mono, monospace', 'font-size': 42, fill: '#34D399'}, rec.L[1]);
      const board2 = S.svg('text', {x: 360, y: 300, 'font-family': 'JetBrains Mono, monospace', 'font-size': 28, fill: '#FDE68A'}, rec.L[1]);
      board.textContent = '4,281.6';
      board2.textContent = 'UP  1.8%';
      S.onApply((t) => {
        const n = 4200 + Math.floor((Math.sin(t * 1.7) * 0.5 + 0.5) * 180);
        board.textContent = n.toLocaleString('en-US') + '.' + (Math.floor(t * 10) % 10);
      }, 18);
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 5; col++) {
          const x = 180 + col * 200, y = 480 + row * 150;
          monitor(rec.L[2], x, y, 150, 96, row ? '#052E16' : '#042F2E');
          if (o.density !== 'bare') cable(rec.L[2], x + 40, y + 96, x + 20, 900);
        }
      }
      desk(rec.L[2], rec.fx, 160, 820, 980, '#334155');
      if (o.density !== 'bare') {
        chair(rec.L[2], 400, 1000);
        chair(rec.L[2], 700, 1000);
        papers(rec.L[2], 900, 760, o.rng);
        plant(rec.L[2], 1500, 760, 0.8);
      }
      rec.slots['desk-main'] = {layer: 2, x: 640, y: 804};
    },
    'server-room'(rec, o) {
      const brand = S.Brand.get(o.brands, o.brand || 'northline');
      room(rec, Object.assign({wall: '#0F172A', floor: '#1E293B', ceiling: '#020617', wallH: 770, windows: [{x: 80, y: 60, w: 180, h: 70, blinds: 0}], wear: 3, frame: true}, o));
      signBand(rec.L[1], 300, 60, 420, o.sign || 'NORTHLINE CAGE', brand);
      const leds = [];
      const rng = o.rng;
      for (let col = 0; col < 7; col++) {
        const x = 200 + col * 150, h = 460;
        S.svg('rect', {x: x, y: 780 - h, width: 110, height: h, fill: '#111827', stroke: INK, 'stroke-width': 2}, rec.L[2]);
        for (let i = 0; i < 9; i++) {
          const y = 780 - h + 16 + i * 46;
          S.svg('rect', {x: x + 10, y: y, width: 90, height: 28, fill: '#1F2937', stroke: '#334155', 'stroke-width': 1}, rec.L[2]);
          for (let k = 0; k < 3; k++) leds.push({c: S.svg('circle', {cx: x + 24 + k * 16, cy: y + 14, r: 3, fill: '#22C55E'}, rec.L[2]), ph: rng() * 5, sp: 1.5 + rng() * 3});
        }
      }
      S.onApply((t) => {
        for (let i = 0; i < leds.length; i++) {
          const L = leds[i];
          const on = Math.sin(t * L.sp + L.ph) > 0.15;
          L.c.setAttribute('fill', on ? (i % 7 === 0 ? '#FACC15' : '#22C55E') : '#14532D');
        }
      }, 18);
      if (o.density !== 'bare') {
        cable(rec.L[2], 260, 760, 300, 980);
        cable(rec.L[2], 560, 740, 640, 990);
        crate(rec.L[2], 1400, 1000, 90, 60, brand);
      }
      S.svg('rect', {x: 40, y: 780, width: 2000, height: 8, fill: '#FACC15'}, rec.L[2]);
      S.svg('rect', {x: 40, y: 792, width: 2000, height: 8, fill: '#111827'}, rec.L[2]);
      rec.slots['desk-main'] = {layer: 2, x: 900, y: 780};
    },
    apartment(rec, o) {
      const brand = S.Brand.get(o.brands, o.brand || 'harbor');
      const bare = o.density === 'bare';
      const luxury = !!o.luxury;
      room(rec, Object.assign({
        wall: luxury ? '#F5F0E6' : '#E7D3B0', floor: luxury ? '#7C4A2D' : '#A16207', ceiling: luxury ? '#44403C' : '#57534E',
        wallH: 770, bare: bare,
        windows: [{x: 980, y: 110, w: 520, h: 340, blinds: luxury ? 0 : 20, curtains: luxury ? '#7F1D1D' : '#9F1239'}]
      }, o));
      if (luxury) {
        S.svg('circle', {cx: 960, cy: 70, r: 16, fill: '#F5C542', stroke: INK, 'stroke-width': 1.5}, rec.L[1]);
        for (let i = 0; i < 5; i++) S.svg('circle', {cx: 900 + i * 30, cy: 110, r: 6, fill: '#FDE68A', stroke: INK, 'stroke-width': 1}, rec.L[1]);
      } else bulb(rec.L[1], 360, 150);
      if (!bare) {
        poster(rec.L[1], 220, 180, 140, 110, brand, luxury ? 'SALON' : 'RENT DUE', luxury ? 0 : 3);
        S.svg('rect', {x: 260, y: 860, width: 420, height: 28, rx: 8, fill: '#7F1D1D', stroke: INK, 'stroke-width': 2}, rec.L[2]);
        S.svg('rect', {x: 280, y: 820, width: 160, height: 40, rx: 8, fill: '#FECACA', stroke: INK, 'stroke-width': 1.4}, rec.L[2]);
        S.svg('rect', {x: 460, y: 830, width: 140, height: 34, rx: 8, fill: '#FEE2E2', stroke: INK, 'stroke-width': 1.2}, rec.L[2]);
        S.svg('ellipse', {cx: 480, cy: 980, rx: 180, ry: 28, fill: '#7F1D1D', opacity: 0.35}, rec.L[2]);
        plant(rec.L[2], 860, 760, 1.4);
        crate(rec.L[2], 1600, 1000, 80, 50, brand);
        papers(rec.L[2], 1500, 740, o.rng);
      }
      desk(rec.L[2], rec.fx, 1180, 820, 280, luxury ? '#44403C' : '#A16207');
      monitor(rec.L[2], 1240, 680, 140, 90, '#1E1B4B');
      rec.slots['desk-main'] = {layer: 2, x: 1320, y: 804};
    },
    courtroom(rec, o) {
      const brand = S.Brand.get(o.brands, o.brand || 'harbor');
      room(rec, Object.assign({wall: '#C4B08E', floor: '#6B3E26', ceiling: '#44403C', wallH: 770, windows: [{x: 80, y: 90, w: 200, h: 280, blinds: 0}, {x: 1680, y: 90, w: 200, h: 280, blinds: 0}], wear: 5}, o));
      S.svg('rect', {x: 460, y: 360, width: 1000, height: 280, fill: '#7C4A2D', stroke: INK, 'stroke-width': 3}, rec.L[2]);
      S.svg('rect', {x: 500, y: 390, width: 920, height: 40, fill: '#E9DFCC', stroke: INK, 'stroke-width': 1.5}, rec.L[2]);
      signBand(rec.L[1], 700, 80, 520, o.sign || 'HARBOR COURT', brand);
      S.svg('circle', {cx: 960, cy: 250, r: 54, fill: brand.primary, stroke: brand.accent, 'stroke-width': 6}, rec.L[1]);
      const seal = S.svg('text', {x: 960, y: 256, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 14, fill: brand.trim}, rec.L[1]);
      seal.textContent = brand.short;
      if (o.density !== 'bare') {
        S.svg('rect', {x: 300, y: 860, width: 1320, height: 16, fill: '#44403C', stroke: INK, 'stroke-width': 1.4}, rec.fx);
        for (let i = 0; i < 8; i++) S.svg('rect', {x: 340 + i * 160, y: 780, width: 8, height: 90, fill: '#292524'}, rec.fx);
        papers(rec.L[2], 860, 400, o.rng);
        S.svg('rect', {x: 1180, y: 400, width: 16, height: 70, fill: '#44403C', stroke: INK, 'stroke-width': 1}, rec.L[2]);
        S.svg('rect', {x: 1164, y: 392, width: 48, height: 14, rx: 2, fill: '#1F2937', stroke: INK, 'stroke-width': 1}, rec.L[2]);
      }
      rec.slots['desk-main'] = {layer: 2, x: 960, y: 430};
    },
    dorm(rec, o) {
      const brand = S.Brand.get(o.brands, o.brand || 'northline');
      const bare = o.density === 'bare';
      room(rec, Object.assign({
        wall: '#2A2A32', floor: '#3F3A36', ceiling: '#18181B', wallH: 770, bare: bare, wear: bare ? 0 : 12,
        windows: [{x: 140, y: 100, w: 340, h: 260, blinds: bare ? 8 : 6}]
      }, o));
      if (!bare) {
        bulb(rec.L[1], 860, 120);
        poster(rec.L[1], 560, 180, 150, 120, brand, o.poster || 'NO WINDOWS', 2);
        poster(rec.L[1], 560, 330, 130, 90, S.Brand.get(o.brands, 'nightwire'), 'NIGHTWIRE', -3);
        bunk(rec.L[2], 1460, 1000);
        plant(rec.L[2], 520, 760, 0.7);
        crate(rec.L[2], 1540, 1000, 64, 40, brand);
        powerStrip(rec.L[2], 980, 940);
        for (let i = 0; i < 3; i++) {
          S.svg('rect', {x: 700, y: 960 - i * 8, width: 22, height: 18, rx: 2, fill: '#F97316', stroke: INK, 'stroke-width': 1}, rec.L[2]);
        }
      }
      desk(rec.L[2], bare ? null : rec.fx, 860, 800, 620, '#44403C');
      const tints = ['#042F2E', '#052E16', '#1E1B4B', '#042F2E', '#0F172A'];
      const count = bare ? 1 : 5;
      for (let i = 0; i < count; i++) {
        laptop(rec.L[2], 900 + i * 100, 792, tints[i]);
        if (!bare) cable(rec.L[2], 940 + i * 100, 792, 1000 + (i % 3) * 16, 940);
      }
      if (!bare) {
        monitor(rec.L[2], 1180, 560, 200, 130, '#042F2E');
        laptop(rec.L[4], 220, 1040, '#022C22');
      }
      rec.slots['desk-main'] = {layer: 2, x: 1080, y: 784};
      rec.slots['foreground'] = {layer: 4, x: 300, y: 1020};
    },
    factory(rec, o) {
      const brand = S.Brand.get(o.brands, o.brand || 'kiln');
      room(rec, Object.assign({wall: '#78716C', floor: '#44403C', ceiling: '#292524', wallH: 770, windows: [{x: 200, y: 70, w: 300, h: 90, blinds: 0}, {x: 560, y: 70, w: 300, h: 90, blinds: 0}, {x: 920, y: 70, w: 300, h: 90, blinds: 0}], wear: 10}, o));
      signBand(rec.L[1], 1280, 80, 480, o.sign || 'KILN WORKS', brand);
      S.svg('rect', {x: 40, y: 748, width: 2200, height: 14, fill: '#FACC15'}, rec.L[2]);
      S.svg('rect', {x: 40, y: 762, width: 2200, height: 14, fill: '#111827'}, rec.L[2]);
      S.svg('rect', {x: 240, y: 520, width: 420, height: 240, fill: '#334155', stroke: INK, 'stroke-width': 2.4}, rec.L[2]);
      S.svg('rect', {x: 280, y: 560, width: 160, height: 80, fill: '#0F172A', stroke: '#94A3B8', 'stroke-width': 2}, rec.L[2]);
      S.svg('circle', {cx: 560, cy: 640, r: 46, fill: '#1F2937', stroke: INK, 'stroke-width': 3}, rec.L[2]);
      S.svg('rect', {x: 520, y: 760, width: 80, height: 16, fill: '#FB923C'}, rec.L[2]);
      if (o.density !== 'bare') {
        crate(rec.L[2], 860, 1000, 90, 70, brand);
        crate(rec.L[2], 970, 1000, 70, 48, brand);
        crate(rec.L[2], 1500, 990, 110, 80, brand);
        cable(rec.L[2], 400, 760, 360, 980);
        plant(rec.L[2], 1800, 760, 0.6);
      }
      rec.slots['desk-main'] = {layer: 2, x: 700, y: 760};
    },
    'city-night'(rec, o) {
      S.World.city(rec.L, {
        seed: o.seed, time: o.time || 'night', weather: o.weather || 'rain', brands: o.brands,
        plots: o.plots, crossX: o.crossX || 1120
      });
      rec.floorY = S.World.STREET.near;
      rec.slots['curb'] = {layer: 2, x: 700, y: S.World.STREET.near};
      rec.slots['foreground'] = {layer: 4, x: 200, y: 1040};
    },
    newsroom(rec, o) {
      const brand = S.Brand.get(o.brands, o.brand || 'nightwire');
      room(rec, Object.assign({wall: '#1E293B', floor: '#334155', ceiling: '#0F172A', wallH: 770, windows: [{x: 80, y: 140, w: 280, h: 240, blinds: 12}]}, o));
      signBand(rec.L[1], 620, 96, 640, o.sign || 'NIGHTWIRE', brand);
      for (let i = 0; i < 3; i++) monitor(rec.L[1], 480 + i * 280, 160, 240, 150, i === 1 ? '#7F1D1D' : '#0F172A');
      const bug = S.svg('text', {x: 760, y: 230, 'font-family': 'Archivo Black, sans-serif', 'font-size': 28, fill: '#F8FAFC'}, rec.L[1]);
      bug.textContent = o.bug || 'LIVE';
      desk(rec.L[2], rec.fx, 520, 820, 820, '#0F172A');
      if (o.density !== 'bare') {
        papers(rec.L[2], 600, 760, o.rng);
        plant(rec.L[2], 1500, 760, 1);
        chair(rec.L[2], 900, 1000);
      }
      S.svg('rect', {x: 240, y: 780, width: 70, height: 40, fill: '#111827', stroke: INK, 'stroke-width': 1.5}, rec.L[4]);
      S.svg('circle', {cx: 310, cy: 800, r: 16, fill: '#0B0B0C', stroke: '#94A3B8', 'stroke-width': 3}, rec.L[4]);
      S.svg('rect', {x: 180, y: 860, width: 16, height: 180, fill: '#1F2937'}, rec.L[4]);
      rec.slots['desk-main'] = {layer: 2, x: 900, y: 804};
    }
  };

  function bunk(g, x, y) {
    S.svg('rect', {x: x, y: y - 168, width: 8, height: 168, fill: '#44403C', stroke: INK, 'stroke-width': 1.2}, g);
    S.svg('rect', {x: x + 120, y: y - 168, width: 8, height: 168, fill: '#44403C', stroke: INK, 'stroke-width': 1.2}, g);
    S.svg('rect', {x: x, y: y - 86, width: 128, height: 10, fill: '#57534E', stroke: INK, 'stroke-width': 1.2}, g);
    S.svg('rect', {x: x, y: y - 160, width: 128, height: 10, fill: '#57534E', stroke: INK, 'stroke-width': 1.2}, g);
    S.svg('rect', {x: x + 6, y: y - 80, width: 114, height: 12, fill: '#1D4ED8', stroke: INK, 'stroke-width': 1}, g);
    S.svg('rect', {x: x + 6, y: y - 154, width: 114, height: 12, fill: '#1E3A8A', stroke: INK, 'stroke-width': 1}, g);
  }

  S.Sets = {
    names: NAMES.slice(),
    build(stage, name, opts) {
      if (NAMES.indexOf(name) < 0) throw new Error('unknown set ' + name);
      opts = opts || {};
      const rec = open(stage, name);
      opts.rng = rngOf(name, opts.seed || 1);
      opts.bare = opts.density === 'bare';
      BUILDERS[name](rec, opts);
      return rec;
    }
  };
})(window.Studio = window.Studio || {});
