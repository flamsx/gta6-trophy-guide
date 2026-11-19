// Leonida 55 — GTA VI trophy guide & tracker. Offline: fetches only data/trophies.json.
// State (earned, counters, notes, settings) lives in localStorage; export/import moves it.
const $ = s => document.querySelector(s);
const KEY = 'leonida55-v3';
const EXO = 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/';
const PSN = 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi';
const STAGES = [
  { n: 1, name: 'Story — Chapters & Heists', ids: [2,3,4,5,6,7,8,9,10,11,12,13], note: 'Play the story in order: chapters 1–4, the final mission, and the six named story missions. Nothing here is missable — each unlocks when you finish its chapter or mission.' },
  { n: 2, name: 'Strangers & Fixers', ids: [22,23,24,26,27,25,29], note: 'Finish every contact’s final mission — Andy, Kenton, Billy, Randy, Tyrone — plus 8 stranger strands and Bret’s unique-animal hunt.' },
  { n: 3, name: 'First Taste — Activities', ids: [16,20,21,44,46], note: 'Sample the world: try each activity once, beat Cal at fishing, finish an arcade game, a cocktail on Ocean Beach, and a frame at the bowling alley.' },
  { n: 4, name: 'The Long Grind — Counts', ids: [15,17,18,19,30,31,32,34,35,36,40,55], note: 'The counters. Track each one with the steppers — 250 stunts, gold at every range, 100 WAiNK spots, 5 vaults. Chip away between story beats.' },
  { n: 5, name: 'Money & Mayhem', ids: [33,37,38,39,41,43,45,51,52,53], note: 'Heat, heists and cash: lose a 4-star wanted level with your partner, rob vaults and trucks, launder $250,000 in Marked Bills, spend $100,000 across the shops.' },
  { n: 6, name: 'Leonida Itself', ids: [28,42,47,48,49,50,54], note: 'The world and its secrets: meditate at every spot (the one confirmed missable — do it as you travel), explore all of Leonida, buy every garage. The last three are cryptic; their triggers are not confirmed yet.' },
  { n: 7, name: 'Platinum', ids: [14,1], note: '100% completion, then the platinum. “Vice Got a Price!” is yours when the other 54 are earned.' },
];
const SEED_EARNED = [2,3,4,8,9,10,15,16,20,21,33,42,44];
const SEED_COUNTS = { 15: 120, 19: 8, 31: 40, 32: 22, 35: 55 };
const params = new URLSearchParams(location.search);
let S = { earned: [], counts: {}, notes: {}, spoiler: true, hideNames: false, theme: 'night', chip: 'all', grade: 'all', q: '' };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) ?? '{}')); } catch (e) {}
S.earned = new Set(S.earned); S.counts = S.counts || {}; S.notes = S.notes || {};
if (params.get('seed')) { S.earned = new Set(SEED_EARNED); S.counts = { ...SEED_COUNTS }; }
if (params.get('spoiler') === 'off') S.spoiler = false;
if (params.get('spoiler') === 'on') S.spoiler = true;
if (params.get('theme')) S.theme = params.get('theme');
function save() { localStorage.setItem(KEY, JSON.stringify({ ...S, earned: [...S.earned] })); }
const doc = await (await fetch('data/trophies.json')).json();
const T = doc.trophies;
const byId = id => T.find(t => t.id === id);
function money(n) { return '$' + n.toLocaleString('en-US'); }
function fmtCount(t) { const v = S.counts[t.id] || 0; return t.target >= 10000 ? money(v) + ' / ' + money(t.target) : v + ' / ' + t.target; }
function stepOf(t) { return t.target >= 10000 ? 5000 : 1; }
function isRedacted(t) { return S.spoiler && t.hidden && t.kind === 'story' && !S.earned.has(t.id); }
function isHiddenName(t) { return S.hideNames && t.hidden && !S.earned.has(t.id); }
function shownName(t) { if (isRedacted(t)) return 'Hidden story trophy — earn it to reveal'; if (isHiddenName(t)) return 'Hidden trophy'; return t.name; }
function setCount(id, v) { const t = byId(id); v = Math.max(0, Math.min(t.target, v)); if (v === 0) delete S.counts[id]; else S.counts[id] = v; save(); renderAll(); }
function toggleEarned(id) { if (S.earned.has(id)) S.earned.delete(id); else S.earned.add(id); save(); renderAll(); }

