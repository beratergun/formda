import { test, expect } from '@playwright/test';

test('edits zero, accepts Turkish decimals and preserves validated values after reload', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await page.getByRole('link', { name: 'Profil', exact: true }).click();
  const active = page.getByLabel('Elle aktif kalori (kcal)');
  await active.fill('0');
  await active.blur();
  await active.focus();
  await page.keyboard.type('1500');
  await expect(active).toHaveValue('1500');
  await page
    .getByRole('status')
    .filter({ hasText: /^Kaydedildi$/ })
    .waitFor();
  await page.reload();
  await expect(page.getByLabel('Elle aktif kalori (kcal)')).toHaveValue('1500');
  await page.getByRole('link', { name: 'Planım', exact: true }).click();
  await page.getByRole('button', { name: 'Hedefler', exact: true }).click();
  const calories = page.getByLabel('Kalori (kcal)', { exact: true });
  await calories.fill('');
  await expect(calories).toHaveValue('');
  await page.getByRole('button', { name: 'Hedefleri kaydet', exact: true }).click();
  await expect(calories).toHaveAttribute('aria-invalid', 'true');
  await calories.fill('1500');
  await page.getByLabel('Kilo basamakları (noktalı virgülle ayır)').fill('90; 85,5; 80');
  await page.getByRole('button', { name: 'Hedefleri kaydet', exact: true }).click();
  await page
    .getByRole('status')
    .filter({ hasText: /^Kaydedildi$/ })
    .waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Hedefler', exact: true }).click();
  await expect(page.getByLabel('Kalori (kcal)', { exact: true })).toHaveValue('1500');
  await expect(page.getByLabel('Kilo basamakları (noktalı virgülle ayır)')).toHaveValue(
    '90; 85.5; 80',
  );
  await page.getByLabel('Kalori (kcal)', { exact: true }).fill('1e3');
  await page.getByRole('button', { name: 'Hedefleri kaydet', exact: true }).click();
  await expect(page.getByLabel('Kalori (kcal)', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.reload();
  await page.getByRole('button', { name: 'Hedefler', exact: true }).click();
  await expect(page.getByLabel('Kalori (kcal)', { exact: true })).toHaveValue('1500');
  await page.getByRole('link', { name: 'Bugün', exact: true }).click();
  await page.getByRole('button', { name: 'Hızlı ekle' }).click();
  await page.getByRole('button', { name: 'Antrenman', exact: true }).click();
  await page.getByLabel('Seans türü').selectOption('strength');
  const weight = page.getByLabel('Ağırlık (kg)', { exact: true });
  await weight.fill('0');
  await weight.fill('');
  await expect(weight).toHaveValue('');
  await weight.fill('12,5');
  await weight.blur();
  await expect(weight).toHaveValue('12.5');
  await page.getByRole('button', { name: 'Seti bitir', exact: true }).click();
  await expect(page.getByText(/12,5|12.5/).first()).toBeVisible();
});
