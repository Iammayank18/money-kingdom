import { useApp } from '../AppContext.js';
import { mName } from '../lib/dates.js';
import { inr, inrC } from '../lib/format.js';
import { savingsOutlook, stats } from '../lib/calc.js';
import { loanSum } from '../lib/loans.js';
import { DailyChart, SavingsChart } from '../components/charts.jsx';
import InfoButton from '../components/InfoButton.jsx';
import Empty from './Empty.jsx';

export default function ProjectionPanel() {
  const { data, month } = useApp();
  const s = stats(data, month);
  const st = data.settings;
  if (!s.hasData) return <Empty title="Data nahi hai">Is mahine ka record nahi hai.</Empty>;

  const { past, avg, series } = savingsOutlook(data);
  const goal12 = st.goal * 12;
  const diff = series[11] - goal12;
  const lp = loanSum(data.loans);
  const extra = 2000;
  const daysLeft = s.D - s.dayNow + 1;
  const daily = (s.budget - s.spent - s.pending) / daysLeft;
  const over = s.projected - s.budget;

  return (
    <>
      <div className="panel-head">
        <h3>Projection</h3>
        <p className="sub">{s.isCur ? 'Is pace pe aage kya hoga' : mName(month) + ' ka record'}</p>
      </div>
      {s.isCur && (
        <div className="kpis">
          <div className="st">
            <InfoButton k="proj" label="Month-end anumaan" />
            <span>Month-end anumaan</span>
            <b className="num">{inr(s.projected)}</b>
            <small className="num"><span className={'delta ' + (over > 0 ? 'up' : 'down')}>{over > 0 ? inr(over) + ' zyada' : inr(-over) + ' kam'}</span> budget {inrC(s.budget)} se</small>
          </div>
          <div className="st">
            <InfoButton k="daily" label="Roz ka safe limit" />
            <span>Roz ka safe limit</span>
            <b className="num">{daily > 0 ? inr(daily) : '₹0'}</b>
            <small>{daily > 0 ? 'baaki ' + daysLeft + ' din, bills ke baad' : 'budget khatam, sirf zaroori kharcha'}</small>
          </div>
        </div>
      )}
      <DailyChart data={data} s={s} />
      <div className="kpis">
        <div className="st">
          <InfoButton k="save12" label="12 mahine mein bachat" />
          <span>12 mahine mein bachat</span>
          <b className="num">~{inr(series[11])}</b>
          <small className="num"><span className={'delta ' + (diff >= 0 ? 'down' : 'up')}>{diff >= 0 ? 'goal se ' + inrC(diff) + ' upar' : 'goal se ' + inrC(-diff) + ' peeche'}</span></small>
        </div>
        <div className="st">
          <InfoButton k="avg" label="Har mahine ka average" />
          <span>Har mahine ka average</span>
          <b className="num">{inr(avg)}</b>
          <small>{past.length ? 'pichle ' + past.length + ' mahine ki bachat se' : 'is mahine ke anumaan se'}</small>
        </div>
      </div>
      <SavingsChart series={series} goal={st.goal} />
      {lp.recv > 0 && (
        <div className="note">
          Iske upar <b className="num">{inr(lp.recv)}</b> udhaar wapas aana hai{lp.nextMonth > 0 && <>, jisme se <b className="num">{inr(lp.nextMonth)}</b> agle mahine tak</>}. Yeh bachat mein nahi joda gaya, Udhaar tab mein dekho.
        </div>
      )}
      <div className="note">Har mahine sirf <b>{inr(extra)}</b> aur bachao toh saal mein <b>{inr(extra * 12)}</b> extra. What-if tab mein dekho kahan se kat sakta hai.</div>
    </>
  );
}
