import { saveMedia } from './opfs';
import type { MediaRecord } from '../../domain/types';

export interface CompressedImage {
  image: Blob;
  thumb: Blob;
  width: number;
  height: number;
}
async function compressFallback(blob: Blob): Promise<CompressedImage> {
  const url = URL.createObjectURL(blob),
    image = new Image();
  try {
    image.src = url;
    await image.decode();
    const ratio = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
    const encode = (canvas: HTMLCanvasElement, quality: number) =>
      new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Fotoğraf işlenemedi.'))),
          'image/webp',
          quality,
        ),
      );
    let output = await encode(canvas, 0.8);
    if (output.type !== 'image/webp')
      output = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Fotoğraf işlenemedi.'))),
          'image/jpeg',
          0.8,
        ),
      );
    const thumb = document.createElement('canvas'),
      scale = Math.min(1, 320 / canvas.width);
    thumb.width = Math.max(1, Math.round(canvas.width * scale));
    thumb.height = Math.max(1, Math.round(canvas.height * scale));
    thumb.getContext('2d')!.drawImage(canvas, 0, 0, thumb.width, thumb.height);
    return {
      image: output,
      thumb: await encode(thumb, 0.75),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function compressImage(blob: Blob): Promise<CompressedImage> {
  if (blob.size > 40 * 1024 * 1024)
    return Promise.reject(new Error('Lütfen 40 MB altında bir fotoğraf seç.'));
  return new Promise<CompressedImage>((resolve, reject) => {
    const worker = new Worker(new URL('./image.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ result: CompressedImage; error?: string }>) => {
      worker.terminate();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.result);
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('Fotoğraf işlenemedi.'));
    };
    worker.postMessage(blob);
  }).catch(() => compressFallback(blob));
}
export async function addImage(blob: Blob, date: string, kind: MediaRecord['kind'], pose?: string) {
  const result = await compressImage(blob);
  return saveMedia(
    {
      id: crypto.randomUUID(),
      date,
      kind,
      pose,
      thumb: result.thumb,
      width: result.width,
      height: result.height,
      mime: result.image.type,
      tags: [],
    },
    result.image,
  );
}
