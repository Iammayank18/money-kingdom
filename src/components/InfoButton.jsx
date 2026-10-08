import { useId } from 'react';
import { useApp } from '../AppContext.js';

/** The little (i) that opens the "kaise calculate hua" popover. */
export default function InfoButton({ k, label, style }) {
  const id = useId();
  const { info, openInfo } = useApp();
  return (
    <button
      className="ib"
      style={style}
      aria-label={'Kaise calculate hua: ' + label}
      aria-expanded={!!info && info.id === id}
      onClick={(e) => openInfo(k, id, e.currentTarget)}
    >
      i
    </button>
  );
}
