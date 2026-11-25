/* Paper cast (rig8 port). The character grammar of story_video/tools/puppet/rig8.mjs ("paper", the look shared by
 * Crayon Capital and Paper Billions) rebuilt on shared-studio's CharacterRig, so every existing verb (walk, react,
 * lip sync, acting keys) drives it:
 *   - a BIG round head (~40% of the height), no ears, no nose; two dark tall-oval eyes with a catch-light; thin calm
 *     brows that carry most of the acting; a simple line mouth (lipsync shapes);
 *   - a tall bean torso in one flat clothing colour with a vertical sheen, trousers as a dark band at the hem;
 *   - thin ink legs, small rounded shoes;
 *   - noodle arms: ONE smooth ink curve shoulder > elbow > wrist, redrawn every frame from the FK chain (rig8 noodle8);
 *   - small mitten hands with a thumb and a slight finger curl (style bible: "small mittens or 3-finger hands").
 * Likeness lives in hair silhouette + colour, glasses and one outfit item, never in face geometry.
 * The legacy sculpted rigs stay available as Cast.MiloV1, Cast.TheSuitV1, Cast.TheClipboardV1, Cast.TheSchemerV1.
 *
 * Also here: Studio.Workstation.attach(ch, o): seats a paper figure behind a desk. The desk top and keyboard sit between
 * the body and the arms (ch.n.under), the desk front hides the legs (ch.n.front), a chair back sits behind (ch.n.behind).
 */
