import { db, seedDatabase } from './db';
export function bootstrapDatabase() {
  if (typeof Worker === 'undefined') return seedDatabase();
  return new Promise<void>((resolve, reject) => {
    const worker = new Worker(new URL('./seed.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ error?: string }>) => {
      worker.terminate();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve();
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error('Yerel başlangıç verisi hazırlanamadı.'));
    };
    worker.postMessage(db.name);
  });
}
