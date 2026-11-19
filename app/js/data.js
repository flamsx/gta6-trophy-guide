// Trophy data: loads app/data/trophies.json and exposes the list plus roadmap stages.
export const STAGES = [
  { n: 1, title: 'Story — the Leonida campaign', blurb: 'Play the story through Chapters 1–4 and the final mission. All 12 story trophies here are unmissable: finish the campaign and they fall.' },
  { n: 2, title: 'Contacts & strangers', blurb: 'Five contact chains (Andy, Kenton, Billy, Randy, Tyrone) plus the stranger strands and Bret’s hunt. Clear contact missions as they appear, while the story still carries you around Leonida.' },
  { n: 3, title: 'Activities sampler', blurb: 'Try every activity once: nine types, a drone race at each spot, 20 different race wins, one fishing win over Cal and one arcade game.' },
  { n: 4, title: 'Combat & skill', blurb: 'Stunts, the shooting range, robberies and wanted-level play. The skill trophies live here — gold all 42 range challenges, 250 stunts, five vaults, one robbery per gang.' },
  { n: 5, title: 'Collectibles & the open world', blurb: 'Cards, WAiNK It spots, vehicles, garages, the 52 areas of Leonida — and the meditation spots, the one missable watch. Explore deliberately and collect as you go.' },
  { n: 6, title: 'Money & long grinds', blurb: 'Launder $250,000 of marked bills, spend $100,000 in shops, finish 50 challenges, and let the long counters (500 choices) close out. Save these for last.' },
  { n: 7, title: '100% & the platinum', blurb: 'A Long Road (100% completion) is the last gate. When it pops, the platinum — Vice Got a Price! — follows at once.' },
];

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export async function loadTrophies() {
  const res = await fetch('data/trophies.json');
  const doc = await res.json();
  return doc.trophies;
}

export function trophyById(trophies, id) {
  return trophies.find((t) => t.id === id) || null;
}

export function stageTrophies(trophies, stage) {
  return trophies.filter((t) => t.stage === stage).sort((a, b) => a.id - b.id);
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function isCounter(t) {
  return typeof t.target === 'number' && t.target > 1;
}
