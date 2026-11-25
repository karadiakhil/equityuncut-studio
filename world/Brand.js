/* Fictional livery. Logos, colours and short names are data, never real trademarks.
 * A scene_spec brands[] list overrides these defaults. The same record paints vehicles,
 * building signs, screen headers, evidence plates and a chest badge on a character.
 */
(function (S) {
  'use strict';
  const DEFAULTS = [
    {id: 'northline', name: 'NORTHLINE', short: 'NL', tag: 'SYSTEMS', primary: '#0B1F33', accent: '#F5C542', trim: '#E8EEF5'},
    {id: 'harbor', name: 'HARBOR', short: 'HF', tag: 'FIELD', primary: '#16324A', accent: '#7DD3FC', trim: '#F4E8C8'},
    {id: 'redcab', name: 'REDCAB', short: 'RC', tag: 'HAIL', primary: '#B91C1C', accent: '#FDE68A', trim: '#FFFDF9'},
    {id: 'kiln', name: 'KILN', short: 'KF', tag: 'FREIGHT', primary: '#3F3F46', accent: '#FB923C', trim: '#F5F5F4'},
    {id: 'lumen', name: 'LUMEN', short: 'LB', tag: 'BANK', primary: '#065F46', accent: '#F5C542', trim: '#ECFDF5'},
    {id: 'nightwire', name: 'NIGHTWIRE', short: 'NW', tag: 'NEWS', primary: '#1E1B4B', accent: '#F87171', trim: '#F8FAFC'}
  ];
  function color(c, fallback) {
    if (!c) return fallback;
    if (S.PALETTE[c]) return S.PALETTE[c];
    return c;
  }
  S.Brand = {
    defaults: DEFAULTS,
    library(list) {
      const map = {};
      DEFAULTS.forEach((b) => { map[b.id] = Object.assign({}, b); });
      (list || []).forEach((b) => {
        if (!b || !b.id) return;
        map[b.id] = Object.assign({}, map[b.id] || {id: b.id, name: b.id, short: String(b.id).slice(0, 2).toUpperCase(), tag: ''}, b);
      });
      Object.keys(map).forEach((k) => {
        const b = map[k];
        b.primary = color(b.primary, '#0F172A');
        b.accent = color(b.accent, '#F5C542');
        b.trim = color(b.trim, '#FFFDF9');
        b.name = b.name || k.toUpperCase();
        b.short = (b.short || b.name).slice(0, 3);
      });
      return map;
    },
    get(map, id) {
      if (map && id && map[id]) return map[id];
      if (map && map.northline) return map.northline;
      return DEFAULTS[0];
    },
    /* layout: 'lockup' (mark + word), 'mark', 'word'. Draws in a group, origin top-left of the mark. */
    logo(parent, brand, o) {
      o = o || {};
      brand = brand || DEFAULTS[0];
      const g = S.g(parent, {transform: 'translate(' + (o.x || 0) + ' ' + (o.y || 0) + ') scale(' + (o.scale || 1) + ')'});
      const layout = o.layout || 'lockup';
      if (layout !== 'word') {
        S.svg('rect', {x: 0, y: 0, width: 36, height: 36, rx: 6, fill: brand.primary, stroke: S.INK, 'stroke-width': 2}, g);
        S.svg('rect', {x: 4, y: 4, width: 28, height: 7, fill: brand.accent}, g);
        const t = S.svg('text', {x: 18, y: 28, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 12, fill: brand.trim}, g);
        t.textContent = String(brand.short || 'NL').slice(0, 2);
      }
      if (layout !== 'mark') {
        const x = layout === 'word' ? 0 : 44;
        const a = S.svg('text', {x: x, y: 16, 'font-family': 'Archivo Black, sans-serif', 'font-size': o.size || 16, fill: o.color || brand.trim, 'letter-spacing': '0.5'}, g);
        a.textContent = brand.name;
        if (brand.tag && o.tag !== false) {
          const b = S.svg('text', {x: x, y: 32, 'font-family': 'JetBrains Mono, monospace', 'font-size': 9, fill: brand.accent, 'letter-spacing': '1.6'}, g);
          b.textContent = brand.tag;
        }
      }
      return g;
    },
    pin(ch, brand) {
      if (!ch || !ch.n || !ch.n.torso || !brand) return null;
      const b = (ch.cfg && ch.cfg.badge) || [22, -348];
      const under = ch.n.under || ch.n.noodle && ch.n.noodle.L;
      const g = S.g(ch.n.torso, {id: ch.id + '-badge'});
      if (under) ch.n.torso.insertBefore(g, under);   // under the arms and the desk top
      S.svg('circle', {cx: b[0], cy: b[1], r: 15, fill: brand.primary, stroke: S.INK, 'stroke-width': 2}, g);
      S.svg('circle', {cx: b[0], cy: b[1], r: 10, fill: 'none', stroke: brand.accent, 'stroke-width': 2}, g);
      const t = S.svg('text', {x: b[0], y: b[1] + 4, 'text-anchor': 'middle', 'font-family': 'Archivo Black, sans-serif', 'font-size': 8, fill: brand.trim}, g);
      t.textContent = String(brand.short || 'NL').slice(0, 2);
      return g;
    }
  };
})(window.Studio = window.Studio || {});
