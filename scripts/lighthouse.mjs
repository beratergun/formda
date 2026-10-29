import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const url = process.argv[2] || 'http://127.0.0.1:4173/formda/';
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    if ((await fetch(url)).ok) break;
  } catch {
    /* Preview may still be starting. */
  }
  await new Promise((r) => setTimeout(r, 250));
}
const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }).format(new Date());
const output = `docs/qa/${day}/lighthouse`;
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  args: ['--remote-debugging-port=9222', '--no-sandbox', '--disable-dev-shm-usage'],
});
try {
  const result = await lighthouse(url, {
    port: 9222,
    output: ['json', 'html'],
    onlyCategories: ['performance', 'accessibility', 'best-practices'],
    logLevel: 'error',
  });
  await writeFile(`${output}/report.json`, result.report[0]);
  await writeFile(`${output}/report.html`, result.report[1]);
  const scores = Object.fromEntries(
    Object.entries(result.lhr.categories).map(([key, value]) => [
      key,
      Math.round(value.score * 100),
    ]),
  );
  const failures = Object.values(result.lhr.audits)
    .filter((a) => a.score !== null && a.score < 1 && a.details?.items?.length)
    .map((a) => ({
      id: a.id,
      title: a.title,
      score: a.score,
      display: a.displayValue,
      items: a.details.items.slice(0, 4),
    }));
  console.log(JSON.stringify({ url, scores, failures }, null, 2));
  if (scores.performance < 90 || scores.accessibility < 95 || scores['best-practices'] < 95)
    process.exitCode = 1;
} finally {
  await browser.close();
}
