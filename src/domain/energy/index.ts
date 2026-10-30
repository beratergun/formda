import type { DayLog, Profile, WorkoutLog } from '../types';
// 2024 Adult Compendium: https://pacompendium.com/conditioning-exercise/
// https://pacompendium.com/water-activities/ · https://pacompendium.com/walking/
export const MET = {
  strength: { value: 3.5, code: '02054' },
  vigorousStrength: { value: 6, code: '02050' },
  swim: { value: 5.8, code: '18240' },
  cardio: { value: 5, code: '02048' },
  recovery: { value: 2.3, code: '02101' },
  rest: { value: 1, code: '07021' },
} as const;
export function workoutEnergy(workout: WorkoutLog, weight: number) {
  const minutes = Math.max(
    0,
    Math.min(24 * 60, ((workout.endedAt || workout.startedAt) - workout.startedAt) / 60000),
  );
  if (!workout.done || !Number.isFinite(weight) || weight <= 0 || workout.type === 'rest')
    return { gross: 0, active: 0, minutes, met: 0 };
  let met: number = MET[workout.type].value;
  if (workout.type === 'strength' && workout.sets.some((s) => s.done)) {
    const sets = workout.sets.filter((s) => s.done);
    const workMinutes = Math.min(
      minutes,
      sets.reduce((sum, s) => sum + (s.seconds || (s.reps || 0) * 3), 0) / 60,
    );
    const exertion = sets.reduce((sum, s) => sum + (s.rpe ?? workout.rpe ?? 7), 0) / sets.length;
    const workMet = exertion >= 8 ? MET.vigorousStrength.value : MET.strength.value;
    // Rep tempo, RPE and unrecorded rest are local heuristics, not Compendium measurements.
    met = minutes ? (workMet * workMinutes + 1.3 * (minutes - workMinutes)) / minutes : 0;
  }
  return {
    gross: (met * weight * minutes) / 60,
    active: (Math.max(0, met - 1) * weight * minutes) / 60,
    minutes,
    met,
  };
}
export function stepEnergy(steps: number, heightCm: number, weight: number) {
  if (
    ![steps, heightCm, weight].every(Number.isFinite) ||
    steps <= 0 ||
    heightCm <= 0 ||
    weight <= 0
  )
    return 0;
  // Estimated step length: 0.415 × stature; flat walking net cost: 0.5 kcal/kg/km.
  // This is a coarse distance model, not a sensor measurement or a calorie quota.
  const distanceKm = (steps * heightCm * 0.415) / 100000;
  return distanceKm * weight * 0.5;
}
export function dailyEnergy(day: DayLog, workouts: WorkoutLog[], profile: Profile) {
  const weight = day.weight || day.health?.weight || profile.startWeight;
  const steps = stepEnergy(day.steps ?? day.health?.steps ?? 0, profile.heightCm, weight);
  const sessions = workouts
    .filter((w) => w.date === day.date)
    .map((w) => ({ type: w.type, ...workoutEnergy(w, weight) }));
  const strengthAndSwim = sessions
    .filter((w) => w.type === 'strength' || w.type === 'swim')
    .reduce((sum, w) => sum + w.active, 0);
  const cardio = sessions
    .filter((w) => w.type === 'cardio' || w.type === 'recovery')
    .reduce((sum, w) => sum + w.active, 0);
  const estimate = strengthAndSwim + Math.max(steps, cardio);
  // Daily source totals already include sessions; never add the local estimate again.
  const active = day.activeKcal ?? day.health?.activeKcal ?? estimate;
  const source =
    day.activeKcal !== undefined
      ? 'Elle girildi'
      : day.health?.activeKcal !== undefined
        ? 'Health Connect'
        : 'MET / adım tahmini';
  return { active, steps, sessions, source };
}
export function adjustedTarget(base: number, active: number, enabled = false, percent = 0) {
  return base + (enabled ? (Math.max(0, active) * Math.max(0, Math.min(100, percent))) / 100 : 0);
}
