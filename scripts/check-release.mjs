import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function files(path) {
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    result.push(...(entry.isDirectory() ? await files(file) : [file]));
  }
  return result;
}
const manifest = JSON.parse(await readFile('dist/guestbook/manifest.json', 'utf8'));
const paths = await files('dist');
if (!paths.includes(`dist/guestbook/${manifest.file}`)) throw new Error('Encrypted book missing');
for (const path of paths) {
  if (/\.(riv|heic|rml|rev)$/i.test(path) || path.includes('/scans/')) throw new Error(`Private source in release: ${path}`);
  if (/\.(js|html|json)$/.test(path) && process.env.GUESTBOOK_PASSWORD) {
    if ((await readFile(path, 'utf8')).includes(process.env.GUESTBOOK_PASSWORD)) throw new Error(`Password exposed in ${path}`);
  }
}
console.log('Release contains the encrypted book and no plaintext Rive/scans or embedded password.');
