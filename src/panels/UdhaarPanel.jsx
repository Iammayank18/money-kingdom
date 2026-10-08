import { useState } from 'react';
import { useApp } from '../AppContext.js';
import { TODAY, dayMonth, nextMonthDate } from '../lib/dates.js';
import { inr, parseAmt, uid } from '../lib/format.js';
import { dueChip, leftOf, loanSum, paidOf } from '../lib/loans.js';
import NumField from '../components/NumField.jsx';
import Empty from './Empty.jsx';

const blankForm = (dir) => ({ dir, who: '', a: '', d: TODAY, due: nextMonthDate(), n: '' });

function DueChip({ loan }) {
  const { kind, text } = dueChip(loan);
  return kind === 'warn' ? (
    <span className="delta flat" style={{ background: 'var(--warn-soft)', color: '#7A4E00' }}>{text}</span>
  ) : (
    <span className={'delta ' + kind}>{text}</span>
  );
}

function LoanCard({ loan: l, partOpen, onAct }) {
  const paid = paidOf(l);
  const left = leftOf(l);
  const pct = Math.min(100, (paid / l.a) * 100);
  const lent = l.dir === 'diya';
  const [part, setPart] = useState('');
  return (
    <div className={'loan' + (l.closed ? ' closed' : '')}>
      <div className="loan-top">
        <div className="ic" style={{ '--cc': lent ? '#1baf7a' : '#e34948' }}>{l.who.charAt(0).toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <div className="t">{l.who} <span className="sub" style={{ fontSize: 12 }}>{lent ? 'ko diya' : 'se liya'}</span></div>
          <div className="s">{dayMonth(l.d)}{l.n ? ' · ' + l.n : ''}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="a num" style={{ color: l.closed ? 'var(--ink2)' : lent ? 'var(--good)' : 'var(--bad)' }}>{inr(l.closed ? l.a : left)}</div>
          <DueChip loan={l} />
        </div>
      </div>
      {paid > 0 && !l.closed && (
        <div className="loan-prog">
          <div className="bar"><div style={{ width: pct + '%' }}></div></div>
          <small className="num">{inr(l.a)} mein se {inr(paid)} {lent ? 'wapas aaya' : 'lauta diya'}</small>
        </div>
      )}
      {l.closed ? (
        <div className="loan-act">
          <button className="btn sm ghost" onClick={() => onAct('reopen', l)}>Dobara kholo</button>
          <button className="del" aria-label={'Udhaar hatao: ' + l.who} onClick={() => onAct('del', l)}>×</button>
        </div>
      ) : (
        <>
          <div className="loan-act">
            <button className="btn sm soft" onClick={() => onAct('full', l)}>{lent ? 'Poora wapas aaya' : 'Poora lauta diya'}</button>
            <button className="btn sm ghost" onClick={() => onAct('part', l)}>Thoda {lent ? 'aaya' : 'diya'}</button>
            {lent && <button className="btn sm ghost" onClick={() => onAct('remind', l)}>Yaad dilao</button>}
            <button className="del" aria-label={'Udhaar hatao: ' + l.who} onClick={() => onAct('del', l)}>×</button>
          </div>
          {partOpen && (
            <div className="loan-part">
              <NumField autoFocus value={part} onChange={setPart} placeholder={'Kitna, max ' + left} aria-label="Kitna wapas aaya" />
              <button className="btn sm" onClick={() => onAct('partSave', l, parseAmt(part))}>Save</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function UdhaarPanel() {
  const { data, mode, apply, toast, scene } = useApp();
  const L = data.loans;
  const sm = loanSum(L);
  const [form, setForm] = useState(() => blankForm('diya'));
  const [err, setErr] = useState(null); // { field, msg }
  const [partId, setPartId] = useState(null);
  const open = L.filter((l) => !l.closed).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
  const done = L.filter((l) => l.closed).sort((a, b) => b.d.localeCompare(a.d));
  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErr(null);
  };
  const react = (kind) => scene && scene.react && scene.react(kind);

  // `fn` maps the loan list to its new value, `undo` maps it back. Both are applied to the live list,
  // so undoing one change never clobbers a different change made since.
  const save = (fn, undo, msg) => {
    apply({ type: 'updateLoans', fn });
    if (msg) toast(msg, () => apply({ type: 'updateLoans', fn: undo }));
  };
  const swap = (id, next) => (ls) => ls.map((x) => (x.id === id ? next : x));
  const restoreLoan = (l, idx) => (ls) => (ls.some((x) => x.id === l.id) ? ls.map((x) => (x.id === l.id ? l : x)) : [...ls.slice(0, idx), l, ...ls.slice(idx)]);

  const add = () => {
    const who = form.who.trim();
    const a = parseAmt(form.a);
    const d = form.d || TODAY;
    const bad = !who ? ['who', 'Naam likho.'] : !(a > 0) ? ['a', 'Amount daalo, sirf number.'] : form.due && form.due < d ? ['due', 'Wapas ki date, dene ki date ke baad honi chahiye.'] : null;
    if (bad) {
      setErr({ field: bad[0], msg: bad[1] });
      document.getElementById('u_' + bad[0])?.focus();
      return;
    }
    const wasDemo = mode === 'demo';
    const l = { id: uid(), dir: form.dir, who: who.slice(0, 40), a, d: d > TODAY ? TODAY : d, due: form.due, n: form.n.trim().slice(0, 60), paid: [] };
    setForm(blankForm(form.dir));
    react(l.dir === 'diya' ? 'loanGive' : 'loanBack');
    save((ls) => [...ls, l], (ls) => ls.filter((x) => x.id !== l.id), (wasDemo ? 'Apna data shuru! ' : '') + inr(a) + ' ' + (l.dir === 'diya' ? who + ' ko diya' : who + ' se liya') + ' likh liya. Kharche mein nahi gina.');
  };

  const act = async (kind, l, amount) => {
    if (mode === 'demo' && kind !== 'remind') {
      toast('Example data hai. "Apna data shuru karo" dabao, ya upar apna udhaar add karo.');
      return;
    }
    const idx = L.findIndex((x) => x.id === l.id);
    const back = restoreLoan(l, idx);
    const lent = l.dir === 'diya';
    const left = leftOf(l);
    if (kind === 'full') {
      react(lent ? 'loanBack' : 'loanGive');
      setPartId(null);
      save(swap(l.id, { ...l, paid: [...(l.paid || []), { d: TODAY, a: left }], closed: true }), back, lent ? inr(left) + ' ' + l.who + ' se wapas aaya. Hisaab barabar!' : inr(left) + ' ' + l.who + ' ko lauta diya. Hisaab barabar!');
    } else if (kind === 'part') {
      setPartId(partId === l.id ? null : l.id);
    } else if (kind === 'partSave') {
      if (!(amount > 0)) return;
      react(lent ? 'loanBack' : 'loanGive');
      const amt = Math.min(amount, left);
      const next = { ...l, paid: [...(l.paid || []), { d: TODAY, a: amt }], closed: amt >= left ? true : l.closed };
      setPartId(null);
      save(swap(l.id, next), back, inr(amt) + (lent ? ' wapas aaya' : ' lauta diya') + '. Ab ' + inr(leftOf(next)) + ' baaki.');
    } else if (kind === 'reopen') {
      save(swap(l.id, { ...l, closed: false, paid: (l.paid || []).slice(0, -1) }), back, 'Udhaar dobara khul gaya.');
    } else if (kind === 'del') {
      save((ls) => ls.filter((x) => x.id !== l.id), back, 'Udhaar hata diya: ' + l.who + ' ' + inr(l.a));
    } else if (kind === 'remind') {
      const msg = 'Hi ' + l.who + '! ' + dayMonth(l.d) + ' ko jo ' + inr(l.a) + (l.n ? ' (' + l.n + ')' : '') + ' diye the, ' + (paidOf(l) ? 'unme se ' + inr(left) + ' baaki hai. ' : '') + 'jab ho sake lauta dena. Thanks!';
      try {
        await navigator.clipboard.writeText(msg);
        toast('Yaad dilane wala message copy ho gaya. WhatsApp pe paste kar do.');
      } catch {
        toast(msg);
      }
    }
  };

  const lent = form.dir === 'diya';
  const cards = (arr) => (
    <div className="loans">
      {arr.map((l) => <LoanCard key={l.id} loan={l} partOpen={partId === l.id} onAct={act} />)}
    </div>
  );

  return (
    <>
      <div className="panel-head"><h3>Udhaar</h3><p className="sub">Kharche mein nahi gina jaata, health pe asar nahi</p></div>
      <div className="kpis">
        <div className="st">
          <span>Lena hai</span>
          <b className="num" style={{ color: 'var(--good)' }}>{inr(sm.recv)}</b>
          <small>
            {sm.recvN ? <>{sm.recvN} logon se{sm.late ? <> · <span style={{ color: 'var(--bad)', fontWeight: 700 }}>{sm.late} late</span></> : null}</> : 'Kisi se nahi'}
          </small>
        </div>
        <div className="st">
          <span>{sm.give > 0 ? 'Dena hai' : 'Agle mahine tak aayega'}</span>
          <b className="num" style={sm.give > 0 ? { color: 'var(--bad)' } : undefined}>{inr(sm.give > 0 ? sm.give : sm.nextMonth)}</b>
          <small>{sm.give > 0 ? (sm.lateGive ? sm.lateGive + ' late' : 'time pe lauta dena') : 'due date ke hisaab se'}</small>
        </div>
      </div>

      <div className="udh-add">
        <div className="add-top">
          <b style={{ fontFamily: 'var(--f-display)', fontSize: 16 }}>Naya udhaar</b>
          <div className="seg" role="group" aria-label="Udhaar type">
            <button type="button" aria-pressed={lent} onClick={() => setForm((f) => ({ ...f, dir: 'diya' }))}>Maine diya</button>
            <button type="button" aria-pressed={!lent} onClick={() => setForm((f) => ({ ...f, dir: 'liya' }))}>Maine liya</button>
          </div>
        </div>
        <div className="grid2">
          <div className="field">
            <label htmlFor="u_who">{lent ? 'Kisko diya' : 'Kisse liya'}</label>
            <input className="inp" id="u_who" list="uNames" maxLength={40} placeholder="Dost ka naam" value={form.who} onChange={(e) => set('who')(e.target.value)} />
            <datalist id="uNames">{[...new Set(L.map((l) => l.who))].map((n) => <option key={n} value={n} />)}</datalist>
          </div>
          <div className="field">
            <label htmlFor="u_a">Amount (₹)</label>
            <NumField id="u_a" value={form.a} onChange={set('a')} placeholder="jaise 5000" />
          </div>
          <div className="field">
            <label htmlFor="u_d">Kab {lent ? 'diya' : 'liya'}</label>
            <input className="inp" id="u_d" type="date" max={TODAY} value={form.d} onChange={(e) => set('d')(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="u_due">Wapas kab</label>
            <input className="inp" id="u_due" type="date" value={form.due} onChange={(e) => set('due')(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="u_n">Kis liye (optional)</label>
          <input className="inp" id="u_n" maxLength={60} placeholder="Bike service, rent help…" value={form.n} onChange={(e) => set('n')(e.target.value)} />
        </div>
        <div className="err" hidden={!err}>{err && err.msg}</div>
        <button className="btn go" type="button" onClick={add}>Udhaar add karo</button>
      </div>

      {!L.length && <Empty title="Koi udhaar nahi">Dost ko paise diye? Upar likh lo, wapas aane ki date pe yaad dilayenge.</Empty>}
      {open.length > 0 && (
        <>
          <div className="day-h"><span>Baaki hai</span><span className="num">{open.length}</span></div>
          {cards(open)}
        </>
      )}
      {done.length > 0 && (
        <details className="done">
          <summary>Hisaab barabar ({done.length})</summary>
          {cards(done)}
        </details>
      )}
    </>
  );
}
