import Dexie, { type Table } from 'dexie';
import type { DayLog, MealEntry, WorkoutLog, Food, Exercise, Recipe, MediaRecord, PlanSettings, MenuPlan, Targets, Profile, Quote } from '../domain/types';
import { FOODS, DEFAULT_MENU } from './seed/foods';
import { QUOTES } from './seed/quotes';
import { DEFAULT_TARGETS } from '../domain/types';
import { defaultPlan } from '../domain/program';
import { todayKey } from '../domain/dates';

export class YolDatabase extends Dexie {
  dayLog!: Table<DayLog, string>;
  mealEntry!: Table<MealEntry, string>;
  workoutLog!: Table<WorkoutLog, string>;
  exercise!: Table<Exercise, string>;
  food!: Table<Food, string>;
  recipe!: Table<Recipe, string>;
  media!: Table<MediaRecord, string>;
  planSettings!: Table<PlanSettings, string>;
  menuPlan!: Table<MenuPlan, string>;
  targets!: Table<Targets, string>;
  profile!: Table<Profile, string>;
  quote!: Table<Quote, string>;
  meta!: Table<{ key: string; value: string }, string>;
  constructor(name = 'yol-local') {
    super(name);
    this.version(1).stores({
      dayLog: 'date', mealEntry: 'id, date, mealId, foodId', workoutLog: 'id, date, type', exercise: 'id, *muscles, equipment', food: 'id, name, barcode', recipe: 'id', media: 'id, date, kind', planSettings: 'id', menuPlan: 'id', targets: 'id', profile: 'id', quote: 'id, category', meta: 'key',
    });
  }
}
export const db = new YolDatabase();
export async function seedDatabase(database = db) {
  await database.transaction('rw', database.tables, async () => {
    if (!await database.meta.get('seedVersion')) {
      await database.food.bulkPut(FOODS);
      await database.quote.bulkPut(QUOTES);
      await database.targets.put(DEFAULT_TARGETS);
      await database.menuPlan.put(DEFAULT_MENU);
      await database.planSettings.put(defaultPlan(todayKey()));
      await database.profile.put({ id: 'main', heightCm: 170, startWeight: 80, activityFactor: 1.45, photoReminderDays: 14, sex: 'unspecified' });
      await database.meta.bulkPut([{ key: 'schemaVersion', value: '1' }, { key: 'seedVersion', value: '1' }]);
    }
  });
}
