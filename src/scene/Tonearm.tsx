import type { TurntableState } from '../playback/deriveTurntableState';
import { useSkin } from '../skins/useSkin';
import { getTonearmPose, TONEARM_GEOMETRY } from './tonearmGeometry';

interface Props {
  state: TurntableState;
}

export function Tonearm({ state }: Props) {
  const skin = useSkin();
  const pose = getTonearmPose(state.isPlaying);
  const reduced = prefersReducedMotion();
  const transition = reduced ? 'none' : 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';

  return (
    <svg
      data-testid="tonearm-svg"
      className="absolute inset-0 pointer-events-none"
      viewBox={TONEARM_GEOMETRY.viewBox}
      aria-hidden
    >
      <g
        data-testid="tonearm-arm"
        style={{
          transformOrigin: `${pose.pivot.x}px ${pose.pivot.y}px`,
          transform: `rotate(${pose.rotationDeg}deg)`,
          transition,
        }}
      >
        <line
          x1={pose.pivot.x - 10}
          y1={pose.pivot.y + 4}
          x2={pose.stylus.x + 16}
          y2={pose.stylus.y - 10}
          stroke={skin.tonearm.color}
          strokeWidth={9}
          strokeLinecap="round"
        />
        <g
          data-testid="tonearm-headshell"
          transform={`translate(${pose.stylus.x} ${pose.stylus.y}) rotate(${pose.armAngleDeg})`}
        >
          <rect x="-24" y="-10" width="36" height="20" rx="3" fill={skin.tonearm.headshell} />
          <line x1="-4" y1="10" x2="-4" y2="22" stroke="#f4f4f4" strokeWidth="2" />
        </g>
        <circle
          data-testid="tonearm-stylus"
          cx={pose.stylus.x}
          cy={pose.stylus.y}
          r={3}
          fill="#f4f4f4"
        />
        <circle cx={pose.pivot.x} cy={pose.pivot.y} r={16} fill={skin.tonearm.color} />
        <circle cx={pose.pivot.x} cy={pose.pivot.y} r={7} fill="#d9b35c" opacity={0.85} />
      </g>
    </svg>
  );
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
