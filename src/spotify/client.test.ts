import { beforeEach, describe, expect, test, vi } from 'vitest';
import { tokenStore } from '../auth/tokenStore';
import { spotifyFetch } from './client';

vi.mock('../auth/spotifyAuth', () => ({
  refreshAccessToken: vi.fn(async () => {
    tokenStore.set({ accessToken: 'NEW', refreshToken: 'R', expiresAt: Date.now() + 3600_000 });
  }),
}));

vi.mock('../env', () => ({ SPOTIFY_CLIENT_ID: 'CID' }));

describe('spotifyFetch', () => {
  beforeEach(() => {
    sessionStorage.clear();
    tokenStore.set({ accessToken: 'OLD', refreshToken: 'R', expiresAt: Date.now() + 3600_000 });
    global.fetch = vi.fn() as typeof fetch;
  });

  test('adds Authorization header and returns JSON', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ x: 1 }),
    } as Response);
    const data = await spotifyFetch('/me');
    expect(data).toEqual({ x: 1 });
    const headers = vi.mocked(global.fetch).mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer OLD');
  });

  test('204 returns null', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => null,
    } as Response);
    expect(await spotifyFetch('/me/player/currently-playing')).toBeNull();
  });

  test('on 401 refreshes and retries once with new token', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) } as Response);
    const data = await spotifyFetch('/me');
    expect(data).toEqual({ ok: true });
    const retryHeaders = vi.mocked(global.fetch).mock.calls[1][1]?.headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer NEW');
  });

  test('on 429 throws RateLimitError with retryAfter', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '7' }),
      json: async () => ({}),
    } as Response);
    await expect(spotifyFetch('/me')).rejects.toMatchObject({
      name: 'RateLimitError',
      retryAfter: 7,
    });
  });

  test('on 403 throws ForbiddenError', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
    } as Response);
    await expect(spotifyFetch('/me')).rejects.toMatchObject({ name: 'ForbiddenError' });
  });
});
