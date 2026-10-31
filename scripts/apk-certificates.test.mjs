import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rootCertificates } from 'node:tls';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  certificateFingerprint,
  compareCertificates,
  verifyPinnedCertificate,
} from './apk-certificates.mjs';

const [first, second] = rootCertificates;
const identity = {
  mode: 'side-by-side',
  appId: 'io.github.beratergun.berxfit',
  legacyAppId: 'io.github.beratergun.formda',
  certificateSha256: certificateFingerprint(first),
  legacyCertificateSha256: certificateFingerprint(second),
};
test('accepts only the pinned berXfit certificate for the separate application', () => {
  assert.equal(verifyPinnedCertificate(identity, first).matches, true);
  assert.equal(verifyPinnedCertificate(identity, second).matches, false);
});
test('rejects a legacy application ID, malformed pin or reused legacy identity', () => {
  for (const change of [
    { appId: identity.legacyAppId },
    { certificateSha256: '' },
    { certificateSha256: identity.legacyCertificateSha256 },
    { mode: 'in-place' },
  ])
    assert.throws(() => verifyPinnedCertificate({ ...identity, ...change }, first), /Invalid/);
});
test('pinned identity CLI fails closed for a wrong signer or invalid application policy', () => {
  const directory = mkdtempSync(join(tmpdir(), 'apk-pinned-test-'));
  const policy = join(directory, 'identity.json'),
    certificate = join(directory, 'certificate.pem');
  try {
    for (const [settings, pem, status] of [
      [identity, first, 0],
      [identity, second, 1],
      [{ ...identity, appId: identity.legacyAppId }, first, 2],
    ]) {
      writeFileSync(policy, JSON.stringify(settings));
      writeFileSync(certificate, pem);
      const result = spawnSync(
        process.execPath,
        [
          fileURLToPath(new URL('./check-apk-signing.mjs', import.meta.url)),
          '--identity',
          policy,
          certificate,
        ],
        { encoding: 'utf8' },
      );
      assert.equal(result.status, status, result.stderr);
    }
  } finally {
    unlinkSync(policy);
    unlinkSync(certificate);
    rmdirSync(directory);
  }
});
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
