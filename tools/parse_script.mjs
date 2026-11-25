// Parse an Equity Uncut script.txt into lines.json: chapters (## CH NN — Title), speaker-tagged lines, stage notes,
// source tags. Each line keeps `text` (caption spelling) and `tts` (metadata stripped + pronunciation lock applied).
//   node tools/parse_script.mjs <script.txt> [out.json]
import fs from 'node:fs';
const [src, out] = process.argv.slice(2);
const PRON = [[/\bKnowBe4\b/g, 'Know-Be-Four'], [/\bPyongyang\b/g, 'Pyong-yang'], [/\bBinance\b/g, 'Bye-nance']];
export const SPEAKERS = ['NARRATOR', 'MILO', 'THE SUIT', 'THE CLIPBOARD', 'THE SCHEMER'];
const chapters = []; let ch = null; let pendingStage = [];
for (const raw of fs.readFileSync(src, 'utf8').split(/\r?\n/)) {
  const l = raw.trim(); if (!l || /^#(?!#)/.test(l)) continue;
  let m;
  if ((m = l.match(/^##\s*CH\s*(\d+)\s*[—-]\s*(.+)$/))) { ch = {id: +m[1], title: m[2].trim(), lines: [], stages: [], sources: []}; chapters.push(ch); continue; }
  if ((m = l.match(/^<!--\s*(STAGE|SOURCE TAG):\s*(.*?)\s*-->$/))) {
    if (m[1] === 'STAGE') { ch.stages.push({beforeLine: ch.lines.length, text: m[2]}); pendingStage.push(m[2]); }
    else ch.sources.push({afterLine: ch.lines.length - 1, text: m[2]});
    continue;
  }
  if ((m = l.match(/^\[([A-Z ]+)\]\s*(.+)$/))) {
    if (!SPEAKERS.includes(m[1])) throw new Error('unknown speaker ' + m[1]);
    const direction = [...m[2].matchAll(/\*\(([^)]*)\)\*/g)].map((x) => x[1]);
    const text = m[2].replace(/\*\([^)]*\)\*/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
    let tts = text; PRON.forEach(([re, s]) => { tts = tts.replace(re, s); });
    ch.lines.push({id: `ch${String(ch.id).padStart(2, '0')}_${String(ch.lines.length + 1).padStart(2, '0')}`, speaker: m[1], text, tts, direction, stage: pendingStage.splice(0)});
    continue;
  }
  throw new Error('unparsed line: ' + l);
}
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const sum = {chapters: chapters.length, lines: 0, words: 0, chars: 0, bySpeaker: {}};
for (const c of chapters) for (const ln of c.lines) {
  sum.lines++; sum.words += words(ln.text); sum.chars += ln.tts.length;
  const b = sum.bySpeaker[ln.speaker] = sum.bySpeaker[ln.speaker] || {lines: 0, words: 0}; b.lines++; b.words += words(ln.text);
}
sum.estMinutes = +(sum.words / 155).toFixed(1);
if (out) fs.writeFileSync(out, JSON.stringify({summary: sum, chapters}, null, 1));
console.log(JSON.stringify(sum));
for (const c of chapters) console.log(`CH ${String(c.id).padStart(2, '0')} ${c.lines.length} lines ${c.lines.reduce((a, l) => a + words(l.text), 0)} words ${c.lines.reduce((a, l) => a + l.tts.length, 0)} chars — ${c.title}`);
