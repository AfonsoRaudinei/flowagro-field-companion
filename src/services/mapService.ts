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
    const response = await fetch('https://pyoejhhkjlrjijiviryq.supabase.co/functions/v1/maptiler-token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5b2VqaGhramxyamlqaXZpcnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTI1MDQsImV4cCI6MjA2OTcyODUwNH0.2P5wKq7b6viMa9kutLOZADsqAvSZx6X8fbLZMlooG1U`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5b2VqaGhramxyamlqaXZpcnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTI1MDQsImV4cCI6MjA2OTcyODUwNH0.2P5wKq7b6viMa9kutLOZADsqAvSZx6X8fbLZMlooG1U'
      }
    });
    
    if (!response.ok) {
      console.error('Error fetching MapTiler token - Status:', response.status);
      return null;
    }
    
    const data: MapTilerTokenResponse = await response.json();
    
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