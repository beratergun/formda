import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile, mkdir } from 'node:fs/promises';
const url = process.argv[2] || 'http://127.0.0.1:4173/formda/';
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    if ((await fetch(url)).ok) break;
  } catch {
    /* Preview may still be starting. */
  }
  await new Promise((r) => setTimeout(r, 250));
}
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'tr-TR',
});
const page = await context.newPage();
const findings = [];
try {
  await page.goto(url);
  await page.getByRole('button', { name: 'Yolculuğuma başla' }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Devam et', exact: true }).click();
  await page.getByRole('button', { name: 'Şimdilik atla ve başla' }).click();
  await page.getByRole('link', { name: 'Profil', exact: true }).click();
  await page.getByRole('button', { name: 'Demo verisi yükle', exact: true }).click();
  await page.getByRole('button', { name: 'Evet, demo verisini yükle', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.getByRole('link', { name: 'Bugün', exact: true }).click();
  await page.locator('main h1').waitFor();
  const scan = async (name) => {
    await page.locator('main').evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations({ subtree: true })
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})),
      );
    });
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    findings.push({
      name,
      violations: result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    });
  };
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => {
      localStorage.setItem('yol-theme', t);
      document.documentElement.dataset.theme = t;
      window.dispatchEvent(new Event('formda-theme-change'));
    }, theme);
    for (const name of ['Bugün', 'Günlük', 'İlerleme', 'Planım', 'Profil']) {
      await page.getByRole('link', { name, exact: true }).click();
      const headings = {
        Bugün: 'Bugün, kendin için.',
        Günlük: 'Biriken anların.',
        İlerleme: 'Yol aldığın her yer.',
        Planım: 'Rotanı sen çiz.',
        Profil: 'BERxFIT, sana göre.',
      };
      await page.getByRole('heading', { name: headings[name], exact: true }).waitFor();
      await page.waitForFunction(() =>
        Array.from(document.querySelectorAll('main .page-enter')).every(
          (e) => getComputedStyle(e).opacity === '1',
        ),
      );
      await scan(`${name}-${theme}`);
      if (name === 'İlerleme')
        for (const segment of ['Kilo ve vücut', 'Beslenme', 'Antrenman', 'Alışkanlık']) {
          await page.getByRole('button', { name: segment, exact: true }).click();
          await scan(`${segment}-${theme}`);
        }
    }
  }
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t;
      localStorage.setItem('yol-theme', t);
      window.dispatchEvent(new Event('formda-theme-change'));
    }, theme);
    await page.goto(url + '#/apparatus');
    await page.getByRole('heading', { name: 'Aletler', exact: true }).waitFor();
    await scan('Aletler-' + theme);
    await page
      .locator('.apparatus-grid')
      .getByRole('button', { name: 'Hack squat', exact: true })
      .click();
    await page.getByRole('button', { name: 'Nasıl yapılır? · Hack squat', exact: true }).click();
    await scan('Hareket rehberi-' + theme);
    await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  }
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => {
      document.documentElement.dataset.theme = t;
      localStorage.setItem('yol-theme', t);
      window.dispatchEvent(new Event('formda-theme-change'));
    }, theme);
    await page.getByRole('link', { name: 'Profil', exact: true }).click();
    await page.getByRole('button', { name: 'Kaynakları ve izinleri yönet' }).click();
    await scan('Bağlı kaynaklar-' + theme);
    await page.getByRole('button', { name: 'Kapat', exact: true }).click();
    await page.getByRole('link', { name: 'Bugün', exact: true }).click();
    await page.getByRole('button', { name: 'Kahvaltı ekle', exact: true }).click();
    await page.getByRole('button', { name: 'Fotoğraf', exact: true }).click();
    await scan('Fotoğraf önerisi onayı-' + theme);
    await page.getByRole('button', { name: 'Kapat', exact: true }).click();
    await page.locator('.meal-items button').first().click();
    await scan('Öğün düzenleme-' + theme);
    await page.getByRole('button', { name: 'Kapat', exact: true }).click();
    await page.getByRole('button', { name: 'Kahvaltı ekle', exact: true }).click();
    await page.getByRole('button', { name: 'Özel besin', exact: true }).click();
    await scan('Özel besin-' + theme);
    await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  }
  const output = `docs/qa/${new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }).format(new Date())}`;
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/axe.json`, JSON.stringify(findings, null, 2));
  console.log(
    JSON.stringify(
      findings
        .filter((f) => f.violations.length)
        .map((f) => ({
          ...f,
          violations: f.violations.map((v) => ({
            ...v,
            nodes: v.nodes.slice(0, 3),
            count: v.nodes.length,
          })),
        })),
      null,
      2,
    ),
  );
  console.log(`${findings.length} screens checked`);
  if (findings.some((f) => f.violations.length)) process.exitCode = 1;
} finally {
  await browser.close();
}
