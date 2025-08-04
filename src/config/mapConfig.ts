/**
 * MapTiler Configuration for FlowAgro
 * 
 * IMPORTANT: The current API key is invalid (403 error).
 * User needs a valid MapTiler API key from https://cloud.maptiler.com/
 */

// Placeholder key - user needs to replace with valid MapTiler key
export const MAPTILER_API_KEY = 'GET_YOUR_KEY_FROM_MAPTILER';

// Map layer configurations
export const MAP_LAYERS = [
  {
    id: 'satellite',
    name: 'Satélite',
    url: `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_API_KEY}`
  },
  {
    id: 'hybrid',
    name: 'Híbrido',
    url: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_API_KEY}`
  },
  {
    id: 'terrain',
    name: 'Terreno',
    url: `https://api.maptiler.com/maps/landscape/style.json?key=${MAPTILER_API_KEY}`
  }
];

// Default map settings
export const DEFAULT_MAP_CONFIG = {
  center: [-52.0, -10.0] as [number, number], // Brazil center
  zoom: 16,
  pitch: 0,
  bearing: 0
};

// Fallback style for when MapTiler is unavailable
export const FALLBACK_STYLE = {
  version: 8 as const,
  sources: {
    'osm': {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [{
    id: 'osm',
    type: 'raster' as const,
    source: 'osm'
  }]
};