import { useEffect, useLayoutEffect, useRef } from 'react';
import { explain } from '../lib/explain.js';

export default function InfoPopover({ info, data, month, onClose }) {
  const ref = useRef(null);
  const e = info ? explain(info.key, data, month) : null;

  useLayoutEffect(() => {
    if (!e) return;
    const pop = ref.current;
    const br = info.el.getBoundingClientRect();
    const pr = pop.getBoundingClientRect();
    const x = Math.max(12, Math.min(innerWidth - pr.width - 12, br.left + br.width / 2 - pr.width / 2));
    let y = br.top - pr.height - 10;
    if (y < 12) y = Math.min(innerHeight - pr.height - 12, br.bottom + 10);
    pop.style.left = x + 'px';
    pop.style.top = Math.max(12, y) + 'px';
    pop.querySelector('.info-x').focus({ preventScroll: true });
  }, [e, info]);

  useEffect(() => {
    if (!info) return undefined;
    const close = (refocus) => {
      onClose();
      if (refocus) info.el.focus();
    };
    const onClick = (ev) => {
      if (ev.target.closest('.info-x')) close(true);
      else if (!ref.current.contains(ev.target) && !ev.target.closest('.ib')) close(false);
    };
    const onKey = (ev) => ev.key === 'Escape' && close(true);
    const onResize = () => close(false);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [info, onClose]);

  return (
    <div className="info glass" id="infoPop" role="dialog" hidden={!e} ref={ref} aria-label={e ? e.t + ' kaise calculate hua' : undefined}>
      {e && (
        <>
          <div className="info-h">
            <b>{e.t}</b>
            <button className="info-x" aria-label="Band karo">×</button>
          </div>
          <p className="info-f">{e.f}</p>
          <div className="info-rows">
            {e.rows.map((r, i) => (
              <div key={i} className={'ir' + (r.cls ? ' ' + r.cls : '')}>
                <span className="op">{r.op}</span>
                <span className="l">{r.l}</span>
                <span className="v num">{r.v}</span>
              </div>
            ))}
          </div>
          {e.n && <p className="info-n">{e.n}</p>}
        </>
      )}
    </div>
  );
}
