// Per-shot camera numbers. Prints zoom ratio, layer drift, and shake peak.
//   node tools/checks/measure_camera.mjs demos/upgrade-tests/k1_camera_spec.json
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
const rows = await page.evaluate((fps) => {
  const scene = window.__scene;
  const tl = scene.tl;
  return scene.spec.shots.map((shot) => {
    const samples = [];
    const n = Math.max(2, Math.round(shot.dur * fps));
    for (let i = 0; i < n; i++) {
      const t = Math.min(shot.t + i / fps, shot.t + shot.dur - 0.001);
      tl.seek(t, false);
      if (window.Studio) Studio.applyAll(t);
      const left = scene.stage.layers.map((L) => L.el.getBoundingClientRect().left);
      samples.push({zoom: scene.camera.p.zoom, shake: scene.camera.p.shake, left: left});
    }
    const z0 = samples[0].zoom, z1 = samples[samples.length - 1].zoom;
    const drift = Math.abs((samples[samples.length - 1].left[2] - samples[0].left[2]) - (samples[samples.length - 1].left[0] - samples[0].left[0]));
    const shake = Math.max(...samples.map((s) => Math.abs(s.shake)));
    return {t: shot.t, preset: (shot.camera && shot.camera.preset) || '', zoom0: +z0.toFixed(3), zoom1: +z1.toFixed(3), ratio: +(z1 / z0).toFixed(3), drift: +drift.toFixed(1), shake: +shake.toFixed(2)};
  });
}, fps);
await browser.close();
console.log(['t', 'preset', 'zoom0', 'zoom1', 'ratio', 'layerDrift', 'shakeAmp'].join('\t'));
rows.forEach((r) => console.log([r.t, r.preset, r.zoom0, r.zoom1, r.ratio, r.drift, r.shake].join('\t')));
