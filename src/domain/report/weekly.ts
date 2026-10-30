import type { DayLog, MealEntry, WorkoutLog } from '../types';
import { dateDiff } from '../dates';
import { total } from '../calories';

export function weeklySnapshot(
  date: string,
  days: DayLog[],
  meals: MealEntry[],
  workouts: WorkoutLog[],
) {
  const within = (d: string) => dateDiff(date, d) >= 0 && dateDiff(date, d) < 7;
  const recordedMeals = meals.filter((m) => within(m.date));
  const mealDays = new Set(recordedMeals.map((m) => m.date)).size;
  const macros = total(recordedMeals);
  const weights = days
    .filter((d) => within(d.date) && (d.weight ?? d.health?.weight) !== undefined)
    .map((d) => ({ date: d.date, value: (d.weight ?? d.health?.weight)! }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    mealDays,
    averageKcal: mealDays ? macros.kcal / mealDays : undefined,
    averageProtein: mealDays ? macros.protein / mealDays : undefined,
    sessions: workouts.filter((w) => within(w.date) && w.done && w.type !== 'rest').length,
    weights,
    weightChange: weights.length >= 2 ? weights.at(-1)!.value - weights[0].value : undefined,
  };
}
