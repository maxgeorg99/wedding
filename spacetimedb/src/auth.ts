import { SenderError, type ReducerCtx } from 'spacetimedb/server';

const ALLOWED_PLANNER_SUBS = [
  '06c8f4a9-78d8-4780-a654-c4586b3a05b4', // local

  'b16be493-ecb5-49c3-9a6b-7629326478e3', // Max Notebook
  '55aad1a3-77b4-42db-aba6-56a413111021', // Max Handy
  '1c096145-1504-4fcd-9230-8af01b5fddf6', // claudiahahn00@gmail.com
];

export function requirePlanner(ctx: ReducerCtx<any>) {
  const auth = ctx.senderAuth;
  if (auth.isInternal) return;
  const jwt = auth.jwt;
  if (!jwt) throw new SenderError('Nicht autorisiert: Anmeldung erforderlich');
  if (!ALLOWED_PLANNER_SUBS.includes(jwt.subject)) {
    throw new SenderError(`Nicht autorisiert: Kein Zugang (sub: ${jwt.subject})`);
  }
}