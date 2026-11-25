// Bake procedural noise textures (library/textures/textures.js sources) to PNG tiles in library/textures/baked/.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const b = await puppeteer.launch({executablePath: CHROME, headless: 'new'});
const t = await b.newPage(); const N = 1024;
await t.setViewport({width: N, height: N});
await t.setContent('<html><body style="margin:0;background:transparent"></body></html>');
await t.addScriptTag({content: 'window.Studio={NS:"http://www.w3.org/2000/svg"};'});
await t.addScriptTag({path: path.join(root, 'library/textures/textures.js')});
const names = await t.evaluate(() => Object.keys(Studio.Textures.sources));
const out = path.join(root, 'library/textures/baked'); fs.mkdirSync(out, {recursive: true});
for (const n of names) {
  await t.evaluate((n, N) => { document.body.innerHTML = Studio.Textures.sources[n](N); }, n, N);
  await t.screenshot({path: path.join(out, n + '.png'), omitBackground: true, clip: {x: 0, y: 0, width: N, height: N}});
  console.log('baked', n);
}
await b.close();
