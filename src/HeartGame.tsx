import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
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

type GameState = 'not-registered' | 'ready' | 'playing' | 'finished';

const GAME_DURATION = 30;
const SPAWN_INTERVAL = 400;

export default function HeartGame() {
  const conn = useSpacetimeDB();
  const [guests] = useTable(tables.guest);
  const [scores] = useTable(tables.heartScore);
  const submitScore = useReducer(reducers.submitScore);

  // Resolve player name from identity — the guest who RSVP'd on this device
  const playerName = useMemo(() => {
    if (!conn.identity) return '';
    const myHex = conn.identity.toHexString();
    for (const g of guests) {
      if (g.claimedBy && g.claimedBy.toHexString() === myHex) {
        return g.name;
      }
    }
    return '';
  }, [guests, conn.identity]);

  const [gameState, setGameState] = useState<GameState>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const heartIdRef = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Determine initial state based on identity
  useEffect(() => {
    if (gameState === 'ready' && !playerName && conn.isActive) {
      setGameState('not-registered');
    } else if (gameState === 'not-registered' && playerName) {
      setGameState('ready');
    }
  }, [playerName, conn.isActive, gameState]);

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
  }, [gameState, timeLeft, score, submitScore]);

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
      submitScore({ score: BigInt(newScore) });
      return newScore;
    });
  }, [submitScore]);

  const startGame = () => {
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(GAME_DURATION);
    setHearts([]);
    heartIdRef.current = 0;
    setGameState('playing');
    // Sofort in der Rangliste erscheinen
    submitScore({ score: 0n });
  };

  if (!conn.isActive) {
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

        {gameState === 'not-registered' && (
          <div className="heart-name-entry">
            <div className="heart-result-card">
              <p>Du musst dich zuerst auf der RSVP-Seite anmelden, um spielen zu können.</p>
            </div>
            <Link to="/rsvp" className="rsvp-submit" style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
              Zur Anmeldung
            </Link>
          </div>
        )}

        {gameState === 'ready' && (
          <div className="heart-name-entry">
            <p className="rsvp-hint" style={{ marginTop: '0.75rem' }}>Gleich regnet es Herzen auf deinem Bildschirm.</p>
            <p className="rsvp-hint">Tippe oder klicke so schnell du kannst darauf, um sie einzusammeln!</p>
            <p className="rsvp-hint">Du hast 30 Sekunden — wer die meisten Herzen sammelt, gewinnt.</p>
            <button className="rsvp-submit" onClick={startGame} style={{ marginTop: '1.25rem' }}>
              &#9654; Los geht's!
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
            <button className="rsvp-submit" onClick={startGame} style={{ marginTop: '1rem' }}>
              Nochmal spielen
            </button>
          </div>
        )}

        {/* Leaderboard — visible during game and after */}
        {(gameState === 'playing' || gameState === 'finished') && sortedScores.length > 0 && (
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