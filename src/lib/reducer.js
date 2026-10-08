import { CUR } from './dates.js';
import { makeDemo, freshState } from './demo.js';

/**
 * App data lives here: { data: { settings, months, loans }, mode: 'demo' | 'local' }.
 * Every action returns new objects; nothing is mutated. In demo mode, the first write
 * converts the example data into the user's own (blank) data, as the original app did.
 */
export const initState = (stored) =>
  stored
    ? { data: { settings: stored.settings, months: stored.months || {}, loans: Array.isArray(stored.loans) ? stored.loans : [] }, mode: 'local' }
    : { data: makeDemo(), mode: 'demo' };

const own = (state) => (state.mode === 'demo' ? { data: freshState(state.data), mode: 'local' } : state);
const withData = (state, patch) => ({ ...state, data: { ...state.data, ...patch } });
const withSettings = (state, patch) => withData(state, { settings: { ...state.data.settings, ...patch } });

export function reducer(state, a) {
  switch (a.type) {
    case 'startOwn':
      return { data: freshState(state.data), mode: 'local' };

    case 'addTx': {
      const s = own(state);
      const { mk, item } = a;
      let next = withData(s, { months: { ...s.data.months, [mk]: [...(s.data.months[mk] || []), item] } });
      if (mk < s.data.settings.startMonth) next = withSettings(next, { startMonth: mk });
      return next;
    }
    case 'removeTx': {
      const arr = state.data.months[a.mk] || [];
      return withData(state, { months: { ...state.data.months, [a.mk]: arr.filter((x) => x.id !== a.id) } });
    }

    // Edits to example data apply in memory only (never persisted), same as the original app.
    case 'setNumber': // income / goal
      return withSettings(state, { [a.key]: a.value });
    case 'setBudget':
      return withSettings(state, { budgets: { ...state.data.settings.budgets, [a.id]: a.value } });
    case 'setChar':
      return withSettings(state, { char: a.id });
    case 'addRecurring': {
      const s = own(state);
      return withSettings(s, { recurring: [...s.data.settings.recurring, a.item] });
    }
    case 'delRecurring':
      return withSettings(state, { recurring: state.data.settings.recurring.filter((r) => r.id !== a.id) });

    case 'setLoans':
      return withData(own(state), { loans: a.loans });

    case 'restore':
      return { data: a.data, mode: 'local' };
    case 'reset':
      return { data: makeDemo(), mode: 'demo' };
    default:
      return state;
  }
}

/** Keeps the viewed month inside [startMonth, current month]. */
export function clampMonth(month, data) {
  if (month > CUR) return CUR;
  if (month < data.settings.startMonth && month < CUR) return data.settings.startMonth;
  return month;
}
