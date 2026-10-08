import { useRef, useState } from 'react';
import { useApp } from '../AppContext.js';
import { CAT, CATS, floorOf, guessCat } from '../lib/categories.js';
import { TODAY } from '../lib/dates.js';
import { inr, parseAmt, uid } from '../lib/format.js';
import { stats } from '../lib/calc.js';
import NumField from './NumField.jsx';

export default function AddForm() {
  const { data, mode, month, apply, setMonth, toast, scene, onFormFocus, onFormSubmitted } = useApp();
  const [type, setType] = useState('e');
  const [cat, setCat] = useState('food');
  const [catManual, setCatManual] = useState(false);
  const [amt, setAmt] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(TODAY);
  const [err, setErr] = useState('');
  const amtRef = useRef(null);
  const isExp = type === 'e';

  const onNote = (v) => {
    setNote(v);
    if (catManual || !isExp) return;
    const g = guessCat(v);
    if (g && g !== cat) setCat(g);
  };

  const submit = (e) => {
    e.preventDefault();
    const a = parseAmt(amt);
    if (!(a > 0) || a > 1e8) {
      setErr('Amount daalo, sirf number, jaise 450.');
      amtRef.current.focus();
      return;
    }
    setErr('');
    let d = date || TODAY;
    if (d > TODAY) d = TODAY;
    const wasDemo = mode === 'demo';
    const mk = d.slice(0, 7);
    const before = stats(data, month).health;
    const item = { id: uid(), d, a, c: isExp ? cat : 'inc', n: note.trim().slice(0, 60), t: type };
    const next = apply({ type: 'addTx', mk, item });
    setMonth(mk);
    const after = stats(next.data, mk).health;
    const label = isExp ? CAT[item.c].n + ' mein' : 'income mein';
    const hTxt = Math.round(before * 100) !== Math.round(after * 100) && !wasDemo ? ' · Health ' + Math.round(before * 100) + ' → ' + Math.round(after * 100) : '';
    if (scene && scene.react) {
      if (!isExp) scene.react('income');
      else scene.react('expense', { floor: floorOf(item.c), over: stats(next.data, mk).projByCat[item.c] > (next.data.settings.budgets[item.c] || 0) });
    }
    toast((wasDemo ? 'Apna data shuru! ' : '') + inr(a) + ' ' + label + ' add hua' + hTxt, () => apply({ type: 'removeTx', mk, id: item.id }));
    setAmt('');
    setNote('');
    setCatManual(false);
    amtRef.current.focus();
    onFormSubmitted();
  };

  return (
    <form className="add" id="addForm" autoComplete="off" onSubmit={submit}>
      <div className="add-top">
        <h2>{isExp ? 'Naya kharcha' : 'Nayi income'}</h2>
        <div className="seg" role="group" aria-label="Entry type">
          <button type="button" aria-pressed={isExp} onClick={() => setType('e')}>Kharcha</button>
          <button type="button" aria-pressed={!isExp} onClick={() => setType('i')}>Income</button>
        </div>
      </div>
      <div className="amount">
        <span>₹</span>
        <NumField id="amt" ref={amtRef} className="" value={amt} onChange={setAmt} placeholder="0" aria-label="Amount (sirf number)" onFocus={onFormFocus} />
      </div>
      <div className="cats" role="group" aria-label="Category" hidden={!isExp}>
        {CATS.map((c) => (
          <button key={c.id} type="button" className="cat" style={{ '--cc': c.c }} aria-pressed={cat === c.id} onClick={() => { setCat(c.id); setCatManual(true); }}>
            <i></i>{c.n}
          </button>
        ))}
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="note">Kya tha?</label>
          <input className="inp" id="note" placeholder={isExp ? 'Swiggy, chai, Uber…' : 'Freelance, bonus, cashback…'} maxLength={60} value={note} onChange={(e) => onNote(e.target.value)} onFocus={onFormFocus} />
        </div>
        <div className="field">
          <label htmlFor="date">Date</label>
          <input className="inp" id="date" type="date" max={TODAY} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="err" hidden={!err}>{err}</div>
      <button className="btn go" type="submit">Add karo</button>
    </form>
  );
}
