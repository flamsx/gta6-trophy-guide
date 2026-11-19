// Leonida 55 v3 — gta6-trophy-guide-01 entry (Node 22, standard library only).
// The guide is this directory's app/ folder: plain static files a browser opens at
// app/index.html (one ES module, one stylesheet, no build step), offline — it loads
// nothing over the network, and its trophy list and guides are app/data/trophies.json.
// This program hands it in: it copies app/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for
// byte what its own copy writes.
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

// Validate the trophy data before handing it in: 55 trophies, every official name
// present once, every guide non-blank and at least 200 characters, kinds adding up.
const data = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const list = data.trophies;
if (!Array.isArray(list) || list.length !== 55) throw new Error(`expected 55 trophies, got ${list?.length}`);
const kinds = {};
for (const t of list) {
  if (!t.name || !t.description || !t.grade) throw new Error(`trophy ${t.id} is missing a field`);
  if (typeof t.guide !== 'string' || t.guide.trim().length < 200) throw new Error(`trophy ${t.id} guide is too short`);
  kinds[t.kind] = (kinds[t.kind] ?? 0) + 1;
}
if (kinds.platinum !== 1 || kinds.story !== 17 || kinds.activities !== 30 || kinds.collectibles !== 7) {
  throw new Error(`kind counts are wrong: ${JSON.stringify(kinds)}`);
}
if (list.filter(t => t.hidden).length !== 28) throw new Error('expected 28 hidden trophies');
if (list.filter(t => t.missable).length !== 1 || !list.find(t => t.id === 28)?.missable) {
  throw new Error('only #28 Positive Mental Attitude may be flagged missable');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Validate the screenshots before handing them in: 3 or 4 files, each a JPEG or PNG
// of at most 256 KiB, named like the shots.json views that produced them.
const shots = readdirSync(join(here, 'screenshots')).filter(f => !f.startsWith('.') && /\.(jpe?g|png)$/i.test(f));
if (shots.length < 3 || shots.length > 4) throw new Error(`expected 3-4 screenshots, got ${shots.length}`);
for (const f of shots) {
  const size = statSync(join(here, 'screenshots', f)).size;
  if (size > 262144) throw new Error(`screenshot ${f} is ${size} bytes, over the 256 KiB cap`);
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
