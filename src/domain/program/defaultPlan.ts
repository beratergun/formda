import type { PlanSettings, WeekDay } from '../types';

export function defaultPlan(
  startDate: string,
  daysPerWeek = 4,
  equipment = ['salon', 'havuz'],
  experience = 'beginner',
): PlanSettings {
  const types = equipment.includes('havuz')
    ? (['strength', 'swim', 'recovery', 'swim', 'strength', 'rest', 'swim'] as const)
    : (['strength', 'cardio', 'recovery', 'cardio', 'strength', 'rest', 'strength'] as const);
  let count = 0;
  const weekTemplate = types.map((type, index): WeekDay => {
    const active = !['rest', 'recovery'].includes(type) && count++ < daysPerWeek;
    const actual = active ? type : type === 'rest' ? 'rest' : 'recovery';
    return {
      type: actual,
      title:
        actual === 'strength'
          ? index === 4
            ? 'Kuvvet B'
            : 'Kuvvet A'
          : actual === 'swim'
            ? 'Yüzme'
            : actual === 'rest'
              ? 'Planlı dinlenme'
              : actual === 'cardio'
                ? 'Kardiyo'
                : 'Toparlanma',
      time: '18:30',
      note: '',
      ...(actual === 'strength' ? { templateId: index === 4 ? 'B' : 'A' } : {}),
    };
  });
  const make = (ids: string[]) =>
    ids.map((exerciseId) => ({ exerciseId, sets: 3, minReps: 8, maxReps: 12, restSec: 90 }));
  return {
    id: 'main',
    startDate,
    horizon: '6m',
    daysPerWeek,
    equipment,
    experience,
    weekTemplate,
    templates: {
      A: make(
        equipment.includes('salon')
          ? ['leg-press', 'chest-press', 'lat-pulldown', 'glute-bridge', 'incline-plank']
          : ['goblet-squat', 'push-up', 'band-row', 'glute-bridge', 'dead-bug'],
      ),
      B: make(
        equipment.includes('salon')
          ? ['goblet-squat', 'cable-row', 'shoulder-press', 'leg-curl', 'dead-bug']
          : ['goblet-squat', 'band-row', 'push-up', 'glute-bridge', 'dead-bug'],
      ),
      C: make(['rdl', 'step-up', 'farmer-carry']),
      swim: make(['swim-free', 'swim-back']),
      cardio: make(['walk']),
      mobility: make(['cat-cow', 'bird-dog']),
      custom: [],
    },
    progression: 2.5,
  };
}
