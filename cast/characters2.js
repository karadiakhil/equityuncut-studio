/* Cast part 2: TheClipboard (regulator / auditor) and TheSchemer (mastermind / fake coworker, swappable disguises).
 * Same CharacterRig contract as characters.js; light from the upper left, crescents on the lower right.
 */
(function (S) {
  'use strict';
  const C = S.PALETTE;
  const Cast = S.Cast = S.Cast || {};
  const mirror = (s, x) => (s === 'L' ? -x : x);
  function limb(g, ctx, a, ra, b, rb, fill, shade, joint) {
    const c = S.capsule(a[0], a[1], ra, b[0], b[1], rb, true);
    ctx.crescent(g, c.full, fill, shade, 5, 2.5, joint ? false : 'outer');
    if (joint) { S.path(g, c.open, 'none', 'outer'); S.line(g, c.cap, 'micro', null, {opacity: 0.45}); }
    return c.full;
  }
  const MED = {
    pelvis: [0, -262], hipL: [-24, -258], hipR: [24, -258], kneeL: [-26, -142], kneeR: [26, -142], ankleL: [-27, -30], ankleR: [27, -30],
    neck: [0, -436], headPivot: [0, -458], shoulderL: [-70, -424], shoulderR: [70, -424], elbowL: [-83, -336], elbowR: [83, -336],
    wristL: [-88, -256], wristR: [88, -256]
  };
  function shoe(g, ctx, body, shade, sole) {
    ctx.crescent(g, 'M-13 -6 C-15 4 -16 14 -15 20 L36 20 C42 20 44 14 38 9 C30 4 18 2 10 -6 C4 -12 -9 -11 -13 -6 Z', body, shade, 3, 3);
    S.path(g, 'M-16 19 L40 19 C43 21 42 26 38 26 L-14 26 C-18 26 -18 21 -16 19 Z', sole, 'outer');
    S.line(g, 'M21 8 C27 9 32 11 34.5 14.5', null, '#FFFFFF', {'stroke-width': 2, opacity: 0.45});
  }
  function legs(col, shade, crease) {
    return {
      legUpper(g, s, ctx) { const J = ctx.J; limb(g, ctx, J['hip' + s], 20, J['knee' + s], 16.5, col, shade);
        if (crease) S.line(g, `M${J['hip' + s][0] + mirror(s, 4)} -236 L${J['knee' + s][0] + mirror(s, 3)} -150`, 'micro', crease, {opacity: 0.9}); },
      legLower(g, s, ctx) { const J = ctx.J; const a = J['ankle' + s]; limb(g, ctx, J['knee' + s], 16.5, a, 13.5, col, shade, true);
        S.line(g, `M${a[0] - 13} ${a[1] - 8} C${a[0] - 4} ${a[1] - 5} ${a[0] + 5} ${a[1] - 5} ${a[0] + 13} ${a[1] - 8}`, 'micro'); }
    };
  }
  const EAR = {d: 'M60 -537 C70 -544 80 -534 79 -519 C78 -506 71 -497 61 -500 Z', helix: 'M64 -531 C72 -533 75 -522 73 -514 C71 -508 67 -508 66 -511', inner: 'M68 -525 C70.5 -520 70.5 -516 68 -513'};

  // ================================= THE CLIPBOARD ======================================================
  Cast.TheClipboard = {
    name: 'TheClipboard', view: [-200, -700, 400, 740],
    skin: '#E9B48C', skinShade: '#C98E6A', lid: '#DDA47D',
    shadowRx: 72, handScale: 1.4, restHandR: 'grip-prop', joints: MED, sole: [[-16, 26], [40, 26]],
    rest: {armRU: 10, armRL: 118, handR: -20, armLL: -6, lidL: 0.18, lidR: 0.18},
    head: {
      d: 'M0 -604 C38 -604 64 -586 65 -550 C66 -526 64 -506 58 -490 C50 -470 30 -458 0 -456 C-30 -458 -50 -470 -58 -490 C-64 -506 -66 -526 -65 -550 C-64 -586 -38 -604 0 -604 Z',
      crown: [0, -598], shadeDX: 10, shadeDY: 6, lines: ['M-14 -462 C-6 -466 6 -466 14 -462']
    },
    ear: EAR,
    hair: {
      color: '#6B4A32', shade: '#47301F', sheenColor: '#A27A58', strandColor: '#3A2618',
      back: 'M-69 -556 C-74 -596 -44 -622 0 -622 C46 -622 74 -596 69 -556 L66 -530 L-66 -530 Z',
      main: 'M-66 -548 C-72 -590 -40 -616 2 -616 C46 -616 72 -590 66 -548 C60 -566 46 -578 20 -580 L12 -584 C-10 -582 -40 -578 -54 -568 C-60 -562 -64 -556 -66 -548 Z',
      front: 'M12 -584 C-10 -600 -48 -594 -63 -564 C-52 -574 -30 -578 -8 -576 C2 -578 8 -580 12 -584 Z',
      frontTop: 'M12 -584 C-10 -600 -48 -594 -63 -564',
      frontTips: 'M-63 -564 C-52 -574 -30 -578 -8 -576 C2 -578 8 -580 12 -584',
      strands: ['M12 -584 C20 -600 38 -606 54 -596', 'M-30 -604 C-14 -610 4 -608 12 -600', 'M20 -590 C36 -592 50 -584 58 -572'],
      frontStrands: ['M-2 -588 C-20 -592 -40 -586 -52 -574'],
      sheen: ['M18 -604 C32 -610 46 -606 56 -596']
    },
    face: {
      eyeY: -524, eyeDX: 24, eyeRX: 10, eyeRY: 8.6, irisR: 5.8, pupilR: 3.1, irisColor: '#2F4858',
      browY: -546, browDX: 9, browLen: 26, browW: 4.2, browArch: 0.4, browColor: '#4A3222',
      nose: 'M-1 -514 C2 -506 7 -500 4 -495 C1.5 -492.5 -3.5 -493 -6 -496',
      noseShadow: 'M-7.5 -491.5 C-3 -487 4 -487 7.5 -491.5 C4 -489.5 -3 -489.5 -7.5 -491.5 Z',
      mouthY: -476, mouthScale: 0.95, cheekDX: 37, cheekY: -500, templeX: 64
    },
    glasses: {shape: 'rect', rx: 17, ry: 12, crooked: 0, color: '#111827', weight: 3.4, bridge: 'M-7 -527 L7 -527'},
    draw: Object.assign(legs('#B9A37E', '#8C7856', '#7A6748'), {
      foot(g, s, ctx) { shoe(g, ctx, '#6B4226', '#45291A', '#2B1A10'); },
      torso(g, ctx) {
        const body = 'M-48 -440 C-64 -440 -78 -430 -80 -410 C-82 -380 -78 -330 -72 -290 C-70 -280 -68 -270 -68 -258 C-40 -252 40 -252 68 -258 C68 -270 70 -280 72 -290 C78 -330 82 -380 80 -410 C78 -430 64 -440 48 -440 C30 -446 -30 -446 -48 -440 Z';
        ctx.crescent(g, body, '#C7DDF5', '#97B9DE', 9, 4);
        S.line(g, 'M0 -432 L2 -262', 'mid');
        [-400, -360, -320, -284].forEach((y) => S.svg('circle', {cx: 5, cy: y, r: 2.6, fill: '#F8FAFC', stroke: S.INK, 'stroke-width': 1}, g));
        S.path(g, 'M26 -404 L56 -404 L56 -372 L26 -372 Z', '#BCD3EE', 'micro');
        S.path(g, 'M32 -412 L35 -412 L35 -392 L32 -392 Z', C.crimson, 'micro'); S.path(g, 'M40 -414 L43 -414 L43 -392 L40 -392 Z', C.skyDeep, 'micro');
        S.path(g, 'M-68 -268 C-40 -262 40 -262 68 -268 L68 -256 C40 -250 -40 -250 -68 -256 Z', '#5B3A26', 'mid');
        S.path(g, 'M-8 -266 L8 -266 L8 -254 L-8 -254 Z', '#D4A537', 'micro');
        S.line(g, 'M-76 -414 C-72 -430 -62 -437 -48 -438', null, '#E6F0FB', {'stroke-width': 3});
        S.line(g, 'M-20 -436 L-6 -372 M20 -436 L6 -372', null, C.skyDeep, {'stroke-width': 3.2});
        const b = S.g(g, {transform: 'translate(0 -350)'});
        S.path(b, 'M-20 -24 L20 -24 L20 24 L-20 24 Z', '#FFFFFF', 'mid');
        S.path(b, 'M-20 -24 L20 -24 L20 -14 L-20 -14 Z', C.skyDeep, 'micro');
        S.svg('circle', {cx: 0, cy: 0, r: 7, fill: '#E9B48C', stroke: S.INK, 'stroke-width': 1}, b);
        S.svg('text', {x: 0, y: 19, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono', 'font-weight': 700, 'font-size': 7, fill: S.INK}, b).textContent = 'AUDIT';
      },
      neck(g, ctx) {
        ctx.crescent(g, 'M-15 -476 L-16 -436 C-8 -430 8 -430 16 -436 L15 -476 Z', ctx.cfg.skin, ctx.cfg.skinShade, 5, 0, 'mid');
        S.path(g, 'M-15 -466 C-6 -452 7 -452 15 -464 L15 -476 L-15 -476 Z', ctx.cfg.skinShade);
        S.path(g, 'M-24 -446 L-2 -430 L-12 -416 L-30 -432 Z', '#D8E7F8', 'mid');
        S.path(g, 'M24 -446 L2 -430 L12 -416 L30 -432 Z', '#C7DDF5', 'mid');
      },
      armUpper(g, s, ctx) { const J = ctx.J; const e = J['elbow' + s];
        limb(g, ctx, J['shoulder' + s], 17, e, 14.5, '#C7DDF5', '#97B9DE');
        S.path(g, S.capsule(e[0], e[1] - 16, 16, e[0], e[1] + 2, 15.5), '#B5CDEA', 'mid');
        S.line(g, `M${e[0] - 15} ${e[1] - 7} L${e[0] + 15} ${e[1] - 7}`, 'micro'); },
      armLower(g, s, ctx) { const J = ctx.J; const e = J['elbow' + s], w = J['wrist' + s];
        limb(g, ctx, [e[0], e[1] + 6], 12, w, 10.5, ctx.cfg.skin, ctx.cfg.skinShade, true);
        S.line(g, `M${w[0] - 10} ${w[1] - 9} L${w[0] + 10} ${w[1] - 9}`, null, '#64748B', {'stroke-width': 5}); },
      mountR(g) { S.Props.clipboard(g, {x: -4, y: 2, scale: 0.6, rot: 170}); }
    })
  };

  // ================================= THE SCHEMER =========================================================
  Cast.TheSchemer = {
    name: 'TheSchemer', view: [-200, -700, 400, 740],
    skin: '#E8B996', skinShade: '#C79270', lid: '#DCA986',
    shadowRx: 68, handScale: 1.35, restMood: 'smirk',
    joints: Object.assign({}, MED, {shoulderL: [-66, -426], shoulderR: [66, -426], elbowL: [-79, -338], elbowR: [79, -338], wristL: [-84, -258], wristR: [84, -258]}),
    sole: [[-16, 26], [40, 26]],
    rest: {armLL: -6, armRL: 6, lidL: 0.3, lidR: 0.3},
    accHidesGlasses: ['nerd-glasses'],
    head: {
      d: 'M0 -606 C34 -606 60 -588 62 -552 C64 -530 60 -510 52 -494 C42 -474 22 -458 2 -454 C-20 -458 -40 -474 -50 -494 C-58 -510 -64 -530 -62 -552 C-60 -588 -34 -606 0 -606 Z',
      crown: [0, -600], shadeDX: 10, shadeDY: 6, lines: ['M-30 -486 C-24 -478 -16 -472 -8 -469']
    },
    ear: {d: 'M57 -537 C67 -544 77 -534 76 -519 C75 -506 68 -497 58 -500 Z', helix: 'M61 -531 C69 -533 72 -522 70 -514 C68 -508 64 -508 63 -511', inner: 'M65 -525 C67.5 -520 67.5 -516 65 -513'},
    hair: {
      color: '#1C1917', shade: '#0C0A09', sheenColor: '#78716C', strandColor: '#000000',
      back: 'M-66 -554 C-72 -598 -40 -630 2 -630 C46 -630 72 -598 66 -554 L63 -534 L-63 -534 Z',
      main: 'M-63 -548 C-70 -594 -38 -626 4 -626 C46 -626 70 -596 63 -550 C56 -572 40 -586 18 -588 C-4 -590 -34 -584 -50 -570 C-58 -562 -62 -556 -63 -548 Z',
      front: 'M-50 -570 C-36 -604 10 -618 48 -604 C58 -598 64 -584 63 -566 C52 -590 26 -596 6 -590 C-14 -584 -34 -576 -50 -570 Z',
      frontTop: 'M-50 -570 C-36 -604 10 -618 48 -604 C58 -598 64 -584 63 -566',
      frontTips: 'M63 -566 C52 -590 26 -596 6 -590 C-14 -584 -34 -576 -50 -570',
      strands: ['M-40 -606 C-20 -620 10 -622 36 -614', 'M-56 -584 C-50 -600 -38 -612 -22 -618'],
      frontStrands: ['M-30 -586 C-10 -600 20 -604 44 -598', 'M-12 -584 C8 -592 30 -594 52 -588'],
      sheen: ['M-28 -612 C-8 -622 20 -622 40 -612', 'M-20 -598 C0 -606 24 -606 44 -598']
    },
    face: {
      eyeY: -524, eyeDX: 23, eyeRX: 9.6, eyeRY: 8, irisR: 5.4, pupilR: 3, irisColor: '#3F2E22',
      browY: -546, browDX: 8, browLen: 26, browW: 4.8, browArch: 4.5, browColor: '#1C1917',
      nose: 'M-1 -516 C4 -506 9 -499 5 -494 C2 -491.5 -3.5 -492 -6 -495',
      noseShadow: 'M-7.5 -490.5 C-3 -486 4 -486 7.5 -490.5 C4 -488.5 -3 -488.5 -7.5 -490.5 Z',
      mouthY: -476, mouthScale: 1.0, cheekDX: 35, cheekY: -500, templeX: 61
    },
    glasses: {shape: 'rect', rx: 18, ry: 10.5, crooked: 0, color: '#0B0B0C', weight: 2.8, tint: 'rgba(17,24,39,0.8)', bridge: 'M-6 -528 Q0 -532 6 -528'},
    accessories: {
      'nerd-glasses'(g) { [-1, 1].forEach((k) => S.svg('circle', {cx: k * 23, cy: -524, r: 16, fill: 'rgba(186,230,253,0.18)', stroke: '#18181B', 'stroke-width': 5}, g));
        S.line(g, 'M-7 -526 Q0 -532 7 -526', null, '#18181B', {'stroke-width': 5}); S.line(g, 'M-39 -526 L-60 -530 M39 -526 L60 -530', null, '#18181B', {'stroke-width': 3}); },
      mustache(g) { S.path(g, 'M0 -488 C-8 -494 -22 -494 -30 -484 C-24 -486 -16 -482 -10 -480 C-6 -479 -2 -482 0 -484 C2 -482 6 -479 10 -480 C16 -482 24 -486 30 -484 C22 -494 8 -494 0 -488 Z', '#3B2A20', 'mid'); },
      cap(g) { S.path(g, 'M-66 -566 C-70 -612 -36 -640 2 -640 C42 -640 70 -612 66 -566 C40 -574 -40 -574 -66 -566 Z', C.crimson, 'outer');
        S.path(g, 'M20 -572 C46 -576 82 -572 96 -562 C82 -556 46 -558 18 -562 Z', C.crimsonDeep, 'mid');
        S.svg('circle', {cx: 0, cy: -638, r: 5, fill: C.crimsonDeep, stroke: S.INK, 'stroke-width': 1.3}, g);
        S.line(g, 'M0 -638 L0 -572', 'micro', null, {opacity: 0.6});
        S.svg('text', {x: -2, y: -590, 'text-anchor': 'middle', 'font-family': 'Archivo Black', 'font-size': 20, fill: '#FFFDF9'}, g).textContent = 'TX'; }
    },
    draw: Object.assign(legs('#2B2B30', '#18181B', null), {
      foot(g, s, ctx) { shoe(g, ctx, '#18181B', '#000000', '#3F3F46'); },
      torso(g, ctx) {
        const body = 'M-46 -440 C-62 -440 -76 -430 -78 -410 C-80 -380 -76 -330 -70 -290 C-68 -280 -66 -270 -66 -250 C-40 -244 40 -244 66 -250 C66 -270 68 -280 70 -290 C76 -330 80 -380 78 -410 C76 -430 62 -440 46 -440 C30 -446 -30 -446 -46 -440 Z';
        ctx.crescent(g, body, '#26262B', '#141417', 9, 4);
        for (let x = -18; x <= 18; x += 6) S.line(g, `M${x} -430 L${x} -300`, 'micro', '#3F3F46', {opacity: 0.6});
        ['L', 'R'].forEach((s) => { const m = (x) => mirror(s, x);
          const d = `M${m(-46)} -440 C${m(-62)} -440 ${m(-76)} -430 ${m(-78)} -410 C${m(-80)} -380 ${m(-76)} -330 ${m(-70)} -290 C${m(-68)} -270 ${m(-68)} -240 ${m(-66)} -200 L${m(-28)} -200 C${m(-28)} -260 ${m(-26)} -330 ${m(-22)} -436 Z`;
          ctx.crescent(g, d, '#B08452', '#86613A', s === 'R' ? 8 : 3, 3);
          S.path(g, `M${m(-22)} -436 L${m(-40)} -444 L${m(-46)} -410 L${m(-26)} -380 Z`, '#C4975F', 'mid');
          [-330, -296].forEach((y) => S.svg('circle', {cx: m(-36), cy: y, r: 3.4, fill: '#3F2A1A', stroke: S.INK, 'stroke-width': 1}, g)); });
        S.path(g, 'M-70 -276 L-28 -280 L-28 -268 L-70 -264 Z', '#86613A', 'micro'); S.path(g, 'M70 -276 L28 -280 L28 -268 L70 -264 Z', '#86613A', 'micro');
        S.line(g, 'M-74 -414 C-70 -430 -60 -437 -46 -438', null, '#D8B07C', {'stroke-width': 3});
      },
      neck(g, ctx) {
        S.path(g, 'M-17 -474 L-18 -434 C-8 -428 8 -428 18 -434 L17 -474 Z', ctx.cfg.skinShade, 'mid');
        S.path(g, 'M-24 -462 C-12 -456 12 -456 24 -462 L26 -432 C12 -424 -12 -424 -26 -432 Z', '#2E2E33', 'mid');
        [-448, -440].forEach((y) => S.line(g, `M-24 ${y} C-12 ${y + 6} 12 ${y + 6} 24 ${y}`, 'micro', '#4B4B52'));
        S.path(g, 'M-26 -432 L-50 -478 L-30 -470 L-18 -440 Z', '#C4975F', 'mid'); S.path(g, 'M26 -432 L50 -478 L30 -470 L18 -440 Z', '#B08452', 'mid');
      },
      armUpper(g, s, ctx) { const J = ctx.J; const e = J['elbow' + s]; limb(g, ctx, J['shoulder' + s], 17.5, e, 14.5, '#B08452', '#86613A');
        S.line(g, `M${e[0] - 10} ${e[1] - 6} C${e[0] - 4} ${e[1] - 2} ${e[0] + 4} ${e[1] - 3} ${e[0] + 9} ${e[1] - 8}`, 'micro', '#6B4A2A'); },
      armLower(g, s, ctx) { const J = ctx.J; const e = J['elbow' + s], w = J['wrist' + s];
        const L = Math.hypot(w[0] - e[0], w[1] - e[1]), ux = (w[0] - e[0]) / L, uy = (w[1] - e[1]) / L;
        S.path(g, S.capsule(w[0] - ux * 12, w[1] - uy * 12, 11.6, w[0] - ux * 1, w[1] - uy * 1, 11), '#26262B', 'mid');
        limb(g, ctx, e, 14.5, [w[0] - ux * 16, w[1] - uy * 16], 13, '#B08452', '#86613A', true);
        S.path(g, S.capsule(w[0] - ux * 22, w[1] - uy * 22 - 4, 13.6, w[0] - ux * 22, w[1] - uy * 22 + 4, 13.6), '#86613A', 'micro'); }
    })
  };
})(window.Studio = window.Studio || {});
