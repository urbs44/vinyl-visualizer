export interface Palette {
  dominant: string;
  dark: string;
  muted: string;
}

export async function extractPalette(url: string | null): Promise<Palette | null> {
  if (!url) return null;
  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    const size = 32;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, size, size);
    return paletteFromPixels(context.getImageData(0, 0, size, size).data);
  } catch {
    return null;
  }
}

export function paletteFromPixels(data: Uint8ClampedArray): Palette {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    if (alpha < 128) continue;
    r += data[index];
    g += data[index + 1];
    b += data[index + 2];
    count += 1;
  }

  if (count === 0) {
    return { dominant: '#777777', dark: '#333333', muted: '#999999' };
  }

  const average = {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };

  return {
    dominant: rgbToHex(average),
    dark: rgbToHex(scaleRgb(average, 0.6)),
    muted: rgbToHex(mixRgb(average, { r: 153, g: 153, b: 153 }, 0.5)),
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Artwork failed to load'));
    image.src = url;
  });
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function scaleRgb(color: Rgb, scale: number): Rgb {
  return {
    r: Math.round(color.r * scale),
    g: Math.round(color.g * scale),
    b: Math.round(color.b * scale),
  };
}

function mixRgb(color: Rgb, other: Rgb, amount: number): Rgb {
  return {
    r: Math.round(color.r * (1 - amount) + other.r * amount),
    g: Math.round(color.g * (1 - amount) + other.g * amount),
    b: Math.round(color.b * (1 - amount) + other.b * amount),
  };
}

function rgbToHex(color: Rgb): string {
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
}
