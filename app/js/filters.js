// Leonida 55 — filters: search, grade, kind, earned state, and the spoiler rule.
// The spoiler rule: when spoilers are off, a hidden trophy that is not earned yet shows
// as "Hidden trophy" with its description masked, and its guide stays locked.

export function createFilterState() {
  return { search: '', grade: 'all', kind: 'all', earned: 'all' };
}

export function isSpoilerMasked(trophy, state) {
  return state.spoiler && trophy.hidden && !state.earned.has(trophy.name);
}

export function applyFilters(trophies, filters, state) {
  const q = filters.search.trim().toLowerCase();
  return trophies.filter((t) => {
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.earned === 'earned' && !state.earned.has(t.name)) return false;
    if (filters.earned === 'unearned' && state.earned.has(t.name)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function maskedName(trophy, state) {
  return isSpoilerMasked(trophy, state) ? 'Hidden trophy' : trophy.name;
}

export function maskedDescription(trophy, state) {
  return isSpoilerMasked(trophy, state) ? 'Hidden until earned — turn spoilers on to reveal it.' : trophy.description;
}
