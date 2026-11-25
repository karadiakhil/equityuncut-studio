// Write a browser wrapper around a scene_spec.json.
//   node tools/bind-spec.mjs <scene_spec.json> <scene_spec.js>
import fs from 'node:fs';
const [jsonPath, outPath] = process.argv.slice(2);
if (!jsonPath || !outPath) {
  console.error('usage: node tools/bind-spec.mjs <scene_spec.json> <scene_spec.js>');
  process.exit(1);
}
const json = fs.readFileSync(jsonPath, 'utf8');
JSON.parse(json);
fs.writeFileSync(outPath, '/* generated from scene_spec.json by tools/bind-spec.mjs */\nwindow.SCENE_SPEC = ' + json.trim() + ';\n');
console.log('wrote', outPath);
