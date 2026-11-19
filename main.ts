// A working gta6-trophy-guide-01 entry (Node 22, standard library only): the guide is this directory's app/ folder,
// plain static files a browser opens at app/index.html (ES modules, CSS, no build step), offline: it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json. The program hands it in: it copies app/
// and screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the judge reads (your
// screenshots, the first load's files and bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Only the plumbing, not a winner: a plain checklist of the 55 trophies with a one-line hint each. Write a real guide
// for every trophy in your own words, a roadmap to the platinum, filters and a spoiler setting in app/, put 3 or 4 PNG
// or JPEG screenshots of it in screenshots/ (the first by name is the cover; shots.json says which views this
// starter's were taken of), and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Validate the trophy data before handing anything in: the gate holds app/data/trophies.json
// to the official 55 names, and every trophy needs a real guide of its own. Fail fast here
// instead of shipping a broken entry.
const trophiesDoc = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophies = trophiesDoc.trophies;
if (!Array.isArray(trophies) || trophies.length !== 55) {
  throw new Error(`trophies.json must hold 55 trophies, found ${trophies?.length ?? 0}`);
}
const gradeCounts = {};
const seenNames = new Set();
let hiddenCount = 0;
for (const t of trophies) {
  if (!t.name || seenNames.has(t.name)) throw new Error(`bad or duplicate trophy name: ${t.name}`);
  seenNames.add(t.name);
  if (!t.guide || t.guide.trim().length < 200) throw new Error(`trophy ${t.name} has no real guide`);
  if (!t.sources || !t.kind || !t.stage) throw new Error(`trophy ${t.name} is missing sources, kind or stage`);
  gradeCounts[t.grade] = (gradeCounts[t.grade] || 0) + 1;
  if (t.hidden) hiddenCount += 1;
}
if (gradeCounts.platinum !== 1 || gradeCounts.gold !== 2 || gradeCounts.silver !== 6 || gradeCounts.bronze !== 46) {
  throw new Error(`grade mix is wrong: ${JSON.stringify(gradeCounts)} (want 1 platinum, 2 gold, 6 silver, 46 bronze)`);
}
if (hiddenCount !== 28) throw new Error(`hidden count is wrong: ${hiddenCount} (want 28)`);

// Validate the screenshots the judge reads: 3 or 4 files, each at most 256 KiB, the first by
// name the cover. The judge reads the guides only through these screenshots, so a missing or
// oversized shot is a failed entry, not a cosmetic issue.
const shotDir = join(here, 'screenshots');
const shots = existsSync(shotDir) ? readdirSync(shotDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort() : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`need 3 or 4 screenshots, found ${shots.length}`);
}
for (const shot of shots) {
  const size = statSync(join(shotDir, shot)).size;
  if (size > 262144) throw new Error(`screenshot ${shot} is ${size} bytes, over the 256 KiB cap`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
