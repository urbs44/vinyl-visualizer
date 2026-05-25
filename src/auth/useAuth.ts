import { useEffect, useState } from 'react';
import { SPOTIFY_CLIENT_ID, getRedirectUri } from '../env';
import { buildAuthorizeUrl, logout as doLogout } from './spotifyAuth';
import { tokenStore, type Tokens } from './tokenStore';

export function useAuth() {
  const [tokens, setTokens] = useState<Tokens | null>(() => tokenStore.get());

  useEffect(() => {
    const unsubscribe = tokenStore.subscribe(setTokens);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isAuthed: !!tokens,
    async login() {
      const url = await buildAuthorizeUrl(SPOTIFY_CLIENT_ID, getRedirectUri());
      window.location.assign(url);
    },
    logout() {
      doLogout();
    },
  };
}
