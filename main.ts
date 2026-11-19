// Leonida 55 — GTA VI Trophy Guide & Tracker (program/v1, Node 22, standard library only).
// The guide is this directory's app/ folder: plain static files a browser opens at
// app/index.html (ES modules, CSS, no build step), offline: it loads nothing over the
// network, and its trophy list and guides are app/data/trophies.json. The program hands
// it in: it copies app/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads (your screenshots, the first load's
// files and bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for
// byte what its own copy writes.
//
// Before copying, this program validates its own data: the trophy file must hold all 55
// official trophies, each with a non-blank guide, and the grade split must be the
// official 1 platinum, 2 gold, 6 silver and 46 bronze. A bad data file fails loudly
// here instead of shipping a broken guide.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const trophiesPath = join(here, 'app', 'data', 'trophies.json');
const doc = JSON.parse(readFileSync(trophiesPath, 'utf8'));
const trophies = doc.trophies;
if (!Array.isArray(trophies) || trophies.length !== 55) {
  throw new Error(`trophies.json must hold 55 trophies, found ${Array.isArray(trophies) ? trophies.length : 'none'}`);
}
const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
for (const t of trophies) {
  if (!t.name || typeof t.guide !== 'string' || !t.guide.trim()) {
    throw new Error(`trophy ${t.id ?? '?'} has no name or a blank guide`);
  }
  if (!(t.grade in grades)) throw new Error(`trophy ${t.id} has unknown grade ${t.grade}`);
  grades[t.grade]++;
}
if (grades.platinum !== 1 || grades.gold !== 2 || grades.silver !== 6 || grades.bronze !== 46) {
  throw new Error(`grade split must be 1/2/6/46, found ${JSON.stringify(grades)}`);
}

// Screenshots: 3 or 4 images, each a whole JPEG or PNG of at most 256 KiB, as the gate
// requires. The first by name is the cover, so the set must be complete before we ship.
import { readdirSync, statSync } from 'node:fs';
const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir) ? readdirSync(shotsDir).filter((f) => !f.startsWith('.')) : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/ must hold 3 or 4 images, found ${shots.length}`);
}
for (const f of shots) {
  if (!/\.(jpe?g|png)$/i.test(f)) throw new Error(`screenshot ${f} is not a JPEG or PNG`);
  const size = statSync(join(shotsDir, f)).size;
  if (size > 262144) throw new Error(`screenshot ${f} is ${size} bytes, over the 256 KiB cap`);
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
