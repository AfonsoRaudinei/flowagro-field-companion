import { useState, useEffect, useCallback, useRef } from 'react';
import { useMapInstance } from '@/hooks/useMapInstance';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface CompassState {
  bearing: number; // 0-360 degrees
  magneticDeclination: number | null; // Magnetic declination for the current location
  isNorthAligned: boolean; // Within 5 degrees of north
}

export const useCompass = (autoReset: boolean = true, autoResetDelay: number = 30000) => {
  const { map, isReady } = useMapInstance();
  const { buttonPress } = useHapticFeedback();
  
  const [compassState, setCompassState] = useState<CompassState>({
    bearing: 0,
    magneticDeclination: null,
    isNorthAligned: true
  });

  const autoResetTimeoutRef = useRef<NodeJS.Timeout>();
  const orientationSupportRef = useRef<boolean>(false);

  // Check for device orientation support
  useEffect(() => {
    orientationSupportRef.current = 'DeviceOrientationEvent' in window;
  }, []);

  // Update compass state when map rotates
  useEffect(() => {
    if (!isReady || !map) return;

    const updateBearing = () => {
      const bearing = map.getBearing();
      const normalizedBearing = ((bearing % 360) + 360) % 360; // Normalize to 0-360
      const isNorthAligned = Math.abs(normalizedBearing) < 5 || Math.abs(normalizedBearing - 360) < 5;

      setCompassState(prev => ({
        ...prev,
        bearing: normalizedBearing,
        isNorthAligned
      }));
    };

    // Initial update
    updateBearing();

    // Listen for rotation changes
    map.on('rotate', updateBearing);

    return () => {
      map.off('rotate', updateBearing);
    };
  }, [map, isReady]);

  // Calculate magnetic declination based on position
  useEffect(() => {
    if (!isReady || !map) return;

    const updateMagneticDeclination = () => {
      const center = map.getCenter();
      // Simplified magnetic declination calculation for Brazil region
      // In a real implementation, you'd use a magnetic declination API
      const lat = center.lat;
      const lng = center.lng;
      
      // Rough approximation for Brazil (varies from -25° to +5°)
      const declination = -20 + (lat / 10) + (lng / 50);
      
      setCompassState(prev => ({
        ...prev,
        magneticDeclination: Math.round(declination * 10) / 10
      }));
    };

    updateMagneticDeclination();
    map.on('moveend', updateMagneticDeclination);

    return () => {
      map.off('moveend', updateMagneticDeclination);
    };
  }, [map, isReady]);

  // Device orientation handling
  useEffect(() => {
    if (!orientationSupportRef.current || !autoReset) return;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const eventWithWebkit = event as DeviceOrientationEvent & { webkitCompassHeading?: number };
      
      if (eventWithWebkit.webkitCompassHeading !== undefined) {
        // iOS Safari
        const heading = eventWithWebkit.webkitCompassHeading;
        // Auto-align map to device heading if significant difference
        if (map && Math.abs(heading - compassState.bearing) > 30) {
          gradualRotateToNorth();
        }
      } else if (event.alpha !== null) {
        // Android Chrome
        const heading = 360 - event.alpha;
        if (map && Math.abs(heading - compassState.bearing) > 30) {
          gradualRotateToNorth();
        }
      }
    };

    // Request permission for iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permission: string) => {
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          }
        });
    } else {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [autoReset, compassState.bearing, map]);

  const resetToNorth = useCallback(async () => {
    if (!map) return;

    await buttonPress();
    
    map.flyTo({
      bearing: 0,
      duration: 800,
      essential: true
    });
  }, [map, buttonPress]);

  const gradualRotateToNorth = useCallback(() => {
    if (!map || compassState.isNorthAligned) return;

    map.flyTo({
      bearing: 0,
      duration: 2000,
      essential: true
    });
  }, [map, compassState.isNorthAligned]);

  const startAutoReset = useCallback(() => {
    if (!autoReset) return;

    // Clear existing timeout
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
    }

    // Set new timeout
    autoResetTimeoutRef.current = setTimeout(() => {
      if (!compassState.isNorthAligned) {
        gradualRotateToNorth();
      }
    }, autoResetDelay);
  }, [autoReset, autoResetDelay, compassState.isNorthAligned, gradualRotateToNorth]);

  const stopAutoReset = useCallback(() => {
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
      autoResetTimeoutRef.current = undefined;
    }
  }, []);

  // Handle shake-to-reset (mobile)
  useEffect(() => {
    let lastTime = 0;
    let lastX = 0, lastY = 0, lastZ = 0;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      const currentTime = new Date().getTime();

      if ((currentTime - lastTime) > 100) {
        const timeDiff = currentTime - lastTime;
        lastTime = currentTime;

        const x = current?.x || 0;
        const y = current?.y || 0;
        const z = current?.z || 0;

        const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / timeDiff * 10000;

        if (speed > 300) {
          // Shake detected - reset to north
          resetToNorth();
        }

        lastX = x;
        lastY = y;
        lastZ = z;
      }
    };

    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      stopAutoReset();
    };
  }, [resetToNorth, stopAutoReset]);

  return {
    ...compassState,
    resetToNorth,
    gradualRotateToNorth,
    startAutoReset,
    stopAutoReset
  };
};