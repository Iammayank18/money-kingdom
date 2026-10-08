import { CAT, CHARS, defaultBudgets } from './categories.js';
import { uid } from './format.js';
import { TODAY } from './dates.js';
import { monthItems } from './calc.js';
import { cleanLoan } from './loans.js';
import { lsChar } from './storage.js';

export const backupText = (data) =>
  JSON.stringify({ app: 'paisa-mahal', v: 2, settings: data.settings, months: data.months, loans: data.loans });

export function cleanSettings(x) {
  const s = { ...x };
  delete s.kind;
  delete s.rev;
  s.budgets = { ...defaultBudgets(), ...(s.budgets || {}) };
  s.recurring = Array.isArray(s.recurring) ? s.recurring : [];
  s.started = true;
  if (!CHARS.some((c) => c.id === s.char)) s.char = lsChar() || 'gullu';
  return s;
}

/** Parse + sanitise a pasted backup. Throws on anything that isn't a valid backup. */
export function parseBackup(text) {
  const x = JSON.parse(text);
  if (!x || !x.settings || typeof x.settings.income !== 'number' || typeof x.months !== 'object') throw new Error('bad backup');
  const months = {};
  Object.keys(x.months).forEach((m) => {
    if (/^\d{4}-\d{2}$/.test(m) && Array.isArray(x.months[m])) {
      months[m] = x.months[m]
        .filter((i) => i && typeof i.a === 'number' && /^\d{4}-\d{2}-\d{2}$/.test(i.d))
        .map((i) => ({
          id: String(i.id || uid()),
          d: i.d,
          a: Math.round(i.a),
          c: CAT[i.c] || i.c === 'inc' ? i.c : 'other',
          n: String(i.n || '').slice(0, 60),
          t: i.t === 'i' ? 'i' : 'e',
        }));
    }
  });
  const loans = Array.isArray(x.loans) ? x.loans.filter((l) => l && typeof l.a === 'number' && l.who).map(cleanLoan) : [];
  return { settings: cleanSettings(x.settings), months, loans };
}

export function csvText(data) {
  const rows = [['date', 'type', 'category', 'note', 'amount']];
  Object.keys(data.months)
    .sort()
    .forEach((m) =>
      monthItems(data, m)
        .sort((a, b) => a.d.localeCompare(b.d))
        .forEach((i) =>
          rows.push([i.d, i.t === 'i' ? 'income' : 'expense', i.t === 'i' ? 'Income' : (CAT[i.c] || CAT.other).n, (i.n || '') + (i.auto ? ' (auto)' : ''), i.a]),
        ),
    );
  const cell = (v) => (/[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v);
  return rows.map((r) => r.map(cell).join(',')).join('\n');
}

export function downloadCsv(data) {
  const url = URL.createObjectURL(new Blob([csvText(data)], { type: 'text/csv' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'paisa-mahal-' + TODAY + '.csv' });
  a.click();
  URL.revokeObjectURL(url);
}
