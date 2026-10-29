import type { MediaRecord } from '../../domain/types';
interface BinaryBlob {
  bytes: Uint8Array;
  mime: string;
}
function hydrate(value: Blob | BinaryBlob): Blob {
  return value instanceof Blob
    ? value
    : new Blob([new Uint8Array(value.bytes)], { type: value.mime });
}
export function hydrateMedia(record: MediaRecord): MediaRecord {
  if (!record) return record;
  return {
    ...record,
    thumb: hydrate(record.thumb),
    ...(record.blob ? { blob: hydrate(record.blob) } : {}),
  };
}
/** Compatibility encoding for engines that reject Blob values in IndexedDB. */
export async function binaryMedia(record: MediaRecord): Promise<MediaRecord> {
  const encode = async (blob: Blob): Promise<BinaryBlob> => ({
    bytes: new Uint8Array(await blob.arrayBuffer()),
    mime: blob.type,
  });
  return {
    ...record,
    thumb: await encode(record.thumb),
    ...(record.blob ? { blob: await encode(record.blob) } : {}),
  } as unknown as MediaRecord;
}
export function blobStorageError(error: unknown) {
  return error instanceof Error && /Blob|DataClone|UnknownError/.test(error.message);
}
