import type { DayLog, WaterEntry } from '../types';
export const GLASS_ML = 250;
type WaterDay = Pick<DayLog, 'water' | 'waterBaseMl' | 'waterEntries'>;
export function validWaterLedger(day: WaterDay) {
  if (day.waterBaseMl === undefined && day.waterEntries === undefined)
    return Number.isFinite(day.water * GLASS_ML) && day.water >= 0;
  if (
    day.waterBaseMl === undefined ||
    day.waterEntries === undefined ||
    !Number.isFinite(day.waterBaseMl) ||
    day.waterBaseMl < 0
  )
    return false;
  const ids = new Set<string>();
  let ml = day.waterBaseMl;
  for (const entry of day.waterEntries) {
    if (
      !entry.id ||
      ids.has(entry.id) ||
      !Number.isInteger(entry.ml) ||
      entry.ml < 1 ||
      entry.ml > 5000 ||
      !Number.isFinite(entry.createdAt) ||
      entry.createdAt < 0 ||
      entry.createdAt > 8640000000000000
    )
      return false;
    ids.add(entry.id);
    ml += entry.ml;
  }
  return (
    Number.isFinite(ml) &&
    Math.abs(day.water * GLASS_ML - ml) <= Math.max(1e-6, ml * Number.EPSILON * 8)
  );
}
export function waterMl(day: WaterDay) {
  const ml = day.water * GLASS_ML;
  if (!Number.isFinite(ml) || ml < 0) throw new Error('Su toplamı geçersiz.');
  return ml;
}
function ledger(day: DayLog) {
  if (!validWaterLedger(day)) throw new Error('Su geçmişi ve günlük toplam eşleşmiyor.');
  return { base: day.waterBaseMl ?? waterMl(day), entries: day.waterEntries ?? [] };
}
function commit(day: DayLog, base: number, entries: WaterEntry[], now: number): DayLog {
  if (!Number.isFinite(now) || now < 0) throw new Error('Kayıt zamanı geçersiz.');
  const ml = base + entries.reduce((sum, e) => sum + e.ml, 0);
  if (!Number.isFinite(ml) || ml < 0) throw new Error('Su toplamı sayı sınırını aşıyor.');
  return { ...day, waterBaseMl: base, waterEntries: entries, water: ml / GLASS_ML, updatedAt: now };
}
function amount(ml: number) {
  if (!Number.isInteger(ml) || ml < 1 || ml > 5000)
    throw new Error('Miktar 1–5.000 ml arasında bir tam sayı olmalı.');
}
export function addWater(day: DayLog, entry: WaterEntry): DayLog {
  amount(entry.ml);
  if (
    !entry.id ||
    !Number.isFinite(entry.createdAt) ||
    entry.createdAt < 0 ||
    entry.createdAt > 8640000000000000
  )
    throw new Error('Su kaydı geçersiz.');
  const { base, entries } = ledger(day);
  if (entries.some((e) => e.id === entry.id)) return day;
  return commit(day, base, [...entries, { ...entry }], entry.createdAt);
}
export function editWater(day: DayLog, id: string, ml: number, now: number): DayLog {
  amount(ml);
  const { base, entries } = ledger(day);
  if (!entries.some((e) => e.id === id)) throw new Error('Su kaydı bulunamadı.');
  return commit(
    day,
    base,
    entries.map((e) => (e.id === id ? { ...e, ml } : e)),
    now,
  );
}
export function removeWater(day: DayLog, id: string, now: number): DayLog {
  const { base, entries } = ledger(day);
  if (!entries.some((e) => e.id === id)) return day;
  return commit(
    day,
    base,
    entries.filter((e) => e.id !== id),
    now,
  );
}
export function editWaterBase(day: DayLog, ml: number, now: number): DayLog {
  if (!Number.isFinite(ml) || ml < 0)
    throw new Error('Önceki toplam geçerli ve negatif olmayan bir sayı olmalı.');
  return commit(day, ml, ledger(day).entries, now);
}
