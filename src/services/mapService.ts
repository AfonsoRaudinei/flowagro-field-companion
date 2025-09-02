import { supabase } from '@/integrations/supabase/client';

export interface MapTilerTokenResponse {
  key: string | null;
  message?: string;
}

/**
 * Fetches MapTiler API key using Supabase client
 */
export const getMapTilerToken = async (retries = 3): Promise<string | null> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempting to fetch MapTiler token (attempt ${attempt}/${retries})`);
      
      // Use Supabase client instead of direct fetch
      const { data, error } = await supabase.functions.invoke('maptiler-token');
      
      if (error) {
        console.error(`Error fetching MapTiler token:`, error);
        if (attempt === retries) return null;
        continue;
      }
      console.log('MapTiler token response:', { hasKey: !!data?.key, message: data?.message });
      
      if (!data?.key) {
        console.warn('MapTiler token not configured:', data?.message);
        return null;
      }
      
      console.log('MapTiler token fetched successfully');
      return data.key;
    } catch (error) {
      console.error(`Failed to get MapTiler token (attempt ${attempt}/${retries}):`, error);
      if (attempt === retries) {
        return null;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return null;
};

/**
 * Fallback map providers for robust rendering
 */
export const MAP_PROVIDERS = {
  maptiler: {
    name: 'MapTiler',
    baseUrl: 'https://api.maptiler.com/maps',
    requiresToken: true
  },
  osm: {
    name: 'OpenStreetMap',
    baseUrl: 'https://tile.openstreetmap.org',
    requiresToken: false
  }
} as const;

/**
 * Map style configurations using MapTiler styles
 */
export const MAP_STYLES = {
  streets: 'basic-v2',
  satellite: 'satellite',
  terrain: 'outdoor-v2',
  hybrid: 'hybrid'
} as const;

export type MapStyle = keyof typeof MAP_STYLES;

/**
 * Generates MapTiler style URL with fallback
 */
export const getStyleUrl = (style: MapStyle, token?: string): string => {
  if (token) {
    return `https://api.maptiler.com/maps/${MAP_STYLES[style]}/style.json?key=${token}`;
  }
  
  // Fallback to basic OpenStreetMap style
  console.warn('No MapTiler token available, using OpenStreetMap fallback');
  return getOpenStreetMapStyle();
};

/**
 * OpenStreetMap fallback style
 */
export const getOpenStreetMapStyle = (): string => {
  return JSON.stringify({
    version: 8,
    name: "OpenStreetMap",
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors"
      }
    },
    layers: [
      {
        id: "osm-layer",
        type: "raster",
        source: "osm"
      }
    ]
  });
};

/**
 * Default map configuration
 */
export const DEFAULT_MAP_CONFIG = {
  center: [-15.7975, -47.8919] as [number, number], // Brasília center
  zoom: 4,
  pitch: 0,
  bearing: 0,
  style: 'streets' as MapStyle,
  container: 'map-container'
};