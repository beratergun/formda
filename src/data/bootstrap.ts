import { db, seedDatabase, databaseIsCurrent } from './db';
let pending: Promise<void> | undefined;
export function bootstrapDatabase(): Promise<void> {
  return (pending ||= prepare().finally(() => {
    pending = undefined;
  }));
}
async function prepare() {
  if (await databaseIsCurrent()) return;
  if (typeof Worker === 'undefined') return seedDatabase();
  return new Promise<void>((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL('./seed.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      void seedDatabase().then(resolve, reject);
      return;
    }
    worker.onmessage = (event: MessageEvent<{ error?: string }>) => {
      worker.terminate();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve();
    };
    worker.onerror = (event) => {
      event.preventDefault();
      worker.terminate();
      void seedDatabase().then(resolve, reject);
    };
    worker.postMessage(db.name);
  });
}
