// Leonida 55 — trophy data helpers: grades, kinds, roadmap stages, progress math, Next up planner.
// Every fact here comes from the official trophy list in data/trophies.json (names, descriptions,
// grades, PSN targets) and from the official descriptions alone; nothing is invented.

export const GRADE_POINTS = { platinum: 0, gold: 90, silver: 30, bronze: 15 };

export const KIND_LABELS = {
  platinum: 'Platinum', story: 'Story', side: 'Side mission', collectible: 'Collectible',
  activity: 'Activity', robbery: 'Robbery', world: 'World', money: 'Money',
};

export const ROADMAP_STAGES = [
  { id: 'story', num: 1, title: 'Play the story', blurb: 'Chapters 1 to 5 and the six named story missions. All 12 trophies here are unmissable; chapter trophies can pop as the next chapter begins. Keep a manual save at the start of every chapter.' },
  { id: 'sides', num: 2, title: 'Side stories & strangers', blurb: 'Five side-character finales (Andy, Kenton, Billy, Randy, Tyrone), the Bret hunting strand, and 8 stranger strands. Andy, Billy and Tyrone do not count toward Strangers & Freaks.' },
  { id: 'collect', num: 3, title: 'Collectibles & exploration', blurb: 'Meditation spots, card sets, WAiNK locations, vehicles and the 52 areas of Leonida. Tag locations and scan vehicles as you travel; both counters climb together.' },
  { id: 'activities', num: 4, title: 'Activities, races & challenges', blurb: 'Stunts, shooting range golds, drone races, races, fishing, arcade, challenges and vehicle registration. The long grinds live here: 250 stunts, 42 range golds, 50 challenges.' },
  { id: 'robbery', num: 5, title: 'Robberies & money', blurb: 'Shops, vaults, armored trucks, jewelry stores, illegal operations and the money trophies. Vaults unlock near the end of Chapter 4; bring your partner.' },
  { id: 'world', num: 6, title: 'World oddities', blurb: 'The hidden moments: the airport departure, the tank, the showroom smash, the cocktail on Ocean Beach, the bowling alley and the two trophies whose triggers the community has not pinned down yet.' },
  { id: 'platinum', num: 7, title: 'The platinum', blurb: 'Vice Got a Price! pops when the other 54 are earned, and A Long Road needs 100% completion. The checklist appears under Progress, Stats, 100% Completion after the story.' },
];

export function gradePoints(trophy) {
  return GRADE_POINTS[trophy.grade] || 0;
}

export function totalPoints(trophies, earnedNames) {
  return trophies.filter((t) => earnedNames.has(t.name)).reduce((n, t) => n + gradePoints(t), 0);
}

export function stageProgress(trophies, stageId, earnedNames) {
  const list = trophies.filter((t) => t.stage === stageId);
  const done = list.filter((t) => earnedNames.has(t.name)).length;
  return { total: list.length, done, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
}

export function counterRatio(trophy, counters) {
  if (trophy.target == null) return null;
  const value = Math.min(counters[trophy.id] || 0, trophy.target);
  return value / trophy.target;
}

// Next up planner: the 7-ace differentiator. Suggests what to do next from current progress:
// 1) the missable watch if not earned, 2) the next story trophy, 3) the three closest counters,
// 4) three quick wins (unearned, single-action, no counter). Each item carries a reason.
export function computeNextUp(trophies, earnedNames, counters) {
  const unearned = trophies.filter((t) => !earnedNames.has(t.name));
  const picks = [];
  const add = (trophy, why) => {
    if (trophy && !picks.some((p) => p.trophy.id === trophy.id)) picks.push({ trophy, why });
  };
  const missable = trophies.find((t) => t.missable === 'watch' && !earnedNames.has(t.name));
  if (missable) add(missable, 'Watch list: the only confirmed missable moment. Do the Chapter 1 balcony meditation before the chapter ends.');
  const nextStory = unearned.filter((t) => t.kind === 'story').sort((a, b) => a.id - b.id)[0];
  if (nextStory) add(nextStory, 'Next story trophy in order. Keep playing the story; it is unmissable.');
  const closest = unearned
    .filter((t) => t.target != null && counterRatio(t, counters) > 0)
    .sort((a, b) => counterRatio(b, counters) - counterRatio(a, counters))
    .slice(0, 3);
  for (const t of closest) {
    const value = Math.min(counters[t.id] || 0, t.target);
    add(t, `Closest counter: ${value} of ${t.target} ${t.targetLabel || ''} done. Finish what you started.`);
  }
  const quick = unearned.filter((t) => t.target == null && (t.kind === 'world' || t.kind === 'activity')).slice(0, 3);
  for (const t of quick) add(t, 'Quick win: a single action, no counter, no grind. Do it while you are nearby.');
  return picks.slice(0, 8);
}

export function formatTarget(trophy) {
  if (trophy.target == null) return null;
  const label = trophy.targetLabel || '';
  return trophy.target >= 1000 ? `${trophy.target.toLocaleString('en-US')} ${label}` : `${trophy.target} ${label}`;
}
