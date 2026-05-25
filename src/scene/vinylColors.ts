import type { Palette } from '../palette/extractPalette';

type DominantPalette = Pick<Palette, 'dominant'>;

export function getVinylLabelColor(palette: DominantPalette | null, fallbackColor: string): string {
  return palette?.dominant ?? fallbackColor;
}
