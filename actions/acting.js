/* Data-driven acting on top of Action choreography (act7 port: story_video/tools/puppet/act7.mjs).
 * Scene specs list keys; Direct turns them into rig tweens, hand tracks and visemes.
 *
 * What changed from the first version (engine-fix-01, "hands look mechanical"):
 *   - every gesture is a set of WRIST TARGETS solved with analytical 2-bone IK per character (act7 solveTwoBoneIK),
 *     never hand-typed joint angles, so a pose lands the same on any body;
 *   - joints move in a cascade (act7 / overlapping action): upper arm leads, the forearm follows ~2 frames later with a
 *     small overshoot, the wrist/hand ~2 frames after that with more drag (follow-through). Angle tweens make the wrist
 *     travel on an eased ARC, not a straight line;
 *   - the two hands never move on the same frame (the second side starts 0.06-0.1 s later) and big moves get an
 *     anticipation (the arm dips the other way first) plus a body lean toward the gesture and a counter head tilt;
 *   - holds are "moving holds": a slow drift of a couple of degrees keeps the arms alive, never a dead freeze;
 *   - typing: the figure is seated at a workstation (cast/paper8.js), wrists rest on the keyboard, fingers tap in an
 *     irregular alternating rhythm with small hand rotations, occasional pauses.
 * Eases: settle, snap, heavy, smooth, anticipate (dip, then overshoot), overshoot.
 * Gestures: idle, type, explain, point, hands-up, fold, phone, wave.
 */
