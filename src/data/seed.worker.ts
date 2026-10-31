import { FormdaDatabase, seedDatabase } from './db';
import * as foods from './seed/foods';
import * as quotes from './seed/quotes';
import * as exercises from './seed/exercises';
self.onmessage = async (event: MessageEvent<string>) => {
  const database = new FormdaDatabase(event.data);
  try {
    await seedDatabase(database, { ...foods, ...quotes, ...exercises });
    self.postMessage({});
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Yerel veri açılamadı.' });
  } finally {
    database.close();
  }
};
