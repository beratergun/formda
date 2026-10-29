import { Zip, ZipPassThrough, unzipSync, strToU8, strFromU8 } from 'fflate';
import { backupSchema, type BackupDocument } from './schema';

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes: Uint8Array) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
function verifyZip(bytes: Uint8Array, files: Record<string, Uint8Array>) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw new Error('ZIP dizini bulunamadı.');
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const names = new Set<string>();
  for (let i = 0; i < count; i++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50)
      throw new Error('ZIP dizini bozuk.');
    const nameLength = view.getUint16(offset + 28, true),
      extra = view.getUint16(offset + 30, true),
      comment = view.getUint16(offset + 32, true);
    const name = strFromU8(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if (names.has(name) || !files[name] || crc32(files[name]) !== view.getUint32(offset + 16, true))
      throw new Error('Yedek bütünlük kontrolü başarısız.');
    names.add(name);
    offset += 46 + nameLength + extra + comment;
  }
  if (names.size !== Object.keys(files).length) throw new Error('ZIP dosya sayısı eşleşmiyor.');
}

export function encodeBackup(
  document: BackupDocument,
  files: Record<string, Uint8Array>,
): Promise<Uint8Array> {
  backupSchema.parse(document);
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const zip = new Zip((error, chunk, final) => {
      if (error) {
        reject(error);
        return;
      }
      chunks.push(chunk);
      if (final) {
        const bytes = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
        let offset = 0;
        for (const part of chunks) {
          bytes.set(part, offset);
          offset += part.length;
        }
        resolve(bytes);
      }
    });
    for (const [name, bytes] of Object.entries({
      'data.json': strToU8(JSON.stringify(document)),
      ...files,
    })) {
      const entry = new ZipPassThrough(name);
      zip.add(entry);
      entry.push(bytes, true);
    }
    zip.end();
  });
}
export function decodeBackup(bytes: Uint8Array) {
  let total = 0;
  const files = unzipSync(bytes, {
    filter: (file) => {
      total += file.originalSize;
      if (file.originalSize > 512 * 1024 * 1024 || total > 1024 * 1024 * 1024)
        throw new Error('Yedek bu cihazda işlenemeyecek kadar büyük.');
      if (!/^data\.json$|^media\/[\w-]+\.(bin|thumb)$/.test(file.name))
        throw new Error('Yedekte geçersiz dosya adı var.');
      return true;
    },
  });
  verifyZip(bytes, files);
  if (!files['data.json']) throw new Error('Yol yedek dosyası bulunamadı.');
  const document = backupSchema.parse(JSON.parse(strFromU8(files['data.json'])));
  for (const media of document.media) {
    if (
      !files[`media/${media.id}.bin`] ||
      !files[`media/${media.id}.thumb`] ||
      files[`media/${media.id}.bin`].length !== media.sizeBytes
    )
      throw new Error('Yedekte eksik veya bozuk medya var.');
  }
  return { document, files };
}

export async function encodeBlobStream(
  document: BackupDocument,
  files: AsyncIterable<{ name: string; blob: Blob }>,
): Promise<Blob> {
  backupSchema.parse(document);
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let failure: Error | undefined;
  const zip = new Zip((error, chunk) => {
    if (error) failure = error;
    else chunks.push(new Uint8Array(chunk));
  });
  const metadata = new ZipPassThrough('data.json');
  zip.add(metadata);
  metadata.push(strToU8(JSON.stringify(document)), true);
  for await (const { name, blob } of files) {
    const entry = new ZipPassThrough(name);
    zip.add(entry);
    const reader = blob.stream().getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      entry.push(value);
    }
    entry.push(new Uint8Array(), true);
    if (failure) throw failure;
  }
  zip.end();
  if (failure) throw failure;
  return new Blob(chunks, { type: 'application/zip' });
}
