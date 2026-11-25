/* Lighting and post. Any scene can mount this over a stage (or any 1920x1080 host).
 * Presets are screen-space grades: multiply, key, rim, coloured pools, vignette.
 * Time of day (day / dusk / night) and weather (clear / rain / haze) stack on top, so a set can be
 * "server-room at night in haze" without a new preset. Rain and grain are pure functions of t.
 *
 *   const light = Studio.Lighting.mount(stage.el, {preset:'dorm-night', time:'night', weather:'haze', seed:4});
 *   light.cut(tl, 'interrogation', 'night', 'clear', 12.0, 0.12);
 */
(function (S) {
  'use strict';
  const NAMES = ['flat', 'night-office', 'interrogation', 'server-room', 'newsroom', 'luxury', 'dorm-night', 'street-night', 'paper-day', 'paper-night', 'paper-warm'];
  const TIMES = ['day', 'dusk', 'night'];
  const WEATHERS = ['clear', 'rain', 'haze'];

  function wash(parent, style) {
    return S.div({style: Object.assign({position: 'absolute', inset: '0', pointerEvents: 'none'}, style)}, parent);
  }
  function plane(host, name) {
    return S.div({class: 'ss-light', 'data-light': name, style: {position: 'absolute', inset: '0', opacity: 0, pointerEvents: 'none'}}, host);
  }

  const BUILD = {
    flat(el) {
      wash(el, {background: 'rgba(255,253,249,0.04)'});
    },
    'night-office'(el) {
      wash(el, {background: 'rgba(22,18,28,0.46)', mixBlendMode: 'multiply'});
      wash(el, {background: 'linear-gradient(112deg, rgba(255,214,160,0.50) 0%, rgba(255,214,160,0.05) 40%, rgba(0,0,0,0) 68%)', mixBlendMode: 'screen'});
      wash(el, {background: 'linear-gradient(250deg, rgba(125,190,255,0.28) 0%, rgba(0,0,0,0) 42%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 34% 30% at 22% 34%, rgba(255,190,100,0.50), rgba(0,0,0,0) 70%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 24% 18% at 72% 66%, rgba(80,210,255,0.22), rgba(0,0,0,0) 72%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 74% 70% at 50% 48%, rgba(0,0,0,0) 42%, rgba(5,6,12,0.78) 100%)'});
    },
    interrogation(el) {
      wash(el, {background: 'rgba(6,8,12,0.62)', mixBlendMode: 'multiply'});
      wash(el, {background: 'radial-gradient(ellipse 28% 42% at 50% 18%, rgba(255,248,235,0.55), rgba(255,248,235,0.05) 55%, rgba(0,0,0,0) 72%)', mixBlendMode: 'screen'});
      wash(el, {background: 'linear-gradient(90deg, rgba(180,40,40,0.16), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(40,80,140,0.18))', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 68% 64% at 50% 42%, rgba(0,0,0,0) 28%, rgba(0,0,0,0.88) 100%)'});
    },
    'server-room'(el) {
      wash(el, {background: 'rgba(4,12,18,0.55)', mixBlendMode: 'multiply'});
      wash(el, {background: 'radial-gradient(ellipse 40% 50% at 30% 60%, rgba(45,212,191,0.28), rgba(0,0,0,0) 70%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 30% 40% at 78% 40%, rgba(56,189,248,0.22), rgba(0,0,0,0) 70%)', mixBlendMode: 'screen'});
      wash(el, {background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.18) 2px 3px)', opacity: 0.35});
      wash(el, {background: 'radial-gradient(ellipse 76% 72% at 50% 50%, rgba(0,0,0,0) 46%, rgba(0,8,12,0.75) 100%)'});
    },
    newsroom(el) {
      wash(el, {background: 'rgba(30,40,60,0.18)', mixBlendMode: 'multiply'});
      wash(el, {background: 'linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0) 32%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 50% 28% at 50% 8%, rgba(255,255,255,0.28), rgba(0,0,0,0) 70%)', mixBlendMode: 'screen'});
      wash(el, {background: 'linear-gradient(260deg, rgba(56,189,248,0.18), rgba(0,0,0,0) 40%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 84% 78% at 50% 48%, rgba(0,0,0,0) 58%, rgba(8,12,20,0.45) 100%)'});
    },
    luxury(el) {
      wash(el, {background: 'rgba(90,60,30,0.22)', mixBlendMode: 'multiply'});
      wash(el, {background: 'linear-gradient(120deg, rgba(255,220,170,0.40), rgba(255,220,170,0) 55%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 36% 30% at 32% 40%, rgba(245,197,66,0.38), rgba(0,0,0,0) 70%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 28% 24% at 70% 62%, rgba(255,186,120,0.22), rgba(0,0,0,0) 72%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 80% 74% at 50% 50%, rgba(0,0,0,0) 50%, rgba(40,24,10,0.55) 100%)'});
    },
    'dorm-night'(el) {   // engine-fix-01: readable, not murky. One warm bare-bulb key, teal screen spill at desk height
      wash(el, {background: 'rgba(16,22,34,0.16)', mixBlendMode: 'multiply'});
      wash(el, {background: 'radial-gradient(ellipse 52% 60% at 50% 16%, rgba(255,214,150,0.46), rgba(255,214,150,0.08) 55%, rgba(0,0,0,0) 75%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 60% 26% at 52% 82%, rgba(94,234,212,0.20), rgba(0,0,0,0) 72%)', mixBlendMode: 'screen'});
      wash(el, {background: 'linear-gradient(250deg, rgba(125,190,255,0.14) 0%, rgba(0,0,0,0) 38%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 80% 76% at 50% 46%, rgba(0,0,0,0) 56%, rgba(10,12,18,0.46) 100%)'});
    },
    'paper-day'(el) {
      wash(el, {background: 'radial-gradient(ellipse 42% 36% at 28% 30%, rgba(255,244,220,0.55), rgba(0,0,0,0) 70%)', mixBlendMode: 'multiply'});
      wash(el, {background: 'radial-gradient(ellipse 78% 72% at 50% 46%, rgba(0,0,0,0) 58%, rgba(40,32,24,0.38) 100%)'});
    },
    'paper-night'(el) {
      wash(el, {background: 'rgba(20,24,32,0.18)', mixBlendMode: 'multiply'});
      wash(el, {background: 'radial-gradient(ellipse 36% 32% at 22% 34%, rgba(255,214,160,0.45), rgba(0,0,0,0) 72%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 76% 70% at 50% 46%, rgba(0,0,0,0) 52%, rgba(8,10,16,0.40) 100%)'});
    },
    'paper-warm'(el) {
      wash(el, {background: 'radial-gradient(ellipse 40% 34% at 34% 38%, rgba(226,182,87,0.42), rgba(0,0,0,0) 70%)', mixBlendMode: 'multiply'});
      wash(el, {background: 'radial-gradient(ellipse 78% 72% at 50% 48%, rgba(0,0,0,0) 56%, rgba(70,40,16,0.36) 100%)'});
    },
    'street-night'(el) {
      wash(el, {background: 'rgba(6,10,22,0.42)', mixBlendMode: 'multiply'});
      wash(el, {background: 'linear-gradient(180deg, rgba(30,50,90,0.35), rgba(0,0,0,0) 42%)', mixBlendMode: 'multiply'});
      wash(el, {background: 'radial-gradient(ellipse 30% 22% at 18% 78%, rgba(255,196,90,0.40), rgba(0,0,0,0) 70%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 26% 18% at 70% 80%, rgba(255,170,70,0.28), rgba(0,0,0,0) 72%)', mixBlendMode: 'screen'});
      wash(el, {background: 'linear-gradient(260deg, rgba(56,189,248,0.16), rgba(0,0,0,0) 36%)', mixBlendMode: 'screen'});
      wash(el, {background: 'radial-gradient(ellipse 78% 72% at 50% 42%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.72) 100%)'});
    }
  };

  S.Lighting = {
    names: NAMES.slice(),
    times: TIMES.slice(),
    weathers: WEATHERS.slice(),
    mount(host, o) {
      o = o || {};
      const root = S.div({class: 'ss-lighting', style: {position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: 30}}, host);
      const presets = {};
      NAMES.forEach((n) => { presets[n] = plane(root, n); BUILD[n](presets[n]); });
      const times = {};
      TIMES.forEach((n) => { times[n] = plane(root, 'time-' + n); });
      wash(times.day, {background: 'linear-gradient(180deg, rgba(255,244,220,0.16), rgba(255,244,220,0) 46%)', mixBlendMode: 'screen'});
      wash(times.dusk, {background: 'rgba(120,52,24,0.26)', mixBlendMode: 'multiply'});
      wash(times.dusk, {background: 'linear-gradient(180deg, rgba(255,140,60,0.32), rgba(40,16,48,0.12))', mixBlendMode: 'screen'});
      wash(times.night, {background: 'rgba(8,14,32,0.18)', mixBlendMode: 'multiply'});
      const weathers = {};
      WEATHERS.forEach((n) => { weathers[n] = plane(root, 'wx-' + n); });
      wash(weathers.haze, {background: 'linear-gradient(180deg, rgba(220,210,190,0.14), rgba(200,205,210,0.04) 55%, rgba(0,0,0,0) 80%)'});   // light atmosphere at the ceiling, never a grey veil
      const rainSvg = S.svg('svg', {width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: 'position:absolute;inset:0'}, weathers.rain);
      const drops = [];
      const rnd = S.rng((o.seed || 77) >>> 0);
      for (let i = 0; i < 110; i++) {
        const x = -60 + rnd() * 2040;
        const len = 14 + rnd() * 30;
        drops.push({ln: S.svg('line', {x1: 0, y1: 0, x2: 0, y2: 0, stroke: 'rgba(214,228,242,0.5)', 'stroke-width': (1 + rnd() * 1.4).toFixed(2), 'stroke-linecap': 'round'}, rainSvg), x, len, ph: rnd(), speed: 0.5 + rnd() * 0.75, drift: 8 + rnd() * 16});
      }
      const grainHost = S.div({class: 'ss-light-grain', style: {position: 'absolute', left: '-48px', top: '-48px', width: '2016px', height: '1176px', opacity: 0.2, mixBlendMode: 'multiply', pointerEvents: 'none'}}, root);
      const gsvg = S.svg('svg', {width: 2016, height: 1176, style: 'position:absolute;inset:0'}, grainHost);
      const fid = S.uid('lg');
      const filt = S.svg('filter', {id: fid, x: '0', y: '0', width: '100%', height: '100%'}, S.svg('defs', null, gsvg));
      S.svg('feTurbulence', {type: 'fractalNoise', baseFrequency: '0.85', numOctaves: '2', seed: '19', stitchTiles: 'stitch', result: 'n'}, filt);
      S.svg('feColorMatrix', {in: 'n', values: '0 0 0 0 0.28  0 0 0 0 0.24  0 0 0 0 0.18  0 0 0 0.65 -0.2'}, filt);
      S.svg('rect', {width: 2016, height: 1176, filter: 'url(#' + fid + ')'}, gsvg);
      const offs = [];
      const gr = S.rng(91);
      for (let i = 0; i < 48; i++) offs.push([Math.floor(gr() * 40), Math.floor(gr() * 40)]);
      S.onApply((t) => {
        const k = offs[Math.floor(Math.max(0, t) * 12) % offs.length];
        grainHost.style.transform = 'translate(' + k[0] + 'px,' + k[1] + 'px)';
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          const u = (t * d.speed + d.ph) % 1;
          const y = u * 1240 - 120;
          d.ln.setAttribute('x1', d.x.toFixed(1));
          d.ln.setAttribute('y1', y.toFixed(1));
          d.ln.setAttribute('x2', (d.x + d.drift).toFixed(1));
          d.ln.setAttribute('y2', (y + d.len).toFixed(1));
        }
      }, 28);
      function snap(map, name) {
        Object.keys(map).forEach((k) => { map[k].style.opacity = k === name ? '1' : '0'; });
      }
      const api = {
        root, presets, times, weathers,
        snap(preset, time, weather) {
          snap(presets, NAMES.indexOf(preset) >= 0 ? preset : 'flat');
          snap(times, TIMES.indexOf(time) >= 0 ? time : 'day');
          snap(weathers, WEATHERS.indexOf(weather) >= 0 ? weather : 'clear');
        },
        cut(tl, preset, time, weather, t, dur) {
          dur = dur == null ? 0.1 : dur;
          const p = NAMES.indexOf(preset) >= 0 ? preset : 'flat';
          const tm = TIMES.indexOf(time) >= 0 ? time : 'day';
          const w = WEATHERS.indexOf(weather) >= 0 ? weather : 'clear';
          NAMES.forEach((n) => tl.to(presets[n], {opacity: n === p ? 1 : 0, duration: dur, ease: 'power1.out'}, t));
          TIMES.forEach((n) => tl.to(times[n], {opacity: n === tm ? 1 : 0, duration: dur, ease: 'power1.out'}, t));
          WEATHERS.forEach((n) => tl.to(weathers[n], {opacity: n === w ? 1 : 0, duration: dur, ease: 'power1.out'}, t));
          tl.to(grainHost, {opacity: p.indexOf('paper-') === 0 ? 0.08 : 0.2, duration: dur, ease: 'power1.out'}, t);
        }
      };
      api.snap(o.preset || 'flat', o.time || 'day', o.weather || 'clear');
      return api;
    }
  };
})(window.Studio = window.Studio || {});
