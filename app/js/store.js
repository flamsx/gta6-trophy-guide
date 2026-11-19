// Progress store: earned ticks, PSN-target counters and per-trophy notes in localStorage,
// plus export / import of the whole progress file.
const KEY = 'leonida55-progress-v1';

function blank() {
  return { earned: [], counters: {}, notes: {}, spoiler: true, theme: 'night' };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    return { ...blank(), ...parsed };
  } catch {
    return blank();
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export const store = {
  state: read(),
  save() { write(this.state); },
  isEarned(id) { return this.state.earned.includes(id); },
  toggleEarned(id) {
    const i = this.state.earned.indexOf(id);
    if (i >= 0) this.state.earned.splice(i, 1);
    else this.state.earned.push(id);
    this.save();
  },
  setEarned(id, on) {
    const has = this.state.earned.includes(id);
    if (on && !has) this.state.earned.push(id);
    if (!on && has) this.state.earned.splice(this.state.earned.indexOf(id), 1);
    this.save();
  },
  counter(id) { return this.state.counters[id] || 0; },
  setCounter(id, value) {
    this.state.counters[id] = Math.max(0, value | 0);
    this.save();
  },
  note(id) { return this.state.notes[id] || ''; },
  setNote(id, text) {
    if (text) this.state.notes[id] = text;
    else delete this.state.notes[id];
    this.save();
  },
  exportFile() {
    const blob = new Blob([JSON.stringify(this.state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida55-progress.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  async importFile(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    this.state = { ...blank(), ...parsed };
    this.save();
  },
};
