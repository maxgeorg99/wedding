/** Portable encrypted asset format; the password and plaintext never enter the build. */
export type GuestbookManifest = {
  version: 1;
  iterations: number;
  salt: string;
  checkIv: string;
  check: string;
  iv: string;
  file: string;
};

export const CHECK_TEXT = 'Claudia & Max guest book v1';
export const ITERATIONS = 600_000;
export function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
export function toBase64(value: Uint8Array): string {
  return btoa(Array.from(value, byte => String.fromCharCode(byte)).join(''));
}
export async function deriveBookKey(password: string, salt: Uint8Array, iterations = ITERATIONS) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}
export async function unlockBookKey(password: string, manifest: GuestbookManifest) {
  if (manifest.version !== 1 || manifest.iterations !== ITERATIONS) throw new Error('Unsupported guest book');
  const key = await deriveBookKey(password, fromBase64(manifest.salt), manifest.iterations);
  const check = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(manifest.checkIv) }, key, fromBase64(manifest.check));
  if (new TextDecoder().decode(check) !== CHECK_TEXT) throw new Error('Invalid guest book');
  return key;
}
export function decryptBook(key: CryptoKey, manifest: GuestbookManifest, data: ArrayBuffer) {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(manifest.iv) }, key, data);
}
