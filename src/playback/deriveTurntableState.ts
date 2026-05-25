import type { PlaybackSnapshot } from './types';

export type TurntableState =
  | { kind: 'idle'; isPlaying: false; transitionKey: 'idle' }
  | { kind: 'ad'; isPlaying: true; transitionKey: 'ad' }
  | {
      kind: 'track' | 'episode';
      isPlaying: boolean;
      transitionKey: string;
      title: string;
      subtitle: string;
      albumName?: string;
      artworkUrl: string | null;
      externalUrl: string | null;
    };

export function deriveTurntableState(snapshot: PlaybackSnapshot): TurntableState {
  if (snapshot.kind === 'idle') {
    return { kind: 'idle', isPlaying: false, transitionKey: 'idle' };
  }
  if (snapshot.kind === 'ad') {
    return { kind: 'ad', isPlaying: true, transitionKey: 'ad' };
  }
  return {
    kind: snapshot.kind,
    isPlaying: snapshot.isPlaying,
    transitionKey: snapshot.identityKey,
    title: snapshot.title,
    subtitle: snapshot.subtitle,
    albumName: snapshot.albumName,
    artworkUrl: snapshot.artworkUrl,
    externalUrl: snapshot.externalUrl,
  };
}
