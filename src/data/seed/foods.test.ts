import { it, expect } from 'vitest';
import { FOODS, TURKISH_RECIPES, DEFAULT_MENU, LEGACY_FOODS } from './foods';
import fixture from './usda-source-fixture.json';
import { calculate, total, recipeFood } from '../../domain/calories';
it('matches at least thirty common foods to independently extracted official nutrient records', () => {
  expect(fixture.length).toBeGreaterThanOrEqual(30);
  for (const source of fixture) {
    const food = FOODS.find((f) => f.id === source.id)!;
    expect(food.sourceId).toBe(source.sourceId);
    expect(food.kcalPer, source.description).toBe(source.kcal);
    expect(food.proteinPer, source.description).toBe(source.protein);
  }
});
it('gives every catalog record a source identifier and explicit preparation state', () => {
  expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
  for (const food of FOODS) {
    expect(food.sourceId, food.id).toBeTruthy();
    expect(food.sourceKind, food.id).not.toBe('legacy');
    expect(['raw', 'cooked', 'na']).toContain(food.state);
    expect(Number.isFinite(food.kcalPer)).toBe(true);
    if (/\braw\b/i.test(food.sourceDescription || '')) expect(food.state, food.id).toBe('raw');
    else if (/\bcooked\b/i.test(food.sourceDescription || ''))
      expect(food.state, food.id).toBe('cooked');
  }
});
it('recalculates at least 150 Turkish recipes from traceable ingredient quantities without intermediate rounding', () => {
  expect(TURKISH_RECIPES.length).toBeGreaterThanOrEqual(150);
  for (const recipe of TURKISH_RECIPES) {
    const food = FOODS.find((f) => f.id === recipe.id)!;
    const computed = recipeFood(recipe, FOODS);
    expect(calculate(food, 100).kcal).toBeCloseTo(calculate(computed, 100).kcal, 10);
    expect(calculate(food, 100).protein).toBeCloseTo(calculate(computed, 100).protein, 10);
    expect(food.portions.some((p) => p.label.startsWith('1 porsiyon') && p.qty > 0)).toBe(true);
    for (const i of recipe.ingredients)
      expect(FOODS.find((f) => f.id === i.foodId)?.sourceId).toMatch(/^fdc:/);
  }
});
it('keeps the historical reference menu separate from corrected future catalog calculations', () => {
  const historical = total(
    Object.values(DEFAULT_MENU.days[0]).flatMap((meal) =>
      meal.items.map((i) =>
        calculate(
          LEGACY_FOODS.find((f) => f.id === i.foodId)!,
          i.qty,
        ),
      ),
    ),
  );
  expect(historical.kcal).toBe(1458.5);
  const current = total(
    Object.values(DEFAULT_MENU.days[0]).flatMap((meal) =>
      meal.items.map((i) =>
        calculate(
          FOODS.find((f) => f.id === i.foodId)!,
          i.qty,
        ),
      ),
    ),
  );
  expect(current.kcal).not.toBe(historical.kcal);
  const expected = [1465.1, 1502.9666666666665, 1531.65, 1467.05, 1464.05, 1455.575, 1455.15];
  DEFAULT_MENU.days.forEach((day, index) => {
    const value = total(
      Object.values(day).flatMap((meal) =>
        meal.items.map((i) =>
          calculate(
            FOODS.find((f) => f.id === i.foodId)!,
            i.qty,
          ),
        ),
      ),
    );
    expect(value.kcal).toBeCloseTo(expected[index], 9);
  });
});
