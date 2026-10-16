import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { decryptBook, unlockBookKey, type GuestbookManifest } from './guestbookCrypto';

const BookPlayer = lazy(() => import('./GuestbookPlayer'));

export default function Guestbook() {
  const [password, setPassword] = useState('');
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function unlock(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setStatus('Code wird geprüft …');
    const controller = new AbortController(); request.current = controller;
    let phase = 'load';
    try {
      if (!crypto.subtle) throw new Error('Browser encryption unavailable');
      const response = await fetch('/guestbook/manifest.json', { signal: controller.signal, cache: 'no-cache' });
      if (!response.ok) throw new Error('Manifest unavailable');
      const manifest: GuestbookManifest = await response.json();
      if (!/^book-[a-f0-9]{16}\.enc$/.test(manifest.file)) throw new Error('Invalid file');
      phase = 'password';
      const key = await unlockBookKey(password.trim(), manifest);
      if (controller.signal.aborted) return;
      phase = 'load'; setPassword(''); setStatus('Euer Gästebuch wird geladen …');
      const book = await fetch(`/guestbook/${manifest.file}`, { signal: controller.signal });
      if (!book.ok) throw new Error('Book unavailable');
      const unlocked = await decryptBook(key, manifest, await book.arrayBuffer());
      if (!controller.signal.aborted) setBuffer(unlocked);
    } catch {
      if (!controller.signal.aborted) {
        setError(phase === 'password' ? 'Der Code stimmt leider nicht. Bitte versucht es noch einmal.' : 'Das Gästebuch konnte nicht geladen werden. Bitte prüft eure Verbindung und versucht es erneut.');
        input.current?.focus();
      }
    } finally {
      if (!controller.signal.aborted) { setBusy(false); setStatus(''); }
    }
  }

  function lock() {
    request.current?.abort(); setBuffer(null); setPassword(''); setError('');
    window.setTimeout(() => input.current?.focus(), 0);
  }

  if (buffer) return (
    <div className="unlocked-book">
      <Suspense fallback={<p className="book-status" role="status">Gästebuch wird geöffnet …</p>}>
        <BookPlayer buffer={buffer} />
      </Suspense>
      <button className="visually-hidden focus-visible-control" onClick={lock}>Gästebuch wieder sperren</button>
    </div>
  );

  return (
    <div className="guestbook-gate">
      <div className="pink-book-token" aria-hidden="true"><span>Claudia &amp; Max</span><small>Unser Gästebuch</small><i>♡</i></div>
      <form onSubmit={unlock} className="guestbook-form">
        <h3>Für unsere Gäste</h3>
        <p>Diese Erinnerungen teilen wir mit euch. Öffnet das Buch mit unserem gemeinsamen Code.</p>
        <label htmlFor="guestbook-password">Gästebuch-Code</label>
        <div className="guestbook-input-row">
          <input ref={input} id="guestbook-password" type="password" inputMode="numeric" autoComplete="current-password" required maxLength={64}
            value={password} onChange={e => setPassword(e.target.value)} aria-invalid={!!error} aria-describedby={error ? 'guestbook-error' : undefined} disabled={busy} />
          <button className="memory-button" disabled={busy || !password.trim()}>{busy ? 'Einen Moment …' : 'Buch öffnen'}</button>
        </div>
        {status && <p className="memory-note" role="status">{status}</p>}
        {error && <p id="guestbook-error" className="guestbook-error" role="alert">{error}</p>}
      </form>
    </div>
  );
}
