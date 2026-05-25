import type { TurntableState } from '../playback/deriveTurntableState';

interface Props {
  state: TurntableState;
  hidden: boolean;
}

export function TrackInfo({ state, hidden }: Props) {
  if (state.kind === 'idle') {
    return (
      <div
        className={`fixed bottom-6 left-6 text-white/60 text-sm transition-opacity ${
          hidden ? 'opacity-0' : 'opacity-100'
        }`}
      >
        Play something on Spotify
      </div>
    );
  }
  if (state.kind === 'ad') return null;
  return (
    <div
      className={`fixed bottom-6 left-6 text-white transition-opacity ${
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="font-semibold">{state.title}</div>
      <div className="text-sm text-white/70">{state.subtitle}</div>
    </div>
  );
}
