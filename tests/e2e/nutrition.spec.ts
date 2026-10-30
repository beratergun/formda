import { test, expect } from '@playwright/test';

test('creates a personal food, scales the saved snapshot, copies, deletes, undoes and restores a backup', async ({
  page,
}, info) => {
  // Includes a full catalogue ZIP restore, as does the longer media recovery scenario.
  test.setTimeout(180000);
  await page.goto('./');
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await expect(page.getByText('Henüz beslenme kaydın yok.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Kahvaltı ekle', exact: true }).click();
  await page.getByRole('button', { name: 'Özel besin', exact: true }).click();
  await page.getByLabel('Besin adı', { exact: true }).fill('Kurgusal etiketli besin');
  await page.getByLabel('Özel besin kalorisi').fill('200');
  await page.getByLabel('Özel besin proteini').fill('20');
  await page.getByLabel('Özel besin karbonhidratı').fill('10');
  await page.getByLabel('Özel besin yağı').fill('5');
  await page.getByRole('button', { name: 'Besini kaydet ve porsiyonu seç' }).click();
  await expect(
    page.getByText('Kullanıcı beyanı · kendi etiketi veya ölçümü', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Miktar (g)', { exact: true }).fill('150');
  await expect(page.getByText('300 kcal', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Öğüne ekle', exact: true }).click();
  const calories = () => page.getByRole('img', { name: /Alınan kalori:/ });
  const saved = () =>
    page
      .getByRole('status')
      .filter({ hasText: /^Kaydedildi$/ })
      .waitFor();
  await saved();
  await page.reload();
  await expect(calories()).toHaveAttribute('aria-label', /300 kcal/);
  await page.getByRole('button', { name: 'Kurgusal etiketli besin düzenle', exact: true }).click();
  await page.getByLabel('Yeni miktar').fill('');
  await page.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
  await expect(page.getByLabel('Yeni miktar')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Yeni miktar').fill('75');
  await page.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
  await saved();
  await page.reload();
  await expect(calories()).toHaveAttribute('aria-label', /150 kcal/);
  await expect(page.getByRole('img', { name: /Protein:/ })).toHaveAttribute('aria-label', /15 g/);
  await page.getByRole('button', { name: 'Kurgusal etiketli besin düzenle', exact: true }).click();
  await page.getByRole('button', { name: 'Aynı kaydı tekrar ekle' }).click();
  await saved();
  await expect(calories()).toHaveAttribute('aria-label', /300 kcal/);
  await page
    .getByRole('button', { name: 'Kurgusal etiketli besin düzenle', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Kalemi sil', exact: true }).click();
  await page.getByRole('button', { name: 'Evet, kalemi sil', exact: true }).click();
  await expect(calories()).toHaveAttribute('aria-label', /150 kcal/);
  await page.getByRole('button', { name: 'Geri al', exact: true }).click();
  await saved();
  await page.reload();
  await expect(calories()).toHaveAttribute('aria-label', /300 kcal/);
  await expect(
    page.getByRole('button', { name: 'Kurgusal etiketli besin düzenle', exact: true }),
  ).toHaveCount(2);
  await page.getByRole('link', { name: 'Profil', exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tam yedek al', exact: true }).click();
  const backup = await downloading;
  const path = info.outputPath('nutrition.zip');
  await backup.saveAs(path);
  await page.getByRole('button', { name: 'Tüm verilerimi sil', exact: true }).click();
  await page.getByRole('button', { name: 'Evet, tüm kayıtları sil', exact: true }).click();
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).waitFor();
  await page.locator('input[type=file][accept*="zip"]').setInputFiles(path);
  await page.getByRole('link', { name: 'Bugün', exact: true }).click();
  await expect(calories()).toHaveAttribute('aria-label', /300 kcal/);
  await expect(
    page.getByRole('button', { name: 'Kurgusal etiketli besin düzenle', exact: true }),
  ).toHaveCount(2);
});
