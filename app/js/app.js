// Leonida 55 — boot, hash routing, controls and URL parameters for screenshots / tests.
// URL parameters (all optional): ?view=tracker|roadmap|missables|planner, ?trophy=<id>,
// ?seed=<id,id,…> (mark earned), ?counters=<id:value,…>, ?spoiler=on|off, ?theme=night|paper.
import { loadTrophies, trophyById } from './data.js';
import { store } from './store.js';
import { filters } from './filters.js';
import { renderTracker, renderRoadmap, renderMissables, renderPlanner, renderGuidePane } from './views.js';

const viewEl = document.getElementById('view');
const paneEl = document.getElementById('guidePane');
const tabsEl = document.getElementById('tabs');

let trophies = [];
let selectedId = null;
let currentView = 'tracker';

function applyUrlParams() {
  const q = new URLSearchParams(location.search);
  if (q.get('theme') === 'paper' || q.get('theme') === 'night') {
    store.state.theme = q.get('theme');
    store.save();
  }
  if (q.get('spoiler') === 'on') { store.state.spoiler = true; store.save(); }
  if (q.get('spoiler') === 'off') { store.state.spoiler = false; store.save(); }
  if (q.get('seed')) {
    for (const raw of q.get('seed').split(',')) {
      const id = parseInt(raw, 10);
      if (id) store.setEarned(id, true);
    }
  }
  if (q.get('counters')) {
    for (const pair of q.get('counters').split(',')) {
      const [idRaw, valRaw] = pair.split(':');
      const id = parseInt(idRaw, 10);
      const val = parseInt(valRaw, 10);
      if (id && !Number.isNaN(val)) store.setCounter(id, val);
    }
  }
  if (q.get('trophy')) {
    const id = parseInt(q.get('trophy'), 10);
    if (id) selectedId = id;
  }
  if (q.get('view')) currentView = q.get('view');
}

function viewFromHash() {
  const m = location.hash.match(/^#\/(tracker|roadmap|missables|planner)$/);
  if (m) currentView = m[1];
  if (!location.hash) currentView = currentView || 'tracker';
}

function renderProgress() {
  const done = trophies.filter((t) => store.isEarned(t.id)).length;
  const pct = Math.round((done / trophies.length) * 100);
  document.getElementById('earnedCount').textContent = String(done);
  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('progressLine').textContent = `${done} of ${trophies.length} earned · ${pct}% to the platinum`;
}

function renderView() {
  for (const a of tabsEl.querySelectorAll('a')) {
    a.classList.toggle('active', a.dataset.view === currentView);
  }
  const select = (id, keep) => selectTrophy(id, keep);
  if (currentView === 'roadmap') renderRoadmap(viewEl, trophies, store, select);
  else if (currentView === 'missables') renderMissables(viewEl, trophies, store, select);
  else if (currentView === 'planner') renderPlanner(viewEl, trophies, store, select);
  else renderTracker(viewEl, trophies, store, select);
  renderProgress();
  renderGuidePane(paneEl, selectedId ? trophyById(trophies, selectedId) : null, store, rerender);
}

function rerender() {
  renderView();
}

function selectTrophy(id, keep) {
  selectedId = id;
  if (!keep) renderGuidePane(paneEl, trophyById(trophies, id), store, rerender);
  renderProgress();
  if (keep) renderView();
}

window.addEventListener('hashchange', () => { viewFromHash(); renderView(); });

function applyTheme() {
  const theme = store.state.theme || 'night';
  document.documentElement.dataset.theme = theme;
  document.getElementById('themeToggle').textContent = theme === 'night' ? 'Paper theme' : 'Night theme';
}

function wireControls() {
  const search = document.getElementById('search');
  const grade = document.getElementById('gradeFilter');
  const kind = document.getElementById('kindFilter');
  const earned = document.getElementById('earnedFilter');
  const spoiler = document.getElementById('spoilerToggle');
  const hidden = document.getElementById('hiddenToggle');
  search.addEventListener('input', () => { filters.search = search.value; renderView(); });
  grade.addEventListener('change', () => { filters.grade = grade.value; renderView(); });
  kind.addEventListener('change', () => { filters.kind = kind.value; renderView(); });
  earned.addEventListener('change', () => { filters.earned = earned.value; renderView(); });
  spoiler.checked = store.state.spoiler !== false;
  filters.spoiler = spoiler.checked;
  spoiler.addEventListener('change', () => {
    filters.spoiler = spoiler.checked;
    store.state.spoiler = spoiler.checked;
    store.save();
    renderView();
  });
  hidden.addEventListener('change', () => { filters.showHidden = !hidden.checked; renderView(); });
  document.getElementById('themeToggle').addEventListener('click', () => {
    store.state.theme = store.state.theme === 'night' ? 'paper' : 'night';
    store.save();
    applyTheme();
  });
  document.getElementById('exportBtn').addEventListener('click', () => store.exportFile());
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await store.importFile(file);
      filters.spoiler = store.state.spoiler !== false;
      spoiler.checked = filters.spoiler;
      applyTheme();
      renderView();
    } catch {
      alert('That file is not a Leonida 55 progress export.');
    }
  });
}

trophies = await loadTrophies();
applyUrlParams();
filters.spoiler = store.state.spoiler !== false;
viewFromHash();
applyTheme();
wireControls();
renderView();
