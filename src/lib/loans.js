import { CUR, TODAY, addMonth, dayDiff, dayMonth } from './dates.js';
import { uid } from './format.js';

export const paidOf = (l) => (l.paid || []).reduce((s, p) => s + p.a, 0);
export const leftOf = (l) => Math.max(0, l.a - paidOf(l));

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Normalise a loan coming from a backup file. */
export function cleanLoan(l) {
  return {
    id: String(l.id || uid()),
    dir: l.dir === 'liya' ? 'liya' : 'diya',
    who: String(l.who).slice(0, 40),
    a: Math.round(l.a),
    d: DATE_RE.test(l.d) ? l.d : TODAY,
    due: DATE_RE.test(l.due) ? l.due : '',
    n: String(l.n || '').slice(0, 60),
    paid: Array.isArray(l.paid) ? l.paid.filter((p) => p && typeof p.a === 'number').map((p) => ({ d: p.d || TODAY, a: Math.round(p.a) })) : [],
    closed: !!l.closed,
  };
}

export function loanSum(loans) {
  const L = loans.filter((l) => !l.closed);
  const nm = addMonth(CUR, 1) + '-31';
  const recvL = L.filter((l) => l.dir === 'diya');
  const giveL = L.filter((l) => l.dir === 'liya');
  const sum = (arr) => arr.reduce((s, l) => s + leftOf(l), 0);
  return {
    recv: sum(recvL),
    give: sum(giveL),
    recvN: recvL.length,
    nextMonth: sum(recvL.filter((l) => l.due && l.due <= nm)),
    late: recvL.filter((l) => l.due && l.due < TODAY).length,
    lateGive: giveL.filter((l) => l.due && l.due < TODAY).length,
  };
}

/** Label + style kind ('up' | 'down' | 'flat' | 'warn') for a loan's due date. */
export function dueChip(l) {
  if (l.closed) return { kind: 'down', text: 'Hisaab barabar' };
  if (!l.due) return { kind: 'flat', text: 'Date tay nahi' };
  const n = dayDiff(TODAY, l.due);
  if (n < 0) return { kind: 'up', text: -n + ' din late' };
  if (n === 0) return { kind: 'warn', text: 'Aaj ' + (l.dir === 'diya' ? 'aana' : 'dena') + ' hai' };
  return { kind: 'flat', text: n <= 30 ? n + ' din mein' : dayMonth(l.due) + ' tak' };
}
