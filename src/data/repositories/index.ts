import type {
  DayLog,
  Food,
  MealEntry,
  MenuPlan,
  PlanSettings,
  Profile,
  Quote,
  Recipe,
  Targets,
  WorkoutLog,
} from '../../domain/types';
import { db, type YolDatabase } from '../db';

export interface AppData {
  dayLog: DayLog[];
  mealEntry: MealEntry[];
  workoutLog: WorkoutLog[];
  food: Food[];
  recipe: Recipe[];
  planSettings: PlanSettings[];
  menuPlan: MenuPlan[];
  targets: Targets[];
  profile: Profile[];
  quote: Quote[];
  meta: { key: string; value: string }[];
}
export const DATA_TABLES = [
  'dayLog',
  'mealEntry',
  'workoutLog',
  'food',
  'recipe',
  'planSettings',
  'menuPlan',
  'targets',
  'profile',
  'quote',
  'meta',
] as const;
export interface Repository {
  load(): Promise<AppData>;
  replace(patch: Partial<AppData>): Promise<void>;
}
export class LocalRepository implements Repository {
  constructor(private database: YolDatabase = db) {}
  async load(): Promise<AppData> {
    const values = await Promise.all(
      DATA_TABLES.map((name) => this.database.table(name).toArray()),
    );
    return Object.fromEntries(
      DATA_TABLES.map((name, i) => [name, values[i]]),
    ) as unknown as AppData;
  }
  async replace(patch: Partial<AppData>) {
    const names = Object.keys(patch) as (keyof AppData)[];
    await this.database.transaction(
      'rw',
      names.map((name) => this.database.table(name)),
      async () => {
        for (const name of names) {
          await this.database.table(name).clear();
          await this.database.table(name).bulkPut(patch[name]!);
        }
      },
    );
  }
}
export const repository = new LocalRepository();
