import { useState, useEffect, useCallback } from 'react';
import { useMapInstance } from '@/hooks/useMapInstance';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface ZoomControlState {
  currentZoom: number;
  minZoom: number;
  maxZoom: number;
  zoomProgress: number; // 0-100 percentage
  isZooming: boolean;
}

export const useZoomControl = () => {
  const { map, isReady } = useMapInstance();
  const { buttonPress } = useHapticFeedback();
  
  const [zoomState, setZoomState] = useState<ZoomControlState>({
    currentZoom: 4,
    minZoom: 1,
    maxZoom: 22,
    zoomProgress: 0,
    isZooming: false
  });

  // Update zoom state when map changes
  useEffect(() => {
    if (!isReady || !map) return;

    const updateZoomState = () => {
      const zoom = map.getZoom();
      const minZoom = map.getMinZoom();
      const maxZoom = map.getMaxZoom();
      const progress = ((zoom - minZoom) / (maxZoom - minZoom)) * 100;

      setZoomState(prev => ({
        ...prev,
        currentZoom: zoom,
        minZoom,
        maxZoom,
        zoomProgress: progress
      }));
    };

    // Initial update
    updateZoomState();

    // Listen for zoom changes
    map.on('zoom', updateZoomState);
    map.on('zoomend', () => {
      setZoomState(prev => ({ ...prev, isZooming: false }));
    });

    return () => {
      map.off('zoom', updateZoomState);
      map.off('zoomend', () => {
        setZoomState(prev => ({ ...prev, isZooming: false }));
      });
    };
  }, [map, isReady]);

  const zoomIn = useCallback(async (step: number = 1) => {
    if (!map || zoomState.currentZoom >= zoomState.maxZoom) return;

    await buttonPress();
    setZoomState(prev => ({ ...prev, isZooming: true }));
    
    map.zoomIn({
      duration: 300
    });
  }, [map, zoomState.currentZoom, zoomState.maxZoom, buttonPress]);

  const zoomOut = useCallback(async (step: number = 1) => {
    if (!map || zoomState.currentZoom <= zoomState.minZoom) return;

    await buttonPress();
    setZoomState(prev => ({ ...prev, isZooming: true }));
    
    map.zoomOut({
      duration: 300
    });
  }, [map, zoomState.currentZoom, zoomState.minZoom, buttonPress]);

  const setZoomLevel = useCallback(async (zoom: number) => {
    if (!map || zoom < zoomState.minZoom || zoom > zoomState.maxZoom) return;

    await buttonPress();
    setZoomState(prev => ({ ...prev, isZooming: true }));
    
    map.flyTo({
      zoom,
      duration: 800,
      essential: true
    });
  }, [map, zoomState.minZoom, zoomState.maxZoom, buttonPress]);

  const zoomToFit = useCallback(async (
    bounds: [[number, number], [number, number]], 
    padding: number = 50
  ) => {
    if (!map) return;

    await buttonPress();
    setZoomState(prev => ({ ...prev, isZooming: true }));
    
    map.fitBounds(bounds, {
      padding,
      duration: 1000,
      essential: true
    });
  }, [map, buttonPress]);

  // Continuous zoom (hold to zoom)
  const startContinuousZoom = useCallback((direction: 'in' | 'out') => {
    if (!map) return;

    const zoomStep = direction === 'in' ? 0.2 : -0.2;
    let animationId: number;

    const continuousZoom = () => {
      const newZoom = map.getZoom() + zoomStep;
      if (newZoom >= zoomState.minZoom && newZoom <= zoomState.maxZoom) {
        map.setZoom(newZoom);
        animationId = requestAnimationFrame(continuousZoom);
      }
    };

    setZoomState(prev => ({ ...prev, isZooming: true }));
    animationId = requestAnimationFrame(continuousZoom);

    return () => {
      cancelAnimationFrame(animationId);
      setZoomState(prev => ({ ...prev, isZooming: false }));
    };
  }, [map, zoomState.minZoom, zoomState.maxZoom]);

  // Double-tap zoom
  const doubleTapZoom = useCallback(async (center?: [number, number]) => {
    if (!map) return;

    await buttonPress();
    setZoomState(prev => ({ ...prev, isZooming: true }));

    const targetZoom = Math.min(zoomState.currentZoom + 2, zoomState.maxZoom);
    
    map.flyTo({
      zoom: targetZoom,
      center: center || map.getCenter().toArray() as [number, number],
      duration: 500,
      essential: true
    });
  }, [map, zoomState.currentZoom, zoomState.maxZoom, buttonPress]);

  return {
    ...zoomState,
    zoomIn,
    zoomOut,
    setZoomLevel,
    zoomToFit,
    startContinuousZoom,
    doubleTapZoom
  };
};