import { useEffect, useState } from 'react';
import { handleCallback } from '../auth/spotifyAuth';
import { SPOTIFY_CLIENT_ID, getRedirectUri } from '../env';

export function CallbackRoute() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const denied = params.get('error');

    if (denied) {
      setError('Spotify access denied. Returning to login...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      return;
    }
    if (!code || !state) {
      setError('Missing code/state. Returning to login...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      return;
    }
    handleCallback(SPOTIFY_CLIENT_ID, getRedirectUri(), code, state)
      .then(() => {
        window.history.replaceState({}, '', '/');
        window.location.reload();
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, []);

  return (
    <div className="h-full flex items-center justify-center bg-black text-white">
      {error ? <p className="text-red-400">{error}</p> : <p>Connecting...</p>}
    </div>
  );
}
