import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rootCertificates } from 'node:tls';
import { certificateFingerprint, compareCertificates } from './apk-certificates.mjs';

const [first, second] = rootCertificates;
test('compares the certificate bytes independently of human-readable signer labels', () => {
  assert.equal(
    compareCertificates(`Signer #1\n${first}`, `Signer (minSdkVersion=26)\n${first}`).matches,
    true,
  );
});
test('blocks distinct signing certificates', () => {
  const result = compareCertificates(first, second);
  assert.equal(result.matches, false);
  assert.notEqual(result.previousSha256, result.currentSha256);
});
test('rejects missing certificate output instead of treating it as a mismatch or match', () => {
  assert.throws(() => certificateFingerprint('Verifies\nNumber of signers: 1'), /found 0/);
  assert.throws(() => compareCertificates('', ''), /found 0/);
});
test('accepts repeated copies of the same certificate across SDK ranges', () => {
  assert.equal(certificateFingerprint(first + '\n' + first), certificateFingerprint(first));
});
test('rejects multiple distinct certificates that require an explicit rotation policy', () => {
  assert.throws(() => certificateFingerprint(first + '\n' + second), /found 2/);
});
test('uses X509 bytes rather than an unrelated digest label and accepts CRLF', () => {
  assert.equal(
    certificateFingerprint(
      'certificate SHA-256 digest: incorrect\n' + first.replaceAll('\n', '\r\n'),
    ),
    certificateFingerprint(first),
  );
  assert.match(certificateFingerprint(first), /^[a-f0-9]{64}$/);
});
