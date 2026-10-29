export type FoodState = 'raw' | 'cooked' | 'na';
export type MealId = 'kahvalti' | 'ogle' | 'ara' | 'aksam';
export const MEALS: { id: MealId; name: string; time: string }[] = [
  { id: 'kahvalti', name: 'Kahvaltı', time: '08.00' }, { id: 'ogle', name: 'Öğle', time: '13.00' },
  { id: 'ara', name: 'Ara öğün', time: '16.30' }, { id: 'aksam', name: 'Akşam', time: '19.00' },
];
export interface Food { id: string; name: string; aliases: string[]; unit: 'g' | 'ml' | 'adet'; per: number; kcalPer: number; proteinPer: number; carbPer?: number; fatPer?: number; fiberPer?: number; state: FoodState; source: string; barcode?: string; portions: { label: string; qty: number }[]; favorite?: boolean; lastUsedAt?: number; useCount: number }
export interface Macros { kcal: number; protein: number; carb?: number; fat?: number }
export interface MealEntry extends Macros { id: string; date: string; mealId: MealId; foodId?: string; name: string; qty: number; unit: string; state: FoodState; photoIds: string[]; freeText?: string; createdAt: number }
export interface DayLog { date: string; boxes: { h: boolean; s: boolean; k: boolean; u: boolean }; boxOverrides?: Partial<Record<'h'|'s'|'k'|'u', boolean>>; water: number; steps?: number; sleepAt?: string; sleepQuality?: number; energy?: number; mood?: number; soreness?: Record<string, number>; weight?: number; measurements?: { waist?: number; chest?: number; hip?: number; arm?: number }; note?: string; tags: string[]; guard?: boolean; updatedAt: number }
export type WorkoutType = 'strength' | 'swim' | 'cardio' | 'recovery' | 'rest';
export interface SetLog { exerciseId: string; setNo: number; kg?: number; reps?: number; seconds?: number; rpe?: number; done: boolean }
export interface WorkoutLog { id: string; date: string; type: WorkoutType; templateId?: string; startedAt: number; endedAt?: number; done: boolean; rpe?: number; note?: string; distanceM?: number; sets: SetLog[]; warmupDone?: boolean; cooldownDone?: boolean }
export interface Exercise { id: string; name: string; muscles: string[]; equipment: string; level: string; howTo: string[]; mistakes: string[]; safety: string; alternatives: string[]; defaultRestSec: number; svgKey: string }
export interface TemplateExercise { exerciseId: string; sets: number; minReps: number; maxReps: number; restSec: number; alternative?: string }
export interface WeekDay { type: WorkoutType; title: string; time: string; note: string; templateId?: string }
export type Horizon = '6m' | '1y' | '3y' | '5y' | 'forever';
export interface PlanSettings { id: 'main'; startDate: string; horizon: Horizon; daysPerWeek: number; equipment: string[]; experience: string; weekTemplate: WeekDay[]; templates: Record<string, TemplateExercise[]>; swimTargetM?: number; progression: number; deloadFrom?: string; overrides?: Record<string, WeekDay> }
export interface MenuMeal { title: string; items: { foodId: string; qty: number; state: FoodState }[] }
export interface MenuPlan { id: 'main'; days: Record<MealId, MenuMeal>[] }
export interface Targets { id: 'main'; kcal: number; protein: number; carb?: number; fat?: number; water: number; steps?: number; bedtime: string; goalWeight: number; milestones: number[]; scoreWeights?: number[] }
export interface Profile { id: 'main'; name?: string; age?: number; sex?: 'male' | 'female' | 'unspecified'; heightCm: number; startWeight: number; activityFactor: number; pinHash?: string; pinSalt?: string; hidePhotos?: boolean; photoReminderDays: number; theme?: string; notifications?: boolean }
export interface Quote { id: string; text: string; category: string; custom: boolean }
export interface Recipe { id: string; name: string; ingredients: { foodId: string; qty: number }[]; cookedWeightG: number; servings: number }
export interface MediaRecord { id: string; date: string; kind: 'progress' | 'meal' | 'vlog' | 'workout'; pose?: string; opfsPath?: string; blob?: Blob; thumb: Blob; width: number; height: number; durationSec?: number; sizeBytes: number; tags: string[]; mood?: number; title?: string; mime: string }
export const DEFAULT_TARGETS: Targets = { id: 'main', kcal: 1900, protein: 110, water: 8, bedtime: '23:30', goalWeight: 75, milestones: [100, 90, 85, 80] };
export function emptyDay(date: string): DayLog { return { date, boxes: { h: false, s: false, k: false, u: false }, water: 0, tags: [], updatedAt: Date.now() }; }
