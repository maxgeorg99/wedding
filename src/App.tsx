import { Link } from 'react-router-dom';
import Guestbook from './Guestbook';
import './after-wedding.css';

// Add the Google Drive album URL here when the photos are ready.
const PHOTO_GALLERY_URL: string = '';

export default function App() {
  return (
    <div className="memories-page">
      <header className="memories-nav">
        <a href="#" className="couple-monogram" aria-label="Claudia und Maximilian – Start">CLAX</a>
        <nav aria-label="Seitennavigation">
          <a href="#gaestebuch">Gästebuch</a>
          <a href="#fotos">Fotos</a>
        </nav>
      </header>
      <main>
        <section className="thank-you-hero" aria-labelledby="thank-you-title">
          <div className="thank-you-copy">
            <p className="wedding-keepsake-date">10. Oktober 2026 · Ettlingen</p>
            <h1 id="thank-you-title">So schön,<br />dass ihr da wart.</h1>
            <p>Ihr habt unseren Hochzeitstag zu etwas ganz Besonderem gemacht.
              Danke fürs Mitfeiern, Mitlachen, für eure lieben Worte und all die Erinnerungen, die bleiben.</p>
            <p className="couple-signature">Claudia &amp; Maximilian</p>
          </div>
          <figure className="keepsake-photos" aria-label="Claudia und Maximilian">
            <img className="keepsake-photo keepsake-photo-back" src="/img-2.jpeg" alt="Claudia und Maximilian zusammen" />
            <img className="keepsake-photo keepsake-photo-front" src="/img-1.jpeg" alt="Ein gemeinsamer Moment von Claudia und Maximilian" />
            <figcaption>Ein Tag. So viele schöne Erinnerungen.</figcaption>
          </figure>
        </section>

        <section className="guestbook-section" id="gaestebuch" aria-labelledby="guestbook-title">
          <div className="memory-section-heading">
            <h2 id="guestbook-title">Eure Worte bleiben.</h2>
            <p>Unser Gästebuch, Seite für Seite. Mit euren Fotos, Zeichnungen und guten Wünschen — genauso, wie ihr sie hinterlassen habt.</p>
          </div>
          <Guestbook />
        </section>

        <section className="gallery-section" id="fotos" aria-labelledby="gallery-title">
          <div className="gallery-illustration" aria-hidden="true"><span>♡</span></div>
          <div>
            <h2 id="gallery-title">Noch einmal mittendrin.</h2>
            <p>Die Fotos von unserem Tag bekommen hier bald ihren Platz.
              Dann könnt ihr in Ruhe durch die Galerie stöbern.</p>
            {PHOTO_GALLERY_URL ? (
              <a className="memory-button" href={PHOTO_GALLERY_URL} target="_blank" rel="noopener noreferrer">Fotogalerie öffnen</a>
            ) : (
              <><button className="memory-button" type="button" disabled aria-describedby="gallery-soon">Fotogalerie · folgt bald</button>
                <p id="gallery-soon" className="memory-note">Wir sammeln noch die schönsten Momente.</p></>
            )}
          </div>
        </section>
      </main>
      <footer className="memories-footer"><p>Mit Liebe, Claudia &amp; Maximilian</p><Link to="/impressum">Impressum</Link></footer>
    </div>
  );
}
