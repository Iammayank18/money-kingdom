import { useEffect, useState } from 'react';

/** `toast` is { id, msg, undo?, ms? } or null. A new id restarts the timer. */
export default function Toast({ toast, onUndo }) {
  const [show, setShow] = useState(false);
  const id = toast && toast.id;
  const ms = toast && (toast.ms || (toast.undo ? 5500 : 3200));
  useEffect(() => {
    if (id == null) return undefined;
    setShow(true);
    const t = setTimeout(() => setShow(false), ms);
    return () => clearTimeout(t);
  }, [id, ms]);
  return (
    <div className={'toast' + (show ? ' show' : '')} id="toast" role="status" aria-live="polite">
      <span>{toast && toast.msg}</span>
      <button
        hidden={!(toast && toast.undo)}
        onClick={() => {
          setShow(false);
          onUndo();
        }}
      >
        Undo
      </button>
    </div>
  );
}
