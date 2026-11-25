// Equity Uncut QA gate, run by `npm run check` after `hyperframes check`.
//   node collision_check.mjs <project_dir> [--fps 15]
// Plays the page's registered timeline (window.__timelines, first key) forward frame by frame from 0 and fails on:
//  1. overlap between two visible [data-collide] text blocks (headline, bubble, neon, source, counter, caption), > 4 px
//  2. a visible [data-collide-blocker] (foreground bar/frame) crossing a [data-collide] block
//  3. a counter ([data-counter-final]) that does not show its exact final value for a continuous >= 0.6 s
//  4. placeholder text ("NO PHOTO", "PLACEHOLDER", "TODO") anywhere visible
//  5. window.__beatAudit reporting a gap > 3.5 s with no visual beat
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {chromePath, chromeArgs} from './chrome.mjs';
const require = createRequire(import.meta.url);
const puppeteer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'puppeteer-core'));
const a = process.argv.slice(2); const dir = a[0] || '.'; const FPS = +(a[a.indexOf('--fps') + 1] || 0) || 15;
const CHROME = chromePath();
if (!CHROME) throw new Error('Chrome/Edge not found. Set CHROME_PATH.');
const b = await puppeteer.launch({executablePath: CHROME, headless: 'new', args: chromeArgs});
const t = await b.newPage(); await t.setViewport({width: 1920, height: 1080});
const errs = []; t.on('pageerror', (e) => errs.push(String(e)));
await t.goto(pathToFileURL(path.resolve(dir, 'index.html')).href, {waitUntil: 'networkidle0'});
await t.evaluate(() => document.fonts.ready);
const res = await t.evaluate(async (FPS) => {
  const key = Object.keys(window.__timelines || {})[0]; const tl = window.__timelines[key];
  const root = document.querySelector('[data-composition-id]'); const dur = +root.dataset.duration || tl.duration();
  const vis = (e) => { for (let n = e; n && n.nodeType === 1; n = n.parentElement || n.parentNode) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; } const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && r.right > 0 && r.bottom > 0 && r.left < 1920 && r.top < 1080; };
  const fails = []; const counters = {}; const seen = new Set();
  const label = (e) => (e.id && e.id !== 'null' ? '#' + e.id : e.className && e.className.baseVal == null ? '.' + String(e.className).split(' ')[0] : e.tagName) + ' "' + (e.textContent || '').trim().slice(0, 30) + '"';
  for (let f = 0; f <= Math.round(dur * FPS); f++) {
    const time = Math.min(f / FPS, dur - 0.001); tl.seek(time, false);
    if (window.Studio && Studio.applyAll) Studio.applyAll(time);
    const cs = [...document.querySelectorAll('[data-collide]')].filter(vis).map((e) => ({e, r: e.getBoundingClientRect()}));
    const bl = [...document.querySelectorAll('[data-collide-blocker]')].filter(vis).map((e) => ({e, r: e.getBoundingClientRect()}));
    const ov = (A, B) => Math.min(A.right, B.right) - Math.max(A.left, B.left) > 4 && Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top) > 4;
    for (let i = 0; i < cs.length; i++) {
      for (let j = i + 1; j < cs.length; j++) if (!cs[i].e.contains(cs[j].e) && !cs[j].e.contains(cs[i].e) && ov(cs[i].r, cs[j].r)) { const k = 'ov ' + label(cs[i].e) + ' x ' + label(cs[j].e); if (!seen.has(k)) { seen.add(k); fails.push(`${time.toFixed(2)}s text overlap: ${label(cs[i].e)} x ${label(cs[j].e)} [${[cs[i].r, cs[j].r].map((r) => [r.left, r.top, r.right, r.bottom].map(Math.round).join(',')).join(' / ')}]`); } }
      for (const B of bl) if (ov(cs[i].r, B.r)) { const k = 'bl ' + label(cs[i].e) + label(B.e); if (!seen.has(k)) { seen.add(k); fails.push(`${time.toFixed(2)}s blocker crosses text: ${label(B.e)} over ${label(cs[i].e)}`); } }
    }
    document.querySelectorAll('[data-counter-final]').forEach((e, i) => { const c = counters[i] = counters[i] || {final: e.dataset.counterFinal, best: 0, run: 0};
      if (vis(e) && e.textContent === c.final) { c.run += 1 / FPS; c.best = Math.max(c.best, c.run); } else c.run = 0; });
    const txt = document.body.innerText || '';
    if (/NO PHOTO|PLACEHOLDER|TODO/i.test(txt) && !seen.has('ph')) { seen.add('ph'); fails.push(`${time.toFixed(2)}s placeholder text on screen`); }
  }
  for (const k in counters) { const c = counters[k]; if (c.best + 1e-6 < 0.6) fails.push(`counter "${c.final}" holds only ${c.best.toFixed(2)} s (< 0.6 s)`); }
  if (window.__beatAudit && !window.__beatAudit.ok) fails.push('3.5 s beat ceiling broken: ' + JSON.stringify(window.__beatAudit.gaps));
  return {dur, fails, counters: Object.values(counters).map((c) => `${c.final} held ${c.best.toFixed(2)}s`), beat: window.__beatAudit || null};
}, FPS);
await b.close();
if (errs.length) res.fails.unshift(...errs.map((e) => 'page error: ' + e));
console.log(`collision_check: ${res.dur}s @ ${FPS} fps; counters: ${res.counters.join(', ') || 'none'}; beats max gap ${res.beat ? res.beat.maxGap.toFixed(2) + 's' : 'n/a'}`);
if (res.fails.length) { console.log('FAIL\n  ' + res.fails.join('\n  ')); process.exit(1); }
console.log('PASS');
