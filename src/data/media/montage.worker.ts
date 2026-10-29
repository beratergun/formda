import type { MediaRecord } from '../../domain/types';

self.onmessage = async (event: MessageEvent<{ blob: Blob; record: MediaRecord }>) => {
  try {
    const { blob, record } = event.data;
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(720, 960);
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#102e2c';
    context.fillRect(0, 0, 720, 960);
    const scale = Math.min(720 / bitmap.width, 860 / bitmap.height);
    const w = bitmap.width * scale,
      h = bitmap.height * scale;
    context.drawImage(bitmap, (720 - w) / 2, (860 - h) / 2, w, h);
    bitmap.close();
    context.fillStyle = '#e5f3dc';
    context.font = '30px sans-serif';
    context.fillText('Formda · ' + record.date, 35, 918);
    self.postMessage({ bitmap: canvas.transferToImageBitmap() });
  } catch {
    self.postMessage({ error: 'Fotoğraf karesi hazırlanamadı.' });
  }
};
