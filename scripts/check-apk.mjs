import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
const file = process.argv[2] || '../yol-launch/android/Yol-v1.0.0.apk';
const files = unzipSync(new Uint8Array(readFileSync(file)), {
  filter: (f) => ['AndroidManifest.xml', 'assets/capacitor.config.json'].includes(f.name),
});
const config = JSON.parse(strFromU8(files['assets/capacitor.config.json']));
const manifest = Buffer.from(files['AndroidManifest.xml']);
const text = manifest.toString('utf8') + manifest.toString('utf16le');
const result = {
  appId: config.appId,
  appName: config.appName,
  remoteServer: config.server?.url || null,
  manifestId: text.includes('io.github.beratergun.yol'),
  manifestVersion: text.includes('1.0.0'),
};
console.log(JSON.stringify(result, null, 2));
if (
  result.appId !== 'io.github.beratergun.yol' ||
  result.remoteServer ||
  !result.manifestId ||
  !result.manifestVersion
)
  process.exitCode = 1;
