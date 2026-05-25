import { Vibrant } from 'node-vibrant/browser';

export interface Palette {
  dominant: string;
  dark: string;
  muted: string;
}

export async function extractPalette(url: string | null): Promise<Palette | null> {
  if (!url) return null;
  try {
    const imageUrl = await loadImageAsBlobUrl(url);
    const palette = await Vibrant.from(imageUrl).getPalette();
    return {
      dominant: palette.Vibrant?.hex ?? '#888888',
      dark: palette.DarkVibrant?.hex ?? '#333333',
      muted: palette.Muted?.hex ?? '#cccccc',
    };
  } catch {
    return null;
  }
}

async function loadImageAsBlobUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error(`${response.status}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return url;
  }
}
