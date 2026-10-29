import type { Exercise, PlanSettings, TemplateExercise, WeekDay } from '../types';
import { defaultPlan } from './index';
import { weekday } from '../dates';
import { EXERCISES } from '../../data/seed/exercises';

export const PROGRAMS = [
  {
    id: 'full-body',
    name: 'Tüm vücut başlangıç',
    days: [3],
    description: 'Üç gün kuvvet, aralarda toparlanma.',
  },
  {
    id: 'upper-lower',
    name: 'Üst / alt bölünmüş',
    days: [4],
    description: 'Üst ve alt vücudu haftada iki kez çalıştır.',
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    days: [3, 6],
    description: 'İtiş, çekiş ve bacak günleri.',
  },
  {
    id: 'strength-cardio',
    name: 'Kilo verme odaklı kuvvet + kardiyo',
    days: [4, 5],
    description: 'Kuvvet, düşük etkili kardiyo ve yürüyüş.',
  },
  {
    id: 'home',
    name: 'Ev ve vücut ağırlığı / dambıl',
    days: [3, 4],
    description: 'Salon gerektirmeyen dengeli bir düzen.',
  },
  {
    id: 'personal',
    name: 'Benim planım',
    days: [2, 3, 4, 5, 6],
    description: 'Kuvvet A/B ve yüzme; mevcut düzenin.',
  },
] as const;
export type ProgramId = (typeof PROGRAMS)[number]['id'];
export type AlternativeKind = 'busy' | 'home' | 'short';
export const ALTERNATIVE_NAMES: Record<AlternativeKind, string> = {
  busy: 'Salon dolu / makine yok',
  home: 'Evdeyim',
  short: 'Kısa günüm · 20–25 dk',
};
const homeEquipment = ['vücut ağırlığı', 'dumbbell', 'bant'];
export function exerciseAlternatives(exercise: Exercise, equipment?: string[]) {
  return EXERCISES.filter(
    (candidate) =>
      candidate.id !== exercise.id &&
      candidate.svgKey === exercise.svgKey &&
      candidate.muscles.includes(exercise.muscles[0]) &&
      (!equipment || equipment.includes(candidate.equipment)),
  ).sort(
    (a, b) =>
      b.muscles.filter((m) => exercise.muscles.includes(m)).length -
      a.muscles.filter((m) => exercise.muscles.includes(m)).length,
  );
}
function adapt(id: string, home: boolean, used: Set<string>) {
  const exercise = EXERCISES.find((e) => e.id === id)!;
  const allowed = home ? homeEquipment : [...new Set(EXERCISES.map((e) => e.equipment))];
  const choices = [
    exercise,
    ...exerciseAlternatives(exercise, allowed),
    ...EXERCISES.filter((e) => e.muscles.includes(exercise.muscles[0])),
  ];
  const selected =
    choices.find((e) => allowed.includes(e.equipment) && !used.has(e.id)) || exercise;
  used.add(selected.id);
  return selected.id;
}
export function selectProgram(
  settings: PlanSettings,
  programId: ProgramId,
  requestedDays: number,
): PlanSettings {
  const program = PROGRAMS.find((p) => p.id === programId)!;
  const days = (program.days as readonly number[]).includes(requestedDays)
    ? requestedDays
    : program.days[0];
  if (programId === 'personal')
    return {
      ...settings,
      programId,
      daysPerWeek:
        settings.programId === 'personal'
          ? requestedDays
          : settings.personalDaysPerWeek || requestedDays,
      weekTemplate:
        (!settings.programId || settings.programId === 'personal') &&
        requestedDays !== settings.daysPerWeek
          ? defaultPlan(settings.startDate, requestedDays, settings.equipment, settings.experience)
              .weekTemplate
          : settings.personalWeekTemplate || settings.weekTemplate,
    };
  const home = programId === 'home' || !settings.equipment.includes('salon');
  const sets = settings.experience === 'experienced' ? 4 : 3;
  const make = (ids: string[]): TemplateExercise[] => {
    const used = new Set<string>();
    return ids.map((id) => ({
      exerciseId: adapt(id, home, used),
      sets,
      minReps: 8,
      maxReps: 12,
      restSec: 90,
    }));
  };
  const templates = {
    'program-full-a': make([
      'leg-press',
      'chest-press',
      'lat-pulldown',
      'glute-bridge',
      'dead-bug',
    ]),
    'program-full-b': make(['goblet-squat', 'dumbbell-row', 'shoulder-press', 'rdl', 'side-plank']),
    'program-full-c': make(['step-up', 'push-up', 'cable-row', 'leg-curl', 'farmer-carry']),
    'program-upper': make([
      'chest-press',
      'lat-pulldown',
      'shoulder-press',
      'cable-row',
      'biceps-curl',
      'triceps-pushdown',
    ]),
    'program-lower': make([
      'leg-press',
      'rdl',
      'leg-curl',
      'calf-raise',
      'glute-bridge',
      'dead-bug',
    ]),
    'program-push': make([
      'bench-press',
      'shoulder-press',
      'incline-press',
      'lateral-raise',
      'triceps-pushdown',
    ]),
    'program-pull': make([
      'lat-pulldown',
      'cable-row',
      'reverse-fly',
      'biceps-curl',
      'hammer-curl',
    ]),
    'program-legs': make(['goblet-squat', 'rdl', 'leg-curl', 'calf-raise', 'dead-bug']),
    'program-home-a': make([
      'bodyweight-squat',
      'push-up',
      'dumbbell-row',
      'glute-bridge',
      'dead-bug',
    ]),
    'program-home-b': make([
      'reverse-lunge',
      'wall-push-up',
      'band-row',
      'single-leg-bridge',
      'side-plank',
    ]),
  };
  const sequences: Record<string, string[]> = {
    'full-body': ['full-a', 'full-b', 'full-c'],
    'upper-lower': ['upper', 'lower', 'upper', 'lower'],
    ppl: Array.from({ length: days }, (_, i) => ['push', 'pull', 'legs'][i % 3]),
    'strength-cardio':
      days === 5
        ? ['full-a', 'low-cardio', 'full-b', 'low-cardio', 'full-c']
        : ['full-a', 'low-cardio', 'full-b', 'low-cardio'],
    home: days === 4 ? ['home-a', 'home-b', 'home-a', 'home-b'] : ['home-a', 'home-b', 'home-a'],
  };
  const positions: Record<number, number[]> = {
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 4, 5],
    6: [0, 1, 2, 3, 4, 5],
  };
  const names: Record<string, string> = {
    'full-a': 'Tüm vücut A',
    'full-b': 'Tüm vücut B',
    'full-c': 'Tüm vücut C',
    upper: 'Üst vücut',
    lower: 'Alt vücut',
    push: 'İtiş',
    pull: 'Çekiş',
    legs: 'Bacak',
    'home-a': 'Ev A',
    'home-b': 'Ev B',
  };
  const weekTemplate: WeekDay[] = Array.from({ length: 7 }, () => ({
    type: 'rest',
    title: 'Planlı dinlenme',
    time: '18:30',
    note: '',
  }));
  sequences[programId].forEach((key, i) => {
    const swim = key === 'low-cardio' && settings.equipment.includes('havuz');
    weekTemplate[positions[days][i]] =
      key === 'low-cardio'
        ? {
            type: swim ? 'swim' : 'cardio',
            title: swim ? 'Rahat yüzme' : 'Düşük etkili kardiyo / yürüyüş',
            templateId: swim ? 'swim' : 'cardio',
            time: '18:30',
            note: 'Konuşma temposunda, kontrollü başla.',
          }
        : {
            type: 'strength',
            title: names[key],
            templateId: `program-${key}`,
            time: '18:30',
            note: '',
          };
  });
  return {
    ...settings,
    personalWeekTemplate: settings.personalWeekTemplate || settings.weekTemplate,
    personalDaysPerWeek: settings.personalDaysPerWeek || settings.daysPerWeek,
    programId,
    daysPerWeek: days,
    templates: { ...settings.templates, ...templates },
    weekTemplate,
  };
}
export function alternativeExercises(exercises: TemplateExercise[], kind: AlternativeKind) {
  const used = new Set<string>();
  return exercises.map((item) => {
    if (kind === 'short')
      return { ...item, sets: Math.min(2, item.sets), restSec: Math.min(60, item.restSec) };
    const original = EXERCISES.find((e) => e.id === item.exerciseId)!;
    const allowed =
      kind === 'home' ? homeEquipment : ['barbell', 'dumbbell', 'kablo', 'vücut ağırlığı', 'bant'];
    const choices = [
      original,
      ...exerciseAlternatives(original, allowed),
      ...EXERCISES.filter((e) => e.muscles.includes(original.muscles[0])),
    ];
    const candidate =
      choices.find((e) => allowed.includes(e.equipment) && !used.has(e.id)) || original;
    used.add(candidate.id);
    return { ...item, exerciseId: candidate.id };
  });
}

