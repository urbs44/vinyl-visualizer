import { describe, expect, test } from 'vitest';
import { extractPalette, paletteFromPixels } from './extractPalette';

describe('extractPalette', () => {
  test('paletteFromPixels returns dominant/dark/muted colors', () => {
    const data = new Uint8ClampedArray([
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,
    ]);
    expect(paletteFromPixels(data)).toEqual({
      dominant: '#ff0000',
      dark: '#990000',
      muted: '#cc4d4d',
    });
  });

  test('returns null on null url', async () => {
    expect(await extractPalette(null)).toBeNull();
  });
});
