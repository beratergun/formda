import { it, expect, vi } from 'vitest';
import type { HealthPlugin } from '@capgo/capacitor-health';
import { healthAvailability, readHealthDay, mergeHealthDay, READ_TYPES } from './health';
import { emptyDay } from '../../domain/types';
import type { AppData } from '../../data/repositories';
function fake() {
  return {
    isAvailable: vi.fn().mockResolvedValue({ available: true }),
    requestAuthorization: vi.fn().mockResolvedValue({}),
    checkAuthorization: vi.fn().mockResolvedValue({
      readAuthorized: READ_TYPES,
      readDenied: [],
      writeAuthorized: [],
      writeDenied: [],
    }),
    queryAggregated: vi.fn().mockImplementation(async ({ dataType }: { dataType: string }) => ({
      samples: [{ value: dataType === 'steps' ? 4321 : 321 }],
    })),
    readSamples: vi.fn().mockImplementation(async ({ dataType }: { dataType: string }) => ({
      samples: [
        {
          dataType,
          value: dataType === 'weight' ? 81 : 420,
          startDate: '2026-10-29T20:00:00Z',
          endDate: '2026-10-30T03:00:00Z',
          sourceName: 'Fixture device',
        },
      ],
    })),
    queryWorkouts: vi.fn().mockResolvedValue({
      workouts: [
        {
          platformId: 'external-1',
          sourceName: 'Fixture watch',
          workoutType: 'swimming',
          startDate: '2026-10-30T10:00:00Z',
          endDate: '2026-10-30T10:30:00Z',
          duration: 1800,
          totalDistance: 500,
        },
      ],
    }),
  };
}
it('does not request native health permissions on the web or when Health Connect is missing', async () => {
  const api = fake();
  expect((await healthAvailability(api as unknown as HealthPlugin, false)).available).toBe(false);
  await expect(readHealthDay('2026-10-30', api as unknown as HealthPlugin, false)).rejects.toThrow(
    'Elle kayıt',
  );
  expect(api.isAvailable).not.toHaveBeenCalled();
  expect(api.requestAuthorization).not.toHaveBeenCalled();
  api.isAvailable.mockResolvedValueOnce({ available: false });
  await expect(readHealthDay('2026-10-30', api as unknown as HealthPlugin, true)).rejects.toThrow(
    'Elle kayıt',
  );
  api.isAvailable.mockRejectedValueOnce(new Error('not installed'));
  expect((await healthAvailability(api as unknown as HealthPlugin, true)).available).toBe(false);
});
it('reads exactly five categories with no write scopes and normalizes a local preview', async () => {
  const api = fake();
  const snapshot = await readHealthDay('2026-10-30', api as unknown as HealthPlugin, true);
  expect(api.requestAuthorization).toHaveBeenCalledWith({ read: READ_TYPES, write: [] });
  expect(snapshot.health).toMatchObject({
    steps: 4321,
    activeKcal: 321,
    weight: 81,
    sleepMinutes: 420,
    sleepAt: '23:00',
  });
  expect(snapshot.workouts[0]).toMatchObject({
    id: 'health-external-1',
    type: 'swim',
    distanceM: 500,
    sets: [],
  });
  expect(snapshot.warnings).toEqual([]);
  expect(api.queryAggregated).toHaveBeenCalledWith(
    expect.objectContaining({
      startDate: '2026-10-29T21:00:00.000Z',
      endDate: '2026-10-30T21:00:00.000Z',
    }),
  );
});
it('handles denied scopes and individual read failures without replacing prior manual values', async () => {
  const api = fake();
  api.checkAuthorization.mockResolvedValueOnce({
    readAuthorized: ['steps'],
    readDenied: [],
    writeAuthorized: [],
    writeDenied: [],
  });
  api.queryAggregated.mockRejectedValueOnce(new Error('denied'));
  const snapshot = await readHealthDay('2026-10-30', api as unknown as HealthPlugin, true);
  expect(snapshot.warnings).toHaveLength(5);
  expect(snapshot.health.activeKcal).toBeUndefined();
  expect(snapshot.workouts).toEqual([]);
  const base = {
    dayLog: [
      {
        ...emptyDay(snapshot.date),
        steps: 9000,
        weight: 79,
        note: 'Keep',
        health: { activeKcal: 500, syncedAt: 1, sources: ['Prior source'] },
      },
    ],
    workoutLog: [],
  } as unknown as AppData;
  expect(mergeHealthDay(base, snapshot).dayLog?.[0]).toMatchObject({
    steps: 9000,
    weight: 79,
    note: 'Keep',
    health: { activeKcal: 500 },
  });
  expect(base.dayLog[0].health?.syncedAt).toBe(1);
});
it('imports external sessions idempotently and avoids overlapping manual session duplicates', async () => {
  const snapshot = await readHealthDay('2026-10-30', fake() as unknown as HealthPlugin, true);
  const base = { dayLog: [], workoutLog: [] } as unknown as AppData;
  const first = mergeHealthDay(base, snapshot);
  const second = mergeHealthDay({ ...base, ...first }, snapshot);
  expect(second.workoutLog).toHaveLength(1);
  const manual = {
    ...snapshot.workouts[0],
    id: 'manual',
    healthSource: undefined,
    healthRecordId: undefined,
  };
  expect(mergeHealthDay({ ...base, workoutLog: [manual] }, snapshot).workoutLog).toEqual([manual]);
});
