import { it, expect } from 'vitest';
import { EXERCISES } from './exercises';
it('ships at least 80 usable movement guides with valid alternatives', () => {
  expect(EXERCISES.length).toBeGreaterThanOrEqual(80);
  expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
  for (const exercise of EXERCISES) {
    expect(exercise.howTo.length).toBeGreaterThanOrEqual(3);
    expect(exercise.howTo.length).toBeLessThanOrEqual(5);
    expect(exercise.safety.length).toBeGreaterThan(20);
    expect(exercise.mistakes.length).toBeGreaterThan(0);
    for (const id of exercise.alternatives) expect(EXERCISES.some((e) => e.id === id)).toBe(true);
  }
});