(function (S) {
  'use strict';
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const norm = (a) => { while (a > 180) a -= 360; while (a < -180) a += 360; return a; };

  // targets per gesture, in TORSO coordinates for the RIGHT side; X is mirrored for the left side (X > 0 = outward).
  // hand: relative wrist angle; pose: hand shape; null = rest. Paper bodies: shoulders (+-56,-352), head centre (0,-482).
  // dir: WORLD finger direction for the right hand in degrees (90 = down, 0 = outward, -90 = up); the left hand mirrors it
  // (act7 world lock: hand = dir - 90 - (upper + forearm)). No dir = the hand continues the forearm (relaxed hang, point).
  const G = {
    idle: {R: {X: 74, Y: -150, pose: 'relaxed'}, L: {X: 72, Y: -154, pose: 'relaxed'}},
    explain: {R: {X: 132, Y: -296, dir: -28, pose: 'open-explain'}, L: {X: 86, Y: -214, pose: 'relaxed'}},
    point: {R: {X: 222, Y: -364, pose: 'point'}, L: {X: 78, Y: -170, pose: 'relaxed'}},
    'hands-up': {R: {X: 134, Y: -528, dir: -74, pose: 'open-explain'}, L: {X: 130, Y: -520, dir: -78, pose: 'open-explain'}},
    fold: {R: {X: -40, Y: -262, dir: 160, pose: 'fist-slam'}, L: {X: -34, Y: -274, dir: 160, pose: 'fist-slam'}},
    phone: {R: {X: 100, Y: -446, dir: -98, pose: 'grip-prop', held: 'phone'}, L: {X: 80, Y: -176, pose: 'relaxed'}},
    wave: {R: {X: 150, Y: -506, dir: -84, pose: 'open-explain'}, L: {X: 76, Y: -158, pose: 'relaxed'}},
    type: {R: {X: 34, Y: -200, dir: 98, pose: 'type'}, L: {X: 34, Y: -200, dir: 98, pose: 'type'}}
  };

  // legacy angle table (old sculpted rigs keep their look)
  const POSE = {
    idle: {armLU: 0, armLL: -6, armRU: 0, armRL: 6, handL: 'relaxed', handR: 'relaxed'},
    type: {armLU: -52, armLL: -96, armRU: -46, armRL: -102, handL: 'point', handR: 'point'},
    explain: {armLU: -10, armLL: -14, armRU: -44, armRL: -98, handL: 'relaxed', handR: 'open-explain'},
    point: {armLU: 6, armLL: -10, armRU: -82, armRL: -16, handL: 'relaxed', handR: 'point'},
    'hands-up': {armLU: -150, armLL: -14, armRU: -150, armRL: -14, handL: 'open-explain', handR: 'open-explain'},
    fold: {armLU: 26, armLL: -104, armRU: 22, armRL: -100, handL: 'fist-slam', handR: 'relaxed'},
    phone: {armLU: -18, armLL: -22, armRU: -126, armRL: -34, handL: 'relaxed', handR: 'grip-prop'},
    wave: {armLU: 2, armLL: -8, armRU: -160, armRL: -6, handL: 'relaxed', handR: 'open-explain'}
  };
  const EASE = {settle: 'power3.out', snap: 'power4.out', heavy: 'expo.out', smooth: 'sine.inOut', anticipate: 'back.out(1.7)', overshoot: 'back.out(1.7)'};
  const DUR = {settle: 0.36, snap: 0.2, heavy: 0.5, smooth: 0.42, anticipate: 0.34, overshoot: 0.32};

  Object.assign(S.Act.EXPR, {
    focused: {browL: 5, browR: 5, browInner: 8, lidL: 0.2, lidR: 0.2, mood: 'flat'},
    angry: {browL: 7, browR: 7, browInner: 16, browTiltL: 8, browTiltR: -8, lidL: 0.32, lidR: 0.32, mood: 'frown'},
    tired: {browL: 6, browR: 6, browInner: 4, lidL: 0.55, lidR: 0.58, lidBL: 0.16, lidBR: 0.16, mood: 'flat'},
    sad: {browL: 3, browR: 3, browInner: 10, browTiltL: 10, browTiltR: -10, lidL: 0.38, lidR: 0.38, mood: 'frown'},
    talk: {browL: -3, browR: -3, lidL: 0.08, lidR: 0.08, mood: 'REST'},
    whisper: {browL: 3, browR: -4, browInner: 6, lidL: 0.42, lidR: 0.34, mood: 'flat'}
  });

  // ---- analytical 2-bone IK (act7 solveTwoBoneIK) on the character's own joints -----------------------------------
  // returns {U, L} rig angles (deg, relative to the rest pose) that put side s's wrist at (tx, ty) in torso coords.
  // Elbows prefer to bow OUTWARD (front view: never across the chest) and slightly down.
  function ik(ch, s, tx, ty) {
    const J = ch.J, sh = J['shoulder' + s], el = J['elbow' + s], wr = J['wrist' + s];
    const L1 = Math.hypot(el[0] - sh[0], el[1] - sh[1]), L2 = Math.hypot(wr[0] - el[0], wr[1] - el[1]);
    const dx = tx - sh[0], dy = ty - sh[1], d0 = Math.hypot(dx, dy);
    const d = Math.max(Math.abs(L1 - L2) + 1, Math.min(L1 + L2 - 0.5, d0));
    const th = Math.atan2(dy, dx), a = Math.acos(S.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const out = s === 'R' ? 1 : -1, rest1 = Math.atan2(el[1] - sh[1], el[0] - sh[0]), rest2 = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
    let best = null;
    [1, -1].forEach((sg) => {
      const p1 = th + sg * a, ex = sh[0] + L1 * Math.cos(p1), ey = sh[1] + L1 * Math.sin(p1);
      const wx = sh[0] + d * Math.cos(th), wy = sh[1] + d * Math.sin(th);
      const p2 = Math.atan2(wy - ey, wx - ex);
      const U = norm((p1 - rest1) * R2D), L = norm((p2 - rest2) * R2D - U);
      const score = out * ex + ey * 0.25;
      if (!best || score > best.score) best = {U, L, score, ex, ey};
    });
    return best;
  }
  function target(ch, gname, s) {
    const g = G[gname] && G[gname][s];
    if (!g) return null;
    const k = s === 'R' ? 1 : -1;
    let X = g.X, Y = g.Y;
    if (gname === 'type' && ch.desk) { X = ch.desk.keyX; Y = ch.desk.wristT; }
    const sol = ik(ch, s, k * X, Y);
    const H = g.dir == null ? 0 : norm((s === 'R' ? g.dir : 180 - g.dir) - 90 - (sol.U + sol.L));
    return {U: sol.U, L: sol.L, H, pose: g.pose, held: g.held || null};
  }
  S.Direct_ik = ik;

  // cascade one arm: upper leads, forearm follows with overshoot, hand drags behind (overlapping action)
  function reachArm(tl, ch, s, tg, t, d, o) {
    const p = ch.p, U = 'arm' + s + 'U', L = 'arm' + s + 'L', H = 'hand' + s;
    const big = Math.abs(tg.U - (ch.__arm && ch.__arm[U] != null ? ch.__arm[U] : 0)) > 35;
    if (o.ant && big) {   // anticipation: a small dip the other way
      const prevU = ch.__arm && ch.__arm[U] != null ? ch.__arm[U] : 0, dir = Math.sign(tg.U - prevU) || 1;
      tl.to(p, {[U]: prevU - dir * 7, duration: 0.09, ease: 'power1.in'}, t);
      t += 0.09;
    }
    tl.to(p, {[U]: tg.U, duration: d, ease: o.ease === 'snap' ? 'power3.out' : 'power2.inOut'}, t);
    tl.to(p, {[L]: tg.L, duration: d * 1.08, ease: o.ease === 'heavy' || o.ease === 'smooth' ? 'power2.out' : 'back.out(1.35)'}, t + 0.045);
    tl.to(p, {[H]: tg.H, duration: d * 1.25, ease: 'back.out(2.2)'}, t + 0.09);
    ch.tracks['hand' + s].set(t + d * 0.45, tg.pose);
    ch.__arm = ch.__arm || {}; ch.__arm[U] = tg.U; ch.__arm[L] = tg.L; ch.__arm[H] = tg.H;
    return t + d * 1.3;
  }
  // moving hold: a slow drift of a few degrees through the hold, so the arm never freezes
  function drift(tl, ch, s, tg, t0, t1, seed) {
    if (t1 - t0 < 0.7) return;
    const r = S.rng(seed), p = ch.p, U = 'arm' + s + 'U', L = 'arm' + s + 'L', H = 'hand' + s;
    let t = t0;
    while (t < t1 - 0.5) {
      const d = Math.min(t1 - t, 0.9 + r() * 0.8);
      tl.to(p, {[U]: tg.U + (r() - 0.5) * 3.2, [L]: tg.L + (r() - 0.5) * 4.4, [H]: tg.H + (r() - 0.5) * 6, duration: d, ease: 'sine.inOut'}, t);
      t += d;
    }
  }
  // typing: irregular alternating taps; wrists stay on the keys
  function typeLoop(tl, ch, tg, start, end) {
    const r = S.rng(S.hash(ch.id + ':type:' + start.toFixed(2))), p = ch.p;
    let t = start, s = 'R';
    while (t < end - 0.25) {
      if (r() < 0.78) s = s === 'R' ? 'L' : 'R';
      const d = 0.075 + r() * 0.06, k = s === 'R' ? 1 : -1, base = tg[s];
      tl.to(p, {['hand' + s]: base.H + k * (6 + r() * 5), ['arm' + s + 'L']: base.L - k * (1.4 + r() * 1.4), duration: d * 0.45, ease: 'power2.out'}, t);
      tl.to(p, {['hand' + s]: base.H, ['arm' + s + 'L']: base.L, duration: d * 0.75, ease: 'power1.inOut'}, t + d * 0.45);
      t += d * (1.1 + r() * 0.7);
      if (r() < 0.05) {   // a think beat: both hands settle back a touch, head lifts
        tl.to(p, {head: -2.5, duration: 0.2, ease: 'sine.out'}, t);
        tl.to(p, {head: 0, duration: 0.3, ease: 'sine.inOut'}, t + 0.35);
        t += 0.4 + r() * 0.35;
      }
    }
  }

  function legacyGesture(tl, ch, name, t, until, o) {
    const pose = POSE[name];
    const nums = {};
    Object.keys(pose).forEach((k) => { if (typeof pose[k] === 'number') nums[k] = pose[k]; });
    tl.to(ch.p, Object.assign({duration: o.dur == null ? 0.28 : o.dur, ease: EASE[o.ease] || 'back.out(1.7)'}, nums), t);
    if (pose.handL) ch.tracks.handL.set(t, pose.handL);
    if (pose.handR) ch.tracks.handR.set(t, ch.cfg.restHandR === 'grip-prop' ? 'grip-prop' : pose.handR);
    return pose;
  }

  S.Direct = {
    GESTURES: Object.keys(POSE),
    EASES: Object.keys(EASE),
    EXPRESSIONS: Object.keys(S.Act.EXPR),
    ik,
    expression(tl, ch, name, t, o) {
      o = o || {};
      if (!S.Act.EXPR[name]) throw new Error('unknown expression ' + name);
      const big = o.ease === 'anticipate' || o.ease === 'overshoot' || /shock|panic|angry|dollar|happy/.test(name);
      return S.Act.react(tl, ch, name, t, {big: big});
    },
    gesture(tl, ch, name, t, until, o) {
      o = o || {};
      if (!POSE[name]) throw new Error('unknown gesture ' + name);
      if (!ch.cfg.paper) return legacyGesture(tl, ch, name, t, until, o);
      const ease = o.ease || 'settle', d = o.dur || DUR[ease] || 0.34;
      const first = name === 'point' || name === 'phone' || name === 'wave' || name === 'explain' ? 'R' : (S.hash(ch.id + t) % 2 ? 'R' : 'L');
      const second = first === 'R' ? 'L' : 'R', lag = 0.06 + (S.hash(ch.id + ':lag:' + t) % 5) * 0.01;
      const tg = {R: target(ch, name, 'R'), L: target(ch, name, 'L')};
      if (ch.cfg.restHandR === 'grip-prop') tg.R.pose = 'grip-prop';
      const ant = ease === 'anticipate' || ease === 'overshoot';
      const e1 = reachArm(tl, ch, first, tg[first], t, d, {ant, ease});
      const e2 = reachArm(tl, ch, second, tg[second], t + lag, d * 1.1, {ant: false, ease});
      ch.tracks.held.set(t + d * 0.4, tg.R.held);
      // body: lean toward a reaching gesture, head counters, shoulders lift on big moves
      const lean = {point: 3.5, explain: 2, wave: 2, phone: 1.5, 'hands-up': -2.5, fold: -1.5, idle: 0, type: 1.5}[name] || 0;
      if (lean) {
        tl.to(ch.p, {torso: lean, duration: d * 1.2, ease: 'power2.out'}, t + 0.03);
        tl.to(ch.p, {head: -lean * 0.6, duration: d * 1.4, ease: 'back.out(1.6)'}, t + 0.08);
      } else tl.to(ch.p, {torso: 0, duration: d * 1.2, ease: 'power2.inOut'}, t + 0.03);
      if (name === 'hands-up') tl.fromTo(ch.p, {squash: 0.04}, {squash: 0, duration: 0.5, ease: 'elastic.out(1, 0.45)', immediateRender: false}, t + 0.04);
      if (name === 'hands-up' || name === 'wave' || name === 'point') S.Act.hairFollow(tl, ch, t, name === 'wave' ? 8 : 5);
      const hold0 = Math.max(e1, e2) + 0.05;
      if (name === 'type') typeLoop(tl, ch, tg, hold0, until - 0.05);
      else if (name === 'wave' && until > hold0 + 0.4) {
        const half = 0.15, n = Math.floor((Math.min(until, hold0 + 1.6) - hold0) / (half * 2));
        if (n >= 2) tl.to(ch.p, {keyframes: [{handR: tg.R.H + 16, armRL: tg.R.L - 6, duration: half}, {handR: tg.R.H - 14, armRL: tg.R.L + 4, duration: half}], repeat: n - 1, ease: 'sine.inOut'}, hold0);
      } else {
        drift(tl, ch, first, tg[first], hold0, until - 0.05, S.hash(ch.id + ':d1:' + t));
        drift(tl, ch, second, tg[second], hold0 + 0.2, until - 0.05, S.hash(ch.id + ':d2:' + t));
      }
      return tg;
    },
    say(tl, ch, text, t, dur, wordsIn) {
      const raw = String(text || '');
      const paper = !!(ch.cfg && ch.cfg.paper);
      if (paper && /^\s*\[NARRATOR\]/i.test(raw)) {
        ch.tracks.viseme.set(t, 'X');
        ch.tracks.viseme.set(t + (dur || 0.6), 'X');
        return;
      }
      const parts = raw.split(/\s+/).filter(Boolean);
      if ((!parts.length && !wordsIn) || !S.LipSync) return;
      dur = dur || Math.max(0.6, parts.length * 0.28);
      const slice = parts.length ? dur / parts.length : dur;
      const words = wordsIn || parts.map((word, i) => ({
        word: word,
        start: t + i * slice,
        end: t + (i + 1) * slice - Math.min(0.05, slice * 0.3),
        stress: i % 3 === 0 || i === parts.length - 1
      }));
      const opt = paper ? {style: 'paper9', minHold: 3, fps: S.FPS || 30} : null;
      S.LipSync.fromWords(words, 0, opt).forEach((k) => ch.tracks.viseme.set(k.t, k.v));
      ch.tracks.viseme.set(words[words.length - 1].end + 0.06, paper ? 'X' : null);
      words.forEach((w, i) => {
        if (!w.stress) return;
        tl.to(ch.p, {head: 3.5 * (i % 2 ? -1 : 1), duration: 0.09, ease: 'power2.out'}, w.start - 0.03);
        tl.to(ch.p, {head: 0, duration: 0.26, ease: 'power2.inOut'}, w.start + 0.08);
        tl.to(ch.p, {browL: '-=4', browR: '-=4', duration: 0.08, ease: 'power2.out'}, w.start - 0.04);
        tl.to(ch.p, {browL: '+=4', browR: '+=4', duration: 0.3, ease: 'power2.inOut'}, w.start + 0.12);
      });
    },
    /* keys: [{t, expression, gesture, look:{x,y}, turn, head, say:{text,dur}, walk:{from,to,dur}, blink, ease}] */
    keys(tl, ch, keys, end) {
      const list = (keys || []).slice().sort((a, b) => a.t - b.t);
      // paper figures start in a relaxed idle pose (bent elbows), not the straight construction pose
      if (ch.cfg.paper) {
        ['R', 'L'].forEach((s) => { const tg = target(ch, 'idle', s); ch.p['arm' + s + 'U'] = tg.U; ch.p['arm' + s + 'L'] = tg.L; });
        ch.__arm = {armRU: ch.p.armRU, armRL: ch.p.armRL, armLU: ch.p.armLU, armLL: ch.p.armLL};
      }
      list.forEach((k, i) => {
        const next = i + 1 < list.length ? list[i + 1].t : end;
        if (k.expression) S.Direct.expression(tl, ch, k.expression, k.t, k);
        if (k.gesture) S.Direct.gesture(tl, ch, k.gesture, k.t, k.walk ? k.t + 0.01 : next, k);
        if (k.look) {   // eyes lead, the head follows 80 ms later (act7 lookAt7)
          tl.to(ch.p, {lookX: k.look.x || 0, lookY: k.look.y || 0, duration: 0.14, ease: 'power2.out'}, k.t);
          if (typeof k.head !== 'number') tl.to(ch.p, {head: S.clamp((k.look.x || 0) * 6, -8, 8), duration: 0.45, ease: 'back.out(1.3)'}, k.t + 0.08);
        }
        if (typeof k.turn === 'number') S.Act.look(tl, ch, k.turn, k.t + 0.06, 0.32);
        if (typeof k.head === 'number') tl.to(ch.p, {head: k.head, duration: 0.3, ease: 'power2.out'}, k.t + 0.04);
        if (typeof k.scale === 'number') tl.set(ch.p, {scale: k.scale}, k.t);
        if (k.say && k.say.text) S.Direct.say(tl, ch, k.say.text, k.t, k.say.dur, k.say.words);
        if (k.mouth) ch.tracks.viseme.set(k.t, k.mouth);
        if (k.walk) S.Act.walkTo(tl, ch, k.walk.from != null ? k.walk.from : ch.p.x, k.walk.to, k.t, k.walk.dur || 1.5);
        if (k.blink) S.Act.blink(ch, k.t);
        if (!k.walk && next - k.t > 1.6) S.Act.idle(tl, ch, k.t + 0.45, next - 0.12, S.hash(ch.id + ':' + i), ch.desk ? 0.35 : 1);
      });
    }
  };
})(window.Studio = window.Studio || {});
