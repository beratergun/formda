import type { Food, Macros, Recipe } from '../types';

export function calculate(food: Food, qty: number): Macros {
  if (!Number.isFinite(qty) || qty < 0 || food.per <= 0) throw new Error('Miktar geçerli ve sıfırdan büyük olmalı.');
  const factor = qty / food.per;
  return { kcal: food.kcalPer * factor, protein: food.proteinPer * factor, ...(food.carbPer === undefined ? {} : { carb: food.carbPer * factor }), ...(food.fatPer === undefined ? {} : { fat: food.fatPer * factor }) };
}
export function total(items: Macros[]): Macros {
  return items.reduce<Macros>((a, b) => ({ kcal: a.kcal + b.kcal, protein: a.protein + b.protein, ...(a.carb === undefined || b.carb === undefined ? {} : { carb: a.carb + b.carb }), ...(a.fat === undefined || b.fat === undefined ? {} : { fat: a.fat + b.fat }) }), { kcal: 0, protein: 0, carb: 0, fat: 0 });
}
export function recipeFood(recipe: Recipe, foods: Food[]): Food {
  if (recipe.cookedWeightG <= 0 || recipe.servings <= 0) throw new Error('Pişmiş ağırlık ve porsiyon sayısı gerekli.');
  const values = total(recipe.ingredients.map(i => { const food = foods.find(f => f.id === i.foodId); if (!food) throw new Error('Malzeme bulunamadı.'); return calculate(food, i.qty); }));
  return { id: recipe.id, name: recipe.name, aliases: [], unit: 'g', per: recipe.cookedWeightG, kcalPer: values.kcal, proteinPer: values.protein, carbPer: values.carb, fatPer: values.fat, state: 'cooked', source: 'Kendi tarifin · girilen malzemelerden hesaplandı', portions: [{ label: 'porsiyon', qty: recipe.cookedWeightG / recipe.servings }], useCount: 0 };
}
