import { useApp } from '../AppContext.js';
import { CAT, CATS } from '../lib/categories.js';
import { CUR, NOW, TODAY, mShort, ymd } from '../lib/dates.js';
import { inr } from '../lib/format.js';
import { monthItems } from '../lib/calc.js';
import Empty from './Empty.jsx';

const sum = (arr) => arr.reduce((s, i) => s + i.a, 0);

export default function EntriesPanel() {
  const { data, mode, month, filter, setFilter, apply, toast } = useApp();
  const items = monthItems(data, month).sort((a, b) => b.d.localeCompare(a.d) || (a.auto ? 1 : 0) - (b.auto ? 1 : 0));
  const exp = items.filter((i) => i.t === 'e');
  const inc = items.filter((i) => i.t === 'i');
  const present = CATS.filter((c) => exp.some((i) => i.c === c.id));
  const f = filter !== 'all' && filter !== 'inc' && !present.some((c) => c.id === filter) ? 'all' : filter;
  const shown = items.filter((i) => f === 'all' || (f === 'inc' ? i.t === 'i' : i.t === 'e' && i.c === f));

  const remove = (i) => {
    if (mode === 'demo') {
      toast('Example data hai. Apna data shuru karke entries manage karo.');
      return;
    }
    const mk = month;
    apply({ type: 'removeTx', mk, id: i.id });
    toast('Entry hata di: ' + inr(i.a), () => apply({ type: 'addTx', mk, item: i }));
  };

  const head = (
    <div className="panel-head">
      <h3>{mShort(month)} ki entries</h3>
      <p className="sub num">
        {exp.length} kharche · {inr(sum(exp))}
        {inc.length ? ' · income ' + inr(sum(inc)) : ''}
      </p>
    </div>
  );

  const chips = items.length > 0 && (
    <div className="filters" role="group" aria-label="Filter">
      <button className="chip" aria-pressed={f === 'all'} onClick={() => setFilter('all')}>Sab</button>
      {present.map((c) => (
        <button key={c.id} className="chip" style={{ '--cc': c.c }} aria-pressed={f === c.id} onClick={() => setFilter(c.id)}>
          <i></i>{c.n}
        </button>
      ))}
      {inc.length > 0 && (
        <button className="chip" style={{ '--cc': 'var(--good)' }} aria-pressed={f === 'inc'} onClick={() => setFilter('inc')}>
          <i></i>Income
        </button>
      )}
    </div>
  );

  if (!shown.length) {
    return (
      <>
        {head}
        {chips}
        <Empty title="Abhi koi entry nahi">
          {month === CUR ? 'Upar se pehla kharcha add karo. Babu wait kar raha hai.' : 'Is mahine ka koi record nahi hai.'}
        </Empty>
      </>
    );
  }

  const days = {};
  shown.forEach((i) => (days[i.d] = days[i.d] || []).push(i));
  const yest = ymd(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 1));

  return (
    <>
      {head}
      {chips}
      {Object.keys(days).sort().reverse().map((d) => {
        const list = days[d];
        const tot = list.reduce((s, i) => s + (i.t === 'e' ? i.a : 0), 0);
        const [y, m, dd] = d.split('-').map(Number);
        const lbl = d === TODAY ? 'Aaj' : d === yest ? 'Kal' : new Date(y, m - 1, dd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });
        return (
          <div className="day" key={d}>
            <div className="day-h"><span>{lbl}</span><span className="num">{tot ? inr(tot) : ''}</span></div>
            {list.map((i) => {
              const c = i.t === 'i' ? { n: 'Income', c: 'var(--good)' } : CAT[i.c] || CAT.other;
              const name = i.n || c.n;
              return (
                <div className="tx" key={i.id}>
                  <div className="ic" style={{ '--cc': c.c }}>{name.trim().charAt(0).toUpperCase() || '₹'}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="t">{name}</div>
                    <div className="s">{c.n}{i.auto && <span className="tag">auto</span>}</div>
                  </div>
                  <div className={'a num' + (i.t === 'i' ? ' in' : '')}>{i.t === 'i' ? '+' : ''}{inr(i.a)}</div>
                  {i.auto ? <span></span> : <button className="del" aria-label={'Entry hatao: ' + name + ' ' + inr(i.a)} onClick={() => remove(i)}>×</button>}
                </div>
              );
            })}
          </div>
        );
      })}
      {items.some((i) => i.auto) && <p className="sub">"auto" wale har mahine apne aap judte hain. Inhe Setup tab mein badlo.</p>}
    </>
  );
}
