import { describe, it, expect } from 'vitest';
import { inr, inrC, cleanNum, parseAmt } from '../src/lib/format.js';
import { addMonth, dim, CUR } from '../src/lib/dates.js';
import { makeDemo, freshState } from '../src/lib/demo.js';
import { stats, monthItems, tier } from '../src/lib/calc.js';
import { reducer, initState, clampMonth } from '../src/lib/reducer.js';
import { loanSum, leftOf, dueChip } from '../src/lib/loans.js';
import { parseBackup, backupText, csvText } from '../src/lib/backup.js';
import { explain } from '../src/lib/explain.js';

describe('format', () => {
  it('formats rupees in en-IN grouping with a real minus', () => {
    expect(inr(1234567)).toBe('₹12,34,567');
    expect(inr(-500)).toBe('−₹500');
  });
  it('compacts amounts', () => {
    expect(inrC(950)).toBe('₹950');
    expect(inrC(2500)).toBe('₹2.5k');
    expect(inrC(150000)).toBe('₹1.5L');
  });
  it('keeps number fields digit-only', () => {
    expect(cleanNum('0012a3')).toBe('123');
    expect(cleanNum('45', { day: true })).toBe('31');
    expect(parseAmt('450')).toBe(450);
    expect(parseAmt('4.5')).toBeNaN();
  });
});

describe('dates', () => {
  it('rolls months over year boundaries', () => {
    expect(addMonth('2026-12', 1)).toBe('2027-01');
    expect(addMonth('2026-01', -1)).toBe('2025-12');
    expect(dim('2024-02')).toBe(29);
  });
});

describe('stats', () => {
  const data = makeDemo();
  it('derives budget as income − goal and health in [0,1]', () => {
    const s = stats(data, CUR);
    expect(s.budget).toBe(data.settings.income - data.settings.goal + s.extraInc);
    expect(s.health).toBeGreaterThanOrEqual(0);
    expect(s.health).toBeLessThanOrEqual(1);
    expect(s.projected).toBeGreaterThanOrEqual(s.spent);
  });
  it('adds recurring items as auto entries once due', () => {
    expect(monthItems(data, addMonth(CUR, -1)).some((i) => i.auto)).toBe(true);
  });
  it('what-if raising a category raises the projection', () => {
    const base = stats(data, CUR);
    expect(stats(data, CUR, { food: 50 }).projected).toBeGreaterThan(base.projected);
    expect(stats(data, CUR, { food: -50 }).projected).toBeLessThan(base.projected);
  });
  it('maps health to tiers', () => {
    expect(tier(0.9).t).toBe('Mazboot');
    expect(tier(0.1).t).toBe('Building gir rahi!');
  });
});

describe('reducer', () => {
  const item = { id: 'x1', d: CUR + '-01', a: 100, c: 'food', n: 'chai', t: 'e' };
  it('first write in demo mode starts blank own data, without mutating the demo', () => {
    const s0 = initState(null);
    const frozen = JSON.stringify(s0);
    const s1 = reducer(s0, { type: 'addTx', mk: CUR, item });
    expect(s1.mode).toBe('local');
    expect(s1.data.months[CUR]).toEqual([item]);
    expect(s1.data.loans).toEqual([]);
    expect(JSON.stringify(s0)).toBe(frozen);
  });
  it('adding an older entry moves startMonth back', () => {
    const s = reducer(initState(null), { type: 'startOwn' });
    const old = addMonth(CUR, -3);
    const s2 = reducer(s, { type: 'addTx', mk: old, item: { ...item, d: old + '-02' } });
    expect(s2.data.settings.startMonth).toBe(old);
  });
  it('remove is immutable and undo-able by re-adding', () => {
    const s1 = reducer(initState(null), { type: 'addTx', mk: CUR, item });
    const s2 = reducer(s1, { type: 'removeTx', mk: CUR, id: 'x1' });
    expect(s2.data.months[CUR]).toEqual([]);
    expect(s1.data.months[CUR]).toEqual([item]);
  });
  it('clamps the viewed month to the data range', () => {
    const d = freshState();
    expect(clampMonth(addMonth(CUR, 2), d)).toBe(CUR);
    expect(clampMonth(addMonth(CUR, -2), d)).toBe(CUR);
  });
});

describe('loans', () => {
  const loans = [
    { id: 'a', dir: 'diya', who: 'A', a: 1000, d: '2026-01-01', due: '', n: '', paid: [{ d: '2026-02-01', a: 400 }] },
    { id: 'b', dir: 'liya', who: 'B', a: 300, d: '2026-01-01', due: '', n: '', paid: [] },
    { id: 'c', dir: 'diya', who: 'C', a: 50, d: '2026-01-01', due: '', n: '', paid: [], closed: true },
  ];
  it('sums open balances per direction and ignores closed', () => {
    expect(leftOf(loans[0])).toBe(600);
    const s = loanSum(loans);
    expect(s.recv).toBe(600);
    expect(s.give).toBe(300);
  });
  it('labels closed loans', () => expect(dueChip(loans[2]).text).toBe('Hisaab barabar'));
});

describe('backup', () => {
  it('round-trips and sanitises', () => {
    const data = reducer(initState(null), { type: 'startOwn' }).data;
    const out = parseBackup(backupText(data));
    expect(out.settings.income).toBe(data.settings.income);
  });
  it('rejects garbage', () => {
    expect(() => parseBackup('{"nope":1}')).toThrow();
    expect(() => parseBackup('not json')).toThrow();
  });
  it('drops invalid entries and coerces unknown categories', () => {
    const base = reducer(initState(null), { type: 'startOwn' }).data;
    const txt = JSON.stringify({ settings: base.settings, months: { '2026-05': [{ d: '2026-05-02', a: 10.4, c: 'zzz', t: 'e' }, { d: 'bad', a: 5 }] } });
    const out = parseBackup(txt);
    expect(out.months['2026-05']).toHaveLength(1);
    expect(out.months['2026-05'][0].c).toBe('other');
  });
  it('quotes CSV cells that contain commas', () => {
    const s = reducer(initState(null), { type: 'addTx', mk: CUR, item: { id: 'q', d: CUR + '-01', a: 5, c: 'food', n: 'a,b', t: 'e' } });
    expect(csvText(s.data)).toContain('"a,b"');
  });
});

describe('explain', () => {
  const data = makeDemo();
  it('has breakdowns for every info key', () => {
    for (const k of ['spent', 'left', 'daily', 'proj', 'health', 'loan', 'save12', 'avg']) {
      const e = explain(k, data, CUR);
      expect(e && e.rows.length).toBeGreaterThan(0);
    }
    expect(explain('nope', data, CUR)).toBeNull();
  });
});

describe('reducer: loans', () => {
  const loan = { id: 'L9', dir: 'diya', who: 'Z', a: 100, d: '2026-01-01', due: '', n: '', paid: [] };
  it('updateLoans from demo starts own data with just the new loan', () => {
    const s = reducer(initState(null), { type: 'updateLoans', fn: (ls) => [...ls, loan] });
    expect(s.mode).toBe('local');
    expect(s.data.loans).toEqual([loan]);
  });
  it('undo of one loan change leaves later changes alone', () => {
    let s = reducer(initState(null), { type: 'updateLoans', fn: (ls) => [...ls, loan] });
    s = reducer(s, { type: 'updateLoans', fn: (ls) => [...ls, { ...loan, id: 'L10' }] });
    s = reducer(s, { type: 'updateLoans', fn: (ls) => ls.filter((x) => x.id !== 'L9') });
    expect(s.data.loans.map((l) => l.id)).toEqual(['L10']);
  });
});
