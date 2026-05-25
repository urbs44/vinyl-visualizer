import type { TurntableState } from '../playback/deriveTurntableState';
import { useSkin } from '../skins/useSkin';

interface Props {
  state: TurntableState;
}

export function SleeveCard({ state }: Props) {
  const skin = useSkin();
  if (state.kind === 'idle' || state.kind === 'ad') return null;

  return (
    <div className="flex flex-col items-start gap-3 max-w-[300px] shrink-0">
      <a
        href={state.externalUrl ?? undefined}
        target={state.externalUrl ? '_blank' : undefined}
        rel={state.externalUrl ? 'noopener noreferrer' : undefined}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
        aria-label={state.externalUrl ? `Listen to ${state.title} on Spotify` : undefined}
      >
        <div
          className="w-[min(260px,34vw)] aspect-square flex items-center justify-center rounded-sm shadow-2xl"
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
      </a>
      <div className="text-white min-w-0">
        <div className="font-semibold leading-tight line-clamp-2">{state.title}</div>
        <div className="text-sm text-white/70 line-clamp-1">{state.subtitle}</div>
        {state.albumName && <div className="text-xs text-white/50 italic line-clamp-1">{state.albumName}</div>}
      </div>
      {state.externalUrl && (
        <a
          href={state.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#1DB954] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
        >
          Listen on Spotify
        </a>
      )}
    </div>
  );
}
