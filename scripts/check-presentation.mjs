import { readFile, readdir } from 'node:fs/promises';
import sharp from 'sharp';
const root = '../berxfit-launch';
const words = {};
for (const lang of ['tr', 'en']) {
  const content = await readFile(`${root}/linkedin-post-${lang}.md`, 'utf8');
  words[lang] = content.trim().split(/\s+/).length;
  if (words[lang] < 150 || words[lang] > 220)
    throw new Error(`Post length: ${lang} ${words[lang]}`);
}
const slides = (await readdir(`${root}/linkedin-media`)).filter((n) => /^\d\d-.*\.png$/.test(n));
if (slides.length < 6 || slides.length > 8) throw new Error('Carousel count');
for (const slide of slides) {
  const m = await sharp(`${root}/linkedin-media/${slide}`).metadata();
  if (m.width !== 1080 || m.height !== 1350) throw new Error(slide);
}
const cover = await sharp(`${root}/linkedin-media/cover-square.png`).metadata();
if (cover.width !== 1200 || cover.height !== 1200) throw new Error('Cover dimensions');
const preview = await sharp('docs/social-preview.png').metadata();
if (preview.width !== 1280 || preview.height !== 640) throw new Error('Social preview dimensions');
const demo = await sharp('docs/demo.gif', { animated: true }).metadata();
const seconds = demo.delay.reduce((s, d) => s + d, 0) / 1000;
if (seconds < 20 || seconds > 30) throw new Error('Demo duration');
console.log(
  JSON.stringify({
    words,
    slides: slides.length,
    demoSeconds: seconds,
    preview: [preview.width, preview.height],
    cover: [cover.width, cover.height],
  }),
);
