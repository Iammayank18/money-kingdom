import { useApp } from '../AppContext.js';
import { CATS } from '../lib/categories.js';
import { inr } from '../lib/format.js';
import { stats } from '../lib/calc.js';
import Empty from './Empty.jsx';

export default function WhatIfPanel() {
  const { data, month, wi, setWi } = useApp();
  const s = stats(data, month);
  if (!s.hasData) return <Empty title="Data nahi hai">Is mahine ka record nahi hai.</Empty>;
  const w = stats(data, month, wi);
  const d = s.projected - w.projected;
  const cats = CATS.filter((c) => c.id !== 'rent' && s.projVarByCat[c.id] > 0);

  return (
    <>
      <div className="panel-head">
        <h3>What-if</h3>
        <button className="btn sm soft" onClick={() => setWi({})}>Reset</button>
      </div>
      <p className="sub">Category ka kharcha kam ya zyada karke dekho. Building aur Babu turant badlenge. Rent aur fixed bills isme nahi hain.</p>
      <div className="wi">
        {!cats.length && <Empty title="Abhi kuch nahi">Kuch kharche add karo, fir yahan khelo.</Empty>}
        {cats.map((c) => {
          const v = wi[c.id] || 0;
          const amt = (s.projVarByCat[c.id] * v) / 100;
          return (
            <div className="wi-row" key={c.id} style={{ '--cc': c.c }}>
              <label className="nm" htmlFor={'wi_' + c.id}><i></i>{c.n} <span className="sub num">~{inr(s.projVarByCat[c.id])}</span></label>
              <span className="v num" style={{ color: v < 0 ? 'var(--good)' : v > 0 ? 'var(--bad)' : '' }}>
                {v === 0 ? 'Same' : (v > 0 ? '+' : '−') + Math.abs(v) + '% · ' + (v < 0 ? inr(-amt) + ' bachat' : inr(amt) + ' zyada')}
              </span>
              <input type="range" id={'wi_' + c.id} min="-60" max="60" step="5" value={v} onChange={(e) => setWi({ ...wi, [c.id]: +e.target.value })} />
            </div>
          );
        })}
      </div>
      <div className="wi-out">
        <div><span>Month-end</span><b className="num">{inr(w.projected)}</b></div>
        <div><span>Health</span><b className="num">{Math.round(s.health * 100)} → {Math.round(w.health * 100)}</b></div>
        <div><span>Saal bhar mein</span><b className="num">{d >= 0 ? '+' : '−'}{inr(Math.abs(d * 12)).replace('−', '')}</b></div>
      </div>
    </>
  );
}
