import { test, expect } from '@playwright/test';

test('edits dated weights and deletes only the confirmed manual record', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  for (let i = 0; i < 2; i++)
    await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await page.getByRole('button', { name: '100 ml su ekle', exact: true }).click();
  await page.getByRole('button', { name: 'Hızlı ekle', exact: true }).click();
  await page.getByRole('button', { name: 'Tartı', exact: true }).click();
  const today = await page.getByLabel('Tartı tarihi', { exact: true }).inputValue();
  const previous = new Date(`${today}T12:00:00Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  const yesterday = previous.toISOString().slice(0, 10);
  await page.getByLabel('Tartı tarihi', { exact: true }).fill(yesterday);
  await page.getByLabel('Kilo (kg)', { exact: true }).fill('80');
  await page.getByRole('button', { name: 'Tartıyı kaydet', exact: true }).click();
  await expect(page.getByRole('button', { name: /80 kg · Manuel/ })).toBeVisible();
  await page.getByLabel('Kilo (kg)', { exact: true }).fill('79,5');
  await page.getByRole('button', { name: 'Tartıyı kaydet', exact: true }).click();
  await expect(page.getByRole('button', { name: /79,5 kg · Manuel/ })).toBeVisible();
  await page.getByLabel('Tartı tarihi', { exact: true }).fill(today);
  await page.getByLabel('Kilo (kg)', { exact: true }).fill('81');
  await page.getByRole('button', { name: 'Tartıyı kaydet', exact: true }).click();
  await expect(page.getByRole('button', { name: /81 kg · Manuel/ })).toBeVisible();
  await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  await page.reload();
  await expect(page.locator('.water-total b')).toHaveText('100');
  await page.getByRole('link', { name: 'İlerleme', exact: true }).click();
  await page.getByRole('button', { name: 'Kilo ve vücut', exact: true }).click();
  await page.getByRole('button', { name: 'Tartı ekle veya düzenle' }).click();
  await page.getByRole('button', { name: /79,5 kg · Manuel/ }).click();
  await page.getByLabel('Kilo (kg)', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Tartıyı kaydet', exact: true }).click();
  await expect(page.getByLabel('Kilo (kg)', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.getByRole('button', { name: 'Tartıyı sil', exact: true }).click();
  await expect(page.getByRole('button', { name: /79,5 kg · Manuel/ })).toBeVisible();
  await page.getByRole('button', { name: 'Evet, tartıyı sil', exact: true }).click();
  await expect(page.getByRole('button', { name: /79,5 kg · Manuel/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /81 kg · Manuel/ })).toBeVisible();
  await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Kilo ve vücut', exact: true }).click();
  await page.getByRole('button', { name: 'Tartı ekle veya düzenle' }).click();
  await expect(page.getByRole('button', { name: /79,5 kg · Manuel/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /81 kg · Manuel/ })).toBeVisible();
});
