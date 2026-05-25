import type { PlaybackSnapshot } from '../playback/types';
import type { SpotifyNowPlayingResponse } from './nowPlaying';

interface TrackItem {
  uri?: string | null;
  name?: string;
  duration_ms?: number;
  external_urls?: { spotify?: string };
  album?: { name?: string; images?: { url: string }[] };
  artists?: { name: string }[];
}

interface EpisodeItem {
  uri?: string | null;
  name?: string;
  duration_ms?: number;
  external_urls?: { spotify?: string };
  images?: { url: string }[];
  show?: { name?: string };
}

export function normalize(response: SpotifyNowPlayingResponse | null): PlaybackSnapshot {
  if (!response) return { kind: 'idle' };
  if (response.currently_playing_type === 'ad') return { kind: 'ad' };
  if (!response.item) return { kind: 'idle' };

  if (response.currently_playing_type === 'track') {
    const item = response.item as TrackItem;
    const artists = (item.artists ?? []).map(artist => artist.name).join(', ');
    const albumName = item.album?.name;
    const artworkUrl = item.album?.images?.[0]?.url ?? null;
    const uri = item.uri ?? null;
    const title = item.name ?? '';
    const identityKey = uri ?? `local:${title}|${artists}|${albumName ?? ''}`;
    return {
      kind: 'track',
      uri,
      identityKey,
      title,
      subtitle: artists,
      albumName,
      artworkUrl,
      externalUrl: item.external_urls?.spotify ?? null,
      isPlaying: response.is_playing,
      progressMs: response.progress_ms ?? 0,
      durationMs: item.duration_ms ?? 0,
    };
  }

  if (response.currently_playing_type === 'episode') {
    const item = response.item as EpisodeItem;
    const artworkUrl = item.images?.[0]?.url ?? null;
    const uri = item.uri ?? null;
    const showName = item.show?.name ?? '';
    const title = item.name ?? '';
    const identityKey = uri ?? `local:${title}|${showName}|`;
    return {
      kind: 'episode',
      uri,
      identityKey,
      title,
      subtitle: showName,
      albumName: undefined,
      artworkUrl,
      externalUrl: item.external_urls?.spotify ?? null,
      isPlaying: response.is_playing,
      progressMs: response.progress_ms ?? 0,
      durationMs: item.duration_ms ?? 0,
    };
  }

  return { kind: 'idle' };
}
