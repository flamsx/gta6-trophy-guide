// Filters: search text, grade, kind (incl. missable watch), earned state, and the spoiler rule.
// Spoiler guard: when on, story trophies not yet earned hide their name and description.
export const filters = {
  search: '',
  grade: 'all',
  kind: 'all',
  earned: 'all',
  spoiler: true,
  showHidden: true,
};

export function spoilerHides(trophy, isEarned) {
  if (!filters.spoiler) return false;
  if (isEarned) return false;
  return trophy.kind === 'story';
}

export function trophyMatches(trophy, isEarned) {
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.kind === 'missable' && trophy.missable !== 'watch') return false;
  if (filters.kind !== 'all' && filters.kind !== 'missable' && trophy.kind !== filters.kind) return false;
  if (filters.earned === 'earned' && !isEarned) return false;
  if (filters.earned === 'unearned' && isEarned) return false;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function displayName(trophy, isEarned) {
  if (spoilerHides(trophy, isEarned)) return 'Hidden story trophy — earn it to reveal';
  if (trophy.hidden && !filters.showHidden && !isEarned) return 'Hidden trophy — earn it to reveal';
  return trophy.name;
}

export function displayDescription(trophy, isEarned) {
  if (spoilerHides(trophy, isEarned)) return 'Spoiler guard is on: the name and description stay hidden until this story trophy is earned.';
  if (trophy.hidden && !filters.showHidden && !isEarned) return 'Hidden on PlayStation until earned.';
  return trophy.description;
}
