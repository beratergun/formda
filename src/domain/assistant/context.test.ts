import { expect, it } from 'vitest';
import { assistantContext, assistantMessages, remainingSuggestions } from './index';
import { scoreHistory } from '../score';
import { defaultPlan, planFor } from '../program';
import { DEFAULT_TARGETS, emptyDay } from '../types';
import { shiftDate } from '../dates';
import { FOODS, DEFAULT_MENU } from '../../data/seed/foods';
import type { AppData } from '../../data/repositories';
const date = '2026-10-29';
function fixture(): AppData {
  return {
    dayLog: [],
    mealEntry: [],
    workoutLog: [],
    food: FOODS,
    recipe: [],
    planSettings: [defaultPlan(date)],
    menuPlan: [DEFAULT_MENU],
    targets: [DEFAULT_TARGETS],
    profile: [],
    quote: [],
    meta: [],
  };
}
it('derives weight loss, sleep adherence, strength gains and low energy from actual history', () => {
  const data = fixture();
  data.dayLog = Array.from({ length: 28 }, (_, i) => ({
    ...emptyDay(shiftDate(date, i - 27)),
    weight: 100 - i * 0.3,
    energy: 1,
    sleepAt: i % 2 ? '23:00' : '00:30',
  }));
  data.workoutLog = [40, 55].map((kg, i) => ({
    id: String(i),
    date: shiftDate(date, i - 5),
    type: 'strength',
    done: true,
    startedAt: i,
    sets: [{ exerciseId: 'leg-press', setNo: 1, kg, reps: 10, done: true }],
  }));
  const result = assistantContext(data, date, { 'leg-press': 'Leg press' });
  expect(result.weeklyLosses).toHaveLength(2);
  expect(result.weeklyLosses[0]).toBeCloseTo(2.1);
  expect(result.insights.join(' ')).toContain('+15 kg');
  expect(result.insights.join(' ')).toContain('6,3 kg');
  expect(result.insights.join(' ')).toContain('5 gecenin 3');
  expect(
    assistantMessages({
      ...result,
      day: data.dayLog.at(-1)!,
      macros: { kcal: 0, protein: 0 },
      targets: DEFAULT_TARGETS,
    })[0],
  ).toContain('Hekim');
});
it('handles absent data, dates in the future, non-increasing strength and weight milestones', () => {
  const data = fixture();
  expect(assistantContext(data, date)).toMatchObject({
    insights: [],
    weeklyLosses: [],
    gapDays: 0,
    recentEnergy: [],
  });
  data.dayLog = [
    { ...emptyDay(shiftDate(date, -2)), weight: 81 },
    { ...emptyDay(date), weight: 79 },
    { ...emptyDay(shiftDate(date, 1)), weight: 70 },
  ];
  expect(assistantContext(data, date).insights[0]).toContain('80 kg');
  data.workoutLog = [40, 40].map((kg, i) => ({
    id: String(i),
    date,
    type: 'strength',
    done: true,
    startedAt: i,
    sets: [{ exerciseId: 'x', setNo: 1, kg, done: true }],
  }));
  expect(assistantContext(data, date).insights.some((x) => x.includes('hareketinde'))).toBe(false);
  data.dayLog = [
    { ...emptyDay(shiftDate(date, -27)), weight: 70 },
    { ...emptyDay(date), weight: 72 },
  ];
  expect(assistantContext(data, date).insights.join()).toContain('arttı');
});
it('celebrates actual streaks and summarizes meals and activity without cross-day leakage', () => {
  const data = fixture();
  data.dayLog = Array.from({ length: 7 }, (_, i) => ({
    ...emptyDay(shiftDate(date, i - 6)),
    boxes: { h: true, s: true, k: true, u: true },
  }));
  data.mealEntry = [
    {
      id: 'm',
      date,
      mealId: 'kahvalti',
      name: 'egg',
      qty: 1,
      unit: 'adet',
      state: 'na',
      photoIds: [],
      createdAt: 0,
      kcal: 72,
      protein: 6.3,
    },
  ];
  data.workoutLog = [{ id: 'w', date, type: 'strength', done: true, startedAt: 0, sets: [] }];
  expect(assistantContext(data, date).insights[0]).toContain('7 günlük');
  const history = scoreHistory(data.dayLog, data.mealEntry, data.workoutLog, DEFAULT_TARGETS);
  expect(history.at(-1)!.score).toBeGreaterThan(history[0].score);
});
it('offers actual edible combinations, excludes raw ingredients and respects remaining energy', () => {
  const egg = FOODS.find((f) => f.id === 'egg')!;
  const foods = [
    { ...egg, id: 'a', favorite: true, state: 'cooked' as const },
    { ...egg, id: 'b', state: 'cooked' as const },
    { ...egg, id: 'raw', state: 'raw' as const },
  ];
  const choices = remainingSuggestions(foods, 144, 12.6);
  expect(choices[0].items).toHaveLength(2);
  expect(choices[0]).toMatchObject({ kcal: 144, protein: 12.6 });
  expect(choices.flatMap((c) => c.items).some((i) => i.food.id === 'raw')).toBe(false);
  expect(remainingSuggestions(foods, 0, 10)).toEqual([]);
  expect(remainingSuggestions(foods, 20, 10)).toEqual([]);
  const apple = FOODS.find((f) => f.id === 'elma')!;
  expect(apple.state).toBe('raw');
  expect(remainingSuggestions([apple], 500, 10).length).toBeGreaterThan(0);
  expect(remainingSuggestions([egg], 500, 10)).toEqual([]);
});
it('includes all named templates and adapts introductory sets to experience and equipment', () => {
  const home = defaultPlan(date, 3, ['ev'], 'experienced');
  expect(Object.keys(home.templates)).toEqual(
    expect.arrayContaining(['A', 'B', 'C', 'swim', 'cardio', 'mobility', 'custom']),
  );
  expect(home.templates.B.some((e) => e.exerciseId === 'cable-row')).toBe(false);
  const monday = shiftDate(date, -3);
  home.startDate = monday;
  expect(planFor(monday, home).exercises[0].sets).toBe(3);
  expect(planFor(monday, { ...home, experience: 'beginner' }).exercises[0].sets).toBe(2);
});
