import type { Skin } from './types';

export const VINTAGE_OAK: Skin = {
  id: 'vintage-oak',
  name: 'Vintage Oak',
  wall: {
    background: 'radial-gradient(ellipse at center, #2a1f17 0%, #1a120c 60%, #0c0805 100%)',
  },
  cabinet: { fill: '#6b4423', accent: '#c9a875' },
  platter: { color: '#1a1a1a', matColor: '#e8d9b8' },
  tonearm: { color: '#b8860b', headshell: '#222222' },
  label: { ringColor: '#f4e4bc' },
};

export const SKINS: Record<string, Skin> = {
  'vintage-oak': VINTAGE_OAK,
};

export const DEFAULT_SKIN_ID = 'vintage-oak';
