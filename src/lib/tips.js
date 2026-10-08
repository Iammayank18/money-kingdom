import { CUR, TODAY, dayDiff } from './dates.js';
import { inr } from './format.js';
import { stats, topOver } from './calc.js';
import { leftOf } from './loans.js';

/** Things the character says when tapped, in rotation. */
export function charTips(data) {
  const s = stats(data, CUR);
  const st = data.settings;
  const out = [];
  const o = topOver(data, s);
  const daysLeft = s.D - s.dayNow + 1;
  if (o) {
    const extra = s.projByCat[o.c.id] - (st.budgets[o.c.id] || 0);
    out.push(o.c.n + ' is pace pe budget ka ' + Math.round(o.r * 100) + '% jaayega. Roz ' + inr(Math.ceil(extra / daysLeft)) + ' kam karo toh bach jaayega.');
  }
  const daily = (s.budget - s.spent - s.pending) / daysLeft;
  out.push(daily > 0 ? 'Aaj ' + inr(daily) + ' tak kharch karo, mahina safe rahega.' : 'Budget khatam! Ab sirf zaroori kharcha, warna building aur hilegi.');
  const late = data.loans.filter((l) => !l.closed && l.dir === 'diya' && l.due && l.due < TODAY).sort((a, b) => a.due.localeCompare(b.due))[0];
  if (late) out.push(late.who + ' ka ' + inr(leftOf(late)) + ' ' + dayDiff(late.due, TODAY) + ' din se late hai. Udhaar tab se yaad dila do.');
  const up = st.recurring.filter((r) => r.day > s.dayNow && r.day - s.dayNow <= 5).sort((a, b) => a.day - b.day)[0];
  if (up) out.push(up.n + ' ka ' + inr(up.a) + ' ' + up.day + ' tareekh ko katega. Paise ready rakhna.');
  out.push('Is pace pe mahine ke end mein ' + inr(s.projSaved) + ' bachega' + (s.projSaved >= st.goal ? ', goal poora!' : ', goal se ' + inr(st.goal - s.projSaved) + ' kam.'));
  out.push('Mujhe tap karte raho, par kharcha mat karte raho!');
  return out;
}
