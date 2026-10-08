export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const inr = (n) => (n < 0 ? '−' : '') + '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN');

export const inrC = (n) => {
  const a = Math.abs(n);
  const s = n < 0 ? '−' : '';
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(a % 1e5 < 500 ? 0 : 1).replace(/\.0$/, '') + 'L';
  if (a >= 1000) return s + '₹' + (a / 1000).toFixed(a < 1e4 && a % 1000 >= 50 ? 1 : 0).replace(/\.0$/, '') + 'k';
  return s + '₹' + Math.round(a);
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function mulberry(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Digits only, no leading zeros, capped length. `day` mode caps at 31. */
export function cleanNum(raw, { day = false, max = 9 } = {}) {
  let v = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, day ? 2 : max);
  if (day && +v > 31) v = '31';
  return v;
}

export function parseAmt(v) {
  const s = String(v).trim();
  return /^\d+$/.test(s) ? parseInt(s, 10) : NaN;
}
