interface Point {
  x: number;
  y: number;
}

export const TONEARM_GEOMETRY = {
  viewBox: '0 0 560 460',
  pivot: { x: 502, y: 72 },
  stylus: { x: 382, y: 152 },
  restRotationDeg: 28,
} as const;

export interface TonearmPose {
  pivot: Point;
  stylus: Point;
  rotationDeg: number;
  armAngleDeg: number;
}

export function getTonearmPose(isPlaying: boolean): TonearmPose {
  const { pivot, stylus, restRotationDeg } = TONEARM_GEOMETRY;
  return {
    pivot,
    stylus,
    rotationDeg: isPlaying ? 0 : restRotationDeg,
    armAngleDeg: getAngleDeg(pivot, stylus),
  };
}

function getAngleDeg(from: Point, to: Point): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}
