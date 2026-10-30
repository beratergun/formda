import { test, expect } from '@playwright/test';

test('persists exact water entries, custom goal, edits and confirmed deletion', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  const total = page.locator('.water-total b');
  const saved = () =>
    page
      .getByRole('status')
      .filter({ hasText: /^Kaydedildi$/ })
      .waitFor();
  await page.getByRole('button', { name: 'Su artır', exact: true }).dblclick();
  await expect(total).toHaveText('500');
  await page.getByLabel('Su miktarı (ml)', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Miktarı ekle', exact: true }).click();
  await expect(page.getByLabel('Su miktarı (ml)', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(total).toHaveText('500');
  await page.getByLabel('Su miktarı (ml)', { exact: true }).fill('125');
  await page.getByRole('button', { name: 'Miktarı ekle', exact: true }).click();
  await expect(total).toHaveText('625');
  await page.getByText('Su hedefini düzenle', { exact: true }).click();
  await page.getByLabel('Su hedefi (ml)', { exact: true }).fill('2500');
  await page.getByRole('button', { name: 'Su hedefini kaydet' }).click();
  await saved();
  await page.reload();
  await expect(page.locator('.water-total')).toHaveText('625 / 2.500 ml');
  await page.getByText('Su kayıt geçmişi · 3 giriş', { exact: true }).click();
  await page.getByRole('button', { name: '125 ml su kaydını düzenle', exact: true }).click();
  await page.getByLabel('Kayıtlı su miktarı (ml)', { exact: true }).fill('200');
  await page.getByRole('button', { name: 'Su kaydını güncelle' }).click();
  await expect(total).toHaveText('700');
  await page
    .getByRole('button', { name: '250 ml su kaydını düzenle', exact: true })
    .first()
    .click();
  await page.getByRole('button', { name: 'Su kaydını sil', exact: true }).click();
  await expect(total).toHaveText('700');
  await page.getByRole('button', { name: 'Evet, su kaydını sil', exact: true }).click();
  await expect(total).toHaveText('450');
  await saved();
  await page.reload();
  await expect(total).toHaveText('450');
  await expect(page.getByText('Su kayıt geçmişi · 2 giriş', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Önceki hafta', exact: true }).click();
  await expect(total).toHaveText('0');
  await page.getByRole('button', { name: '100 ml su ekle', exact: true }).click();
  await expect(total).toHaveText('100');
  await saved();
  await page.getByRole('button', { name: 'Bugüne dön', exact: true }).click();
  await expect(total).toHaveText('450');
});
