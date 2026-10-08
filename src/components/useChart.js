import { useLayoutEffect, useRef, useState } from 'react';

/** Width tracking + pointer tooltip plumbing shared by the SVG charts. */
export function useChart() {
  const boxRef = useRef(null);
  const svgRef = useRef(null);
  const [W, setW] = useState(520);
  const [tip, setTip] = useState(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    const measure = () => setW(Math.max(260, Math.floor((el.clientWidth || 520) - 20)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** getTip(x, y) -> { x, y, content, ...extra } | null, in svg coordinates. */
  const track = (getTip) => (ev) => {
    const r = svgRef.current.getBoundingClientRect();
    const res = getTip(ev.clientX - r.left, ev.clientY - r.top);
    if (!res) {
      setTip(null);
      return;
    }
    const br = boxRef.current.getBoundingClientRect();
    const left = Math.max(70, Math.min(br.width - 70, r.left - br.left + res.x));
    setTip({ ...res, left, top: r.top - br.top + res.y });
  };
  const hide = () => setTip(null);
  return { boxRef, svgRef, W, tip, track, hide };
}
