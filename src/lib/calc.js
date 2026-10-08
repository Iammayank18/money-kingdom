import { CUR, NOW, addMonth, dim, pad } from './dates.js';
import { CATS, CAT } from './categories.js';
import { clamp, inr } from './format.js';

/** Month entries plus the recurring items that have already fallen due ("auto"). */
export function monthItems(data, k) {
  const out = (data.months[k] || []).slice();
  const st = data.settings;
  if (k >= st.startMonth && k <= CUR) {
    const D = dim(k);
    const last = k === CUR ? NOW.getDate() : D;
    st.recurring.forEach((r) => {
      const d = Math.min(r.day, D);
      if (d <= last) out.push({ id: 'r_' + r.id, d: k + '-' + pad(d), a: r.a, c: r.c, n: r.n, t: 'e', auto: true });
    });
  }
  return out;
}

const varSpentOf = (data, k) => (data.months[k] || []).reduce((s, i) => s + (i.t === 'e' ? i.a : 0), 0);

/** Everything the UI shows for a month. `wi` is an optional what-if map of category -> % change. */
export function stats(data, k, wi) {
  const st = data.settings;
  const items = monthItems(data, k);
  const D = dim(k);
  const isCur = k === CUR;
  const dayNow = isCur ? NOW.getDate() : D;
  const byCat = {};
  const varByCat = {};
  const pendByCat = {};
  CATS.forEach((c) => {
    byCat[c.id] = 0;
    varByCat[c.id] = 0;
    pendByCat[c.id] = 0;
  });
  let spent = 0;
  let extraInc = 0;
  let auto = 0;
  items.forEach((i) => {
    if (i.t === 'i') {
      extraInc += i.a;
      return;
    }
    const c = CAT[i.c] ? i.c : 'other';
    spent += i.a;
    byCat[c] += i.a;
    if (i.auto) auto += i.a;
    else varByCat[c] += i.a;
  });
  const income = st.income + extraInc;
  const budget = Math.max(1, income - st.goal);
  const varSpent = spent - auto;
  let pending = 0;
  let projVar = varSpent;
  let pace = varSpent / Math.max(1, dayNow);
  let big = 0;
  let prevDaily = null;
  let prevSrc = '';
  if (isCur && k >= st.startMonth) {
    st.recurring.forEach((r) => {
      if (Math.min(r.day, D) > dayNow) {
        pending += r.a;
        pendByCat[CAT[r.c] ? r.c : 'other'] += r.a;
      }
    });
    const pk = addMonth(k, -1);
    if (pk >= st.startMonth) {
      const pv = varSpentOf(data, pk);
      if (pv > 0) {
        prevDaily = pv / dim(pk);
        prevSrc = 'prev';
      }
    }
    // one-off big purchases (over 15% of budget) count once, they don't set the daily pace
    const bigCut = budget * 0.15;
    items.forEach((i) => {
      if (i.t === 'e' && !i.auto && i.a > bigCut) big += i.a;
    });
    if (prevDaily == null) {
      const recTot = st.recurring.reduce((a, r) => a + r.a, 0);
      prevDaily = Math.max(0, budget - recTot) / D;
      prevSrc = 'budget';
    }
    const K = 4;
    pace = (varSpent - big + prevDaily * K) / (dayNow + K);
    projVar = varSpent + pace * (D - dayNow);
  }
  const projByCat = {};
  const projVarByCat = {};
  const scale = varSpent > 0 ? projVar / varSpent : 0;
  const varCats = CATS.filter((c) => c.id !== 'rent' && c.id !== 'bills');
  const vb = varCats.reduce((s, c) => s + (st.budgets[c.id] || 0), 0) || 1;
  CATS.forEach((c) => {
    const v = varSpent > 0 ? varByCat[c.id] * scale : varCats.includes(c) ? (projVar * (st.budgets[c.id] || 0)) / vb : 0;
    projVarByCat[c.id] = v;
    projByCat[c.id] = byCat[c.id] - varByCat[c.id] + v + pendByCat[c.id];
  });
  let projected = spent + pending + (projVar - varSpent);
  if (wi) {
    let d = 0;
    CATS.forEach((c) => {
      d += (projVarByCat[c.id] * (wi[c.id] || 0)) / 100;
    });
    projected += d;
  }
  const health = clamp((1.3 - projected / budget) / 0.6);
  return {
    k, items, spent, income, budget, projected, byCat, projByCat, projVarByCat, varByCat, health,
    dayNow, D, isCur, pending, pace, extraInc, auto, varSpent, big, prevDaily, prevSrc,
    saved: income - spent, projSaved: income - projected, hasData: k >= st.startMonth,
  };
}

