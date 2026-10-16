import { useEffect, useRef, useState } from 'react';
import { Alignment, Fit, Layout, Rive, RuntimeLoader } from '@rive-app/webgl2';
import riveWasm from '@rive-app/webgl2/rive.wasm?url';

RuntimeLoader.setWasmUrl(riveWasm);

export default function GuestbookPlayer({ buffer }: { buffer: ArrayBuffer }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const instance = useRef<Rive | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!canvas.current) return;
    setReady(false); setError(false);
    let active = true;
    const rive = new Rive({
      canvas: canvas.current, buffer, artboard: 'Book', stateMachine: 'Guest book',
      autoplay: true, autoBind: true, enableRiveAssetCDN: false, isTouchScrollEnabled: true,
      layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
      onLoad: () => {
        if (!active) return;
        rive.volume = 0;
        rive.resizeDrawingSurfaceToCanvas();
        setReady(true);
      },
      onLoadError: () => { if (active) setError(true); },
    });
    instance.current = rive;
    const observer = new ResizeObserver(() => { if (active) rive.resizeDrawingSurfaceToCanvas(); });
    observer.observe(canvas.current);
    return () => { active = false; observer.disconnect(); instance.current = null; rive.cleanup(); };
  }, [buffer, attempt]);

  function trigger(name: string) { instance.current?.viewModelInstance?.trigger(name)?.trigger(); }

  return (
    <div className="guestbook-player">
      <div className="book-viewport" tabIndex={0} aria-label="Gästebuch. Mit den Pfeiltasten blättern."
        onKeyDown={event => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault(); trigger(event.key === 'ArrowRight' ? 'Next' : 'Back');
          }
        }}>
        <canvas ref={canvas} className="book-canvas" aria-label="Animiertes Gästebuch mit den fotografierten Originalseiten">Unser Gästebuch benötigt einen Browser mit WebGL-Unterstützung.</canvas>
        <button className="book-replay" type="button" disabled={!ready || error}
          aria-label="Von vorne abspielen" title="Von vorne abspielen" onClick={() => trigger('Replay')}>
          <span className="visually-hidden">Von vorne abspielen</span>
        </button>
      </div>
      {!ready && !error && <p className="book-status" role="status">Das Buch wird aufgeschlagen …</p>}
      {error && <div className="guestbook-error" role="alert"><p>Das Buch konnte nicht angezeigt werden. Versucht es erneut oder öffnet die Seite in einem aktuellen Browser.</p><button className="memory-button" onClick={() => setAttempt(attempt + 1)}>Erneut versuchen</button></div>}

    </div>
  );
}
