import { describe, expect, test } from 'vitest';
import { getVinylLabelColor } from './vinylColors';

describe('getVinylLabelColor', () => {
  test('uses the skin fallback color until artwork palette is available', () => {
    expect(getVinylLabelColor(null, '#f5e7bd')).toBe('#f5e7bd');
  });

  test('uses the artwork palette color when available', () => {
    expect(getVinylLabelColor({ dominant: '#9fc4d3' }, '#f5e7bd')).toBe('#9fc4d3');
  });
});
