import { SenderError, type ReducerCtx } from 'spacetimedb/server';

const ALLOWED_PLANNER_SUBS = [
  'b16be493-ecb5-49c3-9a6b-7629326478e3', // maxi.georg.mg@gmail.com
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