export function chooseDayAlternative(
  settings: PlanSettings,
  date: string,
  kind: AlternativeKind,
): PlanSettings {
  const day = settings.overrides?.[date] || settings.weekTemplate[weekday(date)];
  const baseline = settings.templates[day.templateId || day.type] || [];
  const exercises =
    kind === 'home' && day.type === 'swim'
      ? ['dumbbell-row', 'reverse-fly', 'glute-bridge'].map((exerciseId) => ({
          exerciseId,
          sets: 3,
          minReps: 10,
          maxReps: 15,
          restSec: 60,
        }))
      : alternativeExercises(baseline, kind);
  const type = kind === 'home' && day.type === 'swim' ? 'strength' : day.type;
  return {
    ...settings,
    overrides: {
      ...settings.overrides,
      [date]: {
        ...day,
        alternative: { kind, type, exercises, durationMin: kind === 'short' ? 25 : 35 },
      },
    },
  };
}
export function clearDayAlternative(settings: PlanSettings, date: string): PlanSettings {
  const day = settings.overrides?.[date];
  if (!day) return settings;
  const { alternative: _alternative, ...original } = day;
  void _alternative;
  return { ...settings, overrides: { ...settings.overrides, [date]: original } };
}

export function replaceDayExercise(
  settings: PlanSettings,
  date: string,
  index: number,
  exerciseId: string,
): PlanSettings {
  const day = settings.overrides?.[date] || settings.weekTemplate[weekday(date)];
  const baseline =
    day.alternative?.exercises ||
    settings.templates[day.templateId || day.type] ||
    settings.templates.A;
  return {
    ...settings,
    overrides: {
      ...settings.overrides,
      [date]: {
        ...day,
        alternative: {
          kind: day.alternative?.kind || 'custom',
          type: day.alternative?.type || day.type,
          durationMin: day.alternative?.durationMin || 35,
          exercises: baseline.map((item, i) => (i === index ? { ...item, exerciseId } : item)),
        },
      },
    },
  };
}
