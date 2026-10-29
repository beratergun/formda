import { dateDiff, weekday } from '../dates';
import type { PlanSettings, WeekDay } from '../types';

export const PHASES = [
  'Alışma',
  'Temel',
  'Kapasite',
  'İlerleme',
  'Güç + dayanıklılık',
  'Pekiştirme',
  'Sürdürme döngüsü',
];
export const TEMPLATE_NAMES: Record<string, string> = {
  A: 'Kuvvet A',
  B: 'Kuvvet B',
  C: 'Kuvvet C',
  swim: 'Yüzme',
  cardio: 'Kardiyo',
  mobility: 'Mobilite',
  custom: 'Özel',
};
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
export function planFor(
  date: string,
  settings: PlanSettings,
  overrides: Record<string, WeekDay> = {},
) {
  const days = dateDiff(date, settings.startDate);
  const week = Math.max(1, Math.floor(days / 7) + 1);
  const limit = { '6m': 183, '1y': 366, '3y': 1096, '5y': 1827, forever: Infinity }[
    settings.horizon
  ];
  const deload =
    week % 4 === 0 ||
    (!!settings.deloadFrom &&
      dateDiff(date, settings.deloadFrom) >= 0 &&
      dateDiff(date, settings.deloadFrom) < 7);
  const assessment = week % 12 === 0;
  const phaseIndex = Math.min(6, Math.floor((week - 1) / 4));
  const day = overrides[date] || settings.overrides?.[date] || settings.weekTemplate[weekday(date)];
  return {
    ...day,
    week,
    phase: PHASES[phaseIndex],
    phaseIndex,
    deload,
    assessment,
    beforeStart: days < 0,
    ended: days >= limit,
    swimM: settings.swimTargetM || Math.min(1500, 150 + (week - 1) * 25),
    exercises: (settings.templates[day.templateId || ''] || []).map((e) => ({
      ...e,
      sets: deload
        ? Math.max(1, e.sets - 1)
        : week <= 2 && settings.experience === 'beginner'
          ? Math.min(2, e.sets)
          : e.sets,
    })),
  };
}
