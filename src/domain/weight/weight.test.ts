import { it, expect } from 'vitest';
import { emptyDay } from '../types';
import { validWeightDate, writeWeight } from '.';

it('updates only the chosen date and keeps health data, notes and water intact', () => {
  const before = [
    {
      ...emptyDay('2026-10-29'),
      weight: 80,
      note: 'Keep',
      water: 4,
      health: { weight: 81, syncedAt: 1, sources: ['Fictional provider'] },
    },
    emptyDay('2026-10-30'),
  ];
  const edited = writeWeight(before, '2026-10-29', 79.5, 123, '2026-10-30');
  expect(edited.find((d) => d.date === '2026-10-29')).toMatchObject({
    weight: 79.5,
    note: 'Keep',
    water: 4,
    health: before[0].health,
    updatedAt: 123,
  });
  expect(before[0].weight).toBe(80);
  expect(edited.find((d) => d.date === '2026-10-30')).toBe(before[1]);
  const deleted = writeWeight(edited, '2026-10-29', undefined, 124, '2026-10-30');
  expect(deleted.find((d) => d.date === '2026-10-29')).toMatchObject({
    weight: undefined,
    note: 'Keep',
    water: 4,
    health: before[0].health,
  });
});
it('keeps one manual record per date and treats deleting a missing date as a no-op', () => {
  const first = writeWeight([], '2026-10-29', 80, 1, '2026-10-30');
  expect(writeWeight(first, '2026-10-29', 81, 2, '2026-10-30')).toHaveLength(1);
  expect(writeWeight(first, '2026-10-28', undefined, 2, '2026-10-30')).toBe(first);
});
it('rejects invalid calendar dates, future dates and invalid weight without modifying history', () => {
  for (const date of ['', '2026-02-30', '2026-13-01', '2026-1-01', 'invalid']) {
    expect(validWeightDate(date)).toBe(false);
    expect(() => writeWeight([], date, 80, 1, '2026-10-30')).toThrow();
  }
  expect(validWeightDate('2024-02-29')).toBe(true);
  expect(() => writeWeight([], '2026-10-31', 80, 1, '2026-10-30')).toThrow();
  for (const weight of [0, 29.9, 400.1, NaN, Infinity])
    expect(() => writeWeight([], '2026-10-29', weight, 1, '2026-10-30')).toThrow();
});
