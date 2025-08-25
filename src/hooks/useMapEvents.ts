import { useEffect, useCallback } from 'react';
import { useMapInstance } from './useMapInstance';
import type { MapMouseEvent, MapTouchEvent } from 'mapbox-gl';

interface MapEventHandlers {
  onClick?: (e: MapMouseEvent) => void;
  onDoubleClick?: (e: MapMouseEvent) => void;
  onMouseMove?: (e: MapMouseEvent) => void;
  onMouseEnter?: (e: MapMouseEvent) => void;
  onMouseLeave?: (e: MapMouseEvent) => void;
  onTouchStart?: (e: MapTouchEvent) => void;
  onTouchEnd?: (e: MapTouchEvent) => void;
  onMoveStart?: () => void;
  onMove?: () => void;
  onMoveEnd?: () => void;
  onZoomStart?: () => void;
  onZoom?: () => void;
  onZoomEnd?: () => void;
  onRotateStart?: () => void;
  onRotate?: () => void;
  onRotateEnd?: () => void;
  onPitchStart?: () => void;
  onPitch?: () => void;
  onPitchEnd?: () => void;
}

/**
 * Hook to register map event handlers
 */
export const useMapEvents = (handlers: MapEventHandlers) => {
  const { map, isReady } = useMapInstance();

  useEffect(() => {
    if (!map || !isReady) return;

    const eventMap = {
      click: handlers.onClick,
      dblclick: handlers.onDoubleClick,
      mousemove: handlers.onMouseMove,
      mouseenter: handlers.onMouseEnter,
      mouseleave: handlers.onMouseLeave,
      touchstart: handlers.onTouchStart,
      touchend: handlers.onTouchEnd,
      movestart: handlers.onMoveStart,
      move: handlers.onMove,
      moveend: handlers.onMoveEnd,
      zoomstart: handlers.onZoomStart,
      zoom: handlers.onZoom,
      zoomend: handlers.onZoomEnd,
      rotatestart: handlers.onRotateStart,
      rotate: handlers.onRotate,
      rotateend: handlers.onRotateEnd,
      pitchstart: handlers.onPitchStart,
      pitch: handlers.onPitch,
      pitchend: handlers.onPitchEnd
    };

    // Register event listeners
    Object.entries(eventMap).forEach(([event, handler]) => {
      if (handler) {
        map.on(event as any, handler);
      }
    });

    // Cleanup
    return () => {
      Object.entries(eventMap).forEach(([event, handler]) => {
        if (handler) {
          map.off(event as any, handler);
        }
      });
    };
  }, [map, isReady, handlers]);
};

/**
 * Hook for common map interactions
 */
export const useMapInteractions = () => {
  const { map } = useMapInstance();

  const addClickListener = useCallback((callback: (coordinates: [number, number]) => void) => {
    const handler = (e: MapMouseEvent) => {
      callback([e.lngLat.lng, e.lngLat.lat]);
    };

    useMapEvents({ onClick: handler });
  }, []);

  const enableDrawing = useCallback(() => {
    if (!map) return;

    // Enable drawing cursor
    map.getCanvas().style.cursor = 'crosshair';
  }, [map]);

  const disableDrawing = useCallback(() => {
    if (!map) return;

    // Reset cursor
    map.getCanvas().style.cursor = '';
  }, [map]);

  const setMapCursor = useCallback((cursor: string) => {
    if (map) {
      map.getCanvas().style.cursor = cursor;
    }
  }, [map]);

  return {
    addClickListener,
    enableDrawing,
    disableDrawing,
    setMapCursor
  };
};