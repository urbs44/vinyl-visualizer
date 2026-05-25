import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildAuthorizeUrl, handleCallback, refreshAccessToken } from './spotifyAuth';
import { tokenStore } from './tokenStore';

vi.mock('./pkce', () => ({
  generateCodeVerifier: () => 'verifier-xyz',
  generateCodeChallenge: async () => 'challenge-xyz',
  generateState: () => 'state-xyz',
}));

const ORIGINAL_FETCH = global.fetch;

describe('spotifyAuth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    global.fetch = vi.fn() as typeof fetch;
  });

  test('buildAuthorizeUrl stores verifier+state and returns spotify URL with correct params', async () => {
    const url = await buildAuthorizeUrl('CID', 'http://127.0.0.1:5173/callback');
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe('https://accounts.spotify.com/authorize');
    expect(parsed.searchParams.get('client_id')).toBe('CID');
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:5173/callback');
    expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
    expect(parsed.searchParams.get('code_challenge')).toBe('challenge-xyz');
    expect(parsed.searchParams.get('state')).toBe('state-xyz');
    expect(parsed.searchParams.get('scope')).toBe('user-read-currently-playing');
    expect(sessionStorage.getItem('vv.pkce.verifier')).toBe('verifier-xyz');
    expect(sessionStorage.getItem('vv.pkce.state')).toBe('state-xyz');
  });

  test('handleCallback rejects on state mismatch', async () => {
    sessionStorage.setItem('vv.pkce.verifier', 'v');
    sessionStorage.setItem('vv.pkce.state', 'expected');
    await expect(
      handleCallback('CID', 'http://127.0.0.1:5173/callback', 'code', 'wrong-state')
    ).rejects.toThrow(/state/i);
  });

  test('handleCallback exchanges code and stores tokens', async () => {
    sessionStorage.setItem('vv.pkce.verifier', 'verifier-xyz');
    sessionStorage.setItem('vv.pkce.state', 'state-xyz');
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'A', refresh_token: 'R', expires_in: 3600 }),
    } as Response);
    await handleCallback('CID', 'http://127.0.0.1:5173/callback', 'code', 'state-xyz');
    const tokens = tokenStore.get();
    expect(tokens?.accessToken).toBe('A');
    expect(tokens?.refreshToken).toBe('R');
    expect(tokens?.expiresAt).toBeGreaterThan(Date.now());
    expect(sessionStorage.getItem('vv.pkce.verifier')).toBeNull();
    expect(sessionStorage.getItem('vv.pkce.state')).toBeNull();
  });

  test('refreshAccessToken updates access token and keeps existing refresh if absent', async () => {
    tokenStore.set({ accessToken: 'old', refreshToken: 'R', expiresAt: 0 });
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'NEW', expires_in: 3600 }),
    } as Response);
    await refreshAccessToken('CID');
    const tokens = tokenStore.get();
    expect(tokens?.accessToken).toBe('NEW');
    expect(tokens?.refreshToken).toBe('R');
  });

  test('refreshAccessToken replaces refresh token if response includes one', async () => {
    tokenStore.set({ accessToken: 'old', refreshToken: 'R', expiresAt: 0 });
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'NEW', refresh_token: 'NEWR', expires_in: 3600 }),
    } as Response);
    await refreshAccessToken('CID');
    expect(tokenStore.get()?.refreshToken).toBe('NEWR');
  });

  afterAll(() => {
    global.fetch = ORIGINAL_FETCH;
  });
});
