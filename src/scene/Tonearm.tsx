import type { TurntableState } from '../playback/deriveTurntableState';
import { useSkin } from '../skins/useSkin';

interface Props {
  state: TurntableState;
}

export function Tonearm({ state }: Props) {
  const skin = useSkin();
  const angle = state.isPlaying ? 25 : 0;
  const reduced = prefersReducedMotion();

  return (
    <svg
      viewBox="0 0 200 200"
      width={200}
      height={200}
      style={{ overflow: 'visible' }}
      aria-hidden
    >
      <g
        style={{
          transformOrigin: '170px 30px',
          transform: `rotate(${angle}deg)`,
          transition: reduced ? 'none' : 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <circle cx={170} cy={30} r={10} fill={skin.tonearm.color} />
        <rect x={60} y={26} width={110} height={8} rx={3} fill={skin.tonearm.color} />
        <g
          style={{
            transformOrigin: '65px 30px',
            transform: `rotate(${-angle}deg)`,
            transition: reduced ? 'none' : 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <rect x={50} y={22} width={20} height={16} rx={2} fill={skin.tonearm.headshell} />
        </g>
      </g>
    </svg>
  );
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
