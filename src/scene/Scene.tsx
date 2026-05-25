import { deriveTurntableState } from '../playback/deriveTurntableState';
import { useSkin } from '../skins/useSkin';
import { usePlayback } from '../spotify/usePlayback';
import { useUiStore } from '../store/uiStore';
import { CleanModeSurface, CleanModeToggle } from '../ui/CleanModeToggle';
import { SpotifyAttribution } from '../ui/SpotifyAttribution';
import { TrackInfo } from '../ui/TrackInfo';
import { Cabinet } from './Cabinet';
import { SleeveCard } from './SleeveCard';
import { Turntable } from './Turntable';

export function Scene() {
  const skin = useSkin();
  const cleanMode = useUiStore(state => state.cleanMode);
  const { snapshot, error } = usePlayback();
  const state = deriveTurntableState(snapshot);

  const externalUrl = state.kind === 'track' || state.kind === 'episode' ? state.externalUrl : null;

  if (error && (error as Error).name === 'ForbiddenError') {
    return (
      <div className="h-full flex items-center justify-center bg-black text-white text-center px-6">
        <div className="max-w-md">
          <h2 className="text-xl font-semibold mb-2">Your Spotify account isn't authorized.</h2>
          <p className="text-white/70 text-sm">
            This app is in Spotify Development Mode. Ask the owner to add your Spotify email under
            User Management in the Developer Dashboard, then refresh.
          </p>
        </div>
      </div>
    );
  }

  return (
    <CleanModeSurface
      className="h-full w-full overflow-hidden"
      style={{ background: skin.wall.background }}
    >
      <CleanModeToggle />
      <div className="h-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-6 lg:px-12 py-10">
        <SleeveCard state={state} />
        <div className="relative scale-[0.72] sm:scale-[0.82] md:scale-90 lg:scale-100 origin-center">
          <Cabinet>
            <Turntable state={state} />
          </Cabinet>
        </div>
      </div>
      <TrackInfo state={state} hidden={cleanMode} />
      <SpotifyAttribution externalUrl={externalUrl} />
    </CleanModeSurface>
  );
}
