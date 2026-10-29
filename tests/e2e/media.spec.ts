import { test, expect, chromium, type Page } from '@playwright/test';
async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('yol-local');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const stable = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(stable)
        : value && typeof value === 'object'
          ? Object.fromEntries(
              Object.entries(value)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => [k, stable(v)]),
            )
          : value;
    const result: Record<string, unknown> = {};
    for (const name of Array.from(database.objectStoreNames)) {
      const values = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
        const request = database.transaction(name).objectStore(name).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      for (const value of values) {
        for (const key of ['blob', 'thumb'])
          if (value[key] instanceof Blob)
            value[key] = Array.from(new Uint8Array(await (value[key] as Blob).arrayBuffer()));
          else if (value[key] && typeof value[key] === 'object' && 'bytes' in value[key])
            value[key] = Array.from((value[key] as { bytes: Uint8Array }).bytes);
        if (value.opfsPath) {
          const root = await navigator.storage.getDirectory();
          const dir = await root.getDirectoryHandle('yol-media');
          const file = await (await dir.getFileHandle(String(value.opfsPath))).getFile();
          value.blob = Array.from(new Uint8Array(await file.arrayBuffer()));
          delete value.opfsPath;
        }
      }
      result[name] = values
        .filter((v) => v.key !== 'lastBackupAt')
        .sort((a, b) =>
          String(a.id || a.date || a.key).localeCompare(String(b.id || b.date || b.key)),
        );
    }
    database.close();
    return JSON.stringify(stable(result));
  });
}
test('progress photos, supported camera/video, and exact backup restore', async ({
  page,
  browserName,
}, info) => {
  test.setTimeout(150000);
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 640;
        const c = canvas.getContext('2d')!;
        const stream = canvas.captureStream(10);
        const draw = () => {
          c.fillStyle = '#087e83';
          c.fillRect(0, 0, 480, 640);
          c.fillStyle = '#e5f3dc';
          c.fillRect(160, 100, 160, 400);
        };
        draw();
        const interval = setInterval(draw, 100);
        setTimeout(() => clearInterval(interval), 20000);
        return stream;
      },
    });
    Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true });
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await page.getByRole('button', { name: 'Hızlı ekle' }).click();
  await page.getByRole('button', { name: 'Fotoğraf', exact: true }).click();
  await page.getByLabel('Zamanlayıcı').selectOption('0');
  if (browserName === 'webkit') {
    const image = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 640;
      const c = canvas.getContext('2d')!;
      c.fillStyle = '#087e83';
      c.fillRect(0, 0, 480, 640);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    for (let i = 0; i < 2; i++) {
      await page.locator('input[type=file]').setInputFiles({
        name: 'fictional.png',
        mimeType: 'image/png',
        buffer: Buffer.from(image, 'base64'),
      });
      await expect
        .poll(() =>
          page.evaluate(async () => {
            const request = indexedDB.open('yol-local');
            const database = await new Promise<IDBDatabase>(
              (r) => (request.onsuccess = () => r(request.result)),
            );
            const count = await new Promise<number>((r) => {
              const request = database.transaction('media').objectStore('media').count();
              request.onsuccess = () => r(request.result);
            });
            database.close();
            return count;
          }),
        )
        .toBe(i + 1);
    }
  } else {
    for (let i = 0; i < 2; i++) {
      await page.getByRole('button', { name: 'Kamerayı aç', exact: true }).click();
      if (i === 1) await expect(page.getByAltText('İlk fotoğrafınla hizalama')).toBeVisible();
      await expect
        .poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.videoWidth))
        .toBeGreaterThan(0);
      await page.getByRole('button', { name: 'Fotoğrafı çek', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Kamerayı aç', exact: true })).toBeVisible();
    }
  }
  await page.getByRole('button', { name: 'Zaman tüneli', exact: true }).click();
  await page.getByLabel('Önce sonra kaydırıcısı').fill('70');
  await expect(page.getByLabel('Önce sonra kaydırıcısı')).toHaveValue('70');
  await page.getByRole('button', { name: 'Yan yana', exact: true }).click();
  await expect(page.locator('.compare-side img')).toHaveCount(2);
  // Chromium creates the synthetic video at runtime; no fixture media is published.
  if (browserName === 'chromium') {
    const generator = await chromium.launch();
    const source = await generator.newPage();
    const video = await source.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const c = canvas.getContext('2d')!;
      c.fillStyle = '#087e83';
      c.fillRect(0, 0, 320, 240);
      const stream = canvas.captureStream(10),
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      const done = new Promise<number[]>((resolve) => {
        recorder.onstop = async () =>
          resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));
      });
      recorder.start();
      await new Promise((r) => setTimeout(r, 1200));
      recorder.stop();
      const result = await done;
      stream.getTracks().forEach((t) => t.stop());
      return result;
    });
    await generator.close();
    await page.getByRole('button', { name: 'Hızlı ekle' }).click();
    await page.getByRole('button', { name: 'Vlog', exact: true }).click();
    await page.locator('input[type=file]').setInputFiles({
      name: 'fictional.webm',
      mimeType: 'video/webm',
      buffer: Buffer.from(video),
    });
    await page.getByLabel('Başlık', { exact: true }).fill('Kurgusal antrenman günlüğü');
    await page.getByRole('button', { name: 'Vlogu kaydet', exact: true }).click();
    await page.getByRole('link', { name: "Günlük'te gör" }).click();
    await page.getByRole('button', { name: /Vlog ·/ }).click();
    await expect(page.getByLabel('Günlük vlog oynatıcı')).toBeVisible();
    await expect
      .poll(() =>
        page.getByLabel('Günlük vlog oynatıcı').evaluate((v: HTMLVideoElement) => v.readyState),
      )
      .toBeGreaterThanOrEqual(2);
    await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  }
  await page.getByRole('link', { name: 'Profil', exact: true }).click();
  const before = await snapshot(page);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tam yedek al', exact: true }).click();
  const backup = await pending;
  const path = info.outputPath('backup.zip');
  await backup.saveAs(path);
  await page.getByRole('button', { name: 'Tüm verilerimi sil', exact: true }).click();
  await page.getByRole('button', { name: 'Evet, tüm kayıtları sil', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Yolculuğuma başla' })).toBeVisible({
    timeout: 60000,
  });
  await page.locator('input[type=file][accept*="zip"]').setInputFiles(path);
  await expect(page.getByRole('link', { name: 'Bugün', exact: true })).toBeVisible({
    timeout: 60000,
  });
  expect(await snapshot(page)).toBe(before);
});
