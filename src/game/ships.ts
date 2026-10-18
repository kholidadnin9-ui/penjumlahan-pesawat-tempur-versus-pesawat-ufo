export type ShipColor = 'merah' | 'kuning' | 'pink' | 'ungu' | 'hijau' | 'putih';

export type Palette = { main: string; light: string; dark: string; tip: string; flame1: string; flame2: string; label: string };

export const PALETTES: Record<ShipColor, Palette> = {
  merah: { main: '#e11d2a', light: '#ff6b6b', dark: '#7a0a10', tip: '#dc2626', flame1: '#fde047', flame2: '#f97316', label: 'Merah' },
  kuning: { main: '#f5b800', light: '#ffe066', dark: '#8a6400', tip: '#eab308', flame1: '#fef08a', flame2: '#f97316', label: 'Kuning' },
  pink: { main: '#ec4899', light: '#f9a8d4', dark: '#9d174d', tip: '#db2777', flame1: '#fbcfe8', flame2: '#f472b6', label: 'Pink' },
  ungu: { main: '#9333ea', light: '#d8b4fe', dark: '#4c1d95', tip: '#9333ea', flame1: '#f5d0fe', flame2: '#c026d3', label: 'Ungu' },
  hijau: { main: '#22c55e', light: '#86efac', dark: '#14532d', tip: '#16a34a', flame1: '#ecfccb', flame2: '#84cc16', label: 'Hijau' },
  putih: { main: '#eef2f7', light: '#ffffff', dark: '#64748b', tip: '#eab308', flame1: '#fef9c3', flame2: '#fb923c', label: 'Putih' },
};

export const SHIP_ORDER: ShipColor[] = ['merah', 'kuning', 'putih', 'pink', 'ungu', 'hijau'];

/** SVG geometry: viewBox 0 0 340 170, nose tip at (4, 100) */
export const SHIP_VB_W = 340;
export const SHIP_VB_H = 170;
export const NOSE_X = 4;
export const NOSE_Y = 100;
