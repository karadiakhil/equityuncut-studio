// Dwell stats for paper9 mouths. Fails if a non-A shape holds under minHold frames
// or the narrator's mouth leaves X.
//   node tools/checks/check_mouths.mjs demos/upgrade-tests/c4_mouths_spec.json
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
import {chromePath, chromeArgs} from '../chrome.mjs';

const specPath = path.resolve(process.argv[2]);
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const html = path.join(path.dirname(specPath), 'index.html');
const fps = spec.fps || 30;
const browser = await puppeteer.launch({executablePath: chromePath(), headless: 'new', args: chromeArgs});
const page = await browser.newPage();
await page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});
await page.evaluateOnNewDocument((payload) => { window.__SPEC_OVERRIDE = payload; }, spec);
await page.goto(pathToFileURL(html).href, {waitUntil: 'networkidle0', timeout: 60000});
await page.evaluate(async () => { if (window.__ready) await window.__ready; });
const err = await page.evaluate(() => window.__sceneError || null);
if (err) throw new Error(err);
const stats = await page.evaluate((fps) => {
  const tl = window.__scene.tl;
  const cast = window.__scene.cast;
  const speaker = cast.find((c) => c.id === 'speaker') || cast[cast.length - 1];
  const narrator = cast.find((c) => c.id === 'narrator');
  function run(ch) {
    const seq = [];
    const n = Math.round(tl.duration() * fps);
    let cur = null, dwell = 0;
    const gaps = [];
    for (let i = 0; i < n; i++) {
      const t = Math.min(i / fps, tl.duration() - 0.001);
      tl.seek(t, false);
      const v = ch.tracks.viseme.at(t) || 'X';
      if (v !== cur) { if (cur != null) gaps.push({v: cur, frames: dwell}); cur = v; dwell = 1; }
      else dwell++;
    }
    if (cur != null) gaps.push({v: cur, frames: dwell});
    return gaps.filter((g) => g.frames > 0);
  }
  const sheet = {};
  cast.forEach((ch) => {
    const mouths = ch.n && ch.n.mouths;
    if (!mouths) return;
    'ABCDEFGHX'.split('').forEach((letter) => {
      const node = mouths[letter];
      if (!node) return;
      const n = node.querySelectorAll('path, ellipse, rect, circle').length;
      sheet[letter] = n;
    });
  });
  return {speaker: run(speaker), narrator: narrator ? run(narrator) : [], sheet};
}, fps);
await browser.close();
console.log('shapes', JSON.stringify(stats.sheet));
const dwells = stats.speaker.filter((g) => g.v !== 'X' && g.v !== 'A');
const min = dwells.reduce((m, g) => Math.min(m, g.frames), 99);
const changes = stats.speaker.filter((g) => g.v !== 'X').length;
console.log('speaker changes', changes, 'min non-A dwell', min);
console.log(stats.speaker.map((g) => g.v + ':' + g.frames).join(' '));
let fail = 0;
if (dwells.some((g) => g.frames < 3)) { console.error('FAIL dwell under 3 frames'); fail = 1; }
if (Object.values(stats.sheet).some((n) => n > 3)) { console.error('FAIL a mouth has more than 3 shapes'); fail = 1; }
if (stats.narrator.some((g) => g.v !== 'X')) { console.error('FAIL narrator left X'); fail = 1; }
if (!fail) console.log('PASS mouths');
process.exit(fail);
