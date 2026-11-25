/* Starter cast: Milo (channel hero) and TheSuit (corporate executive).
 * Each is a CharacterRig config: joints (pixel pivots), face metrics, sculpted head/hair paths, and garment drawers.
 * Light comes from the upper left, so every cel-shade crescent sits on the lower right.
 */
(function (S) {
  'use strict';
  const C = S.PALETTE;
  const Cast = S.Cast = S.Cast || {};
  const mirror = (s, x) => (s === 'L' ? -x : x);

  // shared garment drawers --------------------------------------------------------------------------------------
  // joint: true = this segment hangs off a joint (forearm, shin): its top cap is drawn as a soft crease, not a hard
  // outline, so elbows and knees read as one sleeve/trouser leg instead of stacked puppet discs.
  function limb(g, ctx, a, ra, b, rb, fill, shade, joint) {
    const c = S.capsule(a[0], a[1], ra, b[0], b[1], rb, true);
    ctx.crescent(g, c.full, fill, shade, 5, 2.5, joint ? false : 'outer');
    if (joint) { S.path(g, c.open, 'none', 'outer'); S.line(g, c.cap, 'micro', null, {opacity: 0.45}); }
    return c.full;
  }
  function sneaker(g, ctx, body, bodyShade, accent) {
    const up = 'M-13 -4 C-15 6 -17 16 -16 22 L33 22 C38 22 40 16 35 11 C28 6 17 3 9 -5 C4 -11 -9 -10 -13 -4 Z';
    ctx.crescent(g, up, body, bodyShade, 3, 3);
    S.path(g, 'M0 15 C8 10 17 8 26 10.5 L24 14.5 C15 13 9 14.5 2.5 18 Z', accent, 'micro');
    S.path(g, 'M-17 20 L37 20 C41 22 41 30 35 30 L-14 30 C-19 30 -20 22 -17 20 Z', '#E5E7EB', 'outer');
    S.line(g, 'M-15 25.5 L36 25.5', 'micro', null, {opacity: 0.6});
    ['M5 -2 L11 3', 'M9 1.5 L15 6.5', 'M2 1 L8 -3.5'].forEach((d) => S.line(g, d, 'micro'));
    S.line(g, 'M-13.5 -1 C-17 3 -17.5 10 -16 15', 'micro', null, {opacity: 0.7});
  }

  // ================================= MILO ================================================================
  Cast.Milo = {
    name: 'Milo',
    view: [-200, -700, 400, 740],
    skin: '#F2C29B', skinShade: '#D99A73', lid: '#EDB892',
    shadowRx: 70, handScale: 1.4,
    joints: {
      pelvis: [0, -262], hipL: [-24, -258], hipR: [24, -258], kneeL: [-26, -142], kneeR: [26, -142], ankleL: [-27, -30], ankleR: [27, -30],
      neck: [0, -436], headPivot: [0, -458], shoulderL: [-70, -424], shoulderR: [70, -424], elbowL: [-83, -336], elbowR: [83, -336],
      wristL: [-88, -256], wristR: [88, -256]
    },
    sole: [[-17, 30], [37, 30]],
    rest: {armLL: -6, armRL: 6, lidL: 0.14, lidR: 0.14},
    head: {
      d: 'M0 -606 C36 -606 63 -588 66 -552 C68 -532 66 -514 61 -500 C55 -482 40 -464 20 -457 C12 -454 -12 -454 -20 -457 C-40 -464 -55 -482 -61 -500 C-66 -514 -68 -532 -66 -552 C-63 -588 -36 -606 0 -606 Z',
      crown: [0, -600], shadeDX: 10, shadeDY: 6,
      lines: ['M-12 -459 C-4 -462 4 -462 12 -459']
    },
    ear: {d: 'M60 -537 C70 -544 80 -534 79 -519 C78 -506 71 -497 61 -500 Z', helix: 'M64 -531 C72 -533 75 -522 73 -514 C71 -508 67 -508 66 -511', inner: 'M68 -525 C70.5 -520 70.5 -516 68 -513'},
    hair: {
      color: '#2D2420', shade: '#191311', sheenColor: '#6B574C', strandColor: '#120D0B',
      back: 'M-71 -556 C-80 -598 -52 -636 -2 -638 C50 -638 82 -606 75 -556 C73 -540 71 -530 67 -524 L-67 -524 C-71 -532 -73 -544 -71 -556 Z',
      main: 'M-67 -546 C-74 -572 -66 -598 -46 -612 C-50 -622 -40 -631 -29 -626 C-22 -641 -2 -644 8 -633 C17 -645 39 -641 43 -626 C59 -628 71 -612 69 -596 C77 -584 75 -566 67 -548 C62 -560 52 -572 36 -574 C16 -578 -14 -578 -34 -572 C-52 -568 -62 -558 -67 -546 Z',
      front: 'M-61 -566 C-50 -593 -18 -601 10 -597 C34 -595 57 -585 65 -566 C57 -569 51 -566 46 -559 C40 -570 30 -574 24 -572 C22 -562 16 -556 8 -551 C6 -562 0 -568 -8 -570 C-14 -562 -22 -556 -33 -553 C-33 -562 -38 -566 -45 -566 C-49 -561 -55 -559 -61 -566 Z',
      frontTop: 'M-61 -566 C-50 -593 -18 -601 10 -597 C34 -595 57 -585 65 -566',
      frontTips: 'M65 -566 C57 -569 51 -566 46 -559 C40 -570 30 -574 24 -572 C22 -562 16 -556 8 -551 C6 -562 0 -568 -8 -570 C-14 -562 -22 -556 -33 -553 C-33 -562 -38 -566 -45 -566 C-49 -561 -55 -559 -61 -566',
      strands: ['M-44 -603 C-34 -615 -18 -621 -2 -620', 'M12 -614 C26 -620 42 -615 52 -603', 'M-58 -584 C-56 -596 -50 -606 -42 -612', 'M30 -628 C36 -626 40 -622 42 -616'],
      frontStrands: ['M-38 -584 C-30 -578 -26 -570 -26 -562', 'M2 -590 C8 -582 10 -572 8 -562', 'M30 -588 C38 -582 42 -574 44 -566'],
      curl: 'M4 -634 C0 -652 18 -660 24 -650 C28 -643 21 -637 15 -641',
      sheen: ['M-36 -615 C-20 -627 10 -629 32 -620', 'M40 -611 C46 -608 50 -604 53 -599']
    },
    face: {
      eyeY: -524, eyeDX: 24, eyeRX: 10.5, eyeRY: 9.5, irisR: 6.2, pupilR: 3.3, irisColor: '#4A2F1E',
      browY: -549, browDX: 9, browLen: 27, browW: 4.4, browArch: 3, browColor: '#2D2420',
      nose: 'M-1 -514 C3 -508 7 -501 4 -496 C1.5 -493.5 -3.5 -494 -6 -497',
      noseShadow: 'M-7.5 -492.5 C-3 -488 4 -488 7.5 -492.5 C4 -490.5 -3 -490.5 -7.5 -492.5 Z',
      mouthY: -478, mouthScale: 1, cheekDX: 37, cheekY: -499, templeX: 64
    },
    glasses: {shape: 'round', rx: 15.5, ry: 14.5, crooked: 2.6, color: '#1F2937', weight: 2.2, bridge: 'M-8.6 -526 Q0 -533 8.6 -526'},
    draw: {
      legUpper(g, s, ctx) { const J = ctx.J; limb(g, ctx, J['hip' + s], 20, J['knee' + s], 16.5, '#363A4A', '#232632');
        S.line(g, `M${J['hip' + s][0] + mirror(s, 6)} -236 C${J['hip' + s][0] + mirror(s, 7)} -200 ${J['knee' + s][0] + mirror(s, 6)} -170 ${J['knee' + s][0] + mirror(s, 4)} -152`, 'micro', null, {opacity: 0.7}); },
      legLower(g, s, ctx) { const J = ctx.J; limb(g, ctx, J['knee' + s], 16.5, J['ankle' + s], 13.5, '#363A4A', '#232632', true);
        S.line(g, `M${J['ankle' + s][0] - 13} ${J['ankle' + s][1] - 8} C${J['ankle' + s][0] - 4} ${J['ankle' + s][1] - 5} ${J['ankle' + s][0] + 5} ${J['ankle' + s][1] - 5} ${J['ankle' + s][0] + 13} ${J['ankle' + s][1] - 8}`, 'micro');
        S.line(g, `M${J['knee' + s][0] - 8} ${J['knee' + s][1] + 4} C${J['knee' + s][0] - 2} ${J['knee' + s][1] + 8} ${J['knee' + s][0] + 4} ${J['knee' + s][1] + 7} ${J['knee' + s][0] + 9} ${J['knee' + s][1] + 2}`, 'micro', null, {opacity: 0.6}); },
      foot(g, s, ctx) { sneaker(g, ctx, '#F8FAFC', '#CBD5E1', C.crimson); },
      torso(g, ctx) {
        S.path(g, 'M-44 -444 C-52 -472 -30 -482 0 -482 C30 -482 52 -472 44 -444 Z', C.crimsonDeep, 'outer');   // hood behind the neck
        const body = 'M-50 -440 C-66 -440 -80 -430 -82 -410 C-84 -380 -80 -330 -74 -290 C-72 -280 -70 -272 -70 -262 L-70 -246 C-40 -240 40 -240 70 -246 L70 -262 C70 -272 72 -280 74 -290 C80 -330 84 -380 82 -410 C80 -430 66 -440 50 -440 C30 -446 -30 -446 -50 -440 Z';
        ctx.crescent(g, body, C.crimson, '#A51B1B', 9, 4);
        S.line(g, 'M-70 -262 C-40 -256 40 -256 70 -262', 'mid');
        for (let x = -62; x <= 62; x += 9) S.line(g, `M${x} ${-259 + Math.abs(x) * 0.02} L${x} -245`, 'micro', null, {opacity: 0.45});
        S.path(g, 'M-40 -300 L-31 -336 L31 -336 L40 -300 C20 -295 -20 -295 -40 -300 Z', '#C81F1F', 'mid');
        S.line(g, 'M-31 -336 C-36 -322 -38 -310 -40 -300', 'micro'); S.line(g, 'M31 -336 C36 -322 38 -310 40 -300', 'micro');
        S.line(g, 'M-58 -360 C-52 -350 -50 -340 -52 -326', 'micro', null, {opacity: 0.6});
        S.line(g, 'M60 -372 C54 -360 53 -346 56 -332', 'micro', null, {opacity: 0.6});
        S.line(g, 'M-78 -414 C-74 -430 -64 -437 -50 -438', null, C.coral, {'stroke-width': 3, opacity: 0.9});   // lit shoulder
        // drawstrings
        [[-12, -418, -15, -370], [12, -418, 16, -366]].forEach(([x1, y1, x2, y2]) => {
          S.line(g, `M${x1} ${y1} C${x1 - 2} ${y1 + 18} ${x2 + 2} ${y2 - 18} ${x2} ${y2}`, null, S.INK, {'stroke-width': 5});
          S.line(g, `M${x1} ${y1} C${x1 - 2} ${y1 + 18} ${x2 + 2} ${y2 - 18} ${x2} ${y2}`, null, '#FEF3C7', {'stroke-width': 2.4});
          S.path(g, S.capsule(x2, y2, 2.6, x2, y2 + 8, 2.6), '#94A3B8', 'micro');
        });
      },
      neck(g, ctx) {
        const nk = 'M-15 -476 L-16 -436 C-8 -430 8 -430 16 -436 L15 -476 Z';
        ctx.crescent(g, nk, ctx.cfg.skin, ctx.cfg.skinShade, 5, 0, 'mid');
        S.path(g, 'M-15 -466 C-6 -452 7 -452 15 -464 L15 -476 L-15 -476 Z', ctx.cfg.skinShade, null, {opacity: 0.95});
        S.path(g, 'M-23 -441 C-14 -429 14 -429 23 -441 L27 -436 C17 -421 -17 -421 -27 -436 Z', '#FFF4DC', 'mid');
        S.path(g, 'M-47 -446 C-49 -420 -27 -404 0 -404 C27 -404 49 -420 47 -446 C41 -440 35 -436 27 -436 C17 -420 -17 -420 -27 -436 C-35 -436 -41 -440 -47 -446 Z', C.crimson, 'mid');
        S.line(g, 'M-38 -428 C-28 -416 -14 -410 0 -410', 'micro', null, {opacity: 0.6});
        S.path(g, 'M47 -446 C49 -420 27 -404 0 -404 C10 -408 24 -414 30 -426 C36 -432 42 -438 47 -446 Z', '#A51B1B', null, {opacity: 0.8});
      },
      armUpper(g, s, ctx) { const J = ctx.J; limb(g, ctx, J['shoulder' + s], 17.5, J['elbow' + s], 14.5, C.crimson, '#A51B1B');
        const e = J['elbow' + s]; S.line(g, `M${e[0] - 10} ${e[1] - 6} C${e[0] - 4} ${e[1] - 2} ${e[0] + 4} ${e[1] - 3} ${e[0] + 9} ${e[1] - 8}`, 'micro', null, {opacity: 0.7});
        if (s === 'L') S.line(g, `M${J.shoulderL[0] - 15} ${J.shoulderL[1] + 6} C${J.shoulderL[0] - 17} ${J.shoulderL[1] + 30} ${e[0] - 14} ${e[1] - 30} ${e[0] - 13} ${e[1] - 8}`, null, C.coral, {'stroke-width': 2.5, opacity: 0.85}); },
      armLower(g, s, ctx) { const J = ctx.J; const e = J['elbow' + s], w = J['wrist' + s];
        const ux = (w[0] - e[0]) / Math.hypot(w[0] - e[0], w[1] - e[1]), uy = (w[1] - e[1]) / Math.hypot(w[0] - e[0], w[1] - e[1]);
        limb(g, ctx, e, 14.5, [w[0] - ux * 6, w[1] - uy * 6], 12.5, C.crimson, '#A51B1B', true);
        S.path(g, S.capsule(w[0] - ux * 12, w[1] - uy * 12, 12.6, w[0] - ux * 1, w[1] - uy * 1, 12), '#B91C1C', 'mid');
        for (let k = -8; k <= 8; k += 4) S.line(g, `M${w[0] - ux * 13 + k} ${w[1] - uy * 13 + 2} L${w[0] - ux * 3 + k} ${w[1] - uy * 3 + 2}`, 'micro', null, {opacity: 0.5});
        S.line(g, `M${e[0] - 9} ${e[1] + 14} C${e[0] - 4} ${e[1] + 20} ${e[0] + 3} ${e[1] + 20} ${e[0] + 8} ${e[1] + 16}`, 'micro', null, {opacity: 0.6}); }
    }
  };

  // ================================= THE SUIT ==============================================================
  Cast.TheSuit = {
    name: 'TheSuit',
    view: [-220, -740, 440, 780],
    skin: '#EDB894', skinShade: '#C88E69', lid: '#DFA683',
    shadowRx: 80, handScale: 1.45,
    joints: {
      pelvis: [0, -284], hipL: [-26, -280], hipR: [26, -280], kneeL: [-27, -152], kneeR: [27, -152], ankleL: [-28, -30], ankleR: [28, -30],
      neck: [0, -468], headPivot: [0, -490], shoulderL: [-82, -452], shoulderR: [82, -452], elbowL: [-95, -362], elbowR: [95, -362],
      wristL: [-100, -276], wristR: [100, -276]
    },
    sole: [[-16, 26], [40, 26]],
    rest: {armLL: -5, armRL: 5, lidL: 0.32, lidR: 0.32, lidBL: 0.06, lidBR: 0.06, blush: 0.18},
    head: {
      d: 'M0 -651 C38 -651 62 -633 64 -597 C66 -575 66 -557 62 -539 C58 -517 50 -501 34 -491 C22 -485 -22 -485 -34 -491 C-50 -501 -58 -517 -62 -539 C-66 -557 -66 -575 -64 -597 C-62 -633 -38 -651 0 -651 Z',
      crown: [0, -640], shadeDX: 10, shadeDY: 6,
      lines: ['M0 -490 L0 -496', 'M-48 -514 C-42 -503 -35 -496 -27 -493', 'M-17 -527 C-21 -519 -21 -514 -18 -510'],
      extras(g) { S.path(g, 'M-62 -545 C-58 -508 -34 -487 0 -487 C34 -487 58 -508 62 -545 C52 -522 32 -504 0 -503 C-32 -504 -52 -522 -62 -545 Z', '#64748B', null, {opacity: 0.16});
        S.path(g, 'M-20 -522 C-14 -527 14 -527 20 -522 C14 -515 -14 -515 -20 -522 Z', '#64748B', null, {opacity: 0.12}); }
    },
    ear: {d: 'M60 -568 C70 -575 79 -565 78 -550 C77 -537 70 -529 60 -532 Z', helix: 'M64 -562 C71 -564 74 -554 72 -546 C70 -540 66 -540 65 -543', inner: 'M68 -556 C70 -552 70 -548 68 -545'},
    hair: {
      color: '#A1A7B0', shade: '#6B7280', sheenColor: '#F3F4F6', strandColor: '#4B5563',
      back: 'M-67 -598 C-71 -640 -36 -673 4 -673 C46 -673 73 -640 67 -598 C67 -588 65 -578 63 -570 L-63 -570 C-67 -578 -67 -588 -67 -598 Z',
      main: 'M-65 -588 C-71 -632 -40 -667 4 -669 C48 -669 75 -638 67 -588 C63 -603 53 -614 39 -616 C26 -618 14 -612 6 -601 C0 -612 -18 -618 -34 -614 C-50 -610 -60 -600 -65 -588 Z',
      front: 'M-36 -612 C-30 -648 16 -664 53 -641 C59 -636 63 -628 63 -619 C51 -634 27 -639 11 -626 C3 -618 -18 -606 -36 -612 Z',
      frontTop: 'M-36 -612 C-30 -648 16 -664 53 -641 C59 -636 63 -628 63 -619',
      frontTips: 'M63 -619 C51 -634 27 -639 11 -626 C3 -618 -18 -606 -36 -612',
      strands: ['M-42 -628 C-22 -650 8 -657 40 -647', 'M-54 -606 C-46 -631 -30 -647 -10 -655', 'M22 -622 C36 -630 50 -628 61 -615', 'M-60 -594 C-58 -604 -54 -612 -48 -618'],
      frontStrands: ['M-24 -616 C-8 -636 20 -646 48 -636', 'M-6 -620 C10 -634 30 -638 50 -630'],
      sheen: ['M-30 -645 C-10 -659 20 -661 42 -650', 'M-50 -622 C-46 -630 -40 -636 -34 -640']
    },
    face: {
      eyeY: -559, eyeDX: 25, eyeRX: 10, eyeRY: 8, irisR: 5.6, pupilR: 3, irisColor: '#3B5163',
      browY: -579, browDX: 8, browLen: 30, browW: 6.2, browArch: 1.2, browColor: '#3F4651',
      nose: 'M-2 -557 C0 -545 9 -535 7 -528 C4.5 -523 -3 -523.5 -8 -527',
      noseMicro: 'M-6 -538 C-7 -534 -7 -531 -6 -528',
      noseShadow: 'M-9 -522.5 C-3 -517.5 5 -517.5 9 -522.5 C5 -520.5 -3 -520.5 -9 -522.5 Z',
      mouthY: -508, mouthScale: 1.18, cheekDX: 38, cheekY: -531, templeX: 64
    },
    glasses: null,
    draw: {
      legUpper(g, s, ctx) { const J = ctx.J; limb(g, ctx, J['hip' + s], 21, J['knee' + s], 17, '#30333B', '#1E2026');
        S.line(g, `M${J['hip' + s][0] + mirror(s, 4)} -250 L${J['knee' + s][0] + mirror(s, 3)} -160`, 'micro', '#5A606B', {opacity: 0.9}); },
      legLower(g, s, ctx) { const J = ctx.J; limb(g, ctx, J['knee' + s], 17, J['ankle' + s], 14.5, '#30333B', '#1E2026', true);
        S.line(g, `M${J['knee' + s][0] + mirror(s, 3)} ${J['knee' + s][1] + 10} L${J['ankle' + s][0] + mirror(s, 2)} ${J['ankle' + s][1] - 10}`, 'micro', '#5A606B', {opacity: 0.9}); },
      foot(g, s, ctx) {
        ctx.crescent(g, 'M-13 -6 C-15 4 -16 14 -15 20 L36 20 C42 20 44 14 38 9 C30 4 18 2 10 -6 C4 -12 -9 -11 -13 -6 Z', '#25252B', '#0E0E10', 3, 3);
        S.path(g, 'M-16 19 L40 19 C43 21 42 26 38 26 L-14 26 C-18 26 -18 21 -16 19 Z', '#5B3A26', 'outer');
        S.line(g, 'M21 8 C27 9 32 11 34.5 14.5', null, '#FFFFFF', {'stroke-width': 2.2, opacity: 0.55});
        ['M4 -2 L10 2', 'M7 1 L13 5'].forEach((d) => S.line(g, d, 'micro', '#9CA3AF'));
        S.line(g, 'M-10 10 C0 6 10 7 18 9', 'micro', '#52525B');
      },
      torso(g, ctx) {
        const body = 'M-52 -470 C-76 -470 -92 -460 -94 -436 C-96 -400 -90 -340 -84 -296 C-82 -284 -82 -270 -80 -254 C-40 -246 40 -246 80 -254 C82 -270 82 -284 84 -296 C90 -340 96 -400 94 -436 C92 -460 76 -470 52 -470 C30 -476 -30 -476 -52 -470 Z';
        ctx.crescent(g, body, '#2E3139', '#1A1C21', 10, 4);
        S.path(g, 'M-25 -476 L25 -476 L7 -322 L-7 -322 Z', '#F8FAFC', 'mid');
        S.line(g, 'M0 -460 L0 -330', 'micro', '#CBD5E1');
        // oversized mustard tie
        const tie = 'M-7 -456 L7 -456 L17 -352 L0 -330 L-17 -352 Z';
        ctx.crescent(g, tie, C.mustard, '#B88A05', 5, 2, 'mid');
        for (let y = -440; y < -350; y += 14) S.line(g, `M-11 ${y + 8} L11 ${y - 2}`, null, '#A16207', {'stroke-width': 2, opacity: 0.55});
        S.line(g, 'M-4 -450 L-11 -360', null, '#FDE68A', {'stroke-width': 2, opacity: 0.8});
        // lapels
        ['L', 'R'].forEach((s) => {
          const m = (x) => mirror(s, x);
          const d = `M${m(-22)} -476 L${m(-46)} -461 L${m(-39)} -446 L${m(-53)} -433 L${m(-8)} -318 Z`;
          S.path(g, d, s === 'L' ? '#3A3E47' : '#2A2D34', 'mid');
          S.line(g, `M${m(-40)} -446 L${m(-30)} -444`, 'micro');
        });
        S.svg('circle', {cx: -36, cy: -414, r: 4.4, fill: C.gold, stroke: S.INK, 'stroke-width': S.LINE.micro}, g);
        S.svg('circle', {cx: -37.4, cy: -415.6, r: 1.3, fill: '#FFFFFF', opacity: 0.9}, g);
        // pocket square + welt
        S.path(g, 'M36 -399 L41 -414 L47 -403 L53 -416 L59 -401 Z', C.crimson, 'micro');
        S.line(g, 'M32 -398 L66 -402', 'mid');
        // front edges, buttons, pockets
        S.line(g, 'M-8 -318 C-10 -298 -12 -276 -18 -252', 'mid'); S.line(g, 'M8 -318 C12 -298 16 -276 22 -254', 'mid');
        [[-3, -302], [-5, -278]].forEach(([x, y]) => { S.svg('circle', {cx: x, cy: y, r: 3.6, fill: '#1A1C21', stroke: S.INK, 'stroke-width': S.LINE.micro}, g); });
        S.path(g, 'M-74 -304 L-38 -306 L-37 -297 L-73 -295 Z', '#2A2D34', 'micro'); S.path(g, 'M38 -306 L74 -304 L73 -295 L37 -297 Z', '#2A2D34', 'micro');
        S.line(g, 'M-90 -440 C-86 -458 -74 -466 -54 -468', null, '#5A606C', {'stroke-width': 3, opacity: 0.95});
        S.line(g, 'M-70 -380 C-66 -366 -64 -352 -66 -338', 'micro', '#4A4F5A');
      },
      neck(g, ctx) {
        const nk = 'M-19 -510 L-20 -466 C-8 -460 8 -460 20 -466 L19 -510 Z';
        ctx.crescent(g, nk, ctx.cfg.skin, ctx.cfg.skinShade, 6, 0, 'mid');
        S.path(g, 'M-19 -500 C-8 -484 8 -484 19 -498 L19 -510 L-19 -510 Z', ctx.cfg.skinShade);
        S.path(g, 'M-23 -482 C-12 -474 12 -474 23 -482 L24 -470 C12 -464 -12 -464 -24 -470 Z', '#F8FAFC', 'mid');
        S.path(g, 'M-9 -470 L9 -470 L6 -455 L-6 -455 Z', '#D9A406', 'mid');
        S.path(g, 'M-24 -476 L-3 -470 L-13 -455 Z', '#FFFFFF', 'mid');
        S.path(g, 'M24 -476 L3 -470 L13 -455 Z', '#F1F5F9', 'mid');
      },
      armUpper(g, s, ctx) { const J = ctx.J; limb(g, ctx, J['shoulder' + s], 19.5, J['elbow' + s], 16, '#2E3139', '#1A1C21');
        const e = J['elbow' + s]; S.line(g, `M${e[0] - 11} ${e[1] - 8} C${e[0] - 4} ${e[1] - 3} ${e[0] + 4} ${e[1] - 4} ${e[0] + 10} ${e[1] - 9}`, 'micro', '#4A4F5A');
        if (s === 'L') S.line(g, `M${J.shoulderL[0] - 17} ${J.shoulderL[1] + 8} C${J.shoulderL[0] - 19} ${J.shoulderL[1] + 34} ${e[0] - 16} ${e[1] - 32} ${e[0] - 15} ${e[1] - 8}`, null, '#5A606C', {'stroke-width': 2.5, opacity: 0.9}); },
      armLower(g, s, ctx) { const J = ctx.J; const e = J['elbow' + s], w = J['wrist' + s];
        const L = Math.hypot(w[0] - e[0], w[1] - e[1]), ux = (w[0] - e[0]) / L, uy = (w[1] - e[1]) / L;
        S.path(g, S.capsule(w[0] - ux * 14, w[1] - uy * 14, 12.2, w[0] - ux * 1, w[1] - uy * 1, 11.6), '#F8FAFC', 'mid');
        S.svg('circle', {cx: w[0] - ux * 7 + mirror(s, -6), cy: w[1] - uy * 7, r: 2.6, fill: C.gold, stroke: S.INK, 'stroke-width': 1}, g);
        limb(g, ctx, e, 16, [w[0] - ux * 22, w[1] - uy * 22], 14, '#2E3139', '#1A1C21', true);
        S.line(g, `M${e[0] - 10} ${e[1] + 16} C${e[0] - 4} ${e[1] + 22} ${e[0] + 3} ${e[1] + 22} ${e[0] + 9} ${e[1] + 17}`, 'micro', '#4A4F5A'); }
    }
  };
})(window.Studio = window.Studio || {});
