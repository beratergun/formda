import { z } from 'zod';

const num = z.number().finite().nonnegative();
const id = z.string().min(1).max(200);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const state = z.enum(['raw', 'cooked', 'na']);
const type = z.enum(['strength', 'swim', 'cardio', 'recovery', 'rest']);
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const strings = z.array(z.string());
const day = z.object({
  date,
  boxes: z.object({ h: z.boolean(), s: z.boolean(), k: z.boolean(), u: z.boolean() }),
  boxOverrides: z.record(z.string(), z.boolean()).optional(),
  water: num,
  steps: num.optional(),
  activeKcal: num.optional(),
  sleepAt: clock.optional(),
  sleepQuality: num.max(5).optional(),
  energy: num.max(5).optional(),
  mood: num.max(5).optional(),
  soreness: z.record(z.string(), num.max(3)).optional(),
  weight: num.optional(),
  measurements: z
    .object({
      waist: num.optional(),
      chest: num.optional(),
      hip: num.optional(),
      arm: num.optional(),
    })
    .optional(),
  note: z.string().optional(),
  tags: strings,
  guard: z.boolean().optional(),
  updatedAt: num,
});
const macros = { kcal: num, protein: num, carb: num.optional(), fat: num.optional() };
const meal = z.object({
  id,
  date,
  mealId: z.enum(['kahvalti', 'ogle', 'ara', 'aksam']),
  foodId: id.optional(),
  name: z.string(),
  qty: num,
  unit: z.string(),
  state,
  ...macros,
  photoIds: strings,
  freeText: z.string().optional(),
  createdAt: num,
});
const set = z.object({
  exerciseId: id,
  setNo: num,
  kg: num.optional(),
  reps: num.optional(),
  seconds: num.optional(),
  rpe: num.max(10).optional(),
  done: z.boolean(),
});
const workout = z.object({
  id,
  date,
  type,
  templateId: id.optional(),
  startedAt: num,
  endedAt: num.optional(),
  done: z.boolean(),
  rpe: num.max(10).optional(),
  note: z.string().optional(),
  distanceM: num.optional(),
  sets: z.array(set),
  warmupDone: z.boolean().optional(),
  cooldownDone: z.boolean().optional(),
});
const food = z.object({
  id,
  name: z.string(),
  aliases: strings,
  unit: z.enum(['g', 'ml', 'adet']),
  per: num.positive(),
  kcalPer: num,
  proteinPer: num,
  carbPer: num.optional(),
  fatPer: num.optional(),
  fiberPer: num.optional(),
  state,
  source: z.string(),
  barcode: z.string().optional(),
  portions: z.array(z.object({ label: z.string(), qty: num.positive() })),
  favorite: z.boolean().optional(),
  lastUsedAt: num.optional(),
  useCount: num,
});
const template = z.object({
  exerciseId: id,
  sets: num,
  minReps: num,
  maxReps: num,
  restSec: num,
  alternative: z.string().optional(),
});
const weekDay = z.object({
  alternative: z
    .object({
      kind: z.enum(['busy', 'home', 'short', 'custom']),
      exercises: z.array(template),
      type,
      durationMin: num.positive(),
    })
    .optional(),
  type,
  title: z.string(),
  time: clock,
  note: z.string(),
  templateId: id.optional(),
});
const plan = z.object({
  programId: z.string().optional(),
  personalWeekTemplate: z.array(weekDay).length(7).optional(),
  personalDaysPerWeek: num.max(7).optional(),
  id: z.literal('main'),
  startDate: date,
  horizon: z.enum(['6m', '1y', '3y', '5y', 'forever']),
  daysPerWeek: num.max(7),
  equipment: strings,
  experience: z.string(),
  weekTemplate: z.array(weekDay).length(7),
  templates: z.record(z.string(), z.array(template)),
  swimTargetM: num.optional(),
  progression: num,
  deloadFrom: date.optional(),
  overrides: z.record(z.string(), weekDay).optional(),
});
const menuMeal = z.object({
  title: z.string(),
  items: z.array(z.object({ foodId: id, qty: num, state })),
});
const menu = z.object({
  id: z.literal('main'),
  days: z
    .array(z.object({ kahvalti: menuMeal, ogle: menuMeal, ara: menuMeal, aksam: menuMeal }))
    .length(7),
});
const targets = z.object({
  id: z.literal('main'),
  kcal: num.positive(),
  protein: num.positive(),
  carb: num.optional(),
  fat: num.optional(),
  water: num.positive(),
  steps: num.optional(),
  bedtime: clock,
  goalWeight: num.positive(),
  milestones: z.array(num),
  scoreWeights: z.array(num).length(6).optional(),
});
const profile = z.object({
  id: z.literal('main'),
  name: z.string().optional(),
  age: num.optional(),
  sex: z.enum(['male', 'female', 'unspecified']).optional(),
  heightCm: num.positive(),
  startWeight: num.positive(),
  activityFactor: num.positive(),
  pinHash: z.string().optional(),
  pinSalt: z.string().optional(),
  hidePhotos: z.boolean().optional(),
  photoReminderDays: num,
  theme: z.string().optional(),
  notifications: z.boolean().optional(),
});
const media = z.object({
  id: id.regex(/^[\w-]+$/),
  date,
  kind: z.enum(['progress', 'meal', 'vlog', 'workout']),
  pose: z.string().optional(),
  width: num,
  height: num,
  durationSec: num.optional(),
  sizeBytes: num,
  thumbMime: z.string().optional(),
  tags: strings,
  mood: num.optional(),
  title: z.string().optional(),
  mime: z.string(),
});
const exercise = z.object({
  apparatusId: z.string().optional(),
  setup: z.string().optional(),
  breathing: z.string().optional(),
  prescription: z.string().optional(),
  easier: z.string().optional(),
  harder: z.string().optional(),
  id,
  name: z.string(),
  muscles: strings,
  equipment: z.string(),
  level: z.string(),
  howTo: strings,
  mistakes: strings,
  safety: z.string(),
  alternatives: strings,
  defaultRestSec: num,
  svgKey: z.string(),
});
export const backupSchema = z.object({
  format: z.literal('yol-backup'),
  version: z.literal(1),
  createdAt: z.string(),
  data: z.object({
    dayLog: z.array(day),
    mealEntry: z.array(meal),
    workoutLog: z.array(workout),
    food: z.array(food),
    recipe: z.array(
      z.object({
        id,
        name: z.string(),
        ingredients: z.array(z.object({ foodId: id, qty: num })),
        cookedWeightG: num.positive(),
        servings: num.positive(),
      }),
    ),
    planSettings: z.array(plan).length(1),
    menuPlan: z.array(menu).length(1),
    targets: z.array(targets).length(1),
    profile: z.array(profile).length(1),
    quote: z.array(z.object({ id, text: z.string(), category: z.string(), custom: z.boolean() })),
    meta: z.array(z.object({ key: id, value: z.string() })),
  }),
  media: z.array(media),
  exercises: z.array(exercise),
});
export type BackupDocument = z.infer<typeof backupSchema>;
