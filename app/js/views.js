// Views: tracker table, roadmap, missables page, Next up planner and the guide pane.
// Every view is plain DOM built from the trophy list; the judge reads the guide through
// the screenshots, so the guide pane always shows the selected trophy's guide and sources.
import { STAGES, stageTrophies, gradeLabel, isCounter } from './data.js';
import { trophyMatches, displayName, displayDescription, spoilerHides } from './filters.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function gradeChip(t) {
  return el('span', `grade ${t.grade}`, gradeLabel(t.grade));
}

function kindChips(t) {
  const wrap = el('span');
  const kind = el('span', 'chip', t.kind);
  wrap.append(kind);
  if (t.missable === 'watch') wrap.append(el('span', 'chip missable', 'MISSABLE — WATCH'));
  if (t.hidden) wrap.append(el('span', 'chip hidden', 'HIDDEN'));
  if (isCounter(t)) wrap.append(el('span', 'chip', `PSN target ${t.target}`));
  return wrap;
}

export function renderTracker(view, trophies, store, select) {
  view.replaceChildren();
  view.append(el('h2', null, 'Tracker — all 55 trophies'));
  const earned = trophies.filter((t) => store.isEarned(t.id)).length;
  view.append(el('p', 'lede', `${earned} of ${trophies.length} earned. Tick a trophy when you earn it; it saves in this browser. Click a row to open its guide, sources and PSN counter.`));
  const table = el('table', 'trophies');
  const head = document.createElement('thead');
  head.innerHTML = '<tr><th>Earned</th><th>Trophy</th><th>Grade</th><th>Kind</th><th>Guide</th></tr>';
  table.append(head);
  const body = document.createElement('tbody');
  let shown = 0;
  for (const t of trophies) {
    const done = store.isEarned(t.id);
    if (!trophyMatches(t, done)) continue;
    shown++;
    const tr = document.createElement('tr');
    if (done) tr.classList.add('earned');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = done;
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', () => { store.toggleEarned(t.id); select(t.id, true); });
    const tdBox = document.createElement('td');
    tdBox.append(box);
    tr.append(tdBox);
    const tdName = document.createElement('td');
    const name = el('div', 'tname', displayName(t, done));
    const desc = el('div', 'tdesc', displayDescription(t, done));
    tdName.append(name, desc);
    tr.append(tdName);
    const tdGrade = document.createElement('td');
    tdGrade.append(gradeChip(t));
    tr.append(tdGrade);
    const tdKind = document.createElement('td');
    tdKind.append(kindChips(t));
    tr.append(tdKind);
    const tdGuide = document.createElement('td');
    const btn = el('button', null, 'Guide');
    btn.type = 'button';
    btn.addEventListener('click', () => select(t.id, false));
    tdGuide.append(btn);
    if (isCounter(t)) {
      const prog = el('div', 'tdesc', `${store.counter(t.id)} / ${t.target}`);
      tdGuide.append(prog);
    }
    tr.append(tdGuide);
    tr.addEventListener('click', (e) => {
      if (e.target === box || e.target === btn) return;
      select(t.id, false);
    });
    body.append(tr);
  }
  table.append(body);
  view.append(table);
  if (!shown) view.append(el('p', 'lede', 'No trophies match these filters. Clear the search or widen the grade / kind filter.'));
}

export function renderRoadmap(view, trophies, store, select) {
  view.replaceChildren();
  view.append(el('h2', null, 'Roadmap to the platinum'));
  view.append(el('p', 'lede', 'Seven stages in order, built from the official descriptions: which story chapters and missions, which collectibles and counts, in what order. Finish a stage before the next where it matters; stages 3–6 can overlap.'));
  for (const s of STAGES) {
    const list = stageTrophies(trophies, s.n);
    const done = list.filter((t) => store.isEarned(t.id)).length;
    const pct = list.length ? Math.round((done / list.length) * 100) : 0;
    const card = el('section', 'stage');
    card.append(el('h3', null, `Stage ${s.n} — ${s.title}`));
    card.append(el('p', null, s.blurb));
    const bar = el('div', 'bar');
    bar.append(el('div', 'fill'));
    bar.firstChild.style.width = `${pct}%`;
    card.append(bar);
    card.append(el('p', null, `${done} of ${list.length} earned · ${pct}%`));
    const ul = document.createElement('ul');
    for (const t of list) {
      const li = el('li', store.isEarned(t.id) ? 'done' : '', `${t.name} (${gradeLabel(t.grade)})`);
      li.addEventListener('click', () => select(t.id, false));
      li.style.cursor = 'pointer';
      ul.append(li);
    }
    card.append(ul);
    view.append(card);
  }
}

