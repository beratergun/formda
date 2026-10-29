import type { MediaRecord } from '../../domain/types';
import { db, type YolDatabase } from '../db';

export async function saveMedia(record: Omit<MediaRecord, 'blob' | 'opfsPath' | 'sizeBytes'>, blob: Blob, database = db) {
  let stored: MediaRecord = { ...record, blob, sizeBytes: blob.size };
  try {
    if (!navigator.storage?.getDirectory) throw new Error('OPFS unavailable');
    const root = await navigator.storage.getDirectory();
    const directory = await root.getDirectoryHandle('yol-media', { create: true });
    const file = await directory.getFileHandle(record.id, { create: true });
    const writable = await file.createWritable();
    await writable.write(blob); await writable.close();
    stored = { ...record, opfsPath: record.id, sizeBytes: blob.size };
  } catch { /* The IndexedDB Blob fallback also works without OPFS support. */ }
  try { await database.media.put(stored); }
  catch (error) { if (stored.opfsPath) await removeOpfs(stored.opfsPath); throw error; }
  return stored;
}
export async function readMedia(record: MediaRecord): Promise<Blob> {
  if (record.blob) return record.blob;
  if (!record.opfsPath) throw new Error('Medya dosyası bulunamadı.');
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle('yol-media');
  return (await dir.getFileHandle(record.opfsPath)).getFile();
}
async function removeOpfs(path: string) {
  try { const root = await navigator.storage.getDirectory(); const dir = await root.getDirectoryHandle('yol-media'); await dir.removeEntry(path); } catch { /* A missing file is already removed. */ }
}
export async function deleteMedia(id: string, database: YolDatabase = db) {
  const record = await database.media.get(id);
  await database.media.delete(id);
  if (record?.opfsPath) await removeOpfs(record.opfsPath);
}
export async function clearAllData(database = db) {
  const records = await database.media.toArray();
  await database.transaction('rw', database.tables, async () => { for (const table of database.tables) await table.clear(); });
  await Promise.all(records.filter(r => r.opfsPath).map(r => removeOpfs(r.opfsPath!)));
}
export async function storageInfo(database = db) {
  const records = await database.media.toArray();
  const estimate = await navigator.storage?.estimate?.() || {};
  const photo = records.filter(r => r.kind !== 'vlog').reduce((a,r) => a+r.sizeBytes,0);
  const video = records.filter(r => r.kind === 'vlog').reduce((a,r) => a+r.sizeBytes,0);
  return { photo, video, usage: estimate.usage || photo+video, quota: estimate.quota || 0, nearLimit: !!estimate.quota && (estimate.usage || 0) / estimate.quota > .85 };
}
