import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTable } from 'spacetimedb/react';
import { tables } from './module_bindings/index.ts';
import './wedding.css';
import FallingLeaves from './FallingLeaves';

const WEDDING_DATE = new Date('2026-10-10T14:00:00');

type Venue = {
  name: string;
  address?: string;
  url: string;
  mapsUrl: string;
  images: string[];
  imageCredit: string;
};

const VENUES: Venue[] = [
  {
    name: 'Buhlsche Mühle',
    address: 'Pforzheimer Str. 68, Ettlingen',
    url: 'https://www.buhlsche-muehle.de/',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Buhlsche+M%C3%BChle+Ettlingen',
    images: [
      'https://image.bridebook.com/weddingsuppliers/venue/deqgOMmM8p/35ee6186-3997-4ddd-b09e-0b666270160e.jpg/dpr=1,fit=cover,g=face,w=500,h=333',
      'https://image.bridebook.com/weddingsuppliers/venue/deqgOMmM8p/Standesamt2025.jpg/dpr=1,fit=pad,g=face,w=720,h=514',
    ],
    imageCredit: 'bridebook.com',
  },
  {
    name: 'Lillehus',
    address: 'Horbachstraße 2, Ettlingen',
    url: 'https://lillehuscafe.de/',
    mapsUrl: 'https://maps.app.goo.gl/WeLanSrJqbRtMKWT8',
    images: [
      'https://lillehuscafe.de/app/webp-express/webp-images/uploads/bilder/sonstiges/jobs/gebaeude/dsc6832-1536x1024.jpg.webp',
      'https://lillehuscafe.de/app/uploads/bilder/gebaeude/Innen-scaled-2048x1366.jpg',
      'https://lillehuscafe.de/app/uploads/lillehus-header-1.webp?x57397',
    ],
    imageCredit: 'lillehuscafe.de',
  },
  {
    name: 'Taqueria Taol',
    address: 'Lange Str. 1, Rüppurr',
    url: 'https://www.taqueria-taol.de/',
    mapsUrl: 'https://maps.app.goo.gl/9dcLrbRX6nGJKLVT6',
    images: [
      'https://static.wixstatic.com/media/6f7c92_826595dcbbc34cd3b2c90ec1c6c0e928~mv2.jpg/v1/fill/w_1722,h_1960,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/6f7c92_826595dcbbc34cd3b2c90ec1c6c0e928~mv2.jpg',
      'https://static.wixstatic.com/media/6f7c92_9910910dcc6d479eb4977c2f85814289~mv2.jpg/v1/fill/w_561,h_1920,al_c,q_85,enc_avif,quality_auto/6f7c92_9910910dcc6d479eb4977c2f85814289~mv2.jpg',
      'https://static.wixstatic.com/media/6f7c92_e138270a54154f13acb906bde715ee09~mv2.jpg/v1/fill/w_980,h_1124,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/6f7c92_e138270a54154f13acb906bde715ee09~mv2.jpg',
    ],
    imageCredit: 'taqueria-taol.de',
  },
];

