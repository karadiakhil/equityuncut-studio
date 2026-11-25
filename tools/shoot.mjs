// Screenshot a sheet page to PNG.  node tools/shoot.mjs <page.html> <out.png> [--w 1920 --h 1080 --scale 2] [--clip x,y,w,h]
// The page may set window.__ready (a promise) and window.__sheetSize = [w, h].
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import {pathToFileURL} from 'node:url';
import {chromePath, chromeArgs} from './chrome.mjs';
const a = process.argv.slice(2); const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const [page, out] = a;
const CHROME = chromePath();
if (!CHROME) throw new Error('Chrome/Edge not found. Set CHROME_PATH.');
const b = await puppeteer.launch({executablePath: CHROME, headless: 'new', args: chromeArgs});
const t = await b.newPage();
const errs = []; t.on('pageerror', (e) => errs.push(String(e.stack || e))); t.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
await t.setViewport({width: +opt('--w', 1920), height: +opt('--h', 1080), deviceScaleFactor: +opt('--scale', 1)});
await t.goto(pathToFileURL(path.resolve(page)).href + (opt('--query', '') ? '?' + opt('--query', '') : ''), {waitUntil: 'networkidle0'});
await t.evaluate(async () => { await document.fonts.ready; if (window.__ready) await window.__ready; });
const size = await t.evaluate(() => window.__sheetSize || null);
if (size) await t.setViewport({width: size[0], height: size[1], deviceScaleFactor: +opt('--scale', 1)});
const clip = opt('--clip', null);
await t.screenshot({path: out, clip: clip ? (([x, y, w, h]) => ({x, y, width: w, height: h}))(clip.split(',').map(Number)) : undefined, fullPage: !clip});
if (errs.length) console.log('page errors:\n' + errs.join('\n'));
console.log('wrote', out);
await b.close();
