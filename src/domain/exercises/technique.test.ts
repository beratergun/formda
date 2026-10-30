import { describe, it, expect } from 'vitest';
import { EXERCISES } from '../../data/seed/exercises';
import { TECHNIQUES, poseJoints, isTimedExercise, type Point } from './technique';
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
describe('technical movement schematics', () => {
  const core = [
    'bodyweight-squat',
    'push-up',
    'bench-press',
    'lat-pulldown',
    'biceps-curl',
    'shoulder-press',
    'cable-row',
    'plank',
    'walking-lunge',
    'rdl',
  ];
  it('provides individual instruction and references for all ten core patterns', () => {
    for (const id of core) {
      const t = TECHNIQUES[id];
      expect(t).toBeDefined();
      expect(EXERCISES.some((e) => e.id === id)).toBe(true);
      expect(t.steps.length).toBeGreaterThanOrEqual(3);
      expect(t.mistakes.length).toBeGreaterThanOrEqual(2);
      expect(new URL(t.source).protocol).toBe('https:');
      expect(t.labels).toHaveLength(2);
    }
  });
  it('does not substitute a core animation for unreviewed variants', () => {
    for (const id of ['hack-squat', 'incline-press', 'reverse-lunge', 'rowing', 'leg-press'])
      expect(TECHNIQUES[id]).toBeUndefined();
  });
  it('keeps all pose joints finite and within the illustration canvas', () => {
    for (const t of Object.values(TECHNIQUES))
      for (const p of t.poses)
        for (const [x, y] of Object.values(poseJoints(p))) {
          expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
          expect(x).toBeGreaterThan(20);
          expect(x).toBeLessThan(300);
          expect(y).toBeGreaterThan(20);
          expect(y).toBeLessThan(255);
        }
  });
  it('preserves plausible limb ratios and equal bone lengths across poses', () => {
    for (const t of Object.values(TECHNIQUES)) {
      const bones = t.poses.map((p) => {
        const j = poseJoints(p);
        const upper = distance(j.armOrigin, j.elbow),
          forearm = distance(j.elbow, j.hand),
          thigh = distance(j.hip, j.knee),
          calf = distance(j.knee, j.ankle);
        expect(upper / forearm).toBeGreaterThan(0.9);
        expect(upper / forearm).toBeLessThan(1.2);
        expect(thigh / calf).toBeGreaterThan(0.8);
        expect(thigh / calf).toBeLessThan(1.2);
        expect(distance(j.hip, j.shoulder) / (thigh + calf)).toBeGreaterThan(0.55);
        expect(distance(j.hip, j.shoulder) / (thigh + calf)).toBeLessThan(0.8);
        return [upper, forearm, thigh, calf];
      });
      bones[0].forEach((length, i) => expect(bones[1][i] / length).toBeCloseTo(1, 4));
    }
  });
  it('treats plank as an isometric hold with one position and no fake direction arrow', () => {
    expect(TECHNIQUES.plank.static).toBe(true);
    expect(TECHNIQUES.plank.poses[0]).toEqual(TECHNIQUES.plank.poses[1]);
    expect(TECHNIQUES.plank.arrow).toBeUndefined();
    expect(isTimedExercise('plank')).toBe(true);
    expect(isTimedExercise('bench-press')).toBe(false);
  });
});
