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
        <path
          d={`M ${pose.pivot.x - 3} ${pose.pivot.y + 14} C ${pose.pivot.x - 6} ${
            pose.pivot.y + 100
          }, ${pose.pivot.x + 4} ${pose.pivot.y + 170}, ${TONEARM_GEOMETRY.parkedStylus.x} ${
            TONEARM_GEOMETRY.parkedStylus.y - 18
          }`}
          fill="none"
          stroke={skin.tonearm.color}
          strokeWidth={8}
          strokeLinecap="round"
        />
        <g
          data-testid="tonearm-headshell"
          transform={`translate(${TONEARM_GEOMETRY.parkedStylus.x} ${TONEARM_GEOMETRY.parkedStylus.y}) rotate(90)`}
        >
          <rect x="-28" y="-11" width="42" height="22" rx="3" fill={skin.tonearm.headshell} />
          <line x1="-8" y1="11" x2="-8" y2="24" stroke="#f4f4f4" strokeWidth="2" />
        </g>
        <circle
          data-testid="tonearm-stylus"
          cx={TONEARM_GEOMETRY.parkedStylus.x}
          cy={TONEARM_GEOMETRY.parkedStylus.y}
          r={3}
          fill="#f4f4f4"
        />
        <circle cx={pose.pivot.x} cy={pose.pivot.y} r={16} fill={skin.tonearm.color} />
        <circle cx={pose.pivot.x} cy={pose.pivot.y} r={7} fill="#d9b35c" opacity={0.85} />
      </g>
      <g data-testid="tonearm-rest">
        <rect
          x={TONEARM_GEOMETRY.parkedStylus.x - 13}
          y={TONEARM_GEOMETRY.parkedStylus.y + 12}
          width={26}
          height={8}
          rx={4}
          fill="#201a16"
        />
        <circle
          cx={TONEARM_GEOMETRY.parkedStylus.x}
          cy={TONEARM_GEOMETRY.parkedStylus.y + 16}
          r={4}
          fill={skin.tonearm.color}
        />
      </g>
    </svg>
  );
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
