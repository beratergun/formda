import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
const dir = 'docs/qa/2026-10-30/model-evaluation';
await mkdir(dir, { recursive: true });
const samples = [];
if (process.argv.includes('--reuse-samples')) {
  const previous = JSON.parse(await readFile(`${dir}/online-results.json`, 'utf8'));
  for (const [i, result] of previous.entries())
    samples.push({ path: `${dir}/public-sample-${i}.jpg`, expected: result.expected });
  if (samples.length !== 10 || new Set(samples.map((s) => s.expected)).size !== 10)
    throw new Error('Ten distinct public classes required');
}
for (let i = 0; samples.length < 10 && i < 10; i++) {
  const response = await fetch(
    'https://datasets-server.huggingface.co/rows?dataset=ethz%2Ffood101&config=default&split=validation&offset=' +
      i * 250 +
      '&length=1',
    { signal: AbortSignal.timeout(30000) },
  );
  if (!response.ok) throw new Error('Public evaluation sample unavailable');
  const data = await response.json(),
    names = data.features.find((f) => f.name === 'label').type.names,
    row = data.rows[0];
  const image = await fetch(row.row.image.src, { signal: AbortSignal.timeout(30000) });
  if (!image.ok) throw new Error('Public image unavailable');
  const path = `${dir}/public-sample-${i}.jpg`;
  await writeFile(path, new Uint8Array(await image.arrayBuffer()));
  samples.push({ path, expected: names[row.row.label] });
}
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
const page = await context.newPage();
const writes = [],
  hosts = new Set();
page.on('request', (r) => {
  if (!r.url().startsWith('http://127.0.0.1')) {
    hosts.add(new URL(r.url()).hostname);
    if (!['GET', 'HEAD'].includes(r.method()))
      writes.push({ method: r.method(), host: new URL(r.url()).hostname });
  }
});
const results = [];
page.on('pageerror', (e) => console.log('Page error:', e.message));
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning')
    console.log('Browser:', m.text().slice(0, 250));
});
page.on('requestfailed', (r) =>
  console.log('Request failed:', r.url().slice(0, 200), r.failure()?.errorText),
);
try {
  await page.goto('http://127.0.0.1:4173/formda/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await page.getByRole('button', { name: 'Kahvaltı ekle', exact: true }).click();
  await page.getByRole('button', { name: 'Fotoğraf', exact: true }).click();
  await page.getByLabel('Model dosyalarının indirilmesini kabul ediyorum').check();
  // Observe the worker's predictions without changing its inference or loading logic.
  await page.evaluate(() => {
    const original = window.Worker;
    window.__foodPredictions = [];
    window.Worker = new Proxy(original, {
      construct(target, args) {
        const worker = Reflect.construct(target, args);
        if (String(args[0]).includes('recognition.worker'))
          worker.addEventListener('message', (e) => {
            if (e.data.error) window.__foodError = e.data.error;
            if (e.data.predictions) window.__foodPredictions.push(e.data.predictions);
          });
        return worker;
      },
    });
  });
  for (const [i, sample] of samples.entries()) {
    await page
      .locator('input[type=file][accept="image/*"]')
      .setInputFiles({
        name: 'public-food101.jpg',
        mimeType: 'image/jpeg',
        buffer: await readFile(sample.path),
      });
    await page.getByRole('button', { name: 'İlk 3 yemek önerisini göster', exact: true }).click();
    await page.waitForFunction(
      (count) => window.__foodError || window.__foodPredictions.length > count,
      i,
      { timeout: 300000 },
    );
    const error = await page.evaluate(() => window.__foodError);
    if (error) throw new Error(error);
    const predictions = await page.evaluate((index) => window.__foodPredictions[index], i);
    const hit = predictions.some((p) => p.label === sample.expected);
    results.push({ expected: sample.expected, predictions, hit });
    console.log(`Public sample ${i + 1}/10: ${hit ? 'hit' : 'miss'}`);
  }
  await writeFile(`${dir}/online-results.json`, JSON.stringify(results, null, 2));
  console.log(
    JSON.stringify(
      await page.evaluate(async () => ({
        controller: !!navigator.serviceWorker.controller,
        caches: await Promise.all(
          (await caches.keys()).map(async (name) => ({
            name,
            count: (await (await caches.open(name)).keys()).length,
          })),
        ),
      })),
    ),
  );
  await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Kahvaltı ekle', exact: true }).click();
  await page.getByRole('button', { name: 'Fotoğraf', exact: true }).click();
  await page
    .locator('input[type=file][accept="image/*"]')
    .setInputFiles({
      name: 'offline-public.jpg',
      mimeType: 'image/jpeg',
      buffer: await readFile(samples[0].path),
    });
  await page.getByLabel('Model dosyalarının indirilmesini kabul ediyorum').check();
  await page.getByRole('button', { name: 'İlk 3 yemek önerisini göster', exact: true }).click();
  await page.waitForFunction(() => window.__foodPredictions.length > 10, undefined, {
    timeout: 120000,
  });
  const summary = {
    offlineAfterReloadingWorker: true,
    model: 'onnx-community/swin-finetuned-food101-ONNX',
    revision: 'e5e50bfc6425aa546f3b4421ca8bd79d0dd610b8',
    dtype: 'q8',
    sampleSource: 'ethz/food101 validation, one row every 250 validation rows (10 classes)',
    sampleSize: results.length,
    top3Hits: results.filter((r) => r.hit).length,
    top3Accuracy: results.filter((r) => r.hit).length / results.length,
    externalWrites: writes,
    artifactHosts: [...hosts],
    results,
  };
  await writeFile(`${dir}/result.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
  if (summary.top3Accuracy < 0.6 || writes.length) process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
