import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import RsvpPage from './RsvpPage.tsx';
import HeartGame from './HeartGame.tsx';
import PlannerPage from './PlannerPage.tsx';
import ImpressumPage from './ImpressumPage.tsx';
import './wedding.css';
import { Identity } from 'spacetimedb';
import { SpacetimeDBProvider } from 'spacetimedb/react';
import { DbConnection, type ErrorContext } from './module_bindings/index.ts';

const HOST = import.meta.env.VITE_SPACETIMEDB_HOST ?? 'ws://localhost:3000';
const DB_NAME = import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'wedding';
const TOKEN_KEY = `${HOST}/${DB_NAME}/auth_token`;

const onConnect = (conn: DbConnection, identity: Identity, token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  console.log('Connected to SpacetimeDB:', identity.toHexString());
  conn.subscriptionBuilder()
    .onApplied(() => console.log('Subscription applied'))
    .onError((e) => console.error('Subscription error:', e))
    .subscribe(['SELECT * FROM guest', 'SELECT * FROM heart_score', 'SELECT * FROM game_session', 'SELECT * FROM wedding_todo', 'SELECT * FROM unclaimed_guests']);
};

const onDisconnect = () => {
  console.log('Disconnected from SpacetimeDB');
};

const onConnectError = (_ctx: ErrorContext, err: Error) => {
  console.log('Error connecting to SpacetimeDB:', err);
};

const connectionBuilder = DbConnection.builder()
  .withUri(HOST)
  .withDatabaseName(DB_NAME)
  .withToken(localStorage.getItem(TOKEN_KEY) || undefined)
  .onConnect(onConnect)
  .onDisconnect(onDisconnect)
  .onConnectError(onConnectError);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/rsvp" element={<RsvpPage />} />
          <Route path="/herzen" element={<HeartGame />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
        </Routes>
      </BrowserRouter>
    </SpacetimeDBProvider>
  </StrictMode>
);
