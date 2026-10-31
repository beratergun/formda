import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const base = process.argv[2] || 'http://127.0.0.1:5173/formda/';
await mkdir('docs/screenshots/raw', { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'tr-TR',
  timezoneId: 'Europe/Istanbul',
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const shot = async (name) => {
  await page.mouse.move(1, 1);
  await page.screenshot({ path: `docs/screenshots/raw/${name}.png` });
};
const home = async () => {
  await page.getByRole('link', { name: 'Bugün', exact: true }).click();
  await page.getByRole('heading', { name: 'Bugün, kendin için.', exact: true }).waitFor();
};
try {
  await page.goto(base);
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await page.getByRole('link', { name: 'Profil', exact: true }).click();
  await page.getByRole('button', { name: 'Demo verisi yükle', exact: true }).click();
  await page.getByRole('button', { name: 'Evet, demo verisini yükle', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await expect(page.getByLabel('Adın', { exact: true })).toHaveValue('Deniz');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => {
      localStorage.setItem('yol-theme', t);
      document.documentElement.dataset.theme = t;
      window.dispatchEvent(new Event('formda-theme-change'));
    }, theme);
    for (const [name, heading, key] of [
      ['Bugün', 'Bugün, kendin için.', 'today'],
      ['Günlük', 'Biriken anların.', 'journal'],
      ['İlerleme', 'Yol aldığın her yer.', 'progress'],
      ['Planım', 'Rotanı sen çiz.', 'plan'],
    ]) {
      await page.getByRole('link', { name, exact: true }).click();
      await page.getByRole('heading', { name: heading, exact: true }).waitFor();
      if (name === 'Bugün')
        await expect(page.getByRole('status').filter({ hasText: 'Kaydedildi' })).toBeVisible();
      await page.evaluate(() => scrollTo(0, 0));
      await shot(`${key}-${theme}`);
    }
    await page.getByRole('link', { name: 'İlerleme', exact: true }).click();
    await page.getByRole('button', { name: 'Kilo ve vücut', exact: true }).click();
    await page
      .getByRole('heading', { name: 'Önündeki yol · tahmin', exact: true })
      .evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot(`projection-${theme}`);
    await home();
    await page.getByRole('button', { name: 'Kahvaltı ekle', exact: true }).click();
    await page.getByRole('button', { name: 'Yazarak', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Ne yedin?' })
      .fill('2 yumurta, 1 dilim ekmek, 150 gr pişmiş tavuk');
    await page.getByRole('button', { name: 'Kalemlere ayır' }).click();
    await shot(`food-${theme}`);
    await page.getByRole('button', { name: 'Kapat', exact: true }).click();
    await page.getByRole('button', { name: 'Hızlı ekle' }).click();
    await page.getByRole('button', { name: 'Antrenman', exact: true }).click();
    const resume = page.getByRole('button', { name: 'Seansa devam et', exact: true });
    if (await resume.count()) await resume.click();
    await page.getByLabel('Seans türü').selectOption('strength');
    await page
      .getByRole('heading', { name: '1. set', exact: true })
      .evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await shot(`workout-${theme}`);
    await page.getByRole('link', { name: "Bugün'e dön", exact: true }).click();
    await page.getByRole('button', { name: 'Hızlı ekle' }).click();
    await page.getByRole('button', { name: 'Fotoğraf', exact: true }).click();
    await page.getByRole('button', { name: 'Zaman tüneli', exact: true }).click();
    await page.locator('.compare-slider img').first().waitFor();
    await page
      .locator('.compare-slider img')
      .evaluateAll(async (imgs) => Promise.all(imgs.map((img) => img.decode())));
    await page
      .getByRole('heading', { name: 'İki an, aynı yol', exact: true })
      .evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot(`photos-${theme}`);
    await page.goto(base + '#/apparatus');
    await page.getByRole('heading', { name: 'Aletler', exact: true }).waitFor();
    await shot(`apparatus-${theme}`);
    await page.getByRole('link', { name: 'Profil', exact: true }).click();
    await page.getByRole('button', { name: 'Kaynakları ve izinleri yönet' }).click();
    await shot(`sources-${theme}`);
    await page.getByRole('button', { name: 'Kapat', exact: true }).click();
    await page.getByRole('link', { name: 'Planım', exact: true }).click();
    await page
      .getByText('Hazır programın', { exact: true })
      .evaluate((el) => el.scrollIntoView({ block: 'start' }));
    await shot(`programs-${theme}`);
    await home();
    await page.locator('.water-tracker').scrollIntoViewIfNeeded();
    await shot(`water-${theme}`);
    await page.getByRole('link', { name: 'İlerleme', exact: true }).click();
    await page.getByRole('button', { name: 'Kilo ve vücut', exact: true }).click();
    await page.getByRole('button', { name: 'Tartı ekle veya düzenle' }).click();
    await shot(`weight-${theme}`);
    await page.getByRole('button', { name: 'Kapat', exact: true }).click();
    await page.goto(base + '#/library');
    await page.getByLabel('Hareket ara', { exact: true }).fill('Goblet squat');
    await page.getByText('Goblet squat', { exact: true }).click();
    await shot(`technique-${theme}`);
    await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  }
  console.log('28 screenshots captured from an isolated fictional demo.');
} finally {
  await context.close();
  await browser.close();
}
