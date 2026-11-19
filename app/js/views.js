// Leonida 55 — views: checklist + guide pane, roadmap, missables, planner, settings.
// Each renderer builds DOM from the official data and the saved state; nothing is fetched
// from the network and no Rockstar artwork is used anywhere.

import { KIND_LABELS, ROADMAP_STAGES, gradePoints, totalPoints, stageProgress, computeNextUp, formatTarget } from './data.js';
import { applyFilters, isSpoilerMasked, maskedName, maskedDescription } from './filters.js';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function gradeTag(trophy) {
  return el('span', `tag ${trophy.grade}`, trophy.grade);
}

function counterBox(trophy, ctx) {
  const box = el('div', 'counter-box');
  const value = Math.min(ctx.state.counters[trophy.id] || 0, trophy.target);
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.max = String(trophy.target);
  input.value = String(value);
  input.setAttribute('aria-label', `Progress toward ${trophy.name}`);
  input.addEventListener('change', () => {
    ctx.setCounter(trophy.id, Number(input.value));
  });
  input.addEventListener('click', (e) => e.stopPropagation());
  const bar = el('div', 'mini-bar');
  bar.append(el('div', null));
  bar.firstChild.style.width = `${Math.round((value / trophy.target) * 100)}%`;
  box.append(input, bar, el('span', null, `of ${formatTarget(trophy)}`));
  return box;
}

function trophyRow(trophy, ctx) {
  const row = el('div', 'trophy-row');
  if (ctx.state.earned.has(trophy.name)) row.classList.add('earned');
  if (ctx.selectedId === trophy.id) row.classList.add('selected');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = ctx.state.earned.has(trophy.name);
  box.setAttribute('aria-label', `Mark ${trophy.name} earned`);
  box.addEventListener('change', (e) => {
    e.stopPropagation();
    ctx.toggleEarned(trophy.name);
  });
  const body = el('div');
  body.append(el('div', 'trophy-name', maskedName(trophy, ctx.state)));
  body.append(el('div', 'trophy-desc', maskedDescription(trophy, ctx.state)));
  const meta = el('div', 'trophy-meta');
  meta.append(gradeTag(trophy));
  meta.append(el('span', 'tag', KIND_LABELS[trophy.kind] || trophy.kind));
  if (trophy.hidden) meta.append(el('span', 'tag hidden-tag', 'Hidden'));
  if (trophy.missable === 'watch') meta.append(el('span', 'tag missable-tag', 'Missable watch'));
  if (trophy.target != null) meta.append(el('span', 'tag target-tag', formatTarget(trophy)));
  body.append(meta);
  if (trophy.target != null && !isSpoilerMasked(trophy, ctx.state)) body.append(counterBox(trophy, ctx));
  row.append(box, body, el('span', 'tag', 'Guide →'));
  row.addEventListener('click', () => ctx.select(trophy.id));
  return row;
}

function shortSources(trophy) {
  let s = 'Exophase · PSNProfiles';
  if (trophy.sources.includes('Output Lag')) s += ' · Output Lag';
  if (trophy.sources.includes('Planet GTA')) s += ' · Planet GTA 6';
  return s;
}

