import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile, mkdtemp, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
const url = 'https://beratergun.github.io/formda/';
const root = await realpath(tmpdir()),
  profile = await mkdtemp(path.join(root, 'formda-live-'));
const context = await chromium.launchPersistentContext(profile, {
  headless: true,
  viewport: { width: 412, height: 915 },
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
});
const page = await context.newPage();
const external = [],
  writes = [],
  errors = [];
page.on('request', (r) => {
  if (
    !r.url().startsWith('https://beratergun.github.io/') &&
    !r.url().startsWith('blob:') &&
    !r.url().startsWith('data:')
  )
    external.push(new URL(r.url()).hostname);
  if (r.method() !== 'GET') writes.push({ host: new URL(r.url()).hostname, method: r.method() });
});
page.on('pageerror', (e) => errors.push(e.message));
try {
  const response = await page.goto(url);
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await page.getByRole('button', { name: 'Kahvaltı ekle', exact: true }).click();
  await page.getByRole('button', { name: 'Yazarak', exact: true }).click();
  await page.getByRole('textbox', { name: 'Ne yedin?' }).fill('2 yumurta, 1 dilim ekmek');
  await page.getByRole('button', { name: 'Kalemlere ayır' }).click();
  await page.getByRole('button', { name: 'Tümünü öğüne ekle' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Kaydedildi' })).toBeVisible();
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByText('219 kcal', { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('219 kcal', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Su artır' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Kaydedildi' })).toBeVisible();
  await page.reload();
  await expect(page.getByText(/1 \/ 8 bardak/)).toBeVisible();
  await context.setOffline(false);
  const cdp = await context.newCDPSession(page),
    installability = await cdp.send('Page.getInstallabilityErrors');
  await cdp.detach();
  const result = {
    url,
    http: response.status(),
    mealKcal: 219,
    offlineWater: 1,
    installability,
    external: [...new Set(external)],
    writes,
    errors,
  };
  const output = `docs/qa/${new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }).format(new Date())}`;
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/live.json`, JSON.stringify(result, null, 2));
  await page.screenshot({ path: `${output}/live-offline.png` });
  console.log(JSON.stringify(result, null, 2));
  expect(result.http).toBe(200);
  expect(installability.installabilityErrors).toEqual([]);
  expect(external).toEqual([]);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
} finally {
  await context.close();
  const resolved = await realpath(profile);
  if (path.dirname(resolved) === root && path.basename(resolved).startsWith('formda-live-'))
    await rm(resolved, { recursive: true, force: true });
}
