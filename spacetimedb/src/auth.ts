import { SenderError, type ReducerCtx } from 'spacetimedb/server';

const ALLOWED_PLANNER_EMAILS = [
  'maxi.georg.mg@gmail.com',
  'claudiahahn00@gmail.com',
];

const OIDC_ISSUER = 'https://auth.spacetimedb.com/oidc';
const OIDC_CLIENT_ID = 'client_032t8j0XAS6j7OMoshknyW';

export function requirePlanner(ctx: ReducerCtx<any>) {
  const auth = ctx.senderAuth;
  if (auth.isInternal) return;
  const jwt = auth.jwt;
  if (!jwt) throw new SenderError('Nicht autorisiert: Anmeldung erforderlich');
  if (jwt.issuer !== OIDC_ISSUER) throw new SenderError('Nicht autorisiert: Ungültiger Issuer');
  if (!jwt.audience.some((aud: string) => aud === OIDC_CLIENT_ID)) {
    throw new SenderError('Nicht autorisiert: Ungültige Audience');
  }
  const email = jwt.fullPayload['email'] as string | undefined;
  if (!email || !ALLOWED_PLANNER_EMAILS.includes(email.toLowerCase())) {
    throw new SenderError('Nicht autorisiert: Kein Zugang zum Planner');
  }
}