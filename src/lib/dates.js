export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

export const NOW = new Date();
export const TODAY = ymd(NOW);
export const CUR = TODAY.slice(0, 7);

export const addMonth = (k, n) => {
  const [y, m] = k.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1);
};
export const dim = (k) => {
  const [y, m] = k.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};
export const mName = (k, opt = { month: 'long', year: 'numeric' }) => {
  const [y, m] = k.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', opt);
};
export const mShort = (k) => mName(k, { month: 'short' });

/** "12 Oct" for a YYYY-MM-DD string. */
export const dayMonth = (d) => {
  const [y, m, dd] = d.split('-').map(Number);
  return new Date(y, m - 1, dd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export function dayDiff(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5);
}

export const daysAgo = (n) => ymd(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - n));
export const daysAhead = (n) => ymd(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + n));

export const nextMonthDate = () => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth() + 1, NOW.getDate());
  if (d.getDate() !== NOW.getDate()) d.setDate(0);
  return ymd(d);
};
