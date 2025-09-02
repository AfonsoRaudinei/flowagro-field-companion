import { useEffect, useState } from 'react';
import { useMap } from '@/components/maps/MapProvider';
import type { Map as MapboxMap } from 'mapbox-gl';

/**
 * Hook to safely access map instance with loading state
 */
export const useMapInstance = () => {
  const mapContext = useMap();
  
  // Defensive check - return safe defaults if context isn't available
  if (!mapContext) {
    return {
      map: null,
      isLoading: true,
      error: null,
      isReady: false
    };
  }
  
  const { map, isLoading, error } = mapContext;
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
      console.log('Flying to coordinates:', coordinates, 'at zoom:', zoom);
      
      // Add a temporary marker to show the location
      const markerId = 'temp-location-marker';
      
      // Remove existing marker if any
      if (map.getLayer(markerId)) {
        map.removeLayer(markerId);
      }
      if (map.getSource(markerId)) {
        map.removeSource(markerId);
      }

      // Add temporary location marker
      map.addSource(markerId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: coordinates
          }
        }
      });

      map.addLayer({
        id: markerId,
        type: 'circle',
        source: markerId,
        paint: {
          'circle-radius': 10,
          'circle-color': '#ff0000',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Remove marker after 5 seconds
      setTimeout(() => {
        if (map.getLayer(markerId)) {
          map.removeLayer(markerId);
        }
        if (map.getSource(markerId)) {
          map.removeSource(markerId);
        }
      }, 5000);

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
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          console.log('Raw GPS coordinates - Lat:', lat, 'Lng:', lng);
          console.log('Returning as [lng, lat] for Mapbox:', [lng, lat]);
          resolve([lng, lat]);
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  };

  const flyToCurrentLocation = async (zoom: number = 15) => {
    try {
      const coordinates = await getCurrentLocation();
      console.log('Location coordinates (lng, lat):', coordinates);
      flyTo(coordinates, zoom);
    } catch (error) {
      console.error('Failed to get current location:', error);
      throw error;
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