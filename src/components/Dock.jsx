import { useApp } from '../AppContext.js';
import AddForm from './AddForm.jsx';
import EntriesPanel from '../panels/EntriesPanel.jsx';
import UdhaarPanel from '../panels/UdhaarPanel.jsx';
import ComparePanel from '../panels/ComparePanel.jsx';
import ProjectionPanel from '../panels/ProjectionPanel.jsx';
import WhatIfPanel from '../panels/WhatIfPanel.jsx';
import SetupPanel from '../panels/SetupPanel.jsx';

const TABS = [
  ['entries', 'Entries', EntriesPanel],
  ['udhaar', 'Udhaar', UdhaarPanel],
  ['compare', 'Comparison', ComparePanel],
  ['proj', 'Projection', ProjectionPanel],
  ['whatif', 'What-if', WhatIfPanel],
  ['setup', 'Setup', SetupPanel],
];

export default function Dock({ dockRef }) {
  const { mode, tab, setTab, full, setFull, startOwn, closeInfo } = useApp();
  const Panel = TABS.find(([id]) => id === tab)[2];

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = TABS.findIndex(([id]) => id === tab);
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length][0];
    setTab(next);
    document.getElementById('tab-' + next)?.focus();
  };

  return (
    <aside className={'dock glass' + (full ? ' full' : '')} id="dock" aria-label="Kharcha panel" ref={dockRef}>
      <button className="handle" aria-label="Panel bada ya chhota karo" aria-expanded={full} onClick={() => setFull(!full)}><i></i></button>
      <div className="dock-scroll" onScroll={closeInfo}>
        <div className="banner" hidden={mode !== 'demo'}>
          <p><b>Yeh example data hai.</b> Pehli entry add karte hi tumhara apna data shuru ho jaayega. Income aur goal Setup tab mein set karo.</p>
          <button className="btn sm" onClick={() => startOwn(false)}>Apna data shuru karo</button>
        </div>
        <AddForm />
        <div className="tablist" role="tablist" aria-label="Tools" onKeyDown={onKeyDown}>
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" id={'tab-' + id} aria-selected={tab === id} aria-controls={'p-' + id} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        <div className="panel" role="tabpanel" id={'p-' + tab} aria-labelledby={'tab-' + tab}>
          <Panel />
        </div>
      </div>
    </aside>
  );
}
