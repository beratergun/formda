import type { Food, MealEntry } from '../types';

/** Scale the recorded snapshot, never today's potentially changed food catalogue. */
export function resizeMeal(entry: MealEntry, qty: number): MealEntry {
  if (!Number.isFinite(qty) || qty <= 0 || qty > 100000)
    throw new Error('Miktar 0 ile 100.000 arasında olmalı.');
  if (!Number.isFinite(entry.qty) || entry.qty <= 0)
    throw new Error('Bu eski kaydın miktarı yok; yeni bir kalem ekleyebilirsin.');
  const factor = qty / entry.qty;
  const result = {
    ...entry,
    qty,
    kcal: entry.kcal * factor,
    protein: entry.protein * factor,
    ...(entry.carb === undefined ? {} : { carb: entry.carb * factor }),
    ...(entry.fat === undefined ? {} : { fat: entry.fat * factor }),
  };
  if (
    ![result.kcal, result.protein, result.carb ?? 0, result.fat ?? 0].every(
      (n) => Number.isFinite(n) && n >= 0,
    )
  )
    throw new Error('Bu kaydın besin değerleri geçersiz.');
  return result;
}
export function copyMeal(entry: MealEntry, id: string, date: string, now: number): MealEntry {
  return { ...entry, id, date, photoIds: [], createdAt: now };
}
export function customFood(
  input: Pick<
    Food,
    'name' | 'unit' | 'per' | 'kcalPer' | 'proteinPer' | 'carbPer' | 'fatPer' | 'state'
  >,
  id: string,
): Food {
  if (!input.name.trim() || input.name.trim().length > 120)
    throw new Error('Besin adı 1–120 karakter olmalı.');
  if (!Number.isFinite(input.per) || input.per <= 0 || input.per > 100000)
    throw new Error('Referans miktarı geçersiz.');
  if (
    ![input.kcalPer, input.proteinPer, input.carbPer ?? 0, input.fatPer ?? 0].every(
      (n) => Number.isFinite(n) && n >= 0,
    )
  )
    throw new Error('Besin değerleri geçerli ve negatif olmayan sayılar olmalı.');
  return {
    ...input,
    id,
    name: input.name.trim(),
    aliases: [],
    source: 'Kullanıcı beyanı · kendi etiketi veya ölçümü',
    sourceKind: 'user',
    sourceId: `user:${id}`,
    portions: [{ label: 'referans porsiyon', qty: input.per }],
    useCount: 0,
  };
}
