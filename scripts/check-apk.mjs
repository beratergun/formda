import { readFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const file = process.argv[2] || `../formda-launch/android/Formda-v${version}.apk`;
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
  manifestId: text.includes('io.github.beratergun.formda'),
  manifestVersion: text.includes(version),
  healthWritePermissions: /android\.permission\.health\.WRITE_/.test(text),
  healthReadPermissions: ['STEPS', 'ACTIVE_CALORIES_BURNED', 'WEIGHT', 'SLEEP', 'EXERCISE'].every(
    (p) => text.includes(`android.permission.health.READ_${p}`),
  ),
};
console.log(JSON.stringify(result, null, 2));
if (
  result.appId !== 'io.github.beratergun.formda' ||
  result.remoteServer ||
  !result.manifestId ||
  !result.manifestVersion ||
  result.healthWritePermissions ||
  !result.healthReadPermissions
)
  process.exitCode = 1;
