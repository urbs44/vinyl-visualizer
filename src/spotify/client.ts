import { SPOTIFY_CLIENT_ID } from '../env';
import { refreshAccessToken } from '../auth/spotifyAuth';
import { tokenStore } from '../auth/tokenStore';

const BASE = 'https://api.spotify.com/v1';

export class RateLimitError extends Error {
  name = 'RateLimitError';
  retryAfter: number;

  constructor(retryAfter: number) {
    super(`Rate limited; retry after ${retryAfter}s`);
    this.retryAfter = retryAfter;
  }
}

export class ForbiddenError extends Error {
  name = 'ForbiddenError';

  constructor() {
    super('403 Forbidden - Spotify account not authorized for this app');
  }
}

export class UnauthorizedError extends Error {
  name = 'UnauthorizedError';

  constructor() {
    super('401 after refresh - please re-login');
  }
}

async function doFetch(path: string, accessToken: string): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function spotifyFetch<T = unknown>(path: string): Promise<T | null> {
  const tokens = tokenStore.get();
  if (!tokens) throw new UnauthorizedError();

  let response = await doFetch(path, tokens.accessToken);

  if (response.status === 401) {
    await refreshAccessToken(SPOTIFY_CLIENT_ID);
    const refreshed = tokenStore.get();
    if (!refreshed) throw new UnauthorizedError();
    response = await doFetch(path, refreshed.accessToken);
    if (response.status === 401) throw new UnauthorizedError();
  }

  if (response.status === 429) {
    const retryAfter = Number.parseInt(response.headers?.get?.('Retry-After') ?? '5', 10);
    throw new RateLimitError(retryAfter);
  }

  if (response.status === 403) throw new ForbiddenError();

  if (response.status === 204) return null;

  if (!response.ok) throw new Error(`Spotify API ${response.status}`);
  return (await response.json()) as T;
}
