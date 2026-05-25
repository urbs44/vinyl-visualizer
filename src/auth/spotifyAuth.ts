import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce';
import { tokenStore } from './tokenStore';

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SCOPE = 'user-read-currently-playing';

const KEY_VERIFIER = 'vv.pkce.verifier';
const KEY_STATE = 'vv.pkce.state';

export async function buildAuthorizeUrl(clientId: string, redirectUri: string): Promise<string> {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();
  sessionStorage.setItem(KEY_VERIFIER, verifier);
  sessionStorage.setItem(KEY_STATE, state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    scope: SCOPE,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export async function handleCallback(
  clientId: string,
  redirectUri: string,
  code: string,
  returnedState: string
): Promise<void> {
  const expectedState = sessionStorage.getItem(KEY_STATE);
  const verifier = sessionStorage.getItem(KEY_VERIFIER);
  if (!expectedState || expectedState !== returnedState) {
    sessionStorage.removeItem(KEY_VERIFIER);
    sessionStorage.removeItem(KEY_STATE);
    throw new Error('OAuth state mismatch - possible CSRF, aborting.');
  }
  if (!verifier) throw new Error('Missing PKCE verifier');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`);
  const data = await response.json();
  tokenStore.set({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
  sessionStorage.removeItem(KEY_VERIFIER);
  sessionStorage.removeItem(KEY_STATE);
}

let refreshInFlight: Promise<void> | null = null;

export function refreshAccessToken(clientId: string): Promise<void> {
  if (refreshInFlight) return refreshInFlight;
  const current = tokenStore.get();
  if (!current) return Promise.reject(new Error('No tokens to refresh'));

  refreshInFlight = (async () => {
    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: current.refreshToken,
        client_id: clientId,
      });
      const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!response.ok) {
        tokenStore.clear();
        throw new Error(`Refresh failed: ${response.status}`);
      }
      const data = await response.json();
      tokenStore.set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? current.refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
      });
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export function logout(): void {
  tokenStore.clear();
  sessionStorage.removeItem(KEY_VERIFIER);
  sessionStorage.removeItem(KEY_STATE);
}
