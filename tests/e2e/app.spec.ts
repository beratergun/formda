import { test, expect, type Page } from '@playwright/test';
async function onboard(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await expect(page.getByRole('heading', { name: 'Bugün, kendin için.' })).toBeVisible();
}
async function saved(page: Page) {
  await expect(page.getByRole('status').filter({ hasText: /^Kaydedildi$/ })).toBeVisible();
}
test('onboarding, exact food arithmetic, local persistence and offline entry', async ({
  page,
  context,
  browserName,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const external: string[] = [];
  page.on('request', (r) => {
    if (
      !r.url().startsWith('http://127.0.0.1:4173') &&
      !r.url().startsWith('blob:') &&
      !r.url().startsWith('data:')
    )
      external.push(r.url());
  });
  await onboard(page);
  await page.getByRole('link', { name: 'İçeriğe geç', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await page.getByRole('button', { name: 'Kahvaltı ekle', exact: true }).click();
  await page.getByRole('button', { name: 'Yazarak', exact: true }).click();
  await page.getByRole('textbox', { name: 'Ne yedin?' }).fill('2 yumurta, 1 dilim ekmek');
  await page.getByRole('button', { name: 'Kalemlere ayır' }).click();
  await expect(page.getByText('220 kcal', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tümünü öğüne ekle' }).click();
  await saved(page);
  await page.reload();
  await expect(page.getByText('220 kcal', { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Bugün, kendin için.' })).toBeVisible();
  await page.getByRole('button', { name: 'Su artır' }).click();
  await saved(page);
  await page.reload();
  await expect(page.locator('.water-total')).toHaveText('250 / 2.000 ml');
  await context.setOffline(false);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  const manifest = await (await page.request.get('manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some((icon: { purpose: string }) => icon.purpose === 'maskable')).toBe(
    true,
  );
  if (browserName === 'chromium') {
    const cdp = await context.newCDPSession(page);
    const result = await cdp.send('Page.getInstallabilityErrors');
    expect(result.installabilityErrors).toEqual([]);
    await cdp.detach();
  }
});
test('two workout sets, running rest timer, summary and progress graph', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: 'Hızlı ekle' }).click();
  await page.getByRole('button', { name: 'Antrenman', exact: true }).click();
  await page.getByLabel('Seans türü').selectOption('strength');
  await page.getByLabel('Ağırlık (kg)', { exact: true }).fill('40');
  await page.getByLabel('Tekrar', { exact: true }).fill('12');
  await page.getByLabel('RPE', { exact: true }).fill('8');
  await page.getByRole('button', { name: 'Seti bitir' }).click();
  await expect(page.getByRole('timer', { name: 'Dinlenme sayacı' })).toBeVisible();
  const first = await page.getByRole('timer', { name: 'Dinlenme sayacı' }).innerText();
  await expect
    .poll(() => page.getByRole('timer', { name: 'Dinlenme sayacı' }).innerText())
    .not.toBe(first);
  await page.getByRole('button', { name: 'Seti bitir' }).click();
  await page.getByRole('button', { name: 'Antrenmanı tamamla' }).click();
  await expect(page.getByText('960', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Bugün/ }).first().click();
  await page.getByRole('link', { name: 'İlerleme', exact: true }).click();
  await page.getByRole('button', { name: 'Antrenman', exact: true }).click();
  await expect(page.getByRole('figure').first()).toBeVisible();
});
test('Friday swim schedule, all templates and two themes without overflow', async ({ page }) => {
  await onboard(page);
  await page.getByRole('link', { name: 'Planım', exact: true }).click();
  await page.getByLabel('Cuma türü').selectOption('swim');
  await saved(page);
  await page.getByRole('button', { name: 'Özel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hareket ekle', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Bugün', exact: true }).click();
  await page.locator('.date-strip').getByRole('button', { name: /Cuma$/ }).click();
  await expect(
    page.locator('.workout-card').getByRole('heading', { name: 'Yüzme', exact: true }),
  ).toBeVisible();
  for (const theme of ['dark', 'light']) {
    await page.evaluate((t) => {
      localStorage.setItem('yol-theme', t);
      document.documentElement.dataset.theme = t;
    }, theme);
    for (const name of ['Bugün', 'Günlük', 'İlerleme', 'Planım', 'Profil']) {
      await page.getByRole('link', { name, exact: true }).click();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
    }
  }
  await page.getByLabel('Yaş', { exact: true }).fill('-1');
  await page.getByRole('button', { name: 'Profilimi kaydet', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('18 ile 100 arasında bir değer gir.');
  await expect(page.getByLabel('Yaş', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Yaş', { exact: true }).fill('30');
  await page.getByRole('button', { name: 'Profilimi kaydet', exact: true }).click();
  await page.getByRole('link', { name: 'Planım', exact: true }).click();
  await page.getByRole('button', { name: 'Hedefler', exact: true }).click();
  await page.getByLabel('Kalori (kcal)', { exact: true }).fill('-1');
  await page.getByRole('button', { name: 'Hedefleri kaydet', exact: true }).click();
  await expect(page.getByLabel('Kalori (kcal)', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.getByLabel('Kalori (kcal)', { exact: true }).fill('1900');
  await page.getByLabel('Karbonhidrat (g)', { exact: true }).fill('-1');
  await page.getByRole('button', { name: 'Hedefleri kaydet', exact: true }).click();
  await expect(page.getByLabel('Karbonhidrat (g)', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.getByLabel('Karbonhidrat (g)', { exact: true }).fill('');
  await expect(page.getByRole('button', { name: 'Hedefleri kaydet', exact: true })).toBeEnabled();
  await page.getByRole('link', { name: 'Günlük', exact: true }).click();
  await page.getByLabel('Adım sayısı', { exact: true }).fill('-10');
  await page.getByLabel('Adım sayısı', { exact: true }).blur();
  await expect(page.getByLabel('Adım sayısı', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.getByRole('link', { name: 'İlerleme', exact: true }).click();
  await page.getByRole('button', { name: 'Kilo ve vücut', exact: true }).click();
  await page.getByLabel('Bugünkü kilo (kg)', { exact: true }).fill('-10');
  await page.getByLabel('Bugünkü kilo (kg)', { exact: true }).blur();
  await expect(page.getByLabel('Bugünkü kilo (kg)', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.getByLabel('Bel (cm)', { exact: true }).fill('-1');
  await page.getByLabel('Bel (cm)', { exact: true }).blur();
  await expect(page.getByLabel('Bel (cm)', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.reload();
  await page.getByRole('button', { name: 'Kilo ve vücut', exact: true }).click();
  await expect(page.getByLabel('Bugünkü kilo (kg)', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Bel (cm)', { exact: true })).toHaveValue('');
});

test('coach dashboard and monthly story stay local and export a vertical card', async ({
  page,
}, info) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true }),
  );
  await onboard(page);
  await expect(page.locator('.coach-card .button')).toHaveCount(1);
  await expect(page.getByRole('img', { name: /Alınan kalori:/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Protein:/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Harcanan kalori tahmini:/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /^Adım:/ })).toBeVisible();
  await expect(page.locator('.activity-strip .metric-ring')).toHaveCount(0);
  await page.getByRole('link', { name: 'İlerleme', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Rozet galerisi' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kişisel rekor duvarı' })).toBeVisible();
  await page.getByRole('button', { name: 'Aylık özet hikâyem' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Kartı paylaş / indir', exact: true }).first().click();
  const card = await download;
  expect(card.suggestedFilename()).toMatch(/^formda-.*-hikaye-1\.png$/);
  await card.saveAs(info.outputPath('story.png'));
  await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
