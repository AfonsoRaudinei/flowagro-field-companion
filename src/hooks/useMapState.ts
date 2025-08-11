
import { useState, useCallback, useRef, useEffect } from 'react';
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

  // Update state from map events
  const updateStateFromMap = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    setMapState(prev => ({
      ...prev,
      center: [map.getCenter().lng, map.getCenter().lat],
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
      bounds: map.getBounds()
    }));
  }, []);

  // Map event handlers
  const handleMapLoad = useCallback((map: maplibregl.Map) => {
    mapRef.current = map;
    
    // Set up event listeners
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
  }, [updateStateFromMap]);

  // Map actions
  const actions: MapActions = {
    flyTo: useCallback((options) => {
      if (!mapRef.current) return;
      mapRef.current.flyTo({
        ...options,
        essential: true,
        duration: 1000
      });
    }, []),

    fitBounds: useCallback((bounds, options = {}) => {
      if (!mapRef.current) return;
      mapRef.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 17,
        duration: 1000,
        ...options
      });
    }, []),

    zoomIn: useCallback(() => {
      if (!mapRef.current) return;
      mapRef.current.zoomIn({ duration: 300 });
    }, []),

    zoomOut: useCallback(() => {
      if (!mapRef.current) return;
      mapRef.current.zoomOut({ duration: 300 });
    }, []),

    resetBearing: useCallback(() => {
      if (!mapRef.current) return;
      mapRef.current.easeTo({ 
        bearing: 0, 
        duration: 500,
        easing: (t) => t * (2 - t) // Ease out
      });
    }, []),

    recenter: useCallback((location) => {
      if (!mapRef.current) return;
      mapRef.current.flyTo({
        center: location,
        zoom: 16,
        duration: 1000,
        essential: true
      });
    }, [])
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return {
    mapState,
    actions,
    onMapLoad: handleMapLoad,
    getMap: () => mapRef.current
  };
};
