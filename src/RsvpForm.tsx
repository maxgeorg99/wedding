import { useState, useMemo, useRef, useEffect } from 'react';
import Fuse from 'fuse.js';
import { tables, reducers } from './module_bindings';
import { useTable, useReducer, useSpacetimeDB } from 'spacetimedb/react';

interface GuestRow {
  id: bigint;
  name: string;
  attending: boolean;
  plusOne: boolean;
  plusOneName?: string;
  dietaryNotes?: string;
}

export default function RsvpForm() {
  const conn = useSpacetimeDB();
  const [guests] = useTable(tables.guest);
  const rsvp = useReducer(reducers.rsvp);

  const [query, setQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<GuestRow | null>(null);
  const [attending, setAttending] = useState(true);
  const [plusOne, setPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(
    () => new Fuse(guests as GuestRow[], { keys: ['name'], threshold: 0.4 }),
    [guests]
  );

  const suggestions = useMemo(() => {
    if (query.length < 1) return [];
    return fuse.search(query).slice(0, 5);
  }, [fuse, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fieldRef.current && !fieldRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectGuest = (guest: GuestRow) => {
    setSelectedGuest(guest);
    setQuery(guest.name);
    setAttending(guest.attending);
    setPlusOne(guest.plusOne);
    setPlusOneName(guest.plusOneName ?? '');
    setDietaryNotes(guest.dietaryNotes ?? '');
    setShowDropdown(false);
  };

  const resetSelection = () => {
    setSelectedGuest(null);
    setQuery('');
    setAttending(true);
    setPlusOne(false);
    setPlusOneName('');
    setDietaryNotes('');
    setSubmitted(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) return;

    rsvp({
      name: selectedGuest.name,
      attending,
      plusOne,
      plusOneName: plusOneName.trim() || undefined,
      dietaryNotes: dietaryNotes.trim() || undefined,
    });

    setSubmitted(true);
  };

  if (!conn.isActive) {
    return (
      <section className="rsvp" id="rsvp">
        <h2>Zu- / Absagen</h2>
        <p style={{ color: '#8b7355' }}>Verbindung wird hergestellt...</p>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="rsvp" id="rsvp">
        <h2>Zu- / Absagen</h2>
        <div className="rsvp-success">
          <p>Danke, {selectedGuest?.name}!</p>
          <p>{attending ? 'Wir freuen uns auf dich!' : 'Schade, dass du nicht kommen kannst.'}</p>
        </div>
        <button className="rsvp-submit" onClick={resetSelection} style={{ marginTop: '1rem' }}>
          Weitere Antwort eintragen
        </button>
      </section>
    );
  }

  return (
    <section className="rsvp" id="rsvp">
      <h2>Zu- / Absagen</h2>

      {!selectedGuest ? (
        // Step 1: Find your name
        <div className="rsvp-form">
          <p className="rsvp-hint">Suche deinen Namen in der Gästeliste</p>
          <div className="rsvp-field" ref={fieldRef}>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Name eingeben..."
              autoComplete="off"
              autoFocus
            />
            {showDropdown && suggestions.length > 0 && (
              <ul className="rsvp-dropdown">
                {suggestions.map(({ item }) => (
                  <li key={item.id.toString()} onClick={() => selectGuest(item)}>
                    {item.name}
                  </li>
                ))}
              </ul>
            )}
            {showDropdown && query.length >= 2 && suggestions.length === 0 && (
              <div className="rsvp-dropdown">
                <p className="rsvp-dropdown-empty">Kein Ergebnis gefunden</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Step 2: Fill in RSVP details
        <form className="rsvp-form" onSubmit={handleSubmit}>
          <div className="rsvp-selected-name">
            <span>{selectedGuest.name}</span>
            <button type="button" className="rsvp-change-name" onClick={resetSelection}>
              Ändern
            </button>
          </div>

          <div className="rsvp-field">
            <label>Kommst du?</label>
            <div className="rsvp-toggle">
              <button
                type="button"
                className={`rsvp-toggle-btn ${attending ? 'active' : ''}`}
                onClick={() => setAttending(true)}
              >
                Ja, ich komme!
              </button>
              <button
                type="button"
                className={`rsvp-toggle-btn ${!attending ? 'active decline' : ''}`}
                onClick={() => setAttending(false)}
              >
                Leider nicht
              </button>
            </div>
          </div>

          {attending && (
            <>
              <div className="rsvp-field">
                <label className="rsvp-checkbox-label">
                  <input
                    type="checkbox"
                    checked={plusOne}
                    onChange={(e) => setPlusOne(e.target.checked)}
                  />
                  Ich bringe eine Begleitung mit
                </label>
              </div>

              {plusOne && (
                <div className="rsvp-field">
                  <label htmlFor="rsvp-plus-one">Name der Begleitung</label>
                  <input
                    id="rsvp-plus-one"
                    type="text"
                    value={plusOneName}
                    onChange={(e) => setPlusOneName(e.target.value)}
                    placeholder="Name"
                  />
                </div>
              )}

              <div className="rsvp-field">
                <label htmlFor="rsvp-dietary">Unverträglichkeiten / Allergien</label>
                <input
                  id="rsvp-dietary"
                  type="text"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="z.B. vegetarisch, laktosefrei..."
                />
              </div>
            </>
          )}

          <button type="submit" className="rsvp-submit">
            Absenden
          </button>
        </form>
      )}
    </section>
  );
}
