import type { TurntableState } from '../playback/deriveTurntableState';
import { useSkin } from '../skins/useSkin';
import { SpotifyLogo } from '../ui/SpotifyLogo';

interface Props {
  state: TurntableState;
}

export function SleeveCard({ state }: Props) {
  const skin = useSkin();
  if (state.kind === 'idle' || state.kind === 'ad') return null;

  const artwork = (
    <div
      className="w-full aspect-square flex items-center justify-center rounded-sm shadow-2xl"
      style={{ backgroundColor: skin.cabinet.fill }}
    >
      {state.artworkUrl ? (
        <img
          src={state.artworkUrl}
          alt={`${state.title} - ${state.subtitle}`}
          crossOrigin="anonymous"
          className="w-full h-full object-contain"
          draggable={false}
        />
      ) : (
        <div className="text-white/40 text-xs">No artwork</div>
      )}
    </div>
  );

  return (
    <div
      data-testid="sleeve-card"
      className="flex flex-col items-start gap-3 w-[min(260px,34vw)] shrink-0"
    >
      {state.externalUrl ? (
        <a
          href={state.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1ED760]"
          aria-label={`Listen to ${state.title} on Spotify`}
        >
          {artwork}
        </a>
      ) : (
        artwork
      )}
      <div
        data-testid="sleeve-metadata"
        className="w-full text-white min-w-0 h-[76px] overflow-hidden"
      >
        <div className="font-semibold leading-tight line-clamp-2">{state.title}</div>
        <div className="text-sm text-white/70 line-clamp-1">{state.subtitle}</div>
        {state.albumName && (
          <div className="text-xs text-white/50 italic line-clamp-1">{state.albumName}</div>
        )}
      </div>
      {state.externalUrl && (
        <a
          href={state.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Listen on Spotify"
          className="inline-flex items-center gap-2 text-xs text-white/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1ED760]"
        >
          <SpotifyLogo />
          <span>Listen on Spotify</span>
        </a>
      )}
    </div>
  );
}
