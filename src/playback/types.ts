export type PlaybackSnapshot =
  | { kind: 'idle' }
  | { kind: 'ad' }
  | {
      kind: 'track' | 'episode';
      uri: string | null;
      identityKey: string;
      title: string;
      subtitle: string;
      albumName?: string;
      artworkUrl: string | null;
      externalUrl: string | null;
      isPlaying: boolean;
      progressMs: number;
      durationMs: number;
    };
