import { useEffect, useState } from 'react';
import { useMap } from '@/components/maps/MapProvider';
import type { Map as MapboxMap } from 'mapbox-gl';

/**
 * Hook to safely access map instance with loading state
 */
export const useMapInstance = () => {
  const { map, isLoading, error } = useMap();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (map && !isLoading && !error) {
      // Check if map is fully loaded
      if (map.loaded()) {
        setIsReady(true);
      } else {
        map.on('load', () => setIsReady(true));
      }
    } else {
      setIsReady(false);
    }
  }, [map, isLoading, error]);

  return {
    map,
    isLoading,
    error,
    isReady
  };
};

/**
 * Hook for map navigation utilities
 */
export const useMapNavigation = () => {
  const { map } = useMapInstance();

  const flyTo = (coordinates: [number, number], zoom?: number) => {
    if (map) {
      map.flyTo({
        center: coordinates,
        zoom: zoom || map.getZoom(),
        duration: 1500
      });
    }
  };

  const fitBounds = (bounds: [[number, number], [number, number]], padding?: number) => {
    if (map) {
      map.fitBounds(bounds, {
        padding: padding || 50,
        duration: 1500
      });
    }
  };

  const resetView = () => {
    if (map) {
      map.flyTo({
        center: [-15.7975, -47.8919], // Brasília
        zoom: 4,
        pitch: 0,
        bearing: 0,
        duration: 1500
      });
    }
  };

  const getCurrentLocation = (): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const flyToCurrentLocation = async (zoom: number = 15) => {
    try {
      const coordinates = await getCurrentLocation();
      flyTo(coordinates, zoom);
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  };

  return {
    flyTo,
    fitBounds,
    resetView,
    getCurrentLocation,
    flyToCurrentLocation
  };
};