// Render a scene_spec.json through the studio page to stills and an MP4.
//   node tools/render-spec.mjs <scene_spec.json> --out <dir> [--stills-only] [--at 1.2,4.4] [--fps 24]
// The page is demos/<folder>/index.html next to the spec. The spec object is injected
// as window.__SPEC_OVERRIDE so the JSON file, not a hand-built timeline, drives the picture.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';
import {chromePath, chromeArgs} from './chrome.mjs';

const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const specPath = path.resolve(a[0]);
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const outDir = path.resolve(opt('--out', path.join(path.dirname(specPath), 'renders')));
const html = path.resolve(opt('--html', path.join(path.dirname(specPath), 'index.html')));
const fps = +opt('--fps', spec.fps || 24);
const jpeg = +opt('--jpeg', 72);
const stillsOnly = a.includes('--stills-only');
const at = opt('--at', '');
const times = (at ? at.split(',') : (spec.stills || [])).map(Number).filter((n) => !Number.isNaN(n)).sort((x, y) => x - y);
fs.mkdirSync(outDir, {recursive: true});
const exe = chromePath();
if (!exe) throw new Error('Chrome/Edge not found. Set CHROME_PATH.');

const browser = await puppeteer.launch({executablePath: exe, headless: 'new', args: chromeArgs});
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('pageerror', e));
page.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text()); });
await page.setViewport({width: (spec.size && spec.size[0]) || 1920, height: (spec.size && spec.size[1]) || 1080, deviceScaleFactor: 1});
// Local prop-SVG library: every "<set>/<name>.svg" ref named in the engine bundle or the spec is read under PROP_SVG_ROOT
// (default: ../story_video/assets/props next to shared-studio) and injected as window.__PROP_SVGS. Nothing is copied.
const here = path.dirname(fileURLToPath(import.meta.url));
const propRoot = process.env.PROP_SVG_ROOT || path.resolve(here, '..', '..', 'story_video', 'assets', 'props');
const propSvgs = {};
if (fs.existsSync(propRoot)) {
  const bundle = fs.readFileSync(path.resolve(here, '..', 'dist', 'studio.js'), 'utf8') + JSON.stringify(spec);
  const refs = new Set([...bundle.matchAll(/["']([\w-]+\/[\w.-]+\.svg)["']/g)].map((m) => m[1]));
  // set dressing names refs by bare fluent-emoji name (FE('books'), shelf items): any quoted word with a file there
  for (const m of bundle.matchAll(/["']([a-z0-9]+(?:-[a-z0-9]+)*)["']/g)) if (fs.existsSync(path.join(propRoot, 'fluent-emoji', m[1] + '.svg'))) refs.add('fluent-emoji/' + m[1] + '.svg');
  for (const ref of refs) {
    const f = path.resolve(propRoot, ref);
    if (!f.startsWith(path.resolve(propRoot)) || !fs.existsSync(f)) continue;
    propSvgs[ref] = fs.readFileSync(f, 'utf8');
  }
  console.log('prop svgs', Object.keys(propSvgs).length, 'from', propRoot);
} else console.warn('PROP_SVG_ROOT not found:', propRoot, '(library props fall back to built-ins)');
await page.evaluateOnNewDocument((payload, props, root) => { window.__SPEC_OVERRIDE = payload; window.__PROP_SVGS = props; window.Studio = window.Studio || {}; window.Studio.PROP_SVG_ROOT = root; }, spec, propSvgs, propRoot.replace(/\\/g, '/'));
await page.goto(pathToFileURL(html).href, {waitUntil: 'networkidle0', timeout: 60000});
await page.evaluate(async () => { if (window.__ready) await window.__ready; });
const boot = await page.evaluate(() => ({error: window.__sceneError || null, dur: window.__scene && window.__scene.tl ? window.__scene.tl.duration() : null, id: window.__scene && window.__scene.spec && window.__scene.spec.id}));
if (boot.error) throw new Error(boot.error);
console.log('scene', boot.id, 'timeline', boot.dur);

async function grab(t, file, quiet) {
  await page.evaluate((time) => {
    const tl = window.__scene.tl;
    const at = Math.max(0, Math.min(time, Math.max(0, tl.duration() - 0.001)));
    tl.seek(at, false);
    if (window.Studio) Studio.applyAll(at);
  }, t);
  await page.screenshot({path: file, type: 'jpeg', quality: jpeg});
  if (!quiet) console.log('still', t.toFixed(2), file);
}

const stillDir = path.join(outDir, 'stills');
fs.mkdirSync(stillDir, {recursive: true});
for (const t of times) await grab(t, path.join(stillDir, 't_' + t.toFixed(2).replace('.', '_') + '.jpg'));

if (!stillsOnly) {
  const frameDir = path.join(outDir, 'frames');
  fs.mkdirSync(frameDir, {recursive: true});
  const n = Math.round(spec.duration * fps);
  for (let i = 0; i < n; i++) {
    const t = Math.min(i / fps, spec.duration - 0.001);
    const file = path.join(frameDir, 'frame_' + String(i + 1).padStart(4, '0') + '.jpg');
    await grab(t, file, true);
    if (i % fps === 0) console.log('frame', i + '/' + n);
  }
  const mp4 = path.join(outDir, (spec.id || 'scene') + '.mp4');
  execFileSync('ffmpeg', ['-nostdin', '-y', '-framerate', String(fps), '-i', path.join(frameDir, 'frame_%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', mp4], {stdio: 'inherit'});
  console.log('video', mp4);
}
await browser.close();
