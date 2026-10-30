import { test, expect } from '@playwright/test';
test('learns an apparatus, views two poses and adds its movement to the program', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await page.getByRole('link', { name: 'Planım', exact: true }).click();
  await page.getByRole('link', { name: 'Aletleri keşfet' }).click();
  await page
    .locator('.apparatus-grid')
    .getByRole('button', { name: 'Hack squat', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Bu alet ne işe yarar?' })).toBeVisible();
  await page.getByRole('button', { name: 'Nasıl yapılır? · Hack squat', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Hack squat · Başlangıç pozu' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Hack squat · Bitiş pozu' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nefes', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Arka', exact: true }).click();
  await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  await page.getByRole('button', { name: 'Programa ekle · Hack squat', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Kuvvet A', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Hareket programına eklendi.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Planım', exact: true }).click();
  await page.getByRole('heading', { name: 'Rotanı sen çiz.', exact: true }).waitFor();
  await expect(
    page.locator('.template-row').getByRole('heading', { name: 'Hack squat', exact: true }),
  ).toBeVisible();
});
