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

  // a prop from the local SVG library (story_video/assets/props); fallback() draws the built-in when it is not injected
  function lib(g, ref, x, y, size, o, fallback) {
    const made = S.libProp ? S.libProp(g, ref, Object.assign({x, y, size}, o || {})) : null;
    if (!made && fallback) fallback();
    return made;
  }
  const FE = (n) => 'fluent-emoji/' + n + '.svg';
  function shelf(g, x, y, w, items) {   // wall shelf with library items standing on it
    S.svg('rect', {x: x, y: y, width: w, height: 10, rx: 2, fill: '#65432C', stroke: INK, 'stroke-width': 2.4}, g);
    S.path(g, 'M' + (x + 14) + ' ' + (y + 10) + ' l10 18 M' + (x + w - 14) + ' ' + (y + 10) + ' l-10 18', 'none', null, {stroke: '#42271C', 'stroke-width': 4});
    let cx = x + 18;
    items.forEach((it) => { lib(g, FE(it[0]), cx + it[1] / 2, y, it[1], {shadow: false}); cx += it[1] + 6; });
  }
  function conduit(g, y) {   // pipes / cable runs along the ceiling line
    S.path(g, 'M-200 ' + y + ' L2400 ' + y, 'none', null, {stroke: '#1E262D', 'stroke-width': 10});
    S.path(g, 'M-200 ' + (y + 16) + ' L2400 ' + (y + 16), 'none', null, {stroke: '#3B4650', 'stroke-width': 6});
    for (let x = 0; x < 2400; x += 260) S.svg('rect', {x: x, y: y - 8, width: 14, height: 34, rx: 2, fill: '#2B333B', stroke: INK, 'stroke-width': 1.4}, g);
  }
  function droop(g, x1, x2, y, sag, col) {
    S.path(g, 'M' + x1 + ' ' + y + ' Q' + ((x1 + x2) / 2) + ' ' + (y + sag) + ' ' + x2 + ' ' + y, 'none', null, {stroke: col || '#141416', 'stroke-width': 3, fill: 'none'});
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
        lib(rec.L[2], FE('file-cabinet'), 90, 1000, 150);
        lib(rec.L[2], FE('file-cabinet'), 1880, 1000, 150);
        lib(rec.L[1], FE('framed-picture'), 880, 300, 80, {shadow: false});
        lib(rec.L[1], FE('spiral-calendar'), 1000, 300, 70, {shadow: false});
        lib(rec.L[1], FE('world-map'), 640, 560, 150, {shadow: false});
        shelf(rec.L[1], 1500, 520, 260, [['books', 58], ['card-index', 50], ['bookmark-tabs', 46], ['books', 54]]);
        lib(rec.L[2], FE('telephone'), 1460, 786, 52);
        lib(rec.L[2], FE('hot-beverage'), 560, 786, 40);
        lib(rec.L[2], FE('open-file-folder'), 760, 786, 56);
        lib(rec.L[2], FE('newspaper'), 1110, 786, 54);
        lib(rec.L[2], FE('printer'), 330, 786, 70);
        lib(rec.L[2], FE('wastebasket'), 960, 1000, 64);
        lib(rec.L[2], FE('fire-extinguisher'), 1790, 960, 70);
        lib(rec.L[2], FE('potted-plant'), 1580, 1000, 110);
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
      // style bible: deep-slate night walls kept READABLE (mid slate, not black), concrete floor, one bare bulb key
      room(rec, Object.assign({
        wall: bare ? '#2A2A32' : '#47535C', floor: bare ? '#3F3A36' : '#6E675E', ceiling: '#1E262D', trim: '#2B333B', wallH: 770, bare: bare, wear: bare ? 0 : 14,
        windows: [{x: 120, y: 120, w: 300, h: 230, blinds: bare ? 8 : 7}]
      }, o));
      const B = rec.L[1], M = rec.L[2], FG = rec.L[4];
      if (bare) {
        desk(M, rec.fx, 860, 800, 620, '#44403C');
        laptop(M, 900, 792, '#042F2E');
        rec.slots['desk-main'] = {layer: 2, x: 1080, y: 784};
        rec.slots['foreground'] = {layer: 4, x: 300, y: 1020};
        return;
      }
      // wainscot band + a warm pool on the wall under the bulb
      S.svg('rect', {x: -400, y: 560, width: 3600, height: 200, fill: '#3B464E'}, B);
      S.path(B, 'M-400 560 L3200 560', 'none', null, {stroke: '#2B333B', 'stroke-width': 4});
      const pid = S.uid('pool');
      const rg = S.svg('radialGradient', {id: pid}, S.ensureDefs());
      S.svg('stop', {offset: '0', 'stop-color': '#E0B671', 'stop-opacity': 0.42}, rg);
      S.svg('stop', {offset: '1', 'stop-color': '#E0B671', 'stop-opacity': 0}, rg);
      S.svg('ellipse', {cx: 960, cy: 260, rx: 620, ry: 320, fill: 'url(#' + pid + ')'}, B);
      conduit(B, 52);
      bulb(B, 960, 150);
      // wall: posters (no readable propaganda), notices, clock, calendar, shelf
      poster(B, 520, 160, 170, 132, brand, o.poster || 'NO WINDOWS', 2);
      poster(B, 720, 190, 120, 90, S.Brand.get(o.brands, 'nightwire'), 'NIGHTWIRE', -3);
      S.svg('rect', {x: 1180, y: 170, width: 230, height: 150, rx: 4, fill: '#B08A5A', stroke: INK, 'stroke-width': 3}, B);   // corkboard
      [[1196, 186, '#FFF4C2', -4], [1250, 192, '#FFFDF9', 3], [1310, 184, '#C7E8FF', -2], [1206, 250, '#FFD6D6', 2], [1290, 248, '#FFFDF9', -3], [1356, 236, '#FFF4C2', 5]].forEach((n) => {
        const gg = S.g(B, {transform: 'translate(' + n[0] + ' ' + n[1] + ') rotate(' + n[3] + ')'});
        S.svg('rect', {x: 0, y: 0, width: 46, height: 52, fill: n[2], stroke: INK, 'stroke-width': 1.6}, gg);
        for (let k = 0; k < 3; k++) S.path(gg, 'M6 ' + (14 + k * 10) + ' L40 ' + (14 + k * 10), 'none', null, {stroke: '#64748B', 'stroke-width': 1.6});
        lib(gg, FE('round-pushpin'), 23, 10, 16, {shadow: false, ink: false});
      });
      S.path(B, 'M1210 214 L1286 220 L1330 206 L1376 262', 'none', null, {stroke: '#D94A3A', 'stroke-width': 2.2, fill: 'none'});
      lib(B, FE('spiral-calendar'), 1500, 300, 84, {shadow: false});
      lib(B, FE('mantelpiece-clock'), 1620, 250, 70, {shadow: false}, () => S.Props.wallClock && S.Props.wallClock(B, {x: 1620, y: 220, scale: 0.6}));
      shelf(B, 1450, 420, 320, [['books', 64], ['card-file-box', 56], ['package', 52], ['radio', 58], ['battery', 30]]);
      lib(B, FE('framed-picture'), 470, 470, 74, {shadow: false});
      // coat hooks with jackets
      S.path(B, 'M1820 330 L1960 330', 'none', null, {stroke: '#42271C', 'stroke-width': 6});
      lib(B, FE('coat'), 1850, 450, 90, {shadow: false});
      lib(B, FE('t-shirt'), 1930, 430, 70, {shadow: false});
      // back-wall table: a row of laptops (other night-shift seats), tucked chairs, cables down to the floor
      const ty = 712;
      S.svg('rect', {x: 300, y: ty - 12, width: 1460, height: 14, fill: '#65432C', stroke: INK, 'stroke-width': 2.4}, M);
      S.svg('rect', {x: 300, y: ty + 2, width: 1460, height: 40, fill: '#42271C', stroke: INK, 'stroke-width': 2}, M);
      const tints = ['#0F3D3A', '#11452A', '#1E1B4B', '#0F3D3A', '#102A43', '#11452A', '#0F3D3A'];
      for (let i = 0; i < 7; i++) {
        const lx = 340 + i * 200;
        laptop(M, lx, ty - 12, tints[i]);
        droop(M, lx + 40, lx + 120, ty + 42, 40);
        if (i % 2 === 0) lib(M, FE(['hot-beverage', 'canned-food', 'cup-with-straw', 'beverage-box'][(i / 2) % 4]), lx + 110, ty - 12, 34);
      }
      monitor(M, 1060, 548, 170, 120, '#0F3D3A');
      lib(M, FE('desktop-computer'), 860, ty - 12, 92);
      lib(M, FE('printer'), 1690, ty - 12, 80);
      // bunk bed, right
      bunk(M, 1780, 980);
      lib(M, FE('backpack'), 1760, 980, 70);
      // floor clutter (mid depth)
      lib(M, FE('package'), 200, 960, 96);
      lib(M, FE('package'), 250, 900, 70);
      lib(M, FE('wastebasket'), 470, 930, 60);
      lib(M, FE('pizza'), 1500, 950, 62, {rot: -8});
      lib(M, FE('bento-box'), 1580, 965, 50);
      lib(M, FE('wilted-flower'), 120, 760, 70);
      powerStrip(M, 930, 940);
      droop(M, 940, 700, 948, 30); droop(M, 1000, 1240, 948, 26);
      for (let i = 0; i < 3; i++) S.svg('rect', {x: 1640 + i * 6, y: 960 - i * 12, width: 26, height: 14, rx: 2, fill: '#F97316', stroke: INK, 'stroke-width': 1.2}, M);
      // foreground: the back of an empty chair at the left edge (style bible), a cable run, a fan
      S.path(FG, 'M-20 1100 L-20 840 C-20 800 210 800 210 840 L210 1100 Z', '#2E3440', null, {stroke: INK, 'stroke-width': 5});
      S.path(FG, 'M10 860 L10 1080', 'none', null, {stroke: '#FFFFFF', 'stroke-width': 4, opacity: 0.1});
      lib(FG, FE('electric-plug'), 2010, 1060, 80, {rot: -20});
      rec.slots['desk-main'] = {layer: 2, x: 1300, y: ty - 12};
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
      room(rec, Object.assign({wall: '#3E5468', floor: '#4A5A6C', ceiling: '#1E293B', wallH: 770, windows: [{x: 80, y: 140, w: 280, h: 240, blinds: 12}]}, o));
      signBand(rec.L[1], 620, 96, 640, o.sign || 'NIGHTWIRE', brand);
      for (let i = 0; i < 3; i++) monitor(rec.L[1], 480 + i * 280, 160, 240, 150, i === 1 ? '#7F1D1D' : '#0F172A');
      const bug = S.svg('text', {x: 760, y: 230, 'font-family': 'Archivo Black, sans-serif', 'font-size': 28, fill: '#F8FAFC'}, rec.L[1]);
      bug.textContent = o.bug || 'LIVE';
      desk(rec.L[2], rec.fx, 520, 820, 820, '#0F172A');
      S.svg('rect', {x: 520, y: 896, width: 820, height: 200, fill: '#0B1220', stroke: INK, 'stroke-width': 2}, rec.fx);   // modesty panel to the floor
      S.svg('rect', {x: 540, y: 840, width: 780, height: 40, fill: brand.primary, opacity: 0.9}, rec.fx);
      const nl = S.svg('text', {x: 930, y: 870, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 26, fill: brand.trim, 'letter-spacing': 4}, rec.fx);
      nl.textContent = brand.name;
      if (o.density !== 'bare') {
        papers(rec.L[2], 600, 760, o.rng);
        lib(rec.L[2], FE('potted-plant'), 1540, 1000, 120, null, () => plant(rec.L[2], 1500, 760, 1));
        lib(rec.L[2], FE('desktop-computer'), 640, 804, 90);
        lib(rec.L[2], FE('hot-beverage'), 1180, 804, 40);
        lib(rec.L[2], FE('rolled-up-newspaper'), 1260, 804, 60);
        lib(rec.L[2], FE('studio-microphone'), 900, 804, 60);
        lib(rec.L[1], FE('world-map'), 200, 600, 180, {shadow: false});
        lib(rec.L[1], FE('satellite-antenna'), 1700, 420, 110, {shadow: false});
        lib(rec.L[2], FE('file-cabinet'), 1820, 1000, 150);
        lib(rec.L[4], FE('video-camera'), 1780, 1080, 200);
        if (S.Cast && S.Cast.TheSuit && S.Cast.TheSuit.paper && S.Character && o.anchor !== false) {   // the anchor, behind the desk
          // the anchor stands behind the news desk (the set's own desk front on the FX plane hides below the chest)
          const a = S.Character.create(S.Cast.TheSuit, {id: 'anchor-' + rec.name, parent: rec.charHost, p: {x: 960, y: 1000, scale: 0.7}});
          a.p.armRU = -24; a.p.armRL = -34; a.p.armLU = 24; a.p.armLL = 34; a.p.handR = 20; a.p.handL = -20;
          a.tracks.mood.set(0, 'smirk');
          rec.chars = rec.chars || []; rec.chars.push(a); rec.extras = (rec.extras || []).concat([a]);
        }
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
      rec.charHost = opts.charHost || (stage.layers[3] && stage.layers[3].html);
      opts.rng = rngOf(name, opts.seed || 1);
      opts.bare = opts.density === 'bare';
      BUILDERS[name](rec, opts);
      return rec;
    }
  };
})(window.Studio = window.Studio || {});
