import { YolDatabase, seedDatabase } from './db';
self.onmessage = async (event: MessageEvent<string>) => {
  const database = new YolDatabase(event.data);
  try {
    await seedDatabase(database);
    self.postMessage({});
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Yerel veri açılamadı.' });
  } finally {
    database.close();
  }
};
