/* Scene renderer. A scene_spec is a compact JSON description of one film:
 * sets, lighting, time, weather, shots, characters, vehicles, props, mograph.
 * Studio.Scene.render(host, spec) builds a paused GSAP timeline. Every frame is a
 * function of timeline time (seek anywhere; do not run a free clock).
 */
(function (S) {
  'use strict';
  const VEH = ['car', 'taxi', 'police', 'van', 'truck', 'jet', 'ship'];

  function err(list) { if (list.length) throw new Error('scene_spec: ' + list.join('; ')); }

  function fillPreset(shot) {
    const cam = shot.camera || (shot.camera = {});
    const preset = cam.preset;
    if (!preset) return;
    if (preset === 'static') return;
    if (preset === 'push') {
      const z = cam.zoom == null ? 1 : cam.zoom;
      if (cam.to == null) cam.to = {};
      if (cam.to.zoom == null) cam.to.zoom = +(z * 1.045).toFixed(4);
    }
    if (preset === 'drift') {
      if (cam.x == null) cam.x = 960;
      if (cam.to == null) cam.to = {};
      if (cam.to.x == null) cam.to.x = cam.x + 48;
    }
    if (preset === 'crash-zoom') {
      if (cam.zoom == null) cam.zoom = 1.04;
      if (cam.to == null) cam.to = {};
      if (cam.to.zoom == null) cam.to.zoom = Math.max(1.7, (cam.zoom || 1) * 1.5);
      cam._crash = true;
    }
  }

  S.Scene = {
    validate(spec) {
      const e = [];
      if (!spec || typeof spec !== 'object') return ['spec must be an object'];
      if (typeof spec.duration !== 'number' || !(spec.duration > 0)) e.push('duration must be a positive number');
      if (!spec.shots || !spec.shots.length) e.push('shots[] is required');
      const shots = (spec.shots || []).slice().sort((a, b) => a.t - b.t);
      shots.forEach((s, i) => {
        if (typeof s.t !== 'number' || typeof s.dur !== 'number' || s.dur <= 0) e.push('shot ' + i + ' needs t and dur');
        if (!s.set || S.Sets.names.indexOf(s.set) < 0) e.push('shot ' + i + ' unknown set ' + s.set);
        if (s.lighting && S.Lighting.names.indexOf(s.lighting) < 0) e.push('unknown lighting ' + s.lighting);
        if (s.time && S.Lighting.times.indexOf(s.time) < 0) e.push('unknown time ' + s.time);
        if (s.weather && S.Lighting.weathers.indexOf(s.weather) < 0) e.push('unknown weather ' + s.weather);
        if (i > 0 && s.t < shots[i - 1].t + shots[i - 1].dur - 0.02) e.push('shot ' + i + ' overlaps the previous shot');
      });
      if (shots.length) {
        const end = shots[shots.length - 1].t + shots[shots.length - 1].dur;
        if (Math.abs(end - spec.duration) > 0.05) e.push('duration ' + spec.duration + ' does not match last shot end ' + end.toFixed(2));
      }
      (spec.characters || []).forEach((c) => {
        if (!c.cast || !S.Cast[c.cast]) e.push('unknown cast ' + (c && c.cast));
        if (!c.set) e.push('character ' + (c.id || c.cast) + ' needs a set');
      });
      (spec.vehicles || []).forEach((v) => {
        if (VEH.indexOf(v.kind) < 0) e.push('unknown vehicle ' + v.kind);
        if (!v.set) e.push('vehicle ' + (v.id || v.kind) + ' needs a set');
      });
      (spec.mograph || []).forEach((m) => {
        if (S.Kit.types.indexOf(m.type) < 0) e.push('unknown mograph ' + m.type);
      });
      (spec.props || []).forEach((p) => {
        if (p.kind && !S.Props[p.kind]) e.push('unknown prop ' + p.kind);
        if (!p.file && !p.kind) e.push('prop needs kind or file');
      });
      return e;
    },
    render(host, spec) {
      err(S.Scene.validate(spec));
      if (!window.gsap) throw new Error('gsap is required');
      const fps = spec.fps || 30;
      S.FPS = fps;
      const shots = spec.shots.slice().sort((a, b) => a.t - b.t);
      shots.forEach(fillPreset);
      host.style.position = 'relative';
      host.style.width = '1920px';
      host.style.height = '1080px';
      host.style.overflow = 'hidden';
      host.style.background = '#000';
      const stage = S.Stage.create(host, {worldW: 4200, worldH: 1080, bg: '#07080c', grain: false, mood: 'comedy-day', perspective: 1500});
      S.MOODS.forEach((m) => { stage.moods[m].style.opacity = '0'; });
      if (stage.vignette) stage.vignette.style.opacity = '0';
      const brands = S.Brand.library(spec.brands || []);
      const names = [];
      shots.forEach((s) => { if (names.indexOf(s.set) < 0) names.push(s.set); });
      const sets = {};
      names.forEach((name) => {
        const first = shots.filter((s) => s.set === name)[0];
        const params = Object.assign({
          seed: spec.seed || 1, brands: brands, density: 'full',
          time: first.time || 'day', weather: first.weather || 'clear'
        }, (spec.setParams && spec.setParams[name]) || {});
        params.charHost = stage.layers[3].html;
        const rec = S.Sets.build(stage, name, params);
        rec.chars = rec.chars || [];
        sets[name] = rec;
      });
      const light = S.Lighting.mount(stage.el, {preset: shots[0].lighting || 'flat', time: shots[0].time || 'day', weather: shots[0].weather || 'clear', seed: spec.seed || 1});
      const screen = S.div({class: 'ss-screen', style: {position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: 60, overflow: 'hidden'}}, host);
      const tl = gsap.timeline({paused: true});
      S.bindTimeline(tl);
      const cam = S.Camera.create(stage, {x: (shots[0].camera && shots[0].camera.x) || 960, y: (shots[0].camera && shots[0].camera.y) || 560, zoom: (shots[0].camera && shots[0].camera.zoom) || 1});
      shots.forEach((shot, i) => {
        const camIn = shot.camera || {};
        const from = {x: camIn.x == null ? 960 : camIn.x, y: camIn.y == null ? 560 : camIn.y, zoom: camIn.zoom == null ? 1 : camIn.zoom};
        const toSrc = camIn.to || {};
        const to = {x: toSrc.x == null ? from.x : toSrc.x, y: toSrc.y == null ? from.y : toSrc.y, zoom: toSrc.zoom == null ? from.zoom : toSrc.zoom};
        cam.beat(shot.t, shot.set);
        const moveDur = camIn._crash ? Math.min(Math.max(0.05, shot.dur - 0.03), 6 / fps) : Math.max(0.05, shot.dur - 0.03);
        tl.fromTo(cam.p, {x: from.x, y: from.y, zoom: from.zoom}, Object.assign({duration: moveDur, ease: camIn.ease || 'sine.inOut', immediateRender: i === 0}, to), shot.t);
        if (camIn.focus) cam.rackFocus(tl, camIn.focus, shot.t, 0.35);
        const prev = i ? shots[i - 1] : null;
        const soft = prev && prev.set === shot.set && prev.lighting === shot.lighting;
        light.cut(tl, shot.lighting || 'flat', shot.time || 'day', shot.weather || 'clear', shot.t, i === 0 ? 0.01 : (soft ? 0.4 : 0.08));
        if (shot.transition === 'whip') S.MG.whipPan(tl, screen, {start: shot.t, dur: 6 / fps, dir: i % 2 ? -1 : 1, seed: 11 + i});
        if (shot.transition === 'crash') {
          const flash = S.div({class: 'ss-crash', style: {position: 'absolute', inset: '0', background: '#FFFFFF', opacity: 0, pointerEvents: 'none'}}, screen);
          tl.fromTo(flash, {opacity: 0}, {opacity: 1, duration: 1 / fps, ease: 'none', immediateRender: false}, shot.t);
          tl.to(flash, {opacity: 0, duration: 1 / fps, ease: 'none'}, shot.t + 1 / fps);
        }
        if (camIn.shake) {
          const sh = camIn.shake;
          const amp = Math.max(2, Math.min(4, sh.amp == null ? 3 : sh.amp));
          const dur = Math.min(sh.dur == null ? 8 / fps : sh.dur, 8 / fps);
          cam.impactShake(tl, sh.at == null ? shot.t : sh.at, amp, dur);
        }
        if (camIn.preset === 'ots' && shot.foreground && S.Cast[shot.foreground.cast]) {
          const side = shot.foreground.side === 'right' ? 1 : -1;
          const fg = S.Character.create(S.Cast[shot.foreground.cast], {
            id: 'ots-' + i, parent: stage.layers[4].html,
            p: {x: side < 0 ? 260 : 1660, y: 1240, scale: 2.15, facing: side < 0 ? 1 : -1}
          });
          fg.wrap.style.filter = 'blur(12px)';
          fg.wrap.style.opacity = '0.92';
          const t0 = shot.t, t1 = shot.t + shot.dur;
          S.onApply((time) => { fg.wrap.style.display = (time >= t0 && time < t1 - 0.001) ? '' : 'none'; }, 7);
        }
      });
      const active = new S.Track(shots[0].set);
      shots.forEach((s) => active.set(s.t, s.set));
      const setList = names.map((n) => sets[n]);
      function show(name) {
        for (let i = 0; i < setList.length; i++) {
          const rec = setList[i];
          const on = rec.name === name;
          for (let n = 0; n < rec.nodes.length; n++) rec.nodes[n].setAttribute('display', on ? 'inline' : 'none');
          for (let c = 0; c < rec.chars.length; c++) rec.chars[c].wrap.style.display = on ? '' : 'none';
        }
      }
      S.onApply((t) => show(active.at(t)), 6);
      const propFiles = [];
      (spec.props || []).forEach((p) => {
        if (p.file) {
          const resolved = S.propSvgPath(p.file);
          propFiles.push({id: p.id || p.file, file: p.file, resolved: resolved});
        }
        if (!p.kind) return;
        const rec = sets[p.set];
        if (!rec) throw new Error('prop set ' + p.set);
        const slot = rec.slots[p.slot];
        if (!slot) throw new Error('set ' + p.set + ' has no slot ' + p.slot);
        const made = S.Props[p.kind](rec.L[slot.layer], Object.assign({}, p, {x: slot.x, y: slot.y, scale: p.scale || 0.65, paper: p.paper === true, id: p.id || null}));
        if (made.animate) made.animate(tl, p.t || 0, p.tEnd || spec.duration, p.anim || {});
      });
      (spec.vehicles || []).forEach((v) => {
        const rec = sets[v.set];
        if (!rec) throw new Error('vehicle set ' + v.set);
        const layer = v.layer == null ? ((v.kind === 'jet' || v.kind === 'ship') ? 0 : (v.kind === 'truck' || v.kind === 'van') ? 1 : 2) : v.layer;
        const fromX = v.fromX != null ? v.fromX : (v.x || 0);
        const toX = v.toX != null ? v.toX : fromX;
        const y = v.y == null ? S.World.STREET.near : v.y;
        const veh = S.World.vehicle(rec.L[layer], {kind: v.kind, brand: S.Brand.get(brands, v.brand), x: fromX, y: y, scale: v.scale || 1, facing: toX !== fromX ? (toX < fromX ? -1 : 1) : (v.facing || 1)});
        S.World.drive(tl, veh, {fromX: fromX, toX: toX, fromY: y, toY: v.toY != null ? v.toY : y, t: v.t, dur: v.dur, ease: v.ease, facing: v.facing});
      });
      const cast = [];
      (spec.characters || []).forEach((c) => {
        const rec = sets[c.set];
        if (!rec) throw new Error('character set ' + c.set);
        let cfg = S.Cast[c.cast];
        if (c.rig && cfg && cfg.paper && cfg.meta && S.paper8) {
          cfg = S.paper8(Object.assign({}, cfg.meta, c.rig, {name: cfg.name}));
          if (c.cast === 'TheClipboard') {
            cfg = Object.freeze(Object.assign({}, cfg, {restHandR: 'grip-prop',
              draw: Object.assign({}, cfg.draw, {mountR: function (g) { if (S.Props.clipboard) S.Props.clipboard(g, {x: 0, y: 26, scale: 0.42, rot: 180}); }})}));
          }
        }
        const ch = S.Character.create(cfg, {
          id: c.id || c.cast.toLowerCase(),
          parent: stage.layers[3].html,
          p: {x: c.x || 960, y: c.y != null ? c.y : rec.floorY, scale: c.scale || 0.82, facing: c.facing || 1}
        });
        if (c.lightSide != null && ch.tracks.lightSide) ch.tracks.lightSide.set(0, c.lightSide);
        rec.chars.push(ch);
        cast.push(ch);
        if (c.brand) S.Brand.pin(ch, S.Brand.get(brands, c.brand));
        // a paper figure that types is seated at its own workstation (hands rest on the keys, desk hides the legs)
        const types = (c.keys || []).some((k) => k.gesture === 'type');
        const ws = c.workstation === undefined ? types : c.workstation;
        if (ws && ch.cfg.paper && S.Workstation) {
          const b = c.brand ? S.Brand.get(brands, c.brand) : null;
          S.Workstation.attach(ch, Object.assign({side: (c.x || 960) < 960 ? -1 : 1, logo: b ? b.accent : null}, typeof ws === 'object' ? ws : {}));
        }
        S.Direct.keys(tl, ch, c.keys || [], spec.duration);
      });
      shots.forEach((s) => {
        if (s.lightSide == null) return;
        cast.forEach((ch) => { if (ch.cfg.paper && ch.tracks.lightSide) ch.tracks.lightSide.set(s.t, s.lightSide); });
      });
      (spec.mograph || []).forEach((m) => {
        S.Kit.mount(tl, screen, m, brands);
        cam.beat(m.t || 0, 'mg-' + m.type);
        if (m.type === 'stamp') cam.impactShake(tl, (m.t || 0) + 3 / fps, 3, 3 / fps);
      });
      names.forEach((name) => {
        if (!S.Textures || !S.Textures.dust) return;
        if (name === 'city-night' || name === 'paper' || name === 'evidence-table' || name === 'video-call-grid' || name === 'debate-split' || (spec.setParams && spec.setParams[name] && spec.setParams[name].density === 'bare')) return;
        S.Textures.dust(tl, sets[name].L[1], {count: 14, x: 180, y: 80, w: 1600, h: 520, seed: S.hash(name + ':dust'), start: 0, end: spec.duration, opacity: 0.28, color: '#FFF6E0'});
      });
      tl.set({}, {}, spec.duration);
      show(shots[0].set);
      tl.pause(0);
      S.applyAll(0);
      window.__timelines = window.__timelines || {};
      window.__timelines[spec.id || 'scene'] = tl;
      window.__beatAudit = function () { return cam.beatAudit(spec.duration); };
      host.dataset.compositionId = spec.id || 'scene';
      host.dataset.duration = String(spec.duration);
      return {spec: spec, stage: stage, sets: sets, camera: cam, light: light, tl: tl, screen: screen, cast: cast, brands: brands, propFiles: propFiles};
    }
  };
})(window.Studio = window.Studio || {});
