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
  'program-full-a': 'Tüm vücut A',
  'program-full-b': 'Tüm vücut B',
  'program-full-c': 'Tüm vücut C',
  'program-upper': 'Üst vücut',
  'program-lower': 'Alt vücut',
  'program-push': 'İtiş',
  'program-pull': 'Çekiş',
  'program-legs': 'Bacak',
  'program-home-a': 'Ev A',
  'program-home-b': 'Ev B',
  A: 'Kuvvet A',
  B: 'Kuvvet B',
  C: 'Kuvvet C',
  swim: 'Yüzme',
  cardio: 'Kardiyo',
  mobility: 'Mobilite',
  custom: 'Özel',
};
export { defaultPlan } from './defaultPlan';
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
    type: day.alternative?.type || day.type,
    week,
    phase: PHASES[phaseIndex],
    phaseIndex,
    deload,
    assessment,
    beforeStart: days < 0,
    ended: days >= limit,
    swimM: settings.swimTargetM || Math.min(1500, 150 + (week - 1) * 25),
    exercises: (
      day.alternative?.exercises ||
      settings.templates[day.templateId || day.type] ||
      []
    ).map((e) => ({
      ...e,
      sets: deload
        ? Math.max(1, e.sets - 1)
        : week <= 2 && settings.experience === 'beginner'
          ? Math.min(2, e.sets)
          : e.sets,
    })),
  };
}
