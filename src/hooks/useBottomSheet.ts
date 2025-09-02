import { useState, useCallback, useRef, useEffect } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

export interface BottomSheetState {
  isOpen: boolean;
  currentSnapPoint: number;
  isDragging: boolean;
  height: number;
  isAnimating: boolean;
}

export interface BottomSheetConfig {
  snapPoints: number[]; // Pontos de snap em percentual (ex: [25, 50, 75, 100])
  initialSnapPoint?: number;
  minHeight?: number;
  maxHeight?: number;
  dragThreshold?: number;
  animationDuration?: number;
  backdropBlur?: boolean;
  persistentMiniMode?: boolean;
}

/**
 * Hook para controle avançado de bottom sheet responsivo
 * Com snap points dinâmicos, gesture navigation e haptic feedback
 */
export function useBottomSheet(config: BottomSheetConfig) {
  const {
    snapPoints = [25, 50, 75, 100],
    initialSnapPoint = 0,
    minHeight = 100,
    maxHeight = window.innerHeight * 0.9,
    dragThreshold = 50,
    animationDuration = 300,
    backdropBlur = true,
    persistentMiniMode = false,
  } = config;

  const { selection, buttonTap, success } = useHapticFeedback();

  const [state, setState] = useState<BottomSheetState>({
    isOpen: false,
    currentSnapPoint: initialSnapPoint,
    isDragging: false,
    height: Math.max(minHeight, (window.innerHeight * snapPoints[initialSnapPoint]) / 100),
    isAnimating: false,
  });

  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Calcula altura do snap point
  const getSnapPointHeight = useCallback((snapPointIndex: number): number => {
    const percentage = snapPoints[snapPointIndex] || snapPoints[0];
    return Math.min(maxHeight, Math.max(minHeight, (window.innerHeight * percentage) / 100));
  }, [snapPoints, minHeight, maxHeight]);

  // Encontra snap point mais próximo
  const findNearestSnapPoint = useCallback((currentHeight: number): number => {
    let nearestIndex = 0;
    let smallestDiff = Infinity;

    snapPoints.forEach((_, index) => {
      const snapHeight = getSnapPointHeight(index);
      const diff = Math.abs(currentHeight - snapHeight);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }, [snapPoints, getSnapPointHeight]);

  // Anima para altura específica
  const animateToHeight = useCallback((targetHeight: number, snapPointIndex?: number) => {
    if (!sheetRef.current) return;

    setState(prev => ({ ...prev, isAnimating: true }));

    const startHeight = state.height;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentHeight = startHeight + (targetHeight - startHeight) * easeOut;

      setState(prev => ({ 
        ...prev, 
        height: currentHeight,
        currentSnapPoint: snapPointIndex !== undefined ? snapPointIndex : prev.currentSnapPoint,
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setState(prev => ({ ...prev, isAnimating: false }));
        success(); // Haptic feedback quando animação termina
      }
    };

    requestAnimationFrame(animate);
  }, [state.height, animationDuration, success]);

  // Abre o bottom sheet
  const open = useCallback((snapPointIndex: number = initialSnapPoint) => {
    const targetHeight = getSnapPointHeight(snapPointIndex);
    setState(prev => ({ ...prev, isOpen: true }));
    animateToHeight(targetHeight, snapPointIndex);
    selection(); // Haptic feedback
  }, [initialSnapPoint, getSnapPointHeight, animateToHeight, selection]);

  // Fecha o bottom sheet
  const close = useCallback(() => {
    if (persistentMiniMode) {
      // Vai para o snap point menor em modo persistente
      snapTo(0);
    } else {
      setState(prev => ({ ...prev, isOpen: false }));
      animateToHeight(0);
    }
    buttonTap(); // Haptic feedback
  }, [persistentMiniMode, animateToHeight, buttonTap]);

  // Vai para snap point específico
  const snapTo = useCallback((snapPointIndex: number) => {
    if (snapPointIndex < 0 || snapPointIndex >= snapPoints.length) return;
    
    const targetHeight = getSnapPointHeight(snapPointIndex);
    animateToHeight(targetHeight, snapPointIndex);
    selection(); // Haptic feedback
  }, [snapPoints.length, getSnapPointHeight, animateToHeight, selection]);

  // Próximo snap point
  const snapToNext = useCallback(() => {
    const nextIndex = Math.min(state.currentSnapPoint + 1, snapPoints.length - 1);
    if (nextIndex !== state.currentSnapPoint) {
      snapTo(nextIndex);
    }
  }, [state.currentSnapPoint, snapPoints.length, snapTo]);

  // Snap point anterior
  const snapToPrevious = useCallback(() => {
    const prevIndex = Math.max(state.currentSnapPoint - 1, 0);
    if (prevIndex !== state.currentSnapPoint) {
      snapTo(prevIndex);
    }
  }, [state.currentSnapPoint, snapTo]);

  // Handle drag start
  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY;
    dragStartHeight.current = state.height;
    setState(prev => ({ ...prev, isDragging: true }));
    selection(); // Haptic feedback
  }, [state.height, selection]);

  // Handle drag move
  const handleDragMove = useCallback((clientY: number) => {
    if (!state.isDragging) return;

    const deltaY = dragStartY.current - clientY;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, dragStartHeight.current + deltaY));
    
    setState(prev => ({ ...prev, height: newHeight }));
  }, [state.isDragging, minHeight, maxHeight]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!state.isDragging) return;

    setState(prev => ({ ...prev, isDragging: false }));

    const dragDistance = Math.abs(state.height - dragStartHeight.current);
    
    if (dragDistance > dragThreshold) {
      // Snap para o ponto mais próximo
      const nearestSnapPoint = findNearestSnapPoint(state.height);
      snapTo(nearestSnapPoint);
    } else {
      // Volta para posição original
      const currentSnapPoint = findNearestSnapPoint(dragStartHeight.current);
      snapTo(currentSnapPoint);
    }
  }, [state.isDragging, state.height, dragThreshold, findNearestSnapPoint, snapTo]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse events (para desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  // Ajusta altura quando viewport muda
  useEffect(() => {
    const handleResize = () => {
      if (state.isOpen && !state.isDragging) {
        const newHeight = getSnapPointHeight(state.currentSnapPoint);
        setState(prev => ({ ...prev, height: newHeight }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.isOpen, state.isDragging, state.currentSnapPoint, getSnapPointHeight]);

  return {
    // Estado
    state,
    
    // Controles principais
    open,
    close,
    snapTo,
    snapToNext,
    snapToPrevious,
    
    // Event handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    
    // Refs
    sheetRef,
    backdropRef,
    
    // Configurações
    snapPoints,
    getSnapPointHeight,
    
    // Utilitários
    isFullyOpen: state.currentSnapPoint === snapPoints.length - 1,
    isMinimized: state.currentSnapPoint === 0,
    canSnapUp: state.currentSnapPoint < snapPoints.length - 1,
    canSnapDown: state.currentSnapPoint > 0,
    backdropOpacity: Math.min(0.5, state.height / (window.innerHeight * 0.5)),
  };
}