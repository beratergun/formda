import sharp from 'sharp';
import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
const icon = await readFile('public/icons/icon.svg');
const root = 'android/app/src/main/res';
for (const [name, scale] of Object.entries({
  mdpi: 1,
  hdpi: 1.5,
  xhdpi: 2,
  xxhdpi: 3,
  xxxhdpi: 4,
})) {
  const dir = `${root}/mipmap-${name}`;
  await mkdir(dir, { recursive: true });
  for (const variant of ['ic_launcher', 'ic_launcher_round'])
    await sharp(icon)
      .resize(Math.round(48 * scale), Math.round(48 * scale))
      .png()
      .toFile(`${dir}/${variant}.png`);
  await sharp(icon)
    .resize(Math.round(108 * scale), Math.round(108 * scale))
    .png()
    .toFile(`${dir}/ic_launcher_foreground.png`);
}
await mkdir(`${root}/mipmap-anydpi-v26`, { recursive: true });
for (const name of ['ic_launcher', 'ic_launcher_round'])
  await writeFile(
    `${root}/mipmap-anydpi-v26/${name}.xml`,
    '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/formda_teal"/><foreground android:drawable="@mipmap/ic_launcher_foreground"/></adaptive-icon>\n',
  );
await writeFile(
  `${root}/values/colors.xml`,
  '<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="colorPrimary">#126c6a</color><color name="colorPrimaryDark">#126c6a</color><color name="colorAccent">#126c6a</color><color name="formda_teal">#126c6a</color></resources>\n',
);
await sharp('resources/splash.png').resize(1080, 1080).png().toFile(`${root}/drawable/splash.png`);
await sharp(icon).resize(288, 288).png().toFile(`${root}/drawable/formda_splash_icon.png`);
for (const dir of await readdir(root)) {
  if (!dir.startsWith('drawable-')) continue;
  const path = `${root}/${dir}/splash.png`;
  try {
    await access(path);
    await sharp('resources/splash.png').resize(1080, 1080).png().toFile(path);
  } catch {
    /* Only existing splash resources need replacing. */
  }
}
