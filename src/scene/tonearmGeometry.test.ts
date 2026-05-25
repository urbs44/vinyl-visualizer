import { describe, expect, test } from 'vitest';
import { getTonearmPose, TONEARM_GEOMETRY } from './tonearmGeometry';

describe('getTonearmPose', () => {
  test('playing pose places a longer tonearm on the lower-right groove', () => {
    const pose = getTonearmPose(true);
    const dx = pose.stylus.x - TONEARM_GEOMETRY.recordCenter.x;
    const dy = pose.stylus.y - TONEARM_GEOMETRY.recordCenter.y;
    const distanceFromCenter = Math.hypot(dx, dy);

    expect(pose.rotationDeg).toBeGreaterThan(0);
    expect(pose.pivot.x).toBeGreaterThan(pose.stylus.x);
    expect(pose.stylus.y).toBeGreaterThan(pose.pivot.y);
    expect(pose.armLength).toBeGreaterThan(230);
    expect(pose.stylus.x).toBeGreaterThan(TONEARM_GEOMETRY.recordCenter.x);
    expect(pose.stylus.y).toBeGreaterThan(TONEARM_GEOMETRY.recordCenter.y);
    expect(distanceFromCenter).toBeGreaterThan(145);
    expect(distanceFromCenter).toBeLessThan(TONEARM_GEOMETRY.recordRadius);
  });

  test('resting pose parks straight down on the wood outside the record', () => {
    const pose = getTonearmPose(false);

    expect(pose.rotationDeg).toBe(0);
    expect(pose.stylus.x).toBe(pose.pivot.x);
    expect(pose.stylus.y).toBeGreaterThan(pose.pivot.y + 220);
    expect(pose.stylus.x).toBeGreaterThan(
      TONEARM_GEOMETRY.recordCenter.x + TONEARM_GEOMETRY.recordRadius + 35
    );
  });

  test('uses the cabinet coordinate system', () => {
    expect(TONEARM_GEOMETRY.viewBox).toBe('0 0 560 460');
  });
});
