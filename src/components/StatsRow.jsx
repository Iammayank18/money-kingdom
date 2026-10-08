import { inr } from '../lib/format.js';
import InfoButton from './InfoButton.jsx';

function Stat({ info, label, name, value, sub, valueColor, subColor, hidden }) {
  return (
    <div className="st glass" hidden={hidden}>
      <InfoButton k={info} label={label} />
      <span>{name}</span>
      <b className="num" style={valueColor ? { color: valueColor } : undefined}>{value}</b>
      <small style={subColor ? { color: subColor } : undefined}>{sub}</small>
    </div>
  );
}

export default function StatsRow({ s, loans, goal }) {
  const left = s.budget - s.spent;
  const over = s.projected - s.budget;
  const overTxt = over > 0 ? inr(over) + ' budget se zyada' : inr(-over) + ' budget se kam';
  const daysLeft = s.D - s.dayNow + 1;
  const daily = (s.budget - s.spent - s.pending) / daysLeft;
  const showLoan = loans.recv > 0 || loans.give > 0;
  return (
    <section className="stats" aria-label="Is mahine ke numbers">
      <Stat info="spent" label="Kharcha" name="Kharcha" value={inr(s.spent)} sub={'budget ' + inr(s.budget)} />
      {s.isCur ? (
        <Stat info="daily" label="Roz ka limit" name="Roz ka limit" value={daily > 0 ? inr(daily) : '₹0'} valueColor={daily > 0 ? '' : 'var(--bad)'} sub={daily > 0 ? daysLeft + ' din baaki' : 'budget khatam'} />
      ) : (
        <Stat info="daily" label="Roz ka limit" name="Bachat" value={inr(s.saved)} valueColor={s.saved < 0 ? 'var(--bad)' : ''} sub={'goal ' + inr(goal)} />
      )}
      <Stat info="left" label="Bacha budget" name="Bacha budget" value={inr(left)} valueColor={left < 0 ? 'var(--bad)' : ''} sub={left < 0 ? 'budget se upar' : Math.round((left / s.budget) * 100) + '% bacha'} />
      <Stat
        info="proj"
        label="Month-end anumaan"
        name={s.isCur ? 'Month-end anumaan' : 'Final kharcha'}
        value={inr(s.isCur ? s.projected : s.spent)}
        sub={s.isCur ? overTxt : (s.spent - s.budget > 0 ? inr(s.spent - s.budget) + ' budget se zyada' : inr(-(s.spent - s.budget)) + ' budget se kam')}
        subColor={(s.isCur ? over : s.spent - s.budget) > 0 ? 'var(--bad)' : ''}
      />
      <Stat
        info="loan"
        label="Udhaar"
        hidden={!showLoan}
        name={loans.recv > 0 ? 'Udhaar aana hai' : 'Udhaar dena hai'}
        value={inr(loans.recv > 0 ? loans.recv : loans.give)}
        valueColor="var(--good)"
        sub={loans.recv > 0 ? (loans.late ? loans.late + ' late · ' : '') + loans.recvN + ' logon se' : 'lauta dena'}
        subColor={loans.late ? 'var(--bad)' : ''}
      />
    </section>
  );
}
