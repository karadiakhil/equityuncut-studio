/* Motion-graphics kit driven by scene_spec mograph entries.
 * caption, kinetic, money, map, evidence, phone, laptop.
 * Panels sit in screen space, above the grade, so a camera move does not drag the type.
 * Reveals are finite tweens. Typing and the map route are pure functions of t.
 */
(function (S) {
  'use strict';
  const C = S.PALETTE;
  const readers = [];

  function hide(tl, el, t, out) {
    tl.set(el, {opacity: 0}, 0);
    tl.fromTo(el, {opacity: 0}, {opacity: 1, duration: 0.22, ease: 'power2.out', immediateRender: false}, t);
    if (out != null) tl.to(el, {opacity: 0, duration: 0.2, ease: 'power2.in'}, Math.max(t + 0.3, out - 0.18));
  }
  function qbez(a, b, c, u) {
    const k = 1 - u;
    return [k * k * a[0] + 2 * k * u * b[0] + u * u * c[0], k * k * a[1] + 2 * k * u * b[1] + u * u * c[1]];
  }

  const Kit = S.Kit = {
    types: ['caption', 'kinetic', 'money', 'map', 'evidence', 'phone', 'laptop', 'stamp', 'card', 'newspaper', 'doc', 'folder', 'chart'],
    mount(tl, parent, item, brands) {
      const t = item.t || 0;
      const out = item.out;
      if (item.type === 'caption') return caption(tl, parent, item, t, out);
      if (item.type === 'kinetic') return kinetic(tl, parent, item, t, out);
      if (item.type === 'money') return money(tl, parent, item, t, out);
      if (item.type === 'map') return map(tl, parent, item, t, out);
      if (item.type === 'evidence') return evidence(tl, parent, item, t, out);
      if (item.type === 'phone') return phone(tl, parent, item, brands, t, out);
      if (item.type === 'laptop') return laptop(tl, parent, item, brands, t, out);
      if (item.type === 'stamp') return stamp(tl, parent, item, t, out);
      if (item.type === 'card') return card(tl, parent, item, t, out);
      if (item.type === 'newspaper') return newspaper(tl, parent, item, t, out);
      if (item.type === 'doc') return doc(tl, parent, item, t, out);
      if (item.type === 'folder') return folder(tl, parent, item, t, out);
      if (item.type === 'chart') return chart(tl, parent, item, t, out);
      throw new Error('unknown mograph ' + item.type);
    }
  };

  function caption(tl, parent, item, t, out) {
    const y = item.y == null ? 900 : item.y;
    const bar = S.div({class: 'ss-caption', 'data-collide': 'caption', style: {position: 'absolute', left: '64px', top: y + 'px', display: 'flex', alignItems: 'stretch', gap: '0', opacity: 0}}, parent);
    S.div({style: {width: '8px', background: item.color || C.gold}}, bar);
    const body = S.div({style: {background: 'rgba(10,12,18,0.88)', padding: '10px 18px 12px', maxWidth: '820px'}}, bar);
    if (item.kicker) S.div({text: item.kicker, style: {font: "700 14px 'JetBrains Mono', monospace", letterSpacing: '0.16em', color: item.color || C.gold, marginBottom: '2px'}}, body);
    S.div({text: item.text || '', style: {font: "400 32px 'Archivo Black', sans-serif", color: '#F8FAFC', letterSpacing: '0.01em', lineHeight: 1}}, body);
    hide(tl, bar, t, out);
    tl.fromTo(bar, {clipPath: 'inset(0 100% 0 0)'}, {clipPath: 'inset(0 0% 0 0)', duration: 0.45, ease: 'power3.out', immediateRender: false}, t);
    return bar;
  }
  function kinetic(tl, parent, item, t, out) {
    const wrap = S.div({style: {position: 'absolute', inset: '0', opacity: 0, pointerEvents: 'none'}}, parent);
    S.MG.kineticText(tl, wrap, {
      text: item.text || '', x: item.x || 960, y: item.y || 180, size: item.size || 72, start: t, out: out,
      color: item.color || '#F8FAFC', highlight: item.highlight || [], highlightColor: item.highlightColor || C.gold, align: item.align || 'center'
    });
    hide(tl, wrap, t, out);
    return wrap;
  }
  function money(tl, parent, item, t, out) {
    const wrap = S.div({class: 'ss-money', style: {position: 'absolute', inset: '0', opacity: 0, pointerEvents: 'none'}}, parent);
    const x = item.x || 960, y = item.y || 520;
    S.div({text: item.label || '', style: {position: 'absolute', left: x + 'px', top: (y - 96) + 'px', transform: 'translate(-50%, 0)', font: "700 16px 'JetBrains Mono', monospace", letterSpacing: '0.18em', color: item.accent || C.gold}}, wrap);
    const dec = item.decimals == null ? 0 : item.decimals;
    S.MG.counter(tl, wrap, {
      x: x, y: y, from: item.from || 0, to: item.to || 0, start: t + 0.15, dur: item.dur || 1.15,
      size: item.size || 96, color: item.color || '#F8FAFC', prefix: item.prefix == null ? '$' : item.prefix, suffix: item.suffix || '',
      format: (v) => dec ? Number(v).toFixed(dec) : Math.round(v).toLocaleString('en-US')
    });
    const rule = S.div({style: {position: 'absolute', left: (x - 160) + 'px', top: (y + 58) + 'px', height: '4px', width: '0px', background: item.accent || C.gold}}, wrap);
    tl.fromTo(rule, {width: '0px'}, {width: '320px', duration: 0.4, ease: 'power3.out', immediateRender: false}, t + 0.2);
    hide(tl, wrap, t, out);
    return wrap;
  }
  function map(tl, parent, item, t, out) {
    const wrap = S.div({class: 'ss-map', 'data-collide': 'headline', style: {position: 'absolute', left: '250px', top: '180px', width: '1420px', height: '700px', opacity: 0}}, parent);
    S.div({style: {position: 'absolute', inset: '0', background: '#E3E1D5', border: '4px solid #141114', borderRadius: '4px'}}, wrap);
    S.div({text: item.title || 'ROUTE', style: {position: 'absolute', left: '36px', top: '24px', font: "400 28px 'Archivo Black', sans-serif", color: '#141114', letterSpacing: '0.08em'}}, wrap);
    const svg = S.svg('svg', {width: 1420, height: 700, viewBox: '0 0 1420 700', style: 'position:absolute;inset:0'}, wrap);
    S.path(svg, 'M180,180 C260,120 340,200 420,160 C520,110 560,220 640,200 C700,184 760,120 860,150 C980,190 1040,120 1180,160 L1180,520 C1000,560 860,500 720,530 C560,566 420,500 280,540 C220,556 180,520 180,480 Z', '#C4B8A4', null, {stroke: '#28363F', 'stroke-width': 3});
    S.path(svg, 'M240,300 C320,260 380,340 460,300 C540,260 600,340 700,310 C820,270 900,360 1040,320 C1120,300 1160,250 1200,270 L1180,500 C1000,540 860,470 700,510 C520,556 380,480 260,510 Z', '#D7C4A4', null, {stroke: '#28363F', 'stroke-width': 2});
    const a = [340, 250], c = [1080, 430], b = [700, 160];
    let d = 'M' + a[0] + ' ' + a[1] + ' Q' + b[0] + ' ' + b[1] + ' ' + c[0] + ' ' + c[1];
    const route = S.path(svg, d, 'none', null, {stroke: '#141114', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': '10 8'});
    const len = 900;
    route.setAttribute('stroke-dasharray', len);
    route.setAttribute('stroke-dashoffset', len);
    S.svg('circle', {cx: a[0], cy: a[1], r: 8, fill: '#F8FAFC', stroke: '#F5C542', 'stroke-width': 3}, svg);
    S.svg('circle', {cx: c[0], cy: c[1], r: 8, fill: '#F8FAFC', stroke: '#F87171', 'stroke-width': 3}, svg);
    const from = S.svg('text', {x: a[0] - 10, y: a[1] + 36, 'font-family': 'Kalam, cursive', 'font-size': 22, fill: '#141114'}, svg);
    from.textContent = item.from || 'ORIGIN';
    const to = S.svg('text', {x: c[0] - 80, y: c[1] + 36, 'font-family': 'Kalam, cursive', 'font-size': 22, fill: '#141114'}, svg);
    to.textContent = item.to || 'DESTINATION';
    if (item.via) {
      const via = S.svg('text', {x: 700, y: 130, 'text-anchor': 'middle', 'font-family': 'JetBrains Mono, monospace', 'font-size': 16, fill: '#F5C542'}, svg);
      via.textContent = item.via;
    }
    const plane = S.g(svg, {});
    S.path(plane, 'M0,0 L18,4 L0,10 L4,5 Z', '#F8FAFC', 1.2);
    readers.push({
      at: (time) => {
        const u = S.clamp((time - t) / Math.max(0.4, (out || t + 2) - t - 0.3), 0, 1);
        const e = u * u * (3 - 2 * u);
        route.setAttribute('stroke-dashoffset', String(len * (1 - e)));
        const p = qbez(a, b, c, e);
        const p2 = qbez(a, b, c, Math.min(1, e + 0.02));
        const ang = Math.atan2(p2[1] - p[1], p2[0] - p[0]) * 180 / Math.PI;
        plane.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
      }
    });
    hide(tl, wrap, t, out);
    return wrap;
  }
  function evidence(tl, parent, item, t, out) {
    const card = S.div({class: 'ss-evidence', 'data-collide': 'headline', style: {position: 'absolute', left: (item.x || 1180) + 'px', top: (item.y || 180) + 'px', width: '520px', padding: '28px 30px 34px', background: '#F4E7C8', color: '#1F2937', border: '3px solid #18181B', boxShadow: '10px 12px 0 rgba(0,0,0,0.35)', opacity: 0, transformOrigin: '0% 50%'}}, parent);
    S.div({text: item.kicker || 'FILE', style: {font: "700 13px 'JetBrains Mono', monospace", letterSpacing: '0.14em', color: '#991B1B'}}, card);
    S.div({text: item.title || 'DOCUMENT', style: {font: "400 36px 'Archivo Black', sans-serif", color: '#18181B', margin: '4px 0 12px'}}, card);
    (item.lines || []).forEach((ln, i) => {
      const row = S.div({style: {position: 'relative', margin: '8px 0', font: "600 20px 'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap'}}, card);
      S.div({text: ln.text || '', style: {display: 'inline-block'}}, row);
      if (ln.redact) {
        const b = S.div({style: {position: 'absolute', left: '0', top: '2px', height: '1.05em', width: (ln.redact * 100) + '%', background: '#18181B', transformOrigin: '0 50%'}}, row);
        tl.fromTo(b, {scaleX: 0}, {scaleX: 1, duration: 0.22, ease: 'power3.out', immediateRender: false}, t + 0.35 + i * 0.12);
      }
    });
    const stamp = S.div({text: item.stamp || 'FILED', style: {position: 'absolute', right: '24px', bottom: '24px', font: "400 26px 'Archivo Black', sans-serif", color: '#DC2626', border: '4px solid #DC2626', padding: '2px 10px', transform: 'rotate(-8deg)', opacity: 0}}, card);
    tl.fromTo(card, {rotationY: -70, transformPerspective: 900}, {rotationY: 0, duration: 0.45, ease: 'power3.out', immediateRender: false}, t);
    tl.fromTo(stamp, {scale: 1.6, opacity: 0}, {scale: 1, opacity: 0.9, duration: 0.16, ease: 'back.out(2)', immediateRender: false}, t + 0.55);
    hide(tl, card, t, out);
    return card;
  }
  function phone(tl, parent, item, brands, t, out) {
    const brand = S.Brand.get(brands, item.brand || 'northline');
    const wrap = S.div({class: 'ss-phone', 'data-collide': 'headline', style: {position: 'absolute', left: (item.x || 1380) + 'px', top: (item.y || 160) + 'px', width: '340px', height: '640px', opacity: 0}}, parent);
    S.div({style: {position: 'absolute', inset: '0', background: '#0B0B0C', borderRadius: '36px', border: '3px solid #E7E5E4', boxShadow: '0 20px 40px rgba(0,0,0,0.45)'}}, wrap);
    const screen = S.div({style: {position: 'absolute', left: '14px', right: '14px', top: '18px', bottom: '16px', background: '#0F172A', borderRadius: '26px', overflow: 'hidden'}}, wrap);
    const head = S.div({style: {height: '64px', background: brand.primary, display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px'}}, screen);
    S.div({text: brand.short, style: {width: '28px', height: '28px', borderRadius: '6px', background: brand.accent, color: brand.primary, font: "400 12px 'Archivo Black', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center'}}, head);
    S.div({text: brand.name, style: {font: "400 16px 'Archivo Black', sans-serif", color: brand.trim}}, head);
    (item.messages || []).forEach((msg, i) => {
      const bubble = S.div({style: {margin: '16px 14px 0', background: i % 2 ? '#1E293B' : brand.primary, borderRadius: '14px', padding: '10px 12px', opacity: 0}}, screen);
      S.div({text: msg.from || '', style: {font: "700 11px 'JetBrains Mono', monospace", color: brand.accent, letterSpacing: '0.08em', marginBottom: '4px'}}, bubble);
      S.div({text: msg.text || '', style: {font: "600 16px 'Plus Jakarta Sans', sans-serif", color: '#F8FAFC', lineHeight: 1.3}}, bubble);
      tl.fromTo(bubble, {y: 24, opacity: 0}, {y: 0, opacity: 1, duration: 0.28, ease: 'power2.out', immediateRender: false}, t + 0.25 + i * 0.35);
    });
    hide(tl, wrap, t, out);
    return wrap;
  }
  function laptop(tl, parent, item, brands, t, out) {
    const brand = S.Brand.get(brands, item.brand || 'northline');
    const wrap = S.div({class: 'ss-laptop', 'data-collide': 'headline', style: {position: 'absolute', left: '280px', top: '150px', width: '1360px', height: '760px', opacity: 0}}, parent);
    S.div({style: {position: 'absolute', left: '80px', top: '40px', right: '80px', bottom: '70px', background: '#0B0B0C', borderRadius: '16px', border: '3px solid #E5E7EB'}}, wrap);
    const screen = S.div({style: {position: 'absolute', left: '100px', right: '100px', top: '60px', bottom: '100px', background: '#04120F', borderRadius: '8px', overflow: 'hidden', padding: '18px 22px'}}, wrap);
    const bar = S.div({style: {display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px'}}, screen);
    S.div({text: brand.name + '  /  ' + (item.title || 'shell'), style: {font: "700 16px 'JetBrains Mono', monospace", color: brand.accent}}, bar);
    S.div({text: brand.short, style: {font: "400 14px 'Archivo Black', sans-serif", color: brand.trim, background: brand.primary, padding: '4px 8px'}}, bar);
    const lines = item.lines || [];
    const rows = lines.map((line) => S.div({text: '', style: {font: "400 26px 'JetBrains Mono', monospace", color: '#A7F3D0', lineHeight: 1.45, whiteSpace: 'pre'}}, screen));
    const joined = lines.join('\n');
    readers.push({
      at: (time) => {
        const u = S.clamp((time - (t + 0.2)) / Math.max(0.5, (out || t + 2) - t - 0.5), 0, 1);
        const n = Math.floor(u * (joined.length + 1));
        let left = n;
        for (let i = 0; i < lines.length; i++) {
          const take = Math.max(0, Math.min(lines[i].length, left));
          rows[i].textContent = lines[i].slice(0, take);
          left -= lines[i].length + 1;
        }
      }
    });
    S.div({style: {position: 'absolute', left: '40px', right: '40px', bottom: '28px', height: '28px', background: '#9CA3AF', borderRadius: '0 0 10px 10px', border: '2px solid #18181B'}}, wrap);
    hide(tl, wrap, t, out);
    return wrap;
  }

  const PAPER = '#E3E1D5', INK = '#141114', DEEP = '#28363F', RED = '#D94A3A', NIGHT = '#0B0B0C';
  function stamp(tl, parent, item, t, out) {
    const fps = S.FPS || 30;
    const slam = 3 / fps;
    const el = S.div({class: 'ss-stamp', 'data-collide': 'headline', style: {position: 'absolute', left: (item.x || 960) + 'px', top: (item.y || 420) + 'px', transform: 'translate(-50%, -50%) rotate(' + (item.rot || -8) + 'deg)', opacity: 0, color: item.color || RED, border: '6px solid ' + (item.color || RED), padding: '8px 18px', font: "400 54px 'Archivo Black', sans-serif", letterSpacing: '0.08em', textShadow: '0 0 0 ' + INK}}, parent);
    el.textContent = item.text || 'FILED';
    const bleed = S.div({style: {position: 'absolute', inset: '-8px', border: '2px solid ' + (item.color || RED), opacity: 0.35, pointerEvents: 'none'}}, el);
    tl.fromTo(el, {scale: 1.6, opacity: 0}, {scale: 1, opacity: 1, duration: slam, ease: 'power4.in', immediateRender: false}, t);
    tl.fromTo(el, {x: 3}, {x: 0, duration: slam, ease: 'power2.out', immediateRender: false}, t + slam);
    hide(tl, el, t, out);
    return el;
  }
  function card(tl, parent, item, t, out) {
    const el = S.div({class: 'ss-card', 'data-collide': 'headline', style: {position: 'absolute', left: (item.x || 360) + 'px', top: (item.y || 280) + 'px', width: '1200px', minHeight: '280px', background: NIGHT, color: PAPER, padding: '36px 48px', opacity: 0, font: "700 64px Kalam, cursive", lineHeight: 1.25}}, parent);
    const text = S.div({text: item.text || '', style: {clipPath: 'inset(0 100% 0 0)'}}, el);
    const dur = Math.max(0.2, (out || t + 1.8) - t);
    tl.fromTo(text, {clipPath: 'inset(0 100% 0 0)'}, {clipPath: 'inset(0 0% 0 0)', duration: Math.min(1.4, dur * 0.75), ease: 'none', immediateRender: false}, t + 0.08);
    hide(tl, el, t, out);
    return el;
  }
  function newspaper(tl, parent, item, t, out) {
    const from = item.from === 'right' ? 1 : -1;
    const rot = from * 6;
    const el = S.div({class: 'ss-news', 'data-collide': 'headline', style: {position: 'absolute', left: '460px', top: '220px', width: '1000px', background: PAPER, color: INK, border: '4px solid ' + DEEP, padding: '28px 36px', opacity: 0, transform: 'rotate(' + rot + 'deg)'}}, parent);
    S.div({text: item.headline || item.text || 'THE LEDGER', style: {font: "400 48px 'Archivo Black', sans-serif"}}, el);
    tl.fromTo(el, {x: from * -240, rotation: rot, opacity: 0}, {x: 0, rotation: rot * 0.15, opacity: 1, duration: 0.4, ease: 'power3.out', immediateRender: false}, t);
    hide(tl, el, t, out);
    return el;
  }
  function doc(tl, parent, item, t, out) {
    const el = S.div({class: 'ss-doc', 'data-collide': 'headline', style: {position: 'absolute', left: (item.x || 560) + 'px', top: (item.y || 180) + 'px', width: '760px', background: PAPER, color: INK, border: '3px solid ' + DEEP, padding: '28px 32px', opacity: 0}}, parent);
    S.div({text: (item.kind || 'invoice').toUpperCase(), style: {font: "400 28px 'Archivo Black', sans-serif", marginBottom: '12px'}}, el);
    (item.lines || []).forEach((ln, i) => {
      const row = S.div({style: {position: 'relative', margin: '10px 0', font: "600 22px 'Plus Jakarta Sans', sans-serif", lineHeight: 1.3}}, el);
      S.div({text: ln.text || ln, 'data-collide': 'caption', style: {display: 'inline-block'}}, row);
      if (ln.redact) {
        const b = S.div({style: {position: 'absolute', left: '0', top: '2px', height: '1.05em', width: (ln.redact * 100) + '%', background: INK, transformOrigin: '0 50%'}}, row);
        tl.fromTo(b, {scaleX: 0}, {scaleX: 1, duration: 0.2, ease: 'power3.out', immediateRender: false}, t + 0.3 + i * 0.1);
      }
    });
    hide(tl, el, t, out);
    return el;
  }
  function chart(tl, parent, item, t, out) {
    const el = S.div({class: 'ss-chart', 'data-collide': 'headline', style: {position: 'absolute', left: (item.x || 360) + 'px', top: (item.y || 220) + 'px', width: '1100px', height: '560px', background: '#E3E1D5', border: '4px solid #141114', opacity: 0}}, parent);
    const svg = S.svg('svg', {width: 1100, height: 560, viewBox: '0 0 1100 560'}, el);
    S.path(svg, 'M80,80 L80,480 L1020,480', 'none', null, {stroke: '#141114', 'stroke-width': 3, fill: 'none'});
    const series = item.series || [12, 18, 9, 30, 22, 40];
    const max = Math.max.apply(null, series.concat([1]));
    const col = item.color === 'crash' ? '#D94A3A' : '#1F7A4D';
    let d = '';
    series.forEach((v, i) => {
      const x = 120 + i * (860 / Math.max(1, series.length - 1));
      const y = 460 - (v / max) * 340;
      d += (i ? ' L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
      if (item.type === 'bar' || item.chart === 'bar') S.svg('rect', {x: x - 18, y: y, width: 36, height: 460 - y, fill: col, stroke: '#141114', 'stroke-width': 2}, svg);
    });
    if (!(item.chart === 'bar' || item.type === 'bar')) {
      const line = S.path(svg, d, 'none', null, {stroke: col, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round'});
      const len = 1200;
      line.setAttribute('stroke-dasharray', len);
      line.setAttribute('stroke-dashoffset', len);
      tl.fromTo(line, {attr: { 'stroke-dashoffset': len }}, {attr: { 'stroke-dashoffset': 0 }, duration: Math.max(0.4, (out || t + 2) - t - 0.4), ease: 'none', immediateRender: false}, t + 0.15);
    }
    hide(tl, el, t, out);
    return el;
  }
  function folder(tl, parent, item, t, out) {
    const el = S.div({class: 'ss-folder', 'data-collide': 'headline', style: {position: 'absolute', left: (item.x || 620) + 'px', top: (item.y || 300) + 'px', width: '680px', height: '420px', background: '#C4B8A4', border: '4px solid ' + DEEP, opacity: 0}}, parent);
    S.div({style: {position: 'absolute', left: '0', top: '-36px', width: '220px', height: '40px', background: '#C4B8A4', border: '4px solid ' + DEEP, borderBottom: 'none'}}, el);
    S.div({text: item.label || 'FOLDER', style: {position: 'absolute', left: '48px', top: '40px', font: "400 36px 'Archivo Black', sans-serif", color: INK}}, el);
    hide(tl, el, t, out);
    tl.fromTo(el, {y: 40}, {y: 0, duration: 0.35, ease: 'power3.out', immediateRender: false}, t);
    return el;
  }

  S.onApply((t) => { for (let i = 0; i < readers.length; i++) readers[i].at(t); }, 22);
})(window.Studio = window.Studio || {});
