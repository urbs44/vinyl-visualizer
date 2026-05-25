import { describe, expect, test } from 'vitest';
import { normalize } from './normalize';

describe('normalize', () => {
  test('null response -> idle', () => {
    expect(normalize(null)).toEqual({ kind: 'idle' });
  });

  test('response with no item -> idle', () => {
    expect(
      normalize({ is_playing: false, progress_ms: 0, currently_playing_type: 'unknown', item: null })
    ).toEqual({ kind: 'idle' });
  });

  test('ad -> ad', () => {
    expect(
      normalize({ is_playing: true, progress_ms: 0, currently_playing_type: 'ad', item: null })
    ).toEqual({ kind: 'ad' });
  });

  test('track maps fields and uses uri as identityKey', () => {
    const result = normalize({
      is_playing: true,
      progress_ms: 1000,
      currently_playing_type: 'track',
      item: {
        uri: 'spotify:track:abc',
        name: 'Song',
        duration_ms: 240000,
        external_urls: { spotify: 'https://open.spotify.com/track/abc' },
        album: { name: 'Album', images: [{ url: 'https://i.scdn.co/img.jpg' }] },
        artists: [{ name: 'A' }, { name: 'B' }],
      },
    });
    expect(result).toMatchObject({
      kind: 'track',
      uri: 'spotify:track:abc',
      identityKey: 'spotify:track:abc',
      title: 'Song',
      subtitle: 'A, B',
      albumName: 'Album',
      artworkUrl: 'https://i.scdn.co/img.jpg',
      externalUrl: 'https://open.spotify.com/track/abc',
      isPlaying: true,
      progressMs: 1000,
      durationMs: 240000,
    });
  });

  test('track with null uri uses composite identityKey', () => {
    const result = normalize({
      is_playing: true,
      progress_ms: 0,
      currently_playing_type: 'track',
      item: {
        uri: null,
        name: 'Local Song',
        duration_ms: 100,
        external_urls: {},
        album: { name: 'Local Album', images: [] },
        artists: [{ name: 'Me' }],
      },
    });
    expect(result).toMatchObject({
      kind: 'track',
      uri: null,
      identityKey: 'local:Local Song|Me|Local Album',
      artworkUrl: null,
      externalUrl: null,
    });
  });

  test('episode maps show as subtitle', () => {
    const result = normalize({
      is_playing: true,
      progress_ms: 0,
      currently_playing_type: 'episode',
      item: {
        uri: 'spotify:episode:e',
        name: 'Ep',
        duration_ms: 1000,
        external_urls: { spotify: 'https://open.spotify.com/episode/e' },
        images: [{ url: 'https://i.scdn.co/ep.jpg' }],
        show: { name: 'The Show' },
      },
    });
    expect(result).toMatchObject({
      kind: 'episode',
      title: 'Ep',
      subtitle: 'The Show',
      artworkUrl: 'https://i.scdn.co/ep.jpg',
      albumName: undefined,
    });
  });

  test('unknown type -> idle', () => {
    expect(
      normalize({
        is_playing: false,
        progress_ms: 0,
        currently_playing_type: 'unknown',
        item: { foo: 1 },
      } as never)
    ).toEqual({ kind: 'idle' });
  });
});