let selected = params.get('trophy') ? +params.get('trophy') : 28;
function visible(t) {
  if (S.grade !== 'all' && t.grade !== S.grade) return false;
  if (S.chip === 'story' && t.kind !== 'story') return false;
  if (S.chip === 'missable' && !t.missable) return false;
  if (S.chip === 'collectibles' && t.kind !== 'collectibles') return false;
  if (S.chip === 'activities' && t.kind !== 'activities') return false;
  if (S.chip === 'secret' && !t.hidden) return false;
  if (S.q) {
    const q = S.q.toLowerCase();
    const hay = isRedacted(t) ? 'hidden story trophy' : (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}
function counterCell(t) {
  if (!t.target) return '<span class="nope">—</span>';
  const v = S.counts[t.id] || 0, pct = Math.round(v / t.target * 100);
  return `<span class="ctr"><button type="button" data-dec="${t.id}" aria-label="decrease">−</button><b>${fmtCount(t)}</b><button type="button" data-inc="${t.id}" aria-label="increase">+</button><span class="mini"><i style="width:${pct}%"></i></span></span>`;
}
function renderList() {
  const rows = $('#rows'); rows.replaceChildren();
  const list = T.filter(visible);
  for (const t of list) {
    const tr = document.createElement('tr');
    if (t.id === selected) tr.className = 'sel';
    const box = document.createElement('input');
    box.type = 'checkbox'; box.checked = S.earned.has(t.id);
    box.setAttribute('aria-label', 'earned ' + shownName(t));
    box.addEventListener('change', () => toggleEarned(t.id));
    const c0 = document.createElement('td'); c0.append(box); tr.append(c0);
    const c1 = document.createElement('td'); c1.className = 'name';
    c1.innerHTML = '';
    const nm = document.createElement('span'); nm.textContent = shownName(t); c1.append(nm);
    if (t.hidden && !isRedacted(t) && !isHiddenName(t)) { const b = document.createElement('small'); b.textContent = 'Secret · hidden on PSN'; c1.append(b); }
    else if (!isRedacted(t)) { const d = document.createElement('small'); d.textContent = t.description; c1.append(d); }
    tr.append(c1);
    const c2 = document.createElement('td');
    c2.innerHTML = isRedacted(t) || isHiddenName(t) ? '<span class="nope">—</span>' : `<span class="gchip g-${t.grade}">${t.grade}</span>`;
    tr.append(c2);
    const c3 = document.createElement('td'); c3.innerHTML = `<span class="kchip">${t.kind}</span>`; tr.append(c3);
    const c4 = document.createElement('td');
    c4.innerHTML = t.missable ? '<span class="watch">⚠ WATCH</span>' : '<span class="nope">— none known</span>';
    tr.append(c4);
    const c5 = document.createElement('td'); c5.innerHTML = counterCell(t); tr.append(c5);
    const c6 = document.createElement('td');
    const g = document.createElement('button'); g.type = 'button'; g.className = 'gbtn'; g.textContent = 'Guide';
    g.addEventListener('click', () => { selected = t.id; renderAll(); $('#pane').scrollIntoView({ block: 'nearest' }); });
    c6.append(g); tr.append(c6);
    tr.addEventListener('click', e => { if (e.target.closest('button,input')) return; selected = t.id; renderAll(); });
    rows.append(tr);
  }
  rows.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setCount(+b.dataset.inc, (S.counts[+b.dataset.inc] || 0) + stepOf(byId(+b.dataset.inc))); }));
  rows.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setCount(+b.dataset.dec, (S.counts[+b.dataset.dec] || 0) - stepOf(byId(+b.dataset.dec))); }));
  $('#countLine').textContent = `Showing ${list.length} of 55 trophies · ${S.earned.size} earned · ${T.filter(t => t.target).length} have PSN progress counters · 1 confirmed missable`;
}
function sourceBlock() {
  return `<div class="srcs"><b>Sources — click to verify</b><ul>`
    + `<li><a href="${EXO}" target="_blank" rel="noopener">Exophase — official GTA VI trophy list</a> (name, description, grade)</li>`
    + `<li><a href="${PSN}" target="_blank" rel="noopener">PSNProfiles — GTA VI trophies</a> (PSN count where it has one)</li>`
    + `<li>Our own advice from the official description — not yet checked in the game</li></ul></div>`;
}
function renderPane() {
  const p = $('#pane'); const t = byId(selected) || T[0];
  if (isRedacted(t)) {
    p.innerHTML = `<h3>Hidden story trophy</h3><p class="desc">Earn it to reveal — the spoiler guard hides this story trophy’s name, description and guide until you earn it. Untick “Hide story spoilers” above to show it.</p><p class="meta">Grade: — · Kind: story · Secret · Missable: — none known</p>${sourceBlock()}`;
    return;
  }
  const earned = S.earned.has(t.id);
  let h = `<h3>${t.name}</h3><p class="desc">${t.description}</p>`
    + `<p class="meta">Grade: <span class="gchip g-${t.grade}">${t.grade}</span> · Kind: ${t.kind}${t.hidden ? ' · Secret (hidden on PSN)' : ''} · Trophy #${t.id} of 55</p>`
    + sourceBlock();
  h += t.missable
    ? `<p class="missline"><b>⚠ Can it be missed? YES — WATCH.</b> This is the one confirmed missable: meditate at every spot across Leonida. Spots are visited as you travel, so check them off as you go — there is no confirmed way to return to a missed spot.</p>`
    : `<p class="okline"><b>Can it be missed? No — none known.</b> No confirmed missable list exists for this game yet. This trophy is not flagged missable by any source we checked.</p>`;
  h += `<p class="guide">${t.guide}</p>`;
  if (t.target) {
    const v = S.counts[t.id] || 0, pct = Math.round(v / t.target * 100);
    h += `<label>PSN progress counter</label><div class="ctr"><button type="button" id="pDec">−</button><b>${fmtCount(t)}</b><button type="button" id="pInc">+</button></div><div class="mini"><i style="width:${pct}%"></i></div><p class="meta">Target from the official description and PSNProfiles. Tap + as you progress; tick earned at ${fmtCount(t).split(' / ')[1]}.</p>`;
  }
  h += `<label for="note">Your notes</label><textarea id="note" placeholder="Your own notes for this trophy…">${S.notes[t.id] || ''}</textarea>`
    + `<div class="earnrow"><button type="button" id="earnBtn" class="${earned ? 'earned' : ''}">${earned ? '✓ Earned — tap to unmark' : 'Mark as earned'}</button></div>`;
  p.innerHTML = h;
  $('#earnBtn').addEventListener('click', () => toggleEarned(t.id));
  const d = $('#pDec'), i = $('#pInc');
  if (d) d.addEventListener('click', () => setCount(t.id, (S.counts[t.id] || 0) - stepOf(t)));
  if (i) i.addEventListener('click', () => setCount(t.id, (S.counts[t.id] || 0) + stepOf(t)));
  $('#note').addEventListener('change', e => { if (e.target.value) S.notes[t.id] = e.target.value; else delete S.notes[t.id]; save(); });
}

