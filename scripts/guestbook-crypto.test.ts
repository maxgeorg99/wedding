import { test, expect } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { CHECK_TEXT, ITERATIONS, deriveBookKey, toBase64, unlockBookKey, decryptBook, type GuestbookManifest } from '../src/guestbookCrypto';

async function fixture() {
  const password = 'test-only-passphrase';
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const checkIv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveBookKey(password, salt);
  const check = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: checkIv }, key, new TextEncoder().encode(CHECK_TEXT));
  const plaintext = new TextEncoder().encode('private guest book content');
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const manifest: GuestbookManifest = { version: 1, iterations: ITERATIONS, salt: toBase64(salt), iv: toBase64(iv), checkIv: toBase64(checkIv), check: toBase64(new Uint8Array(check)), file: 'book-test.enc' };
  return { password, manifest, encrypted, plaintext };
}

test('correct password decrypts; wrong password and modified ciphertext fail closed', async () => {
  const { password, manifest, encrypted, plaintext } = await fixture();
  const key = await unlockBookKey(password, manifest);
  expect(new Uint8Array(await decryptBook(key, manifest, encrypted))).toEqual(plaintext);
  await expect(unlockBookKey('wrong-password', manifest)).rejects.toThrow();
  const tampered = new Uint8Array(encrypted.slice(0)); tampered[0] ^= 1;
  await expect(decryptBook(key, manifest, tampered.buffer)).rejects.toThrow();
  await expect(unlockBookKey(password, { ...manifest, iterations: 1 })).rejects.toThrow();
});

test.skipIf(!process.env.GUESTBOOK_PASSWORD)('packaged asset decrypts byte-for-byte to the built Rive book', async () => {
  const manifest: GuestbookManifest = JSON.parse(await readFile('public/guestbook/manifest.json', 'utf8'));
  const key = await unlockBookKey(process.env.GUESTBOOK_PASSWORD!, manifest);
  const ciphertext = await readFile(`public/guestbook/${manifest.file}`);
  const decrypted = await decryptBook(key, manifest, ciphertext.buffer.slice(ciphertext.byteOffset, ciphertext.byteOffset + ciphertext.byteLength));
  const original = await readFile('rive/physical-guestbook/build/physical-guestbook.riv');
  expect(Buffer.from(decrypted).equals(original)).toBe(true);
});
