interface Point {
  x: number;
  y: number;
}

export const TONEARM_GEOMETRY = {
  viewBox: '0 0 560 460',
  pivot: { x: 504, y: 88 },
  parkedStylus: { x: 504, y: 330 },
  recordCenter: { x: 280, y: 230 },
  recordRadius: 180,
  playingRotationDeg: 22,
  parkedRotationDeg: 0,
} as const;

export interface TonearmPose {
  pivot: Point;
  stylus: Point;
  rotationDeg: number;
  armAngleDeg: number;
  armLength: number;
}

export function getTonearmPose(isPlaying: boolean): TonearmPose {
  const { pivot, parkedStylus, playingRotationDeg, parkedRotationDeg } = TONEARM_GEOMETRY;
  const rotationDeg = isPlaying ? playingRotationDeg : parkedRotationDeg;
  const stylus = rotatePoint(parkedStylus, pivot, rotationDeg);
  return {
    pivot,
    stylus,
    rotationDeg,
    armAngleDeg: getAngleDeg(pivot, stylus),
    armLength: getDistance(pivot, parkedStylus),
  };
}

function getAngleDeg(from: Point, to: Point): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

function getDistance(from: Point, to: Point): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function rotatePoint(point: Point, origin: Point, angleDeg: number): Point {
  const radians = (angleDeg * Math.PI) / 180;
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return {
    x: origin.x + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: origin.y + dx * Math.sin(radians) + dy * Math.cos(radians),
  };
}
