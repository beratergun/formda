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

export function verifyPinnedCertificate(identity, output) {
  if (
    identity.mode !== 'side-by-side' ||
    identity.appId !== 'io.github.beratergun.berxfit' ||
    identity.legacyAppId !== 'io.github.beratergun.formda' ||
    !/^[a-f0-9]{64}$/.test(identity.certificateSha256) ||
    !/^[a-f0-9]{64}$/.test(identity.legacyCertificateSha256) ||
    identity.certificateSha256 === identity.legacyCertificateSha256
  )
    throw new Error('Invalid side-by-side signing identity');
  const certificateSha256 = certificateFingerprint(output);
  return {
    mode: identity.mode,
    appId: identity.appId,
    expectedSha256: identity.certificateSha256,
    certificateSha256,
    matches: certificateSha256 === identity.certificateSha256,
  };
}
