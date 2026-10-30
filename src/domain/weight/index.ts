import { emptyDay, type DayLog } from '../types';

export function validWeightDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
export function writeWeight(
  logs: DayLog[],
  date: string,
  weight: number | undefined,
  now: number,
  today: string,
) {
  if (!validWeightDate(date) || date > today)
    throw new Error('Geçerli ve gelecekte olmayan bir tarih seç.');
  if (weight !== undefined && (!Number.isFinite(weight) || weight < 30 || weight > 400))
    throw new Error('Kilo 30–400 kg arasında olmalı.');
  if (!Number.isFinite(now) || now < 0) throw new Error('Kayıt zamanı geçersiz.');
  const existing = logs.find((d) => d.date === date);
  if (!existing && weight === undefined) return logs;
  const next = { ...(existing ?? emptyDay(date)), weight, updatedAt: now };
  return [...logs.filter((d) => d.date !== date), next];
}
