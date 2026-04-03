import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { tables, reducers } from './module_bindings';
import { useTable, useReducer, useSpacetimeDB } from 'spacetimedb/react';
import FallingLeaves from './FallingLeaves';

interface Heart {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  collected: boolean;
}

type GameState = 'pick-name' | 'ready' | 'playing' | 'finished';

const GAME_DURATION = 30;
const SPAWN_INTERVAL = 400;

export default function HeartGame() {
  const conn = useSpacetimeDB();
  const [guests, guestsReady] = useTable(tables.guest);
  const [scores] = useTable(tables.heartScore);
  const submitScore = useReducer(reducers.submitScore);
  const startGameReducer = useReducer(reducers.startGame);

  // Auto-detect name from identity (if RSVP'd on this device)
  const autoName = useMemo(() => {
    if (!conn.identity) return '';
    const myHex = conn.identity.toHexString();
    for (const g of guests) {
      if (g.claimedBy && g.claimedBy.toHexString() === myHex) {
        return g.name;
      }
    }
    return '';
  }, [guests, conn.identity]);

  const [playerName, setPlayerName] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [gameState, setGameState] = useState<GameState>('pick-name');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const heartIdRef = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  // If identity is already linked to a guest, skip the name picker
  useEffect(() => {
    if (autoName && gameState === 'pick-name') {
      setPlayerName(autoName);
      setGameState('ready');
    }
  }, [autoName, gameState]);

  // Fuzzy search over guest names
  const guestNames = useMemo(
    () => guests.map((g) => ({ name: g.name })),
    [guests]
  );
  const fuse = useMemo(
    () => new Fuse(guestNames, { keys: ['name'], threshold: 0.4 }),
    [guestNames]
  );
  const suggestions = useMemo(() => {
    if (nameQuery.length < 1) return [];
    return fuse.search(nameQuery).slice(0, 5);
  }, [fuse, nameQuery]);

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

  // Sorted leaderboard with previous positions for animation
  const prevRanksRef = useRef<Map<string, number>>(new Map());
  const sortedScores = [...(scores as { id: bigint; playerName: string; score: bigint; updatedAt: unknown }[])]
    .sort((a, b) => {
      const diff = Number(b.score) - Number(a.score);
      if (diff !== 0) return diff;
      return a.playerName.localeCompare(b.playerName);
    });

  // Track rank changes for animation
  useEffect(() => {
    const newRanks = new Map<string, number>();
    sortedScores.forEach((s, i) => newRanks.set(s.playerName, i));
    const timeout = setTimeout(() => {
      prevRanksRef.current = newRanks;
    }, 50);
    return () => clearTimeout(timeout);
  }, [sortedScores]);

  // Game timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) {
      setGameState('finished');
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [gameState, timeLeft]);

  // Spawn hearts
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      const areaWidth = gameAreaRef.current?.clientWidth ?? 300;
      const size = 28 + Math.random() * 20;
      setHearts((prev) => [
        ...prev.filter((h) => !h.collected && h.y < (gameAreaRef.current?.clientHeight ?? 500) + 50),
        {
          id: heartIdRef.current++,
          x: Math.random() * (areaWidth - size),
          y: -size,
          size,
          speed: 1.5 + Math.random() * 2.5,
          collected: false,
        },
      ]);
    }, SPAWN_INTERVAL);
    return () => clearInterval(interval);
  }, [gameState]);

  // Animate hearts falling
  useEffect(() => {
    if (gameState !== 'playing') return;
    let raf: number;
    const animate = () => {
      setHearts((prev) =>
        prev
          .map((h) => (h.collected ? h : { ...h, y: h.y + h.speed }))
          .filter((h) => h.collected || h.y < (gameAreaRef.current?.clientHeight ?? 500) + 50)
      );
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [gameState]);

  const scoreRef = useRef(0);

  const collectHeart = useCallback((id: number) => {
    setHearts((prev) =>
      prev.map((h) => (h.id === id && !h.collected ? { ...h, collected: true } : h))
    );
    setScore((s) => {
      const newScore = s + 1;
      scoreRef.current = newScore;
      submitScore({ guestName: playerName, score: BigInt(newScore) }).catch(() => {
        setGameState('finished');
      });
      return newScore;
    });
  }, [submitScore, playerName]);

  const startGame = async () => {
    setError(null);
    setStarting(true);
    try {
      await startGameReducer({ guestName: playerName });
      setScore(0);
      scoreRef.current = 0;
      setTimeLeft(GAME_DURATION);
      setHearts([]);
      heartIdRef.current = 0;
      setGameState('playing');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
      setError(msg);
    } finally {
      setStarting(false);
    }
  };

  const selectName = (name: string) => {
    setPlayerName(name);
    setNameQuery(name);
    setShowDropdown(false);
    setGameState('ready');
  };

  if (!conn.isActive || !guestsReady) {
    return (
      <div className="wedding-page" style={{ paddingTop: '2rem' }}>
        <p style={{ color: '#8b7355' }}>Verbindung wird hergestellt...</p>
      </div>
    );
  }

  return (
    <>
      <FallingLeaves />
      <div className="wedding-page">
        <div className="rsvp-page-header">
          <Link to="/rsvp" className="back-link">&larr; Zurück</Link>
          <h1>Herzensammeln</h1>
        </div>

        <hr className="section-divider" />

        {error && (
          <div className="heart-result-card" style={{ marginBottom: '1rem', color: '#c44' }}>
            <p>{error}</p>
          </div>
        )}

        {gameState === 'pick-name' && (
          <div className="heart-name-entry">
            <p className="rsvp-hint">Wie heißt du?</p>
            <div className="rsvp-field" ref={fieldRef}>
              <input
                type="text"
                value={nameQuery}
                onChange={(e) => {
                  setNameQuery(e.target.value);
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
                    <li key={item.name} onClick={() => selectName(item.name)}>
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
              {showDropdown && nameQuery.length >= 2 && suggestions.length === 0 && (
                <div className="rsvp-dropdown">
                  <p className="rsvp-dropdown-empty">Kein Ergebnis gefunden</p>
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === 'ready' && (
          <div className="heart-name-entry">
            <p className="rsvp-hint" style={{ marginTop: '0.5rem' }}>
              Hallo, <strong>{playerName}</strong>!
            </p>
            <p className="rsvp-hint" style={{ marginTop: '0.75rem' }}>Gleich regnet es Herzen auf deinem Bildschirm.</p>
            <p className="rsvp-hint">Tippe oder klicke so schnell du kannst darauf, um sie einzusammeln!</p>
            <p className="rsvp-hint">Du hast 30 Sekunden — wer die meisten Herzen sammelt, gewinnt.</p>
            <button className="rsvp-submit" onClick={startGame} disabled={starting} style={{ marginTop: '1.25rem' }}>
              {starting ? 'Wird gestartet...' : '\u25B6 Los geht\u2019s!'}
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="heart-game-container">
            <div className="heart-game-hud">
              <div className="heart-hud-item">
                <span className="heart-hud-label">Zeit</span>
                <span className="heart-hud-value">{timeLeft}s</span>
              </div>
              <div className="heart-hud-item">
                <span className="heart-hud-label">Herzen</span>
                <span className="heart-hud-value">{score}</span>
              </div>
            </div>
            <div className="heart-game-area" ref={gameAreaRef}>
              {hearts.map((heart) =>
                heart.collected ? null : (
                  <div
                    key={heart.id}
                    className="heart-target"
                    style={{
                      left: heart.x,
                      top: heart.y,
                      fontSize: heart.size,
                    }}
                    onPointerDown={() => collectHeart(heart.id)}
                    role="button"
                    aria-label="Herz einsammeln"
                  >
                    <span className="heart-emoji" role="img" aria-hidden="true">&#10084;&#65039;</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="heart-finished">
            <div className="heart-result-card">
              <p className="heart-result-score">{score} Herzen gesammelt!</p>
              <p>Gut gemacht, {playerName}!</p>
            </div>
            <button className="rsvp-submit" onClick={startGame} disabled={starting} style={{ marginTop: '1rem' }}>
              {starting ? 'Wird gestartet...' : 'Nochmal spielen'}
            </button>
          </div>
        )}

        {/* Leaderboard — always visible when there are scores */}
        {sortedScores.length > 0 && (
          <>
            <hr className="section-divider" />
            <div className="heart-leaderboard">
              <h2>Rangliste</h2>
              <ol className="heart-leaderboard-list">
                {sortedScores.map((entry, index) => {
                  const prevRank = prevRanksRef.current.get(entry.playerName);
                  const moved = prevRank !== undefined && prevRank !== index;
                  const isCurrentPlayer = entry.playerName === playerName;
                  return (
                    <li
                      key={entry.playerName}
                      className={`heart-leaderboard-item${moved ? ' heart-rank-changed' : ''}${isCurrentPlayer ? ' heart-current-player' : ''}`}
                    >
                      <span className="heart-rank">
                        {index === 0 ? '\uD83E\uDD47' : index === 1 ? '\uD83E\uDD48' : index === 2 ? '\uD83E\uDD49' : `${index + 1}.`}
                      </span>
                      <span className="heart-player-name">{entry.playerName}</span>
                      <span className="heart-player-score">{entry.score.toString()}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </>
        )}

        <div style={{ height: '3rem' }} />
      </div>
    </>
  );
}