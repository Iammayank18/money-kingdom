import { CUR, addMonth, mName } from './dates.js';
import { inr } from './format.js';
import { stats, savingsOutlook } from './calc.js';
import { leftOf, loanSum, paidOf } from './loans.js';

const R = (op, l, v, cls) => ({ op, l, v, cls });

/** "Kaise calculate hua" breakdowns for the (i) buttons. Returns null for an unknown key. */
export function explain(key, data, month) {
  const s = stats(data, month);
  const st = data.settings;
  const mn = mName(month, { month: 'long' });
  const budgetRows = [R('', 'Monthly income', inr(st.income))]
    .concat(s.extraInc ? [R('+', 'Is mahine extra income', inr(s.extraInc))] : [])
    .concat([R('−', 'Bachat goal', inr(st.goal)), R('=', 'Budget', inr(s.budget), 'tot')]);
  const daysLeft = s.D - s.dayNow + 1;
  switch (key) {
    case 'spent':
      return {
        t: 'Kharcha',
        f: 'Is mahine ab tak jitne bhi kharche hue, unka total.',
        rows: [R('', 'Tumhari entries', inr(s.spent - s.auto)), R('+', 'Auto entries (rent, bills jo aa chuke)', inr(s.auto)), R('=', 'Kharcha', inr(s.spent), 'tot')],
        n: 'Income entries aur udhaar isme nahi gine jaate.',
      };
    case 'left':
      return {
        t: 'Bacha budget',
        f: 'Budget − Ab tak ka kharcha',
        rows: budgetRows.concat([R('−', 'Ab tak ka kharcha', inr(s.spent)), R('=', 'Bacha budget', inr(s.budget - s.spent), 'tot')]),
        n: 'Budget = income − bachat goal. Yaani bachat goal pehle hi alag rakh diya, jo bacha woh kharch karne ke liye hai. Neeche "' + (s.budget - s.spent < 0 ? 'budget se upar' : Math.round(((s.budget - s.spent) / s.budget) * 100) + '% bacha') + '" isi ka hissa hai.',
      };
    case 'daily': {
      if (!s.isCur) {
        return {
          t: 'Bachat',
          f: 'Income − Poore mahine ka kharcha',
          rows: [R('', 'Income', inr(s.income)), R('−', 'Kharcha', inr(s.spent)), R('=', 'Bachat', inr(s.saved), 'tot')],
          n: 'Goal ' + inr(st.goal) + ' tha.',
        };
      }
      const room = s.budget - s.spent - s.pending;
      return {
        t: 'Roz ka limit',
        f: '(Budget − Kharcha − Aane wale bills) ÷ Baaki din',
        rows: [
          R('', 'Budget', inr(s.budget)),
          R('−', 'Ab tak ka kharcha', inr(s.spent)),
          R('−', 'Aane wale fixed bills', inr(s.pending)),
          R('=', 'Kharch karne ko bacha', inr(room)),
          R('÷', 'Baaki din (aaj samet)', daysLeft + ' din'),
          R('=', 'Roz ka limit', room > 0 ? inr(room / daysLeft) : '₹0', 'tot'),
        ],
        n: 'Aane wale bills woh "har mahine wale kharche" hain jinki date abhi aani hai. Unka paisa pehle hi alag rakha gaya hai.',
      };
    }
    case 'proj': {
      if (!s.isCur) {
        return {
          t: 'Final kharcha',
          f: 'Mahina khatam ho chuka, toh yeh asli total hai.',
          rows: [R('', 'Poore ' + mn + ' ka kharcha', inr(s.spent), 'tot'), R('', 'Budget', inr(s.budget))],
          n: '',
        };
      }
      const rest = s.D - s.dayNow;
      return {
        t: 'Month-end anumaan',
        f: 'Ab tak ka kharcha + Aane wale bills + Baaki dino ka andaza',
        rows: [
          R('', 'Ab tak ka kharcha', inr(s.spent)),
          R('+', 'Aane wale fixed bills', inr(s.pending)),
          R('+', 'Baaki ' + rest + ' din × ' + inr(s.pace) + '/din', inr(s.pace * rest)),
          R('=', 'Month-end anumaan', inr(s.projected), 'tot'),
        ],
        n:
          inr(s.pace) + '/din roz ki speed hai: is mahine ke tumhare roz ke kharche' +
          (s.big ? ' (bade one-time kharche ' + inr(s.big) + ' hata ke, kyunki woh roz nahi hote)' : '') + ', ' +
          (s.prevSrc === 'prev' ? 'pichle mahine ki speed ke saath' : 'tumhare budget ki speed ke saath') +
          ' mila ke. Mahine ki shuruaat mein ek-do din ka kharcha poora andaza na bigaad de, isliye.',
      };
    }
    case 'health': {
      const r = s.isCur ? s.projected : s.spent;
      const ratio = r / s.budget;
      return {
        t: 'Health score',
        f: 'Month-end ' + (s.isCur ? 'anumaan' : 'kharcha') + ' budget ka kitna % hai, us se',
        rows: [
          R('', s.isCur ? 'Month-end anumaan' : 'Final kharcha', inr(r)),
          R('÷', 'Budget', inr(s.budget)),
          R('=', 'Budget ka', Math.round(ratio * 100) + '%'),
          R('→', 'Health', Math.round(s.health * 100) + '/100', 'tot'),
        ],
        n: 'Scale: budget ka 70% ya kam = 100 · 100% (budget barabar) = 50 · 130% ya zyada = 0. Beech mein seedhi line. 80+ Mazboot, 55+ Theek, 30+ Daraarein, us se neeche building girti hai.',
      };
    }
    case 'loan': {
      const L = data.loans.filter((l) => !l.closed && l.dir === 'diya');
      const sm = loanSum(data.loans);
      return {
        t: 'Udhaar aana hai',
        f: 'Har khule udhaar mein: diya − wapas aaya',
        rows: L.slice(0, 5)
          .map((l) => R('+', l.who + ' (' + inr(l.a) + (paidOf(l) ? ' − ' + inr(paidOf(l)) : '') + ')', inr(leftOf(l))))
          .concat(L.length > 5 ? [R('+', L.length - 5 + ' aur', inr(L.slice(5).reduce((a, l) => a + leftOf(l), 0)))] : [])
          .concat([R('=', 'Lena hai', inr(sm.recv), 'tot')]),
        n: 'Udhaar kharcha nahi hai, toh health aur budget pe asar nahi. ' + (sm.give > 0 ? 'Tumhe ' + inr(sm.give) + ' dena bhi hai. ' : '') + 'Poori list Udhaar tab mein.',
      };
    }
    case 'save12': {
      const { cs, avg } = savingsOutlook(data);
      return {
        t: '12 mahine mein bachat',
        f: 'Is mahine ki anumaanit bachat + 11 × Har mahine ka average',
        rows: [
          R('', 'Is mahine (income − anumaan)', inr(cs.projSaved)),
          R('+', '11 × ' + inr(avg), inr(avg * 11)),
          R('=', '12 mahine mein', inr(cs.projSaved + avg * 11), 'tot'),
          R('', 'Goal (12 × ' + inr(st.goal) + ')', inr(st.goal * 12)),
        ],
        n: 'Udhaar wapas aane wala paisa isme nahi joda gaya.',
      };
    }
    case 'avg': {
      const rows = [];
      let tot = 0;
      let n = 0;
      for (let i = 1; i <= 3; i++) {
        const k = addMonth(CUR, -i);
        if (k >= st.startMonth) {
          const x = stats(data, k);
          rows.push(R(n ? '+' : '', mName(k, { month: 'short', year: 'numeric' }) + ' ki bachat', inr(x.saved)));
          tot += x.saved;
          n++;
        }
      }
      if (!n) {
        const cs = stats(data, CUR);
        return {
          t: 'Har mahine ka average',
          f: 'Abhi pichle mahine ka data nahi, toh is mahine ki anumaanit bachat li hai.',
          rows: [R('', 'Income', inr(cs.income)), R('−', 'Month-end anumaan', inr(cs.projected)), R('=', 'Average', inr(cs.projSaved), 'tot')],
          n: 'Ek-do mahine ka data aate hi asli average dikhega.',
        };
      }
      return {
        t: 'Har mahine ka average',
        f: 'Pichle ' + n + ' mahine ki bachat ka average',
        rows: rows.concat([R('÷', 'Mahine', n + ''), R('=', 'Average', inr(tot / n), 'tot')]),
        n: 'Bachat = us mahine ki income − kharcha.',
      };
    }
    default:
      return null;
  }
}
