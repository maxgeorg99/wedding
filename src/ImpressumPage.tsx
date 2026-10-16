import { Link } from 'react-router-dom';
import './wedding.css';

function ImpressumPage() {
  return (
    <div className="wedding-page">
      <section className="impressum">
        <h1>Impressum</h1>

        <h2>Angaben gem. &sect; 5 TMG</h2>
        <p>
          Maximilian Hahn<br />
          Kolbergerstraße 16D<br />
          76139 Karlsruhe
        </p>

        <h2>Kontakt</h2>
        <p>
          E-Mail: maxi.georg.mg@gmail.com
        </p>

        <h2>Haftungsausschluss</h2>
        <p>
          Diese Website dient ausschlie&szlig;lich privaten Zwecken im Rahmen
          unserer Hochzeitsfeier. Trotz sorgf&auml;ltiger inhaltlicher Kontrolle
          &uuml;bernehmen wir keine Haftung f&uuml;r die Inhalte externer Links.
          F&uuml;r den Inhalt der verlinkten Seiten sind ausschlie&szlig;lich
          deren Betreiber verantwortlich.
        </p>

        <h2>Datenschutz</h2>
        <p>
          Die Nutzung unserer Website ist ohne Angabe personenbezogener Daten
          m&ouml;glich. Soweit auf unseren Seiten personenbezogene Daten
          (beispielsweise Name oder E-Mail-Adressen) erhoben werden, erfolgt
          dies stets auf freiwilliger Basis. Diese Daten werden ohne Ihre
          ausdr&uuml;ckliche Zustimmung nicht an Dritte weitergegeben.
        </p>

        <h2>Gästebuch-Animation</h2>
        <p>
          Grundlage: <a href="https://rive.app/marketplace/24847-46420-3d-book-with-page-flip-animation/">3D Book with page flip animation</a> von Tom_acco,
          lizenziert unter <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
          Für unser Gästebuch angepasst: Originalseiten, rosa Einband, Öffnungsanimation und Navigation.
        </p>

        <Link to="/" className="rsvp-button" style={{ marginTop: '2rem', display: 'inline-block' }}>
          Zur&uuml;ck zur Startseite
        </Link>
      </section>
    </div>
  );
}

export default ImpressumPage;