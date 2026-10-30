import { test, expect } from '@playwright/test';
test('resumes a paused session with notes, rest and exercise order, then keeps cancellation out of completed history', async ({
  page,
}) => {
  test.setTimeout(150000);
  await page.goto('./');
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await page.getByRole('button', { name: 'Hızlı ekle' }).click();
  await page.getByRole('button', { name: 'Antrenman', exact: true }).click();
  await page.getByLabel('Seans türü').selectOption('strength');
  await page.getByLabel('Seans notu', { exact: true }).fill('Kurgusal kesinti denemesi');
  await page.getByRole('button', { name: 'Seti bitir', exact: true }).click();
  await page.getByRole('button', { name: 'Seansı duraklat', exact: true }).click();
  const rest = await page.getByRole('timer', { name: 'Dinlenme sayacı' }).innerText();
  await page
    .getByRole('status')
    .filter({ hasText: /^Kaydedildi$/ })
    .waitFor();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Seansa devam et', exact: true })).toBeVisible();
  await expect(page.locator('.workout-mode .local-status')).toHaveText('Cihazda kayıtlı');
  await expect(page.getByRole('timer', { name: 'Dinlenme sayacı' })).toHaveText(rest);
  await expect(page.getByLabel('Seans notu', { exact: true })).toHaveValue(
    'Kurgusal kesinti denemesi',
  );
  await expect(page.getByRole('button', { name: 'Seti bitir', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Seansa devam et', exact: true }).click();
  const manager = page.locator('.session-exercise-list');
  const firstName = await manager.locator('li > span').first().innerText();
  await manager
    .getByRole('button', { name: /aşağı taşı/ })
    .first()
    .click();
  await expect(manager.locator('li > span').nth(1)).toContainText(firstName.replace(/^\d+\. /, ''));
  await page
    .getByRole('heading', { name: 'Seans hareketleri', exact: true })
    .locator('..')
    .getByRole('button', { name: 'Ekle', exact: true })
    .click();
  await page.getByLabel('Hareket ara', { exact: true }).fill('EZ bar curl');
  await page.getByRole('button', { name: 'Harekete ekle', exact: true }).click();
  await expect(manager.locator('li').last()).toContainText('EZ bar curl');
  await manager.getByRole('button', { name: 'EZ bar curl seanstan çıkar', exact: true }).click();
  await page.getByRole('button', { name: 'Evet, hareketi çıkar', exact: true }).click();
  await expect(manager).not.toContainText('EZ bar curl');
  await page
    .getByRole('status')
    .filter({ hasText: /^Kaydedildi$/ })
    .waitFor();
  await page.reload();
  await expect(manager.locator('li > span').nth(1)).toContainText(firstName.replace(/^\d+\. /, ''));
  const originalName = firstName.replace(/^\d+\. /, '');
  await manager
    .getByRole('button', { name: `${originalName} seanstan çıkar`, exact: true })
    .click();
  await page.getByRole('button', { name: 'Evet, hareketi çıkar', exact: true }).click();
  await expect(manager).not.toContainText(originalName);
  await page.getByRole('button', { name: 'Antrenmanı tamamla', exact: true }).click();
  await expect(page.getByText('tamamlanan set', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('tamamlanan set', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: "Bugün'e dön", exact: true }).click();
  await page.getByRole('button', { name: 'Hızlı ekle' }).click();
  await page.getByRole('button', { name: 'Antrenman', exact: true }).click();
  await page.getByLabel('Seans türü').selectOption('strength');
  await page.getByRole('button', { name: 'Seti bitir', exact: true }).click();
  await page.getByRole('button', { name: 'Seansı iptal et', exact: true }).click();
  await page.getByRole('button', { name: 'Evet, seansı iptal et', exact: true }).click();
  await page.getByRole('link', { name: 'Günlük', exact: true }).click();
  await expect(page.getByText('İptal edildi · Kuvvet', { exact: true })).toBeVisible();
  await expect(page.getByText('Tamamlandı · Kuvvet', { exact: true })).toBeVisible();
  await expect(page.getByText('Kurgusal kesinti denemesi', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Bugün', exact: true }).click();
  await expect(page.locator('.weekly-snapshot .stats-grid > div').first().locator('b')).toHaveText(
    '1',
  );
});
