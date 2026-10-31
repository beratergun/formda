import { X509Certificate } from 'node:crypto';

export function certificateFingerprint(output) {
  const certificates =
    output.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
  const fingerprints = [
    ...new Set(
      certificates.map((certificate) =>
        new X509Certificate(certificate).fingerprint256.replaceAll(':', '').toLowerCase(),
      ),
    ),
  ];
  if (fingerprints.length !== 1)
    throw new Error(`Expected one unique APK signing certificate, found ${fingerprints.length}`);
  return fingerprints[0];
}

export function compareCertificates(previousOutput, currentOutput) {
  const previousSha256 = certificateFingerprint(previousOutput);
  const currentSha256 = certificateFingerprint(currentOutput);
  return { previousSha256, currentSha256, matches: previousSha256 === currentSha256 };
}
