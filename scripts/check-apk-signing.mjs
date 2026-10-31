import { readFileSync } from 'node:fs';
import { compareCertificates } from './apk-certificates.mjs';

try {
  const result = compareCertificates(
    readFileSync(process.argv[2], 'utf8'),
    readFileSync(process.argv[3], 'utf8'),
  );
  console.log(JSON.stringify(result, null, 2));
  if (!result.matches) {
    console.error('APK signing certificate differs from v2.0.0; distribution blocked');
    process.exitCode = 1;
  }
} catch (error) {
  console.error('APK signing certificate could not be read; distribution blocked');
  console.error(error instanceof Error ? error.message : String(error));
  for (const file of process.argv.slice(2, 4)) {
    const details = readFileSync(file, 'utf8').replace(
      /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,
      '[public certificate PEM]',
    );
    console.error(details.slice(0, 4096));
  }
  process.exitCode = 2;
}
