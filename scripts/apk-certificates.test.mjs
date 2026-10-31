import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rootCertificates } from 'node:tls';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { certificateFingerprint, compareCertificates } from './apk-certificates.mjs';

const [first, second] = rootCertificates;
test('CLI allows a match and exits nonzero for a mismatch or unreadable certificates', () => {
  const directory = mkdtempSync(join(tmpdir(), 'apk-certificate-test-'));
  const previous = join(directory, 'previous.pem');
  const current = join(directory, 'current.pem');
  try {
    for (const [left, right, status] of [
      [first, first, 0],
      [first, second, 1],
      ['', '', 2],
    ]) {
      writeFileSync(previous, left);
      writeFileSync(current, right);
      const result = spawnSync(
        process.execPath,
        [fileURLToPath(new URL('./check-apk-signing.mjs', import.meta.url)), previous, current],
        { encoding: 'utf8' },
      );
      assert.equal(result.status, status, result.stderr);
    }
  } finally {
    unlinkSync(previous);
    unlinkSync(current);
    rmdirSync(directory);
  }
});
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
