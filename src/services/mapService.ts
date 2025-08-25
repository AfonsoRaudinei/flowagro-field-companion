import { supabase } from '@/integrations/supabase/client';

export interface MapTilerTokenResponse {
  key: string | null;
  message?: string;
}

/**
 * Fetches MapTiler API key from the edge function
 */
export const getMapTilerToken = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke<MapTilerTokenResponse>('maptiler-token');
    
    if (error) {
      console.error('Error fetching MapTiler token:', error);
      return null;
    }
    
    if (!data?.key) {
      console.warn('MapTiler token not configured:', data?.message);
      return null;
    }
    
    return data.key;
  } catch (error) {
    console.error('Failed to get MapTiler token:', error);
    return null;
  }
};

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
 * Generates MapTiler style URL
 */
export const getStyleUrl = (style: MapStyle, token: string): string => {
  return `https://api.maptiler.com/maps/${MAP_STYLES[style]}/style.json?key=${token}`;
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