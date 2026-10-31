import { readFileSync } from 'node:fs';
import { compareCertificates, verifyPinnedCertificate } from './apk-certificates.mjs';

try {
  const pinned = process.argv[2] === '--identity';
  const result = pinned
    ? verifyPinnedCertificate(
        JSON.parse(readFileSync(process.argv[3], 'utf8')),
        readFileSync(process.argv[4], 'utf8'),
      )
    : compareCertificates(
        readFileSync(process.argv[2], 'utf8'),
        readFileSync(process.argv[3], 'utf8'),
      );
  console.log(JSON.stringify(result, null, 2));
  if (!result.matches) {
    console.error(
      'APK signing certificate does not match its required identity; distribution blocked',
    );
    process.exitCode = 1;
  }
} catch (error) {
  console.error('APK signing certificate could not be read; distribution blocked');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
}
