import { it, expect } from 'vitest';
import { dailyReport, periodReport } from './index';
import { DEFAULT_TARGETS, emptyDay } from '../types';
import type { AppData } from '../../data/repositories';
const data: AppData = {
  dayLog: [
    { ...emptyDay('2026-10-28'), weight: 80, measurements: { waist: 90 } },
    { ...emptyDay('2026-10-29'), weight: 79, measurements: { waist: 89 }, water: 4 },
  ],
  mealEntry: [
    {
      id: 'm',
      date: '2026-10-29',
      mealId: 'kahvalti',
      name: 'Yumurta',
      qty: 2,
      unit: 'adet',
      state: 'na',
      kcal: 144,
      protein: 12.6,
      createdAt: 0,
      photoIds: [],
    },
  ],
  workoutLog: [
    {
      id: 'w',
      date: '2026-10-29',
      type: 'strength',
      done: true,
      startedAt: 0,
      sets: [{ exerciseId: 'leg-press', setNo: 1, kg: 40, reps: 10, done: true }],
    },
    {
      id: 's',
      date: '2026-10-29',
      type: 'swim',
      done: true,
      startedAt: 0,
      distanceM: 150,
      sets: [],
    },
    { id: 'r', date: '2026-10-29', type: 'rest', done: true, startedAt: 0, sets: [] },
  ],
  food: [],
  recipe: [],
  planSettings: [],
  menuPlan: [],
  targets: [DEFAULT_TARGETS],
  profile: [],
  quote: [],
  meta: [],
};
it('keeps at least two factual comments when all daily targets are met', () => {
  const complete = {
    ...data,
    dayLog: [
      {
        ...emptyDay('2026-10-29'),
        boxes: { h: true, s: true, k: true, u: true },
        water: 8,
        sleepAt: '23:00',
      },
    ],
    mealEntry: [{ ...data.mealEntry[0], kcal: 1900, protein: 110 }],
  };
  const report = dailyReport(complete, '2026-10-29');
  expect(report.comments).toHaveLength(2);
  expect(report.comments[1]).toContain('1 öğün ve 2 seans');
});
it('makes a daily report from actual records and sensible empty days', () => {
  const r = dailyReport(data, '2026-10-29');
  expect(r.macros.kcal).toBe(144);
  expect(r.workouts).toHaveLength(3);
  expect(r.comments.length).toBeLessThanOrEqual(3);
  expect(dailyReport(data, '2026-10-30').macros.kcal).toBe(0);
});
it('summarizes logged days, volumes and measurement changes', () => {
  const r = periodReport(data, '2026-10-29', 7);
  expect(r).toMatchObject({
    loggedDays: 2,
    averageKcal: 72,
    sessions: 2,
    volume: 400,
    swimM: 150,
    weightChange: -1,
    waistChange: -1,
    bestDate: '2026-10-29',
  });
  expect(r.highlights).toHaveLength(3);
  const empty = periodReport({ ...data, dayLog: [], workoutLog: [] }, '2026-10-29', 30);
  expect(empty.loggedDays).toBe(0);
  expect(empty.weightChange).toBeUndefined();
  expect(empty.waistChange).toBeUndefined();
  expect(empty.highlights).toHaveLength(2);
});
