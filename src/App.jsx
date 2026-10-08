import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppContext } from './AppContext.js';
import { useScene } from './hooks/useScene.js';
import { CAT, FLOORS, charName } from './lib/categories.js';
import { CUR, TODAY } from './lib/dates.js';
import { inr } from './lib/format.js';
import { babuLine, stats, tier } from './lib/calc.js';
import { blankLoanForm, blankRecForm } from './lib/forms.js';
import { loanSum } from './lib/loans.js';
import { charTips } from './lib/tips.js';
import { cleanSettings } from './lib/backup.js';
import { clampMonth, initState, reducer } from './lib/reducer.js';
import { lsLoad, lsSave, takeHint3d, timeMode } from './lib/storage.js';
import favSvg from './assets/favicon.svg?raw';
import TopBar from './components/TopBar.jsx';
import Hud from './components/Hud.jsx';
import StatsRow from './components/StatsRow.jsx';
import Dock from './components/Dock.jsx';
import Toast from './components/Toast.jsx';
import InfoPopover from './components/InfoPopover.jsx';
import PickCard from './components/PickCard.jsx';

const isPhone = () => matchMedia('(max-width:760px)').matches;
const FAV_DOT = { Mazboot: '#23A06F', 'Theek hai': '#4FB98C', 'Daraarein aa rahi': '#DD8A0B', 'Building gir rahi!': '#D94A35' };

