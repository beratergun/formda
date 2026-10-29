import type { DayLog, Food, Macros, Targets } from '../types';
import { calculate } from '../calories';
import { average } from '../tdee';

export interface AssistantInput { day: DayLog; macros: Macros; targets: Targets; gapDays?: number; weeklyLosses?: number[]; recentEnergy?: number[] }
export interface AssistantProvider { messages(input: AssistantInput): string[] }
export function assistantMessages({ day, macros, targets, gapDays = 0, weeklyLosses = [], recentEnergy = [] }: AssistantInput) {
  const result: string[] = [];
  if (weeklyLosses.slice(-2).length === 2 && weeklyLosses.slice(-2).every(x => x > 1.5) || recentEnergy.length >= 3 && average(recentEnergy.slice(-3)) <= 2) result.push('Hekim/diyetisyeninle konuşmak iyi olur.');
  if (gapDays >= 2) result.push('Kaldığın yerden devam: bugün tek öğün yazmak yeter.');
  if (macros.kcal > targets.kcal) result.push('Sorun değil, yarın plana dön; açlıkla telafi etme.');
  const boxes = Object.values(day.boxes).filter(Boolean).length;
  if (boxes === 4 && macros.protein >= targets.protein) result.push('Bugün çok iyi gittin: 4/4 kutu ve protein hedefi tamam.');
  else if (macros.protein < targets.protein) result.push(`Protein hedefine ${Math.ceil(targets.protein - macros.protein)} g kaldı.`);
  if (day.water < targets.water) result.push(`Su hedefine ${targets.water - day.water} bardak kaldı.`);
  if (!result.length) result.push('Kendi ritminde devam et. Bugünkü emeğin kıymetli.');
  return result.slice(0, 4);
}
export class LocalAssistant implements AssistantProvider { messages(input: AssistantInput) { return assistantMessages(input); } }
export function remainingSuggestions(foods: Food[], kcal: number, protein: number) {
  if (kcal <= 0 || protein <= 0) return [];
  const candidates = foods.filter(f => f.proteinPer > 0).sort((a, b) => Number(b.favorite || false) - Number(a.favorite || false) || b.useCount - a.useCount).slice(0, 40);
  return candidates.map(food => { const qty = food.portions[0]?.qty || food.per; const macros = calculate(food, qty); return { food, qty, ...macros, fit: Math.abs(kcal - macros.kcal) / kcal + Math.abs(protein - macros.protein) / protein }; }).filter(x => x.kcal <= kcal + 50).sort((a, b) => a.fit - b.fit).slice(0, 3);
}
export interface FoodRecognizer { recognize(image: Blob): Promise<never[]> }
export class NoopRecognizer implements FoodRecognizer { async recognize() { return []; } }
