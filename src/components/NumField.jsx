import { useEffect, useRef, useState } from 'react';
import { cleanNum } from '../lib/format.js';

/**
 * Digit-only input. Keeps its own text so the field can be emptied while typing
 * (the parent may ignore '' and keep its last valid number). If the parent later
 * passes a value that differs from what this field last reported, the field follows it.
 */
export default function NumField({ value, onChange, day = false, className = 'inp num', ...rest }) {
  const [text, setText] = useState(String(value ?? ''));
  const reported = useRef(text);
  useEffect(() => {
    const v = String(value ?? '');
    if (v !== reported.current) {
      reported.current = v;
      setText(v);
    }
  }, [value]);
  return (
    <input
      {...rest}
      className={className}
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={day ? 2 : 9}
      value={text}
      onChange={(e) => {
        const v = cleanNum(e.target.value, { day });
        reported.current = v;
        setText(v);
        onChange(v);
      }}
    />
  );
}
