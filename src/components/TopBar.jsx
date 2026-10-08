import { CUR, addMonth, mName } from '../lib/dates.js';

export default function TopBar({ mode, month, startMonth, onMonth }) {
  const start = startMonth < CUR ? startMonth : CUR;
  return (
    <header className="top">
      <div className="logo glass"><b>₹</b>Paisa Mahal</div>
      <div className="monthnav glass" role="group" aria-label="Mahina chuno">
        <button aria-label="Pichla mahina" disabled={month <= start} onClick={() => onMonth(addMonth(month, -1))}>‹</button>
        <span className="num">{mName(month)}</span>
        <button aria-label="Agla mahina" disabled={month >= CUR} onClick={() => onMonth(addMonth(month, 1))}>›</button>
      </div>
      <div className={'sync glass ' + (mode === 'demo' ? 'demo' : 'local')}>
        <i></i>
        <span>{mode === 'demo' ? 'Example data' : 'Is browser mein saved'}</span>
      </div>
    </header>
  );
}
