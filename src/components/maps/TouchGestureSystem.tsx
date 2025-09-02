import React from 'react';
import { useTouchGestures } from '../../hooks/useTouchGestures';
import { useMapInstance } from '../../hooks/useMapInstance';

export interface TouchGestureSystemProps {
  children: React.ReactNode;
  enablePinchZoom?: boolean;
  enableRotation?: boolean;
  enablePan?: boolean;
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
  className?: string;
}

/**
 * Sistema de gestos naturais para interface touch
 * Wrapper que adiciona controle de gestos avançados aos filhos
 */
export function TouchGestureSystem({
  children,
  enablePinchZoom = true,
  enableRotation = true,
  enablePan = true,
  onGestureStart,
  onGestureEnd,
  className = '',
}: TouchGestureSystemProps) {
  const { map } = useMapInstance();

  const {
    gestureState,
    enableGestures,
    disableGestures,
    enableZoomOnly,
    enablePanOnly,
    isGestureActive,
  } = useTouchGestures({
    onPinchStart: (center, distance) => {
      if (!enablePinchZoom) return;
      onGestureStart?.();
    },
    
    onPinchMove: (center, scale) => {
      if (!enablePinchZoom || !map) return;
      
      // Integração nativa com Mapbox zoom
      const currentZoom = map.getZoom();
      const newZoom = currentZoom + Math.log2(scale) * 0.1;
      map.setZoom(Math.max(0, Math.min(22, newZoom)));
    },
    
    onPinchEnd: () => {
      onGestureEnd?.();
    },
    
    onRotateStart: (center, rotation) => {
      if (!enableRotation) return;
      onGestureStart?.();
    },
    
    onRotateMove: (center, rotationDiff) => {
      if (!enableRotation || !map) return;
      
      // Integração nativa com Mapbox bearing
      const currentBearing = map.getBearing();
      const newBearing = currentBearing + rotationDiff * 0.5;
      map.setBearing(newBearing);
    },
    
    onRotateEnd: () => {
      onGestureEnd?.();
    },
    
    onLongPress: (position) => {
      // Dispara evento customizado para long press
      const event = new CustomEvent('mapLongPress', {
        detail: { position },
      });
      window.dispatchEvent(event);
    },
    
    onTap: (position) => {
      // Dispara evento customizado para tap
      const event = new CustomEvent('mapTap', {
        detail: { position },
      });
      window.dispatchEvent(event);
    },
    
    onDoubleTap: (position) => {
      if (!enablePinchZoom || !map) return;
      
      // Zoom in no ponto tocado
      const currentZoom = map.getZoom();
      map.easeTo({
        zoom: currentZoom + 1,
        duration: 300,
      });
    },
  });

  // Gerencia habilitação/desabilitação de gestos baseado nas props
  React.useEffect(() => {
    if (!enablePinchZoom && !enableRotation && !enablePan) {
      disableGestures();
    } else if (enablePinchZoom && !enablePan) {
      enableZoomOnly();
    } else if (enablePan && !enablePinchZoom) {
      enablePanOnly();
    } else {
      enableGestures();
    }
  }, [enablePinchZoom, enableRotation, enablePan, enableGestures, disableGestures, enableZoomOnly, enablePanOnly]);

  return (
    <div 
      className={`touch-gesture-system ${className} ${isGestureActive ? 'gesture-active' : ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        touchAction: 'none', // Previne scroll nativo
      }}
    >
      {children}
      
      {/* Indicador visual de gestos ativos */}
      {isGestureActive && (
        <div className="gesture-indicator fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-1 rounded-full text-sm font-medium shadow-lg animate-fade-in">
            {gestureState.isPinching && gestureState.isRotating && 'Zoom & Rotação'}
            {gestureState.isPinching && !gestureState.isRotating && 'Zoom'}
            {!gestureState.isPinching && gestureState.isRotating && 'Rotação'}
            {gestureState.isPanning && !gestureState.isPinching && !gestureState.isRotating && 'Navegação'}
            {gestureState.isLongPressing && 'Seleção'}
          </div>
        </div>
      )}
      
      {/* Overlay para captura de gestos quando necessário */}
      {!enablePan && !enablePinchZoom && !enableRotation && (
        <div 
          className="absolute inset-0 z-10 bg-transparent"
          style={{ touchAction: 'none' }}
        />
      )}
    </div>
  );
}