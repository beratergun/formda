import { test, expect } from '@playwright/test';
test('keeps energy estimates opt-in and works without Health Connect', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await page.getByRole('link', { name: 'Profil', exact: true }).click();
  await expect(page.getByLabel('Harcananı hedefe ekle', { exact: true })).not.toBeChecked();
  await page.getByLabel('Elle aktif kalori (kcal)').fill('320');
  await page.getByRole('button', { name: 'Kaynakları ve izinleri yönet' }).click();
  await expect(page.getByRole('dialog')).toContainText('PWA ve iPhone');
  await expect(page.getByRole('button', { name: 'İzin ver ve seçili günü oku' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  await page.getByRole('link', { name: 'Bugün', exact: true }).click();
  await expect(page.getByRole('img', { name: /Alınan kalori:.*hedef 1900/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Harcanan kalori tahmini: 320/ })).toBeVisible();
  await page.getByRole('link', { name: 'Profil', exact: true }).click();
  await page.getByLabel('Harcananı hedefe ekle', { exact: true }).check();
  await page.getByLabel('Harcananın hedefe eklenecek yüzdesi').fill('50');
  await page.getByRole('button', { name: 'Profilimi kaydet', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /^Kaydedildi$/ })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Harcananı hedefe ekle', { exact: true })).toBeChecked();
  await page.getByRole('link', { name: 'Bugün', exact: true }).click();
  await expect(page.getByRole('img', { name: /Alınan kalori:.*hedef 2060/ })).toBeVisible();
});
test('requires model consent and a confirmed portion before saving a photo suggestion', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(target, args) {
        if (String(args[0]).includes('recognition.worker')) {
          const mock = {
            onmessage: null as ((event: { data: unknown }) => void) | null,
            postMessage() {
              setTimeout(
                () =>
                  mock.onmessage?.({
                    data: {
                      predictions: [
                        { label: 'omelette', score: 0.8 },
                        { label: 'pizza', score: 0.12 },
                        { label: 'hamburger', score: 0.08 },
                      ],
                    },
                  }),
                0,
              );
            },
            terminate() {},
          };
          return mock;
        }
        return Reflect.construct(target, args);
      },
    });
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await page.getByRole('button', { name: 'Kahvaltı ekle', exact: true }).click();
  await page.getByRole('button', { name: 'Fotoğraf', exact: true }).click();
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#e8c551';
    ctx.fillRect(0, 0, 64, 64);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type=file][accept="image/*"]').setInputFiles({
    name: 'fictional.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  });
  await expect(page.getByRole('button', { name: 'İlk 3 yemek önerisini göster' })).toBeDisabled();
  await page.getByLabel('Model dosyalarının indirilmesini kabul ediyorum').check();
  await page.getByRole('button', { name: 'İlk 3 yemek önerisini göster' }).click();
  await page.getByRole('button', { name: 'Omlet · %80 tahmin', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sade omlet', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Büyük porsiyon', exact: true }).click();
  await expect(page.getByLabel('Miktar (g)', { exact: true })).toHaveValue('187.5');
  await page.getByRole('button', { name: 'Öğüne ekle', exact: true }).click();
  await expect(page.locator('.meal-items')).toContainText('Sade omlet');
});
