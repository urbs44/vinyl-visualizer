export const VINYL_SPIN_DURATION_MS = 1800;

export type VinylAnimationState = 'running' | 'paused';

interface VinylAnimationStateInput {
  isPlaying: boolean;
  reducedMotion: boolean;
}

export function getVinylAnimationState({
  isPlaying,
  reducedMotion,
}: VinylAnimationStateInput): VinylAnimationState {
  return isPlaying && !reducedMotion ? 'running' : 'paused';
}