export function renderChecklist(main, ctx) {
  const layout = el('div', 'check-layout');
  const left = el('div');
  const filtersBar = el('div', 'filters');
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search trophies, descriptions, guides…';
  search.value = ctx.filters.search;
  search.addEventListener('input', () => { ctx.filters.search = search.value; ctx.refreshList(); });
  const grade = document.createElement('select');
  grade.setAttribute('aria-label', 'Filter by grade');
  for (const [v, label] of [['all', 'All grades'], ['platinum', 'Platinum'], ['gold', 'Gold'], ['silver', 'Silver'], ['bronze', 'Bronze']]) {
    const o = document.createElement('option');
    o.value = v; o.textContent = label;
    if (ctx.filters.grade === v) o.selected = true;
    grade.append(o);
  }
  grade.addEventListener('change', () => { ctx.filters.grade = grade.value; ctx.rerender(true); });
  const earnedSel = document.createElement('select');
  earnedSel.setAttribute('aria-label', 'Filter by earned state');
  for (const [v, label] of [['all', 'All'], ['earned', 'Earned'], ['unearned', 'Not earned']]) {
    const o = document.createElement('option');
    o.value = v; o.textContent = label;
    if (ctx.filters.earned === v) o.selected = true;
    earnedSel.append(o);
  }
  earnedSel.addEventListener('change', () => { ctx.filters.earned = earnedSel.value; ctx.rerender(true); });
  filtersBar.append(search, grade, earnedSel);
  for (const kind of ['all', 'story', 'side', 'collectible', 'activity', 'robbery', 'world', 'money']) {
    const chip = el('button', `chip${ctx.filters.kind === kind ? ' on' : ''}`, kind === 'all' ? 'All kinds' : KIND_LABELS[kind]);
    chip.type = 'button';
    chip.addEventListener('click', () => { ctx.filters.kind = kind; ctx.rerender(true); });
    filtersBar.append(chip);
  }
  left.append(filtersBar);
  const list = el('div', 'trophy-list');
  const shown = applyFilters(ctx.trophies, ctx.filters, ctx.state);
  if (!shown.length) list.append(el('div', 'empty-note', 'No trophies match these filters.'));
  for (const t of shown) list.append(trophyRow(t, ctx));
  left.append(list);
  layout.append(left, renderDetailPane(ctx));
  main.append(layout);
}

export function refreshTrophyList(main, ctx) {
  const list = main.querySelector('.trophy-list');
  if (!list) return;
  list.replaceChildren();
  const shown = applyFilters(ctx.trophies, ctx.filters, ctx.state);
  if (!shown.length) list.append(el('div', 'empty-note', 'No trophies match these filters.'));
  for (const t of shown) list.append(trophyRow(t, ctx));
}

export function renderDetailPane(ctx) {
  const pane = el('aside', 'detail');
  const trophy = ctx.trophies.find((t) => t.id === ctx.selectedId);
  if (!trophy) {
    pane.append(el('p', 'detail-empty', 'Select a trophy on the left to read its full guide, its sources and its missable note.'));
    return pane;
  }
  const close = el('button', 'detail-close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close guide');
  close.addEventListener('click', () => ctx.select(null));
  pane.append(close);
  pane.append(el('h2', null, maskedName(trophy, ctx.state)));
  const meta = el('div', 'trophy-meta');
  meta.append(gradeTag(trophy));
  meta.append(el('span', 'tag', KIND_LABELS[trophy.kind] || trophy.kind));
  if (trophy.hidden) meta.append(el('span', 'tag hidden-tag', 'Hidden'));
  if (trophy.missable === 'watch') meta.append(el('span', 'tag missable-tag', 'Missable watch'));
  pane.append(meta);
  if (isSpoilerMasked(trophy, ctx.state)) {
    const lock = el('div', 'spoiler-lock');
    lock.textContent = 'This is a hidden story trophy. Earn it in the game, or turn spoilers on at the top of the page to reveal its description and guide.';
    pane.append(lock);
    return pane;
  }
  pane.append(el('p', 'official-desc', `Official description: “${trophy.description}”`));
  if (trophy.missable === 'watch') {
    const note = el('div', 'missable-note');
    note.innerHTML = '<strong>Missable watch.</strong> This is the only trophy on the list with a confirmed missable moment. See the Missables tab for the full warning and keep a Chapter 1 save until it pops.';
    pane.append(note);
  }
  if (trophy.target != null) {
    pane.append(el('h3', null, 'PSN target'));
    pane.append(counterBox(trophy, ctx));
  }
  pane.append(el('h3', null, `Guide · Sources: ${shortSources(trophy)}`));
  pane.append(el('p', 'guide-text', trophy.guide));
  pane.append(el('h3', null, 'Sources'));
  pane.append(el('p', 'sources-text', trophy.sources));
  pane.append(el('p', 'honesty', 'Honest note: this guide is written from the official description and the sources named above. Anything not yet checked in the game is marked as such, and no step is claimed without a source.'));
  return pane;
}