export const spentUpTo = (data, k, day) =>
  monthItems(data, k).reduce((s, i) => s + (i.t === 'e' && +i.d.slice(8) <= day ? i.a : 0), 0);

export function tier(h) {
  if (h > 0.8) return { t: 'Mazboot', c: 'var(--good)' };
  if (h > 0.55) return { t: 'Theek hai', c: 'var(--ok)' };
  if (h > 0.3) return { t: 'Daraarein aa rahi', c: 'var(--warn)' };
  return { t: 'Building gir rahi!', c: 'var(--bad)' };
}

/** The category furthest over its budget (projected), or undefined. */
export function topOver(data, s) {
  const b = data.settings.budgets;
  return CATS.map((c) => ({ c, r: s.projByCat[c.id] / Math.max(1, b[c.id] || 0), v: s.projByCat[c.id] }))
    .filter((x) => x.r > 1.05 && x.v > 300 && (b[x.c.id] || 0) > 0)
    .sort((a, b2) => b2.r - a.r)[0];
}

export function babuLine(data, s) {
  const h = s.health;
  const o = topOver(data, s);
  const goal = data.settings.goal;
  if (!s.isCur) {
    if (s.saved >= goal) return 'Is mahine ' + inr(s.saved) + ' bache. Goal poora, party toh banti hai!';
    if (s.saved > 0) return 'Is mahine sirf ' + inr(s.saved) + ' bache. Goal ' + inr(goal) + ' tha. Agla mahina better!';
    return 'Is mahine ' + inr(-s.saved) + ' zyada kharch ho gaya. Building ab tak hil rahi hai.';
  }
  if (h > 0.8) return s.k.charCodeAt(6) % 2 ? 'Sab set hai! Aaj chai meri taraf se.' : 'Building mazboot, jeb bhari. Aise hi chalao!';
  if (h > 0.55) return o ? 'Theek chal raha hai, bas ' + o.c.n + ' pe nazar rakhna.' : 'Theek chal raha hai. Thoda aur bachao toh suit wapas aa jaayega.';
  if (h > 0.3) return o ? o.c.n + ' budget ka ' + Math.round(o.r * 100) + '% ho jaayega. Deewar mein daraar aa gayi!' : 'Bhai, thoda haath rok. Daraarein dikh rahi hain.';
  return o ? 'Jeb khaali! ' + o.c.n + ' ne building hila di. Ab ghar ka khaana.' : 'Jeb khaali, building tedhi. Ab sirf zaroori kharcha!';
}

/** Average saving of the last 3 months with data (falls back to this month's projection). */
export function savingsOutlook(data) {
  const past = [];
  for (let i = 1; i <= 3; i++) {
    const k = addMonth(CUR, -i);
    if (k >= data.settings.startMonth) past.push(stats(data, k).saved);
  }
  const cs = stats(data, CUR);
  const avg = past.length ? past.reduce((a, b) => a + b, 0) / past.length : cs.projSaved;
  const series = [];
  let cum = 0;
  for (let i = 0; i < 12; i++) {
    cum += i === 0 ? cs.projSaved : avg;
    series.push(cum);
  }
  return { past, cs, avg, series };
}
