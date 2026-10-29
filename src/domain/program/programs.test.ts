import { expect, it } from 'vitest';
import { defaultPlan, planFor } from './index';
import {
  PROGRAMS,
  selectProgram,
  chooseDayAlternative,
  clearDayAlternative,
  replaceDayExercise,
  exerciseAlternatives,
} from './programs';
import { EXERCISES } from '../../data/seed/exercises';
import { shiftDate } from '../dates';

for (const program of PROGRAMS)
  for (const days of program.days)
    for (const equipment of [['salon', 'havuz'], ['ev']]) {
      it(`${program.id} ${days} days at ${equipment.join('/')} retains long-term periodization`, () => {
        const original = defaultPlan('2026-10-26', days, equipment);
        const settings = selectProgram(original, program.id, days);
        const active = settings.weekTemplate.filter((d) =>
          ['strength', 'swim', 'cardio'].includes(d.type),
        );
        if (program.id !== 'personal') expect(active).toHaveLength(days);
        for (const day of active)
          for (const item of settings.templates[day.templateId || day.type] || []) {
            const exercise = EXERCISES.find((e) => e.id === item.exerciseId)!;
            expect(exercise).toBeDefined();
            if (equipment[0] === 'ev' || program.id === 'home')
              expect(['vücut ağırlığı', 'dumbbell', 'bant']).toContain(exercise.equipment);
          }
        expect(planFor('2026-11-16', settings).deload).toBe(true);
        expect(planFor('2027-01-11', settings).assessment).toBe(true);
        const distant = planFor(shiftDate(settings.startDate, 365 * 5 - 1), {
          ...settings,
          horizon: '5y',
        });
        expect(distant.phase).toBe('Sürdürme döngüsü');
        expect(distant.ended).toBe(false);
        expect(selectProgram(settings, 'personal', days).weekTemplate).toEqual(
          original.weekTemplate,
        );
        expect(original.programId).toBeUndefined();
      });
    }
it('keeps custom templates and restores the personal schedule after program switches', () => {
  const original = defaultPlan('2026-10-26');
  original.templates.custom = [
    { exerciseId: 'push-up', sets: 2, minReps: 8, maxReps: 10, restSec: 60 },
  ];
  original.weekTemplate[0].title = 'My original plan';
  const first = selectProgram(original, 'ppl', 4);
  expect(first.daysPerWeek).toBe(3);
  const second = selectProgram(first, 'upper-lower', 4);
  const restored = selectProgram(second, 'personal', 4);
  expect(restored.weekTemplate).toEqual(original.weekTemplate);
  expect(restored.templates.custom).toEqual(original.templates.custom);
  expect(selectProgram({ ...restored, programId: 'personal' }, 'personal', 3).daysPerWeek).toBe(3);
  expect(selectProgram(defaultPlan('2026-10-26'), 'personal', 4).weekTemplate).toEqual(
    defaultPlan('2026-10-26').weekTemplate,
  );
});
it('isolates three alternatives and exercise replacement to one date, with deload applied once', () => {
  const original = selectProgram(defaultPlan('2026-10-26'), 'full-body', 3);
  for (const kind of ['busy', 'home', 'short'] as const) {
    const changed = chooseDayAlternative(original, '2026-11-16', kind);
    expect(changed.weekTemplate).toEqual(original.weekTemplate);
    expect(original.overrides).toBeUndefined();
    const plan = planFor('2026-11-16', changed);
    expect(new Set(plan.exercises.map((e) => e.exerciseId)).size).toBe(plan.exercises.length);
    expect(plan.alternative?.kind).toBe(kind);
    expect(planFor('2026-11-23', changed)).toEqual(planFor('2026-11-23', original));
    if (kind === 'short') expect(plan.exercises.every((e) => e.sets === 1)).toBe(true);
    else
      expect(
        plan.exercises.every(
          (e) => EXERCISES.find((x) => x.id === e.exerciseId)?.equipment !== 'makine',
        ),
      ).toBe(true);
    expect(planFor('2026-11-16', clearDayAlternative(changed, '2026-11-16')).exercises).toEqual(
      planFor('2026-11-16', original).exercises,
    );
    const replaced = replaceDayExercise(changed, '2026-11-16', 0, 'bodyweight-squat');
    expect(planFor('2026-11-16', replaced).exercises[0].exerciseId).toBe('bodyweight-squat');
    expect(planFor('2026-11-16', replaced).exercises[0].sets).toBe(kind === 'short' ? 1 : 2);
  }
  expect(clearDayAlternative(original, '2026-11-16')).toBe(original);
  expect(
    replaceDayExercise(original, '2026-10-26', 0, 'bodyweight-squat').overrides?.['2026-10-26']
      .alternative?.kind,
  ).toBe('custom');
  const swim = defaultPlan('2026-10-26');
  expect(planFor('2026-10-27', chooseDayAlternative(swim, '2026-10-27', 'home')).type).toBe(
    'strength',
  );
  expect(
    chooseDayAlternative(swim, '2026-10-31', 'short').overrides?.['2026-10-31'].alternative
      ?.exercises,
  ).toEqual([]);
});
it('filters exercise swaps by the same movement and requested equipment', () => {
  const original = EXERCISES.find((e) => e.id === 'chest-press')!;
  const matches = exerciseAlternatives(original, ['dumbbell']);
  expect(matches.length).toBeGreaterThan(0);
  expect(matches.every((e) => e.equipment === 'dumbbell' && e.muscles.includes('chest'))).toBe(
    true,
  );
  expect(exerciseAlternatives(original, ['havuz'])).toEqual([]);
  expect(exerciseAlternatives(original).length).toBeGreaterThan(matches.length);
});