export function renderRoadmap(main, ctx) {
  const intro = el('p', null, 'The road to the platinum in seven stages, in order. Each stage lists its trophies with their official names; tick them off as you earn them. The two golds sit at the end: finish the story, then grind the 100% checklist.');
  intro.style.color = 'var(--muted)';
  main.append(intro);
  const grid = el('div', 'stage-grid');
  for (const stage of ROADMAP_STAGES) {
    const card = el('section', 'stage-card');
    const prog = stageProgress(ctx.trophies, stage.id, ctx.state.earned);
    const h = el('h2');
    h.append(el('span', 'stage-num', `Stage ${stage.num}`));
    h.append(document.createTextNode(stage.title));
    card.append(h);
    card.append(el('p', null, stage.blurb));
    const bar = el('div', 'mini-bar');
    bar.append(el('div', null));
    bar.firstChild.style.width = `${prog.pct}%`;
    card.append(bar);
    card.append(el('p', null, `${prog.done} of ${prog.total} earned — ${prog.pct}%`));
    const list = el('ul', 'stage-list');
    for (const t of ctx.trophies.filter((x) => x.stage === stage.id)) {
      const li = el('li');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = ctx.state.earned.has(t.name);
      box.setAttribute('aria-label', `Mark ${t.name} earned`);
      box.addEventListener('change', () => ctx.toggleEarned(t.name));
      const name = el('span', ctx.state.earned.has(t.name) ? 'done' : null, maskedName(t, ctx.state));
      li.append(box, name);
      if (t.target != null) li.append(el('span', 'tag target-tag', formatTarget(t)));
      list.append(li);
    }
    card.append(list);
    grid.append(card);
  }
  main.append(grid);
}

export function renderMissables(main, ctx) {
  const watch = ctx.trophies.find((t) => t.missable === 'watch');
  const card = el('section', 'watch-card');
  card.append(el('h2', null, `Missable watch: ${watch.name}`));
  card.append(el('p', null, 'Meditate at every spot across Leonida — 18 spots. The one moment you can miss: in Chapter 1, after the mission Down to Earth, Lucia heads out to the balcony of Jason\u2019s house in the morning to meditate. Follow her and accept the optional task. It is gone once Chapter 1 ends.'));
  card.append(el('p', null, 'It is not confirmed that the trophy strictly needs that balcony meditation, but do it anyway and keep a Chapter 1 manual save until the trophy pops. The other spots show as purple icons when you are close, and each outdoor spot should count twice if you meditate there with both characters, so bring your partner every time.'));
  const open = el('button', 'btn', 'Read the full guide');
  open.type = 'button';
  open.addEventListener('click', () => { location.hash = `#/checklist/${watch.id}`; });
  card.append(open);
  main.append(card);
  const info = el('section', 'info-card');
  info.append(el('h2', null, 'No confirmed missable list yet'));
  const p = el('p', null, 'As of the official list frozen 2026-11-18, no reliable list of missable trophies exists beyond the one above. The game has only just come out. Until there is one, these four rules keep you from needing a second playthrough:');
  info.append(p);
  const ul = document.createElement('ul');
  for (const rule of [
    'No mission replay, no new game plus. The game has 15 manual save slots plus one autosave: keep one at the start of each chapter and an untouched one from just before the final mission.',
    'Do Lucia\u2019s balcony meditation in Chapter 1 (see above).',
    'Do the race against Yago the moment it appears in Chapter 3. It is time-sensitive, marked with an hourglass icon, and its strand counts toward Strangers & Freaks. Save first, then race.',
    'Never use cheats on your trophy save. Cheats should switch off both trophies and saving.',
  ]) ul.append(el('li', null, rule));
  info.append(ul);
  const src = el('p', 'sources-text', 'Sources: Output Lag trophy guide (outputlag.com) for the save rules and the Yago race; official list on Exophase for the trophy itself. Our own advice from the official description, not yet checked in the game.');
  info.append(src);
  main.append(info);
}

