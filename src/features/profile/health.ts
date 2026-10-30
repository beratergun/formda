import { Capacitor } from '@capacitor/core';
import type { HealthPlugin, HealthDataType, HealthSample, Workout } from '@capgo/capacitor-health';
import type { AppData } from '../../data/repositories';
import { emptyDay, type HealthDay, type WorkoutLog } from '../../domain/types';
import { shiftDate } from '../../domain/dates';

export const READ_TYPES: HealthDataType[] = ['steps', 'calories', 'workouts', 'weight', 'sleep'];
export interface HealthSnapshot {
  date: string;
  health: HealthDay;
  workouts: WorkoutLog[];
  warnings: string[];
}
export async function healthAvailability(
  api?: HealthPlugin,
  android = Capacitor.getPlatform() === 'android',
) {
  if (!android)
    return { available: false, reason: 'PWA ve iPhone sürümünde elle kayıt kullanabilirsin.' };
  try {
    const client = api || (await import('@capgo/capacitor-health')).Health;
    return await client.isAvailable();
  } catch {
    return {
      available: false,
      reason: 'Health Connect kullanılamıyor. Elle kayıtla devam edebilirsin.',
    };
  }
}
export async function readHealthDay(
  date: string,
  api?: HealthPlugin,
  android = Capacitor.getPlatform() === 'android',
): Promise<HealthSnapshot> {
  if (!(await healthAvailability(api, android)).available)
    throw new Error(
      'Health Connect yok veya bu sürümde desteklenmiyor. Elle kayıt kullanabilirsin.',
    );
  const client = api || (await import('@capgo/capacitor-health')).Health;
  await client.requestAuthorization({ read: [...READ_TYPES], write: [] });
  const granted = await client.checkAuthorization({ read: [...READ_TYPES], write: [] });
  const startDate = new Date(`${date}T00:00:00+03:00`).toISOString();
  const endDate = new Date(`${shiftDate(date, 1)}T00:00:00+03:00`).toISOString();
  const health: HealthDay = { syncedAt: Date.now(), sources: [] },
    warnings: string[] = [];
  const sources = new Set<string>();
  const labels: Record<string, string> = {
    steps: 'Adım',
    calories: 'Aktif kalori',
    workouts: 'Egzersiz',
    weight: 'Kilo',
    sleep: 'Uyku',
  };
  const can = (type: HealthDataType) => granted.readAuthorized.includes(type);
  const safe = async <T>(
    type: HealthDataType,
    action: () => Promise<T>,
  ): Promise<T | undefined> => {
    if (!can(type)) {
      warnings.push(`${labels[type]} için okuma izni verilmedi.`);
      return;
    }
    try {
      return await action();
    } catch {
      warnings.push(`${labels[type]} bu kez okunamadı; önceki kayıtların korunuyor.`);
      return;
    }
  };
  const [steps, calories, weights, sleep, workouts] = await Promise.all([
    safe('steps', () =>
      client.queryAggregated({
        dataType: 'steps',
        startDate,
        endDate,
        bucket: 'day',
        aggregation: 'sum',
      }),
    ),
    safe('calories', () =>
      client.queryAggregated({
        dataType: 'calories',
        startDate,
        endDate,
        bucket: 'day',
        aggregation: 'sum',
      }),
    ),
    safe('weight', () =>
      client.readSamples({ dataType: 'weight', startDate, endDate, limit: 1000, ascending: true }),
    ),
    safe('sleep', () =>
      client.readSamples({
        dataType: 'sleep',
        startDate: new Date(`${shiftDate(date, -1)}T12:00:00+03:00`).toISOString(),
        endDate,
        limit: 1000,
        ascending: true,
      }),
    ),
    safe('workouts', async () => {
      let anchor: string | undefined;
      const values: Workout[] = [];
      do {
        const result = await client.queryWorkouts({
          startDate,
          endDate,
          limit: 1000,
          ascending: true,
          anchor,
        });
        values.push(...result.workouts);
        if (result.anchor === anchor) break;
        anchor = result.anchor;
      } while (anchor);
      return values;
    }),
  ]);
  const finite = (value: number) => Number.isFinite(value) && value >= 0;
  if (steps?.samples.length)
    health.steps = steps.samples
      .filter((s) => finite(s.value))
      .reduce((sum, s) => sum + s.value, 0);
  if (calories?.samples.length)
    health.activeKcal = calories.samples
      .filter((s) => finite(s.value))
      .reduce((sum, s) => sum + s.value, 0);
  const valid = (samples: HealthSample[]) =>
    samples.filter((s) => finite(s.value)).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const weight = valid(weights?.samples || []).at(-1);
  if (weight && weight.value >= 30 && weight.value <= 400) health.weight = weight.value;
  const lastSleep = valid(sleep?.samples || [])
    .filter((s) => s.endDate >= startDate && s.endDate < endDate && s.sleepState !== 'awake')
    .sort((a, b) => b.value - a.value)[0];
  if (lastSleep) {
    health.sleepMinutes = lastSleep.value;
    health.sleepAt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Istanbul',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(lastSleep.startDate));
  }
  for (const sample of [...(weights?.samples || []), ...(sleep?.samples || [])])
    if (sample.sourceName || sample.sourceId) sources.add(sample.sourceName || sample.sourceId!);
  const imported = (workouts || [])
    .filter(
      (w) =>
        Number.isFinite(Date.parse(w.startDate)) && Date.parse(w.endDate) > Date.parse(w.startDate),
    )
    .map((w): WorkoutLog => {
      const recordId = w.platformId || `${w.sourceId || 'health'}-${w.startDate}-${w.workoutType}`;
      if (w.sourceName || w.sourceId) sources.add(w.sourceName || w.sourceId!);
      return {
        id: `health-${recordId}`,
        healthRecordId: recordId,
        healthSource: w.sourceName || w.sourceId || 'Health Connect',
        date,
        type: /swim|water/i.test(w.workoutType)
          ? 'swim'
          : /strength|weightlifting|bench|deadlift/i.test(w.workoutType)
            ? 'strength'
            : /yoga|stretch|recovery|pilates/i.test(w.workoutType)
              ? 'recovery'
              : 'cardio',
        startedAt: Date.parse(w.startDate),
        endedAt: Date.parse(w.endDate),
        done: true,
        distanceM: w.totalDistance,
        sets: [],
      };
    });
  health.sources = [...sources];
  return { date, health, workouts: imported, warnings };
}
export function mergeHealthDay(data: AppData, snapshot: HealthSnapshot): Partial<AppData> {
  const day = data.dayLog.find((d) => d.date === snapshot.date) || emptyDay(snapshot.date);
  const merged = [...data.workoutLog];
  for (const incoming of snapshot.workouts) {
    const index = merged.findIndex((w) => w.id === incoming.id);
    if (index >= 0) {
      merged[index] = { ...incoming, ...merged[index] };
      continue;
    }
    const overlaps = merged.some(
      (w) =>
        !w.healthSource &&
        w.done &&
        w.startedAt < (incoming.endedAt || incoming.startedAt) &&
        (w.endedAt || w.startedAt) > incoming.startedAt,
    );
    if (!overlaps) merged.push(incoming);
  }
  return {
    dayLog: [
      ...data.dayLog.filter((d) => d.date !== snapshot.date),
      {
        ...day,
        health: {
          ...day.health,
          ...snapshot.health,
          sources: [...new Set([...(day.health?.sources || []), ...snapshot.health.sources])],
        },
        updatedAt: Date.now(),
      },
    ],
    workoutLog: merged,
  };
}
export async function openHealthSettings() {
  if (Capacitor.getPlatform() === 'android')
    await (await import('@capgo/capacitor-health')).Health.openHealthConnectSettings();
}
