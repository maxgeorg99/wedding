import { Link } from 'react-router-dom';
import FallingLeaves from './FallingLeaves';
import RsvpForm from './RsvpForm';

export default function RsvpPage() {
  return (
    <>
      <FallingLeaves />
      <div className="wedding-page">
        <div className="rsvp-page-header">
          <Link to="/" className="back-link">&larr; Zurück</Link>
          <p className="hero-label">Hochzeit</p>
          <h1>Claudia &amp; Maximilian</h1>
        </div>

        <hr className="section-divider" />

        <RsvpForm />
      </div>
    </>
  );
}