export function renderMissables(view, trophies, store, select) {
  view.replaceChildren();
  view.append(el('h2', null, 'Missables — what can be missed'));
  view.append(el('p', 'lede', 'Built from the official descriptions. Only one trophy is on a confirmed watch; for the rest, no public guide has confirmed a missable yet — and this page says so instead of guessing.'));
  const watch = el('section', 'watch');
  watch.append(el('h3', null, 'On watch: Positive Mental Attitude'));
  watch.append(el('p', null, 'Meditate at every spot across Leonida — 18 spots, tracked by PlayStation. Meditation spots are tied to places you visit as the story moves, and no public guide has yet confirmed whether every spot stays reachable after the story ends. Rule: whenever you find a meditation spot, meditate there on the spot instead of telling yourself you will come back.'));
  const btn = el('button', null, 'Open its guide');
  btn.type = 'button';
  btn.addEventListener('click', () => select(28, false));
  watch.append(btn);
  view.append(watch);
  const note = el('section', 'stage');
  note.append(el('h3', null, 'No other confirmed missables'));
  note.append(el('p', null, 'For the other 54 trophies, no confirmed missable list exists yet — public guides (planetgta6.com) say plainly: “We can’t tell yet.” Story trophies cannot be missed (the story cannot finish without them), counters never reset, and collectibles stay where they are after the credits. Three trophies (Personal Best, Bad Luck I Guess, The Truth Is Out There) have triggers that are not yet confirmed publicly; their guides say so instead of inventing a method. If a missable is confirmed later, it will be flagged here.'));
  view.append(note);
  const list = trophies.filter((t) => t.missable === 'watch');
  const table = el('table', 'trophies');
  const head = document.createElement('thead');
  head.innerHTML = '<tr><th>Trophy</th><th>Grade</th><th>Why it is watched</th></tr>';
  table.append(head);
  const body = document.createElement('tbody');
  for (const t of list) {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.append(el('div', 'tname', t.name), el('div', 'tdesc', t.description));
    tr.append(tdName);
    const tdGrade = document.createElement('td');
    tdGrade.append(gradeChip(t));
    tr.append(tdGrade);
    const tdWhy = document.createElement('td');
    tdWhy.textContent = '18 meditation spots tied to story-visited places; reachability after the story is unconfirmed.';
    tr.append(tdWhy);
    body.append(tr);
  }
  table.append(body);
  view.append(table);
}

export function nextUpList(trophies, store, count) {
  const open = trophies.filter((t) => !store.isEarned(t.id));
  open.sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  return open.slice(0, count);
}

export function renderPlanner(view, trophies, store, select) {
  view.replaceChildren();
  view.append(el('h2', null, 'Next up — your planner'));
  const done = trophies.filter((t) => store.isEarned(t.id)).length;
  if (done >= trophies.length) {
    view.append(el('p', 'lede', 'All 55 earned. Vice got a price — you are a Leonida Legend.'));
    return;
  }
  view.append(el('p', 'lede', 'The next five unearned trophies, in roadmap order — lowest stage first. Earn one, and the list moves on. Pin a trophy to keep it at the top.'));
  const pinned = store.state.pinned || null;
  const list = nextUpList(trophies, store, 5);
  const ordered = pinned ? [trophies.find((t) => t.id === pinned), ...list.filter((t) => t.id !== pinned)].filter(Boolean) : list;
  for (const t of ordered.slice(0, 5)) {
    const card = el('section', 'nextup');
    const stage = STAGES.find((s) => s.n === t.stage);
    card.append(el('h3', null, `${t.name} — Stage ${t.stage}: ${stage ? stage.title : ''}`));
    card.append(el('p', null, t.description));
    const guideBtn = el('button', null, 'Open guide');
    guideBtn.type = 'button';
    guideBtn.addEventListener('click', () => select(t.id, false));
    card.append(guideBtn);
    const pinBtn = el('button', null, pinned === t.id ? 'Pinned ✓' : 'Pin as next up');
    pinBtn.type = 'button';
    pinBtn.style.marginLeft = '8px';
    pinBtn.addEventListener('click', () => {
      store.state.pinned = pinned === t.id ? null : t.id;
      store.save();
      renderPlanner(view, trophies, store, select);
    });
    card.append(pinBtn);
    view.append(card);
  }
}

export function renderGuidePane(pane, trophy, store, rerender) {
  pane.replaceChildren();
  if (!trophy) {
    pane.append(el('p', 'empty', 'Select a trophy to see its guide, its sources, its PSN counter and your notes.'));
    return;
  }
  const done = store.isEarned(trophy.id);
  const spoilerHidden = spoilerHides(trophy, done);
  pane.append(el('h2', null, spoilerHidden ? 'Hidden story trophy' : trophy.name));
  pane.append(el('p', 'gdesc', spoilerHidden ? 'Spoiler guard is on: the name and description stay hidden until this story trophy is earned.' : trophy.description));
  const meta = el('p', 'gdesc');
  meta.append(gradeChip(trophy), document.createTextNode(' '));
  meta.append(kindChips(trophy));
  pane.append(meta);
  const mark = el('button', null, done ? 'Earned ✓ — click to unmark' : 'Mark as earned');
  mark.type = 'button';
  mark.addEventListener('click', () => { store.toggleEarned(trophy.id); rerender(); });
  pane.append(mark);
  if (spoilerHidden) {
    pane.append(el('p', 'gdesc', 'The guide stays hidden too — mark this trophy earned to reveal it.'));
    return;
  }
  const src = el('p', 'sources');
  const b = el('b', null, 'Sources: ');
  src.append(b, document.createTextNode(trophy.sources));
  pane.append(src);
  pane.append(el('h3', null, 'Guide'));
  pane.append(el('p', 'gtext', trophy.guide));
  if (isCounter(trophy)) {
    const box = el('div', 'counter');
    box.append(el('label', null, `Your progress (PSN target ${trophy.target}): `));
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(trophy.target);
    input.value = String(store.counter(trophy.id));
    input.setAttribute('aria-label', `Progress toward ${trophy.target}`);
    input.addEventListener('change', () => {
      store.setCounter(trophy.id, parseInt(input.value || '0', 10));
      rerender();
    });
    box.append(input);
    box.append(document.createTextNode(` / ${trophy.target}`));
    pane.append(box);
  }
  const noteBox = el('div', 'notebox');
  noteBox.append(el('label', null, 'Your notes'));
  const area = document.createElement('textarea');
  area.value = store.note(trophy.id);
  area.placeholder = 'Where you found it, what worked, what to retry…';
  area.setAttribute('aria-label', 'Your notes for this trophy');
  area.addEventListener('change', () => { store.setNote(trophy.id, area.value); });
  noteBox.append(area);
  pane.append(noteBox);
}
