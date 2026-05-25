import { spotifyFetch } from './client';

export interface SpotifyNowPlayingResponse {
  is_playing: boolean;
  progress_ms: number | null;
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
  item: unknown | null;
}

export async function fetchNowPlaying(): Promise<SpotifyNowPlayingResponse | null> {
  return spotifyFetch<SpotifyNowPlayingResponse>(
    '/me/player/currently-playing?additional_types=track,episode'
  );
}
