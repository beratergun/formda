import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const out = '../formda-launch/linkedin-media';
await mkdir(out, { recursive: true });
const svg = (w, h, body) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g font-family="Segoe UI,Arial,sans-serif">${body}</g></svg>`,
  );
const text = (x, y, value, size = 24, color = '#e9f2df', weight = 400) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${value}</text>`;
const frame = async (name, height) =>
  sharp(`docs/screenshots/frames/${name}.png`).resize({ height }).png().toBuffer();
const cover = svg(
  1200,
  1200,
  `<defs><radialGradient id="g"><stop stop-color="#235e59"/><stop offset="1" stop-color="#0d3032"/></radialGradient></defs><rect width="1200" height="1200" fill="url(#g)"/><circle cx="1050" cy="660" r="510" fill="#8ac4a3" opacity=".06"/><path d="M-40 970Q280 700 580 1060" fill="none" stroke="#94c8b1" stroke-width="2" stroke-dasharray="6 12" opacity=".3"/>${text(72, 165, 'Formda', 110, '#e9f2df', 750)}${text(78, 295, 'Kişisel spor ve', 48, '#e9f2df', 650)}${text(78, 360, 'beslenme koçun.', 48, '#e9f2df', 650)}${text(78, 450, 'Yerel spor ve', 30, '#bbd5c9')}${text(78, 495, 'beslenme asistanı.', 30, '#bbd5c9')}<rect x="78" y="555" width="265" height="56" rx="16" fill="#d8e9a5"/>${text(101, 593, 'PWA + Android', 25, '#183c37', 650)}${text(78, 688, 'Hesap yok.', 29, '#e9f2df', 600)}${text(78, 733, 'Sunucu yok.', 29, '#e9f2df', 600)}${text(78, 778, 'Verilerin cihazında.', 29, '#e9f2df', 600)}${text(78, 914, '140 test · 18 mobil E2E', 24, '#bbd5c9')}${text(78, 955, '%100 domain satır kapsamı', 24, '#bbd5c9')}${text(78, 1085, 'beratergun.github.io/formda', 25, '#e9f2df', 600)}${text(78, 1135, 'Kurgusal demo · Seyid Berat Ergün', 18, '#94b9ae')}`,
);
await sharp(cover)
  .composite([{ input: await frame('today-light', 885), left: 748, top: 215 }])
  .png()
  .toFile(`${out}/cover-square.png`);
const layouts = [
  {
    file: '01-daily.png',
    title: 'Günün ritmi.',
    sub: 'Beslenme, su ve enerji. Tek bir uygulamada.',
    phones: ['food-light', 'today-light'],
    dark: false,
  },
  {
    file: '02-training.png',
    title: 'Set set, yanında.',
    sub: '159 hareket · Önceki seans · Dinlenme sayacı',
    phones: ['workout-light', 'progress-dark'],
    dark: true,
  },
  {
    file: '03-memories.png',
    title: 'Sana ait. Cihazında.',
    sub: 'Fotoğraf, vlog ve günlük. Hesap yok. Sunucu yok.',
    phones: ['photos-light', 'journal-dark'],
    dark: false,
  },
  {
    file: '04-programs.png',
    title: 'Planın gününe uysun.',
    sub: '5 hazır program + kişisel plan · Günlük alternatifler',
    phones: ['programs-light', 'plan-dark'],
    dark: true,
  },
  {
    file: '05-apparatus.png',
    title: 'Aleti tanı, doğru başla.',
    sub: '159 hareket · 34 alet · Vektör pozlar ve kas haritası',
    phones: ['apparatus-light', 'workout-dark'],
    dark: false,
  },
  {
    file: '06-sources.png',
    title: 'Kaynağı belli, cihazında.',
    sub: '797 besin · 160 tarif · Sağlık verisinde yalnızca okuma',
    phones: ['sources-light', 'food-dark'],
    dark: true,
  },
  {
    file: '07-start.png',
    title: 'Kendi ritminle başla.',
    sub: 'Ücretsiz · Hesapsız · Açık kaynak · PWA + Android',
    phones: ['today-dark', 'progress-light'],
    dark: false,
  },
];
for (const layout of layouts) {
  const bg = layout.dark ? '#10292b' : '#e9f1ed',
    ink = layout.dark ? '#e9f2df' : '#173d3a',
    sub = layout.dark ? '#a8c9bd' : '#57756c';
  const base = svg(
    1080,
    1350,
    `<rect width="1080" height="1350" fill="${bg}"/>${text(56, 92, 'Formda', 38, ink, 750)}${text(56, 167, layout.title, 52, ink, 650)}${text(56, 217, layout.sub, 24, sub)}${text(56, 1250, 'Telefona kurulabilen yerel uygulama · PWA + Android', 24, ink, 600)}${text(56, 1301, 'Tamamen kurgusal demo · beratergun.github.io/formda', 19, sub)}`,
  );
  await sharp(base)
    .composite([
      { input: await frame(layout.phones[0], 930), left: 56, top: 266 },
      { input: await frame(layout.phones[1], 930), left: 600, top: 266 },
    ])
    .png()
    .toFile(`${out}/${layout.file}`);
}
console.log('1200×1200 cover and seven 1080×1350 carousel slides created outside the repository.');
