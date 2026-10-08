export function ticks(top) {
  const m = top / Math.pow(10, Math.floor(Math.log10(top)));
  return Math.abs(m - 2) < 1e-9 ? 4 : 5;
}

export function niceMax(v) {
  if (v <= 0) return 1000;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}
