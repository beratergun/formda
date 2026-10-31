import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const svg = (width, height, body) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g font-family="Segoe UI,Arial,sans-serif">${body}</g></svg>`,
  );
const text = (x, y, value, size = 18, color = '#13243c', weight = 400) =>
  `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}">${value}</text>`;
export async function phone(name) {
  const dark = name.endsWith('dark'),
    bg = dark ? '#070b12' : '#f3f6fc',
    ink = dark ? '#f4f7fb' : '#13243c';
  const screen = await sharp(`docs/screenshots/raw/${name}.png`)
    .composite([
      {
        input: svg(390, 844, '<rect width="390" height="844" rx="14" fill="white"/>'),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();
  const base = svg(
    414,
    908,
    `<rect x="3" y="3" width="408" height="902" rx="40" fill="${bg}" stroke="#304158" stroke-width="6"/>${text(28, 26, '9:41', 12, ink, 600)}<rect x="175" y="12" width="64" height="17" rx="9" fill="#070b12"/><g fill="none" stroke="${ink}" stroke-width="1.5"><path d="M338 22h3v-3h3v-3h3v-3"/><path d="M356 17q6-5 12 0m-10 3q4-3 8 0m-5 3h2"/><rect x="375" y="14" width="16" height="9" rx="2"/></g><rect x="377" y="16" width="11" height="5" fill="${ink}"/><rect x="162" y="893" width="90" height="4" rx="2" fill="${ink}"/>`,
  );
  return sharp(base)
    .composite([{ input: screen, left: 12, top: 38 }])
    .png()
    .toBuffer();
}
await mkdir('docs/screenshots/frames', { recursive: true });
await mkdir('docs/buttons', { recursive: true });
const names = [
  'today-light',
  'today-dark',
  'journal-light',
  'journal-dark',
  'progress-light',
  'progress-dark',
  'plan-light',
  'plan-dark',
  'projection-light',
  'projection-dark',
  'food-light',
  'food-dark',
  'workout-light',
  'workout-dark',
  'photos-light',
  'photos-dark',
  'apparatus-light',
  'apparatus-dark',
  'sources-light',
  'sources-dark',
  'programs-light',
  'programs-dark',
  'water-light',
  'water-dark',
  'weight-light',
  'weight-dark',
  'technique-light',
  'technique-dark',
];
const phones = {};
for (const name of names) {
  phones[name] = await phone(name);
  await writeFile(`docs/screenshots/frames/${name}.png`, phones[name]);
}
for (const theme of ['light', 'dark']) {
  const dark = theme === 'dark',
    bg = dark ? '#070b12' : '#edf3fa',
    ink = dark ? '#f4f7fb' : '#13243c',
    sub = dark ? '#a5b6cc' : '#506680';
  const chosen =
    theme === 'light'
      ? ['today-light', 'workout-light', 'photos-light']
      : ['today-dark', 'projection-dark', 'journal-dark'];
  const labels =
    theme === 'light'
      ? ['Günün ritmi', 'Set set, yanında', 'Kendi gözünden']
      : ['Aynı özen, koyu tema', 'Önündeki yol · tahmin', 'Biriken anların'];
  const base = svg(
    1280,
    1024,
    `<rect width="1280" height="1024" fill="${bg}"/>${text(64, 72, 'BERxFIT', 46, ink, 750)}${text(64, 112, theme === 'light' ? 'Kişisel spor ve beslenme koçun.' : 'Günün her saatinde, kendi ritminde.', 24, sub)}${text(64, 992, 'Kurgusal demo · Fotoğraflar çizilmiş silüetlerden oluşur.', 15, sub)}`,
  );
  const layers = [];
  for (let i = 0; i < 3; i++) {
    layers.push({
      input: await sharp(phones[chosen[i]]).resize({ height: 760 }).toBuffer(),
      left: 63 + i * 405,
      top: 164,
    });
    layers.push({
      input: svg(370, 35, text(0, 25, labels[i], 19, ink, 600)),
      left: 63 + i * 405,
      top: 927,
    });
  }
  await sharp(base).composite(layers).png().toFile(`docs/screenshots/${theme}-collage.png`);
}
const social = svg(
  1280,
  640,
  `<defs><radialGradient id="g"><stop stop-color="#183452"/><stop offset="1" stop-color="#070b12"/></radialGradient></defs><rect width="1280" height="640" fill="url(#g)"/><circle cx="1010" cy="190" r="350" fill="#7db3ff" opacity=".06"/><path d="M-50 580Q220 400 500 610" fill="none" stroke="#7db3ff" stroke-width="2" stroke-dasharray="5 10" opacity=".3"/>${text(64, 126, 'BERxFIT', 78, '#f4f7fb', 750)}${text(68, 238, 'Kişisel spor ve', 40, '#f4f7fb', 650)}${text(68, 290, 'beslenme koçun.', 40, '#f4f7fb', 650)}${text(68, 352, 'Kişisel hedeflerin, cihazında.', 21, '#a5b6cc')}${text(68, 420, 'PWA + Android', 18, '#62d9ef', 600)}${text(68, 460, 'Çevrimdışı · Hesap yok · Sunucu yok', 18, '#a5b6cc')}${text(68, 570, 'beratergun.github.io/formda', 20, '#f4f7fb', 600)}`,
);
await sharp(social)
  .composite([
    {
      input: await sharp(phones['today-light']).resize({ height: 548 }).toBuffer(),
      left: 686,
      top: 50,
    },
    {
      input: await sharp(phones['projection-dark']).resize({ height: 548 }).toBuffer(),
      left: 976,
      top: 50,
    },
  ])
  .png()
  .toFile('docs/social-preview.png');
for (const [file, label, subtitle, dark] of [
  ['pwa', 'Telefona yükle (PWA)', 'Android · iPhone', false],
  ['apk', 'Android APK indir', 'v3.0.0 · cihazına kur', true],
]) {
  const bg = dark ? '#132b4e' : '#245aca',
    mark = dark ? 'M21 18v16m-6-6 6 6 6-6m-14 8v5h16v-5' : 'M16 15h12v24H16zM20 35h4';
  await writeFile(
    `docs/buttons/${file}.svg`,
    svg(
      310,
      68,
      `<rect width="310" height="68" rx="15" fill="${bg}"/><path d="${mark}" fill="none" stroke="#f4f7fb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${text(48, 30, label, 18, '#fff', 650)}${text(48, 50, subtitle, 12, '#c7dcff')}`,
    ),
  );
}
const sequence = [
  ['today-light', 'Günün ritmi'],
  ['food-light', 'Yazarak öğün ekle'],
  ['workout-light', 'Set set, yanında'],
  ['photos-dark', 'Kendi gözünden'],
  ['journal-dark', 'Biriken anların'],
  ['projection-dark', 'Önündeki yol · tahmin'],
];
const frames = [];
for (const [name, label] of sequence) {
  const bg = svg(
    550,
    1060,
    `<rect width="550" height="1060" fill="#edf3fa"/>${text(68, 43, 'BERxFIT', 28, '#13243c', 750)}${text(68, 76, label, 18, '#506680')}${text(68, 1037, 'Kurgusal demo · Sana ait. Cihazında kalır.', 14, '#506680')}`,
  );
  frames.push(
    await sharp(bg)
      .composite([{ input: phones[name], left: 68, top: 101 }])
      .png()
      .toBuffer(),
  );
}
await sharp(frames, { join: { animated: true } })
  .gif({ delay: frames.map(() => 4000), loop: 0, colours: 128, dither: 0.1, effort: 7 })
  .toFile('docs/demo.gif');
console.log('Phone frames, collages, buttons, social preview and six-frame demo GIF generated.');
