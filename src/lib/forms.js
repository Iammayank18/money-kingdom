import { TODAY, nextMonthDate } from './dates.js';

export const blankLoanForm = (dir) => ({ dir, who: '', a: '', d: TODAY, due: nextMonthDate(), n: '' });
export const blankRecForm = () => ({ n: '', a: '', c: 'bills', d: '' });
