import Dexie, { type Table } from 'dexie';
import type {
  DayLog,
  MealEntry,
  WorkoutLog,
  Food,
  Exercise,
  Recipe,
  MediaRecord,
  PlanSettings,
  MenuPlan,
  Targets,
  Profile,
  Quote,
} from '../domain/types';
import { DEFAULT_TARGETS } from '../domain/types';
import { todayKey } from '../domain/today';
import { hydrateMedia } from './media/binary';

export class FormdaDatabase extends Dexie {
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
      dayLog: 'date',
      mealEntry: 'id, date, mealId, foodId',
      workoutLog: 'id, date, type',
      exercise: 'id, *muscles, equipment',
      food: 'id, name, barcode',
      recipe: 'id',
      media: 'id, date, kind',
      planSettings: 'id',
      menuPlan: 'id',
      targets: 'id',
      profile: 'id',
      quote: 'id, category',
      meta: 'key',
    });
    this.media.hook('reading', hydrateMedia);
  }
}
export const db = new FormdaDatabase();
export async function databaseIsCurrent(database = db) {
  const [seed, library, catalog] = await Promise.all([
    database.meta.get('seedVersion'),
    database.meta.get('libraryVersion'),
    database.meta.get('foodCatalogVersion'),
  ]);
  return !!seed && library?.value === '2' && catalog?.value === '2';
}
export async function seedDatabase(database = db) {
  if (await databaseIsCurrent(database)) return;
  const [{ FOODS, DEFAULT_MENU, TURKISH_RECIPES }, { QUOTES }, { EXERCISES }, { defaultPlan }] =
    await Promise.all([
      import('./seed/foods'),
      import('./seed/quotes'),
      import('./seed/exercises'),
      import('../domain/program'),
    ]);
  await database.transaction('rw', database.tables, async () => {
    if (!(await database.meta.get('seedVersion'))) {
      await database.food.bulkPut(FOODS);
      await database.exercise.bulkPut(EXERCISES);
      await database.recipe.bulkPut(TURKISH_RECIPES);
      await database.quote.bulkPut(QUOTES);
      await database.targets.put(DEFAULT_TARGETS);
      await database.menuPlan.put(DEFAULT_MENU);
      await database.planSettings.put(defaultPlan(todayKey()));
      await database.profile.put({
        id: 'main',
        heightCm: 170,
        startWeight: 80,
        activityFactor: 1.45,
        photoReminderDays: 14,
        sex: 'unspecified',
      });
      await database.meta.bulkPut([
        { key: 'schemaVersion', value: '1' },
        { key: 'seedVersion', value: '1' },
        { key: 'foodCatalogVersion', value: '2' },
        { key: 'libraryVersion', value: '2' },
      ]);
    }
    if ((await database.meta.get('foodCatalogVersion'))?.value !== '2') {
      const old = new Map((await database.food.toArray()).map((f) => [f.id, f]));
      await database.food.bulkPut(
        FOODS.map((food) => {
          const existing = old.get(food.id);
          return {
            ...food,
            favorite: existing?.favorite,
            lastUsedAt: existing?.lastUsedAt,
            useCount: existing?.useCount || 0,
          };
        }),
      );
      const existingRecipes = new Set(await database.recipe.toCollection().primaryKeys());
      await database.recipe.bulkPut(TURKISH_RECIPES.filter((r) => !existingRecipes.has(r.id)));
      await database.meta.put({ key: 'foodCatalogVersion', value: '2' });
    }
    if ((await database.meta.get('libraryVersion'))?.value !== '2') {
      const old = new Map((await database.exercise.toArray()).map((e) => [e.id, e]));
      await database.exercise.bulkPut(EXERCISES.map((e) => ({ ...e, ...old.get(e.id) })));
      const plan = await database.planSettings.get('main');
      if (plan)
        await database.planSettings.put({
          ...plan,
          templates: {
            ...defaultPlan(plan.startDate, plan.daysPerWeek, plan.equipment, plan.experience)
              .templates,
            ...plan.templates,
          },
        });
      await database.meta.put({ key: 'libraryVersion', value: '2' });
    }
  });
}
