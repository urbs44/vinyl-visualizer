import type { TurntableState } from '../playback/deriveTurntableState';
import { useSkin } from '../skins/useSkin';
import { Tonearm } from './Tonearm';
import { Vinyl } from './Vinyl';

interface Props {
  state: TurntableState;
}

export function Turntable({ state }: Props) {
  const skin = useSkin();
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="absolute rounded-full"
        style={{
          width: 440,
          height: 440,
          background: skin.platter.matColor,
          opacity: 0.6,
          boxShadow: `0 0 0 18px ${skin.platter.color}`,
        }}
      />
      {state.kind !== 'idle' && <Vinyl state={state} size={420} />}
      <div className="absolute top-0 right-0 -translate-y-3 translate-x-3">
        <Tonearm state={state} />
      </div>
    </div>
  );
}
