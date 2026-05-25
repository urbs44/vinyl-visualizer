import { describe, expect, test } from 'vitest';
import { getVerticalCirclePadding, TURNTABLE_LAYOUT } from './turntableLayout';

describe('turntable layout', () => {
  test('leaves visible vertical padding around the platter circles', () => {
    expect(getVerticalCirclePadding()).toBeGreaterThanOrEqual(24);
  });

  test('keeps the vinyl inside the smaller platter envelope', () => {
    expect(TURNTABLE_LAYOUT.vinylSize).toBeLessThan(TURNTABLE_LAYOUT.platterSize);
  });
});
