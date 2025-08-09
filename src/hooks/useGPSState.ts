import { useState, useEffect, useCallback } from 'react';
import { GPSService, UserLocation } from '@/services/gpsService';
import { useToast } from '@/hooks/use-toast';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface GPSState {
  isEnabled: boolean;
  lastLocation: UserLocation | null;
  lastCheck: Date;
  accuracy: 'high' | 'medium' | 'low' | 'unknown';
  source: 'gps' | 'cache' | 'map-center' | 'none';
  isChecking: boolean;
}

export interface CachedLocation extends UserLocation {
  expiresAt: Date;
  source: 'gps' | 'map-center';
}

const GPS_CHECK_INTERVAL = 30000; // 30 seconds
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useGPSState = () => {
  const { toast } = useToast();
  
  const [gpsState, setGpsState] = useState<GPSState>({
    isEnabled: false,
    lastLocation: null,
    lastCheck: new Date(),
    accuracy: 'unknown',
    source: 'none',
    isChecking: false
  });

  // Load cached location from localStorage
  const loadCachedLocation = useCallback((): CachedLocation | null => {
    try {
      const cached = localStorage.getItem('flowagro_cached_location');
      if (cached) {
        const cachedLocation: CachedLocation = JSON.parse(cached);
        if (new Date() < new Date(cachedLocation.expiresAt)) {
          return cachedLocation;
        }
      }
    } catch (error) {
      console.warn('Error loading cached location:', error);
    }
    return null;
  }, []);

  // Save location to cache
  const saveCachedLocation = useCallback((location: UserLocation, source: 'gps' | 'map-center') => {
    try {
      const cachedLocation: CachedLocation = {
        ...location,
        expiresAt: new Date(Date.now() + CACHE_DURATION),
        source
      };
      localStorage.setItem('flowagro_cached_location', JSON.stringify(cachedLocation));
    } catch (error) {
      console.warn('Error saving cached location:', error);
    }
  }, []);

  // Check GPS status
  const checkGPSStatus = useCallback(async (): Promise<boolean> => {
    setGpsState(prev => ({ ...prev, isChecking: true }));
    
    try {
      const hasPermissions = await GPSService.checkPermissions();
      const wasEnabled = gpsState.isEnabled;
      
      setGpsState(prev => ({
        ...prev,
        isEnabled: hasPermissions,
        lastCheck: new Date(),
        isChecking: false
      }));

      // Haptic feedback for GPS state changes (no toast)
      if (hasPermissions && !wasEnabled) {
        try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) {}
      } else if (!hasPermissions && wasEnabled) {
        try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch (e) {}
      }

      return hasPermissions;
    } catch (error) {
      setGpsState(prev => ({
        ...prev,
        isEnabled: false,
        isChecking: false,
        lastCheck: new Date()
      }));
      return false;
    }
  }, [gpsState.isEnabled, toast]);

  // Get current location with fallback
  const getCurrentLocationWithFallback = useCallback(async (mapCenter?: { lat: number; lng: number }): Promise<UserLocation | null> => {
    try {
      // First try to get fresh GPS location
      if (gpsState.isEnabled) {
        const location = await GPSService.getCurrentLocation();
        const accuracy = location.accuracy < 10 ? 'high' : location.accuracy < 50 ? 'medium' : 'low';
        
        setGpsState(prev => ({
          ...prev,
          lastLocation: location,
          accuracy,
          source: 'gps'
        }));
        
        saveCachedLocation(location, 'gps');
        
        try {
          await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {}
        
        return location;
      }
    } catch (error) {
      console.warn('Fresh GPS location failed:', error);
    }

    // Try cached location
    const cached = loadCachedLocation();
    if (cached) {
      setGpsState(prev => ({
        ...prev,
        lastLocation: cached,
        accuracy: cached.source === 'gps' ? 'medium' : 'low',
        source: 'cache'
      }));
      return cached;
    }

    // Use map center as fallback
    if (mapCenter) {
      const fallbackLocation: UserLocation = {
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        accuracy: 1000, // 1km accuracy for map center
        timestamp: new Date()
      };
      
      setGpsState(prev => ({
        ...prev,
        lastLocation: fallbackLocation,
        accuracy: 'low',
        source: 'map-center'
      }));
      
      saveCachedLocation(fallbackLocation, 'map-center');
      return fallbackLocation;
    }

    return null;
  }, [gpsState.isEnabled, loadCachedLocation, saveCachedLocation]);

  // Check GPS before action with user feedback
  const checkGPSBeforeAction = useCallback(async (actionName: string): Promise<boolean> => {
    const isEnabled = await checkGPSStatus();
    
    if (!isEnabled) {
      try {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (e) {}
      
      toast({
        title: "GPS Necessário",
        description: `Ative o GPS para usar ${actionName}`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  }, [checkGPSStatus, toast]);

  // Initialize GPS and set up periodic checking
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const initialize = async () => {
      await checkGPSStatus();
      
      // Load cached location on startup
      const cached = loadCachedLocation();
      if (cached) {
        setGpsState(prev => ({
          ...prev,
          lastLocation: cached,
          accuracy: cached.source === 'gps' ? 'medium' : 'low',
          source: 'cache'
        }));
      }

      // Set up periodic GPS checking
      intervalId = setInterval(checkGPSStatus, GPS_CHECK_INTERVAL);
    };

    initialize();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkGPSStatus, loadCachedLocation]);

  return {
    gpsState,
    checkGPSBeforeAction,
    getCurrentLocationWithFallback,
    checkGPSStatus
  };
};