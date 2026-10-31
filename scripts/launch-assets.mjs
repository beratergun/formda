import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const out = '../berxfit-launch/linkedin-media';
await mkdir(out, { recursive: true });
const svg = (w, h, body) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g font-family="Segoe UI,Arial,sans-serif">${body}</g></svg>`,
  );
const text = (x, y, value, size = 24, color = '#f4f7fb', weight = 400) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${value}</text>`;
const frame = async (name, height) =>
  sharp(`docs/screenshots/frames/${name}.png`).resize({ height }).png().toBuffer();
const cover = svg(
  1200,
  1200,
  `<defs><radialGradient id="g"><stop stop-color="#183452"/><stop offset="1" stop-color="#070b12"/></radialGradient></defs><rect width="1200" height="1200" fill="url(#g)"/><circle cx="1050" cy="660" r="510" fill="#7db3ff" opacity=".06"/><path d="M-40 970Q280 700 580 1060" fill="none" stroke="#7db3ff" stroke-width="2" stroke-dasharray="6 12" opacity=".3"/>${text(72, 165, 'BERxFIT', 110, '#f4f7fb', 750)}${text(78, 295, 'Kişisel spor ve', 48, '#f4f7fb', 650)}${text(78, 360, 'beslenme koçun.', 48, '#f4f7fb', 650)}${text(78, 450, 'Yerel spor ve', 30, '#a5b6cc')}${text(78, 495, 'beslenme asistanı.', 30, '#a5b6cc')}<rect x="78" y="555" width="265" height="56" rx="16" fill="#62d9ef"/>${text(101, 593, 'PWA + Android', 25, '#13243c', 650)}${text(78, 688, 'Hesap yok.', 29, '#f4f7fb', 600)}${text(78, 733, 'Sunucu yok.', 29, '#f4f7fb', 600)}${text(78, 778, 'Verilerin cihazında.', 29, '#f4f7fb', 600)}${text(78, 914, '217 birim testi · Yerel kayıt', 24, '#a5b6cc')}${text(78, 955, 'Açık kaynak · Strict TypeScript', 24, '#a5b6cc')}${text(78, 1085, 'beratergun.github.io/formda', 25, '#f4f7fb', 600)}${text(78, 1135, 'Kurgusal demo · Seyid Berat Ergün', 18, '#a5b6cc')}`,
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
    phones: ['workout-light', 'technique-dark'],
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
    title: 'Kayıtların, gerçek ilerlemen.',
    sub: 'Tarihli tartı · Ml su geçmişi · Veri koruyan düzenleme',
    phones: ['water-dark', 'weight-light'],
    dark: false,
  },
];
for (const layout of layouts) {
  const bg = layout.dark ? '#0d1727' : '#edf3fa',
    ink = layout.dark ? '#f4f7fb' : '#13243c',
    sub = layout.dark ? '#a5b6cc' : '#506680';
  const base = svg(
    1080,
    1350,
    `<rect width="1080" height="1350" fill="${bg}"/>${text(56, 92, 'BERxFIT', 38, ink, 750)}${text(56, 167, layout.title, 52, ink, 650)}${text(56, 217, layout.sub, 24, sub)}${text(56, 1250, 'Telefona kurulabilen yerel uygulama · PWA + Android', 24, ink, 600)}${text(56, 1301, 'Tamamen kurgusal demo · beratergun.github.io/formda', 19, sub)}`,
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
