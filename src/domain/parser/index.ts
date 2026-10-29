import type { Food, FoodState } from '../types';

export const normalize = (value: string) => value.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s.,]/g, ' ').replace(/\s+/g, ' ').trim();
function distance(a: string, b: string) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) { const next = [i]; for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); row = next; }
  return row[b.length];
}
export function searchFoods(query: string, foods: Food[], state?: FoodState) {
  const needle = normalize(query);
  return foods.filter(f => !state || f.state === state).map(food => {
    const labels = [food.name, ...food.aliases].map(normalize);
    const relevance = Math.max(...labels.map(label => label === needle ? 100 : label.startsWith(needle) ? 75 : label.includes(needle) ? 60 : needle.length >= 4 && distance(label, needle) <= Math.max(1, Math.floor(needle.length / 5)) ? 40 : 0));
    return { food, relevance };
  }).filter(x => !needle || x.relevance > 0).sort((a, b) => b.relevance - a.relevance || (b.food.lastUsedAt || 0) - (a.food.lastUsedAt || 0) || Number(b.food.favorite || false) - Number(a.food.favorite || false) || b.food.useCount - a.food.useCount).map(x => x.food);
}
export interface ParsedFood { text: string; food?: Food; qty: number; state?: FoodState; issue?: string }
const numbers: Record<string, number> = { bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10, yarim: 0.5, ceyrek: 0.25 };
export function parseMeal(input: string, foods: Food[]): ParsedFood[] {
  return input.split(/(?<!\d),|,(?!\d)|[;\n]+|\s+ve\s+/).filter(x => x.trim()).map(text => {
    let rest = normalize(text);
    if (/^\s*-/.test(text)) return { text, qty: 0, issue: 'Miktar pozitif olmalı.' };
    const numberMatch = /^(\d+(?:[.,]\d+)?|bir|iki|uc|dort|bes|alti|yedi|sekiz|dokuz|on|yarim|ceyrek)\s*/.exec(rest);
    const amount = numberMatch ? numbers[numberMatch[1]] ?? Number(numberMatch[1].replace(',', '.')) : 1;
    rest = rest.slice(numberMatch?.[0].length || 0);
    const unitMatch = /^(gr|gram|g|ml|adet|dilim|kase|bardak|kasik|porsiyon|kepce|olcek)\b\s*/.exec(rest);
    const unit = unitMatch?.[1]; rest = rest.slice(unitMatch?.[0].length || 0);
    const state: FoodState | undefined = /\bcig\b/.test(rest) ? 'raw' : /\b(pismis|haslanmis|firin)\b/.test(rest) ? 'cooked' : undefined;
    rest = rest.replace(/\b(cig|pismis|haslanmis|firin)\b/g, '').replace(/\s+/g, ' ').trim();
    const matches = searchFoods(rest, foods, state);
    const food = matches[0];
    if (!food) return { text, qty: amount, state, issue: 'Eşleşmedi, seç' };
    let qty = amount;
    if (unit && !['gr', 'gram', 'g', 'ml'].includes(unit)) {
      if (unit !== food.unit) { const portion = food.portions.find(p => normalize(p.label).includes(unit)); if (!portion) return { text, food, qty, state, issue: 'Bu porsiyonun gramajını seç.' }; qty *= portion.qty; }
    } else if (!unit && food.unit !== 'adet') qty *= food.portions[0]?.qty ?? 100;
    if (unit === 'ml' && food.unit === 'g' || ['g', 'gr', 'gram'].includes(unit || '') && food.unit === 'ml') return { text, food, qty, state, issue: 'Birim için uygun yiyeceği seç.' };
    if (amount <= 0 || !Number.isFinite(qty)) return { text, qty: 0, issue: 'Miktar pozitif olmalı.' };
    return { text, food, qty, state: state || food.state, ...(!state && ['raw', 'cooked'].includes(food.state) && foods.some(f => f.id !== food.id && normalize(f.name.split('(')[0]) === normalize(food.name.split('(')[0]) && f.state !== food.state) ? { issue: 'Çiğ veya pişmiş hâlini doğrula.' } : {}) };
  });
}
