import { useEffect, useState } from 'react';
import { useApp } from '../AppContext.js';
import { CAT, CATS, CHARS, charName } from '../lib/categories.js';
import { CUR } from '../lib/dates.js';
import { inr, parseAmt, uid } from '../lib/format.js';
import { stats } from '../lib/calc.js';
import { backupText, downloadCsv, parseBackup } from '../lib/backup.js';
import { lsClear, saveLsChar, saveTimeMode, timeMode } from '../lib/storage.js';
import { blankRecForm } from '../lib/forms.js';
import NumField from '../components/NumField.jsx';

const TIMES = [
  ['auto', 'Asli', 'Ghadi ke hisaab'],
  ['day', 'Din', 'Hamesha din'],
  ['dusk', 'Shaam', 'Sunset'],
  ['night', 'Raat', 'Lights on'],
];

function PickRow({ label, cols, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="chars" role="group" aria-label={label} style={cols ? { gridTemplateColumns: `repeat(${cols},minmax(0,1fr))` } : undefined}>{children}</div>
    </div>
  );
}

function RecurringForm() {
  const { apply, toast, recForm: f, setRecForm: setF } = useApp();
  const [err, setErr] = useState(null);
  const set = (k) => (v) => {
    setF((x) => ({ ...x, [k]: v }));
    setErr(null);
  };
  const add = () => {
    const n = f.n.trim();
    const a = parseAmt(f.a);
    const day = parseInt(f.d, 10);
    const bad = !n ? ['rN', 'Naam likho, jaise Netflix ya Rent.'] : !(a > 0) ? ['rA', 'Amount daalo, sirf number, jaise 199.'] : !(day >= 1 && day <= 31) ? ['rD', 'Date 1 se 31 ke beech honi chahiye.'] : null;
    if (bad) {
      setErr(bad[1]);
      document.getElementById(bad[0])?.focus();
      return;
    }
    apply({ type: 'addRecurring', item: { id: uid(), n: n.slice(0, 40), a, c: f.c, day } });
    setF(blankRecForm());
    toast(n + ' (' + inr(a) + ') har mahine ' + day + ' tareekh ko judega.');
  };
  return (
    <>
      <div className="rec-add">
        <div className="field"><label htmlFor="rN">Naam</label><input className="inp" id="rN" placeholder="jaise Netflix" maxLength={40} value={f.n} onChange={(e) => set('n')(e.target.value)} /></div>
        <div className="field"><label htmlFor="rA">Amount (₹)</label><NumField id="rA" placeholder="jaise 199" value={f.a} onChange={set('a')} /></div>
        <div className="field">
          <label htmlFor="rC">Category</label>
          <select className="inp" id="rC" value={f.c} onChange={(e) => set('c')(e.target.value)}>
            {CATS.map((c) => <option key={c.id} value={c.id}>{c.n}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="rD">Har mahine ki date</label><NumField id="rD" day placeholder="1–31" value={f.d} onChange={set('d')} /></div>
        <button className="btn sm" style={{ height: 40, gridColumn: '1/-1' }} onClick={add}>Har mahine wala kharcha add karo</button>
      </div>
      <div className="err" hidden={!err}>{err}</div>
    </>
  );
}

function DataTools() {
  const { data, mode, month, apply, toast, startOwn, setMonth } = useApp();
  const [area, setArea] = useState(null); // null | 'copy' | 'restore'
  const [text, setText] = useState('');
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return undefined;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  const copy = async () => {
    const txt = backupText(data);
    try {
      await navigator.clipboard.writeText(txt);
      toast('Backup clipboard pe copy ho gaya.');
    } catch {
      setText(txt);
      setArea('copy');
    }
  };
  const restore = () => {
    try {
      const next = parseBackup(text);
      apply({ type: 'restore', data: next });
      setMonth(CUR);
      toast('Backup restore ho gaya.');
    } catch {
      toast('Yeh backup text sahi nahi lag raha.');
    }
  };
  const reset = () => {
    if (mode === 'demo') {
      startOwn(false);
      return;
    }
    if (!armed) {
      setArmed(true);
      return;
    }
    lsClear();
    apply({ type: 'reset' });
    setMonth(CUR);
    toast('Sab data hata diya. Ab example data dikh raha hai.');
  };

  return (
    <>
      <div className="btnrow">
        <button className="btn sm ghost" onClick={() => downloadCsv(data)}>CSV download</button>
        <button className="btn sm ghost" onClick={copy}>Backup copy karo</button>
        <button className="btn sm ghost" onClick={() => { setText(''); setArea('restore'); }}>Backup se restore</button>
        <button className="btn sm danger" onClick={reset}>{mode === 'demo' ? 'Example data band karo' : armed ? 'Pakka? Dobara dabao' : 'Sab data hatao'}</button>
      </div>
      <div>
        {area === 'copy' && (
          <div className="field">
            <label htmlFor="dTxt">Yeh text select karke copy karo</label>
            <textarea className="inp" id="dTxt" readOnly value={text} autoFocus onFocus={(e) => e.target.select()} />
          </div>
        )}
        {area === 'restore' && (
          <>
            <div className="field">
              <label htmlFor="dIn">Backup text yahan paste karo</label>
              <textarea className="inp" id="dIn" autoFocus value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <div className="btnrow" style={{ marginTop: 8 }}><button className="btn sm" onClick={restore}>Restore karo</button></div>
          </>
        )}
      </div>
      <p className="sub">
        {mode === 'local' ? 'Data abhi sirf is browser mein hai. Backup copy karke rakho.' : 'Abhi example data chal raha hai.'}
      </p>
    </>
  );
}

export default function SetupPanel() {
  const { data, mode, month, apply, toast, scene } = useApp();
  const st = data.settings;
  const budget = st.income - st.goal;
  const sumB = CATS.reduce((s, c) => s + (+st.budgets[c.id] || 0), 0);
  const xi = stats(data, month).extraInc;
  const [time, setTime] = useState(timeMode());
  const off = Math.abs(sumB - budget) > 500;

  const demoNote = () => mode === 'demo' && toast('Example data mein badlaav save nahi hote. "Apna data shuru karo" dabao.');
  const setNum = (key) => (v) => {
    const n = parseAmt(v);
    if (!(n >= 0)) return;
    apply({ type: 'setNumber', key, value: n });
    demoNote();
  };
  const setBudget = (id) => (v) => {
    const n = parseAmt(v);
    if (!(n >= 0)) return;
    apply({ type: 'setBudget', id, value: n });
    demoNote();
  };
  const pickChar = (id) => {
    apply({ type: 'setChar', id });
    saveLsChar(id);
    toast(charName(id) + ' ab tumhari building sambhalega.');
  };
  const pickTime = (id) => {
    saveTimeMode(id);
    scene && scene.setTimeMode && scene.setTimeMode(id);
    setTime(id);
  };
  const delRec = (r) => {
    if (mode === 'demo') {
      toast('Pehle apna data shuru karo.');
      return;
    }
    apply({ type: 'delRecurring', id: r.id });
  };

  return (
    <>
      <div className="panel-head"><h3>Setup</h3><p className="sub">{mode === 'demo' ? 'Example data ki settings' : 'Har badlaav apne aap save hota hai'}</p></div>
      <PickRow label="Tumhara character">
        {CHARS.map((c) => (
          <button key={c.id} className="charbtn" aria-pressed={st.char === c.id} onClick={() => pickChar(c.id)}><b>{c.n}</b><small>{c.d}</small></button>
        ))}
      </PickRow>
      <PickRow label="Duniya ka time" cols={4}>
        {TIMES.map(([id, n, d]) => (
          <button key={id} className="charbtn" aria-pressed={time === id} onClick={() => pickTime(id)}><b>{n}</b><small>{d}</small></button>
        ))}
      </PickRow>
      <div className="grid2">
        <div className="field"><label htmlFor="sInc">Monthly income (₹)</label><NumField id="sInc" value={st.income} onChange={setNum('income')} /></div>
        <div className="field"><label htmlFor="sGoal">Har mahine bachat goal (₹)</label><NumField id="sGoal" value={st.goal} onChange={setNum('goal')} /></div>
      </div>
      <div className="note">
        Kharche ka budget: <b className="num">{inr(budget)}</b> har mahine. Health isi se nikalti hai.
        {xi > 0 && <> Is mahine <b className="num">{inr(xi)}</b> extra income bhi judi hai, isliye abhi budget <b className="num">{inr(budget + xi)}</b> hai.</>}
      </div>
      <h3 style={{ fontSize: 16 }}>Category budgets</h3>
      <div className="budg">
        {CATS.map((c) => (
          <div className="field" key={c.id} style={{ '--cc': c.c }}>
            <label htmlFor={'b_' + c.id}><i></i>{c.n}</label>
            <NumField id={'b_' + c.id} value={st.budgets[c.id] || 0} onChange={setBudget(c.id)} />
          </div>
        ))}
      </div>
      <div className={'note' + (off ? ' warn' : '')}>
        Category budgets ka total <b className="num">{inr(sumB)}</b>
        {off ? ', jabki kharche ka budget ' + inr(budget) + ' hai. Dono ko barabar rakho toh warnings sahi aayengi.' : '. Bilkul sahi.'}
      </div>
      <div className="divider"></div>
      <h3 style={{ fontSize: 16 }}>Har mahine wale kharche</h3>
      <p className="sub">Rent, EMI, subscriptions. Yeh apni date pe automatic jud jaate hain.</p>
      <div className="rec">
        {!st.recurring.length && <div className="note">Abhi koi nahi. Neeche se add karo.</div>}
        {st.recurring.slice().sort((a, b) => a.day - b.day).map((r) => {
          const c = CAT[r.c] || CAT.other;
          return (
            <div className="rec-row" key={r.id}>
              <div style={{ minWidth: 0 }}><b>{r.n}</b><div className="s">{c.n} · har mahine {r.day} tareekh</div></div>
              <b className="num">{inr(r.a)}</b>
              <button className="del btn sm danger" style={{ padding: '4px 9px' }} aria-label={'Hatao ' + r.n} onClick={() => delRec(r)}>×</button>
            </div>
          );
        })}
      </div>
      <RecurringForm />
      <div className="divider"></div>
      <h3 style={{ fontSize: 16 }}>Data</h3>
      <DataTools />
    </>
  );
}