(function (S) {
  'use strict';
  const INK = '#141114';                      // style bible Ink
  const Cast = S.Cast = S.Cast || {};

  // ---- path helper: scale + translate an absolute-command SVG path (M L C Q S T H V A Z) ----------------------------
  S.xfPath = function (d, k, tx, ty) {
    const out = [];
    const re = /([MLCQSTHVAZ])([^MLCQSTHVAZ]*)/gi;
    let m;
    while ((m = re.exec(d))) {
      const c = m[1], nums = (m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number);
      if (c !== c.toUpperCase()) throw new Error('xfPath: relative command ' + c);
      const r = [];
      if (c === 'Z') { out.push('Z'); continue; }
      if (c === 'H') nums.forEach((v) => r.push((v * k + tx).toFixed(2)));
      else if (c === 'V') nums.forEach((v) => r.push((v * k + ty).toFixed(2)));
      else if (c === 'A') for (let i = 0; i + 6 < nums.length + 1; i += 7) r.push((nums[i] * k).toFixed(2), (nums[i + 1] * k).toFixed(2), nums[i + 2], nums[i + 3], nums[i + 4], (nums[i + 5] * k + tx).toFixed(2), (nums[i + 6] * k + ty).toFixed(2));
      else for (let i = 0; i + 1 < nums.length; i += 2) r.push((nums[i] * k + tx).toFixed(2) + ',' + (nums[i + 1] * k + ty).toFixed(2));
      out.push(c + r.join(' '));
    }
    return out.join(' ');
  };

  // ---- geometry (character-local: feet at y 0, x right) ------------------------------------------------------------
  // Module constants are geom({}) so a paper8() call with no proportion options matches today's rig.
  // Chin stays put: a larger head grows upward. Sole y=10, chin y=-382 → height = 392 + diameter.
  const J8 = {
    pelvis: [0, -120], hipL: [-26, -112], hipR: [26, -112], kneeL: [-27, -62], kneeR: [27, -62], ankleL: [-28, -14], ankleR: [28, -14],
    neck: [0, -386], headPivot: [0, -396], shoulderL: [-76, -350], shoulderR: [76, -350], elbowL: [-94, -248], elbowR: [94, -248],
    wristL: [-86, -140], wristR: [86, -140]
  };
  const BEAN0 = 'M-56,-394 C-80,-390 -90,-332 -91,-252 C-92,-170 -72,-100 0,-100 C72,-100 92,-170 91,-252 C90,-332 80,-390 56,-394 Z';
  const CHIN_Y = -382, SOLE_Y = 10;
  // head diameter / (392 + diameter) = target. Measured screen ratio runs a little high because the outline is included.
  const PAPER40_HEAD = (0.42 * (SOLE_Y - CHIN_Y)) / (1 - 0.42) / 200;
  const PAPER37_HEAD = (0.36 * (SOLE_Y - CHIN_Y)) / (1 - 0.36) / 200;
  function scalePathX(d, k) {
    if (k === 1) return d;
    const out = [];
    const re = /([MLCQSTHVAZ])([^MLCQSTHVAZ]*)/gi;
    let m;
    while ((m = re.exec(d))) {
      const c = m[1].toUpperCase();
      const nums = (m[2].match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number);
      if (c === 'Z') { out.push('Z'); continue; }
      const r = [];
      if (c === 'H') nums.forEach((v) => r.push((v * k).toFixed(2)));
      else if (c === 'V') nums.forEach((v) => r.push(String(v)));
      else if (c === 'A') for (let i = 0; i + 6 < nums.length + 1; i += 7) r.push((nums[i] * k).toFixed(2), nums[i + 1], nums[i + 2], nums[i + 3], nums[i + 4], (nums[i + 5] * k).toFixed(2), nums[i + 6]);
      else for (let i = 0; i + 1 < nums.length; i += 2) r.push((nums[i] * k).toFixed(2) + ',' + nums[i + 1]);
      out.push(c + r.join(' '));
    }
    return out.join(' ');
  }
  function geom(o) {
    o = o || {};
    let headScale = o.headScale == null ? 1 : o.headScale;
    if (o.proportions === 'paper40') headScale = PAPER40_HEAD;
    else if (o.proportions === 'paper37') headScale = PAPER37_HEAD;
    else if (o.proportions === 'legacy') headScale = 1;
    const bodyW = o.bodyW == null ? 1 : o.bodyW;
    const legLen = o.legLen == null ? 1 : o.legLen;
    const r = 100 * headScale;
    const cy = CHIN_Y - r;
    const HEAD = {cy: cy, r: r};
    const HK = r / 64;
    const J = {};
    Object.keys(J8).forEach((k) => { J[k] = [J8[k][0], J8[k][1]]; });
    if (legLen !== 1) ['L', 'R'].forEach((s) => {
      const hipY = J8['hip' + s][1];
      J['knee' + s][1] = hipY + (J8['knee' + s][1] - hipY) * legLen;
      J['ankle' + s][1] = hipY + (J8['ankle' + s][1] - hipY) * legLen;
    });
    return {
      HEAD: HEAD, HK: HK, J: J, BEAN: scalePathX(BEAN0, bodyW), headScale: headScale, bodyW: bodyW, legLen: legLen,
      hp: (d) => S.xfPath(d, HK, 0, cy)
    };
  }
  const G0 = geom({});
  const HEAD = G0.HEAD;
  const hp = G0.hp;
  S.paperGeom = geom;
  S.PAPER8 = {J: G0.J, HEAD: G0.HEAD, BEAN: G0.BEAN, INK: INK, PAPER40_HEAD: PAPER40_HEAD, PAPER37_HEAD: PAPER37_HEAD};

  // ---- mitten hands (wrist at 0,0, fingers toward +y, thumb toward -x; right hand) ---------------------------------
  const MITT = {
    relaxed: {palm: 'M-8,0 C-10.5,6 -10.5,14 -7.5,19.5 C-4.5,24 4.5,24 7.5,19.5 C10.5,14 10,6 8,0 Z', thumb: 'M-8,5 C-13.5,7 -15,12 -12,15.5 C-10.5,17 -8.5,16 -8,14', curl: ['M-4.5,18.5 Q-2,20.5 0.5,18.8', 'M1.5,18.2 Q4,19.8 6,17.5']},
    'open-explain': {palm: 'M-9,0 C-11.5,7 -11.5,17 -8.5,23 C-5,27.5 5.5,27.5 8.5,23 C11.5,17 11,7 9,0 Z', thumb: 'M-9,6 C-17,5 -22,10 -19,14.5 C-16,17.5 -11,14 -9,12', curl: ['M-3,22 L-3.5,26', 'M3,22 L3,26.5']},
    point: {palm: 'M-8.5,0 C-10.5,5 -10.5,12 -7.5,16 C-3.5,19.5 4,19.5 7.5,16 C10.5,12 10,5 8.5,0 Z', finger: [[-4.5, 14], [-5, 31]], thumb: 'M-8,6 C-12,9 -11,14 -6,14.5', curl: ['M0,15.5 Q3,16.8 6,14']},
    'fist-slam': {palm: 'M-9,0 C-11.5,5 -11.5,13 -8.5,17 C-4,20.5 4.5,20.5 8.5,17 C11.5,13 11,5 9,0 Z', thumb: 'M-8.5,6 C-12,10 -9,15 -3,14', curl: ['M-6,15 L6,15']},
    'grip-prop': {palm: 'M-8.5,0 C-10.5,5 -10.5,13 -7.5,17.5 C-3.5,21 4,21 7.5,17.5 C10.5,13 10,5 8.5,0 Z', thumb: 'M-8,6 C-13,10 -10,16 -3,16', curl: ['M-5,13 Q0,15 5,12.5']},
    'pinch-skeptical': {palm: 'M-8,0 C-10.5,6 -10.5,14 -7.5,19.5 C-4.5,24 4.5,24 7.5,19.5 C10.5,14 10,6 8,0 Z', thumb: 'M-8,5 C-14,9 -13,16 -7,19', curl: ['M-4.5,18.5 Q-2,20.5 0.5,18.8']},
    // typing: the hand seen from above, foreshortened onto the keys, three fingertip bumps resting down
    type: {palm: 'M-10,-1 C-12,4 -11.5,9 -9,12 C-7,14.5 -5,13 -4,15 C-2.5,16.8 -0.5,15.2 0.5,15.8 C2,16.8 4,15.6 4.5,14.6 C6.5,15 9,13 10.5,9 C12,5 11,1 9.5,-1 Z', thumb: 'M-10,3 C-14,4 -15,8 -12,10'},
  };
  S.PAPER_HAND_POSES = Object.keys(MITT);
  S.drawMitten = function (g, pose, o) {
    const def = MITT[pose] || MITT.relaxed, w = (o.ink || 4.2) * 0.8;
    const h = S.g(g, {'data-pose': pose, transform: o.mirror ? 'scale(-1,1)' : null});
    const st = {stroke: INK, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'};
    if (def.finger) {
      const [a, b] = def.finger;
      S.path(h, `M${a[0]},${a[1]} L${b[0]},${b[1]}`, 'none', null, {stroke: INK, 'stroke-width': 7.4 + w, 'stroke-linecap': 'round'});
      S.path(h, `M${a[0]},${a[1]} L${b[0]},${b[1]}`, 'none', null, {stroke: o.skin, 'stroke-width': 7.4, 'stroke-linecap': 'round'});
    }
    S.path(h, def.palm, o.skin, null, st);
    S.path(h, def.thumb + (def.thumb.endsWith('Z') ? '' : ''), o.skin, null, Object.assign({}, st, {'fill-opacity': 1}));
    (def.curl || []).forEach((d) => S.path(h, d, 'none', null, {stroke: INK, 'stroke-width': w * 0.55, 'stroke-linecap': 'round', opacity: 0.8}));
    return h;
  };

  // ---- paper eyes: dark tall ovals with a catch-light; skin lids slide down to flatten the oval (no lid band) --------
  S.paperEyes = function (n, feat, defs, cfg, id) {
    const F = cfg.face;
    ['L', 'R'].forEach((s) => {
      const k = s === 'L' ? -1 : 1, cx = k * F.eyeDX, cy = F.eyeY, rx = F.eyeRX, ry = F.eyeRY;
      const eg = S.g(feat, {id: `${id}-eye-${s}`});
      const cid = S.uid('peye');
      S.svg('ellipse', {cx, cy, rx: rx + 5, ry: ry + 5}, S.svg('clipPath', {id: cid}, defs));
      const inner = S.g(eg, {'clip-path': `url(#${cid})`});
      const iris = S.g(inner);
      S.svg('ellipse', {cx, cy, rx, ry, fill: F.eyeColor || '#19161B'}, iris);
      if (!F.matte) S.svg('ellipse', {cx: cx - rx * 0.3, cy: cy - ry * 0.4, rx: rx * 0.32, ry: ry * 0.27, fill: '#FFFFFF', opacity: 0.95, 'data-gloss': '1'}, iris);
      const dollar = S.svg('text', {x: cx, y: cy + ry * 0.7, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': ry * 2.2, fill: S.PALETTE.emeraldDeep, display: 'none'}, inner);
      dollar.textContent = '$';
      const top = cy - ry - 6;
      const lid = S.g(inner);
      S.svg('rect', {x: cx - rx - 8, y: top - ry * 3, width: (rx + 8) * 2, height: ry * 3, fill: cfg.lid || cfg.skin}, lid);
      S.path(lid, `M${cx - rx - 2} ${top} Q${cx} ${top + 2.5} ${cx + rx + 2} ${top}`, 'none', null, {stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round', fill: 'none'});
      const lidB = S.g(inner); const bot = cy + ry + 6;
      S.svg('rect', {x: cx - rx - 8, y: bot, width: (rx + 8) * 2, height: ry * 3, fill: cfg.skin}, lidB);
      n.eye[s] = {g: eg, iris, dollar, lid, lidB, cx, cy, rx, ry};
    });
  };

  // ---- hair (rig8 HAIR8 grammar, our own shapes; r 64 head coords, converted by hp) --------------------------------
  const HAIR = {
    tousle: {   // young: soft messy cap with three tufts and a split fringe
      back: 'M-70,6 C-80,-52 -44,-90 2,-90 C48,-90 80,-52 70,6 C46,-6 -46,-6 -70,6 Z',
      main: 'M-67,-2 C-74,-44 -54,-74 -18,-82 C-10,-94 8,-96 16,-86 C28,-96 50,-88 54,-74 C70,-62 76,-36 69,-4 C62,-22 54,-32 44,-36 C42,-28 34,-24 26,-24 C26,-34 18,-40 9,-40 C3,-31 -8,-28 -18,-30 C-22,-38 -32,-41 -40,-37 C-50,-30 -60,-18 -67,-2 Z',
      strands: ['M-46,-58 Q-26,-72 -6,-70', 'M10,-74 Q30,-76 46,-62', 'M-56,-30 Q-54,-48 -40,-60'],
      band: 'M-30,-70 Q4,-84 36,-70'
    },
    swept: {    // older executive: swept-back mass with soft lobes
      back: 'M-74,22 C-90,-46 -54,-96 0,-98 C54,-98 90,-48 76,22 C40,36 -40,36 -74,22 Z',
      main: 'M-70,8 C-82,-30 -74,-66 -46,-84 C-34,-98 -14,-100 0,-94 C12,-104 36,-102 48,-88 C70,-78 82,-46 74,-4 C70,-22 60,-36 44,-44 C20,-56 -10,-54 -34,-40 C-50,-30 -62,-14 -70,8 Z',
      strands: ['M-50,-58 Q-20,-82 16,-78', 'M-40,-42 Q-6,-66 36,-62', 'M8,-92 Q44,-86 62,-56'],
      band: 'M-44,-70 Q0,-92 44,-70'
    },
    parted: {   // neat side part, by-the-book
      back: 'M-70,6 C-76,-56 -40,-86 2,-86 C44,-86 76,-56 70,6 C44,-6 -44,-6 -70,6 Z',
      main: 'M-66,2 C-72,-48 -42,-78 2,-80 C46,-80 72,-50 68,2 C64,-22 56,-36 42,-44 C22,-54 -2,-52 -18,-46 L-14,-60 C-34,-54 -54,-30 -66,2 Z',
      strands: ['M-14,-60 Q16,-74 50,-56', 'M-40,-58 Q-52,-40 -58,-18'],
      band: 'M-4,-72 Q26,-80 52,-62'
    },
    slick: {    // slicked back with a quiff
      back: 'M-70,6 C-78,-56 -40,-88 4,-88 C48,-88 78,-56 70,6 C44,-6 -44,-6 -70,6 Z',
      main: 'M-66,0 C-72,-50 -38,-80 4,-80 C26,-98 64,-90 70,-60 C74,-40 72,-18 66,0 C60,-26 44,-42 20,-48 C-10,-52 -44,-36 -66,0 Z',
      strands: ['M-40,-60 Q0,-76 40,-74', 'M-50,-40 Q-10,-60 52,-56'],
      band: 'M6,-84 Q40,-90 60,-66'
    }
  };
  function hair(style, color, map) {
    const h = HAIR[style];
    map = map || hp;
    const lite = (hex, kk) => { const v = parseInt(hex.slice(1, 7), 16); return '#' + [v >> 16, (v >> 8) & 255, v & 255].map((c) => Math.round(c + (255 - c) * kk).toString(16).padStart(2, '0')).join(''); };
    return {
      color, shade: color, strandColor: INK, sheenColor: lite(color, 0.3),
      back: map(h.back), main: map(h.main), front: map(h.main),
      strands: h.strands.map(map), sheen: [map(h.band)]
    };
  }

  // ---- body pieces ----------------------------------------------------------------------------------------------------
  function darken(hex, amt) {
    const v = parseInt(String(hex).slice(1, 7), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(c * (1 - amt))));
    return '#' + [f(v >> 16), f((v >> 8) & 255), f(v & 255)].map((c) => c.toString(16).padStart(2, '0')).join('');
  }
  function markFlip(g, ctx) {
    const flip = S.g(g, {'data-light-flip': '1'});
    ctx.lightFlips = ctx.lightFlips || [];
    ctx.lightFlips.push(flip);
    return flip;
  }
  function sheen(g, ctx) {   // head shade. 'soft' keeps the radial wash. 'hard' (default) is one 25% crescent.
    const H = (ctx.geom && ctx.geom.HEAD) || HEAD;
    if ((ctx.cfg.shading || 'hard') === 'soft') {
      const gid = S.uid('hs');
      const rg = S.svg('radialGradient', {id: gid, cx: '0.42', cy: '0.3', r: '0.85'}, ctx.defs);
      S.svg('stop', {offset: '0.5', 'stop-color': '#000', 'stop-opacity': 0}, rg);
      S.svg('stop', {offset: '1', 'stop-color': '#3A2418', 'stop-opacity': 0.24}, rg);
      S.svg('circle', {cx: 0, cy: H.cy, r: H.r + 2, fill: `url(#${gid})`}, g);
      S.path(g, `M${H.r * 0.88},${H.cy - H.r * 0.42} C${H.r * 0.98},${H.cy} ${H.r * 0.95},${H.cy + H.r * 0.4} ${H.r * 0.78},${H.cy + H.r * 0.7}`, 'none', null, {stroke: '#FFFFFF', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.75, fill: 'none'});
      return;
    }
    const flip = markFlip(g, ctx);
    const hs = (ctx.geom && ctx.geom.headScale) || 1;
    const dx = 18 * hs, dy = 10 * hs;
    const d = ctx.cfg.head.d;
    const id = S.uid('hsh');
    S.path(S.svg('clipPath', {id}, ctx.defs), d);
    const c = S.g(flip, {'clip-path': `url(#${id})`});
    const shade = S.path(c, d, '#000', null, {opacity: 0.25});
    shade.style.mixBlendMode = 'multiply';
    S.path(c, d, ctx.cfg.skin, null, {transform: `translate(${(-dx).toFixed(2)} ${(-dy).toFixed(2)})`});
    // rim sits on the lit edge (left when lightSide is -1). The flip group mirrors it with the key.
    S.path(flip, `M${(-H.r * 0.88).toFixed(2)},${(H.cy - H.r * 0.42).toFixed(2)} C${(-H.r * 0.98).toFixed(2)},${H.cy} ${(-H.r * 0.95).toFixed(2)},${(H.cy + H.r * 0.4).toFixed(2)} ${(-H.r * 0.78).toFixed(2)},${(H.cy + H.r * 0.7).toFixed(2)}`, 'none', null, {stroke: '#FFFFFF', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.75, fill: 'none', 'data-screen-px': '3'});
    const band = darken(ctx.cfg.hair.color || '#2A211D', 0.28);
    const by = H.cy - H.r * 0.62;
    S.path(flip, `M${(-H.r * 0.45).toFixed(2)},${by.toFixed(2)} Q0,${(by + H.r * 0.08).toFixed(2)} ${(H.r * 0.5).toFixed(2)},${(by + H.r * 0.02).toFixed(2)}`, 'none', null, {stroke: band, 'stroke-width': (8 * hs).toFixed(2), 'stroke-linecap': 'round', opacity: 0.9, fill: 'none'});
  }
  function bodyShade(g, ctx) {   // 'soft' keeps the vertical gradient. 'hard' is one multiply band on the shadow side.
    if ((ctx.cfg.shading || 'hard') === 'soft') {
      const gid = S.uid('bs');
      const lg = S.svg('linearGradient', {id: gid, x1: '0', y1: '0', x2: '0', y2: '1'}, ctx.defs);
      S.svg('stop', {offset: '0', 'stop-color': '#FFFFFF', 'stop-opacity': 0.1}, lg);
      S.svg('stop', {offset: '0.45', 'stop-color': '#000', 'stop-opacity': 0}, lg);
      S.svg('stop', {offset: '1', 'stop-color': '#14100E', 'stop-opacity': 0.3}, lg);
      S.svg('rect', {x: -100, y: -400, width: 200, height: 304, fill: `url(#${gid})`}, g);
      S.path(g, 'M58,-380 C84,-330 92,-250 86,-180 C80,-130 60,-104 30,-100 L100,-100 L100,-400 Z', '#000', null, {opacity: 0.12});
      return;
    }
    const flip = markFlip(g, ctx);
    const bw = (ctx.geom && ctx.geom.bodyW) || 1;
    const x = (n) => (n * bw).toFixed(2);
    const d = `M${x(58)},-380 C${x(84)},-330 ${x(92)},-250 ${x(86)},-180 C${x(80)},-130 ${x(60)},-104 ${x(30)},-100 L${x(110)},-100 L${x(110)},-400 Z`;
    const shade = S.path(flip, d, '#000', null, {opacity: 0.25});
    shade.style.mixBlendMode = 'multiply';
  }
  const OUTFIT = {
    hoodie(g, o) {
      S.path(g, 'M-46,-200 L-36,-250 L36,-250 L46,-200 C20,-194 -20,-194 -46,-200 Z', o.top2, null, {stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'});
      S.path(g, 'M-62,-392 C-50,-360 50,-360 62,-392', 'none', null, {stroke: o.top2, 'stroke-width': 14, 'stroke-linecap': 'round', fill: 'none'});
      S.path(g, 'M-62,-392 C-50,-360 50,-360 62,-392', 'none', null, {stroke: INK, 'stroke-width': 2.4, fill: 'none', opacity: 0.6});
      [[-14, -372, -17, -318], [14, -372, 18, -314]].forEach(([x1, y1, x2, y2]) => {
        S.path(g, `M${x1},${y1} Q${x1 - 2},${(y1 + y2) / 2} ${x2},${y2}`, 'none', null, {stroke: '#F4EEDC', 'stroke-width': 3.2, 'stroke-linecap': 'round', fill: 'none'});
        S.svg('circle', {cx: x2, cy: y2 + 3, r: 3.4, fill: '#B9BCC2', stroke: INK, 'stroke-width': 1.6}, g);
      });
    },
    suit(g, o) {
      S.path(g, 'M-28,-394 L0,-300 L28,-394 Z', o.shirt);
      S.path(g, 'M-7,-376 L7,-376 L11,-330 L0,-312 L-11,-330 Z', o.tie, null, {stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'});
      S.path(g, 'M-8,-388 L8,-388 L6,-376 L-6,-376 Z', o.tie, null, {stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'});
      S.path(g, 'M-28,-394 L-8,-366 L-3,-392 Z M28,-394 L8,-366 L3,-392 Z', o.shirt, null, {stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'});
      S.path(g, 'M-30,-392 L-12,-322 L-2,-290 M30,-392 L12,-322 L2,-290', 'none', null, {stroke: INK, 'stroke-width': 2.6, fill: 'none', 'stroke-linejoin': 'round'});
      [-266, -236].forEach((y) => S.svg('circle', {cx: 0, cy: y, r: 3.6, fill: o.top2, stroke: INK, 'stroke-width': 1.6}, g));
      S.path(g, 'M-66,-330 L-44,-330 L-46,-316 L-64,-316 Z', o.accent || '#F4EEDC', null, {stroke: INK, 'stroke-width': 2});
    },
    shirt(g, o) {
      S.path(g, 'M-7,-378 L7,-378 L10,-318 L0,-302 L-10,-318 Z', o.tie, null, {stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'});
      S.path(g, 'M-30,-394 L-8,-364 L-3,-392 Z M30,-394 L8,-364 L3,-392 Z', o.shirt || '#FFFFFF', null, {stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'});
      S.path(g, 'M0,-300 L0,-150', 'none', null, {stroke: INK, 'stroke-width': 1.8, opacity: 0.45});
      [-280, -248, -216, -184].forEach((y) => S.svg('circle', {cx: 5, cy: y, r: 2.4, fill: '#F8FAFC', stroke: INK, 'stroke-width': 1.3}, g));
      S.path(g, 'M30,-318 L60,-318 L60,-292 L30,-292 Z', 'none', null, {stroke: INK, 'stroke-width': 2, fill: 'none', opacity: 0.7});
      S.path(g, 'M36,-318 L36,-334 M44,-318 L44,-338', 'none', null, {stroke: '#1E3A8A', 'stroke-width': 3.2, 'stroke-linecap': 'round'});
      // lanyard + ID card
      S.path(g, 'M-24,-388 L-40,-292 M-4,-376 L-26,-292', 'none', null, {stroke: o.accent || '#2563EB', 'stroke-width': 3, fill: 'none'});
      S.svg('rect', {x: -50, y: -296, width: 32, height: 40, rx: 3, fill: '#F8FAFC', stroke: INK, 'stroke-width': 2}, g);
      S.svg('rect', {x: -45, y: -290, width: 12, height: 14, fill: '#94A3B8'}, g);
      S.path(g, 'M-29,-286 L-23,-286 M-45,-268 L-23,-268', 'none', null, {stroke: INK, 'stroke-width': 1.6});
    },
    trench(g, o) {
      S.path(g, 'M-30,-394 L0,-296 L30,-394 Z', o.shirt);
      S.path(g, 'M-30,-394 L-6,-308 L-42,-332 L-58,-382 Z M30,-394 L6,-308 L42,-332 L58,-382 Z', o.top2, null, {stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'});
      S.svg('rect', {x: -100, y: -214, width: 200, height: 16, fill: o.top2}, g);
      S.path(g, 'M-100,-214 L100,-214 M-100,-198 L100,-198', 'none', null, {stroke: INK, 'stroke-width': 2});
      S.svg('rect', {x: -12, y: -218, width: 24, height: 24, rx: 3, fill: 'none', stroke: '#C9A25E', 'stroke-width': 3.4}, g);
      [[-22, -272], [22, -272], [-22, -244], [22, -244]].forEach(([x, y]) => S.svg('circle', {cx: x, cy: y, r: 3.6, fill: o.top2, stroke: INK, 'stroke-width': 1.6}, g));
      S.path(g, 'M0,-196 L0,-100', 'none', null, {stroke: INK, 'stroke-width': 2, opacity: 0.6});
    }
  };
  function shoe(g, s, col) {
    const k = s === 'L' ? -1 : 1;
    S.path(g, S.xfShoe(k), col, null, {stroke: INK, 'stroke-width': 3.2, 'stroke-linejoin': 'round'});
    S.path(g, `M${-8 * k},8 L${20 * k},8`, 'none', null, {stroke: '#FFFFFF', 'stroke-width': 1.6, opacity: 0.35});
  }
  S.xfShoe = (k) => `M${-10 * k},-4 C${-10 * k},-11 ${2 * k},-12 ${12 * k},-9 C${23 * k},-6 ${27 * k},3 ${22 * k},10 L${-8 * k},10 C${-13 * k},10 ${-13 * k},3 ${-10 * k},-4 Z`;

  /** Build a CharacterRig config with the paper grammar. o: {name, skin, hair:[style,color], glasses, outfit, top, top2,
   *  bottom, shirt, tie, accent, shoe, eyeColor, stature}. */
  S.paper8 = function (o) {
    const skin = o.skin || '#E2BFA3';
    const g = geom(o);
    const H = g.HEAD, hs = g.headScale;
    const crownY = H.cy - H.r;
    const top = Math.min(-640, crownY - 48);
    const view = (hs === 1 && g.bodyW === 1 && g.legLen === 1) ? [-260, -640, 520, 700] : [-280, top, 560, (SOLE_Y - top) + 80];
    const meta = {
      name: o.name, skin: skin, skinShade: o.skinShade, hair: o.hair, glasses: o.glasses, crooked: o.crooked,
      outfit: o.outfit, top: o.top, top2: o.top2, bottom: o.bottom, shirt: o.shirt, tie: o.tie, accent: o.accent,
      shoe: o.shoe, eyeColor: o.eyeColor, browColor: o.browColor, stature: o.stature,
      shading: o.shading, lightSide: o.lightSide, headScale: o.headScale, bodyW: o.bodyW, legLen: o.legLen,
      proportions: o.proportions, inkPx: o.inkPx, face: o.face || null
    };
    const faceOpt = o.face || {};
    const browW = faceOpt.browW == null ? 3.8 : faceOpt.browW;
    const cfg = {
      name: o.name, paper: true, ink: 4.2, inkPx: o.inkPx == null ? 6 : o.inkPx, armW: 8, noBlush: true,
      shading: o.shading || 'hard', lightSide: o.lightSide == null ? -1 : o.lightSide,
      view: view, geom: g, meta: meta,
      skin, skinShade: o.skinShade || '#C49A7C', lid: skin,
      shadowRx: 84, handScale: 1, handMount: [0, 15],
      drawHand: S.drawMitten, handPoses: S.PAPER_HAND_POSES,
      joints: g.J, sole: [[-12, 10], [24, 10]],
      rest: {armLL: 0, armRL: 0, lidL: 0, lidR: 0, lidBL: 0, lidBR: 0, blush: 0, glint: -1},
      head: {d: `M0,${crownY} A${H.r},${H.r} 0 1,1 -0.1,${crownY} Z`, crown: [0, crownY + 6 * hs], extras: sheen},
      hair: hair(o.hair[0], o.hair[1], g.hp),
      badge: [30, -350],
      face: {
        eyeY: H.cy + 6 * hs, eyeDX: 31 * hs, eyeRX: 8.6 * hs, eyeRY: 11.8 * hs, irisR: 8 * hs, eyeColor: o.eyeColor,
        browY: H.cy - 24 * hs, browDX: 15 * hs, browLen: 25 * hs, browW: browW * hs, browArch: (faceOpt.browArch == null ? 3 : faceOpt.browArch) * hs, browColor: faceOpt.browColor || o.browColor || INK,
        matte: faceOpt.matte === true,
        mouthY: H.cy + 50 * hs, mouthScale: 1.5 * hs, cheekDX: 50 * hs, cheekY: H.cy + 30 * hs, templeX: H.r - 4 * hs, nose: null
      },
      draw: {
        legUpper(g, s, ctx) { const a = ctx.J['hip' + s], b = ctx.J['knee' + s]; S.path(g, `M${a[0]},${a[1] - 6} L${b[0]},${b[1]}`, 'none', null, {stroke: INK, 'stroke-width': 7.5, 'stroke-linecap': 'round'}); },
        legLower(g, s, ctx) { const a = ctx.J['knee' + s], b = ctx.J['ankle' + s]; S.path(g, `M${a[0]},${a[1]} L${b[0]},${b[1]}`, 'none', null, {stroke: INK, 'stroke-width': 7.5, 'stroke-linecap': 'round'}); },
        foot(g, s) { shoe(g, s, o.shoe || '#1E1E22'); },
        torso(gg, ctx) {
          const BEAN = ctx.geom.BEAN;
          const cid = S.uid('bean');
          S.path(S.svg('clipPath', {id: cid}, ctx.defs), BEAN);
          S.path(gg, BEAN, o.top);
          const c = S.g(gg, {'clip-path': `url(#${cid})`});
          const bw = ctx.geom.bodyW || 1;
          if (o.outfit !== 'trench') {
            S.svg('rect', {x: -100 * bw, y: -146, width: 200 * bw, height: 50, fill: o.bottom || '#2B2F3A'}, c);
            S.path(c, `M${-100 * bw},-146 L${100 * bw},-146`, 'none', null, {stroke: INK, 'stroke-width': 2.4, opacity: 0.7});
          }
          OUTFIT[o.outfit](c, o);
          bodyShade(c, ctx);
          S.path(gg, BEAN, 'none', null, {stroke: INK, 'stroke-width': 4.2, 'stroke-linejoin': 'round'});
        },
        neck() {},
        armUpper() {},
        armLower() {}
      }
    };
    const gy = H.cy;
    if (o.glasses === 'wire') cfg.glasses = {shape: 'round', rx: 17 * hs, ry: 16 * hs, crooked: o.crooked || 0, color: '#1A1A1E', weight: 2.6 * hs, tint: 'rgba(220,235,245,0.10)', bridge: `M${-14 * hs} ${gy + 4 * hs} Q0 ${gy - 3 * hs} ${14 * hs} ${gy + 4 * hs}`};
    if (o.glasses === 'rect') cfg.glasses = {shape: 'rect', rx: 19 * hs, ry: 13 * hs, crooked: 0, color: '#1A1A1E', weight: 3 * hs, tint: 'rgba(220,235,245,0.08)', bridge: `M${-12 * hs} ${gy + 4 * hs} L${12 * hs} ${gy + 4 * hs}`};
    if (o.glasses === 'shades') cfg.glasses = {shape: 'rect', rx: 21 * hs, ry: 12.5 * hs, crooked: 0, color: '#0B0B0C', weight: 3 * hs, tint: 'rgba(14,16,22,0.92)', bridge: `M${-10 * hs} ${gy + 2 * hs} Q0 ${gy - 3 * hs} ${10 * hs} ${gy + 2 * hs}`};
    // held props for verbs (gesture "phone")
    cfg.heldProps = {
      phone(g) {
        const p = S.g(g, {transform: 'translate(0 4) rotate(4)'});
        S.svg('rect', {x: -11, y: -4, width: 22, height: 40, rx: 4, fill: '#18181B', stroke: INK, 'stroke-width': 2.4}, p);
        S.svg('rect', {x: -8, y: 0, width: 16, height: 30, rx: 2, fill: '#5EEAD4', opacity: 0.9}, p);
      }
    };
    if (o.stature) cfg.statureScale = o.stature;
    return Object.freeze(cfg);
  };

  // ---- the house cast, rebuilt on the paper grammar ------------------------------------------------------------------
  ['Milo', 'TheSuit', 'TheClipboard', 'TheSchemer'].forEach((k) => { if (Cast[k] && !Cast[k].paper) Cast[k + 'V1'] = Cast[k]; });
  Cast.Milo = S.paper8({name: 'Milo', skin: '#EAC2A0', hair: ['tousle', '#2A211D'], glasses: 'wire', crooked: 2,
    outfit: 'hoodie', top: '#C8302C', top2: '#A3231F', bottom: '#2F3A55', shoe: '#F1EFE8',
    proportions: 'paper37', face: {matte: true, browW: 5.2}});
  Cast.TheSuit = S.paper8({name: 'TheSuit', skin: '#E2BB98', hair: ['swept', '#A4A9AF'],
    outfit: 'suit', top: '#23283A', top2: '#151927', shirt: '#F4F1EA', tie: '#E8B43A', bottom: '#1C2030', shoe: '#141416', accent: '#F4EEDC',
    proportions: 'paper37', face: {matte: true, browW: 6.8}});
  Cast.TheClipboard = S.paper8({name: 'TheClipboard', skin: '#D9AC88', hair: ['parted', '#5A3A24'], glasses: 'rect',
    outfit: 'shirt', top: '#A9C6E6', shirt: '#F4F7FB', tie: '#25344F', bottom: '#B59A6E', shoe: '#5A3A24', accent: '#2563EB',
    proportions: 'paper37', face: {matte: true, browW: 5.6}});
  Cast.TheSchemer = S.paper8({name: 'TheSchemer', skin: '#C99474', skinShade: '#A8775A', hair: ['slick', '#1C1A1E'], glasses: 'shades',
    outfit: 'trench', top: '#B78A52', top2: '#94693A', shirt: '#26262B', bottom: '#26262B', shoe: '#2A1E16',
    proportions: 'paper37', face: {matte: true, browW: 7.4}});
  // TheClipboard keeps its clipboard in the right hand
  Cast.TheClipboard = Object.freeze(Object.assign({}, Cast.TheClipboard, {restHandR: 'grip-prop',
    draw: Object.assign({}, Cast.TheClipboard.draw, {mountR(g) { if (S.Props.clipboard) S.Props.clipboard(g, {x: 0, y: 26, scale: 0.42, rot: 180}); }})}));

  // ---- workstation: seat a paper figure behind a desk ------------------------------------------------------------------
  // drop: how far the seated body sinks. The desk top lands where the wrists reach with a relaxed elbow (0.9 of full
  // reach) so typing hands rest ON the keys instead of floating. Returns {deskY, wrist: {L, R}} in TORSO coordinates.
  S.Workstation = {
    attach(ch, o) {
      o = o || {};
      const J = ch.J, D = o.drop == null ? 60 : o.drop, side = o.side || 1;
      const L1 = Math.hypot(J.elbowR[0] - J.shoulderR[0], J.elbowR[1] - J.shoulderR[1]);
      const L2 = Math.hypot(J.wristR[0] - J.elbowR[0], J.wristR[1] - J.elbowR[1]) + 6;
      const kx = o.keyX || 34, reach = (L1 + L2) * 0.94, dx = J.shoulderR[0] - kx;
      const wristT = J.shoulderR[1] + Math.sqrt(Math.max(0, reach * reach - dx * dx));   // torso coords
      const wristLocal = wristT + D;
      const front = wristLocal + 12, back = front - 34, W = o.width || 250;
      ch.p.ground = 0; ch.p.pelvisY = D;
      const U = ch.n.under, F = ch.n.front, B = ch.n.behind;
      // chair back (behind the body)
      S.path(B, `M-104,${-300 + D} C-104,${-322 + D} 104,${-322 + D} 104,${-300 + D} L100,${-120 + D} L-100,${-120 + D} Z`, o.chair || '#2E3440', null, {stroke: INK, 'stroke-width': 3.6, 'stroke-linejoin': 'round'});
      S.path(B, `M-86,${-290 + D} L-86,${-140 + D}`, 'none', null, {stroke: '#FFFFFF', 'stroke-width': 3, opacity: 0.12});
      // desk top surface (between body and arms)
      const top = o.top || '#A87145', topD = o.topDark || '#65432C';
      S.path(U, `M${-W},${front} L${W},${front} L${W - 26},${back} L${-W + 26},${back} Z`, top, null, {stroke: INK, 'stroke-width': 3.4, 'stroke-linejoin': 'round'});
      S.path(U, `M${-W + 40},${back + 6} L${W - 40},${back + 6}`, 'none', null, {stroke: '#FFFFFF', 'stroke-width': 2, opacity: 0.18});
      // keyboard
      const ky0 = front - 4, ky1 = back + 7;
      S.path(U, `M-70,${ky0} L70,${ky0} L64,${ky1} L-64,${ky1} Z`, '#2B2F3A', null, {stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'});
      for (let r = 0; r < 3; r++) for (let c = 0; c < 11; c++) {
        const yy = ky1 + 4 + r * ((ky0 - ky1 - 7) / 3), xx = -58 + c * 11.6 + r * 2;
        S.svg('rect', {x: xx, y: yy, width: 8.4, height: Math.max(3, (ky0 - ky1 - 12) / 3), rx: 1.2, fill: '#4A5060'}, U);
      }
      // laptop to one side, lid seen from behind at three-quarters, glowing edge
      const lx = side * 150;
      const lid = `M${lx - 64},${back + 4} L${lx + 64},${back - 6} L${lx + 72},${back - 104} L${lx - 56},${back - 96} Z`;
      S.path(U, `M${lx - 76},${back + 10} L${lx + 70},${back + 2} L${lx + 64},${back - 8} L${lx - 70},${back} Z`, '#9CA3AF', null, {stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'});
      S.path(U, lid, '#C7CCD3', null, {stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round'});
      S.svg('circle', {cx: lx + 6, cy: back - 50, r: 11, fill: o.logo || '#F5C542', stroke: INK, 'stroke-width': 2}, U);
      // clutter from the prop library (falls back to nothing when the library is not injected)
      (o.clutter || ['fluent-emoji/hot-beverage.svg', 'fluent-emoji/canned-food.svg']).forEach((ref, i) => {
        const x = -side * (130 + i * 56), y = front - 8 - (i % 2) * 6;
        S.libProp(U, ref, {x, y, size: i ? 40 : 46});
      });
      // desk front (in front of everything): hides the seated legs, runs past the frame bottom
      S.path(F, `M${-W},${front} L${W},${front} L${W},${front + 260} L${-W},${front + 260} Z`, topD, null, {stroke: INK, 'stroke-width': 3.6, 'stroke-linejoin': 'round'});
      S.path(F, `M${-W},${front} L${W},${front} L${W},${front + 10} L${-W},${front + 10} Z`, top, null, {stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round'});
      S.path(F, `M${-W + 24},${front + 44} L${W - 24},${front + 44}`, 'none', null, {stroke: INK, 'stroke-width': 2.4, opacity: 0.5});
      S.svg('rect', {x: -22, y: front + 26, width: 44, height: 8, rx: 3, fill: '#2A1E16', stroke: INK, 'stroke-width': 2}, F);
      S.path(F, `M${side * 180},${front + 10} C${side * 190},${front + 70} ${side * 150},${front + 110} ${side * 170},${front + 200}`, 'none', null, {stroke: '#141416', 'stroke-width': 4, fill: 'none'});
      ch.desk = {deskY: front, wristT, keyX: kx, drop: D};
      return ch.desk;
    }
  };
})(window.Studio = window.Studio || {});
