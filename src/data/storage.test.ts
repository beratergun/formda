import { it, expect, afterEach, vi } from 'vitest';
import {
  selectProgram,
  chooseDayAlternative,
  replaceDayExercise,
} from '../domain/program/programs';
import { FormdaDatabase, seedDatabase } from './db';
import { LocalRepository } from './repositories';
import { saveMedia, readMedia, deleteMedia, clearAllData } from './media/opfs';
import { decodeBackup, encodeBackup, encodeBlobStream } from './backup/codec';
import { applyBackup } from './backup';
import { emptyDay } from '../domain/types';
import type { BackupDocument } from './backup/schema';
import { decodeBlobBackup } from './backup/stream';
import { zipSync, strToU8 } from 'fflate';

const databases: FormdaDatabase[] = [];
it('corrects the catalog without changing historical meal snapshots, favorites, recipes or personal data', async () => {
  const database = fresh();
  await seedDatabase(database);
  const beforeFood = (await database.food.get('ekmek'))!;
  await database.food.put({
    ...beforeFood,
    kcalPer: 250,
    proteinPer: 10,
    favorite: true,
    useCount: 12,
    lastUsedAt: 123,
  });
  await database.mealEntry.put({
    id: 'historical-meal',
    date: '2026-10-29',
    mealId: 'kahvalti',
    foodId: 'ekmek',
    name: 'Historical bread',
    qty: 30,
    unit: 'g',
    state: 'na',
    kcal: 75,
    protein: 3,
    photoIds: [],
    createdAt: 1,
  });
  await database.recipe.put({
    id: 'my-recipe',
    name: 'My own recipe',
    ingredients: [{ foodId: 'egg', qty: 2 }],
    cookedWeightG: 180,
    servings: 2,
  });
  await database.meta.put({ key: 'foodCatalogVersion', value: '1' });
  await seedDatabase(database);
  expect(await database.food.get('ekmek')).toMatchObject({
    kcalPer: 252,
    favorite: true,
    useCount: 12,
    lastUsedAt: 123,
  });
  expect(await database.mealEntry.get('historical-meal')).toMatchObject({
    kcal: 75,
    protein: 3,
    name: 'Historical bread',
  });
  expect((await database.recipe.get('my-recipe'))?.name).toBe('My own recipe');
  expect((await database.meta.get('foodCatalogVersion'))?.value).toBe('2');
});
it('rejects oversized ZIP32 output before reading media or replacing any records', async () => {
  const database = fresh();
  await seedDatabase(database);
  const data = await new LocalRepository(database).load();
  const document: BackupDocument = {
    format: 'yol-backup',
    version: 1,
    createdAt: 'now',
    data,
    media: [],
    exercises: [],
  };
  async function* files() {
    yield {
      name: 'media/large.bin',
      blob: {
        size: 0x100000000,
        stream: () => {
          throw new Error('must not read');
        },
      } as unknown as Blob,
    };
  }
  await expect(encodeBlobStream(document, files())).rejects.toThrow('ZIP32');
  expect(await database.food.count()).toBe(data.food.length);
});
function fresh() {
  const database = new FormdaDatabase(`test-${crypto.randomUUID()}`);
  databases.push(database);
  return database;
}
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(databases.splice(0).map((database) => database.delete()));
});
it('retains bytes and MIME types when an engine rejects IndexedDB Blob values', async () => {
  const database = fresh(),
    blob = new Blob(['body'], { type: 'image/jpeg' }),
    thumb = new Blob(['thumb'], { type: 'image/png' });
  vi.spyOn(database.media, 'put').mockRejectedValueOnce(
    new Error('UnknownError: Error preparing Blob/File data'),
  );
  const saved = await saveMedia(
    {
      id: 'binary',
      date: '2026-10-29',
      kind: 'progress',
      thumb,
      width: 1,
      height: 1,
      tags: [],
      mime: blob.type,
    },
    blob,
    database,
  );
  const loaded = (await database.media.get(saved.id))!;
  expect(await loaded.blob!.text()).toBe('body');
  expect(loaded.blob!.type).toBe('image/jpeg');
  expect(await loaded.thumb.text()).toBe('thumb');
  expect(loaded.thumb.type).toBe('image/png');
});
it('seeds once and persists transactional updates without changing unrelated tables', async () => {
  const database = fresh();
  await seedDatabase(database);
  const repository = new LocalRepository(database);
  await repository.replace({ dayLog: [{ ...emptyDay('2026-10-29'), water: 4 }] });
  await seedDatabase(database);
  const data = await repository.load();
  expect(data.dayLog[0].water).toBe(4);
  expect(data.food.length).toBeGreaterThanOrEqual(300);
  expect(data.quote.length).toBeGreaterThanOrEqual(150);
});
it('uses IndexedDB Blob fallback and removes a media record', async () => {
  const database = fresh();
  const blob = new Blob(['image-bytes'], { type: 'image/webp' });
  const record = await saveMedia(
    {
      id: 'test',
      date: '2026-10-29',
      kind: 'progress',
      thumb: blob,
      width: 100,
      height: 100,
      tags: [],
      mime: 'image/webp',
    },
    blob,
    database,
  );
  expect(await (await readMedia(record)).text()).toBe('image-bytes');
  await deleteMedia('test', database);
  expect(await database.media.count()).toBe(0);
});
it('round-trips all data and media through zip, delete, restore exactly', async () => {
  const database = fresh();
  await seedDatabase(database);
  await database.dayLog.put({
    ...emptyDay('2026-10-29'),
    note: 'Türkçe günlük',
    water: 5,
    activeKcal: 321,
    health: {
      steps: 8000,
      activeKcal: 300,
      weight: 80,
      sleepMinutes: 420,
      sleepAt: '23:30',
      syncedAt: 123,
      sources: ['Fictional health source'],
    },
  });
  const profile = (await database.profile.get('main'))!;
  await database.profile.put({ ...profile, addBurnedToTarget: true, burnedTargetPercent: 50 });
  const plan = (await database.planSettings.get('main'))!;
  await database.planSettings.put(
    replaceDayExercise(
      chooseDayAlternative(selectProgram(plan, 'ppl', 6), '2026-10-29', 'home'),
      '2026-10-29',
      0,
      'push-up',
    ),
  );
  const data = await new LocalRepository(database).load();
  const raw = new Uint8Array([0, 1, 128, 255]);
  const thumb = new Uint8Array([3, 4, 5]);
  const document: BackupDocument = {
    format: 'yol-backup',
    version: 1,
    createdAt: '2026-10-29',
    data,
    media: [
      {
        id: 'media-1',
        date: '2026-10-29',
        kind: 'vlog',
        width: 1280,
        height: 720,
        sizeBytes: 4,
        tags: ['antrenman'],
        mime: 'video/webm',
      },
    ],
    exercises: [],
  };
  const bytes = await encodeBackup(document, {
    'media/media-1.bin': raw,
    'media/media-1.thumb': thumb,
  });
  const decoded = decodeBackup(bytes);
  expect(decoded.document).toEqual(document);
  expect(decoded.files['media/media-1.bin']).toEqual(raw);
  const streamed = await decodeBlobBackup(new Blob([new Uint8Array(bytes)]));
  expect(streamed.document).toEqual(document);
  expect(new Uint8Array(await streamed.media[0].blob!.arrayBuffer())).toEqual(raw);
  const compressed = zipSync({
    'data.json': strToU8(JSON.stringify(document)),
    'media/media-1.bin': raw,
    'media/media-1.thumb': thumb,
  });
  expect((await decodeBlobBackup(new Blob([new Uint8Array(compressed)]))).document).toEqual(
    document,
  );
  await clearAllData(database);
  expect(await database.dayLog.count()).toBe(0);
  await applyBackup(decoded, 'replace', database);
  expect(await new LocalRepository(database).load()).toEqual(data);
  expect(
    new Uint8Array(await (await readMedia((await database.media.get('media-1'))!)).arrayBuffer()),
  ).toEqual(raw);
  await database.dayLog.put(emptyDay('2026-10-30'));
  await applyBackup(decoded, 'merge', database);
  expect(await database.dayLog.count()).toBe(2);
});
it('rejects malformed data and incomplete media before any data is replaced', async () => {
  expect(() => decodeBackup(new Uint8Array([1, 2, 3]))).toThrow();
  const database = fresh();
  await seedDatabase(database);
  const data = await new LocalRepository(database).load();
  const document: BackupDocument = {
    format: 'yol-backup',
    version: 1,
    createdAt: 'now',
    data,
    media: [
      {
        id: 'test',
        date: '2026-10-29',
        kind: 'progress',
        width: 1,
        height: 1,
        sizeBytes: 4,
        tags: [],
        mime: 'image/webp',
      },
    ],
    exercises: [],
  };
  const bytes = await encodeBackup(document, {});
  expect(() => decodeBackup(bytes)).toThrow('eksik');
  expect(await database.food.count()).toBeGreaterThan(300);
  expect(() =>
    encodeBackup({ ...document, version: 2 } as unknown as BackupDocument, {}),
  ).toThrow();
});
it('rejects a media byte corruption even if the stored file size is unchanged', async () => {
  const database = fresh();
  await seedDatabase(database);
  const data = await new LocalRepository(database).load();
  const raw = new Uint8Array([123, 45, 67, 89, 231, 199]);
  const document: BackupDocument = {
    format: 'yol-backup',
    version: 1,
    createdAt: 'now',
    data,
    media: [
      {
        id: 'crc-test',
        date: '2026-10-29',
        kind: 'progress',
        width: 1,
        height: 1,
        sizeBytes: raw.length,
        tags: [],
        mime: 'image/webp',
      },
    ],
    exercises: [],
  };
  const bytes = await encodeBackup(document, {
    'media/crc-test.bin': raw,
    'media/crc-test.thumb': new Uint8Array([1]),
  });
  const index = bytes.findIndex((_, i) => raw.every((value, n) => bytes[i + n] === value));
  expect(index).toBeGreaterThan(0);
  bytes[index] ^= 1;
  expect(() => decodeBackup(bytes)).toThrow('bütünlük');
  await expect(decodeBlobBackup(new Blob([new Uint8Array(bytes)]))).rejects.toThrow('bütünlük');
});

