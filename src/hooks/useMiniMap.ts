import { useState, useCallback, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { logger } from '@/lib/logger';

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MiniMapState {
  miniMap: mapboxgl.Map | null;
  isLoaded: boolean;
  viewportBounds: ViewportBounds | null;
}

export const useMiniMap = (width: number, height: number) => {
  const [state, setState] = useState<MiniMapState>({
    miniMap: null,
    isLoaded: false,
    viewportBounds: null
  });

  const parentMapRef = useRef<mapboxgl.Map | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate viewport bounds for the mini-map overlay
  const calculateViewportBounds = useCallback((
    parentMap: mapboxgl.Map,
    miniMap: mapboxgl.Map
  ): ViewportBounds | null => {
    if (!parentMap || !miniMap) return null;

    try {
      const parentBounds = parentMap.getBounds();
      const miniMapBounds = miniMap.getBounds();

      // Convert parent viewport bounds to mini-map pixel coordinates
      const topLeft = miniMap.project(parentBounds.getNorthWest());
      const bottomRight = miniMap.project(parentBounds.getSouthEast());

      // Clamp to mini-map container bounds
      const x = Math.max(0, Math.min(topLeft.x, width));
      const y = Math.max(0, Math.min(topLeft.y, height));
      const maxX = Math.max(0, Math.min(bottomRight.x, width));
      const maxY = Math.max(0, Math.min(bottomRight.y, height));

      return {
        x,
        y,
        width: Math.max(0, maxX - x),
        height: Math.max(0, maxY - y)
      };
    } catch (error) {
      logger.warn('Error calculating viewport bounds', { error });
      return null;
    }
  }, [width, height]);

  // Sync mini-map with parent map
  const syncMiniMap = useCallback(() => {
    if (!parentMapRef.current || !state.miniMap) return;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce updates for performance
    syncTimeoutRef.current = setTimeout(() => {
      if (!parentMapRef.current || !state.miniMap) return;

      const parentCenter = parentMapRef.current.getCenter();
      const parentZoom = parentMapRef.current.getZoom();

      // Calculate appropriate zoom level for mini-map (wider view)
      const miniZoom = Math.max(0, parentZoom - 3);

      // Update mini-map position
      state.miniMap.jumpTo({
        center: parentCenter,
        zoom: miniZoom
      });

      // Update viewport bounds
      const bounds = calculateViewportBounds(parentMapRef.current, state.miniMap);
      setState(prev => ({
        ...prev,
        viewportBounds: bounds
      }));
    }, 100);
  }, [state.miniMap, calculateViewportBounds]);

  // Initialize mini-map
  const initializeMiniMap = useCallback(async (
    container: HTMLElement,
    parentMap: mapboxgl.Map
  ) => {
    try {
      parentMapRef.current = parentMap;

      // Create mini-map instance
      const miniMap = new mapboxgl.Map({
        container,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: parentMap.getCenter(),
        zoom: Math.max(0, parentMap.getZoom() - 3),
        interactive: true,
        attributionControl: false
      });

      // Disable some interactions for better UX
      miniMap.scrollZoom.disable();
      miniMap.doubleClickZoom.disable();
      miniMap.touchZoomRotate.disable();

      // Set up event listeners
      miniMap.on('load', () => {
        setState(prev => ({
          ...prev,
          miniMap,
          isLoaded: true
        }));

        // Initial sync
        syncMiniMap();
      });

      // Sync when parent map changes
      parentMap.on('move', syncMiniMap);
      parentMap.on('zoom', syncMiniMap);
      parentMap.on('rotate', syncMiniMap);

      setState(prev => ({
        ...prev,
        miniMap
      }));

    } catch (error) {
      logger.error('Error initializing mini-map', { error });
    }
  }, [syncMiniMap]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    if (parentMapRef.current) {
      parentMapRef.current.off('move', syncMiniMap);
      parentMapRef.current.off('zoom', syncMiniMap);
      parentMapRef.current.off('rotate', syncMiniMap);
    }

    if (state.miniMap) {
      state.miniMap.remove();
      setState(prev => ({
        ...prev,
        miniMap: null,
        isLoaded: false,
        viewportBounds: null
      }));
    }

    parentMapRef.current = null;
  }, [state.miniMap, syncMiniMap]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ...state,
    initializeMiniMap,
    cleanup
  };
};