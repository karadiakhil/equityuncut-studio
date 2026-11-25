/* CameraRig: deterministic virtual cinematography over the StageEngine planes.
 * Camera looks at world point (x, y) with zoom; each layer moves by its depth factor (parallax) and zooms by its own
 * factor, so punch-ins open up depth. Shake is seeded noise scaled by a tweened amplitude. Rack focus tweens per-layer blur.
 *   panTo, punchIn (1.3x-2.2x), dolly, rackFocus, impactShake, whip, beat(), beatAudit() (3.5 s visual beat discipline)
 */
(function (S) {
  'use strict';
  const PARALLAX = [0.32, 0.62, 1, 1, 1.42], ZOOMF = [0.45, 0.72, 1, 1, 1.3], BLUR = [0.9, 0.3, 0, 0, 3.2];
  S.Camera = {
    create(stage, o) {
      o = Object.assign({x: 960, y: 540, zoom: 1}, o || {});
      const p = {x: o.x, y: o.y, zoom: o.zoom, rot: 0, shake: 0, b0: BLUR[0], b1: BLUR[1], b2: BLUR[2], b3: BLUR[3], b4: BLUR[4]};
      const ph = []; const r = S.rng(1234); for (let i = 0; i < 6; i++) ph.push(r() * Math.PI * 2);
      const cam = {p, events: [], factors: PARALLAX, zoomFactors: ZOOMF,
        apply(t) {
          const sx = p.shake * (Math.sin(t * 61 + ph[0]) * 0.6 + Math.sin(t * 97 + ph[1]) * 0.4);
          const sy = p.shake * (Math.sin(t * 73 + ph[2]) * 0.6 + Math.sin(t * 113 + ph[3]) * 0.4);
          const sr = p.shake * 0.02 * Math.sin(t * 53 + ph[4]);
          stage.layers.forEach((L, i) => {
            const f = PARALLAX[i], s = 1 + (p.zoom - 1) * ZOOMF[i];
            const ex = 960 + (p.x - 960) * f, ey = 540 + (p.y - 540) * f;
            L.el.style.transform = `translate(${(960 + sx * (0.6 + f * 0.4)).toFixed(2)}px, ${(540 + sy * (0.6 + f * 0.4)).toFixed(2)}px) rotate(${(p.rot + sr).toFixed(3)}deg) scale(${s.toFixed(4)}) translate(${(-ex).toFixed(2)}px, ${(-ey).toFixed(2)}px)`;
            const b = p['b' + i]; L.el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
          });
        },
        // world -> screen for layer i (to place screen FX on world objects)
        toScreen(wx, wy, i) { i = i == null ? 3 : i; const f = PARALLAX[i], s = 1 + (p.zoom - 1) * ZOOMF[i];
          return [960 + (wx - (960 + (p.x - 960) * f)) * s, 540 + (wy - (540 + (p.y - 540) * f)) * s]; },
        beat(t, label) { cam.events.push([t, label || 'beat']); },
        panTo(tl, x, y, t, dur, ease) { cam.beat(t, 'pan'); return tl.to(p, {x, y, duration: dur, ease: ease || 'power2.inOut'}, t); },
        dolly(tl, zoom, t, dur, ease) { cam.beat(t, 'dolly'); return tl.to(p, {zoom, duration: dur, ease: ease || 'sine.inOut'}, t); },
        punchIn(tl, x, y, zoom, t, dur, opt) {
          opt = opt || {}; cam.beat(t, 'punch');
          tl.to(p, {x, y, zoom: S.clamp(zoom, 1.3, 2.2), duration: dur == null ? 0.22 : dur, ease: opt.ease || 'power4.out'}, t);
          if (opt.rack !== false) cam.rackFocus(tl, {b0: 6, b1: 4.5, b2: 0, b3: 0, b4: 7}, t, dur == null ? 0.22 : dur);   // L2 holds behind-desk actors: keep it sharp
        },
        pullOut(tl, t, dur, to) { to = Object.assign({x: 960, y: 540, zoom: 1}, to || {}); cam.beat(t, 'pull');
          tl.to(p, Object.assign({duration: dur || 0.4, ease: 'power3.inOut'}, to), t); cam.rackFocus(tl, {b0: BLUR[0], b1: BLUR[1], b2: 0, b3: 0, b4: BLUR[4]}, t, dur || 0.4); },
        rackFocus(tl, blurs, t, dur) { return tl.to(p, Object.assign({duration: dur || 0.4, ease: 'power2.inOut'}, blurs), t); },
        impactShake(tl, t, intensity, dur) { cam.beat(t, 'shake'); tl.fromTo(p, {shake: intensity || 18}, {shake: 0, duration: dur || 0.45, ease: 'power3.out', immediateRender: false}, t); },
        whip(tl, dx, t, dur) { cam.beat(t, 'whip'); return tl.to(p, {x: '+=' + dx, duration: dur || 0.35, ease: 'expo.inOut'}, t); },
        // 3.5 s discipline: every stretch of the film needs a new visual beat (camera move, cut, reaction, graphic)
        beatAudit(total, extra, max) {
          max = max || 3.5; const ts = cam.events.map((e) => e[0]).concat(extra || []).concat([0, total]).sort((a, b) => a - b);
          const gaps = []; for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] > max) gaps.push([+ts[i - 1].toFixed(2), +ts[i].toFixed(2)]);
          return {ok: !gaps.length, maxGap: Math.max(...ts.slice(1).map((v, i) => v - ts[i])), gaps};
        }
      };
      S.onApply(cam.apply, 40);
      cam.apply(0);
      return cam;
    }
  };
})(window.Studio = window.Studio || {});
