export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;

if (!SPOTIFY_CLIENT_ID) {
  throw new Error('VITE_SPOTIFY_CLIENT_ID is not set. Copy .env.example to .env.');
}

export function getRedirectUri(): string {
  return `${window.location.origin}/callback`;
}

export function isMockMode(): boolean {
  return new URLSearchParams(window.location.search).get('mock') === '1';
}
