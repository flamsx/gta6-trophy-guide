// Leonida 55 — saved progress: localStorage, export and import.
// One key, one shape: { earned: [trophy names], counters: { trophyId: number }, spoiler: bool, theme: 'night'|'paper' }.

export const STORE_KEY = 'leonida55-v1';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { earned: [], counters: {}, spoiler: true, theme: 'night' };
    const data = JSON.parse(raw);
    return {
      earned: Array.isArray(data.earned) ? data.earned : [],
      counters: data.counters && typeof data.counters === 'object' ? data.counters : {},
      spoiler: data.spoiler !== false,
      theme: data.theme === 'paper' ? 'paper' : 'night',
    };
  } catch (err) {
    return { earned: [], counters: {}, spoiler: true, theme: 'night' };
  }
}

export function saveProgress(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    earned: [...state.earned],
    counters: state.counters,
    spoiler: state.spoiler,
    theme: state.theme,
  }));
}

export function exportProgress(state) {
  const blob = new Blob([JSON.stringify({
    app: 'Leonida 55',
    exportedAt: new Date().toISOString(),
    earned: [...state.earned],
    counters: state.counters,
  }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida55-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProgressFile(file, trophies) {
  const text = await file.text();
  const data = JSON.parse(text);
  const names = new Set(trophies.map((t) => t.name));
  const earned = (Array.isArray(data.earned) ? data.earned : []).filter((n) => names.has(n));
  const counters = {};
  if (data.counters && typeof data.counters === 'object') {
    for (const t of trophies) {
      if (t.target != null && Number.isFinite(Number(data.counters[t.id]))) {
        counters[t.id] = Math.max(0, Math.min(Number(data.counters[t.id]), t.target));
      }
    }
  }
  return { earned, counters };
}

export function resetProgress() {
  localStorage.removeItem(STORE_KEY);
}
