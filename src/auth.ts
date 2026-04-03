// Shared auth constants — frontend only.
// Backend has its own copy in spacetimedb/src/auth.ts (can't share across build boundaries).

export const OIDC_AUTHORITY = 'https://auth.spacetimedb.com/oidc';
export const OIDC_CLIENT_ID = 'client_032t8j0XAS6j7OMoshknyW';

export const OIDC_CONFIG = {
  authority: OIDC_AUTHORITY,
  client_id: OIDC_CLIENT_ID,
  redirect_uri: `${window.location.origin}/planner`,
  post_logout_redirect_uri: window.location.origin,
  scope: 'openid profile email',
  response_type: 'code' as const,
  automaticSilentRenew: true,
};

export const ALLOWED_EMAILS = [
  'maxi.georg.mg@gmail.com',
  'claudiahahn00@gmail.com',
];

export function isEmailAllowed(email: string | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}