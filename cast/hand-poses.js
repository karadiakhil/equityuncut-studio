/* Six stylized editorial hands. Drawn right-hand, wrist at (0,0), fingers toward +y, thumb toward -x.
 * Each finger is a polyline stroked twice (ink outline pass, then skin pass), so bends stay smooth and every finger
 * keeps a clean contour where it crosses another. Palm is a filled, inked path. Left hands are mirrored at build.
 */
(function (S) {
  'use strict';
  // f: [points, radius, layer] layer 'back' = behind palm, 'front' = over palm. palm: path d. knuckles: micro lines.
  const P = {
    relaxed: {
      palm: 'M-10.5 1 C-13 8 -13.5 17 -11 23 C-8 27 6 28 10.5 23 C13.5 18 13 8 11 1 Z',
      f: [[[[7.6, 20], [8.6, 27.5], [7.4, 32]], 2.9, 'back'], [[[3.4, 21], [3.9, 31], [2.8, 36.5]], 3.2, 'back'],
        [[[-1.4, 21.5], [-1.6, 32.5], [-3.0, 37.5]], 3.3, 'back'], [[[-6.2, 20.5], [-7.4, 30.5], [-8.8, 34.5]], 3.2, 'back'],
        [[[-9.5, 7], [-14.5, 14.5], [-13.5, 21]], 3.6, 'front']],
      knuckles: ['M-7 18.5 C-5.5 19.6 -3.5 19.6 -2 18.6', 'M1.5 18.8 C3 19.8 5 19.8 6.4 18.6']
    },
    'open-explain': {
      palm: 'M-11 1 C-13.5 8 -14 17 -11.5 23 C-8 27.5 7 28 11 23 C14 18 13.5 8 11.5 1 Z',
      f: [[[[8, 19.5], [12.4, 31]], 3.0, 'back'], [[[3.6, 21], [5.6, 37]], 3.25, 'back'],
        [[[-1.4, 21.5], [-2.2, 39.5]], 3.35, 'back'], [[[-6.6, 20.5], [-10.2, 36]], 3.25, 'back'],
        [[[-10, 8.5], [-18, 14.5], [-23, 20.5]], 3.6, 'front']],
      knuckles: ['M-4.5 13 C-1 15.5 3 15.5 6 13', 'M-9.4 10.5 C-10.6 12.5 -10.6 15 -9.6 17'],
      palmLine: 'M-8 17.5 C-3 20.5 4 20 9 16'
    },
    point: {
      palm: 'M-11 1 C-13.5 8 -13.5 18 -11 24 C-7.5 28 7 28.5 11 24 C14 18 13.5 8 11.5 1 Z',
      f: [[[[-6.4, 20], [-7.4, 44]], 3.3, 'back'],
        [[[-1.2, 22], [-0.6, 27.2], [-3.4, 28.6]], 3.25, 'front'], [[[3.8, 21.4], [4.4, 26.6], [1.8, 28.2]], 3.15, 'front'],
        [[[8.2, 19.6], [8.6, 24.4], [6.2, 26]], 2.9, 'front'],
        [[[-10.5, 8], [-8.6, 17.5], [-3.6, 20.5]], 3.5, 'front']],
      knuckles: ['M-7.6 33 C-6.4 34 -5 34 -4 33']
    },
    'fist-slam': {
      palm: 'M-12 0 C-14.5 7 -14.5 17 -12 22 C-8 26 8 26.5 12 22 C14.6 17 14.4 7 12 0 Z',
      f: [[[[-8.2, 15.5], [-8.6, 23.5]], 3.5, 'front'], [[[-2.8, 16.5], [-2.8, 25.5]], 3.6, 'front'],
        [[[2.8, 16.5], [3.0, 25]], 3.55, 'front'], [[[8.2, 15.5], [8.2, 22.5]], 3.3, 'front'],
        [[[-12, 6.5], [-10.6, 14.5], [-3.6, 14.2]], 3.6, 'front']],
      knuckles: ['M-10.6 18.5 L-6 18.5', 'M-5.2 19.5 L-0.4 19.5', 'M0.4 19.5 L5.3 19.5', 'M6 18.5 L10.4 18.5']
    },
    'grip-prop': {
      palm: 'M-11 1 C-13.5 8 -13.5 16 -11.5 21 C-8 24.5 7 25 11 21 C13.6 16 13.4 8 11.5 1 Z',
      f: [[[[8, 17], [10.6, 25], [7, 29.5]], 3.0, 'back'], [[[3.4, 18.5], [5.8, 28], [1.8, 32]], 3.25, 'back'],
        [[[-1.4, 19], [0.4, 29], [-3.6, 33]], 3.35, 'back'], [[[-6.4, 18], [-5.4, 27.5], [-9, 31]], 3.25, 'back'],
        [[[-10.4, 6.5], [-12.6, 16], [-6.6, 25]], 3.6, 'front']],
      knuckles: ['M-7 15.5 C-4 17 0 17 3.4 15.6'],
      mount: [-1, 27]
    },
    'pinch-skeptical': {
      palm: 'M-10.5 1 C-13 8 -13.5 17 -11 23 C-7.5 27 6.5 27.5 10.5 23 C13.5 18 13 8 11 1 Z',
      f: [[[[8, 19.6], [11.2, 31.6]], 2.95, 'back'], [[[3.6, 21], [5.2, 37]], 3.2, 'back'],
        [[[-1.2, 21.4], [-0.6, 38.5]], 3.3, 'back'],
        [[[-6.2, 20.4], [-10.6, 29], [-9.6, 34.6]], 3.2, 'front'],
        [[[-9.8, 7.5], [-16, 17], [-11.4, 33.4]], 3.5, 'front']],
      knuckles: ['M-12.8 30.5 C-11.8 31.6 -10.6 31.8 -9.6 31.4']
    }
  };
  S.HAND_POSES = Object.keys(P);

  function finger(g, pts, r, skin, k) {
    const d = 'M' + pts.map((p) => p[0] + ' ' + p[1]).join(' L');
    S.path(g, d, 'none', null, {stroke: S.INK, 'stroke-width': (2 * r + S.LINE.mid * k * 2).toFixed(2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
    S.path(g, d, 'none', null, {stroke: skin, 'stroke-width': (2 * r).toFixed(2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
  }

  // Draw one pose into g. opts: {skin, shade, mirror}
  S.drawHand = function (g, pose, opts) {
    const def = P[pose]; const skin = opts.skin, shade = opts.shade; const k = opts.k || 1;   // k: 1/handScale keeps ink weights true
    const h = S.g(g, {'data-pose': pose, transform: opts.mirror ? 'scale(-1,1)' : null});
    def.f.filter((f) => f[2] === 'back').forEach((f) => finger(h, f[0], f[1], skin, k));
    S.path(h, def.palm, skin, S.LINE.mid * k);
    // cel shade on the palm's unlit edge
    const cid = S.uid('palm');
    S.path(S.svg('clipPath', {id: cid}, opts.defs), def.palm);
    const sh = S.g(h, {'clip-path': `url(#${cid})`});
    S.path(sh, def.palm, shade, null, {opacity: 0.6, transform: 'translate(5.5 3)'});
    S.path(sh, def.palm, skin, null, {transform: 'translate(-2 -1.5)'});
    S.path(h, def.palm, 'none', S.LINE.mid * k);
    def.f.filter((f) => f[2] === 'front').forEach((f) => finger(h, f[0], f[1], skin, k));
    (def.knuckles || []).forEach((d) => S.line(h, d, S.LINE.micro * k));
    if (def.palmLine) S.line(h, def.palmLine, S.LINE.micro * k, null, {opacity: 0.7});
    return h;
  };
  S.handMount = (pose) => (P[pose].mount || [0, 22]);
})(window.Studio = window.Studio || {});
