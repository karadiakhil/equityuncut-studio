/* Exterior world kit: facades, streets, skylines, vehicles.
 * Buildings and roads are drawn in plate-local coordinates (the same numbers on every parallax layer)
 * so the camera's depth factors do the sliding. Vehicles move on a proxy tweened by GSAP;
 * wheel spin, brake lights, turbines and traffic lamps are a pure function of that proxy and t.
 *
 * Kinds: office, bank, hq, shop, apartment, factory.
 * Vehicles: car, taxi, police, van, truck, jet, ship.
 */
(function (S) {
  'use strict';
  const INK = S.INK;
  const movers = [];
  S.World = S.World || {};
  S.World.movers = movers;   // read-only, for tools/check_vehicles.mjs
  const signals = [];
  const smokes = [];

  S.World = {
    STREET: {base: 768, far: 868, near: 992},
    movers, signals
  };

  function bodyColor(kind) {
    return {office: '#CBD5E1', bank: '#E9DFCC', hq: '#0F172A', shop: '#F5F0E6', apartment: '#B9824F', factory: '#7C4A2D'}[kind] || '#CBD5E1';
  }

  S.World.facade = function (parent, o) {
    o = o || {};
    const brand = o.brand || {name: 'NORTHLINE', short: 'NL', primary: '#0B1F33', accent: '#F5C542', trim: '#F8FAFC', tag: ''};
    const kind = o.kind || 'office';
    const floors = o.floors || (kind === 'hq' ? 14 : kind === 'shop' ? 3 : kind === 'factory' ? 4 : 6);
    const fh = kind === 'hq' ? 26 : 34;
    const w = o.w || 200;
    const h = floors * fh + (kind === 'shop' ? 48 : 28);
    const x = o.x || 0, y = o.y || S.World.STREET.base;
    const rng = S.rng((o.seed || 1) >>> 0);
    const g = S.g(parent, {transform: 'translate(' + x + ' ' + y + ')'});
    const night = o.time !== 'day';
    S.svg('rect', {x: 0, y: -h, width: w, height: h, fill: bodyColor(kind), stroke: INK, 'stroke-width': 2.4}, g);
    S.svg('rect', {x: w - 12, y: -h, width: 12, height: h, fill: '#000', opacity: 0.16}, g);
    if (kind === 'factory') {
      let d = 'M0 ' + (-h);
      for (let i = 0; i < 4; i++) d += ' L' + ((w / 4) * i + w / 8).toFixed(1) + ' ' + (-h - 26) + ' L' + ((w / 4) * (i + 1)).toFixed(1) + ' ' + (-h);
      S.path(g, d + ' L' + w + ' ' + (-h + 2) + ' L0 ' + (-h + 2) + ' Z', '#334155', 2);
      S.svg('rect', {x: w * 0.7, y: -h - 78, width: 16, height: 78, fill: '#44403C', stroke: INK, 'stroke-width': 1.4}, g);
      const puffs = [];
      for (let i = 0; i < 4; i++) puffs.push({c: S.svg('circle', {cx: w * 0.7 + 8, cy: -h - 78, r: 8, fill: '#CBD5E1', opacity: 0.45}, g), ph: i * 0.25});
      smokes.push({puffs, h, top: -h - 78});
    } else if (kind === 'hq') {
      S.svg('rect', {x: 10, y: -h - 18, width: w - 20, height: 18, fill: brand.primary, stroke: INK, 'stroke-width': 1.6}, g);
      S.svg('rect', {x: w * 0.55, y: -h - 64, width: 5, height: 48, fill: '#94A3B8', stroke: INK, 'stroke-width': 1}, g);
      if (!o.far) {
        const crown = S.svg('text', {x: w / 2, y: -h - 5, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': Math.max(11, Math.min(20, w / 9)), fill: brand.accent}, g);
        crown.textContent = o.sign || brand.name;
      }
    } else {
      S.svg('rect', {x: 12, y: -h - 12, width: 34, height: 14, rx: 1, fill: '#64748B', stroke: INK, 'stroke-width': 1.2}, g);
      if (kind === 'apartment') S.svg('circle', {cx: w - 22, cy: -h - 28, r: 14, fill: '#94A3B8', stroke: INK, 'stroke-width': 1.4}, g);
    }
    const cols = Math.max(2, Math.floor((w - 20) / 26));
    const winFloors = kind === 'shop' ? Math.max(1, floors - 1) : floors;
    for (let fl = 0; fl < winFloors; fl++) {
      for (let c = 0; c < cols; c++) {
        const ww = Math.min(16, (w - 24) / cols - 6);
        const wx = 12 + c * ((w - 22) / cols);
        const wy = -h + 14 + fl * fh;
        const wh = fh * 0.48;
        const lit = night && rng() > (kind === 'apartment' ? 0.42 : 0.3);
        const fill = lit ? (rng() > 0.55 ? '#F5C542' : '#FDE68A') : (o.time === 'dusk' ? '#FB923C' : o.time === 'day' ? '#7DD3FC' : '#0B1220');
        S.svg('rect', {x: wx, y: wy, width: ww, height: wh, rx: 1, fill: fill, stroke: 'rgba(15,23,42,0.45)', 'stroke-width': 0.8}, g);
        if (lit) S.svg('rect', {x: wx, y: wy, width: Math.max(2, ww * 0.35), height: wh, fill: '#FFF', opacity: 0.2}, g);
      }
    }
    if (kind === 'shop') {
      S.path(g, 'M-8 -78 Q' + (w / 2) + ' -118 ' + (w + 8) + ' -78 L' + w + ' -64 L0 -64 Z', brand.accent, 2);
      if (!o.far) {
        const aw = S.svg('text', {x: w / 2, y: -86, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 13, fill: brand.primary}, g);
        aw.textContent = o.sign || brand.name;
      }
      S.svg('rect', {x: 16, y: -62, width: w - 32, height: 40, fill: '#0F172A', stroke: INK, 'stroke-width': 1.6}, g);
      S.svg('rect', {x: 22, y: -56, width: (w - 44) * 0.6, height: 28, fill: '#F8FAFC', opacity: 0.85}, g);
    }
    if (kind === 'bank') {
      for (let i = 0; i < 4; i++) {
        const cx = 14 + i * ((w - 28) / 3);
        S.svg('rect', {x: cx, y: -86, width: 12, height: 86, fill: '#F5F0E6', stroke: INK, 'stroke-width': 1.3}, g);
      }
      S.svg('path', {d: 'M0 -86 L' + (w / 2) + ' -118 L' + w + ' -86 Z', fill: brand.primary, stroke: INK, 'stroke-width': 1.6}, g);
    }
    if (kind === 'apartment') {
      for (let fl = 1; fl < floors; fl += 2) {
        const by = -h + 16 + fl * fh + fh * 0.5;
        S.svg('rect', {x: 8, y: by, width: w - 16, height: 5, fill: '#57534E', stroke: INK, 'stroke-width': 1}, g);
      }
      S.svg('rect', {x: w - 30, y: -h + 36, width: 16, height: 12, fill: '#E5E7EB', stroke: INK, 'stroke-width': 1}, g);
      S.path(g, 'M' + (w - 6) + ' -16 l-18 -20 l18 -20 l-18 -20 l18 -20', 'none', null, {stroke: '#334155', 'stroke-width': 2, fill: 'none'});
    }
    if (!o.far && kind !== 'shop' && kind !== 'hq') {
      const sign = o.sign || brand.name;
      S.svg('rect', {x: 8, y: -54, width: w - 16, height: 22, rx: 2, fill: brand.primary, stroke: INK, 'stroke-width': 1.4}, g);
      const tx = S.svg('text', {x: w / 2, y: -38, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': Math.max(8, Math.min(13, (w - 20) / Math.max(3, sign.length) * 1.45)), fill: brand.trim}, g);
      tx.textContent = sign;
    }
    S.svg('rect', {x: w / 2 - 14, y: -32, width: 28, height: 32, fill: '#111827', stroke: INK, 'stroke-width': 1.4}, g);
    S.svg('circle', {cx: w / 2 + 8, cy: -16, r: 1.6, fill: brand.accent}, g);
    return {g, w, h, x, y};
  };

  S.World.skyline = function (parent, o) {
    o = o || {};
    const rng = S.rng(((o.seed || 3) ^ 0x9e3779b9) >>> 0);
    const time = o.time || 'night';
    const g = S.g(parent, {class: 'ss-skyline'});
    const sky = time === 'day' ? '#7DD3FC' : time === 'dusk' ? '#C2410C' : '#0B1220';
    const sky2 = time === 'day' ? '#E0F2FE' : time === 'dusk' ? '#FDBA74' : '#1E293B';
    const id = S.uid('sky');
    const lg = S.svg('linearGradient', {id: id, x1: '0', y1: '0', x2: '0', y2: '1'}, S.ensureDefs());
    S.svg('stop', {offset: '0%', 'stop-color': sky}, lg);
    S.svg('stop', {offset: '100%', 'stop-color': sky2}, lg);
    S.svg('rect', {x: -900, y: -200, width: 6200, height: 1100, fill: 'url(#' + id + ')'}, g);
    if (time === 'night') {
      S.svg('circle', {cx: 380, cy: 110, r: 26, fill: '#F8FAFC', opacity: 0.9}, g);
      S.svg('circle', {cx: 392, cy: 104, r: 22, fill: sky, opacity: 0.35}, g);
    }
    if (time === 'dusk') S.svg('circle', {cx: 1500, cy: 180, r: 40, fill: '#FDE68A', opacity: 0.85}, g);
    let x = -400;
    while (x < 4600) {
      const bw = 36 + rng() * 80;
      const bh = 30 + rng() * (time === 'day' ? 90 : 170);
      S.svg('rect', {x: x, y: 600 - bh, width: bw, height: bh, fill: time === 'day' ? '#334155' : '#070B14', opacity: 0.95}, g);
      if (time !== 'day') {
        const dots = 2 + Math.floor(rng() * 5);
        for (let k = 0; k < dots; k++) S.svg('rect', {x: x + 6 + (k % 3) * 12, y: 600 - bh + 8 + Math.floor(k / 3) * 14, width: 5, height: 7, fill: '#FDE68A', opacity: 0.8}, g);
      }
      x += bw + 4 + rng() * 10;
    }
    S.svg('rect', {x: -900, y: 600, width: 6200, height: 36, fill: time === 'night' ? '#0B2530' : '#0284C7', opacity: 0.92}, g);
    S.svg('rect', {x: -900, y: 612, width: 6200, height: 2, fill: '#FFF', opacity: 0.2}, g);
    return g;
  };

  S.World.street = function (parent, o) {
    o = o || {};
    const g = S.g(parent, {class: 'ss-street'});
    const y = o.y || S.World.STREET.base;
    const w = o.w || 4600;
    const rng = S.rng((o.seed || 5) >>> 0);
    S.svg('rect', {x: -400, y: y - 16, width: w, height: 16, fill: '#C4C1B8'}, g);
    S.svg('rect', {x: -400, y: y - 5, width: w, height: 5, fill: '#6B7280'}, g);
    S.svg('rect', {x: -400, y: y, width: w, height: 250, fill: '#2A2E33'}, g);
    if (o.weather === 'rain') {
      S.svg('rect', {x: -400, y: y + 18, width: w, height: 10, fill: '#94A3B8', opacity: 0.22}, g);
      S.svg('ellipse', {cx: 640, cy: y + 70, rx: 54, ry: 8, fill: '#E2E8F0', opacity: 0.22}, g);
      S.svg('ellipse', {cx: 1280, cy: y + 150, rx: 90, ry: 10, fill: '#F8FAFC', opacity: 0.16}, g);
      S.svg('ellipse', {cx: 1760, cy: y + 90, rx: 40, ry: 6, fill: '#FDE68A', opacity: 0.18}, g);
    }
    S.svg('rect', {x: -400, y: y + 78, width: w, height: 4, fill: '#EAB308'}, g);
    S.svg('rect', {x: -400, y: y + 86, width: w, height: 4, fill: '#EAB308'}, g);
    for (let x = 0; x < w - 400; x += 48) {
      if (rng() < 0.14) continue;
      S.svg('rect', {x: x, y: y + 36, width: 26, height: 4, fill: '#F8FAFC', opacity: 0.8}, g);
      S.svg('rect', {x: x + 8, y: y + 150, width: 22, height: 4, fill: '#F8FAFC', opacity: 0.55}, g);
    }
    const cx = o.crossX || 1500;
    for (let i = 0; i < 7; i++) S.svg('rect', {x: cx + i * 20, y: y + 8, width: 10, height: 230, fill: '#F8FAFC', opacity: 0.88}, g);
    S.svg('rect', {x: -400, y: y + 248, width: w, height: 90, fill: '#B7B1A6'}, g);
    S.svg('rect', {x: -400, y: y + 246, width: w, height: 6, fill: '#F5F5F4'}, g);
    for (let x = 80; x < 3200; x += 340) lamp(g, x, y + 248);
    signal(g, (o.crossX || 1500) - 30, y + 248);
    S.svg('ellipse', {cx: 980, cy: y + 120, rx: 16, ry: 6, fill: '#111827', stroke: '#6B7280', 'stroke-width': 2}, g);
    hydrant(g, 430, y + 248);
    bench(g, 760, y + 248);
    trash(g, 1040, y + 248);
    box(g, 1680, y + 248);
    return g;
  };

  function lamp(g, x, base) {
    S.svg('rect', {x: x, y: base - 250, width: 7, height: 250, fill: '#1F2937', stroke: INK, 'stroke-width': 1.2}, g);
    S.svg('rect', {x: x - 18, y: base - 264, width: 44, height: 14, rx: 2, fill: '#111827', stroke: INK, 'stroke-width': 1.2}, g);
    S.svg('rect', {x: x - 12, y: base - 260, width: 32, height: 6, fill: '#FDE68A'}, g);
    S.path(g, 'M' + (x - 6) + ' ' + (base - 250) + ' L' + (x - 70) + ' ' + base + ' L' + (x + 86) + ' ' + base + ' L' + (x + 30) + ' ' + (base - 250) + ' Z', '#FDE68A', null, {opacity: 0.14});
  }
  function signal(g, x, base) {
    S.svg('rect', {x: x, y: base - 220, width: 6, height: 220, fill: '#111827', stroke: INK, 'stroke-width': 1}, g);
    S.svg('rect', {x: x - 12, y: base - 300, width: 30, height: 74, rx: 3, fill: '#0B0B0C', stroke: INK, 'stroke-width': 1.4}, g);
    const dim = ['#7F1D1D', '#854D0E', '#14532D'];
    const on = ['#EF4444', '#FACC15', '#22C55E'];
    const lamps = [];
    for (let i = 0; i < 3; i++) lamps.push(S.svg('circle', {cx: x + 3, cy: base - 282 + i * 22, r: 6, fill: dim[i]}, g));
    signals.push(lamps);
  }
  function hydrant(g, x, base) {
    S.svg('rect', {x: x, y: base - 28, width: 16, height: 28, rx: 2, fill: '#DC2626', stroke: INK, 'stroke-width': 1.3}, g);
    S.svg('rect', {x: x - 6, y: base - 22, width: 28, height: 6, fill: '#B91C1C', stroke: INK, 'stroke-width': 1}, g);
    S.svg('circle', {cx: x + 8, cy: base - 32, r: 5, fill: '#FECACA', stroke: INK, 'stroke-width': 1}, g);
  }
  function bench(g, x, base) {
    S.svg('rect', {x: x, y: base - 22, width: 70, height: 6, fill: '#92400E', stroke: INK, 'stroke-width': 1.2}, g);
    S.svg('rect', {x: x + 4, y: base - 22, width: 4, height: 22, fill: '#44403C'}, g);
    S.svg('rect', {x: x + 62, y: base - 22, width: 4, height: 22, fill: '#44403C'}, g);
    S.svg('rect', {x: x + 6, y: base - 40, width: 58, height: 16, fill: '#B45309', stroke: INK, 'stroke-width': 1.2}, g);
  }
  function trash(g, x, base) {
    S.svg('path', {d: 'M' + x + ' ' + base + ' L' + (x + 6) + ' ' + (base - 32) + ' L' + (x + 28) + ' ' + (base - 32) + ' L' + (x + 34) + ' ' + base + ' Z', fill: '#166534', stroke: INK, 'stroke-width': 1.3}, g);
    S.svg('rect', {x: x + 4, y: base - 38, width: 26, height: 6, fill: '#14532D', stroke: INK, 'stroke-width': 1}, g);
  }
  function box(g, x, base) {
    S.svg('rect', {x: x, y: base - 36, width: 28, height: 36, fill: '#1E3A8A', stroke: INK, 'stroke-width': 1.3}, g);
    S.svg('rect', {x: x, y: base - 36, width: 28, height: 8, fill: '#F8FAFC'}, g);
    const t = S.svg('text', {x: x + 14, y: base - 14, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 7, fill: '#F8FAFC'}, g);
    t.textContent = 'NEWS';
  }

  function wheel(parent, cx, cy, r) {
    S.svg('circle', {cx: cx, cy: cy, r: r + 2, fill: '#111', stroke: INK, 'stroke-width': 1.6}, parent);
    const spin = S.g(parent, {});
    S.svg('circle', {cx: cx, cy: cy, r: r, fill: '#27272A', stroke: INK, 'stroke-width': 1.5}, spin);
    S.svg('circle', {cx: cx, cy: cy, r: r * 0.62, fill: '#E4E4E7', stroke: INK, 'stroke-width': 1.2}, spin);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      S.line(spin, 'M' + cx + ' ' + cy + ' L' + (cx + Math.cos(a) * r * 0.78).toFixed(1) + ' ' + (cy + Math.sin(a) * r * 0.78).toFixed(1), 1.4, INK);
    }
    S.svg('circle', {cx: cx, cy: cy, r: Math.max(2, r * 0.16), fill: INK}, spin);
    return {g: spin, cx: cx, cy: cy, r: r};
  }
  function shadow(g, rx) {
    S.svg('ellipse', {cx: 0, cy: 6, rx: rx, ry: 7, fill: '#000', opacity: 0.28}, g);
  }

  function paintCar(g, brand, o) {
    // side view, nose toward +x. Read order front to back: headlight, long hood, raked windshield, cabin, short trunk.
    shadow(g, 112);
    S.path(g, 'M-120,-18 L-120,-46 C-118,-54 -110,-58 -98,-58 L-80,-58 C-70,-80 -54,-90 -30,-90 L8,-90 C26,-90 40,-80 60,-62 L106,-56 C118,-54 124,-46 124,-36 L124,-18 Z', brand.primary, 2.4);
    S.path(g, 'M-72,-60 C-64,-78 -50,-84 -34,-84 L-22,-84 L-22,-61 Z', '#9FB8C9', 1.5);
    S.path(g, 'M-15,-84 L6,-84 C20,-84 32,-77 46,-63 L-15,-61 Z', '#B8D4E6', 1.5);
    S.path(g, 'M-12,-82 L-2,-82 L-14,-64 Z', '#FFFFFF', null, {opacity: 0.55});
    S.path(g, 'M-116,-34 L120,-34 L121,-28 L-116,-28 Z', brand.accent, null);
    S.path(g, 'M-18,-60 L-18,-20', 'none', null, {stroke: INK, 'stroke-width': 1.4, opacity: 0.6});
    S.path(g, 'M2,-50 L14,-50', 'none', null, {stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'});
    S.path(g, 'M110,-52 L124,-48 L124,-40 L108,-42 Z', '#FFF6D6', 1.2);   // headlight (front)
    const beam = S.path(g, 'M124,-46 L260,-30 L260,-6 L124,-38 Z', '#FFF2C4', null, {opacity: 0.16});
    const brake = S.path(g, 'M-121,-52 L-113,-52 L-113,-40 L-121,-40 Z', '#DC2626', 1.2);   // tail light (rear)
    S.path(g, 'M-124,-18 L128,-18 L128,-10 L-124,-10 Z', '#1F2937', 1.3);
    S.svg('rect', {x: 116, y: -30, width: 10, height: 8, rx: 2, fill: '#E5E7EB', stroke: INK, 'stroke-width': 1}, g);
    const label = S.svg('text', {x: -46, y: -40, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 11, fill: brand.trim}, g);
    label.textContent = (o && o.word != null) ? o.word : (brand.short || brand.name);
    const wheels = [wheel(g, -78, -8, 17), wheel(g, 80, -8, 17)];
    return {wheels: wheels, brake: brake, beam: beam, wheelR: 17};
  }

  const BUILD = {
    car: paintCar,
    taxi(g, brand) {
      const built = paintCar(g, brand, {word: ''});
      S.svg('rect', {x: -16, y: -104, width: 32, height: 16, rx: 2, fill: brand.accent, stroke: INK, 'stroke-width': 1.4}, g);
      const t = S.svg('text', {x: 0, y: -92, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 8, fill: brand.primary}, g);
      t.textContent = brand.short || 'TAXI';
      S.path(g, 'M-70,-46 L70,-46 L70,-40 L-70,-40 Z', '#111827', null);
      return built;
    },
    police(g, brand) {
      const built = paintCar(g, brand, {word: 'PD'});
      S.svg('rect', {x: -36, y: -100, width: 72, height: 12, rx: 3, fill: '#0B0B0C', stroke: INK, 'stroke-width': 1.3}, g);
      built.red = S.svg('rect', {x: -30, y: -98, width: 28, height: 8, rx: 2, fill: '#DC2626'}, g);
      built.blue = S.svg('rect', {x: 2, y: -98, width: 28, height: 8, rx: 2, fill: '#2563EB'}, g);
      return built;
    },
    van(g, brand) {
      shadow(g, 120);
      S.path(g, 'M-120,-18 L-120,-78 L20,-84 L78,-70 L96,-40 L100,-18 Z', brand.primary, 2.2);
      S.path(g, 'M-108,-70 L8,-74 L8,-40 L-108,-36 Z', '#0F172A', 1.4);
      S.path(g, 'M18,-76 L70,-66 L74,-42 L18,-44 Z', '#0F172A', 1.3);
      S.path(g, 'M-110,-32 L92,-32 L94,-24 L-108,-24 Z', brand.accent, null);
      const brake = S.path(g, 'M-124,-40 L-112,-38 L-112,-26 L-124,-28 Z', '#DC2626', 1.2);
      const label = S.svg('text', {x: -46, y: -48, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 12, fill: brand.trim}, g);
      label.textContent = brand.name;
      return {wheels: [wheel(g, -78, -8, 17), wheel(g, 64, -8, 17)], brake: brake, wheelR: 17};
    },
    truck(g, brand) {
      shadow(g, 150);
      S.path(g, 'M-150,-20 L-150,-78 L-20,-78 L-20,-20 Z', brand.primary, 2.2);
      S.path(g, 'M-16,-20 L-16,-70 L70,-62 L92,-36 L96,-20 Z', '#1F2937', 2);
      S.path(g, 'M-4,-60 L60,-54 L68,-40 L-4,-42 Z', '#7DD3FC', 1.3);
      S.path(g, 'M-140,-48 L-30,-48 L-30,-40 L-140,-40 Z', brand.accent, null);
      const label = S.svg('text', {x: -85, y: -58, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 13, fill: brand.trim}, g);
      label.textContent = brand.name;
      const tag = S.svg('text', {x: -85, y: -30, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 8, fill: brand.accent}, g);
      tag.textContent = brand.tag || '';
      const brake = S.path(g, 'M-156,-40 L-146,-38 L-146,-26 L-156,-28 Z', '#DC2626', 1.2);
      return {wheels: [wheel(g, -110, -8, 18), wheel(g, -48, -8, 18), wheel(g, 62, -8, 18)], brake: brake, wheelR: 18};
    },
    jet(g, brand) {
      S.path(g, 'M14,-9 L-30,-34 L-46,-34 L-20,-9 Z', brand.primary, 1.6);                              // far wing, swept back
      S.path(g, 'M-122,-4 L-74,-10 L60,-12 C92,-12 112,-8 126,0 C112,7 92,9 60,9 L-74,7 Z', '#F3F4F6', 2);   // fuselage, nose +x
      S.path(g, 'M-116,-6 L-100,-40 L-84,-40 L-76,-9 Z', brand.primary, 1.6);                           // tail fin (rear)
      S.path(g, 'M-112,0 L-92,-2 L-92,4 Z', brand.primary, 1.2);
      S.path(g, 'M-60,-1 L60,-3 L60,2 L-60,3 Z', brand.accent, null);
      for (let i = 0; i < 9; i++) S.svg('circle', {cx: -50 + i * 13, cy: -5, r: 2.2, fill: '#1E3A8A'}, g);
      S.path(g, 'M98,-8 L112,-5 L106,-2 L96,-3 Z', '#1E3A8A', 1);                                      // cockpit
      S.path(g, 'M22,3 L-34,32 L-54,32 L-14,3 Z', brand.primary, 1.6);                                  // near wing, swept back
      S.svg('rect', {x: -18, y: 10, width: 36, height: 12, rx: 6, fill: '#D1D5DB', stroke: INK, 'stroke-width': 1.3}, g);   // engine
      const spin = S.g(g, {});
      S.svg('ellipse', {cx: 18, cy: 16, rx: 3, ry: 6, fill: '#111827', stroke: INK, 'stroke-width': 1}, spin);
      S.line(spin, 'M18 10 L18 22', 1.4, '#9CA3AF');
      const word = S.svg('text', {x: -10, y: 6, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 8, fill: brand.primary}, g);
      word.textContent = brand.name;
      const blink = S.svg('circle', {cx: -40, cy: 31, r: 2.6, fill: '#EF4444'}, g);
      return {wheels: [], spin: spin, spinCx: 18, spinCy: 16, spinFlat: true, blink: blink, wheelR: 20};
    },
    ship(g, brand) {
      // cargo ship, bow toward +x: deck wider than the keel, raked bow, bridge and funnel at the stern
      S.path(g, 'M-140,-20 L132,-20 L152,-30 L124,12 L-128,12 Z', brand.primary, 2.2);
      S.path(g, 'M-136,-4 L140,-4', 'none', null, {stroke: brand.accent, 'stroke-width': 3});
      const cols = [brand.accent, '#2563EB', '#DC2626', '#E5E7EB', '#16A34A', brand.accent];
      for (let i = 0; i < 6; i++) S.svg('rect', {x: -48 + i * 26, y: -40, width: 24, height: 20, fill: cols[i], stroke: INK, 'stroke-width': 1}, g);
      for (let i = 0; i < 4; i++) S.svg('rect', {x: -36 + i * 26, y: -58, width: 24, height: 18, fill: cols[(i + 3) % 6], stroke: INK, 'stroke-width': 1}, g);
      S.path(g, 'M-124,-20 L-124,-70 L-76,-70 L-76,-20 Z', '#E5E7EB', 1.8);
      for (let i = 0; i < 3; i++) S.svg('rect', {x: -118 + i * 14, y: -64, width: 10, height: 8, fill: '#FDE68A'}, g);
      S.path(g, 'M-112,-70 L-108,-92 L-92,-92 L-90,-70 Z', brand.accent, 1.4);
      const word = S.svg('text', {x: 40, y: 6, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 12, fill: brand.trim}, g);
      word.textContent = brand.name;
      const wake = S.path(g, 'M152,12 C110,20 40,8 -20,16', 'none', null, {stroke: '#FFF', 'stroke-width': 2, opacity: 0.45});
      return {wheels: [], wake: wake, bob: true, wheelR: 24};
    }
  };

  S.World.vehicle = function (parent, o) {
    o = o || {};
    const kind = BUILD[o.kind] ? o.kind : 'car';
    const brand = o.brand || {name: 'NORTHLINE', short: 'NL', primary: '#0B1F33', accent: '#F5C542', trim: '#F8FAFC'};
    const root = S.g(parent, {class: 'ss-veh ss-veh-' + kind});
    const art = S.g(root, {});
    const built = BUILD[kind](art, brand, o);
    const veh = {
      root: root, art: art, kind: kind, wheels: built.wheels || [], brake: built.brake || null,
      red: built.red || null, blue: built.blue || null, spin: built.spin || null, spinCx: built.spinCx || 0, spinCy: built.spinCy || 0,
      wheelR: built.wheelR || 16, scale: o.scale || 1, facing: o.facing || 1, beam: built.beam || null, blink: built.blink || null, bob: !!built.bob, spinFlat: !!built.spinFlat,
      p: {x: o.x || 0, y: o.y || 0}, fromX: o.x || 0, toX: o.x || 0
    };
    movers.push(veh);
    root.setAttribute('transform', 'translate(' + veh.p.x + ' ' + veh.p.y + ') scale(' + (veh.facing * veh.scale) + ' ' + veh.scale + ')');
    return veh;
  };

  // Drive along x. The position is ANALYTIC (fromX + span * ease(u)), so its velocity and acceleration are known every
  // frame: wheels roll exactly the distance travelled (angle = s / (r * scale)), the body pitches nose-up while it
  // accelerates and dips while it brakes (with a little squash), and the brake light follows deceleration.
  // facing is always the direction of travel unless a spec forces it.
  S.World.drive = function (tl, veh, o) {
    o = o || {};
    const fromX = o.fromX != null ? o.fromX : veh.p.x;
    const toX = o.toX != null ? o.toX : fromX;
    const fromY = o.fromY != null ? o.fromY : veh.p.y;
    const toY = o.toY != null ? o.toY : fromY;
    veh.p.x = fromX;
    veh.p.y = fromY;
    veh.fromX = fromX;
    veh.toX = toX;
    veh.facing = toX !== fromX ? (toX < fromX ? -1 : 1) : (o.facing || veh.facing || 1);
    if (o.facing && toX !== fromX && o.facing !== veh.facing) console.warn('vehicle facing ' + o.facing + ' disagrees with travel; using travel direction');
    const ease = window.gsap ? gsap.parseEase(o.ease || 'none') : (u) => u;
    veh.move = (o.t != null && (fromX !== toX || fromY !== toY)) ? {t0: o.t, dur: o.dur || 2, fromX, toX, fromY, toY, ease} : null;
    if (tl && veh.move) tl.set({}, {}, o.t + (o.dur || 2));   // keep the timeline long enough
    return veh;
  };
  function posAt(m, t) {
    if (!m.move) return [m.p.x, m.p.y];
    const v = m.move, u = Math.max(0, Math.min(1, (t - v.t0) / v.dur)), e = v.ease(u);
    return [v.fromX + (v.toX - v.fromX) * e, v.fromY + (v.toY - v.fromY) * e];
  }

  S.World.city = function (groups, opts) {
    opts = opts || {};
    const time = opts.time || 'night';
    const brands = opts.brands || {};
    S.World.skyline(groups[0], {seed: opts.seed || 3, time: time});
    const plots = opts.plots && opts.plots.length ? opts.plots : [
      {x: 40, kind: 'shop', w: 200, brand: 'redcab', sign: 'REDCAB'},
      {x: 260, kind: 'apartment', w: 220, floors: 7, brand: 'harbor', sign: 'HARBOR HOUSE'},
      {x: 500, kind: 'bank', w: 240, floors: 5, brand: 'lumen', sign: 'LUMEN BANK'},
      {x: 760, kind: 'office', w: 200, floors: 8, brand: 'northline', sign: 'NORTHLINE'},
      {x: 980, kind: 'hq', w: 280, floors: 14, brand: 'northline', sign: 'NORTHLINE'},
      {x: 1280, kind: 'factory', w: 250, floors: 4, brand: 'kiln', sign: 'KILN FREIGHT'}
    ];
    plots.forEach((p, i) => {
      const brand = S.Brand.get(brands, p.brand);
      S.World.facade(groups[1], {x: (p.x || 0) - 30, y: 704, w: Math.round((p.w || 180) * 0.84), floors: Math.max(3, (p.floors || 5) - 2), kind: p.kind, brand: brand, sign: p.sign, time: time, seed: (opts.seed || 1) * 17 + i, far: true});
      S.World.facade(groups[2], {x: p.x, y: S.World.STREET.base, w: p.w, floors: p.floors, kind: p.kind, brand: brand, sign: p.sign, time: time, seed: (opts.seed || 1) * 31 + i});
    });
    S.World.street(groups[2], {y: S.World.STREET.base, seed: opts.seed || 5, weather: opts.weather, crossX: opts.crossX || 1120});
    const fg = groups[4];
    lamp(fg, 180, 1008);
    S.svg('rect', {x: 80, y: 760, width: 36, height: 320, fill: '#0B0B0C', opacity: 0.78}, fg);
    S.svg('rect', {x: 2100, y: 820, width: 420, height: 70, rx: 8, fill: '#111827', opacity: 0.55}, fg);
    return {plots: plots};
  };

  S.onApply((t) => {
    for (let i = 0; i < movers.length; i++) {
      const m = movers[i];
      const P = posAt(m, t), x = P[0], y = P[1], h = 1 / 120;
      m.p.x = x; m.p.y = y;
      // local (art-frame) kinematics: forward is +x in the art, so multiply by facing; divide by scale for art units
      const xa = posAt(m, t - h)[0], xb = posAt(m, t + h)[0];
      const vel = (xb - xa) / (2 * h) * m.facing / m.scale, acc = (xb - 2 * x + xa) / (h * h) * m.facing / m.scale;
      const pitch = m.wheels.length ? S.clamp(-acc * 0.011, -2.6, 2.6) : 0;           // nose up on accel, dips on brake
      const squash = m.wheels.length ? S.clamp(Math.abs(acc) * 0.00012, 0, 0.03) : 0;
      let bob = 0, roll = 0;
      if (m.bob) { bob = Math.sin(t * 1.6 + m.fromX) * 2.2; roll = Math.sin(t * 1.1 + m.fromX * 0.3) * 0.9; }
      else if (m.wheels.length && Math.abs(vel) > 1) bob = Math.sin(t * 22 + m.fromX) * 0.6;   // road buzz while rolling
      m.root.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + (y + bob).toFixed(2) + ') scale(' + (m.facing * m.scale).toFixed(3) + ' ' + m.scale.toFixed(3) + ')');
      m.art.setAttribute('transform', 'rotate(' + (pitch + roll).toFixed(3) + ' ' + (pitch > 0 ? 80 : -78) + ' -8) translate(0 ' + (-squash * 60).toFixed(2) + ') scale(1 ' + (1 - squash).toFixed(4) + ')');
      // rolling without sliding: arc length / radius, in the art frame, so a mirrored car still rolls forward
      const dist = (x - m.fromX) * m.facing / m.scale;
      const deg = (dist / m.wheelR) * (180 / Math.PI);
      for (let w = 0; w < m.wheels.length; w++) {
        const wh = m.wheels[w];
        wh.g.setAttribute('transform', 'rotate(' + deg.toFixed(2) + ' ' + wh.cx + ' ' + wh.cy + ')');
      }
      if (m.brake) {
        const braking = (acc < -30 && m.move && (t - m.move.t0) > m.move.dur * 0.45) || (m.move && t >= m.move.t0 + m.move.dur && t < m.move.t0 + m.move.dur + 1.2);
        m.brake.setAttribute('opacity', braking ? '1' : '0.35');
        m.brake.setAttribute('fill', braking ? '#FF3B30' : '#991B1B');
      }
      if (m.red && m.blue) {
        const flash = Math.floor(t * 6) % 2 === 0;
        m.red.setAttribute('opacity', flash ? '1' : '0.25');
        m.blue.setAttribute('opacity', flash ? '0.25' : '1');
      }
      if (m.spin) {
        if (m.spinFlat) m.spin.setAttribute('transform', 'translate(' + m.spinCx + ' ' + m.spinCy + ') scale(1 ' + Math.cos(t * 40).toFixed(3) + ') translate(' + (-m.spinCx) + ' ' + (-m.spinCy) + ')');
        else m.spin.setAttribute('transform', 'rotate(' + ((t * 640) % 360).toFixed(2) + ' ' + m.spinCx + ' ' + m.spinCy + ')');
      }
      if (m.blink) m.blink.setAttribute('opacity', (t % 1.2) < 0.12 ? '1' : '0.2');
      if (m.textFacing !== m.facing) {   // lettering always reads left-to-right, even on a vehicle driving left
        m.art.querySelectorAll('text').forEach((tx) => {
          const cx = +tx.getAttribute('x') || 0;
          if (m.facing < 0) tx.setAttribute('transform', 'translate(' + cx + ' 0) scale(-1 1) translate(' + (-cx) + ' 0)');
          else tx.removeAttribute('transform');
        });
        m.textFacing = m.facing;
      }
    }
    const phase = Math.floor(t / 1.7) % 3;
    const active = phase === 0 ? 0 : phase === 1 ? 2 : 1;
    const dim = ['#7F1D1D', '#854D0E', '#14532D'];
    const on = ['#EF4444', '#FACC15', '#22C55E'];
    for (let s = 0; s < signals.length; s++) {
      const lamps = signals[s];
      for (let i = 0; i < lamps.length; i++) lamps[i].setAttribute('fill', i === active ? on[i] : dim[i]);
    }
    for (let s = 0; s < smokes.length; s++) {
      const pack = smokes[s];
      for (let i = 0; i < pack.puffs.length; i++) {
        const p = pack.puffs[i];
        const u = (t * 0.18 + p.ph) % 1;
        p.c.setAttribute('cy', (pack.top - u * 46).toFixed(1));
        p.c.setAttribute('opacity', (0.4 * (1 - u)).toFixed(2));
        p.c.setAttribute('r', (6 + u * 12).toFixed(1));
      }
    }
  }, 16);
})(window.Studio = window.Studio || {});
