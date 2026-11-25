// Measured vehicle check (engine-fix-01): every moving vehicle must face its direction of travel and its wheels must
// roll without sliding (screen wheel rotation * screen radius == screen distance travelled, same sign).
//   node tools/check_vehicles.mjs demos/nk-dorm-fbi/scene_spec.json
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
import {chromePath, chromeArgs} from './chrome.mjs';

const specPath = path.resolve(process.argv[2] || 'demos/nk-dorm-fbi/scene_spec.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const html = path.resolve(path.dirname(specPath), 'index.html');
const b = await puppeteer.launch({executablePath: chromePath(), headless: 'new', args: chromeArgs});
const pg = await b.newPage();
await pg.setViewport({width: 1920, height: 1080});
await pg.evaluateOnNewDocument((s) => { window.__SPEC_OVERRIDE = s; }, spec);
await pg.goto(pathToFileURL(html).href, {waitUntil: 'networkidle0'});
await pg.evaluate(async () => { if (window.__ready) await window.__ready; });
const res = await pg.evaluate(() => {
  const out = [], tl = window.__scene.tl;
  const seek = (t) => { tl.seek(t, false); Studio.applyAll(t); };
  // measure in the vehicle LAYER's own coordinates (camera moves and parallax cancel out)
  Studio.World.movers.forEach((m, i) => {
    if (!m.move) { out.push({i, kind: m.kind, parked: true}); return; }
    const shown = (window.__scene.spec.shots || []).filter((s) => s.set === 'city-night');
    const end = shown.length ? Math.max(...shown.map((s) => s.t + s.dur)) - 0.2 : m.move.t0 + m.move.dur;
    const t0 = Math.min(m.move.t0 + m.move.dur * 0.3, end - 0.1), dt = 1 / 24;
    const layer = m.root.parentNode;
    const L = (el, x, y) => { const M = layer.getScreenCTM().inverse().multiply(el.getScreenCTM()); const q = new DOMPoint(x, y).matrixTransform(M); return [q.x, q.y]; };
    seek(t0);
    const bb = m.art.getBBox();
    const nose = L(m.art, bb.x + bb.width, bb.y + bb.height / 2), tail = L(m.art, bb.x, bb.y + bb.height / 2);
    const x0 = L(m.root, 0, 0)[0];
    let roll = null;
    if (m.wheels.length) {
      const w = m.wheels[0], c = () => [L(w.g, w.cx, w.cy), L(w.g, w.cx + w.r, w.cy)];
      const [ca, sa] = c(); const a0 = Math.atan2(sa[1] - ca[1], sa[0] - ca[0]), rS = Math.hypot(sa[0] - ca[0], sa[1] - ca[1]);
      seek(t0 + dt);
      const [cb, sb] = c(); let da = Math.atan2(sb[1] - cb[1], sb[0] - cb[0]) - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      roll = {dx: cb[0] - ca[0], arc: da * rS, ratio: (da * rS) / ((cb[0] - ca[0]) || 1e-9)};
    } else seek(t0 + dt);
    const x1 = L(m.root, 0, 0)[0];
    out.push({i, kind: m.kind, t: t0, travel: Math.sign(x1 - x0), noseDir: Math.sign(nose[0] - tail[0]), roll});
  });
  return out;
});
let bad = 0;
for (const r of res) {
  if (r.parked) { console.log(r.kind.padEnd(7), 'parked'); continue; }
  const faceOk = r.travel === r.noseDir;
  const rollOk = !r.roll || (Math.abs(r.roll.ratio - 1) < 0.08);
  if (!faceOk || !rollOk) bad++;
  console.log(r.kind.padEnd(7), 'travel', r.travel > 0 ? '+x' : '-x', 'nose', r.noseDir > 0 ? '+x' : '-x', faceOk ? 'FACE OK' : 'FACE WRONG',
    r.roll ? `roll arc/dist ${r.roll.ratio.toFixed(3)} ${rollOk ? 'ROLL OK' : 'SLIDING/WRONG'}` : '');
}
await b.close();
console.log(bad ? `FAIL ${bad}` : 'PASS');
process.exit(bad ? 1 : 0);
