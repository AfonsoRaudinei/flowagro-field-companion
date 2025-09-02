import { useState, useEffect, useCallback, useRef } from 'react';
import { useMapInstance } from '@/hooks/useMapInstance';
import { Geolocation } from '@capacitor/geolocation';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface LocationPosition {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface LocationState {
  currentPosition: LocationPosition | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  trail: LocationPosition[];
  isTracking: boolean;
  isFollowing: boolean;
  batteryOptimized: boolean;
  error: string | null;
}

export const useUserLocation = (maxTrailPoints: number = 10) => {
  const { map, isReady } = useMapInstance();
  const { success, error: hapticError } = useHapticFeedback();
  
  const [locationState, setLocationState] = useState<LocationState>({
    currentPosition: null,
    accuracy: null,
    speed: null,
    heading: null,
    trail: [],
    isTracking: false,
    isFollowing: false,
    batteryOptimized: true,
    error: null
  });

  const watchIdRef = useRef<string>();
  const followModeRef = useRef<boolean>(false);

  // Update follow mode ref
  useEffect(() => {
    followModeRef.current = locationState.isFollowing;
  }, [locationState.isFollowing]);

  const startTracking = useCallback(async () => {
    try {
      // Request permissions
      const permission = await Geolocation.requestPermissions();
      
      if (permission.location !== 'granted') {
        setLocationState(prev => ({
          ...prev,
          error: 'Permissão de localização negada'
        }));
        await hapticError();
        return;
      }

      // Start watching position
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: !locationState.batteryOptimized,
          timeout: locationState.batteryOptimized ? 15000 : 10000,
          maximumAge: locationState.batteryOptimized ? 60000 : 30000
        },
        (position, error) => {
          if (error) {
            setLocationState(prev => ({
              ...prev,
              error: `Erro de localização: ${error.message}`
            }));
            hapticError();
            return;
          }
          const newPosition: LocationPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined
          };

          setLocationState(prev => {
            const newTrail = [...prev.trail, newPosition];
            
            // Limit trail length
            if (newTrail.length > maxTrailPoints) {
              newTrail.shift();
            }

            return {
              ...prev,
              currentPosition: newPosition,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed,
              heading: position.coords.heading,
              trail: newTrail,
              error: null
            };
          });

          // Auto-follow if enabled
          if (followModeRef.current && map) {
            map.flyTo({
              center: [newPosition.longitude, newPosition.latitude],
              duration: 1000
            });
          }

          success();
        }
      );

      watchIdRef.current = watchId;
      setLocationState(prev => ({
        ...prev,
        isTracking: true,
        error: null
      }));

    } catch (error: any) {
      setLocationState(prev => ({
        ...prev,
        error: `Erro ao iniciar rastreamento: ${error.message}`
      }));
      await hapticError();
    }
  }, [locationState.batteryOptimized, map, success, hapticError, maxTrailPoints]);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current) {
      await Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = undefined;
    }

    setLocationState(prev => ({
      ...prev,
      isTracking: false,
      isFollowing: false
    }));

    await success();
  }, [success]);

  const toggleFollowMode = useCallback(async () => {
    const newFollowState = !locationState.isFollowing;
    
    setLocationState(prev => ({
      ...prev,
      isFollowing: newFollowState
    }));

    // If enabling follow mode and we have a current position, center on it
    if (newFollowState && locationState.currentPosition && map) {
      map.flyTo({
        center: [
          locationState.currentPosition.longitude,
          locationState.currentPosition.latitude
        ],
        duration: 1000
      });
    }

    await success();
  }, [locationState.isFollowing, locationState.currentPosition, map, success]);

  const centerOnLocation = useCallback(async () => {
    if (!locationState.currentPosition || !map) return;

    map.flyTo({
      center: [
        locationState.currentPosition.longitude,
        locationState.currentPosition.latitude
      ],
      zoom: Math.max(map.getZoom(), 15),
      duration: 1500
    });

    await success();
  }, [locationState.currentPosition, map, success]);

  const setBatteryOptimized = useCallback((optimized: boolean) => {
    setLocationState(prev => ({
      ...prev,
      batteryOptimized: optimized
    }));

    // Restart tracking with new settings if currently tracking
    if (locationState.isTracking) {
      stopTracking().then(() => {
        setTimeout(startTracking, 1000);
      });
    }
  }, [locationState.isTracking, stopTracking, startTracking]);

  // Get current location once (without tracking)
  const getCurrentLocation = useCallback(async (): Promise<LocationPosition | null> => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const locationData: LocationPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: Date.now(),
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined
      };

      await success();
      return locationData;
    } catch (error: any) {
      setLocationState(prev => ({
        ...prev,
        error: `Erro ao obter localização: ${error.message}`
      }));
      await hapticError();
      return null;
    }
  }, [success, hapticError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
    };
  }, []);

  return {
    ...locationState,
    startTracking,
    stopTracking,
    toggleFollowMode,
    centerOnLocation,
    setBatteryOptimized,
    getCurrentLocation
  };
};