/* Action choreography: reusable acting on top of CharacterRig. Every function adds tweens/track keys at absolute times.
 *   pose(tl, ch, vals, t, dur, ease)        tween any rig params
 *   look(tl, ch, turn, t, dur)              2.5D head turn with hair follow-through
 *   walkTo(tl, ch, fromX, toX, start, dur)  4-phase walk (contact > down > passing > up), knee bend, heel-toe roll,
 *                                           opposite arm swing, auto-ground pelvis bob, hair bounce 2 frames behind
 *   speak(tl, ch, cfg)                      visemes + nods on stressed words + brow lifts + rhythmic hand gestures
 *   react(tl, ch, emotion, t)               anticipation > squash/stretch > new face (back.out(1.7)) > settle
 *   slamProp(tl, ch, cfg)                   wind-up, smear, impact (desk shake, camera shake, burst, speed lines), settle
 *   enterStage(tl, ch, style, t, cfg)       'walk' | 'fold' (cardboard rotateX fold-up) | 'slide'
 */
(function (S) {
  'use strict';
  const A = S.Act = {};
  const LEG = ['legLU', 'legLL', 'footL', 'legRU', 'legRL', 'footR'];

  A.pose = function (tl, ch, vals, t, dur, ease) { return tl.to(ch.p, Object.assign({duration: dur == null ? 0.3 : dur, ease: ease || 'power2.inOut'}, vals), t); };
  A.hand = function (ch, side, pose, t) { ch.tracks['hand' + side].set(t, pose); };
  A.blink = function (ch, t) { ch.extraBlinks.push(t); };
  A.hairFollow = function (tl, ch, t, amount) {   // secondary motion: hair lags 2-3 frames, overshoots, settles
    tl.to(ch.p, {hairLag: -amount, duration: 0.08, ease: 'power1.out'}, t + 0.066);
    tl.to(ch.p, {hairLag: 0, duration: 0.55, ease: 'elastic.out(1.1, 0.4)'}, t + 0.15);
  };
  A.look = function (tl, ch, turn, t, dur) {
    dur = dur || 0.28;
    tl.to(ch.p, {turn, duration: dur, ease: 'power3.inOut'}, t);
    tl.to(ch.p, {head: -2, duration: dur * 0.5, ease: 'power2.out'}, t);
    tl.to(ch.p, {head: 0, duration: dur * 0.8, ease: 'power2.inOut'}, t + dur * 0.5);
    A.hairFollow(tl, ch, t, 7 * Math.sign(turn - (ch.__lastTurn || 0) || 1));
    ch.__lastTurn = turn;
  };

  // ---- walk --------------------------------------------------------------------------------------------------------
  // [leadU, leadL, leadF, trailU, trailL, trailF, fwdArmU, fwdArmL, backArmU, backArmL, hairBounce]  (authored facing right)
  const PH = {
    contact: [-24, 4, -16, 20, 14, 22, -20, -22, 18, -8, 0],
    down: [-15, 24, -2, 16, 38, 34, -14, -18, 12, -10, 3.5],
    passing: [2, 6, 0, -6, 62, 18, -2, -14, 2, -12, 1],
    up: [16, 2, 10, -24, 26, -10, 10, -10, -10, -16, -2.5]
  };
  A.walkTo = function (tl, ch, fromX, toX, start, dur, o) {
    o = Object.assign({turn: 0.55, settle: 0.3, lean: 4}, o || {});
    const dir = Math.sign(toX - fromX) || 1, J = ch.J, sc = ch.p.scale;
    const leg = Math.hypot(J.kneeR[0] - J.hipR[0], J.kneeR[1] - J.hipR[1]) + Math.hypot(J.ankleR[0] - J.kneeR[0], J.ankleR[1] - J.kneeR[1]);
    const stride = (Math.sin(24 * Math.PI / 180) + Math.sin(20 * Math.PI / 180)) * leg * 0.95 * sc;
    const steps = Math.max(2, Math.round(Math.abs(toX - fromX) / stride)); const sd = dur / steps;
    tl.set(ch.p, {facing: dir}, start);
    tl.fromTo(ch.p, {x: fromX}, {x: toX, duration: dur, ease: 'none'}, start);
    tl.to(ch.p, {torso: o.lean, head: -o.lean * 0.5, duration: 0.25, ease: 'power2.out'}, start);
    tl.to(ch.p, {turn: o.turn, duration: 0.25, ease: 'power2.out'}, start);
    const put = (t, ph, lead, d, ease) => {
      const v = PH[ph]; const trail = lead === 'R' ? 'L' : 'R';
      const fwdArm = lead === 'R' ? 'L' : 'R', backArm = lead;
      const vals = {};
      vals['leg' + lead + 'U'] = v[0]; vals['leg' + lead + 'L'] = v[1]; vals['foot' + lead] = v[2];
      vals['leg' + trail + 'U'] = v[3]; vals['leg' + trail + 'L'] = v[4]; vals['foot' + trail] = v[5];
      vals['arm' + fwdArm + 'U'] = v[6]; vals['arm' + fwdArm + 'L'] = v[7]; vals['arm' + backArm + 'U'] = v[8]; vals['arm' + backArm + 'L'] = v[9];
      tl.to(ch.p, Object.assign({duration: d, ease: ease || 'sine.inOut'}, vals), t);
      tl.to(ch.p, {hairBounce: v[10], duration: d, ease: 'sine.inOut'}, t + 0.07);   // hair 2 frames behind
    };
    // step in from rest to the first contact
    const q0 = Math.min(0.18, sd * 0.45), sd2 = (dur - q0) / steps;
    put(start, 'contact', 'R', q0, 'power2.out');
    for (let i = 0; i < steps; i++) {
      const t0 = start + q0 + i * sd2, lead = i % 2 ? 'L' : 'R', q = sd2 / 4;
      put(t0 + q * 0, 'down', lead, q); put(t0 + q * 1, 'passing', lead === 'R' ? 'R' : 'L', q);
      put(t0 + q * 2, 'up', lead, q); put(t0 + q * 3, 'contact', lead === 'R' ? 'L' : 'R', q);
    }
    // settle to a stand
    const end = start + dur, rest = ch.cfg.rest || {};
    const r = {torso: 0, head: 0, hairBounce: 0, armLU: 0, armRU: 0, armLL: rest.armLL || 0, armRL: rest.armRL || 0};
    LEG.forEach((k) => { r[k] = 0; });
    tl.to(ch.p, Object.assign({duration: o.settle, ease: 'back.out(1.6)'}, r), end);
    A.hairFollow(tl, ch, end, -5);
    ch.__walk = {start, dur, steps, sd};
    return end + o.settle;
  };

  // ---- speech -----------------------------------------------------------------------------------------------------------
  A.speak = function (tl, ch, o) {
    o = Object.assign({gestures: true, side: 'R', gesture: 'open-explain', armU: -38, armL: -96}, o || {});
    let keys, words;
    if (o.alignment) { keys = S.LipSync.fromAlignment(o.alignment, o.offset); words = []; }
    else if (o.words) { words = o.words; keys = S.LipSync.fromWords(words, o.offset); }
    else { words = S.LipSync.wordsFromLines(o.lines); keys = S.LipSync.fromWords(words, 0); }
    keys.forEach((k) => ch.tracks.viseme.set(k.t, k.v));
    const t0 = keys[0].t, t1 = keys[keys.length - 1].t;
    ch.tracks.viseme.set(t1 + 0.01, null);
    let stress = words.filter((w) => w.stress);
    if (!stress.length) stress = words.filter((w, i) => w.word.replace(/\W/g, '').length >= 5 || i === 0);
    stress.forEach((w, i) => {
      tl.to(ch.p, {head: 3.5, duration: 0.09, ease: 'power2.out'}, w.start - 0.04);
      tl.to(ch.p, {head: 0, duration: 0.3, ease: 'power2.inOut'}, w.start + 0.07);
      tl.to(ch.p, {browL: -5, browR: -5, duration: 0.08, ease: 'power2.out'}, w.start - 0.05);
      tl.to(ch.p, {browL: 0, browR: 0, duration: 0.35, ease: 'power2.inOut'}, w.start + 0.18);
      if (o.gestures) { const s = o.side;
        tl.to(ch.p, {['arm' + s + 'L']: o.armL + (i % 2 ? -12 : 10), ['hand' + s]: i % 2 ? -10 : 8, duration: 0.12, ease: 'power2.out'}, w.start - 0.06);
        tl.to(ch.p, {['arm' + s + 'L']: o.armL, ['hand' + s]: 0, duration: 0.3, ease: 'power2.inOut'}, w.start + 0.08); }
    });
    if (o.gestures) {
      const s = o.side, rest = ch.cfg.rest || {};
      A.hand(ch, s, o.gesture, t0 - 0.2);
      tl.to(ch.p, {['arm' + s + 'U']: o.armU, ['arm' + s + 'L']: o.armL, duration: 0.3, ease: 'back.out(1.4)'}, t0 - 0.25);
      tl.to(ch.p, {['arm' + s + 'U']: 0, ['arm' + s + 'L']: rest['arm' + s + 'L'] || 0, ['hand' + s]: 0, duration: 0.4, ease: 'power2.inOut'}, t1 + 0.15);
      A.hand(ch, s, ch.cfg.restHand || 'relaxed', t1 + 0.4);
    }
    return {t0, t1, keys, words};
  };

  // ---- reactions -----------------------------------------------------------------------------------------------------------
  const BASE = {browL: 0, browR: 0, browInner: 0, browTiltL: 0, browTiltR: 0, lidBL: 0, lidBR: 0, pupil: 1, lookX: 0, lookY: 0};
  A.EXPR = {
    neutral: {mood: 'REST'},
    deadpan: {browL: 3, browR: 3, browInner: -2, lidL: 0.5, lidR: 0.5, lidBL: 0.12, lidBR: 0.12, pupil: 0.92, mood: 'flat'},
    suspicious: {browL: 5, browR: -6, browInner: 10, browTiltR: -6, lidL: 0.58, lidR: 0.3, lidBL: 0.28, lidBR: 0.08, lookX: 0.7, mood: 'flat'},
    shocked: {browL: -11, browR: -11, browInner: -4, lidL: 0, lidR: 0, pupil: 0.6, mood: 'gasp', blush: 0.15},
    smug: {browL: -8, browR: 2, browInner: 4, browTiltL: -8, lidL: 0.46, lidR: 0.52, lidBL: 0.16, lidBR: 0.16, mood: 'smirk'},
    panicked: {browL: -9, browR: -9, browInner: -15, lidL: 0, lidR: 0, pupil: 0.68, mood: 'grimace', sweat: true},
    'dollar-eyes': {browL: -9, browR: -9, browInner: -3, lidL: 0, lidR: 0, pupil: 1.15, mood: 'grin', dollar: true, blush: 0.65},
    happy: {browL: -4, browR: -4, lidL: 0.1, lidR: 0.1, lidBL: 0.32, lidBR: 0.32, mood: 'grin'}
  };
  A.react = function (tl, ch, emotion, t, o) {
    o = Object.assign({big: emotion !== 'deadpan'}, o || {});
    const e = A.EXPR[emotion]; if (!e) throw new Error('unknown emotion ' + emotion);
    const rest = ch.cfg.rest || {};
    const face = Object.assign({}, BASE, {lidL: rest.lidL == null ? 0.12 : rest.lidL, lidR: rest.lidR == null ? 0.12 : rest.lidR, blush: rest.blush == null ? 0.35 : rest.blush});
    for (const k in e) if (k in face || k in ch.p) face[k] = e[k];
    delete face.mood; delete face.sweat; delete face.dollar;
    const ant = o.big ? 0.08 : 0.0;
    if (o.big) {   // anticipation: brows dip, body compresses
      tl.to(ch.p, {browL: '+=3', browR: '+=3', squash: 0.05, duration: ant, ease: 'power2.in'}, t);
      tl.to(ch.p, {squash: -0.045, duration: 0.12, ease: 'power2.out'}, t + ant);
      tl.to(ch.p, {squash: 0, duration: 0.45, ease: 'elastic.out(1, 0.45)'}, t + ant + 0.12);
    }
    tl.to(ch.p, Object.assign({duration: o.big ? 0.32 : 0.45, ease: o.big ? 'back.out(1.7)' : 'power2.inOut'}, face), t + ant);
    ch.tracks.mood.set(t + ant, e.mood || 'REST');
    ch.tracks.sweat.set(t + ant, !!e.sweat);
    ch.tracks.dollar.set(t + ant, !!e.dollar);
    if (o.big) A.hairFollow(tl, ch, t + ant, 6);
    if (emotion === 'deadpan') A.blink(ch, t + 0.5);
    return t + ant + 0.35;
  };

  // ---- slam a prop onto a surface -----------------------------------------------------------------------------------------
  A.slamProp = function (tl, ch, o) {
    o = Object.assign({side: 'R', start: 0, held: null, landed: null, desk: null, camera: null, fx: null, at: [960, 600], burstText: 'SLAM!'}, o);
    const s = o.side, t0 = o.start, t1 = t0 + 0.42, hit = t1 + 0.1;
    A.hand(ch, s, 'grip-prop', t0);
    if (o.held) tl.fromTo(o.held, {opacity: 0}, {opacity: 1, duration: 0.01}, t0);
    // wind-up (anticipation)
    tl.to(ch.p, {['arm' + s + 'U']: -158, ['arm' + s + 'L']: -28, ['hand' + s]: -20, torso: -7, head: -5, squash: -0.03, duration: 0.36, ease: 'power2.out'}, t0);
    tl.to(ch.p, {browL: 4, browR: 4, browInner: 10, duration: 0.2, ease: 'power2.out'}, t0);
    ch.tracks.mood.set(t0, 'grimace');
    // smash (fast, 3 frames)
    tl.to(ch.p, {['arm' + s + 'U']: -52, ['arm' + s + 'L']: -46, ['hand' + s]: 14, torso: 12, head: 6, squash: 0.07, duration: 0.1, ease: 'power4.in'}, t1);
    if (o.smear) tl.fromTo(o.smear, {opacity: 0}, {keyframes: [{opacity: 0.9, duration: 0.05}, {opacity: 0, duration: 0.08}]}, t1 + 0.02);
    // impact
    if (o.held) tl.set(o.held, {opacity: 0}, hit);
    if (o.landed) {
      tl.fromTo(o.landed, {opacity: 0}, {opacity: 1, duration: 0.01}, hit);
      tl.fromTo(o.landed, {scaleY: 0.72, scaleX: 1.18, transformOrigin: '50% 100%'}, {scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1.2, 0.35)'}, hit);
    }
    if (o.desk) { const r = S.rng(77); for (let i = 0; i < 6; i++) tl.to(o.desk, {y: (i % 2 ? -1 : 1) * (7 - i) * (0.6 + r() * 0.4), duration: 0.045, ease: 'none'}, hit + i * 0.045); tl.to(o.desk, {y: 0, duration: 0.1}, hit + 0.27); }
    if (o.camera) o.camera.impactShake(tl, hit, 22, 0.5);
    if (o.fx) { S.MG.impactBurst(tl, o.fx, {x: o.at[0], y: o.at[1] - 40, r: 150, start: hit, text: o.burstText, color: S.PALETTE.mustard});
      S.MG.speedLines(tl, o.fx, {x: o.at[0], y: o.at[1] - 40, start: hit, r0: 210, count: 30}); }
    // settle
    tl.to(ch.p, {torso: 4, head: 1, squash: 0, ['arm' + s + 'U']: -40, ['arm' + s + 'L']: -40, duration: 0.6, ease: 'elastic.out(1, 0.5)'}, hit + 0.05);
    A.hairFollow(tl, ch, hit, -9);
    ch.tracks.mood.set(hit + 0.15, 'smirk');
    tl.to(ch.p, {browL: -6, browR: 0, browInner: 2, duration: 0.3, ease: 'power2.out'}, hit + 0.15);
    return hit;
  };

  // ---- entrances ---------------------------------------------------------------------------------------------------------------
  A.enterStage = function (tl, ch, style, t, o) {
    o = o || {};
    if (style === 'walk') return A.walkTo(tl, ch, o.fromX, o.toX != null ? o.toX : ch.p.x, t, o.dur || 2);
    if (style === 'fold') {
      tl.fromTo(ch.p, {fold: -88, alpha: 0}, {fold: 0, alpha: 1, duration: 0.55, ease: 'back.out(1.5)'}, t);
      tl.fromTo(ch.p, {squash: 0.12}, {squash: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)'}, t + 0.3);
      A.hairFollow(tl, ch, t + 0.35, 8); return t + 0.9;
    }
    if (style === 'slide') {
      tl.fromTo(ch.p, {x: o.fromX, lean: -8 * Math.sign(ch.p.x - o.fromX)}, {x: o.toX != null ? o.toX : ch.p.x, lean: 0, duration: o.dur || 0.6, ease: 'power3.out'}, t);
      A.hairFollow(tl, ch, t + (o.dur || 0.6) * 0.8, 8); return t + (o.dur || 0.6);
    }
    throw new Error('unknown entrance ' + style);
  };

  // idle life between beats: slow weight shift, finite
  A.idle = function (tl, ch, start, end, seed, amp) {   // weight shift + a slow head drift, finite (act7 alive idle)
    const r = S.rng(seed || S.hash(ch.id)); let t = start; amp = amp == null ? 1 : amp;
    while (t < end - 0.8) { const d = 1.2 + r() * 1.2, dd = Math.min(d, end - t);
      tl.to(ch.p, {lean: (r() - 0.5) * 1.6 * amp, duration: dd, ease: 'sine.inOut'}, t);
      if (ch.cfg.paper) tl.to(ch.p, {neck: (r() - 0.5) * 3, duration: dd * 0.9, ease: 'sine.inOut'}, t + 0.15);
      t += d; }
  };
})(window.Studio = window.Studio || {});
