import { db, seedDatabase, type FormdaDatabase } from '../db';
import { clearAllData, removeOpfs } from '../media/opfs';
import type { MediaRecord } from '../../domain/types';
import type { decodeBackup } from './codec';
import type { BackupDocument } from './schema';
import { binaryMedia, blobStorageError } from '../media/binary';
import type { decodeBlobBackup } from './stream';

type Decoded = ReturnType<typeof decodeBackup>;
let nextId = 0;
function runWorker<T>(payload: object): Promise<T> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./backup.worker.ts', import.meta.url), { type: 'module' });
    const id = nextId++;
    worker.onmessage = (event: MessageEvent<{ id: number; result: T; error?: string }>) => {
      worker.terminate();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.result);
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('Yedek işlenemedi.'));
    };
    worker.postMessage({ ...payload, id });
  });
}
export async function createBackup(database: FormdaDatabase = db) {
  const blob = await runWorker<Blob>({ action: 'create', databaseName: database.name });
  await database.meta.put({ key: 'lastBackupAt', value: new Date().toISOString() });
  return blob;
}
export async function restoreBackup(blob: Blob, mode: 'merge' | 'replace', database = db) {
  const decoded = await runWorker<Awaited<ReturnType<typeof decodeBlobBackup>>>({
    action: 'decodeBlob',
    blob,
  });
  await applyRecords(decoded.document, decoded.media, mode, database);
}
export async function applyBackup(
  { document, files }: Decoded,
  mode: 'merge' | 'replace',
  database = db,
) {
  const media: MediaRecord[] = document.media.map((record) => ({
    ...record,
    blob: new Blob([new Uint8Array(files[`media/${record.id}.bin`])], { type: record.mime }),
    thumb: new Blob([new Uint8Array(files[`media/${record.id}.thumb`])], {
      type: record.thumbMime || 'image/webp',
    }),
  }));
  await applyRecords(document, media, mode, database);
}
async function applyRecords(
  document: BackupDocument,
  media: MediaRecord[],
  mode: 'merge' | 'replace',
  database: FormdaDatabase,
) {
  const previous = await database.media.toArray();
  // All validation and media decoding finish before the atomic replacement begins.
  const commit = (records: MediaRecord[]) =>
    database.transaction('rw', database.tables, async () => {
      if (mode === 'replace') for (const table of database.tables) await table.clear();
      for (const [name, values] of Object.entries(document.data))
        await database.table(name).bulkPut(values);
      await database.media.bulkPut(records);
      await database.exercise.bulkPut(document.exercises);
    });
  try {
    await commit(media);
  } catch (error) {
    if (!blobStorageError(error) || !media.length) throw error;
    await commit(await Promise.all(media.map(binaryMedia)));
  }
  const replaced = new Set(media.map((m) => m.id));
  await Promise.all(
    previous
      .filter((m) => m.opfsPath && (mode === 'replace' || replaced.has(m.id)))
      .map((m) => removeOpfs(m.opfsPath!)),
  );
}
export async function resetDatabase() {
  await clearAllData();
  await seedDatabase();
}
