import { it, expect, afterEach, vi } from 'vitest';
import { db, seedDatabase } from './db';
import { bootstrapDatabase } from './bootstrap';

afterEach(async () => {
  vi.unstubAllGlobals();
  await db.delete();
});
it('opens an already seeded database without loading any worker, including offline starts', async () => {
  await db.open();
  await seedDatabase();
  const worker = vi.fn(() => {
    throw new Error('worker must not start');
  });
  vi.stubGlobal('Worker', worker);
  await bootstrapDatabase();
  expect(worker).not.toHaveBeenCalled();
  expect(await db.food.count()).toBe(797);
});
it('uses a real local seed transaction when worker construction is unsupported', async () => {
  await db.open();
  vi.stubGlobal(
    'Worker',
    vi.fn(() => {
      throw new Error('unsupported');
    }),
  );
  await bootstrapDatabase();
  expect((await db.meta.get('foodCatalogVersion'))?.value).toBe('2');
  expect(await db.recipe.count()).toBe(160);
});
it('shares concurrent initialization and completes a local fallback on a handled worker failure', async () => {
  await db.open();
  let starts = 0;
  const event = new ErrorEvent('error', { cancelable: true });
  class FailingWorker {
    onerror?: (event: ErrorEvent) => void;
    onmessage?: () => void;
    constructor() {
      starts++;
    }
    postMessage() {
      queueMicrotask(() => this.onerror?.(event));
    }
    terminate() {}
  }
  vi.stubGlobal('Worker', FailingWorker);
  const first = bootstrapDatabase(),
    second = bootstrapDatabase();
  expect(first).toBe(second);
  await Promise.all([first, second]);
  expect(starts).toBe(1);
  expect(event.defaultPrevented).toBe(true);
  expect(await db.food.count()).toBe(797);
});
