import { describe, expect, test } from 'vitest';
import { getTonearmPose, TONEARM_GEOMETRY } from './tonearmGeometry';

describe('getTonearmPose', () => {
  test('playing pose places the stylus over the record from the right-side pivot', () => {
    const pose = getTonearmPose(true);

    expect(pose.rotationDeg).toBe(0);
    expect(pose.pivot.x).toBeGreaterThan(pose.stylus.x);
    expect(pose.stylus.y).toBeGreaterThan(pose.pivot.y);
    expect(pose.stylus.x).toBeGreaterThan(340);
    expect(pose.stylus.x).toBeLessThan(410);
    expect(pose.stylus.y).toBeGreaterThan(130);
    expect(pose.stylus.y).toBeLessThan(190);
  });

  test('resting pose rotates away from the playing groove', () => {
    expect(getTonearmPose(false).rotationDeg).toBeGreaterThan(0);
  });

  test('uses the cabinet coordinate system', () => {
    expect(TONEARM_GEOMETRY.viewBox).toBe('0 0 560 460');
  });
});
