import { useEffect, useState } from 'react';
import { handleCallback } from '../auth/spotifyAuth';
import { SPOTIFY_CLIENT_ID, getRedirectUri } from '../env';

interface CallbackParams {
  code: string | null;
  state: string | null;
  initialError: string | null;
}

function readCallbackParams(): CallbackParams {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const denied = params.get('error');
  if (denied) return { code, state, initialError: 'Spotify access denied. Returning to login...' };
  if (!code || !state) return { code, state, initialError: 'Missing code/state. Returning to login...' };
  return { code, state, initialError: null };
}

export function CallbackRoute() {
  const [{ code, state, initialError }] = useState(() => readCallbackParams());
  const [error, setError] = useState<string | null>(initialError);

  useEffect(() => {
    if (initialError) {
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      return;
    }
    if (!code || !state) return;
    handleCallback(SPOTIFY_CLIENT_ID, getRedirectUri(), code, state)
      .then(() => {
        window.history.replaceState({}, '', '/');
        window.location.reload();
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [code, initialError, state]);

  return (
    <div className="h-full flex items-center justify-center bg-black text-white">
      {error ? <p className="text-red-400">{error}</p> : <p>Connecting...</p>}
    </div>
  );
}
