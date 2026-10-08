import { useLayoutEffect, useRef } from 'react';
import { CAT, FLOORS, FLOOR_NAMES } from '../lib/categories.js';
import { inr } from '../lib/format.js';
import { stats } from '../lib/calc.js';

function Bar({ r }) {
  return (
    <div className="pbar">
      <div style={{ width: Math.min(100, r * 100) + '%', background: r > 1 ? 'var(--bad)' : r > 0.85 ? 'var(--warn)' : 'var(--good)' }}></div>
      {r > 1 && <i style={{ left: Math.min(100, 100 / r) + '%' }}></i>}
    </div>
  );
}

const Head = ({ children }) => (
  <div className="info-h"><b>{children}</b><button className="info-x" aria-label="Band karo">×</button></div>
);

function Floor({ i, data, month, onGo }) {
  const s = stats(data, month);
  const f = FLOORS[i];
  return (
    <>
      <Head>{FLOOR_NAMES[i]} · {f.cats.map((c) => CAT[c].n).join(', ')}</Head>
      {f.cats.map((c) => {
        const b = data.settings.budgets[c] || 0;
        const sp = s.byCat[c];
        const pj = s.projByCat[c];
        const r = pj / Math.max(1, b);
        return (
          <div className="pcat" key={c}>
            <div className="pcat-h">
              <span><i style={{ background: CAT[c].c }}></i>{CAT[c].n}</span>
              <b className="num">{inr(sp)} <small>/ {inr(b)}</small></b>
            </div>
            <Bar r={r} />
            <small className="pnote">
              {s.isCur ? 'Month-end anumaan ' + inr(pj) + ' · ' : ''}
              {b <= 0 ? 'Budget set nahi' : r > 1 ? <><b style={{ color: 'var(--bad)' }}>{inr(pj - b)} zyada</b>, isliye is floor pe daraar</> : r > 0.85 ? 'Budget ke kareeb' : 'Budget ke andar, floor mazboot'}
            </small>
          </div>
        );
      })}
      <div className="btnrow">
        <button className="btn sm" onClick={() => onGo('entries', f.cats[0])}>Entries dekho</button>
        <button className="btn sm ghost" onClick={() => onGo('whatif')}>What-if mein ghatao</button>
      </div>
    </>
  );
}

function Roof({ data, month, onGo }) {
  const s = stats(data, month);
  const goal = data.settings.goal;
  const v = s.isCur ? s.projSaved : s.saved;
  const r = v / Math.max(1, goal);
  return (
    <>
      <Head>Chhat · Bachat</Head>
      <p className="info-f">Chhat tumhari bachat hai. Goal poora toh chhat pe jhanda lehrata hai.</p>
      <div className="info-rows">
        <div className="ir"><span className="op"></span><span className="l">Bachat goal</span><span className="v num">{inr(goal)}</span></div>
        <div className="ir tot"><span className="op"></span><span className="l">{s.isCur ? 'Mahine ke end tak anumaan' : 'Asli bachat'}</span><span className="v num">{inr(v)}</span></div>
      </div>
      <Bar r={Math.max(0, r) > 1 ? 1 : Math.max(0, r)} />
      <p className="info-n">{v >= goal ? 'Goal poora ho raha hai!' : 'Goal se ' + inr(goal - v) + ' peeche.'}</p>
      <div className="btnrow"><button className="btn sm" onClick={() => onGo('proj')}>Projection dekho</button></div>
    </>
  );
}

function Coins({ data, month }) {
  const s = stats(data, month);
  const n = Math.round(s.health * 21);
  return (
    <>
      <Head>Bachat ke sikke</Head>
      <p className="info-f">Jitni health, utne sikke. Abhi {n} / 21 sikke dikh rahe hain (health {Math.round(s.health * 100)}).</p>
      <p className="info-n">Income add karoge toh aasmaan se sikke barsenge. Kharcha add karoge toh ek sikka udke us category ke floor mein jaayega.</p>
    </>
  );
}

/** Floating card for a tapped part of the 3D tower. `pick` = { p, x, y }. */
export default function PickCard({ pick, data, month, focus, dockRef, onClose, onGo }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (!pick) return;
    const card = ref.current;
    const r = card.getBoundingClientRect();
    const dock = focus ? null : dockRef.current.getBoundingClientRect();
    const phone = matchMedia('(max-width:760px)').matches;
    const right = dock && !phone ? dock.left - 12 : innerWidth - 12;
    const bottom = dock && phone ? dock.top - 12 : innerHeight - 12;
    let px = pick.x + 18;
    if (px + r.width > right) px = pick.x - 18 - r.width;
    px = Math.max(12, Math.min(right - r.width, px));
    const py = Math.max(70, Math.min(bottom - r.height, pick.y - r.height / 2));
    card.style.left = px + 'px';
    card.style.top = py + 'px';
  }, [pick, focus, dockRef]);

  const p = pick && pick.p;
  return (
    <div className="info glass pick" id="pickPop" role="dialog" hidden={!pick} ref={ref}
      onClick={(e) => e.target.closest('.info-x') && onClose()}>
      {p && p.type === 'floor' && <Floor i={p.i} data={data} month={month} onGo={onGo} />}
      {p && p.type === 'roof' && <Roof data={data} month={month} onGo={onGo} />}
      {p && p.type === 'coins' && <Coins data={data} month={month} />}
    </div>
  );
}
