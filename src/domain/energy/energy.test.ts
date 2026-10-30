import { it, expect } from 'vitest';
import { adjustedTarget, dailyEnergy, stepEnergy, workoutEnergy } from './index';
import { emptyDay, type Profile, type WorkoutLog } from '../types';
const profile: Profile = {
  id: 'main',
  heightCm: 170,
  startWeight: 80,
  activityFactor: 1.45,
  photoReminderDays: 14,
};
const workout: WorkoutLog = {
  id: 'w',
  date: '2026-10-30',
  type: 'strength',
  startedAt: 0,
  endedAt: 3600000,
  done: true,
  sets: [],
};
it('uses Compendium MET × weight × hours and separates active from resting energy', () => {
  expect(workoutEnergy(workout, 80)).toMatchObject({
    gross: 280,
    active: 200,
    minutes: 60,
    met: 3.5,
  });
  expect(workoutEnergy({ ...workout, type: 'swim' }, 80).gross).toBe(464);
  expect(workoutEnergy({ ...workout, type: 'cardio' }, 80).gross).toBe(400);
  expect(workoutEnergy({ ...workout, type: 'recovery' }, 80).gross).toBe(184);
  expect(workoutEnergy({ ...workout, type: 'rest' }, 80).gross).toBe(0);
  expect(workoutEnergy({ ...workout, done: false }, 80).gross).toBe(0);
  expect(workoutEnergy(workout, NaN).gross).toBe(0);
  expect(workoutEnergy(workout, 0).gross).toBe(0);
});
it('accounts for set duration, repetitions, RPE and rest without inventing logged time', () => {
  const base = {
    ...workout,
    sets: [{ exerciseId: 'leg-press', setNo: 1, reps: 10, rpe: 8, done: true }],
  };
  expect(workoutEnergy(base, 80).gross).toBeLessThan(workoutEnergy(workout, 80).gross);
  expect(workoutEnergy(base, 80).gross).toBeGreaterThan(
    workoutEnergy({ ...base, sets: [{ ...base.sets[0], rpe: 5 }] }, 80).gross,
  );
  expect(
    workoutEnergy(
      {
        ...base,
        sets: [{ ...base.sets[0], seconds: 900, reps: undefined, rpe: undefined }],
        rpe: 9,
      },
      80,
    ).gross,
  ).toBeGreaterThan(workoutEnergy(base, 80).gross);
  expect(workoutEnergy({ ...base, endedAt: undefined }, 80).gross).toBe(0);
  expect(workoutEnergy({ ...base, endedAt: -1 }, 80).gross).toBe(0);
});
it('uses stature and mass for step estimates and rejects invalid input', () => {
  expect(stepEnergy(10000, 170, 80)).toBeCloseTo(282.2);
  for (const tuple of [
    [-1, 170, 80],
    [100, 0, 80],
    [100, 170, 0],
    [NaN, 170, 80],
  ])
    expect(stepEnergy(...(tuple as [number, number, number]))).toBe(0);
});
it('uses one daily source total, avoids cardio/step double counting, and keeps adding to goals opt-in', () => {
  const day = { ...emptyDay('2026-10-30'), steps: 10000 };
  const energy = dailyEnergy(day, [workout, { ...workout, id: 'cardio', type: 'cardio' }], profile);
  expect(energy.active).toBe(520);
  expect(dailyEnergy({ ...day, activeKcal: 0 }, [workout], profile)).toMatchObject({
    active: 0,
    source: 'Elle girildi',
  });
  expect(
    dailyEnergy(
      { ...day, health: { activeKcal: 400, steps: 1234, syncedAt: 1, sources: [] } },
      [workout],
      profile,
    ).active,
  ).toBe(400);
  expect(
    dailyEnergy(
      { ...emptyDay(day.date), health: { weight: 90, steps: 2000, syncedAt: 1, sources: [] } },
      [],
      profile,
    ).active,
  ).toBeCloseTo(stepEnergy(2000, 170, 90));
  expect(adjustedTarget(1900, 400)).toBe(1900);
  expect(adjustedTarget(1900, 400, true, 50)).toBe(2100);
  expect(adjustedTarget(1900, 400, true, 150)).toBe(2300);
  expect(adjustedTarget(1900, -1, true, -10)).toBe(1900);
});
