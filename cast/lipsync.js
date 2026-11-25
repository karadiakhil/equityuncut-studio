/* 8-viseme mouth rig + expression mouths, and a deterministic text/timestamp -> viseme timeline mapper.
 * Visemes: REST MBP FV AI E O U LTH. Expression mouths: smirk frown flat grin gasp grimace.
 * Mapper inputs: ElevenLabs /with-timestamps alignment, word timings [{word,start,end}], or timed lines [{text,start,end}].
 */
(function (S) {
  'use strict';
  const MOUTH = '#3B0F14', TONGUE = '#E06A6A', TEETH = '#FFFDF9';
  S.VISEMES = ['REST', 'MBP', 'FV', 'AI', 'E', 'O', 'U', 'LTH'];
  S.MOUTH_MOODS = ['smirk', 'frown', 'flat', 'grin', 'gasp', 'grimace'];
  // openness drives the jaw drop
  S.VISEME_OPEN = {REST: 0, MBP: 0, FV: 0.15, AI: 1, E: 0.45, O: 0.8, U: 0.3, LTH: 0.5, smirk: 0, frown: 0, flat: 0, grin: 0.3, gasp: 1, grimace: 0.35};

  function interior(g, d, defs, teeth, tongue) {
    const id = S.uid('mo');
    S.path(S.svg('clipPath', {id}, defs), d);
    S.path(g, d, MOUTH);
    const c = S.g(g, {'clip-path': `url(#${id})`});
    if (tongue) S.path(c, tongue, TONGUE);
    if (teeth) teeth.forEach((t) => S.path(c, t, TEETH, 'micro'));
    S.path(g, d, 'none', 'mid');
  }
  // Build all mouth shapes into g (centred at 0,0). Returns {name: group}.
  S.buildMouths = function (g, defs, lip) {
    const out = {};
    const mk = (name, fn) => { const m = S.g(g, {'data-mouth': name, display: 'none'}); fn(m); out[name] = m; };
    const lipLine = (m, d) => S.line(m, d, 'micro', lip || null, {opacity: 0.9});
    mk('REST', (m) => { S.line(m, 'M-12 -0.5 C-6 2.2 6 2.2 12 -1.2', 'mid'); S.line(m, 'M-12.8 -2 C-12.6 -0.6 -12.2 0.4 -11.6 0.9', 'micro'); S.line(m, 'M-4 5.2 C-1.5 6.2 1.5 6.2 4 5.2', 'micro', null, {opacity: 0.55}); });
    mk('MBP', (m) => { S.line(m, 'M-11 0 C-4 -1.4 4 -1.4 11 0', 'mid', null, {'stroke-width': 3}); S.line(m, 'M-6 3.6 C-2 5.6 2 5.6 6 3.6', 'micro'); S.line(m, 'M-11.6 -1.4 L-10.6 1', 'micro'); S.line(m, 'M11.6 -1.4 L10.6 1', 'micro'); });
    mk('FV', (m) => { interior(m, 'M-10.5 -1.5 C-4 -3 4 -3 10.5 -1.5 C8.5 4.5 -8.5 4.5 -10.5 -1.5 Z', defs, ['M-8.5 -4 L8.5 -4 L8 1.4 C3 2 -3 2 -8 1.4 Z']); lipLine(m, 'M-7 5.4 C-2.5 7 2.5 7 7 5.4'); });
    mk('AI', (m) => { interior(m, 'M-12.5 -3.5 C-6 -5.5 6 -5.5 12.5 -3.5 C11.5 9.5 6 15.5 0 15.5 C-6 15.5 -11.5 9.5 -12.5 -3.5 Z', defs,
      ['M-11 -6 L11 -6 L10.4 -0.4 C4 -1.6 -4 -1.6 -10.4 -0.4 Z'], 'M-8 15 C-6 8 6 8 8 15 Z'); lipLine(m, 'M-5 18.4 C-2 19.6 2 19.6 5 18.4'); });
    mk('E', (m) => { interior(m, 'M-13.5 -2.5 C-6 -4.5 6 -4.5 13.5 -2.5 C10.5 6.5 -10.5 6.5 -13.5 -2.5 Z', defs,
      ['M-12 -5 L12 -5 L11.4 0.4 C4 -0.6 -4 -0.6 -11.4 0.4 Z', 'M-8 7 C-3 3.6 3 3.6 8 7 L8 9 L-8 9 Z']); lipLine(m, 'M-5 8.6 C-2 9.6 2 9.6 5 8.6'); });
    mk('O', (m) => { interior(m, 'M0 -7.5 C6 -7.5 8.5 -2 8.5 2.5 C8.5 8 5 11.5 0 11.5 C-5 11.5 -8.5 8 -8.5 2.5 C-8.5 -2 -6 -7.5 0 -7.5 Z', defs,
      ['M-6 -9 L6 -9 L5.6 -4.4 C2 -5.2 -2 -5.2 -5.6 -4.4 Z'], 'M-5.5 11 C-4 6.5 4 6.5 5.5 11 Z'); });
    mk('U', (m) => { interior(m, 'M0 -4 C3.6 -4 5 -1.4 5 1.4 C5 4.4 3 6.6 0 6.6 C-3 6.6 -5 4.4 -5 1.4 C-5 -1.4 -3.6 -4 0 -4 Z', defs, null, 'M-3 6.4 C-2 4 2 4 3 6.4 Z');
      S.line(m, 'M-7.6 -1 C-7 0.4 -7 2.2 -7.6 3.6', 'micro'); S.line(m, 'M7.6 -1 C7 0.4 7 2.2 7.6 3.6', 'micro'); });
    mk('LTH', (m) => { interior(m, 'M-11 -2.5 C-5 -4.5 5 -4.5 11 -2.5 C9 8 -9 8 -11 -2.5 Z', defs,
      ['M-9.6 -5 L9.6 -5 L9.2 -0.2 C3 -1.2 -3 -1.2 -9.2 -0.2 Z'], 'M-5.5 8 C-5 1.2 5 1.2 5.5 8 Z'); });
    // expression mouths
    mk('smirk', (m) => { S.line(m, 'M-11 1.2 C-4 2.6 5 0.6 12.5 -5.5', 'mid'); S.line(m, 'M12.5 -5.5 C14.4 -4.6 14.8 -2.6 13.8 -1', 'micro'); S.line(m, 'M-2 6 C1 7 4 6.4 6 5', 'micro', null, {opacity: 0.55}); });
    mk('frown', (m) => { S.line(m, 'M-11 3.5 C-5 -2 5 -2 11 3.5', 'mid'); S.line(m, 'M-11.8 2 L-10.6 4.8', 'micro'); S.line(m, 'M11.8 2 L10.6 4.8', 'micro'); });
    mk('flat', (m) => { S.line(m, 'M-10.5 0.6 C-4 0 4 0 10.5 0.6', 'mid'); S.line(m, 'M-3.5 5 C-1 5.6 1 5.6 3.5 5', 'micro', null, {opacity: 0.5}); });
    mk('grin', (m) => { interior(m, 'M-14 -4 C-6 -1.5 6 -1.5 14 -4 C11 9 -11 9 -14 -4 Z', defs, ['M-13 -6 L13 -6 L12.4 0.2 C4 -0.2 -4 -0.2 -12.4 0.2 Z'], 'M-7 9 C-4 4.4 4 4.4 7 9 Z');
      S.line(m, 'M-14 -4 C-15.4 -5 -16 -6.4 -15.6 -7.8', 'micro'); S.line(m, 'M14 -4 C15.4 -5 16 -6.4 15.6 -7.8', 'micro'); });
    mk('gasp', (m) => { interior(m, 'M0 -9 C6.6 -9 9 -3 9 3 C9 10 5 15 0 15 C-5 15 -9 10 -9 3 C-9 -3 -6.6 -9 0 -9 Z', defs,
      ['M-7 -11 L7 -11 L6.6 -5.6 C2 -6.6 -2 -6.6 -6.6 -5.6 Z'], 'M-6 14.6 C-4.5 9 4.5 9 6 14.6 Z'); });
    mk('grimace', (m) => { interior(m, 'M-14.5 -4.5 L14.5 -4.5 C15.5 3.5 13.5 7.5 10 7.5 L-10 7.5 C-13.5 7.5 -15.5 3.5 -14.5 -4.5 Z', defs,
      ['M-15 -5 L15 -5 L15 8 L-15 8 Z']);
      ['M-7 -4.5 L-7 7.5', 'M0 -4.5 L0 7.5', 'M7 -4.5 L7 7.5', 'M-14.6 1.5 L14.6 1.5'].forEach((d) => S.line(m, d, 'micro')); S.path(m, 'M-14.5 -4.5 L14.5 -4.5 C15.5 3.5 13.5 7.5 10 7.5 L-10 7.5 C-13.5 7.5 -15.5 3.5 -14.5 -4.5 Z', 'none', 'mid'); });
    return out;
  };

  // ---- text -> visemes ------------------------------------------------------------------------------------------
  const DIGRAPH = {th: 'LTH', sh: 'U', ch: 'U', oo: 'U', ee: 'E', ou: 'O', ow: 'O', ph: 'FV', wh: 'U', qu: 'U', ck: 'E', ng: 'E', ai: 'AI', ay: 'E', oa: 'O'};
  const SINGLE = {a: 'AI', i: 'AI', e: 'E', y: 'E', o: 'O', u: 'U', w: 'U', m: 'MBP', b: 'MBP', p: 'MBP', f: 'FV', v: 'FV',
    l: 'LTH', t: 'LTH', d: 'LTH', n: 'LTH', s: 'E', z: 'E', c: 'E', k: 'E', g: 'E', j: 'E', x: 'E', q: 'U', r: 'E', h: 'E'};
  const VOWEL = /[aeiouy]/;
  const NUM = {0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine'};
  function phon(word) {   // word -> [{v, w}] viseme units with weights
    let s = word.toLowerCase().replace(/\$/g, 'dollar').replace(/%/g, 'percent').replace(/\d/g, (d) => NUM[d]).replace(/[^a-z]/g, '');
    const out = [];
    for (let i = 0; i < s.length;) {
      const two = s.slice(i, i + 2);
      if (DIGRAPH[two]) { out.push({v: DIGRAPH[two], w: VOWEL.test(two[0]) ? 1.5 : 0.9}); i += 2; continue; }
      const c = s[i]; if (SINGLE[c]) out.push({v: SINGLE[c], w: VOWEL.test(c) ? 1.4 : (c === 'm' || c === 'b' || c === 'p' ? 0.9 : 0.7)});
      i++;
    }
    // silent trailing e
    if (out.length > 2 && s.endsWith('e') && !s.endsWith('ee')) out.pop();
    return out;
  }
  const MIN = 1 / 15;   // two frames at 30 fps
  function pushWord(keys, units, t0, t1) {
    const tot = units.reduce((a, u) => a + u.w, 0) || 1; let t = t0;
    for (const u of units) { const d = (t1 - t0) * u.w / tot; keys.push({t, v: u.v, d}); t += d; }
  }
  function finish(keys, endT) {
    // merge duplicates, then fold slivers shorter than 2 frames into neighbours (MBP closures survive at 1 frame)
    keys.sort((a, b) => a.t - b.t);
    const m = [];
    for (const k of keys) { const last = m[m.length - 1]; if (last && last.v === k.v) { last.d = k.t + k.d - last.t; continue; } m.push(Object.assign({}, k)); }
    const out = [];
    for (let i = 0; i < m.length; i++) {
      const k = m[i];
      if (k.d < (k.v === 'MBP' ? MIN / 2 : MIN) && out.length && k.v !== 'REST') { out[out.length - 1].d += k.d; continue; }
      out.push(k);
    }
    if (endT != null) out.push({t: endT, v: 'REST', d: 0});
    return out.map((k) => ({t: +k.t.toFixed(4), v: k.v}));
  }
  S.LipSync = {
    phonemes: phon,
    // words: [{word, start, end}]
    fromWords(words, offset) {
      offset = offset || 0; const keys = [];
      words.forEach((w, i) => {
        const t0 = w.start + offset, t1 = w.end + offset;
        pushWord(keys, phon(w.word), t0, t1);
        const nx = words[i + 1];
        if (!nx || nx.start - w.end > 0.12) keys.push({t: t1, v: 'REST', d: nx ? nx.start - w.end : 0.2});
      });
      return finish(keys);
    },
    // ElevenLabs /with-timestamps: {characters, character_start_times_seconds, character_end_times_seconds}
    fromAlignment(al, offset) {
      const words = []; let cur = null;
      al.characters.forEach((ch, i) => {
        const s = al.character_start_times_seconds[i], e = al.character_end_times_seconds[i];
        if (/\s/.test(ch)) { if (cur) { words.push(cur); cur = null; } return; }
        if (!cur) cur = {word: '', start: s, end: e};
        cur.word += ch; cur.end = e;
      });
      if (cur) words.push(cur);
      return S.LipSync.fromWords(words, offset);
    },
    // lines: [{text, start, end}] -> word timings spread by syllable weight
    wordsFromLines(lines) {
      const words = [];
      lines.forEach((ln) => {
        const ws = ln.text.split(/\s+/).filter(Boolean);
        const wt = ws.map((w) => Math.max(1, phon(w).filter((u) => /AI|E|O|U/.test(u.v)).length) + (/[,.!?;:]$/.test(w) ? 0.8 : 0));
        const tot = wt.reduce((a, b) => a + b, 0); let t = ln.start;
        ws.forEach((w, i) => {
          const d = (ln.end - ln.start) * wt[i] / tot; const pause = /[,.!?;:]$/.test(w) ? Math.min(0.14, d * 0.35) : 0;
          words.push({word: w.replace(/[*]/g, ''), start: t, end: t + d - pause, stress: /^\*|\*$|!$/.test(w) || (w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w))});
          t += d;
        });
      });
      return words;
    },
    fromLines(lines, offset) { return S.LipSync.fromWords(S.LipSync.wordsFromLines(lines), offset); }
  };
})(window.Studio = window.Studio || {});