it('reopens the original database after rebranding without resetting records', async () => {
  const original = new FormdaDatabase();
  expect(original.name).toBe('yol-local');
  databases.push(original);
  await seedDatabase(original);
  await original.dayLog.put({ ...emptyDay('2026-10-30'), note: 'Preserved journal', water: 7 });
  await original.profile.update('main', { name: 'Local fixture' });
  await original.food.update('egg', { favorite: true });
  original.close();
  const reopened = new FormdaDatabase();
  databases.push(reopened);
  await seedDatabase(reopened);
  expect((await reopened.dayLog.get('2026-10-30'))?.note).toBe('Preserved journal');
  expect((await reopened.dayLog.get('2026-10-30'))?.water).toBe(7);
  expect((await reopened.profile.get('main'))?.name).toBe('Local fixture');
  expect((await reopened.food.get('egg'))?.favorite).toBe(true);
});

it('upgrades the exercise library without replacing custom records or settings', async () => {
  const database = fresh();
  await seedDatabase(database);
  const original = (await database.exercise.get('leg-press'))!;
  await database.exercise.put({ ...original, howTo: ['My setup', 'My step', 'My cue'] });
  await database.exercise.put({
    ...original,
    id: 'custom-exercise',
    name: 'Local custom movement',
  });
  await database.meta.put({ key: 'libraryVersion', value: '1' });
  await database.dayLog.put({ ...emptyDay('2026-10-30'), note: 'Keep this journal' });
  const plan = (await database.planSettings.get('main'))!;
  await seedDatabase(database);
  expect((await database.exercise.get('leg-press'))?.howTo[0]).toBe('My setup');
  expect((await database.exercise.get('custom-exercise'))?.name).toBe('Local custom movement');
  expect(await database.exercise.count()).toBeGreaterThanOrEqual(151);
  expect((await database.meta.get('libraryVersion'))?.value).toBe('2');
  expect(await database.planSettings.get('main')).toEqual(plan);
  expect((await database.dayLog.get('2026-10-30'))?.note).toBe('Keep this journal');
});
