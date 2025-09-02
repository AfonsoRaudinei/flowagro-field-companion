import { useCallback, useRef, useEffect, useState } from 'react';
import { useMapInstance } from './useMapInstance';
import { useHapticFeedback } from './useHapticFeedback';

export interface TouchGestureState {
  isPinching: boolean;
  isPanning: boolean;
  isRotating: boolean;
  isLongPressing: boolean;
  gestureCenter: [number, number] | null;
  initialDistance: number | null;
  initialRotation: number | null;
}

export interface TouchGestureCallbacks {
  onPinchStart?: (center: [number, number], distance: number) => void;
  onPinchMove?: (center: [number, number], scale: number) => void;
  onPinchEnd?: () => void;
  onRotateStart?: (center: [number, number], rotation: number) => void;
  onRotateMove?: (center: [number, number], rotation: number) => void;
  onRotateEnd?: () => void;
  onLongPress?: (position: [number, number]) => void;
  onTap?: (position: [number, number]) => void;
  onDoubleTap?: (position: [number, number]) => void;
}

/**
 * Hook avançado para gestos naturais em mapas
 * Integra com Mapbox GL JS e fornece haptic feedback contextual
 */
export function useTouchGestures(callbacks: TouchGestureCallbacks = {}) {
  const { map, isReady } = useMapInstance();
  const { buttonTap, selection, hoverEnter, pressDown, releaseUp } = useHapticFeedback();
  
  const [gestureState, setGestureState] = useState<TouchGestureState>({
    isPinching: false,
    isPanning: false,
    isRotating: false,
    isLongPressing: false,
    gestureCenter: null,
    initialDistance: null,
    initialRotation: null,
  });

  const touchStartTime = useRef<number>(0);
  const touchStartPosition = useRef<[number, number] | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef<number>(0);
  const touches = useRef<TouchList | null>(null);

  // Calcula distância entre dois pontos
  const calculateDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calcula centro entre dois pontos
  const calculateCenter = useCallback((touch1: Touch, touch2: Touch): [number, number] => {
    return [
      (touch1.clientX + touch2.clientX) / 2,
      (touch1.clientY + touch2.clientY) / 2
    ];
  }, []);

  // Calcula rotação entre dois pontos
  const calculateRotation = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isReady || !map) return;

    const touch = e.touches[0];
    const now = Date.now();
    touchStartTime.current = now;
    touchStartPosition.current = [touch.clientX, touch.clientY];
    touches.current = e.touches;

    // Haptic feedback para início de toque
    hoverEnter();

    // Detecta long press
    longPressTimer.current = setTimeout(() => {
      if (touchStartPosition.current && e.touches.length === 1) {
        setGestureState(prev => ({ ...prev, isLongPressing: true }));
        pressDown(); // Haptic feedback para long press
        callbacks.onLongPress?.(touchStartPosition.current!);
      }
    }, 500);

    // Detecta gestos multi-touch
    if (e.touches.length === 2) {
      const [touch1, touch2] = Array.from(e.touches);
      const center = calculateCenter(touch1, touch2);
      const distance = calculateDistance(touch1, touch2);
      const rotation = calculateRotation(touch1, touch2);

      setGestureState(prev => ({
        ...prev,
        isPinching: true,
        isRotating: true,
        gestureCenter: center,
        initialDistance: distance,
        initialRotation: rotation,
      }));

      selection(); // Haptic feedback para multi-touch
      callbacks.onPinchStart?.(center, distance);
      callbacks.onRotateStart?.(center, rotation);
    }
  }, [isReady, map, hoverEnter, pressDown, selection, calculateCenter, calculateDistance, calculateRotation, callbacks]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isReady || !map || !touches.current) return;

    // Cancela long press se houve movimento
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Gestos multi-touch
    if (e.touches.length === 2 && gestureState.isPinching) {
      const [touch1, touch2] = Array.from(e.touches);
      const center = calculateCenter(touch1, touch2);
      const distance = calculateDistance(touch1, touch2);
      const rotation = calculateRotation(touch1, touch2);

      if (gestureState.initialDistance) {
        const scale = distance / gestureState.initialDistance;
        callbacks.onPinchMove?.(center, scale);
      }

      if (gestureState.initialRotation !== null) {
        const rotationDiff = rotation - gestureState.initialRotation;
        callbacks.onRotateMove?.(center, rotationDiff);
      }

      setGestureState(prev => ({ ...prev, gestureCenter: center }));
    }

    // Pan gesture
    if (e.touches.length === 1 && !gestureState.isPinching) {
      setGestureState(prev => ({ ...prev, isPanning: true }));
    }
  }, [isReady, map, gestureState, calculateCenter, calculateDistance, calculateRotation, callbacks]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isReady || !map) return;

    const now = Date.now();
    const touchDuration = now - touchStartTime.current;

    // Limpa timer de long press
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Haptic feedback para fim de toque
    releaseUp();

    // Detecta tap e double tap
    if (touchDuration < 300 && touchStartPosition.current && !gestureState.isLongPressing && !gestureState.isPanning) {
      const timeSinceLastTap = now - lastTapTime.current;
      
      if (timeSinceLastTap < 300) {
        // Double tap
        buttonTap();
        callbacks.onDoubleTap?.(touchStartPosition.current);
      } else {
        // Single tap
        setTimeout(() => {
          const newTimeSinceLastTap = Date.now() - lastTapTime.current;
          if (newTimeSinceLastTap >= 300) {
            callbacks.onTap?.(touchStartPosition.current!);
          }
        }, 300);
      }
      lastTapTime.current = now;
    }

    // Finaliza gestos multi-touch
    if (gestureState.isPinching) {
      callbacks.onPinchEnd?.();
    }
    if (gestureState.isRotating) {
      callbacks.onRotateEnd?.();
    }

    // Reset state
    setGestureState({
      isPinching: false,
      isPanning: false,
      isRotating: false,
      isLongPressing: false,
      gestureCenter: null,
      initialDistance: null,
      initialRotation: null,
    });

    touches.current = null;
    touchStartPosition.current = null;
  }, [isReady, map, gestureState, releaseUp, buttonTap, callbacks]);

  // Configura event listeners
  useEffect(() => {
    if (!isReady || !map) return;

    const canvas = map.getCanvas();
    if (!canvas) return;

    // Configura listeners com passive para melhor performance
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isReady, map, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Funções utilitárias
  const enableGestures = useCallback(() => {
    if (!map) return;
    map.touchZoomRotate.enable();
    map.dragPan.enable();
  }, [map]);

  const disableGestures = useCallback(() => {
    if (!map) return;
    map.touchZoomRotate.disable();
    map.dragPan.disable();
  }, [map]);

  const enableZoomOnly = useCallback(() => {
    if (!map) return;
    map.touchZoomRotate.enable();
    map.dragPan.disable();
  }, [map]);

  const enablePanOnly = useCallback(() => {
    if (!map) return;
    map.touchZoomRotate.disable();
    map.dragPan.enable();
  }, [map]);

  return {
    // Estado dos gestos
    gestureState,
    
    // Controle de gestos
    enableGestures,
    disableGestures,
    enableZoomOnly,
    enablePanOnly,
    
    // Informações úteis
    isGestureActive: gestureState.isPinching || gestureState.isPanning || gestureState.isRotating || gestureState.isLongPressing,
    gestureCenter: gestureState.gestureCenter,
  };
}