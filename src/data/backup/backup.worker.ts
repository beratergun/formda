import { decodeBackup, encodeBackup, encodeBlobStream } from './codec';
import type { BackupDocument } from './schema';
import { FormdaDatabase } from '../db';
import { LocalRepository } from '../repositories';
import { readMedia } from '../media/opfs';
import { decodeBlobBackup } from './stream';

self.onmessage = async (
  event: MessageEvent<{
    id: number;
    action: 'encode' | 'decode' | 'decodeBlob' | 'create';
    databaseName: string;
    document: BackupDocument;
    files: Record<string, Uint8Array>;
    bytes: Uint8Array;
    blob: Blob;
  }>,
) => {
  try {
    const { id, action, document, files, bytes } = event.data;
    let result;
    if (action === 'create') {
      const database = new FormdaDatabase(event.data.databaseName);
      try {
        const data = await new LocalRepository(database).load();
        const media = await database.media.toArray();
        const metadata: BackupDocument = {
          format: 'yol-backup',
          version: 1,
          createdAt: new Date().toISOString(),
          data,
          media: media.map(({ blob, opfsPath, thumb, ...rest }) => {
            void blob;
            void opfsPath;
            void thumb;
            return rest;
          }),
          exercises: await database.exercise.toArray(),
        };
        async function* entries() {
          for (const record of media) {
            yield { name: `media/${record.id}.bin`, blob: await readMedia(record) };
            yield { name: `media/${record.id}.thumb`, blob: record.thumb };
          }
        }
        result = await encodeBlobStream(metadata, entries());
      } finally {
        database.close();
      }
    } else
      result =
        action === 'decodeBlob'
          ? await decodeBlobBackup(event.data.blob)
          : action === 'encode'
            ? await encodeBackup(document, files)
            : decodeBackup(bytes);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({
      id: event.data.id,
      error: error instanceof Error ? error.message : 'Yedek işlenemedi.',
    });
  }
};
