import { mName } from '../lib/dates.js';
import { inr } from '../lib/format.js';
import InfoButton from './InfoButton.jsx';

/** Health pill, score and the one-line "why". `ws` is the (possibly what-if) stats shown. */
export default function Hud({ s, ws, T, wiOn, goal }) {
  return (
    <section className="hud" aria-live="polite">
      <span className="pill glass" style={{ '--pc': T.c }}>
        <i></i>
        <span>{T.t}</span>
        <InfoButton k="health" label="Health score" style={{ position: 'static', marginLeft: 2 }} />
      </span>
      <div className="score num">{Math.round(ws.health * 100)}<small>/100</small></div>
      <p className="why">
        {s.isCur ? (
          <>
            Health <b>month-end anumaan</b> pe based hai: is pace pe <b>{inr(ws.projected)}</b> kharch hoga, budget <b>{inr(s.budget)}</b> hai (income {inr(s.income)} − bachat goal {inr(goal)}).
          </>
        ) : s.hasData ? (
          <>
            <b>{mName(s.k)}</b> ki building. Health final kharche pe based hai.
          </>
        ) : (
          'Is mahine ka koi data nahi hai.'
        )}
      </p>
      <span className="wi-badge" hidden={!wiOn}>What-if preview</span>
    </section>
  );
}
