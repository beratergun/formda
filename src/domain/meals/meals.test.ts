import { describe, it, expect } from 'vitest';
import { resizeMeal, copyMeal, customFood } from './index';
import { weeklySnapshot } from '../report/weekly';
import { calculate } from '../calories';
import { emptyDay, type MealEntry } from '../types';
const entry: MealEntry = {
  id: 'a',
  date: '2026-10-30',
  mealId: 'kahvalti',
  name: 'Snapshot',
  qty: 100,
  unit: 'g',
  state: 'cooked',
  kcal: 200,
  protein: 20,
  carb: 10,
  fat: 5,
  photoIds: ['photo'],
  createdAt: 1,
};
describe('historical meal snapshots', () => {
  it('scales all macros without consulting a mutable catalogue or rounding totals', () => {
    expect(resizeMeal(entry, 150)).toMatchObject({
      kcal: 300,
      protein: 30,
      carb: 15,
      fat: 7.5,
      qty: 150,
      id: 'a',
      photoIds: ['photo'],
      createdAt: 1,
    });
    expect(resizeMeal(resizeMeal(entry, 33.33), 100).kcal).toBeCloseTo(200);
    expect(entry.qty).toBe(100);
  });
  it('preserves unknown nutrients rather than inventing zeros', () => {
    expect(resizeMeal({ ...entry, carb: undefined, fat: undefined }, 150)).toMatchObject({
      carb: undefined,
      fat: undefined,
    });
  });
  it.each([0, -1, NaN, Infinity, 100001])('rejects invalid quantity %s', (qty) =>
    expect(() => resizeMeal(entry, qty)).toThrow(),
  );
  it('does not invent a conversion for a legacy zero quantity', () =>
    expect(() => resizeMeal({ ...entry, qty: 0 }, 100)).toThrow('eski'));
  it('copies nutrition with a fresh identity and no borrowed photos', () => {
    expect(copyMeal(entry, 'b', '2026-10-31', 2)).toEqual({
      ...entry,
      id: 'b',
      date: '2026-10-31',
      photoIds: [],
      createdAt: 2,
    });
    expect(entry.photoIds).toEqual(['photo']);
  });
});
describe('custom food and honest weekly summaries', () => {
  const input = {
    name: '  Etiketli besin  ',
    unit: 'g' as const,
    per: 100,
    kcalPer: 200,
    proteinPer: 20,
    state: 'na' as const,
  };
  it('rejects nonfinite catalogue references, invalid nutrients and overflow instead of returning false totals', () => {
    const food = customFood(input, 'custom');
    expect(() => calculate({ ...food, per: Infinity }, 100)).toThrow();
    expect(() => calculate({ ...food, kcalPer: NaN }, 100)).toThrow();
    expect(() => calculate({ ...food, proteinPer: -1 }, 100)).toThrow();
    expect(() => calculate({ ...food, kcalPer: 1e308 }, 1e308)).toThrow('sınır');
  });
  it('labels user declarations and preserves missing macros', () => {
    expect(customFood(input, 'custom')).toMatchObject({
      name: 'Etiketli besin',
      sourceKind: 'user',
      sourceId: 'user:custom',
      useCount: 0,
    });
    expect(customFood(input, 'custom').carbPer).toBeUndefined();
  });
  it('rejects empty names and invalid nutrients or reference amounts', () => {
    for (const patch of [
      { name: '' },
      { per: 0 },
      { per: Infinity },
      { kcalPer: NaN },
      { proteinPer: -1 },
    ])
      expect(() => customFood({ ...input, ...patch }, 'x')).toThrow();
  });
  it('averages recorded meal days, not seven fabricated zero days', () => {
    const result = weeklySnapshot(
      '2026-10-30',
      [emptyDay('2026-10-29')],
      [entry, { ...entry, id: 'b', date: '2026-10-29', kcal: 400 }],
      [],
    );
    expect(result.averageKcal).toBe(300);
    expect(result.mealDays).toBe(2);
    expect(result.weightChange).toBeUndefined();
  });
  it('leaves empty averages absent and includes only completed sessions in the range', () => {
    const result = weeklySnapshot(
      '2026-10-30',
      [],
      [],
      [{ id: 'w', date: '2026-10-30', type: 'strength', startedAt: 1, sets: [], done: false }],
    );
    expect(result.averageKcal).toBeUndefined();
    expect(result.sessions).toBe(0);
  });
  it('uses actual manual or health weights in date order, without future/out-of-range points', () => {
    const result = weeklySnapshot(
      '2026-10-30',
      [
        { ...emptyDay('2026-10-30'), weight: 79 },
        { ...emptyDay('2026-10-25'), health: { weight: 80, syncedAt: 1, sources: [] } },
        { ...emptyDay('2026-10-31'), weight: 78 },
        { ...emptyDay('2026-10-20'), weight: 82 },
      ],
      [],
      [],
    );
    expect(result.weights.map((w) => w.value)).toEqual([80, 79]);
    expect(result.weightChange).toBe(-1);
  });
});