export function renderPlanner(main, ctx) {
  const intro = el('p', null, 'Next up, from your current progress. The planner looks at what you have earned, what your counters say, and what is quick to do next, and suggests the next eight trophies in a sensible order.');
  intro.style.color = 'var(--muted)';
  main.append(intro);
  const picks = computeNextUp(ctx.trophies, ctx.state.earned, ctx.state.counters);
  if (!picks.length) {
    main.append(el('p', null, 'Everything is earned. Vice Got a Price! should have popped — congratulations, Leonida Legend.'));
    return;
  }
  const list = el('div', 'next-list');
  for (const { trophy, why } of picks) {
    const item = el('div', 'next-item');
    item.append(el('div', 'trophy-name', maskedName(trophy, ctx.state)));
    const meta = el('div', 'trophy-meta');
    meta.append(gradeTag(trophy));
    meta.append(el('span', 'tag', KIND_LABELS[trophy.kind] || trophy.kind));
    if (trophy.target != null) meta.append(el('span', 'tag target-tag', formatTarget(trophy)));
    item.append(meta);
    item.append(el('div', 'why', why));
    item.addEventListener('click', () => { location.hash = `#/checklist/${trophy.id}`; });
    list.append(item);
  }
  main.append(list);
}

export function renderSettings(main, ctx) {
  const card = el('section', 'info-card');
  card.append(el('h2', null, 'Save & settings'));
  card.append(el('p', null, 'Your progress is saved in this browser (localStorage). Export it to a file before you clear your browser data, and import it back on any machine.'));
  const row = el('div', 'settings-row');
  const exp = el('button', 'btn', 'Export progress');
  exp.type = 'button';
  exp.addEventListener('click', () => ctx.exportProgress());
  const impLabel = el('label', 'btn ghost', 'Import progress');
  impLabel.style.cursor = 'pointer';
  const imp = document.createElement('input');
  imp.type = 'file';
  imp.accept = 'application/json';
  imp.style.display = 'none';
  imp.addEventListener('change', () => { if (imp.files[0]) ctx.importProgress(imp.files[0]); });
  impLabel.append(imp);
  const reset = el('button', 'btn danger', 'Reset all progress');
  reset.type = 'button';
  reset.addEventListener('click', () => { if (window.confirm('Reset all earned trophies, counters and settings?')) ctx.resetAll(); });
  row.append(exp, impLabel, reset);
  card.append(row);
  const row2 = el('div', 'settings-row');
  const spoilerLabel = el('label', null, 'Hide story trophies until earned (spoilers off)');
  const spoilerBox = document.createElement('input');
  spoilerBox.type = 'checkbox';
  spoilerBox.checked = ctx.state.spoiler;
  spoilerBox.addEventListener('change', () => ctx.setSpoiler(spoilerBox.checked));
  spoilerLabel.prepend(spoilerBox);
  const themeLabel = el('label', null, 'Light theme');
  const themeBox = document.createElement('input');
  themeBox.type = 'checkbox';
  themeBox.checked = ctx.state.theme === 'paper';
  themeBox.addEventListener('change', () => ctx.setTheme(themeBox.checked ? 'paper' : 'night'));
  themeLabel.prepend(themeBox);
  row2.append(spoilerLabel, themeLabel);
  card.append(row2);
  card.append(el('p', 'sources-text', 'About this guide: the official list of 55 trophies was frozen 2026-11-18 from Exophase and PSNProfiles, who agree on every name, description and grade. Hidden flags were cross-checked with planetgta6.com and outputlag.com. Every guide is written in our own words; a method that names another guide cites it, and anything not yet checked in the game says so.'));
  main.append(card);
}
