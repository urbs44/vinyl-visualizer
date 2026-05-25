import { describe, expect, test, vi } from 'vitest';
import { extractPalette } from './extractPalette';

vi.mock('node-vibrant/browser', () => ({
  Vibrant: {
    from: () => ({
      getPalette: async () => ({
        Vibrant: { hex: '#ff0000' },
        DarkVibrant: { hex: '#880000' },
        Muted: { hex: '#aa6666' },
      }),
    }),
  },
}));

describe('extractPalette', () => {
  test('returns palette with dominant/dark/muted colors', async () => {
    const palette = await extractPalette('https://i.scdn.co/img.jpg');
    expect(palette).toEqual({ dominant: '#ff0000', dark: '#880000', muted: '#aa6666' });
  });

  test('returns null on null url', async () => {
    expect(await extractPalette(null)).toBeNull();
  });
});
