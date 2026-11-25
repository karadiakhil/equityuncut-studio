// Spec validator (V0). Exit 0 when every file passes. Warnings do not fail the run.
//   node tools/check_spec.mjs <spec.json> [more.json]
//
// Conservative readings, written down so a later pass can tighten them:
// - "punch-in over 1.3" is the zoom ratio across the shot (max/min), not an absolute zoom above 1.3.
//   The nk-dorm-fbi demo punches in to 1.62 with a ratio under 1.3, and it must keep passing.
// - "a set used in more than 3 non-adjacent shots" counts separate visits. A contiguous run is one visit.
// - Money hold is (out - t) >= count dur + 0.6. The kit's 0.15s lead-in is inside that window.
// - Character bounds default to the plate published by SetLibrary.open (x -200..2400, y 0..1200).
// - fps defaults to 30 when the spec omits it. Frame numbers in messages use that fps.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
function quoted(block) { return [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]); }
function arrayOf(src, name) {
  const m = src.match(new RegExp('const ' + name + ' = \\[([\\s\\S]*?)\\]'));
  if (!m) throw new Error('missing ' + name);
  return quoted(m[1]);
}

const sets = arrayOf(read('world/SetLibrary.js'), 'NAMES');
const lighting = arrayOf(read('world/Lighting.js'), 'NAMES');
const kitSrc = read('library/mograph/kit.js');
const types = quoted((kitSrc.match(/types:\s*\[([\s\S]*?)\]/) || [])[1] || '');
const propSrc = read('library/props/props.js');
const props = [...propSrc.matchAll(/\n\s+P\.(\w+)\s*=\s*function/g)].map((m) => m[1]);
const exprSrc = read('actions/choreography.js') + '\n' + read('actions/acting.js');
const exprBlock = (exprSrc.match(/A\.EXPR = \{([\s\S]*?)\n  \};/) || [])[1] || '';
const expressions = [...exprBlock.matchAll(/^\s*'?([A-Za-z][\w-]*)'?\s*:/gm)].map((m) => m[1]);
const extraExpr = (exprSrc.match(/Object\.assign\(S\.Act\.EXPR, \{([\s\S]*?)\}\)/) || [])[1] || '';
[...extraExpr.matchAll(/^\s*'?([A-Za-z][\w-]*)'?\s*:/gm)].forEach((m) => { if (!expressions.includes(m[1])) expressions.push(m[1]); });
const poseBlock = (read('actions/acting.js').match(/const POSE = \{([\s\S]*?)\n  \};/) || [])[1] || '';
const gestures = [...poseBlock.matchAll(/^\s*'?([A-Za-z][\w-]*)'?\s*:/gm)].map((m) => m[1]);
const easeBlock = (read('actions/acting.js').match(/const EASE = \{([\s\S]*?)\};/) || [])[1] || '';
const eases = Object.keys(Object.fromEntries([...easeBlock.matchAll(/(\w+)\s*:/g)].map((m) => [m[1], 1])));
const casts = ['Milo', 'TheSuit', 'TheClipboard', 'TheSchemer', 'MiloV1', 'TheSuitV1', 'TheClipboardV1', 'TheSchemerV1'];
const BOUNDS = {x0: -200, x1: 2400, y0: 0, y1: 1200};

