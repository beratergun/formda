import { test, expect, type Page } from '@playwright/test';
import { EXERCISES } from '../../src/data/seed/exercises';
async function onboard(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
}
test('shows the ten individual core schematics, pose controls, static plank and reduced motion', async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.clock.install({ time: new Date('2026-10-30T09:00:00+03:00') });
  await onboard(page);
  await page.goto('./#/library');
  await page.getByRole('heading', { name: 'Hareket kütüphanesi', exact: true }).waitFor();
  await page.clock.pauseAt(new Date('2026-10-30T09:05:00+03:00'));
  for (const id of [
    'bodyweight-squat',
    'push-up',
    'bench-press',
    'lat-pulldown',
    'biceps-curl',
    'shoulder-press',
    'cable-row',
    'plank',
    'walking-lunge',
    'rdl',
  ]) {
    const name = EXERCISES.find((e) => e.id === id)!.name;
    await page.getByLabel('Hareket ara', { exact: true }).fill(name);
    await page.getByText(name, { exact: true }).click();
    if (id === 'plank') {
      await expect(
        page.getByRole('img', { name: 'Plank · Statik tutuş', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Poz geçişini oynat', exact: true }),
      ).toHaveCount(0);
    } else {
      await expect(
        page.getByRole('img', { name: `${name} · Başlangıç pozu`, exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'İki pozu karşılaştır', exact: true }).click();
      await expect(
        page.getByRole('img', { name: `${name} · Bitiş pozu`, exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'İki pozu karşılaştır', exact: true }).click();
      await page.getByLabel('Poz geçiş hızı', { exact: true }).selectOption('1.5');
      await page.getByRole('button', { name: 'Poz geçişini oynat', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'Poz geçişini duraklat', exact: true }),
      ).toBeVisible();
      await page.clock.fastForward(1201);
      await expect(page.getByRole('button', { name: '2 · Bitiş', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await page.getByRole('button', { name: 'Poz geçişini duraklat', exact: true }).click();
      await page.getByRole('button', { name: 'Pozları başa al', exact: true }).click();
      await expect(
        page.getByRole('button', { name: '1 · Başlangıç', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
    }
    await page.getByRole('button', { name: 'Teknik rehberi büyüt', exact: true }).click();
    await expect(page.locator('.technique-expanded .technical-pose')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'Başlangıç ayarı', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByLabel('Hareket ara', { exact: true }).fill('Goblet squat');
  await page.getByText('Goblet squat', { exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Poz geçişini oynat', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: '2 · Bitiş', exact: true }).click();
  await expect(
    page.getByRole('img', { name: 'Goblet squat · Bitiş pozu', exact: true }),
  ).toBeVisible();
});

test('records a plank hold as seconds without fabricated weight or repetitions', async ({
  page,
}) => {
  test.setTimeout(150000);
  await onboard(page);
  await page.getByRole('button', { name: 'Hızlı ekle' }).click();
  await page.getByRole('button', { name: 'Antrenman', exact: true }).click();
  await page.getByLabel('Seans türü').selectOption('strength');
  await page
    .getByRole('heading', { name: 'Seans hareketleri', exact: true })
    .locator('..')
    .getByRole('button', { name: 'Ekle', exact: true })
    .click();
  await page.getByLabel('Hareket ara', { exact: true }).fill('Plank');
  await page
    .getByRole('dialog')
    .locator('.card')
    .filter({ has: page.locator('.library-item strong').filter({ hasText: /^Plank$/ }) })
    .getByRole('button', { name: 'Harekete ekle', exact: true })
    .click();
  const up = page
    .locator('.session-exercise-list')
    .getByRole('button', { name: 'Plank yukarı taşı', exact: true });
  while (await up.isEnabled()) await up.click();
  const previous = page.getByRole('button', { name: 'Önceki', exact: true });
  while (await previous.isEnabled()) await previous.click();
  await expect(page.getByRole('heading', { name: 'Plank', exact: true })).toBeVisible();
  await page.getByLabel('Tutuş süresi (sn)', { exact: true }).fill('45');
  await expect(page.getByLabel('Tekrar', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Ağırlık (kg)', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Seti bitir', exact: true }).click();
  await expect(page.getByText('45 sn · RPE 7', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Antrenmanı tamamla', exact: true }).click();
  await expect(page.getByText('tamamlanan set', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: "Bugün'e dön", exact: true }).click();
  await page.getByRole('link', { name: 'Günlük', exact: true }).click();
  await expect(page.getByText('Plank · 1. set · 45 sn · RPE 7', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'İlerleme', exact: true }).click();
  await page.getByRole('button', { name: 'Antrenman', exact: true }).click();
  await page.getByLabel('İlerleme hareketi', { exact: true }).selectOption('plank');
  await expect(
    page.getByRole('figure', { name: 'Hareket tutuş süresi grafiği', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Ağırlık ve tahmini 1RM', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText('45 sn', { exact: true })).toBeVisible();
});
