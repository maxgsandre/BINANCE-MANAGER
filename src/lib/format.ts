import { endOfMonth, format, startOfMonth } from 'date-fns';

export function fmtCurrencyBRL(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num || 0);
}

export function fmtPct(value: number | string): string {
  const num = typeof value === 'string' ? Number(value) : value;
  return `${(num || 0) * 100} %`;
}

export function monthRange(monthYYYYMM: string): { start: Date; end: Date; label: string } {
  const [y, m] = monthYYYYMM.split('-').map((v) => Number(v));
  const first = startOfMonth(new Date(y, m - 1, 1));
  const end = endOfMonth(first);
  return { start: first, end, label: format(first, 'yyyy-MM') };
}


