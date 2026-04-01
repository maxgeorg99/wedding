import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './wedding.css';
import FallingLeaves from './FallingLeaves';

const WEDDING_DATE = new Date('2026-10-10T14:00:00');

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
            einem schönen Herbsttag im Kreise unserer Liebsten feiern und besiegeln.
          </p>
        </section>

        <hr className="section-divider" />

        {/* Location */}
        <section className="location">
          <h2>Unsere Location</h2>
          <p className="location-name">Buhlsche Mühle</p>
          <p className="location-address">Pforzheimer Str. 68, Ettlingen, 76275</p>
          <div>
            <img
              className="venue-photo"
              src="https://image.bridebook.com/weddingsuppliers/venue/deqgOMmM8p/35ee6186-3997-4ddd-b09e-0b666270160e.jpg/dpr=1,fit=cover,g=face,w=500,h=333"
              alt="Buhlsche Mühle Venue"
            />
          </div>
          <div>
            <iframe
              className="map-embed"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2621.5!2d8.4075!3d48.9425!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47970e7f5b0d9c2d%3A0x4256b4f15c64b0e4!2sBuhlsche%20M%C3%BChle!5e0!3m2!1sde!2sde!4v1"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Buhlsche Mühle Karte"
            />
          </div>
        </section>

        <hr className="section-divider" />

        {/* FAQs */}
        <section className="faqs">
          <h2>FAQs</h2>
          <div className="faq-item">
            <p className="faq-question">Gibt es einen Dresscode?</p>
            <p className="faq-answer">Warme Herbstfarben.</p>
          </div>
          <div className="faq-item">
            <p className="faq-question">Gibt es Parkplätze vor Ort?</p>
            <p className="faq-answer">Ja, vor der Location stehen Parkplätze zur Verfügung.</p>
          </div>
        </section>

        <hr className="section-divider" />

        {/* Timeline */}
        <section className="timeline">
          <h2>Zeitplan</h2>
          <ul className="timeline-list">
            <li className="timeline-item">
              <span className="timeline-time">14:00</span>
              <span className="timeline-event">Empfang</span>
            </li>
            <li className="timeline-item">
              <span className="timeline-time">15:00</span>
              <span className="timeline-event">Trauung</span>
            </li>
            <li className="timeline-item">
              <span className="timeline-time">16:00</span>
              <span className="timeline-event">Kaffee &amp; Kuchen</span>
            </li>
            <li className="timeline-item">
              <span className="timeline-time">18:00</span>
              <span className="timeline-event">Abendessen</span>
            </li>
            <li className="timeline-item">
              <span className="timeline-time">20:00</span>
              <span className="timeline-event">Party</span>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}

export default App;
