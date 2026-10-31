import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const original = await readFile('public/brand/berxfit-original.png');
const logo = await sharp(original).trim().png().toBuffer();
await writeFile('public/brand/berxfit-logo.png', logo);
await sharp({ create: { width: 680, height: 390, channels: 4, background: '#edf3fa' } })
  .composite([
    { input: await sharp(logo).resize({ width: 620 }).png().toBuffer(), gravity: 'centre' },
  ])
  .png()
  .toFile('docs/brand-plaque.png');
for (const width of [240, 360, 500, 560, 680])
  await sharp(logo)
    .resize({ width, withoutEnlargement: true })
    .webp({ lossless: true, effort: 6 })
    .toFile(`public/brand/berxfit-${width}.webp`);
const icon = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="108" fill="#EDF3FA"/><image href="data:image/png;base64,${logo.toString('base64')}" x="81" y="164" width="350" height="184" preserveAspectRatio="xMidYMid meet"/></svg>`,
);
await writeFile('public/icons/icon.svg', icon);
for (const size of [48, 180, 192, 512])
  await sharp(icon)
    .resize(size, size)
    .png()
    .toFile(`public/icons/${size === 180 ? 'apple-touch-icon' : `icon-${size}`}.png`);
for (const size of [192, 512])
  await sharp(icon).resize(size, size).png().toFile(`public/icons/maskable-${size}.png`);
await mkdir('resources', { recursive: true });
await sharp(icon).resize(1024, 1024).png().toFile('resources/icon.png');
for (const [width, height] of [
  [1170, 2532],
  [1290, 2796],
  [1179, 2556],
  [750, 1334],
  [2732, 2732],
]) {
  const plateW = Math.round(width * 0.7),
    plateH = Math.round(plateW * 0.58);
  const plate = await sharp({
    create: { width: plateW, height: plateH, channels: 4, background: '#EDF3FA' },
  })
    .composite([
      {
        input: await sharp(logo)
          .resize({ width: Math.round(plateW * 0.9) })
          .png()
          .toBuffer(),
        gravity: 'centre',
      },
    ])
    .png()
    .toBuffer();
  const caption = Buffer.from(
    `<svg width="${width}" height="160"><text x="50%" y="65" text-anchor="middle" fill="#F4F7FB" font-size="${Math.round(width * 0.027)}" font-family="sans-serif">Kişisel spor ve beslenme koçun</text><text x="50%" y="120" text-anchor="middle" fill="#A1B0C3" font-size="${Math.round(width * 0.019)}" font-family="sans-serif">Sana ait. Cihazında.</text></svg>`,
  );
  const out =
    width === 2732 ? 'resources/splash.png' : `public/icons/splash-${width}-${height}.png`;
  await sharp({ create: { width, height, channels: 4, background: '#070B12' } })
    .composite([
      {
        input: plate,
        left: Math.round((width - plateW) / 2),
        top: Math.round(height * 0.4 - plateH / 2),
      },
      { input: caption, left: 0, top: Math.round(height * 0.4 + plateH / 2 + 24) },
    ])
    .png()
    .toFile(out);
}
console.log(
  JSON.stringify({
    sourceSha256: createHash('sha256').update(original).digest('hex'),
    source: [1254, 1254],
    logo: [1190, 623],
    derivatives: 'Original artwork retained; transparent margins only; no generated replacement.',
  }),
);
