import { useEffect, useState } from 'react';
import { useMap } from '@/components/maps/MapProvider';

export interface OrientationInfo {
  orientation: 'portrait' | 'landscape';
  angle: number;
  isSupported: boolean;
}

export function useOrientationDetector() {
  // Defensive check - safely access useMap context
  let setOrientation: ((orientation: 'portrait' | 'landscape') => void) | null = null;
  try {
    const mapContext = useMap();
    setOrientation = mapContext?.setOrientation || null;
  } catch {
    // MapProvider not available - this is ok, just skip orientation updates
    setOrientation = null;
  }
  
  const [orientationInfo, setOrientationInfo] = useState<OrientationInfo>({
    orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
    angle: 0,
    isSupported: 'orientation' in screen
  });

  useEffect(() => {
    const updateOrientation = () => {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      const angle = screen.orientation?.angle || 0;
      
      const newInfo: OrientationInfo = {
        orientation: newOrientation,
        angle,
        isSupported: 'orientation' in screen
      };
      
      setOrientationInfo(newInfo);
      // Only update map context if available
      if (setOrientation) {
        setOrientation(newOrientation);
      }
    };

    // Initial check
    updateOrientation();

    // Event listeners
    const handleOrientationChange = () => {
      // Add a small delay to ensure dimensions are updated
      setTimeout(updateOrientation, 100);
    };

    const handleResize = () => {
      updateOrientation();
    };

    // Listen to multiple events for better compatibility
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
    screen.orientation?.addEventListener('change', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      screen.orientation?.removeEventListener('change', handleOrientationChange);
    };
  }, [setOrientation]);

  return orientationInfo;
}

// Hook for orientation-specific behavior
export function useOrientationBehavior() {
  const orientationInfo = useOrientationDetector();
  
  const isLandscape = orientationInfo.orientation === 'landscape';
  const isPortrait = orientationInfo.orientation === 'portrait';
  const isMobile = window.innerWidth < 768;
  
  // Orientation-specific CSS classes
  const orientationClasses = {
    container: isLandscape && isMobile ? 'landscape-mobile' : isPortrait && isMobile ? 'portrait-mobile' : '',
    controls: isLandscape ? 'landscape-controls' : 'portrait-controls',
    sidebar: isLandscape && isMobile ? 'landscape-sidebar' : 'portrait-sidebar'
  };
  
  return {
    ...orientationInfo,
    isLandscape,
    isPortrait,
    isMobile,
    orientationClasses
  };
}