import type { TurntableState } from '../playback/deriveTurntableState';
import { useSkin } from '../skins/useSkin';
import { Tonearm } from './Tonearm';
import { TURNTABLE_LAYOUT } from './turntableLayout';
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
          width: TURNTABLE_LAYOUT.platterSize,
          height: TURNTABLE_LAYOUT.platterSize,
          background: skin.platter.matColor,
          opacity: 0.6,
          boxShadow: `0 0 0 ${TURNTABLE_LAYOUT.platterShadow}px ${skin.platter.color}`,
        }}
      />
      {state.kind !== 'idle' && <Vinyl state={state} size={TURNTABLE_LAYOUT.vinylSize} />}
      <Tonearm state={state} />
    </div>
  );
}
