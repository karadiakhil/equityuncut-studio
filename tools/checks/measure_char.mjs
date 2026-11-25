// Measure paper characters in a rendered spec. Outline thickness is pre-zoom:
// stroke-width is retuned for the character scale, and this sample includes the
// screen CTM, so the camera in the spec should be zoom 1.
//   node tools/checks/measure_char.mjs <spec.json> [--html page] [--at 0.5,1.5]
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
import {chromePath, chromeArgs} from '../chrome.mjs';

const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const specPath = path.resolve(a[0]);
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const html = path.resolve(opt('--html', path.join(path.dirname(specPath), 'index.html')));
const times = (opt('--at', '0.5')).split(',').map(Number);
const exe = chromePath();
if (!exe) throw new Error('Chrome not found');
const browser = await puppeteer.launch({executablePath: exe, headless: 'new', args: chromeArgs});
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('pageerror', e));
await page.setViewport({width: (spec.size && spec.size[0]) || 1920, height: (spec.size && spec.size[1]) || 1080, deviceScaleFactor: 1});
await page.evaluateOnNewDocument((payload) => { window.__SPEC_OVERRIDE = payload; }, spec);
await page.goto(pathToFileURL(html).href, {waitUntil: 'networkidle0', timeout: 60000});
await page.evaluate(async () => { if (window.__ready) await window.__ready; });
const boot = await page.evaluate(() => window.__sceneError || null);
if (boot) throw new Error(boot);

const rows = [];
for (const t of times) {
  const sample = await page.evaluate((time) => {
    const tl = window.__scene.tl;
    const at = Math.max(0, Math.min(time, Math.max(0, tl.duration() - 0.001)));
    tl.seek(at, false);
    if (window.Studio) Studio.applyAll(at);
    return [...document.querySelectorAll('.ss-char')].map((wrap) => {
      const svg = wrap.querySelector('svg');
      const head = svg.querySelector('[id$="head-line"] path');
      const hb = head.getBoundingClientRect();
      const ctm = head.getScreenCTM();
      const sw = parseFloat(head.getAttribute('stroke-width') || '0');
      const outline = sw * Math.hypot(ctm.a, ctm.b);
      let sole = hb.bottom;
      svg.querySelectorAll('[id*="foot-"]').forEach((f) => { const r = f.getBoundingClientRect(); if (r.height > 1) sole = Math.max(sole, r.bottom); });
      const height = sole - hb.top;
      const grads = svg.querySelectorAll('linearGradient, radialGradient').length;
      const fills = new Set();
      svg.querySelectorAll('[fill]').forEach((e) => {
        const f = e.getAttribute('fill');
        if (f && f !== 'none' && f.indexOf('url(') !== 0) fills.add(f.toLowerCase());
      });
      let interior = null;
      svg.querySelectorAll('[stroke]').forEach((e) => {
        const s = (e.getAttribute('stroke') || '').toLowerCase();
        if (s !== '#141114' && s !== '#18181b') return;
        const w = parseFloat(e.getAttribute('stroke-width') || '0') * Math.hypot(ctm.a, ctm.b);
        if (w > outline * 0.5 && w < outline * 0.85) interior = interior == null ? w : Math.min(interior, w);
      });
      return {id: wrap.id.replace(/-wrap$/, ''), head: +hb.width.toFixed(1), height: +height.toFixed(1), ratio: +(hb.width / height).toFixed(3), outline: +outline.toFixed(2), interior: interior == null ? null : +interior.toFixed(2), fills: fills.size, gradients: grads, shading: svg.getAttribute('data-shading') || ''};
    });
  }, t);
  sample.forEach((r) => rows.push(Object.assign({t}, r)));
}
await browser.close();
console.log(['t', 'id', 'head', 'height', 'ratio', 'outline', 'interior', 'fills', 'gradients', 'shading'].join('\t'));
rows.forEach((r) => console.log([r.t, r.id, r.head, r.height, r.ratio, r.outline, r.interior, r.fills, r.gradients, r.shading].join('\t')));
const bad = rows.filter((r) => r.shading === 'hard' && (r.gradients !== 0 || Math.abs(r.outline - 6) > 0.75));
if (bad.length) { console.error('FAIL ' + bad.length + ' characters outside outline/gradient tolerance'); process.exit(1); }
console.log('PASS ' + rows.length + ' samples');