function VenueCarousel({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const go = (next: number) => setIndex(((next % count) + count) % count);

  return (
    <div className="venue-carousel">
      <img
        className="venue-card-photo"
        src={images[index]}
        alt={`${name} – Bild ${index + 1} von ${count}`}
        loading="lazy"
      />
      {count > 1 && (
        <>
          <button
            type="button"
            className="venue-carousel-btn venue-carousel-prev"
            aria-label="Vorheriges Bild"
            onClick={() => go(index - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="venue-carousel-btn venue-carousel-next"
            aria-label="Nächstes Bild"
            onClick={() => go(index + 1)}
          >
            ›
          </button>
          <div className="venue-carousel-dots" role="tablist">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`venue-carousel-dot${i === index ? ' is-active' : ''}`}
                aria-label={`Bild ${i + 1}`}
                aria-selected={i === index}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function useCountdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, WEDDING_DATE.getTime() - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function App() {
  const countdown = useCountdown();
  const [timelineEntries] = useTable(tables.timelineEntry);
  const [timelineConfigs] = useTable(tables.timelineConfig);
  const isTimelineReleased = timelineConfigs.some((c) => c.released);

  return (
    <>
      <FallingLeaves />

      <div className="wedding-page">
        {/* Hero */}
        <section className="hero">
          <p className="hero-label">Hochzeit</p>
          <h1>Claudia &amp; Maximilian</h1>
          <p className="hero-date">Samstag 10.10.26</p>
          <div className="countdown">
            <div className="countdown-units">
              <div className="countdown-unit">
                <span className="countdown-value">{countdown.days}</span>
                <span className="countdown-label">Tage</span>
              </div>
              <div className="countdown-unit">
                <span className="countdown-value">{countdown.hours}</span>
                <span className="countdown-label">Stunden</span>
              </div>
              <div className="countdown-unit">
                <span className="countdown-value">{countdown.minutes}</span>
                <span className="countdown-label">Minuten</span>
              </div>
              <div className="countdown-unit">
                <span className="countdown-value">{countdown.seconds}</span>
                <span className="countdown-label">Sekunden</span>
              </div>
            </div>
          </div>
          <p className="hero-venue">Buhlsche Mühle, Ettlingen, DE</p>
          <Link to="/rsvp" className="rsvp-button">Zu-/Absagen</Link>
        </section>

        <hr className="section-divider" />

        {/* Personal Note */}
        <section className="personal-note">
          <div className="couple-photos">
            <img src="/img-1.jpeg" alt="Claudia & Maximilian" className="couple-photo" />
            <img src="/img-2.jpeg" alt="Claudia & Maximilian" className="couple-photo" />
          </div>
          <p>
            Nach 10 wundervollen gemeinsamen Jahren möchten wir unsere Liebe an
            einem schönen Herbsttag im Kreise unserer Liebsten feiern.
          </p>
        </section>

        <hr className="section-divider" />

        {/* Timeline */}
        <section className="timeline">
          <h2>Zeitplan</h2>
          {isTimelineReleased ? (
              <ul className="timeline-list">
                {[...timelineEntries]
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((entry) => (
                        <li key={entry.id.toString()} className="timeline-item">
                          <span className="timeline-time">{entry.time}</span>
                          <div className="timeline-event-group">
                            <span className="timeline-event">{entry.title}</span>
                            {entry.location && (
                                <span className="timeline-location">{entry.location}</span>
                            )}
                          </div>
                        </li>
                    ))}
              </ul>
          ) : (
              <p className="timeline-tbd">Der Zeitplan wird noch bekannt gegeben.</p>
          )}
        </section>

        <hr className="section-divider" />

        {/* Location */}
        <section className="location">
          <h2>Unsere Locations</h2>
          <div className="venue-grid">
            {VENUES.map((venue) => (
              <div key={venue.name} className="venue-card">
                <VenueCarousel images={venue.images} name={venue.name} />
                <div className="venue-card-body">
                  <a
                    className="venue-card-name"
                    href={venue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {venue.name}
                  </a>
                  {venue.address && (
                    <a
                      className="venue-card-maps"
                      href={venue.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {venue.address}
                    </a>
                  )}
                  <p className="venue-card-credit">Foto: {venue.imageCredit}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="venue-disclaimer">
            Vorschau-Bilder dienen nur der Information. Alle Bildrechte liegen bei
            den jeweiligen Betreibern der verlinkten Websites.
          </p>
        </section>

        <hr className="section-divider" />

        {/* FAQs */}
        <section className="faqs">
          <h2>FAQs</h2>
          <div className="faq-item">
            <p className="faq-question">Gibt es einen Dresscode?</p>
            <p className="faq-answer">Herbstfarben</p>
          </div>
          <div className="faq-item">
            <p className="faq-question">Gibt es Parkplätze vor Ort?</p>
            <p className="faq-answer">Ja, vor der Location stehen Parkplätze zur Verfügung.</p>
          </div>
          <div className="faq-item">
            <p className="faq-question">Gibt es Hotels in der Nähe?</p>
            <p className="faq-answer">
              In Rüppurr und der Umgebung sind ausreichend Hotels und Pensionen buchbar.
            </p>
          </div>
        </section>

        <footer className="wedding-footer">
          <Link to="/impressum">Impressum</Link>
        </footer>
      </div>
    </>
  );
}

export default App;
