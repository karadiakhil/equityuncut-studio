/* StageEngine: 5 true parallax depth layers under one CSS perspective (1500px), mood lighting, grain and FX planes.
 *   L0 atmosphere/backdrop (slowest, soft blur)   L1 mid-architecture + ambient life   L2 interactive set + story props
 *   L3 character stage (z-sorted, contact shadows)  L4 foreground framing + depth of field (fastest, 2-4 px blur)
 * Each layer is a world-sized plane (default 3400 x 1080) with an <svg> for vector art and an HTML container.
 * The CameraRig moves the planes; setMood() crossfades lighting presets.
 */
(function (S) {
  'use strict';
  const C = S.PALETTE;
  S.MOODS = ['comedy-day', 'boardroom-warm', 'forensic-blueprint', 'red-alert'];
  S.Stage = {
    create(host, o) {
      o = Object.assign({worldW: 3400, worldH: 1080, bg: C.cream, perspective: 1500, mood: 'comedy-day', grain: true}, o || {});
      const el = S.div({class: 'ss-stage', style: {position: 'absolute', left: '0', top: '0', width: '1920px', height: '1080px', overflow: 'hidden',
        perspective: o.perspective + 'px', background: o.bg}}, host);
      const layers = [];
      for (let i = 0; i < 5; i++) {
        const L = S.div({class: 'ss-layer', 'data-layer': 'L' + i, style: {position: 'absolute', left: '0', top: '0', width: o.worldW + 'px', height: o.worldH + 'px', transformOrigin: '0 0'}}, el);
        const svg = S.svg('svg', {width: o.worldW, height: o.worldH, viewBox: `0 0 ${o.worldW} ${o.worldH}`, overflow: 'visible', style: 'position:absolute;left:0;top:0;overflow:visible'}, L);
        const html = S.div({class: 'ss-layer-html', style: {position: 'absolute', left: '0', top: '0', width: '0', height: '0'}}, L);
        layers.push({el: L, svg, html, back: S.g(svg, {class: 'back'}), front: null});
      }
      // L3 gets a world FX plane above the characters (bursts, smears, dust in the light)
      const fxDiv = S.div({class: 'ss-layer-fx', style: {position: 'absolute', left: '0', top: '0', width: '0', height: '0', zIndex: 50}}, layers[3].el);
      const fxSvg = S.svg('svg', {width: o.worldW, height: o.worldH, viewBox: `0 0 ${o.worldW} ${o.worldH}`, overflow: 'visible', style: 'position:absolute;left:0;top:0;overflow:visible'}, fxDiv);
      layers[3].fx = S.g(fxSvg);
      // mood + grade planes (screen space)
      const moodHost = S.div({class: 'ss-moods', style: {position: 'absolute', inset: '0', pointerEvents: 'none'}}, el);
      const moods = {};
      const plane = (name, style) => (moods[name] = S.div({class: 'ss-mood', 'data-mood': name, style: Object.assign({position: 'absolute', inset: '0', opacity: 0}, style)}, moodHost));
      // comedy-day: warm paper light, soft sun rays from the upper left
      const day = plane('comedy-day', {});
      S.div({style: {position: 'absolute', inset: '0', background: 'linear-gradient(115deg, rgba(255,226,170,0.22) 0%, rgba(255,240,210,0.06) 45%, rgba(120,90,60,0.08) 100%)', mixBlendMode: 'soft-light'}}, day);
      const rays = S.svg('svg', {width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: 'position:absolute;inset:0;mix-blend-mode:screen'}, day);
      const rg = S.uid('ray'); const lg = S.svg('linearGradient', {id: rg, x1: 0, y1: 0, x2: 1, y2: 1}, S.svg('defs', null, rays));
      S.svg('stop', {offset: 0, 'stop-color': '#FFF1C9', 'stop-opacity': 0.55}, lg); S.svg('stop', {offset: 1, 'stop-color': '#FFF1C9', 'stop-opacity': 0}, lg);
      moods.rays = [];
      [[120, 260, 0.5], [420, 200, 0.35], [700, 150, 0.28]].forEach(([x, w, op]) => moods.rays.push(S.svg('polygon', {points: `${x},-40 ${x + w},-40 ${x + w + 900},1120 ${x + 520},1120`, fill: `url(#${rg})`, opacity: op}, rays)));
      // boardroom-warm: amber pools, deep vignette
      const warm = plane('boardroom-warm', {});
      S.div({style: {position: 'absolute', inset: '0', background: 'rgba(176,108,40,0.28)', mixBlendMode: 'multiply'}}, warm);
      S.div({style: {position: 'absolute', inset: '0', background: 'radial-gradient(ellipse 45% 55% at 50% 58%, rgba(255,200,120,0.35), rgba(0,0,0,0) 70%)', mixBlendMode: 'screen'}}, warm);
      S.div({style: {position: 'absolute', inset: '0', background: 'radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(40,22,10,0.55) 100%)'}}, warm);
      // forensic-blueprint: deep navy drafting light with a cyan grid
      const bp = plane('forensic-blueprint', {});
      S.div({style: {position: 'absolute', inset: '0', background: 'rgba(15,23,42,0.86)', mixBlendMode: 'multiply'}}, bp);
      const bpSvg = S.svg('svg', {width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: 'position:absolute;inset:0;mix-blend-mode:screen'}, bp);
      S.svg('rect', {width: 1920, height: 1080, fill: S.Textures.pattern(S.svg('defs', null, bpSvg), 'blueprint', {size: 36}), opacity: 0.8}, bpSvg);
      S.div({style: {position: 'absolute', inset: '0', background: 'radial-gradient(ellipse 70% 70% at 50% 45%, rgba(56,189,248,0.10), rgba(2,6,23,0.6) 100%)'}}, bp);
      // red-alert: crimson rim wash, hazard vignette (pulse via pulseAlert), spotlight cone
      const red = plane('red-alert', {});
      S.div({style: {position: 'absolute', inset: '0', background: 'rgba(220,38,38,0.22)', mixBlendMode: 'multiply'}}, red);
      moods.redPulse = S.div({style: {position: 'absolute', inset: '0', boxShadow: 'inset 0 0 220px 60px rgba(185,28,28,0.75)'}}, red);
      S.div({style: {position: 'absolute', inset: '0', background: 'conic-gradient(from 168deg at 50% -10%, rgba(0,0,0,0) 0deg, rgba(255,235,235,0.22) 12deg, rgba(0,0,0,0) 24deg)', mixBlendMode: 'screen'}}, red);
      // screen FX plane (speed lines, whips), grain + vignette on top
      const fxScreenDiv = S.div({class: 'ss-fx-screen', style: {position: 'absolute', inset: '0', pointerEvents: 'none'}}, el);
      const fxScreen = S.svg('svg', {width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: 'position:absolute;inset:0;overflow:visible'}, fxScreenDiv);
      const overlay = S.div({class: 'ss-overlay', style: {position: 'absolute', inset: '0', pointerEvents: 'none'}}, el);
      const vignette = S.div({style: {position: 'absolute', inset: '0', background: 'radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 60%, rgba(40,30,20,0.28) 100%)'}}, overlay);
      let grain = null;
      if (o.grain) {
        grain = S.div({class: 'ss-grain', style: {position: 'absolute', left: '-64px', top: '-64px', width: '2048px', height: '1208px', backgroundImage: `url(${S.Textures.url('grain-overlay')})`,
          backgroundSize: '512px 512px', mixBlendMode: 'multiply', opacity: 0.55}}, overlay);
        const r = S.rng(91); const offs = []; for (let i = 0; i < 64; i++) offs.push([Math.floor(r() * 64), Math.floor(r() * 64)]);
        S.onApply((t) => { const k = offs[Math.floor(t * 12) % offs.length]; grain.style.transform = `translate(${k[0]}px, ${k[1]}px)`; }, 30);   // paper boil at 12 fps
      }
      const stage = {el, layers, moods, moodHost, fxScreen, overlay, vignette, grain, worldW: o.worldW, worldH: o.worldH, L: (i) => layers[i],
        mood: o.mood,
        setMood(tl, name, t, dur) {
          dur = dur == null ? 0.6 : dur;
          S.MOODS.forEach((m) => tl.to(moods[m], {opacity: m === name ? 1 : 0, duration: dur, ease: 'power2.inOut'}, t));
          stage.mood = name;
        },
        pulseAlert(tl, start, end) { S.loop(tl, moods.redPulse, {opacity: 0.35, yoyo: true, ease: 'sine.inOut'}, start, end, 0.45); },
        // world-space helpers
        add(layer, fn) { return fn(layers[layer].svg, layers[layer]); }
      };
      S.MOODS.forEach((m) => { moods[m].style.opacity = m === o.mood ? 1 : 0; });
      return stage;
    }
  };
})(window.Studio = window.Studio || {});
