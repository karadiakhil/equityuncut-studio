/* Hero props: multi-layer studio drawings with animated sub-parts. Each builder returns
 * {g, parts, animate(tl, start, end, opts)}; pivot is bottom-centre (0, 0) unless noted. All motion is finite and seeded.
 * Usage: const mug = Studio.Props.mug(layerSvg, {x: 400, y: 600, scale: 1}); mug.animate(tl, 0, 12);
 */
(function (S) {
  'use strict';
  const C = S.PALETTE, P = S.Props = {};
  const W = S.LINE.prop;
  function host(parent, o, name) {
    const g = S.g(parent, {class: 'ss-prop ss-prop-' + name, id: o.id || null, 'data-layout-ignore': '', transform: `translate(${o.x || 0} ${o.y || 0}) scale(${o.scale || 1})`});   // set dressing: decorative text
    const body = S.g(g); if (o.paper !== false) S.paper(body, o.paperOpts);
    return {g, body};
  }
  const pth = (g, d, fill, w, extra) => S.path(g, d, fill, w == null ? W : w, extra);
  function cres(g, d, base, shade, dx, dy) { const defs = S.ensureDefs(); return S.crescent(g, defs, d, base, shade, dx || 6, dy || 4, W); }
  // seeded flicker keyframes on a property, finite
  function flicker(tl, target, prop, lo, hi, start, end, seed, step) {
    const r = S.rng(seed); step = step || 0.08;
    for (let t = start; t < end - 1e-6; t += step) tl.to(target, {[prop]: lo + (hi - lo) * r(), duration: step, ease: 'sine.inOut'}, t);
  }
  P.flicker = flicker;

  // 1. steaming coffee mug ------------------------------------------------------------------------------------------
  P.mug = function (parent, o) {
    o = o || {}; const {g, body} = host(parent, o, 'mug');
    pth(body, 'M27 -62 C50 -62 52 -22 26 -20 L26 -31 C39 -31 40 -51 27 -51 Z', C.paper);
    const cup = 'M-28 -76 L28 -76 L25 -7 C24 -2 20 0 15 0 L-15 0 C-20 0 -24 -2 -25 -7 Z';
    cres(body, cup, C.paper, C.creamDeep, 7, 3);
    const cid = S.uid('mug'); S.path(S.svg('clipPath', {id: cid}, S.ensureDefs()), cup);
    const band = S.g(body, {'clip-path': `url(#${cid})`});
    S.svg('rect', {x: -40, y: -50, width: 80, height: 11, fill: o.band || C.crimson}, band);
    S.path(body, cup, 'none', W);
    S.svg('ellipse', {cx: 0, cy: -75, rx: 27, ry: 5.5, fill: C.walnutDeep, stroke: S.INK, 'stroke-width': W}, body);
    S.svg('ellipse', {cx: -6, cy: -76, rx: 9, ry: 1.6, fill: '#A0623C', opacity: 0.8}, body);
    S.line(body, 'M-20 -66 L-18 -16', S.LINE.micro, '#FFFFFF', {opacity: 0.9, 'stroke-width': 3});
    const steam = S.g(g, {class: 'steam'}); const wisps = [];
    [[-10, 0.0], [3, 0.55], [14, 1.1]].forEach(([x, ph], i) => {
      const w = S.g(steam, {transform: `translate(${x} -84)`});
      const p = S.path(w, 'M0 0 C-9 -12 9 -25 0 -37 C-9 -49 7 -60 0 -72', 'none', null, {stroke: '#FFFFFF', 'stroke-width': 5.5 - i, 'stroke-linecap': 'round', opacity: 0});
      wisps.push({p, ph});
    });
    return {g, parts: {steam, wisps}, animate(tl, start, end) {
      const cyc = 1.8;
      wisps.forEach(({p, ph}) => {
        const n = Math.max(1, Math.floor((end - start - ph) / cyc));
        tl.fromTo(p, {y: 6, opacity: 0, scaleX: 0.8, transformOrigin: '50% 100%'}, {keyframes: [{opacity: 0.85, y: -8, scaleX: 1.05, duration: cyc * 0.45, ease: 'sine.out'}, {opacity: 0, y: -26, scaleX: 0.75, duration: cyc * 0.55, ease: 'sine.in'}], repeat: n - 1}, start + ph);
      });
    }};
  };

  // 2. banker's lamp with warm glow ----------------------------------------------------------------------------------
  P.bankersLamp = function (parent, o) {
    o = o || {}; const {g, body} = host(parent, o, 'lamp');
    const glowId = S.uid('glow'); const rg = S.svg('radialGradient', {id: glowId}, S.ensureDefs());
    S.svg('stop', {offset: 0, 'stop-color': '#FFE9A8', 'stop-opacity': 0.85}, rg); S.svg('stop', {offset: 1, 'stop-color': '#FFD36B', 'stop-opacity': 0}, rg);
    const glow = S.svg('ellipse', {cx: 0, cy: -60, rx: 150, ry: 90, fill: `url(#${glowId})`, opacity: 0.9}, g);
    g.insertBefore(glow, body);
    const cone = S.path(g, 'M-62 -128 L62 -128 L120 0 L-120 0 Z', '#FFE7A0', null, {opacity: 0.28}); g.insertBefore(cone, body);
    cres(body, 'M-46 -8 C-46 -20 46 -20 46 -8 L46 -3 C46 2 -46 2 -46 -3 Z', '#D4A537', '#9C7420', 4, 2);
    pth(body, 'M-6 -16 L-5 -120 L5 -120 L6 -16 Z', '#C99A2E');
    pth(body, 'M-4 -118 C-4 -140 30 -140 30 -128', 'none', null, {stroke: S.INK, 'stroke-width': 7});
    pth(body, 'M-4 -118 C-4 -140 30 -140 30 -128', 'none', null, {stroke: '#D4A537', 'stroke-width': 3});
    const shade = 'M-70 -128 C-70 -156 -48 -166 0 -166 C48 -166 70 -156 70 -128 Z';
    cres(body, shade, '#0F7A52', '#064E36', 8, 5);
    S.line(body, 'M-56 -150 C-36 -160 -6 -162 18 -160', S.LINE.micro, '#6EE7B7', {'stroke-width': 3.5, opacity: 0.8});
    pth(body, 'M-72 -131 L72 -131 L72 -125 L-72 -125 Z', '#D4A537');
    S.line(body, 'M44 -125 L44 -100', S.LINE.micro, '#8A6A1A', {'stroke-width': 1.6, 'stroke-dasharray': '2 2.5'});
    S.svg('circle', {cx: 44, cy: -97, r: 3.2, fill: '#D4A537', stroke: S.INK, 'stroke-width': 1.2}, body);
    const bulb = S.svg('ellipse', {cx: 0, cy: -124, rx: 26, ry: 4, fill: '#FFF7D6', opacity: 0.95}, g);
    return {g, parts: {glow, cone, bulb}, animate(tl, start, end) { flicker(tl, glow, 'opacity', 0.72, 0.98, start, end, 41, 0.12); flicker(tl, cone, 'opacity', 0.2, 0.32, start, end, 42, 0.12); }};
  };

  // 3. heavy steel vault door (pivot: centre) -------------------------------------------------------------------------
  P.vaultDoor = function (parent, o) {
    o = o || {}; const {g, body} = host(parent, o, 'vault');
    pth(body, 'M-150 -60 L-128 -60 L-128 60 L-150 60 Z', C.slate);
    [[-139, -40], [-139, 40]].forEach(([x, y]) => pth(body, `M${x - 14} ${y - 10} L${x + 14} ${y - 10} L${x + 14} ${y + 10} L${x - 14} ${y + 10} Z`, C.slateLight, S.LINE.mid));
    cres(body, 'M0 -132 A132 132 0 1 1 -0.1 -132 Z', C.slateLight, C.slate, 9, 7);
    cres(body, 'M0 -112 A112 112 0 1 1 -0.1 -112 Z', C.steel, '#9AA5B4', 7, 6);
    const tex = S.svg('image', {href: S.Textures.url('brushed-metal'), x: -112, y: -112, width: 224, height: 224, opacity: 0.35, preserveAspectRatio: 'xMidYMid slice'}, body);
    const tc = S.uid('vt'); S.path(S.svg('clipPath', {id: tc}, S.ensureDefs()), 'M0 -110 A110 110 0 1 1 -0.1 -110 Z'); tex.setAttribute('clip-path', `url(#${tc})`);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; S.svg('circle', {cx: (Math.cos(a) * 98).toFixed(1), cy: (Math.sin(a) * 98).toFixed(1), r: 6, fill: C.slateLight, stroke: S.INK, 'stroke-width': S.LINE.mid}, body); }
    S.svg('circle', {cx: 0, cy: 0, r: 66, fill: 'none', stroke: S.INK, 'stroke-width': S.LINE.mid}, body);
    S.svg('circle', {cx: 0, cy: 0, r: 60, fill: '#AEB8C6', stroke: S.INK, 'stroke-width': S.LINE.micro, opacity: 0.6}, body);
    const dial = S.g(body, {transform: 'translate(0 -82)'});
    S.svg('circle', {cx: 0, cy: 0, r: 13, fill: C.charcoal, stroke: S.INK, 'stroke-width': S.LINE.mid}, dial);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; S.line(dial, `M${Math.cos(a) * 8} ${Math.sin(a) * 8} L${Math.cos(a) * 11} ${Math.sin(a) * 11}`, 1, '#E5E7EB'); }
    const wheel = S.g(body);
    for (let i = 0; i < 3; i++) { const a = i * 60; const sp = S.g(wheel, {transform: `rotate(${a})`});
      pth(sp, 'M-54 -5 L54 -5 L54 5 L-54 5 Z', '#D1D8E2', S.LINE.mid);
      S.svg('circle', {cx: -56, cy: 0, r: 8, fill: '#E5E7EB', stroke: S.INK, 'stroke-width': S.LINE.mid}, sp); S.svg('circle', {cx: 56, cy: 0, r: 8, fill: '#E5E7EB', stroke: S.INK, 'stroke-width': S.LINE.mid}, sp); }
    S.svg('circle', {cx: 0, cy: 0, r: 18, fill: '#E5E7EB', stroke: S.INK, 'stroke-width': W}, wheel);
    S.svg('circle', {cx: -5, cy: -5, r: 5, fill: '#FFFFFF', opacity: 0.8}, wheel);
    return {g, parts: {wheel}, animate(tl, start, end, op) { tl.fromTo(wheel, {rotation: 0, svgOrigin: '0 0'}, {rotation: (op && op.turns || 1) * 360, duration: end - start, ease: 'power2.inOut'}, start); }};
  };

  // 4. cash stack (fluttering top bill) -----------------------------------------------------------------------------------
  P.cashStack = function (parent, o) {
    o = o || {}; const {g, body} = host(parent, o, 'cash'); const r = S.rng(o.seed || 5);
    const rows = o.rows || 5, cols = o.cols || 1, bw = 150, bh = 20;
    for (let c = 0; c < cols; c++) for (let i = 0; i < rows; i++) {
      const x = (c - (cols - 1) / 2) * (bw + 8) - bw / 2 + (r() - 0.5) * 8, y = -(i + 1) * bh;
      const d = `M${x + 4} ${y} L${x + bw - 4} ${y} Q${x + bw} ${y} ${x + bw} ${y + 4} L${x + bw} ${y + bh - 4} Q${x + bw} ${y + bh} ${x + bw - 4} ${y + bh} L${x + 4} ${y + bh} Q${x} ${y + bh} ${x} ${y + bh - 4} L${x} ${y + 4} Q${x} ${y} ${x + 4} ${y} Z`;
      cres(body, d, '#8FD19E', '#4E9E62', 4, 3);
      for (let k = 1; k < 4; k++) S.line(body, `M${x + 6} ${y + k * 5} L${x + bw - 6} ${y + k * 5}`, 0.8, '#3F7F4F', {opacity: 0.55});
      pth(body, `M${x + bw / 2 - 16} ${y - 1} L${x + bw / 2 + 16} ${y - 1} L${x + bw / 2 + 16} ${y + bh + 1} L${x + bw / 2 - 16} ${y + bh + 1} Z`, C.mustard, S.LINE.mid);
      S.line(body, `M${x + bw / 2 - 10} ${y + bh / 2} L${x + bw / 2 + 10} ${y + bh / 2}`, S.LINE.micro, C.mustardDeep);
    }
    const topY = -(rows) * bh;
    const bill = S.g(g, {class: 'bill'});
    const bd = `M-70 ${topY - 6} L70 ${topY - 9} L72 ${topY + 6} L-68 ${topY + 9} Z`;
    pth(bill, bd, '#A7E3B4'); S.svg('ellipse', {cx: 0, cy: topY, rx: 14, ry: 6, fill: 'none', stroke: '#2F6B3F', 'stroke-width': 1.6}, bill);
    S.svg('text', {x: -58, y: topY + 4, 'font-family': 'Archivo Black', 'font-size': 10, fill: '#2F6B3F'}, bill).textContent = '100';
    S.svg('text', {x: 40, y: topY + 3, 'font-family': 'Archivo Black', 'font-size': 10, fill: '#2F6B3F'}, bill).textContent = '100';
    return {g, parts: {bill, topY}, animate(tl, start, end) {
      const cyc = 0.5, n = Math.max(1, Math.floor((end - start) / cyc));
      tl.fromTo(bill, {rotation: -2, svgOrigin: `-70 ${topY}`}, {rotation: 5, duration: cyc / 2, repeat: n * 2 - 1, yoyo: true, ease: 'sine.inOut'}, start);
    }};
  };

  // 5. burning paper airplane (pivot: centre) ----------------------------------------------------------------------------
  P.paperAirplane = function (parent, o) {
    o = o || {}; const {g, body} = host(parent, o, 'plane');
    const smoke = S.g(g); g.insertBefore(smoke, body);
    pth(body, 'M-62 4 L74 -12 L-36 20 Z', C.creamDeep);
    pth(body, 'M-62 4 L74 -12 L-48 -22 Z', C.paper);
    pth(body, 'M-62 4 L74 -12 L-30 6 Z', '#EFE6D3', S.LINE.mid);
    S.line(body, 'M-48 -22 L-20 -4', S.LINE.micro, null, {opacity: 0.6});
    pth(body, 'M-62 4 L-54 -6 L-58 -10 L-50 -16 L-48 -22 L-60 -14 L-66 -6 Z', '#3B2A22', S.LINE.micro);
    const flame = S.g(g, {transform: 'translate(-64 -2)'});
    const fl = [['M0 0 C-14 -6 -30 -2 -44 -16 C-36 -2 -40 4 -52 6 C-36 12 -18 12 0 6 Z', C.crimson],
      ['M0 0 C-10 -4 -22 -2 -32 -10 C-26 0 -30 4 -38 6 C-26 9 -12 9 0 5 Z', C.amber], ['M0 1 C-6 -1 -12 0 -18 -4 C-15 1 -17 3 -21 4 C-14 6 -6 6 0 4 Z', C.gold]];
    const flames = fl.map(([d, c]) => S.path(flame, d, c, S.LINE.micro));
    if (window.gsap) flames.forEach((f) => gsap.set(f, {svgOrigin: '0 2'}));
    const puffs = [];
    for (let i = 0; i < 5; i++) puffs.push(S.svg('circle', {cx: -80, cy: -6, r: 9, fill: '#6B7280', opacity: 0}, smoke));
    return {g, parts: {flame, flames, puffs}, animate(tl, start, end) {
      flames.forEach((f, i) => flicker(tl, f, 'scaleX', 0.82, 1.18, start, end, 60 + i, 0.07));
      flames.forEach((f, i) => flicker(tl, f, 'scaleY', 0.8, 1.2, start, end, 70 + i, 0.06));
      const cyc = 1.2;
      puffs.forEach((p, i) => { const ph = i * cyc / puffs.length; const n = Math.max(1, Math.floor((end - start - ph) / cyc));
        tl.fromTo(p, {attr: {cx: -78, cy: -8, r: 6}, opacity: 0.55}, {attr: {cx: -118 - i * 3, cy: -70 - i * 4, r: 22}, opacity: 0, duration: cyc, ease: 'sine.out', repeat: n - 1}, start + ph); });
    }};
  };

  // 6. ledger (open book) --------------------------------------------------------------------------------------------------
  P.ledger = function (parent, o) {
    o = o || {}; const {g, body} = host(parent, o, 'ledger');
    pth(body, 'M-118 0 L118 0 L114 -112 L-114 -112 Z', C.walnut);
    pth(body, 'M-110 -6 C-60 -2 -14 -4 0 -12 L0 -118 C-14 -110 -60 -108 -108 -114 Z', C.paper);
    pth(body, 'M110 -6 C60 -2 14 -4 0 -12 L0 -118 C14 -110 60 -108 108 -114 Z', '#FBF6EA');
    S.line(body, 'M0 -12 L0 -118', S.LINE.mid);
    for (let i = 0; i < 7; i++) { const y = -98 + i * 12;
      S.line(body, `M-100 ${y + 1} C-60 ${y + 4} -20 ${y + 3} -6 ${y - 2}`, 0.9, C.skyDeep, {opacity: 0.45});
      S.line(body, `M100 ${y + 1} C60 ${y + 4} 20 ${y + 3} 6 ${y - 2}`, 0.9, C.skyDeep, {opacity: 0.45}); }
    S.line(body, 'M-40 -110 L-38 -8', 1.2, C.crimson, {opacity: 0.7}); S.line(body, 'M60 -112 L58 -6', 1.2, C.crimson, {opacity: 0.7});
    const txt = (x, y, s, c) => { const e = S.svg('text', {x, y, 'font-family': 'JetBrains Mono', 'font-weight': 700, 'font-size': 8.5, fill: c || C.slate, transform: `rotate(1.5 ${x} ${y})`}, body); e.textContent = s; };
    txt(-96, -86, 'RESERVES   $0', C.crimson); txt(-96, -62, 'LOANS    10,000'); txt(-96, -38, 'CASH      -300M', C.crimson);
    txt(10, -88, 'Q3   ????'); txt(10, -64, 'Q4  -1.2B', C.crimson); txt(10, -40, 'OK?  ✗');
    pth(body, 'M30 -118 L40 -118 L40 -4 L35 4 L30 -4 Z', C.crimson, S.LINE.micro);
    return {g, parts: {}, animate() {}};
  };

  // 7. rubber stamp + imprint ------------------------------------------------------------------------------------------------
  P.stamp = function (parent, o) {
    o = o || {}; const {g, body} = host(parent, o, 'stamp');
    const imprint = S.g(g, {opacity: 0}); g.insertBefore(imprint, body);
    const word = o.word || 'DENIED';
    pth(imprint, 'M-74 -16 L74 -22 L76 18 L-72 24 Z', 'none', null, {stroke: C.crimson, 'stroke-width': 5, 'stroke-dasharray': '30 3 12 2', opacity: 0.9});
    const t = S.svg('text', {x: 0, y: 12, 'text-anchor': 'middle', 'font-family': 'Archivo Black', 'font-size': 30, fill: C.crimson, transform: 'rotate(-2.5)', 'letter-spacing': 2}, imprint); t.textContent = word;
    const splash = S.g(imprint); const r = S.rng(13);
    for (let i = 0; i < 9; i++) { const a = r() * Math.PI * 2, d = 82 + r() * 26; S.svg('circle', {cx: (Math.cos(a) * d).toFixed(1), cy: (Math.sin(a) * d * 0.45).toFixed(1), r: (1.5 + r() * 3.5).toFixed(1), fill: C.crimson}, splash); }
    const tool = S.g(body);
    pth(tool, 'M-44 -12 L44 -12 L44 0 L-44 0 Z', C.crimson);
    pth(tool, 'M-48 -30 L48 -30 L48 -12 L-48 -12 Z', '#9CA3AF');
    cres(tool, 'M-30 -30 L30 -30 L26 -66 L-26 -66 Z', C.walnut, C.walnutDeep, 5, 2);
    pth(tool, 'M-9 -66 L9 -66 L8 -84 L-8 -84 Z', C.walnut);
    cres(tool, 'M0 -116 A18 18 0 1 1 -0.1 -116 Z', C.crimson, C.crimsonDeep, 5, 4);
    S.svg('circle', {cx: -6, cy: -106, r: 4, fill: '#FFFFFF', opacity: 0.7}, tool);
    return {g, parts: {tool, imprint, splash}, animate(tl, start, end, op) {
      const at = op && op.at != null ? op.at : start + 0.4;
      tl.fromTo(tool, {y: -60, rotation: -8, svgOrigin: '0 0'}, {y: -90, rotation: -14, duration: 0.25, ease: 'power2.out'}, at - 0.3);
      tl.to(tool, {y: 0, rotation: 0, duration: 0.08, ease: 'power4.in'}, at - 0.05);
      tl.fromTo(imprint, {opacity: 0, scale: 1.15, svgOrigin: '0 0'}, {opacity: 1, scale: 1, duration: 0.1, ease: 'back.out(3)'}, at + 0.03);
      tl.to(tool, {y: -70, duration: 0.35, ease: 'power2.out'}, at + 0.18);
    }};
  };

  // 8. airport check-in desk (pivot: bottom-centre; top surface at y = -top) ---------------------------------------------
  P.airportDesk = function (parent, o) {
    o = Object.assign({w: 640, top: 210}, o || {}); const {g, body} = host(parent, Object.assign({}, o, {paper: false}), 'desk');
    const w = o.w, h = o.top, x0 = -w / 2;
    const front = `M${x0 + 10} ${-h + 18} L${x0 + w - 10} ${-h + 18} L${x0 + w - 18} 0 L${x0 + 18} 0 Z`;
    cres(body, front, '#24344F', '#172238', 12, 6);
    const svgRoot = parent.ownerSVGElement || parent;
    if (window.rough) {   // hand-inked cross-hatching in the overhang shadow and on the panel edge
      const rc = rough.svg(svgRoot);
      const hz = rc.rectangle(x0 + 22, -h + 22, w - 44, 26, {seed: 31, roughness: 0.9, stroke: 'none', fill: 'rgba(10,14,25,0.55)', fillStyle: 'cross-hatch', hachureGap: 6, fillWeight: 1.1});
      body.appendChild(hz);
      const edge = rc.line(x0 + 30, -8, x0 + w - 30, -8, {seed: 32, roughness: 1.2, stroke: '#41567A', strokeWidth: 1.4}); body.appendChild(edge);
    }
    pth(body, `M${x0 + 40} ${-h + 64} L${x0 + w - 40} ${-h + 64} L${x0 + w - 40} ${-h + 92} L${x0 + 40} ${-h + 92} Z`, C.crimson, S.LINE.mid);
    pth(body, `M${x0 + 40} ${-h + 92} L${x0 + w - 40} ${-h + 92} L${x0 + w - 40} ${-h + 100} L${x0 + 40} ${-h + 100} Z`, C.mustard, S.LINE.micro);
    const sign = S.svg('text', {x: 0, y: -h + 85, 'text-anchor': 'middle', 'font-family': 'Archivo Black', 'font-size': 21, fill: C.paper, 'letter-spacing': 6}, body);
    sign.textContent = o.sign || 'CHECK-IN · GATE 7';
    S.svg('text', {x: 0, y: -h + 150, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono', 'font-weight': 700, 'font-size': 14, fill: '#A9BAD4', 'letter-spacing': 3}, body).textContent = 'UNCUT AIR · BANKING CLASS';
    // top slab with wood texture
    const slab = `M${x0 - 14} ${-h - 4} L${x0 + w + 14} ${-h - 4} L${x0 + w + 10} ${-h + 20} L${x0 - 10} ${-h + 20} Z`;
    const sc = S.uid('slab'); S.path(S.svg('clipPath', {id: sc}, S.ensureDefs()), slab);
    S.path(body, slab, C.oak);
    S.svg('image', {href: S.Textures.url('wood-grain'), x: x0 - 14, y: -h - 4, width: w + 28, height: 24, preserveAspectRatio: 'none', opacity: 0.55, 'clip-path': `url(#${sc})`}, body);
    S.path(body, slab, 'none', W);
    S.line(body, `M${x0 - 8} ${-h} L${x0 + w + 8} ${-h}`, S.LINE.micro, '#F3D3A5', {opacity: 0.9, 'stroke-width': 2});
    // monitor on the desk (back-facing, glowing edge)
    const mon = S.g(body, {transform: `translate(${w * 0.28} ${-h - 4})`});
    pth(mon, 'M-8 0 L8 0 L6 -26 L-6 -26 Z', C.slate);
    pth(mon, 'M-56 -26 L56 -26 L52 -100 L-52 -100 Z', C.charcoal);
    S.line(mon, 'M-50 -96 L-46 -32', 2, C.sky, {opacity: 0.6});
    return {g, parts: {body, top: -h}, animate() {}};
  };

  // clipboard (pivot: the clip, so it sits in a grip-prop hand) ----------------------------------------------------------
  P.clipboard = function (parent, o) {
    o = o || {}; const g = S.g(parent, {class: 'ss-prop ss-prop-clipboard', 'data-layout-ignore': '', transform: `translate(${o.x || 0} ${o.y || 0}) rotate(${o.rot || 0}) scale(${o.scale || 1})`});
    cres(g, 'M-46 -6 L46 -6 L46 120 L-46 120 Z', '#A0703F', '#7C5530', 6, 4);
    pth(g, 'M-38 4 L38 4 L38 112 L-38 112 Z', '#FFFDF9', S.LINE.mid);
    for (let i = 0; i < 5; i++) { const y = 24 + i * 18;
      S.path(g, `M-30 ${y - 5} L-22 ${y - 5} L-22 ${y + 3} L-30 ${y + 3} Z`, 'none', S.LINE.micro);
      if (i < 3) S.line(g, `M-29 ${y - 1} L-26 ${y + 2} L-21 ${y - 6}`, 2, C.emeraldDeep);
      S.line(g, `M-14 ${y} L${20 + (i % 2) * 8} ${y}`, 1.2, C.slateLight); }
    pth(g, 'M-20 -14 L20 -14 L22 6 L-22 6 Z', '#CBD5E1');
    S.svg('circle', {cx: 0, cy: -6, r: 4, fill: '#94A3B8', stroke: S.INK, 'stroke-width': 1.3}, g);
    return {g, parts: {}, animate() {}};
  };

  // wall clock: second hand ticks once per second (pure function of t, applied in the render hook) --------------------------
  P.wallClock = function (parent, o) {
    o = o || {}; const {g, body} = host(parent, o, 'clock');
    cres(body, 'M0 -58 A58 58 0 1 1 -0.1 -58 Z', C.paper, C.creamDeep, 6, 5);
    S.svg('circle', {cx: 0, cy: 0, r: 50, fill: 'none', stroke: S.INK, 'stroke-width': S.LINE.micro}, body);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const r1 = i % 3 ? 42 : 36; S.line(body, `M${(Math.cos(a) * r1).toFixed(1)} ${(Math.sin(a) * r1).toFixed(1)} L${(Math.cos(a) * 47).toFixed(1)} ${(Math.sin(a) * 47).toFixed(1)}`, i % 3 ? 1.4 : 2.6); }
    const hr = S.path(body, 'M-3 6 L0 -26 L3 6 Z', S.INK, S.LINE.micro), mn = S.path(body, 'M-2.4 7 L0 -40 L2.4 7 Z', S.INK, S.LINE.micro);
    const sec = S.g(body); S.line(sec, 'M0 10 L0 -44', 1.6, C.crimson); S.svg('circle', {cx: 0, cy: 0, r: 4, fill: C.crimson, stroke: S.INK, 'stroke-width': 1}, sec);
    const h0 = o.hour || 10.1;
    S.onApply((t) => {
      const s = Math.floor(t), f = t - s, kick = f < 0.12 ? Math.sin(f / 0.12 * Math.PI) * 2.5 : 0;
      sec.setAttribute('transform', `rotate(${(s * 6 + Math.min(1, f / 0.06) * 0 + kick).toFixed(2)})`);
      mn.setAttribute('transform', `rotate(${((h0 % 1) * 360 + t * 0.1).toFixed(2)})`);
      hr.setAttribute('transform', `rotate(${(h0 * 30 + t * 0.008).toFixed(2)})`);
    }, 5);
    return {g, parts: {sec}, animate() {}};
  };

  // split-flap departures board: rows flip to new text at given times (tracks; seek-safe) ------------------------------------
  P.departures = function (parent, o) {
    o = Object.assign({w: 420, rows: [['NY', 'ON TIME'], ['LDN', 'DELAYED'], ['HK', 'BOARDING']]}, o || {});
    const {g, body} = host(parent, Object.assign({}, o, {paper: o.paper}), 'board');
    const rh = 34, h = o.rows.length * rh + 46;
    pth(body, `M${-o.w / 2} ${-h} L${o.w / 2} ${-h} L${o.w / 2} 0 L${-o.w / 2} 0 Z`, '#111827');
    S.svg('text', {x: -o.w / 2 + 16, y: -h + 26, 'font-family': 'Archivo Black', 'font-size': 16, fill: C.mustard, 'letter-spacing': 3}, body).textContent = 'DEPARTURES';
    const cells = [];
    o.rows.forEach((r, i) => {
      const y = -h + 46 + i * rh;
      pth(body, `M${-o.w / 2 + 12} ${y} L${o.w / 2 - 12} ${y} L${o.w / 2 - 12} ${y + rh - 6} L${-o.w / 2 + 12} ${y + rh - 6} Z`, '#1F2937', S.LINE.micro);
      S.line(body, `M${-o.w / 2 + 12} ${y + (rh - 6) / 2} L${o.w / 2 - 12} ${y + (rh - 6) / 2}`, 0.8, '#0B0F17');
      const a = S.svg('text', {x: -o.w / 2 + 22, y: y + 21, 'font-family': 'JetBrains Mono', 'font-weight': 700, 'font-size': 17, fill: '#F3F4F6'}, body); a.textContent = r[0];
      const b = S.svg('text', {x: o.w / 2 - 22, y: y + 21, 'text-anchor': 'end', 'font-family': 'JetBrains Mono', 'font-weight': 700, 'font-size': 17, fill: r[1] === 'DELAYED' ? C.coral : C.mint}, body); b.textContent = r[1];
      cells.push({a, b, track: new S.Track(r[1]), y});
    });
    S.onApply((t) => cells.forEach((c) => { const k = c.track.keyAt(t); const v = k[1]; const dt = t - k[0];
      c.b.textContent = dt < 0.2 && k[0] > 0 ? '▒▒▒▒▒▒▒'.slice(0, 1 + Math.floor(dt * 35)) : v;
      c.b.setAttribute('fill', /CANCEL|DELAY|BANKRUPT/.test(v) ? C.coral : C.mint); }), 5);
    return {g, parts: {cells}, flip(row, t, text) { cells[row].track.set(t, text); }, animate() {}};
  };

  // House-drawn story props. Deep-slate line, flat fills. Drop or slide in 0.35 s when anim.at is set.
  const H_INK = '#141114', H_DEEP = '#28363F', H_PAPER = '#E3E1D5', H_RED = '#D94A3A', H_WOOD = '#A87145', H_GOLD = '#E2B657';
  function house(parent, o, name) {
    const g = S.g(parent, {class: 'ss-prop ss-prop-' + name, id: o.id || null, 'data-layout-ignore': '', transform: `translate(${o.x || 0} ${o.y || 0}) scale(${o.scale || 1})`});
    const body = S.g(g);
    return {g, body};
  }
  function drop(node, tl, start, end, op) {
    const at = op && op.at != null ? op.at : start;
    tl.set(node, {opacity: 0}, 0);
    tl.fromTo(node, {y: -80, opacity: 0}, {y: 0, opacity: 1, duration: 0.35, ease: 'power3.out', immediateRender: false}, at);
  }
  P.invoice = function (parent, o) {
    o = o || {}; const {g, body} = house(parent, o, 'invoice');
    S.svg('rect', {x: -70, y: -120, width: 140, height: 110, rx: 2, fill: H_PAPER, stroke: H_DEEP, 'stroke-width': 3.5}, body);
    S.svg('text', {x: 0, y: -96, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 14, fill: H_INK}, body).textContent = 'INVOICE';
    for (let i = 0; i < 4; i++) S.svg('line', {x1: -54, y1: -74 + i * 14, x2: 54, y2: -74 + i * 14, stroke: H_DEEP, 'stroke-width': 2}, body);
    S.svg('rect', {x: -54, y: -18, width: 70, height: 12, fill: H_RED}, body);
    return {g, parts: {}, animate(tl, s, e, op) { drop(body, tl, s, e, op); }};
  };
  P.stampLatvian = function (parent, o) {
    o = o || {}; const {g, body} = house(parent, o, 'stampLatvian');
    S.svg('circle', {cx: 0, cy: -36, r: 34, fill: 'none', stroke: H_RED, 'stroke-width': 4}, body);
    S.svg('circle', {cx: 0, cy: -36, r: 26, fill: 'none', stroke: H_RED, 'stroke-width': 2}, body);
    S.svg('text', {x: 0, y: -30, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 11, fill: H_RED}, body).textContent = o.word || 'RIGA';
    return {g, parts: {}, animate(tl, s, e, op) { drop(body, tl, s, e, op); }};
  };
  P.courtFolder = function (parent, o) {
    o = o || {}; const {g, body} = house(parent, o, 'courtFolder');
    S.svg('path', {d: 'M-78,-20 L-30,-20 L-18,-32 L70,-32 L78,-20 L78,48 L-78,48 Z', fill: '#C4B8A4', stroke: H_DEEP, 'stroke-width': 3.5, 'stroke-linejoin': 'round'}, body);
    S.svg('rect', {x: -40, y: -8, width: 80, height: 22, fill: H_PAPER, stroke: H_DEEP, 'stroke-width': 2}, body);
    S.svg('text', {x: 0, y: 8, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 11, fill: H_INK}, body).textContent = o.label || o.word || 'FILE';
    return {g, parts: {}, animate(tl, s, e, op) { drop(body, tl, s, e, op); }};
  };
  P.newspaper = function (parent, o) {
    o = o || {}; const {g, body} = house(parent, o, 'newspaper');
    S.svg('rect', {x: -90, y: -70, width: 180, height: 120, fill: H_PAPER, stroke: H_DEEP, 'stroke-width': 3.5}, body);
    S.svg('text', {x: 0, y: -46, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 13, fill: H_INK}, body).textContent = o.headline || o.word || 'THE LEDGER';
    for (let i = 0; i < 4; i++) S.svg('line', {x1: -74, y1: -28 + i * 14, x2: 74, y2: -28 + i * 14, stroke: H_DEEP, 'stroke-width': 2}, body);
    return {g, parts: {}, animate(tl, s, e, op) { drop(body, tl, s, e, op); }};
  };
  P.conveyorRack = function (parent, o) {
    o = o || {}; const {g, body} = house(parent, o, 'conveyorRack');
    S.svg('rect', {x: -110, y: -90, width: 220, height: 16, fill: '#5C6B73', stroke: H_DEEP, 'stroke-width': 3.5}, body);
    S.svg('rect', {x: -100, y: -74, width: 12, height: 74, fill: '#5C6B73', stroke: H_DEEP, 'stroke-width': 3}, body);
    S.svg('rect', {x: 88, y: -74, width: 12, height: 74, fill: '#5C6B73', stroke: H_DEEP, 'stroke-width': 3}, body);
    S.svg('rect', {x: -70, y: -60, width: 140, height: 28, fill: H_PAPER, stroke: H_DEEP, 'stroke-width': 2.5}, body);
    S.svg('text', {x: 0, y: -40, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 9, fill: H_INK}, body).textContent = o.label || 'QUANTA COMPUTER';
    return {g, parts: {}, animate(tl, s, e, op) { drop(body, tl, s, e, op); }};
  };
  P.deskLamp = function (parent, o) {
    o = o || {}; const {g, body} = house(parent, o, 'deskLamp');
    S.svg('ellipse', {cx: 0, cy: -8, rx: 36, ry: 10, fill: H_GOLD, opacity: 0.55}, body);
    S.svg('path', {d: 'M-28,-70 L28,-70 L18,-28 L-18,-28 Z', fill: H_GOLD, stroke: H_DEEP, 'stroke-width': 3.5, 'stroke-linejoin': 'round'}, body);
    S.svg('rect', {x: -4, y: -28, width: 8, height: 24, fill: '#5C6B73', stroke: H_DEEP, 'stroke-width': 2}, body);
    S.svg('rect', {x: -16, y: -6, width: 32, height: 8, fill: '#3A2A1C', stroke: H_DEEP, 'stroke-width': 2}, body);
    return {g, parts: {}, animate(tl, s, e, op) { drop(body, tl, s, e, op); }};
  };
  P.plant = function (parent, o) {
    o = o || {}; const {g, body} = house(parent, o, 'plant');
    S.svg('path', {d: 'M-16,-4 L16,-4 L20,16 L-20,16 Z', fill: '#6B4226', stroke: H_DEEP, 'stroke-width': 3.5}, body);
    S.svg('ellipse', {cx: 0, cy: -28, rx: 16, ry: 20, fill: '#1F7A4D', stroke: H_DEEP, 'stroke-width': 3}, body);
    S.svg('ellipse', {cx: -14, cy: -16, rx: 12, ry: 14, fill: '#1F7A4D', stroke: H_DEEP, 'stroke-width': 3}, body);
    S.svg('ellipse', {cx: 14, cy: -18, rx: 11, ry: 13, fill: '#2E8B57', stroke: H_DEEP, 'stroke-width': 3}, body);
    return {g, parts: {}, animate(tl, s, e, op) { drop(body, tl, s, e, op); }};
  };
})(window.Studio = window.Studio || {});
