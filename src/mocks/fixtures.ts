import type { SpotifyNowPlayingResponse } from '../spotify/nowPlaying';

export const TRACK_FIXTURE: SpotifyNowPlayingResponse = {
  is_playing: true,
  progress_ms: 42_000,
  currently_playing_type: 'track',
  item: {
    uri: 'spotify:track:mock1',
    name: 'Mock Anthem',
    duration_ms: 215_000,
    external_urls: { spotify: 'https://open.spotify.com/track/mock1' },
    album: {
      name: 'Mock Album',
      images: [{ url: 'https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228' }],
    },
    artists: [{ name: 'Mock Artist' }],
  },
};

export const IDLE_FIXTURE: SpotifyNowPlayingResponse | null = null;

export const AD_FIXTURE: SpotifyNowPlayingResponse = {
  is_playing: true,
  progress_ms: 5_000,
  currently_playing_type: 'ad',
  item: null,
};
