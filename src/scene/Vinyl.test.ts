import { describe, expect, test } from 'vitest';
import { getVinylAnimationState } from './vinylMotion';
import { getVinylLabelColor } from './vinylColors';

describe('getVinylLabelColor', () => {
  test('uses the skin fallback color until artwork palette is available', () => {
    expect(getVinylLabelColor(null, '#f5e7bd')).toBe('#f5e7bd');
  });

  test('uses the artwork palette color when available', () => {
    expect(getVinylLabelColor({ dominant: '#9fc4d3' }, '#f5e7bd')).toBe('#9fc4d3');
  });
});

describe('getVinylAnimationState', () => {
  test('runs while playback is active', () => {
    expect(getVinylAnimationState({ isPlaying: true, reducedMotion: false })).toBe('running');
  });

  test('pauses when playback stops or reduced motion is requested', () => {
    expect(getVinylAnimationState({ isPlaying: false, reducedMotion: false })).toBe('paused');
    expect(getVinylAnimationState({ isPlaying: true, reducedMotion: true })).toBe('paused');
  });
});
