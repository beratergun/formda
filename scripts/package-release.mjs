import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { zipSync } from 'fflate';
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const files = {};
async function collect(directory, prefix = '') {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) await collect(`${directory}/${entry.name}`, `${relative}/`);
    else files[relative] = new Uint8Array(await readFile(`${directory}/${entry.name}`));
  }
}
await collect('dist');
if (!files['index.html'] || !files['manifest.webmanifest'] || !files['sw.js'])
  throw new Error('Incomplete PWA build');
const out = '../berxfit-launch/releases';
await mkdir(out, { recursive: true });
const name = `berXfit-v${version}-pwa.zip`,
  bytes = zipSync(files, { level: 6 });
await writeFile(`${out}/${name}`, bytes);
const sha = createHash('sha256').update(bytes).digest('hex');
await writeFile(`${out}/${name}.sha256`, `${sha}  ${name}\n`);
console.log(
  JSON.stringify({ name, files: Object.keys(files).length, bytes: bytes.length, sha256: sha }),
);