function loadInitial() {
  const stored = lsLoad();
  return initState(stored && { ...stored, settings: cleanSettings(stored.settings) });
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, loadInitial);
  const { data, mode } = state;
  const [viewMonth, setMonth] = useState(CUR);
  const [tab, setTab] = useState('entries');
  const [filter, setFilter] = useState('all');
  const [wi, setWi] = useState({});
  const [full, setFull] = useState(false); // phone bottom sheet expanded
  const [focus, setFocus] = useState(false); // "sirf duniya dekho"
  const [toastState, setToastState] = useState(null);
  const [info, setInfo] = useState(null);
  const [pick, setPickState] = useState(null);
  // drafts live here so they survive switching tabs, like the original
  const [udForm, setUdForm] = useState(() => blankLoanForm('diya'));
  const [partId, setPartId] = useState(null);
  const [recForm, setRecForm] = useState(blankRecForm);
  const [tip, setTip] = useState(null); // character speech override: { text, until }

  const canvasRef = useRef(null);
  const dockRef = useRef(null);
  const bubbleRef = useRef(null);
  const tagRef = useRef(null);
  const pickRef = useRef(null);
  const toastId = useRef(0);
  const tipIdx = useRef(0);
  const scene = useScene(canvasRef);

  const month = clampMonth(viewMonth, data);

  /* ---------- derived ---------- */
  const s = useMemo(() => stats(data, month), [data, month]);
  const wiOn = tab === 'whatif' && Object.values(wi).some(Boolean);
  const ws = useMemo(() => (wiOn ? stats(data, month, wi) : s), [wiOn, data, month, wi, s]);
  const T = tier(ws.health);
  const loans = useMemo(() => loanSum(data.loans), [data.loans]);
  const char = data.settings.char || 'gullu';
  const bubbleText = tip && tip.until > Date.now() ? tip.text : babuLine(data, ws);

  /* ---------- actions ---------- */
  const toast = useCallback((msg, undo, ms) => setToastState({ id: ++toastId.current, msg, undo, ms }), []);
  const apply = (action) => {
    const next = reducer(state, action);
    dispatch(action);
    return next;
  };
  const startOwn = (silent) => {
    dispatch({ type: 'startOwn' });
    setMonth(CUR);
    if (!silent) toast('Tumhara apna data shuru! Income aur goal Setup tab mein set karo.');
  };
  const openInfo = useCallback((key, id, el) => setInfo((cur) => (cur && cur.id === id ? null : { key, id, el })), []);
  const closeInfo = useCallback(() => setInfo(null), []);
  const setPick = (v) => {
    pickRef.current = v;
    setPickState(v);
  };
  const closePick = () => {
    if (!pickRef.current) return;
    setPick(null);
    scene && scene.select && scene.select(null);
  };
  const goTo = (go, cat) => {
    if (go === 'entries') setFilter(cat || 'all');
    closePick();
    setFocus(false);
    setTab(go);
    if (isPhone()) setFull(true);
    setTimeout(() => document.getElementById('p-' + go)?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }), 50);
  };

  /* ---------- persistence ---------- */
  useEffect(() => {
    if (mode !== 'demo') lsSave(data);
  }, [data, mode]);

  // opening another month/tab or editing data invalidates an open "how is this calculated" popover
  useEffect(() => closeInfo(), [data, month, tab, closeInfo]);

  /* ---------- 3D sync ---------- */
  useEffect(() => {
    if (!scene) return;
    scene.setHealth(ws.health);
    if (scene.setCharacter) scene.setCharacter(char);
    if (scene.setFloors) {
      scene.setFloors(FLOORS.map((f) => ({ ratio: Math.max(...f.cats.map((c) => ws.projByCat[c] / Math.max(1, data.settings.budgets[c] || 0))), color: CAT[f.cats[0]].c })));
    }
  }, [scene, ws, char, data.settings.budgets]);

  // no WebGL: fall back to a health-tinted page background
  useEffect(() => {
    if (!scene || scene.ownsSky) return;
    const t = 1 - Math.min(1, Math.max(0, (ws.health - 0.15) / 0.6));
    const mix = (a, b) => {
      const pa = parseInt(a.slice(1), 16);
      const pb = parseInt(b.slice(1), 16);
      return 'rgb(' + [16, 8, 0].map((sh) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t)).join(',') + ')';
    };
    document.body.style.background = 'linear-gradient(180deg,' + mix('#BFE6F5', '#B9B3C4') + ' 0%,' + mix('#F1F8EE', '#DCD5DA') + ' 62%)';
  }, [scene, ws.health]);

  // favicon: tower + coin, with a dot in the health colour
  useEffect(() => {
    const dot = '<circle cx="53" cy="11" r="8.5" fill="' + (FAV_DOT[T.t] || '#23A06F') + '" stroke="#fff" stroke-width="3"/>';
    const el = document.getElementById('favSvg');
    if (el) el.href = 'data:image/svg+xml,' + encodeURIComponent(favSvg.replace('</svg>', dot + '</svg>'));
  }, [T.t]);

  // character tip expires after 7s
  useEffect(() => {
    if (!tip) return undefined;
    const t = setTimeout(() => setTip(null), Math.max(0, tip.until - Date.now()) + 100);
    return () => clearTimeout(t);
  }, [tip]);

  /* ---------- layout (3D viewport vs. panel) ---------- */
  const layout = useCallback(() => {
    if (!scene || !scene.setLayout || !dockRef.current) return;
    const r = dockRef.current.getBoundingClientRect();
    if (isPhone()) scene.setLayout({ panelW: 0, sheetH: focus ? 0 : r.height, topH: 60 });
    else scene.setLayout({ panelW: focus ? 0 : r.width + 32, sheetH: 0, topH: 0 });
  }, [scene, focus]);
  useEffect(() => {
    document.body.classList.toggle('focus', focus);
    const t = setTimeout(layout, focus ? 0 : 380);
    return () => clearTimeout(t);
  }, [focus, layout]);
  useEffect(() => {
    document.body.classList.toggle('sheet-full', full);
    const t = setTimeout(layout, 380);
    return () => clearTimeout(t);
  }, [full, layout]);
  useEffect(() => {
    layout();
    let t = 0;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(layout, 50);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [layout]);

  /* ---------- 3D world interactions ---------- */
  const latest = useRef(null);
  latest.current = { data, month, toast, closePick };
  useEffect(() => {
    if (!scene || !scene.react) return undefined;
    const bubble = bubbleRef.current;
    const tag = tagRef.current;
    let lastTail = 0;
    scene.onFrame = (a) => {
      const r = bubble.getBoundingClientRect();
      const inFocus = document.body.classList.contains('focus');
      const dr = inFocus ? null : dockRef.current.getBoundingClientRect();
      const right = dr && !isPhone() ? dr.left - 12 : innerWidth - 12;
      const bottom = dr && isPhone() ? dr.top - 12 : innerHeight - 12;
      const x = Math.max(12, Math.min(right - r.width, a.x - r.width / 2));
      const y = Math.max(70, Math.min(bottom - r.height, a.y - r.height));
      bubble.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      const tail = Math.max(18, Math.min(r.width - 18, a.x - x));
      if (Math.abs(tail - lastTail) > 0.5) {
        bubble.style.setProperty('--tail', tail + 'px');
        lastTail = tail;
      }
      bubble.style.opacity = a.ok && a.y < bottom + 20 ? 1 : 0;
    };
    scene.onPick = (p, x, y) => {
      tag.hidden = true;
      const L = latest.current;
      if (!p) {
        L.closePick();
        return;
      }
      if (p.type === 'char') {
        L.closePick();
        const tips = charTips(L.data);
        setTip({ text: tips[tipIdx.current % tips.length], until: Date.now() + 7000 });
        tipIdx.current++;
        scene.focusChar(6000);
        return;
      }
      scene.select(p);
      setPick({ p, x, y });
    };
    scene.onHover = (p, x, y, same) => {
      if (!p || isPhone()) {
        tag.hidden = true;
        return;
      }
      if (!same) {
        const { data: d, month: m } = latest.current;
        const st = stats(d, m);
        tag.textContent =
          p.type === 'floor'
            ? FLOORS[p.i].cats.map((c) => CAT[c].n).join(', ') + ' · ' + Math.round(Math.max(...FLOORS[p.i].cats.map((c) => st.projByCat[c] / Math.max(1, d.settings.budgets[c] || 0))) * 100) + '% budget'
            : p.type === 'roof'
              ? 'Chhat · Bachat'
              : p.type === 'coins'
                ? 'Bachat ke sikke'
                : charName(d.settings.char) + ': tap karo, tip milegi';
      }
      tag.hidden = false;
      tag.style.transform = 'translate(' + (x + 14) + 'px,' + (y + 16) + 'px)';
    };
    scene.setTimeMode(timeMode());
    const hint = takeHint3d()
      ? setTimeout(() => latest.current.toast('Tip: building ke kisi floor pe tap karo, us category ka hisaab dikhega. Character ko tap karo, tip dega. Scroll se zoom, double-tap se reset.', null, 9000), 2500)
      : 0;
    return () => {
      clearTimeout(hint);
      scene.onFrame = scene.onPick = scene.onHover = null;
    };
  }, [scene]);

  // tapping elsewhere or Esc closes the floor card
  useEffect(() => {
    if (!pick) return undefined;
    const onClick = (e) => {
      if (e.target.closest('#pickPop') || e.target === canvasRef.current) return;
      latest.current.closePick();
    };
    const onKey = (e) => e.key === 'Escape' && latest.current.closePick();
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [pick]);

  const ctx = {
    data, mode, month, tab, setTab, filter, setFilter, wi, setWi, full, setFull, scene, info,
    udForm, setUdForm, partId, setPartId, recForm, setRecForm,
    apply, toast, startOwn, openInfo, closeInfo, setMonth,
    onFormFocus: () => isPhone() && !full && setFull(true),
    onFormSubmitted: () => isPhone() && setTimeout(() => setFull(false), 60),
  };

  return (
    <AppContext.Provider value={ctx}>
      <canvas id="cv" ref={canvasRef} aria-label="3D duniya: Paisa Tower aur tumhara character, jo kharche ke hisaab se badalte hain" />
      <TopBar mode={mode} month={month} startMonth={data.settings.startMonth} onMonth={(m) => { setMonth(m); setWi({}); }} />
      <Hud s={s} ws={ws} T={T} wiOn={wiOn} goal={data.settings.goal} />
      <div className="bubble" ref={bubbleRef} style={{ transform: 'translate(-999px,-999px)' }}>
        <em>{charName(char)}</em>
        <span>{bubbleText}</span>
      </div>
      <StatsRow s={s} loans={loans} goal={data.settings.goal} />
      <Dock dockRef={dockRef} />
      <div className="camctl glass" role="group" aria-label="Camera">
        <button aria-label="Zoom in" onClick={() => scene && scene.zoomBy && scene.zoomBy(0.82)}>+</button>
        <button aria-label="Zoom out" onClick={() => scene && scene.zoomBy && scene.zoomBy(1.22)}>−</button>
        <button aria-label="View reset karo" onClick={() => { closePick(); scene && scene.resetView && scene.resetView(); }}>⟲</button>
      </div>
      <button className="focusbtn glass" aria-pressed={focus} aria-label={focus ? 'Panel wapas lao' : 'Sirf duniya dekho'} onClick={() => setFocus(!focus)}>
        {focus ? '☰' : '◎'} <span>{focus ? 'Panel wapas lao' : 'Sirf duniya dekho'}</span>
      </button>
      <Toast toast={toastState} onUndo={() => {
        const u = toastState && toastState.undo;
        setToastState((t) => t && { ...t, undo: null });
        if (u) u();
      }} />
      <InfoPopover info={info} data={data} month={month} onClose={closeInfo} />
      <PickCard pick={pick} data={data} month={month} focus={focus} dockRef={dockRef} onClose={closePick} onGo={goTo} />
      <div className="hovertag" ref={tagRef} hidden />
    </AppContext.Provider>
  );
}
