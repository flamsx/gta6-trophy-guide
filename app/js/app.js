// Leonida 55 — boot, saved state, hash routing, render loop.
// The app is static and offline: it fetches data/trophies.json from its own files and nothing else.

import { loadProgress, saveProgress, exportProgress, importProgressFile, resetProgress } from './store.js';
import { createFilterState } from './filters.js';
import { totalPoints } from './data.js';
import { renderChecklist, refreshTrophyList, renderRoadmap, renderMissables, renderPlanner, renderSettings } from './views.js';

const main = document.getElementById('main');
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

const saved = loadProgress();
const state = {
  earned: new Set(saved.earned),
  counters: saved.counters,
  spoiler: saved.spoiler,
  theme: saved.theme,
};
const filters = createFilterState();
let selectedId = null;
let view = 'checklist';

function persist() {
  saveProgress(state);
}

function updateChrome() {
  document.documentElement.dataset.theme = state.theme;
  document.getElementById('themeToggle').textContent = state.theme === 'paper' ? 'Dark' : 'Light';
  document.getElementById('spoilerToggle').checked = state.spoiler;
  document.getElementById('progressCount').textContent = `${state.earned.size} of ${trophies.length} earned`;
  document.getElementById('progressPoints').textContent = `${totalPoints(trophies, state.earned)} pts`;
  document.getElementById('progressFill').style.width = `${Math.round((state.earned.size / trophies.length) * 100)}%`;
  for (const a of document.querySelectorAll('.tabs a')) {
    a.classList.toggle('active', a.dataset.view === view);
  }
}

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  view = ['checklist', 'roadmap', 'missables', 'planner', 'settings'].includes(parts[0]) ? parts[0] : 'checklist';
  selectedId = parts[1] ? Number(parts[1]) : null;
  if (selectedId && !trophies.some((t) => t.id === selectedId)) selectedId = null;
}

function render() {
  parseHash();
  updateChrome();
  main.replaceChildren();
  const ctx = {
    trophies, state, filters, selectedId,
    select(id) {
      selectedId = id;
      location.hash = id ? `#/checklist/${id}` : '#/checklist';
      if (!id) render();
    },
    toggleEarned(name) {
      if (state.earned.has(name)) state.earned.delete(name);
      else state.earned.add(name);
      persist();
      render();
    },
    setCounter(id, value) {
      const trophy = trophies.find((t) => t.id === id);
      if (!trophy || trophy.target == null) return;
      state.counters[id] = Math.max(0, Math.min(Math.round(Number(value) || 0), trophy.target));
      persist();
      render();
    },
    rerender() { render(); },
    refreshList() { refreshTrophyList(main, ctx); },
    exportProgress() { exportProgress(state); },
    async importProgress(file) {
      try {
        const data = await importProgressFile(file, trophies);
        state.earned = new Set(data.earned);
        state.counters = data.counters;
        persist();
        render();
      } catch (err) {
        window.alert('That file could not be imported. It must be a Leonida 55 progress export.');
      }
    },
    resetAll() {
      resetProgress();
      state.earned = new Set();
      state.counters = {};
      persist();
      render();
    },
    setSpoiler(value) {
      state.spoiler = value;
      persist();
      render();
    },
    setTheme(theme) {
      state.theme = theme;
      persist();
      updateChrome();
    },
  };
  if (view === 'roadmap') renderRoadmap(main, ctx);
  else if (view === 'missables') renderMissables(main, ctx);
  else if (view === 'planner') renderPlanner(main, ctx);
  else if (view === 'settings') renderSettings(main, ctx);
  else renderChecklist(main, ctx);
}

document.getElementById('spoilerToggle').addEventListener('change', (e) => {
  state.spoiler = e.target.checked;
  persist();
  render();
});
document.getElementById('themeToggle').addEventListener('click', () => {
  state.theme = state.theme === 'paper' ? 'night' : 'paper';
  persist();
  updateChrome();
});
window.addEventListener('hashchange', render);

render();
