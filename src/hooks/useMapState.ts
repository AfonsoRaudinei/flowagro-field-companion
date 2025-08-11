
import { useState, useCallback, useRef } from 'react';
import { maplibregl } from '@/components/map/MapCore';

export interface MapState {
  isLoaded: boolean;
  isMoving: boolean;
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  bounds: maplibregl.LngLatBounds | null;
}

export interface MapActions {
  flyTo: (options: { center?: [number, number]; zoom?: number; bearing?: number; pitch?: number }) => void;
  fitBounds: (bounds: maplibregl.LngLatBounds, options?: maplibregl.FitBoundsOptions) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetBearing: () => void;
  recenter: (location: [number, number]) => void;
}

const DEFAULT_CENTER: [number, number] = [-47.8919, -15.7975]; // Brasília

export const useMapState = () => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  const [mapState, setMapState] = useState<MapState>({
    isLoaded: false,
    isMoving: false,
    center: DEFAULT_CENTER,
    zoom: 10,
    bearing: 0,
    pitch: 0,
    bounds: null
  });

  // Simplified update function
  const updateStateFromMap = useCallback(() => {
    if (!mapRef.current) return;

    try {
      const map = mapRef.current;
      const center = map.getCenter();
      
      setMapState(prev => ({
        ...prev,
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        bounds: map.getBounds()
      }));
    } catch (error) {
      console.warn('Error updating map state:', error);
    }
  }, []);

  // Simplified map load handler
  const handleMapLoad = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
    
    // Set up event listeners with error handling
    try {
      map.on('load', () => {
        setMapState(prev => ({ ...prev, isLoaded: true }));
        updateStateFromMap();
      });

      map.on('move', () => {
        setMapState(prev => ({ ...prev, isMoving: true }));
        updateStateFromMap();
      });

      map.on('moveend', () => {
        setMapState(prev => ({ ...prev, isMoving: false }));
        updateStateFromMap();
      });

      map.on('rotate', updateStateFromMap);
      map.on('pitch', updateStateFromMap);
      map.on('zoom', updateStateFromMap);
    } catch (error) {
      console.error('Error setting up map listeners:', error);
    }
  }, [updateStateFromMap]);

  // Simplified map actions with error handling
  const actions: MapActions = {
    flyTo: useCallback((options) => {
      if (!mapRef.current) return;
      try {
        mapRef.current.flyTo({
          ...options,
          essential: true,
          duration: 1000
        });
      } catch (error) {
        console.error('Error in flyTo:', error);
      }
    }, []),

    fitBounds: useCallback((bounds, options = {}) => {
      if (!mapRef.current) return;
      try {
        mapRef.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 17,
          duration: 1000,
          ...options
        });
      } catch (error) {
        console.error('Error in fitBounds:', error);
      }
    }, []),

    zoomIn: useCallback(() => {
      if (!mapRef.current) return;
      try {
        mapRef.current.zoomIn({ duration: 300 });
      } catch (error) {
        console.error('Error in zoomIn:', error);
      }
    }, []),

    zoomOut: useCallback(() => {
      if (!mapRef.current) return;
      try {
        mapRef.current.zoomOut({ duration: 300 });
      } catch (error) {
        console.error('Error in zoomOut:', error);
      }
    }, []),

    resetBearing: useCallback(() => {
      if (!mapRef.current) return;
      try {
        mapRef.current.easeTo({ 
          bearing: 0, 
          duration: 500,
          easing: (t) => t * (2 - t)
        });
      } catch (error) {
        console.error('Error in resetBearing:', error);
      }
    }, []),

    recenter: useCallback((location) => {
      if (!mapRef.current) return;
      try {
        mapRef.current.flyTo({
          center: location,
          zoom: 16,
          duration: 1000,
          essential: true
        });
      } catch (error) {
        console.error('Error in recenter:', error);
      }
    }, [])
  };

  return {
    mapState,
    actions,
    onMapLoad: handleMapLoad,
    getMap: () => mapRef.current
  };
};
