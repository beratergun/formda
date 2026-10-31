import { Inflate, strFromU8 } from 'fflate';
import { backupSchema } from './schema';
import type { MediaRecord } from '../../domain/types';

const table = Array.from({ length: 256 }, (_, i) => {
  let n = i;
  for (let j = 0; j < 8; j++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
async function bytes(blob: Blob, start: number, length: number) {
  if (start < 0 || length < 0 || start + length > blob.size)
    throw new Error('ZIP sınırları geçersiz.');
  return new Uint8Array(await blob.slice(start, start + length).arrayBuffer());
}
/** Reads ZIP32 entries in bounded chunks; the full archive never becomes one ArrayBuffer. */
export async function decodeBlobBackup(blob: Blob) {
  const tail = await bytes(blob, Math.max(0, blob.size - 65557), Math.min(blob.size, 65557));
  const view = new DataView(tail.buffer);
  let end = -1;
  for (let i = tail.length - 22; i >= 0; i--)
    if (
      view.getUint32(i, true) === 0x06054b50 &&
      i + 22 + view.getUint16(i + 20, true) === tail.length
    ) {
      end = i;
      break;
    }
  if (end < 0) throw new Error('ZIP dizini bulunamadı.');
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  if (view.getUint16(end + 4, true) !== 0 || count === 65535)
    throw new Error('Çok parçalı veya ZIP64 yedek desteklenmiyor.');
  const files = new Map<string, Blob>();
  for (let i = 0; i < count; i++) {
    const header = await bytes(blob, offset, 46);
    const h = new DataView(header.buffer);
    if (h.getUint32(0, true) !== 0x02014b50 || h.getUint16(8, true) & 1)
      throw new Error('ZIP dizini bozuk veya şifreli.');
    const method = h.getUint16(10, true),
      crc = h.getUint32(16, true),
      compressed = h.getUint32(20, true),
      size = h.getUint32(24, true),
      nameLength = h.getUint16(28, true);
    const name = strFromU8(await bytes(blob, offset + 46, nameLength));
    if (!/^data\.json$|^media\/[\w-]+\.(bin|thumb)$/.test(name) || files.has(name))
      throw new Error('Yedekte geçersiz veya yinelenen dosya adı var.');
    if (method !== 0 && method !== 8) throw new Error('Bu ZIP sıkıştırma yöntemi desteklenmiyor.');
    const localOffset = h.getUint32(42, true),
      local = await bytes(blob, localOffset, 30),
      l = new DataView(local.buffer);
    if (l.getUint32(0, true) !== 0x04034b50) throw new Error('ZIP yerel başlığı bozuk.');
    const start = localOffset + 30 + l.getUint16(26, true) + l.getUint16(28, true);
    const parts: Uint8Array<ArrayBuffer>[] = [];
    let actual = 0,
      checksum = 0xffffffff;
    const accept = (chunk: Uint8Array) => {
      actual += chunk.length;
      if (actual > size) throw new Error('ZIP boyut kontrolü başarısız.');
      for (const b of chunk) checksum = table[(checksum ^ b) & 255] ^ (checksum >>> 8);
      parts.push(new Uint8Array(chunk));
    };
    const inflate = method === 8 ? new Inflate(accept) : undefined;
    for (let pos = 0; pos < compressed; pos += 65536) {
      const chunk = await bytes(blob, start + pos, Math.min(65536, compressed - pos));
      if (inflate) inflate.push(chunk, pos + chunk.length === compressed);
      else accept(chunk);
    }
    if (actual !== size || (checksum ^ 0xffffffff) >>> 0 !== crc)
      throw new Error('Yedek bütünlük kontrolü başarısız.');
    files.set(name, new Blob(parts));
    offset += 46 + nameLength + h.getUint16(30, true) + h.getUint16(32, true);
  }
  const metadata = files.get('data.json');
  if (!metadata || metadata.size > 128 * 1024 * 1024)
    throw new Error('berXfit yedek belgesi eksik veya çok büyük.');
  const document = backupSchema.parse(JSON.parse(await metadata.text()));
  const media: MediaRecord[] = document.media.map((record) => {
    const content = files.get(`media/${record.id}.bin`),
      thumb = files.get(`media/${record.id}.thumb`);
    if (!content || !thumb || content.size !== record.sizeBytes)
      throw new Error('Yedekte eksik veya bozuk medya var.');
    return {
      ...record,
      blob: content.slice(0, content.size, record.mime),
      thumb: thumb.slice(0, thumb.size, record.thumbMime || 'image/webp'),
    };
  });
  return { document, media };
}
