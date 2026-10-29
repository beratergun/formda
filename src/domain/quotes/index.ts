import type { Quote } from '../types';

export function selectQuote(date: string, quotes: Quote[], category = 'genel', offset = 0) {
  const pool = quotes.filter((q) => q.category === category || q.custom);
  const available = pool.length ? pool : quotes;
  const hash = [...date].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  return available.length ? available[(hash + offset) % available.length] : undefined;
}
