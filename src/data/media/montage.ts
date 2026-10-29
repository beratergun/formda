import type { MediaRecord } from '../../domain/types';
import { readMedia } from './opfs';
import { recordingMime } from './export';

async function photoFrame(record: MediaRecord) {
  const blob = await readMedia(record);
  return new Promise<ImageBitmap>((resolve, reject) => {
    const worker = new Worker(new URL('./montage.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ bitmap: ImageBitmap; error?: string }>) => {
      worker.terminate();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.bitmap);
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('Video karesi hazırlanamadı.'));
    };
    worker.postMessage({ blob, record: { ...record, blob: undefined, thumb: undefined } });
  });
}
function nextFrame() {
  return new Promise<number>((resolve) => requestAnimationFrame(resolve));
}
async function slideshow(
  records: MediaRecord[],
  onProgress: (n: number) => void,
  signal?: AbortSignal,
) {
  const frames: string[] = [];
  for (let i = 0; i < records.length; i++) {
    if (signal?.aborted) throw new Error('Slayt gösterisi iptal edildi.');
    const record = records[i];
    const blob = record.kind === 'vlog' ? record.thumb : await readMedia(record);
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Kare okunamadı.'));
      reader.readAsDataURL(blob);
    });
    frames.push(
      `<figure style="animation-delay:${i}s"><img src="${url}" alt="${record.date}"><figcaption>Yol · ${record.date}</figcaption></figure>`,
    );
    onProgress(Math.round(((i + 1) / records.length) * 100));
  }
  const duration = Math.max(1, records.length);
  return new Blob(
    [
      `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Yol · Anılarım</title><style>body{margin:0;background:#102e2c;color:#e5f3dc;font:20px system-ui;text-align:center}main{position:relative;height:85vh;max-width:720px;margin:auto}figure{position:absolute;inset:0;margin:0;opacity:0;animation:slide ${duration}s infinite}img{width:100%;height:90%;object-fit:contain}figcaption{padding:12px}@keyframes slide{0%,${99 / duration}%{opacity:1}${Math.min(100, 100 / duration)}%,100%{opacity:0}}@media(prefers-reduced-motion:reduce){main{height:auto}figure{position:static;opacity:1;animation:none}img{max-height:80vh}}</style><h1>Yolundan anılar.</h1><p>Bu cihaz video oluşturmayı desteklemiyor. Karelerin yerel slayt gösterisinde.</p><main>${frames.join('')}</main></html>`,
    ],
    { type: 'text/html' },
  );
}
export async function createMontage(
  records: MediaRecord[],
  onProgress: (n: number) => void,
  signal?: AbortSignal,
) {
  if (!records.length) throw new Error('Önce en az bir anı seç.');
  const mime = recordingMime();
  if (!mime || !HTMLCanvasElement.prototype.captureStream)
    return slideshow(records, onProgress, signal);
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 960;
  const context = canvas.getContext('2d')!;
  const stream = canvas.captureStream(25);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1500000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const stopped = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
    recorder.onerror = () => reject(new Error('Video oluşturulamadı.'));
  });
  recorder.start(500);
  try {
    for (let i = 0; i < records.length; i++) {
      if (signal?.aborted) throw new Error('Video oluşturma iptal edildi.');
      const record = records[i];
      if (record.kind === 'vlog' && record.mime.startsWith('video/')) {
        const url = URL.createObjectURL(await readMedia(record));
        const video = document.createElement('video');
        video.src = url;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        try {
          await new Promise<void>((resolve, reject) => {
            video.onloadeddata = () => resolve();
            video.onerror = () => reject(new Error('Video okunamadı.'));
          });
          await video.play();
          const start = performance.now();
          while (performance.now() - start < 1000 && !video.ended) {
            if (signal?.aborted) throw new Error('Video oluşturma iptal edildi.');
            context.fillStyle = '#102e2c';
            context.fillRect(0, 0, 720, 960);
            const scale = Math.min(720 / video.videoWidth, 860 / video.videoHeight);
            const w = video.videoWidth * scale,
              h = video.videoHeight * scale;
            context.drawImage(video, (720 - w) / 2, (860 - h) / 2, w, h);
            context.fillStyle = '#e5f3dc';
            context.font = '30px sans-serif';
            context.fillText('Yol · ' + record.date, 35, 918);
            await nextFrame();
          }
        } finally {
          video.pause();
          video.removeAttribute('src');
          video.load();
          URL.revokeObjectURL(url);
        }
      } else {
        const bitmap = await photoFrame(record);
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        const start = performance.now();
        while (performance.now() - start < 1000) {
          if (signal?.aborted) throw new Error('Video oluşturma iptal edildi.');
          await nextFrame();
        }
      }
      onProgress(Math.round(((i + 1) / records.length) * 100));
    }
    recorder.stop();
    return await stopped;
  } finally {
    if (recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach((t) => t.stop());
  }
}
