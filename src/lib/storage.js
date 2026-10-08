const LS = 'paisaMahal.v1';
const LSC = 'paisaMahal.char';
const LST = 'paisaMahal.time';
const LSH = 'paisaMahal.hint3d';

// localStorage can throw (private mode, blocked site data), so every access is guarded.
const get = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const set = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* storage unavailable: the app keeps working in memory */
  }
};

export const lsChar = () => get(LSC) || null;
export const saveLsChar = (c) => set(LSC, c);
export const timeMode = () => get(LST) || 'auto';
export const saveTimeMode = (m) => set(LST, m);

export function lsSave(data) {
  set(LS, JSON.stringify({ settings: data.settings, months: data.months, loans: data.loans }));
}
export function lsLoad() {
  try {
    const s = JSON.parse(get(LS) || 'null');
    if (s && s.settings && s.settings.started) return s;
  } catch {
    /* corrupt payload: fall through to demo data */
  }
  return null;
}
export function lsClear() {
  try {
    localStorage.removeItem(LS);
  } catch {
    /* nothing to clear */
  }
}

/** True the first time it is called on this browser. */
export function takeHint3d() {
  if (get(LSH)) return false;
  set(LSH, '1');
  return true;
}