function check(spec, file) {
  const errors = [];
  const warnings = [];
  const fps = spec.fps || 30;
  const frame = (t) => Math.round((t || 0) * fps);
  const shotId = (s, i) => (s && s.id) || String(i);
  const say = (s, i, msg) => errors.push('shot ' + shotId(s, i) + ' t=' + ((s && s.t) || 0).toFixed(2) + ' frame ' + frame(s && s.t) + ' (' + path.basename(file) + '): ' + msg);
  if (!spec || typeof spec !== 'object') return {errors: ['spec must be an object'], warnings};
  const shots = (spec.shots || []).map((s, i) => Object.assign({_i: i}, s)).sort((a, b) => a.t - b.t);
  if (!shots.length) errors.push(path.basename(file) + ': shots[] is required');
  shots.forEach((s, i) => {
    if (typeof s.t !== 'number' || typeof s.dur !== 'number') say(s, i, 'needs t and dur');
    if (typeof s.dur === 'number' && s.dur > 3.5) say(s, i, 'dur ' + s.dur + ' > 3.5');
    if (s.set && !sets.includes(s.set)) say(s, i, 'unknown set ' + s.set);
    if (s.lighting && !lighting.includes(s.lighting)) say(s, i, 'unknown lighting ' + s.lighting);
    if (s.transition === 'crash') { /* counted below */ }
    const cam = s.camera || {};
    const z0 = cam.zoom == null ? 1 : cam.zoom;
    const z1 = cam.to && cam.to.zoom != null ? cam.to.zoom : z0;
    const ratio = Math.max(z0, z1) / Math.max(0.001, Math.min(z0, z1));
    if (!cam.preset && ratio > 1.3 + 1e-6) say(s, i, 'punch-in ratio ' + ratio.toFixed(2) + ' > 1.3 without camera.preset');
    if (i > 0 && s.t < shots[i - 1].t + shots[i - 1].dur - 0.02) say(s, i, 'overlaps the previous shot');
  });
  if (shots.length && typeof spec.duration === 'number') {
    const end = shots[shots.length - 1].t + shots[shots.length - 1].dur;
    if (Math.abs(end - spec.duration) > 0.02) errors.push(path.basename(file) + ': duration ' + spec.duration + ' != last shot end ' + end.toFixed(2) + ' (frame ' + frame(end) + ')');
  }
  const visits = {};
  let prev = null;
  shots.forEach((s) => {
    if (!s.set) return;
    if (s.set !== prev) visits[s.set] = (visits[s.set] || 0) + 1;
    prev = s.set;
  });
  Object.keys(visits).forEach((name) => {
    if (visits[name] > 3) errors.push(path.basename(file) + ': set ' + name + ' used in ' + visits[name] + ' non-adjacent visits (max 3)');
  });
  let run = 1;
  for (let i = 1; i < shots.length; i++) {
    const a = shots[i - 1], b = shots[i];
    const same = a.set === b.set && JSON.stringify(a.camera || {}) === JSON.stringify(b.camera || {});
    run = same ? run + 1 : 1;
    if (run > 3) warnings.push(path.basename(file) + ': ' + run + ' shots in a row on ' + b.set + ' with the same camera (needs a new angle)');
  }
  const crashes = shots.filter((s) => s.transition === 'crash').map((s) => s.t).sort((a, b) => a - b);
  for (let i = 1; i < crashes.length; i++) if (crashes[i] - crashes[i - 1] < 30) errors.push(path.basename(file) + ': crash transition at ' + crashes[i].toFixed(2) + ' is under 30s after the previous crash');
  (spec.characters || []).forEach((c) => {
    if (!casts.includes(c.cast)) errors.push(path.basename(file) + ': unknown cast ' + c.cast);
    const x = c.x == null ? 960 : c.x;
    const y = c.y == null ? 1000 : c.y;
    if (x < BOUNDS.x0 || x > BOUNDS.x1 || y < BOUNDS.y0 || y > BOUNDS.y1) errors.push(path.basename(file) + ': character ' + (c.id || c.cast) + ' at ' + x + ',' + y + ' is outside set bounds');
    (c.keys || []).forEach((k) => {
      if (k.expression && !expressions.includes(k.expression)) errors.push(path.basename(file) + ': unknown expression ' + k.expression + ' (frame ' + frame(k.t) + ')');
      if (k.gesture && !gestures.includes(k.gesture)) errors.push(path.basename(file) + ': unknown gesture ' + k.gesture + ' (frame ' + frame(k.t) + ')');
      if (k.ease && !eases.includes(k.ease)) errors.push(path.basename(file) + ': unknown ease ' + k.ease + ' (frame ' + frame(k.t) + ')');
    });
  });
  const cards = [];
  (spec.mograph || []).forEach((m) => {
    if (!types.includes(m.type)) errors.push(path.basename(file) + ': unknown mograph ' + m.type + ' (frame ' + frame(m.t) + ')');
    if (m.type === 'card') {
      const dur = (m.out == null ? 0 : m.out) - (m.t || 0);
      if (dur < 1.5 || dur > 2.0) errors.push(path.basename(file) + ': card duration ' + dur.toFixed(2) + ' is outside 1.5–2.0s (frame ' + frame(m.t) + ')');
      cards.push(m.t || 0);
    }
    if (m.type === 'money') {
      const window = (m.out == null ? 0 : m.out) - (m.t || 0);
      const count = m.dur == null ? 1.15 : m.dur;
      if (window + 1e-6 < count + 0.6) errors.push(path.basename(file) + ': money hold ' + window.toFixed(2) + 's < count ' + count + ' + 0.6 (frame ' + frame(m.t) + ')');
    }
  });
  cards.sort((a, b) => a - b);
  for (let i = 1; i < cards.length; i++) if (cards[i] - cards[i - 1] < 20) errors.push(path.basename(file) + ': handwritten cards at ' + cards[i - 1].toFixed(2) + ' and ' + cards[i].toFixed(2) + ' are closer than 20s');
  (spec.props || []).forEach((p) => {
    if (p.kind && !props.includes(p.kind)) errors.push(path.basename(file) + ': unknown prop ' + p.kind);
  });
  (spec.shots || []).forEach((s) => {
    const on = (spec.characters || []).filter((c) => c.set === s.set);
    if (on.length && (on.every((c) => (c.x || 960) < 680) || on.every((c) => (c.x || 960) > 1240))) warnings.push(path.basename(file) + ': shot t=' + s.t + ' leaves a frame half empty');
  });
  return {errors, warnings};
}

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!files.length) { console.error('usage: node tools/check_spec.mjs <spec.json> ...'); process.exit(2); }
let failed = 0;
for (const file of files) {
  let spec;
  try { spec = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { console.error(file + ': ' + e.message); failed++; continue; }
  const {errors, warnings} = check(spec, file);
  warnings.forEach((w) => console.log('WARN ' + w));
  if (!errors.length) console.log('PASS ' + file);
  else { failed++; errors.forEach((e) => console.error('ERROR ' + e)); }
}
process.exit(failed ? 1 : 0);
