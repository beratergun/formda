import { readFileSync, existsSync } from 'node:fs';
const readme = readFileSync('README.md', 'utf8');
const links = [...readme.matchAll(/(?:src="|\]\()([^")]+)/g)]
  .map((m) => m[1])
  .filter((p) => !p.startsWith('http') && !p.startsWith('#'));
const missing = links.filter((p) => !existsSync(p));
console.log(JSON.stringify({ localLinks: links.length, missing }));
if (missing.length) process.exitCode = 1;
