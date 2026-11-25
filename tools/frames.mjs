// Grab frames from a GSAP/HyperFrames page by playing forward frame by frame (seek-safe), then tile a contact sheet.
//   node tools/frames.mjs <page.html> <outDir> 1,3.5,8 [--fps 30] [--w 640]
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'puppeteer-core'));
const a = process.argv.slice(2); const [page, outDir, list] = a; const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const FPS = +opt('--fps', 30), TW = +opt('--w', 640);
const times = list.split(',').map(Number).sort((x, y) => x - y);
fs.mkdirSync(outDir, {recursive: true});
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const b = await puppeteer.launch({executablePath: CHROME, headless: 'new', args: ['--allow-file-access-from-files', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required']});
const t = await b.newPage(); await t.setViewport({width: 1920, height: 1080});
const errs = []; t.on('pageerror', (e) => errs.push(String(e)));
await t.goto(pathToFileURL(path.resolve(page)).href, {waitUntil: 'networkidle0'});
await t.evaluate(() => document.fonts.ready);
let f0 = 0; const files = [];
for (const tm of times) {
  const target = Math.round(tm * FPS);
  await t.evaluate((a, b, fps) => { const tl = Object.values(window.__timelines)[0]; for (let f = a; f <= b; f++) tl.seek(f / fps, false); }, f0, target, FPS);
  f0 = target + 1;
  const file = path.join(outDir, `f_${tm.toFixed(2)}.png`); await t.screenshot({path: file}); files.push(file);
}
await b.close();
if (errs.length) console.log('page errors:\n' + errs.join('\n'));
// contact sheet: 4 columns
const cols = 4, rows = Math.ceil(files.length / cols);
const inputs = files.flatMap((f) => ['-i', f]);
const fc = files.map((f, i) => `[${i}:v]scale=${TW}:-1,drawtext=text='${path.basename(f, '.png').slice(2)}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`);
const blank = (cols * rows) - files.length;
for (let i = 0; i < blank; i++) fc.push(`color=c=black:s=${TW}x${Math.round(TW * 9 / 16)}:d=1[b${i}]`);
const all = files.map((_, i) => `[v${i}]`).concat(Array.from({length: blank}, (_, i) => `[b${i}]`));
fc.push(all.join('') + `xstack=inputs=${cols * rows}:layout=` + all.map((_, i) => `${(i % cols) ? Array.from({length: i % cols}, () => 'w0').join('+') : '0'}_${Math.floor(i / cols) ? Array.from({length: Math.floor(i / cols)}, () => 'h0').join('+') : '0'}`).join('|') + '[o]');
const sheet = path.join(outDir, 'sheet.jpg');
execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...inputs, '-filter_complex', fc.join(';'), '-map', '[o]', '-frames:v', '1', sheet]);
console.log('sheet', sheet);