function renderRoadmap() {
  const w = $('#stages'); w.replaceChildren();
  for (const s of STAGES) {
    const done = s.ids.filter(id => S.earned.has(id)).length;
    const div = document.createElement('div'); div.className = 'stage';
    const chips = s.ids.map(id => { const t = byId(id); const nm = isRedacted(t) ? 'Hidden story trophy #' + id : t.name; return `<span class="tchip${S.earned.has(id) ? ' done' : ''}">${S.earned.has(id) ? '✓ ' : ''}${nm}</span>`; }).join('');
    div.innerHTML = `<h3>Stage ${s.n} — ${s.name} <span>${done}/${s.ids.length} earned</span></h3><div class="bar"><i style="width:${Math.round(done / s.ids.length * 100)}%"></i></div><p>${s.note}</p><div class="tchips">${chips}</div>`;
    w.append(div);
  }
}
function renderMissables() {
  const w = $('#missList'); w.replaceChildren();
  const m = byId(28);
  const card = document.createElement('div'); card.className = 'misscard';
  card.innerHTML = `<b>⚠ WATCH — #28 ${m.name}</b> <span class="gchip g-bronze">bronze</span> · Collectibles<br><p class="desc">${m.description}</p><p>${m.guide}</p><p class="missline"><b>Why it is the only WATCH:</b> meditation spots are visited as you travel, and no source confirms you can return to a missed spot. Do it as you go.</p>`;
  w.append(card);
  const tbl = document.createElement('table');
  tbl.innerHTML = '<thead><tr><th>Trophy</th><th>Missable status</th></tr></thead>';
  const tb = document.createElement('tbody');
  for (const t of T) {
    const tr = document.createElement('tr');
    const nm = document.createElement('td'); nm.textContent = isRedacted(t) ? 'Hidden story trophy #' + t.id : t.name; tr.append(nm);
    const st = document.createElement('td');
    st.innerHTML = t.missable ? '<span class="watch">⚠ WATCH — confirmed missable</span>' : '<span class="nope">— none known (no confirmed missable list yet)</span>';
    tr.append(st); tb.append(tr);
  }
  tbl.append(tb); w.append(tbl);
}
function renderPlanner() {
  const w = $('#planList'); w.replaceChildren();
  const order = STAGES.flatMap(s => s.ids).filter(id => !S.earned.has(id));
  const next = order.slice(0, 5);
  const head = document.createElement('div'); head.className = 'nextcard';
  head.innerHTML = `<b>Your next 5</b><p>${next.map(id => { const t = byId(id); return (isRedacted(t) ? 'Hidden story trophy #' + id : t.name) + (t.target ? ` (${fmtCount(t)})` : ''); }).join(' → ')}</p><p class="lede">Start with the first one. Each is the earliest unearned trophy in roadmap order.</p>`;
  w.append(head);
  for (const s of STAGES) {
    const left = s.ids.filter(id => !S.earned.has(id));
    if (!left.length) continue;
    const div = document.createElement('div'); div.className = 'stage';
    div.innerHTML = `<h3>Stage ${s.n} — ${s.name} <span>${left.length} left</span></h3><div class="tchips">${left.map(id => { const t = byId(id); return `<span class="tchip">${isRedacted(t) ? 'Hidden story trophy #' + id : t.name}</span>`; }).join('')}</div>`;
    w.append(div);
  }
  if (!order.length) { const d = document.createElement('div'); d.className = 'nextcard'; d.innerHTML = '<b>Platinum earned — Leonida Legend. 🏆</b>'; w.append(d); }
}
function renderProgress() {
  const n = S.earned.size, pct = Math.round(n / 55 * 100);
  $('#prog').textContent = `${n} / 55 earned`;
  $('#progBar').style.width = pct + '%';
  $('#progPct').textContent = pct + '% to platinum';
}
function renderAll() {
  document.documentElement.dataset.theme = S.theme;
  $('#themeBtn').textContent = S.theme === 'night' ? '☾ Paper theme' : '☀ Night theme';
  $('#spoilerChk').checked = S.spoiler; $('#hideNamesChk').checked = S.hideNames;
  document.querySelectorAll('#chips .chip').forEach(c => c.classList.toggle('on', c.dataset.f === S.chip));
  $('#gradeSel').value = S.grade; $('#q').value = S.q;
  renderList(); renderPane(); renderRoadmap(); renderMissables(); renderPlanner(); renderProgress();
}
function showView(v) {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  for (const id of ['tracker', 'roadmap', 'missables', 'planner']) $('#view-' + id).hidden = id !== v;
}
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
document.querySelectorAll('#chips .chip').forEach(c => c.addEventListener('click', () => { S.chip = c.dataset.f; save(); renderAll(); }));
$('#gradeSel').addEventListener('change', e => { S.grade = e.target.value; save(); renderAll(); });
$('#q').addEventListener('input', e => { S.q = e.target.value; renderList(); });
$('#spoilerChk').addEventListener('change', e => { S.spoiler = e.target.checked; save(); renderAll(); });
$('#hideNamesChk').addEventListener('change', e => { S.hideNames = e.target.checked; save(); renderAll(); });
$('#themeBtn').addEventListener('click', () => { S.theme = S.theme === 'night' ? 'paper' : 'night'; save(); renderAll(); });
$('#exportBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...S.earned], counts: S.counts, notes: S.notes }, null, 2)], { type: 'application/json' }));
  a.download = 'leonida55-progress.json'; a.click();
  $('#savedNote').textContent = 'Exported just now — keep the file to restore your progress.';
});
$('#importFile').addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (Array.isArray(d.earned)) S.earned = new Set(d.earned.filter(id => byId(id)));
    if (d.counts) S.counts = d.counts;
    if (d.notes) S.notes = d.notes;
    save(); renderAll();
    $('#savedNote').textContent = 'Progress imported — ' + S.earned.size + ' trophies earned.';
  } catch (err) { $('#savedNote').textContent = 'That file is not a Leonida 55 export.'; }
});
const viewParam = params.get('view');
if (viewParam && ['tracker', 'roadmap', 'missables', 'planner'].includes(viewParam)) showView(viewParam);
renderAll();
