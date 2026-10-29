import sharp from 'sharp';
for (const size of [192, 512, 180]) {
  await sharp('public/icons/icon.svg').resize(size, size).png().toFile(`public/icons/${size === 180 ? 'apple-touch-icon' : `icon-${size}`}.png`);
}
await sharp('public/icons/icon.svg').resize(320, 320).extend({ top: 96, bottom: 96, left: 96, right: 96, background: '#126c6a' }).png().toFile('public/icons/maskable-512.png');
