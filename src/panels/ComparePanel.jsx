import { useApp } from '../AppContext.js';
import { CATS } from '../lib/categories.js';
import { addMonth, dim, mShort } from '../lib/dates.js';
import { inr } from '../lib/format.js';
import { monthItems, spentUpTo, stats } from '../lib/calc.js';
import { SixMonthChart } from '../components/charts.jsx';
import Empty from './Empty.jsx';

function Kpi({ label, a, b, sub, higherGood }) {
  const d = a - b;
  const pc = b ? Math.round((d / Math.abs(b)) * 100) : 0;
  const good = higherGood ? d >= 0 : d <= 0;
  const cls = Math.abs(d) < 50 ? 'flat' : good ? 'down' : 'up';
  return (
    <div className="st">
      <span>{label}</span>
      <b className="num">{inr(a)}</b>
      <small className="num">{sub} <span className={'delta ' + cls}>{d >= 0 ? '+' : '−'}{Math.abs(pc)}%</span></small>
    </div>
  );
}

const catTotal = (items, c, upTo) => items.reduce((x, i) => x + (i.t === 'e' && i.c === c && (upTo == null || +i.d.slice(8) <= upTo) ? i.a : 0), 0);

export default function ComparePanel() {
  const { data, month: k, setMonth } = useApp();
  const pk = addMonth(k, -1);
  const s = stats(data, k);
  if (!s.hasData) return <Empty title="Data nahi hai">Is mahine ka record nahi hai.</Empty>;

  const prevOk = pk >= data.settings.startMonth;
  let body;
  if (!prevOk) {
    body = <div className="note">Pichle mahine ka data nahi hai. Agle mahine se comparison yahan dikhega.</div>;
  } else {
    const ps = stats(data, pk);
    const thisItems = monthItems(data, k);
    const prevItems = monthItems(data, pk);
    let kpis;
    let thisCat;
    let prevCat;
    let thisLbl;
    let prevLbl;
    if (s.isCur) {
      const day = s.dayNow;
      const pd = Math.min(day, dim(pk));
      const a = spentUpTo(data, k, day);
      const b = spentUpTo(data, pk, pd);
      kpis = (
        <>
          <Kpi label={`1–${day} ${mShort(k)} tak`} a={a} b={b} sub={`vs 1–${pd} ${mShort(pk)}: ${inr(b)}`} />
          <Kpi label="Month-end anumaan" a={s.projected} b={ps.spent} sub={`vs ${mShort(pk)} total: ${inr(ps.spent)}`} />
        </>
      );
      thisCat = (c) => catTotal(thisItems, c);
      prevCat = (c) => catTotal(prevItems, c, day);
      thisLbl = mShort(k) + ' (ab tak)';
      prevLbl = mShort(pk) + ' (same date tak)';
    } else {
      kpis = (
        <>
          <Kpi label={mShort(k) + ' ka kharcha'} a={s.spent} b={ps.spent} sub={`vs ${mShort(pk)}: ${inr(ps.spent)}`} />
          <Kpi label={mShort(k) + ' ki bachat'} a={s.saved} b={ps.saved} sub={`vs ${mShort(pk)}: ${inr(ps.saved)}`} higherGood />
        </>
      );
      thisCat = (c) => s.byCat[c];
      prevCat = (c) => ps.byCat[c];
      thisLbl = mShort(k);
      prevLbl = mShort(pk);
    }
    const rows = CATS.map((c) => ({ c, a: thisCat(c.id), b: prevCat(c.id) }))
      .filter((r) => r.a || r.b)
      .sort((x, y) => Math.max(y.a, y.b) - Math.max(x.a, x.b));
    const mx = Math.max(1, ...rows.map((r) => Math.max(r.a, r.b)));
    body = (
      <>
        <div className="kpis">{kpis}</div>
        <div className="legend">
          <span><i style={{ background: 'var(--ink2)' }}></i>{thisLbl} (category ka rang)</span>
          <span><i style={{ background: '#C9CFC8' }}></i>{prevLbl}</span>
        </div>
        <div className="cmp">
          {rows.map((r) => {
            const d = r.a - r.b;
            const pc = r.b ? Math.round((d / r.b) * 100) : null;
            const flat = Math.abs(d) < 50;
            const cls = flat ? 'flat' : d > 0 ? 'up' : 'down';
            const txt = flat ? 'Same' : (d > 0 ? '↑ ' : '↓ ') + inr(Math.abs(d)) + (pc !== null && Math.abs(pc) < 1000 ? ' (' + Math.abs(pc) + '%)' : '');
            return (
              <div className="cmp-row" key={r.c.id} style={{ '--cc': r.c.c }}>
                <div className="nm"><i></i>{r.c.n}</div>
                <div className="vals num"><b>{inr(r.a)}</b> · {inr(r.b)} <span className={'delta ' + cls}>{txt}</span></div>
                <div className="bars">
                  <div style={{ width: (r.a / mx) * 100 + '%', background: r.c.c }}></div>
                  <div style={{ width: (r.b / mx) * 100 + '%', background: '#C9CFC8' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="panel-head"><h3>Mahine ka comparison</h3><p className="sub">{mShort(k)} vs {mShort(pk)}</p></div>
      {body}
      <SixMonthChart data={data} month={k} onPickMonth={setMonth} />
      <p className="sub">Kisi bhi mahine ke bar pe tap karo, building us mahine ki dikhegi.</p>
    </>
  );
}
