import { describe, expect, test } from 'vitest';
import { deriveTurntableState } from './deriveTurntableState';
import type { PlaybackSnapshot } from './types';

describe('deriveTurntableState', () => {
  test('idle snapshot -> idle state', () => {
    const state = deriveTurntableState({ kind: 'idle' });
    expect(state).toEqual({ kind: 'idle', isPlaying: false, transitionKey: 'idle' });
  });

  test('ad snapshot -> ad state', () => {
    const state = deriveTurntableState({ kind: 'ad' });
    expect(state).toEqual({ kind: 'ad', isPlaying: true, transitionKey: 'ad' });
  });

  test('track -> track state with identityKey as transitionKey', () => {
    const snapshot: PlaybackSnapshot = {
      kind: 'track',
      uri: 'spotify:track:abc',
      identityKey: 'spotify:track:abc',
      title: 'T',
      subtitle: 'A',
      artworkUrl: 'u',
      externalUrl: 'e',
      isPlaying: true,
      progressMs: 0,
      durationMs: 100,
    };
    const state = deriveTurntableState(snapshot);
    expect(state).toMatchObject({
      kind: 'track',
      isPlaying: true,
      transitionKey: 'spotify:track:abc',
      title: 'T',
      subtitle: 'A',
      artworkUrl: 'u',
      externalUrl: 'e',
    });
  });
});
