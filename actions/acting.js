/* Data-driven acting on top of Action choreography.
 * Scene specs list keys; Direct turns them into rig tweens, hand tracks and visemes.
 * Eases: settle, snap, heavy, smooth, anticipate (dip, then overshoot), overshoot.
 * Gestures: idle, type, explain, point, hands-up, fold, phone, wave.
 */
(function (S) {
  'use strict';
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

  Object.assign(S.Act.EXPR, {
    focused: {browL: 5, browR: 5, browInner: 8, lidL: 0.2, lidR: 0.2, mood: 'flat'},
    angry: {browL: 7, browR: 7, browInner: 16, browTiltL: 8, browTiltR: -8, lidL: 0.32, lidR: 0.32, mood: 'frown'},
    tired: {browL: 6, browR: 6, browInner: 4, lidL: 0.55, lidR: 0.58, lidBL: 0.16, lidBR: 0.16, mood: 'flat'},
    sad: {browL: 3, browR: 3, browInner: 10, browTiltL: 10, browTiltR: -10, lidL: 0.38, lidR: 0.38, mood: 'frown'},
    talk: {browL: -3, browR: -3, lidL: 0.08, lidR: 0.08, mood: 'REST'},
    whisper: {browL: 3, browR: -4, browInner: 6, lidL: 0.42, lidR: 0.34, mood: 'flat'}
  });

  function hands(ch, pose, t) {
    let L = pose.handL, R = pose.handR;
    if (ch.cfg && ch.cfg.restHandR === 'grip-prop') R = 'grip-prop';
    if (ch.cfg && ch.cfg.restHand === 'grip-prop') L = 'grip-prop';
    if (L) ch.tracks.handL.set(t, L);
    if (R) ch.tracks.handR.set(t, R);
  }
  function tween(tl, target, vals, t, dur, easeName) {
    dur = dur == null ? 0.32 : dur;
    const nums = {};
    Object.keys(vals).forEach((k) => { if (k !== 'handL' && k !== 'handR' && typeof vals[k] === 'number') nums[k] = vals[k]; });
    if (easeName === 'anticipate' || easeName === 'overshoot') {
      const ant = {};
      ['armLU', 'armRU', 'armLL', 'armRL', 'head'].forEach((k) => { if (k in nums) ant[k] = '+=5'; });
      if (Object.keys(ant).length) tl.to(target, Object.assign({duration: 0.08, ease: 'power1.in'}, ant), t);
      tl.to(target, Object.assign({duration: dur, ease: 'back.out(1.7)'}, nums), t + (Object.keys(ant).length ? 0.08 : 0));
    } else {
      tl.to(target, Object.assign({duration: dur, ease: EASE[easeName] || easeName || 'power2.inOut'}, nums), t);
    }
  }

  S.Direct = {
    GESTURES: Object.keys(POSE),
    EASES: Object.keys(EASE),
    EXPRESSIONS: Object.keys(S.Act.EXPR),
    expression(tl, ch, name, t, o) {
      o = o || {};
      if (!S.Act.EXPR[name]) throw new Error('unknown expression ' + name);
      const big = o.ease === 'anticipate' || o.ease === 'overshoot' || /shock|panic|angry|dollar|happy/.test(name);
      return S.Act.react(tl, ch, name, t, {big: big});
    },
    gesture(tl, ch, name, t, until, o) {
      o = o || {};
      const pose = POSE[name];
      if (!pose) throw new Error('unknown gesture ' + name);
      tween(tl, ch.p, pose, t, o.dur == null ? 0.28 : o.dur, o.ease || 'overshoot');
      hands(ch, pose, t);
      if (name === 'hands-up' || name === 'wave' || name === 'point') S.Act.hairFollow(tl, ch, t, name === 'wave' ? 8 : 5);
      if (name === 'type' && until > t + 0.6) {
        const start = t + 0.42, half = 0.11, cyc = half * 2;
        const n = Math.floor((until - start) / cyc);
        if (n >= 2) {
          tl.to(ch.p, {keyframes: [{armRL: -90, armLL: -84, duration: half}, {armRL: -112, armLL: -108, duration: half}], repeat: n - 1, ease: 'sine.inOut'}, start);
        }
      }
      if (name === 'wave' && until > t + 0.5) {
        const start = t + 0.3, half = 0.16, n = Math.floor((Math.min(until, t + 1.6) - start) / (half * 2));
        if (n >= 2) tl.to(ch.p, {keyframes: [{handR: 12, duration: half}, {handR: -14, duration: half}], repeat: n - 1, ease: 'sine.inOut'}, start);
      }
      return pose;
    },
    say(tl, ch, text, t, dur) {
      const parts = String(text || '').split(/\s+/).filter(Boolean);
      if (!parts.length || !S.LipSync) return;
      dur = dur || Math.max(0.6, parts.length * 0.28);
      const slice = dur / parts.length;
      const words = parts.map((word, i) => ({
        word: word,
        start: t + i * slice,
        end: t + (i + 1) * slice - Math.min(0.05, slice * 0.3),
        stress: i % 3 === 0 || i === parts.length - 1
      }));
      S.LipSync.fromWords(words, 0).forEach((k) => ch.tracks.viseme.set(k.t, k.v));
      ch.tracks.viseme.set(words[words.length - 1].end + 0.06, null);
      words.forEach((w) => {
        if (!w.stress) return;
        tl.to(ch.p, {head: 3.5, duration: 0.08, ease: 'power2.out'}, w.start);
        tl.to(ch.p, {head: 0, duration: 0.24, ease: 'power2.inOut'}, w.start + 0.08);
      });
    },
    /* keys: [{t, expression, gesture, look:{x,y}, turn, head, say:{text,dur}, walk:{from,to,dur}, blink, ease}] */
    keys(tl, ch, keys, end) {
      const list = (keys || []).slice().sort((a, b) => a.t - b.t);
      list.forEach((k, i) => {
        const next = i + 1 < list.length ? list[i + 1].t : end;
        if (k.expression) S.Direct.expression(tl, ch, k.expression, k.t, k);
        if (k.gesture) S.Direct.gesture(tl, ch, k.gesture, k.t, k.walk ? k.t : next, k);
        if (k.look) tl.to(ch.p, {lookX: k.look.x || 0, lookY: k.look.y || 0, duration: 0.28, ease: 'power2.out'}, k.t);
        if (typeof k.turn === 'number') S.Act.look(tl, ch, k.turn, k.t, 0.28);
        if (typeof k.head === 'number') tl.to(ch.p, {head: k.head, duration: 0.28, ease: 'power2.out'}, k.t + 0.02);
        if (k.say && k.say.text) S.Direct.say(tl, ch, k.say.text, k.t, k.say.dur);
        if (k.walk) S.Act.walkTo(tl, ch, k.walk.from != null ? k.walk.from : ch.p.x, k.walk.to, k.t, k.walk.dur || 1.5);
        if (k.blink) S.Act.blink(ch, k.t);
        if (!k.walk && next - k.t > 2.5) S.Act.idle(tl, ch, k.t + 0.45, next - 0.12, S.hash(ch.id + ':' + i));
      });
    }
  };
})(window.Studio = window.Studio || {});
