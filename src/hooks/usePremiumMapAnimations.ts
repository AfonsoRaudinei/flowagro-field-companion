import { useCallback, useEffect, useState } from 'react';
import { useMap } from '@/components/maps/MapProvider';
import { useOrientationDetector } from '@/hooks/useOrientationDetector';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface AnimationState {
  isAnimating: boolean;
  currentAnimation: string | null;
  animationQueue: string[];
}

/**
 * Hook que integra o sistema de animações premium com o estado do mapa
 * e detectores de orientação, fornecendo animações contextualmente apropriadas
 */
export function usePremiumMapAnimations() {
  const { 
    isFullscreen, 
    fullscreenState, 
    isTransitioning, 
    orientation, 
    showControls,
    map,
    enterFullscreen,
    exitFullscreen,
    setShowControls 
  } = useMap();
  
  const orientationInfo = useOrientationDetector();
  const { premiumPress, buttonPress, success } = useHapticFeedback();
  
  const [animationState, setAnimationState] = useState<AnimationState>({
    isAnimating: false,
    currentAnimation: null,
    animationQueue: []
  });

  // Premium fullscreen transition with animations
  const animatedEnterFullscreen = useCallback(async () => {
    setAnimationState(prev => ({ 
      ...prev, 
      isAnimating: true, 
      currentAnimation: 'fullscreen-enter' 
    }));
    
    await premiumPress();
    await enterFullscreen();
    
    // Wait for animation to complete
    setTimeout(() => {
      setAnimationState(prev => ({ 
        ...prev, 
        isAnimating: false, 
        currentAnimation: null 
      }));
      success();
    }, 400);
  }, [enterFullscreen, premiumPress, success]);

  const animatedExitFullscreen = useCallback(async () => {
    setAnimationState(prev => ({ 
      ...prev, 
      isAnimating: true, 
      currentAnimation: 'fullscreen-exit' 
    }));
    
    await buttonPress();
    await exitFullscreen();
    
    setTimeout(() => {
      setAnimationState(prev => ({ 
        ...prev, 
        isAnimating: false, 
        currentAnimation: null 
      }));
    }, 400);
  }, [exitFullscreen, buttonPress]);

  // Orientation-aware animations
  const getOrientationAnimation = useCallback(() => {
    if (orientation === 'landscape') {
      return 'slide-in-right';
    }
    return 'slide-up';
  }, [orientation]);

  // Control visibility animations based on map state
  const animateControlsVisibility = useCallback((visible: boolean) => {
    setAnimationState(prev => ({ 
      ...prev, 
      isAnimating: true, 
      currentAnimation: visible ? 'fade-in' : 'fade-out' 
    }));
    
    setShowControls(visible);
    
    setTimeout(() => {
      setAnimationState(prev => ({ 
        ...prev, 
        isAnimating: false, 
        currentAnimation: null 
      }));
    }, 300);
  }, [setShowControls]);

  // Map interaction animations
  const animateMapInteraction = useCallback(async (interactionType: 'zoom' | 'pan' | 'rotate' | 'tilt') => {
    switch (interactionType) {
      case 'zoom':
        await buttonPress();
        break;
      case 'pan':
        // Light haptic for smooth panning
        break;
      case 'rotate':
        await premiumPress();
        break;
      case 'tilt':
        await premiumPress();
        break;
    }
  }, [buttonPress, premiumPress]);

  // Contextual animation classes based on current state
  const getContextualClasses = useCallback(() => {
    const classes = [];
    
    // Base transition classes
    classes.push('transition-all duration-300');
    
    // Fullscreen state classes
    if (isTransitioning) {
      classes.push('fullscreen-transition');
    }
    
    if (fullscreenState === 'entering') {
      classes.push('animate-fullscreen-enter');
    } else if (fullscreenState === 'exiting') {
      classes.push('animate-fullscreen-exit');
    }
    
    // Orientation-based classes
    if (orientation === 'landscape') {
      classes.push('landscape-optimized');
    } else {
      classes.push('portrait-optimized');
    }
    
    // Animation state classes
    if (animationState.isAnimating) {
      classes.push('pointer-events-none');
    }
    
    return classes.join(' ');
  }, [isTransitioning, fullscreenState, orientation, animationState.isAnimating]);

  // Control positioning based on orientation and fullscreen state
  const getControlPosition = useCallback((controlType: 'primary' | 'secondary' | 'floating') => {
    const base = {
      primary: 'top-4 left-4',
      secondary: 'top-4 right-4',
      floating: 'bottom-4 right-4'
    };
    
    if (isFullscreen && orientation === 'landscape') {
      return {
        primary: 'top-6 left-6',
        secondary: 'top-6 right-6',
        floating: 'bottom-6 right-6'
      };
    }
    
    return base;
  }, [isFullscreen, orientation]);

  // Z-index system for layered controls
  const getZIndex = useCallback((layer: 'map' | 'controls' | 'overlay' | 'modal' | 'tooltip') => {
    const zIndices = {
      map: 0,
      controls: 10,
      overlay: 20,
      modal: 30,
      tooltip: 40
    };
    
    // Boost z-index during transitions
    if (isTransitioning) {
      return zIndices[layer] + 50;
    }
    
    return zIndices[layer];
  }, [isTransitioning]);

  // Auto-hide controls in fullscreen after inactivity
  useEffect(() => {
    if (!isFullscreen) return;
    
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      if (!showControls) {
        animateControlsVisibility(true);
      }
      
      inactivityTimer = setTimeout(() => {
        animateControlsVisibility(false);
      }, 3000);
    };
    
    const handleActivity = () => resetTimer();
    
    // Listen for user activity
    map?.on('touchstart', handleActivity);
    map?.on('mousedown', handleActivity);
    map?.on('wheel', handleActivity);
    
    resetTimer();
    
    return () => {
      clearTimeout(inactivityTimer);
      map?.off('touchstart', handleActivity);
      map?.off('mousedown', handleActivity);
      map?.off('wheel', handleActivity);
    };
  }, [isFullscreen, map, showControls, animateControlsVisibility]);

  return {
    // State
    animationState,
    isFullscreen,
    fullscreenState,
    isTransitioning,
    orientation: orientationInfo.orientation,
    showControls,
    
    // Actions
    animatedEnterFullscreen,
    animatedExitFullscreen,
    animateControlsVisibility,
    animateMapInteraction,
    
    // Utilities
    getContextualClasses,
    getOrientationAnimation,
    getControlPosition,
    getZIndex,
    
    // Direct access to map state for advanced usage
    map,
    orientationInfo
  };
}