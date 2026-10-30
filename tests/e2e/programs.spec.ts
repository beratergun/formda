import { test, expect } from '@playwright/test';
test('selects a program, persists a daily alternative and swaps an exercise without changing the week', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: /Tüm vücut başlangıç/ }).click();
  await expect(page.getByLabel('Programın haftalık gün sayısı')).toHaveValue('3');
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await page.getByRole('link', { name: 'Planım', exact: true }).click();
  await page.getByRole('button', { name: /Push \/ Pull \/ Legs/ }).click();
  await page.getByLabel('Programın haftalık gün sayısı').selectOption('6');
  await expect(page.getByRole('status').filter({ hasText: /^Kaydedildi$/ })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Programın haftalık gün sayısı')).toHaveValue('6');
  await page.getByRole('link', { name: 'Bugün', exact: true }).click();
  await page
    .locator('.date-strip')
    .getByRole('button', { name: /Pazartesi$/ })
    .click();
  await page.getByRole('button', { name: 'Alternatif', exact: true }).click();
  await expect(page.locator('.alternative-preview')).toHaveCount(3);
  await page.getByRole('button', { name: 'Evdeyim seç', exact: true }).click();
  await expect(page.locator('.workout-card')).toContainText('Evdeyim');
  await expect(page.getByRole('status').filter({ hasText: /^Kaydedildi$/ })).toBeVisible();
  await page.reload();
  await page
    .locator('.date-strip')
    .getByRole('button', { name: /Pazartesi$/ })
    .click();
  await expect(page.locator('.workout-card')).toContainText('Evdeyim');
  await page.locator('.coach-card').getByRole('link', { name: 'Antrenmanı başlat' }).click();
  await page.getByRole('button', { name: 'Hareketi değiştir', exact: true }).click();
  await page.getByLabel('Kullanabileceğin ekipman').selectOption('vücut ağırlığı');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Şınav|Duvar/ })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.workout-mode h1')).toContainText(/Şınav|Duvar/);
  await page.getByRole('link', { name: /Bugün/ }).first().click();
  await page.locator('.date-strip').getByRole('button', { name: /Salı$/ }).click();
  await expect(page.locator('.workout-card')).not.toContainText('Evdeyim');
  await page.getByRole('link', { name: 'Planım', exact: true }).click();
  await expect(page.getByLabel('Programın haftalık gün sayısı')).toHaveValue('6');
});
