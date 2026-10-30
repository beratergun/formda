import { it, expect } from 'vitest';
import { EXERCISES } from './exercises';
import { APPARATUS } from './apparatus';
it('ships at least 150 usable movement guides with valid alternatives', () => {
  expect(EXERCISES.length).toBeGreaterThanOrEqual(150);
  expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
  for (const exercise of EXERCISES) {
    expect(exercise.howTo.length).toBeGreaterThanOrEqual(3);
    expect(exercise.howTo.length).toBeLessThanOrEqual(5);
    expect(exercise.setup?.length).toBeGreaterThan(20);
    expect(exercise.breathing?.length).toBeGreaterThan(20);
    expect(exercise.prescription?.length).toBeGreaterThan(10);
    expect(exercise.easier?.length).toBeGreaterThan(20);
    expect(exercise.harder?.length).toBeGreaterThan(20);
    expect(APPARATUS.some((a) => a.id === exercise.apparatusId)).toBe(true);
    expect(exercise.safety.length).toBeGreaterThan(20);
    expect(exercise.mistakes.length).toBeGreaterThan(0);
    for (const id of exercise.alternatives) expect(EXERCISES.some((e) => e.id === id)).toBe(true);
  }
});

it('offers at least one movement for every apparatus', () => {
  for (const apparatus of APPARATUS)
    expect(
      EXERCISES.some((e) => e.apparatusId === apparatus.id),
      apparatus.name,
    ).toBe(true);
});
