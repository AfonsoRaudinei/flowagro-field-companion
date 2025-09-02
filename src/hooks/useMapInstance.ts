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

  const flyTo = (coordinates: [number, number], zoom?: number, showMarker: boolean = false) => {
    if (map) {
      console.log('🛩️ Flying to coordinates:', coordinates, 'at zoom:', zoom);
      
      if (showMarker) {
        // Add a more visible temporary marker for location display
        const markerId = 'user-location-marker';
        
        // Remove existing marker if any
        if (map.getLayer(markerId)) {
          map.removeLayer(markerId);
        }
        if (map.getSource(markerId)) {
          map.removeSource(markerId);
        }

        // Add animated location marker
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

        // Outer pulsing circle
        map.addLayer({
          id: markerId + '-pulse',
          type: 'circle',
          source: markerId,
          paint: {
            'circle-radius': 20,
            'circle-color': 'rgba(0, 87, 255, 0.3)',
            'circle-stroke-width': 0,
            'circle-opacity': ['case', ['==', ['%', ['get', 'timestamp'], 2000], 0], 0.6, 0.2]
          }
        });

        // Inner solid circle
        map.addLayer({
          id: markerId,
          type: 'circle',
          source: markerId,
          paint: {
            'circle-radius': 8,
            'circle-color': '#0057ff',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff'
          }
        });

        // Remove marker after 8 seconds
        setTimeout(() => {
          if (map.getLayer(markerId + '-pulse')) {
            map.removeLayer(markerId + '-pulse');
          }
          if (map.getLayer(markerId)) {
            map.removeLayer(markerId);
          }
          if (map.getSource(markerId)) {
            map.removeSource(markerId);
          }
        }, 8000);
      }

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

  const validateCoordinates = (lng: number, lat: number): boolean => {
    // Validate longitude (-180 to 180)
    if (lng < -180 || lng > 180) {
      console.error('Invalid longitude:', lng);
      return false;
    }
    
    // Validate latitude (-90 to 90)
    if (lat < -90 || lat > 90) {
      console.error('Invalid latitude:', lat);
      return false;
    }
    
    // Check if coordinates are within Brazil bounds (approximate)
    const brazilBounds = {
      north: 5.27,     // Roraima
      south: -33.75,   // Rio Grande do Sul
      east: -28.85,    // Fernando de Noronha
      west: -73.98     // Acre
    };
    
    if (lat > brazilBounds.north || lat < brazilBounds.south || 
        lng > brazilBounds.east || lng < brazilBounds.west) {
      console.warn('Coordinates outside Brazil bounds. Lat:', lat, 'Lng:', lng);
      // Don't reject, just warn - could be a border area or valid international location
    }
    
    return true;
  };

  const getCurrentLocation = (): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalização não é suportada neste dispositivo'));
        return;
      }

      console.log('🔍 Requesting current location...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          const accuracy = position.coords.accuracy;
          
          console.log('📍 Raw GPS coordinates:');
          console.log('  Latitude:', lat);
          console.log('  Longitude:', lng);
          console.log('  Accuracy:', accuracy, 'meters');
          console.log('  Timestamp:', new Date(position.timestamp));
          
          // Validate coordinates
          if (!validateCoordinates(lng, lat)) {
            reject(new Error('Coordenadas inválidas obtidas do GPS'));
            return;
          }
          
          // Log formatted coordinates for Mapbox
          console.log('🗺️ Mapbox format [lng, lat]:', [lng, lat]);
          
          // Check accuracy and warn if poor
          if (accuracy > 100) {
            console.warn('⚠️ GPS accuracy is poor:', accuracy, 'meters');
          }
          
          resolve([lng, lat]);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          
          let errorMessage = 'Não foi possível obter sua localização';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão de localização negada. Verifique as configurações do navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Localização indisponível. Verifique se o GPS está ativado.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tempo limite para obter localização. Tente novamente.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 60000 // Reduced to 1 minute for more current location
        }
      );
    });
  };

  const flyToCurrentLocation = async (zoom: number = 15, retryCount: number = 0) => {
    try {
      console.log(`🚀 Attempt ${retryCount + 1} to get current location`);
      
      const coordinates = await getCurrentLocation();
      
      console.log('✅ Successfully obtained location coordinates:');
      console.log('  Formatted for Mapbox [lng, lat]:', coordinates);
      console.log('  Decimal degrees: Lng =', coordinates[0], ', Lat =', coordinates[1]);
      
      // Fly to location with marker
      flyTo(coordinates, zoom, true);
      
      return coordinates;
    } catch (error) {
      console.error(`❌ Failed to get current location (attempt ${retryCount + 1}):`, error);
      
      // Retry up to 2 times with different settings
      if (retryCount < 2) {
        console.log(`🔄 Retrying with different settings... (${retryCount + 1}/2)`);
        
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return flyToCurrentLocation(zoom, retryCount + 1);
      }
      
      // If all retries failed, provide fallback coordinates (center of Brazil)
      if (retryCount >= 2) {
        console.log('🗺️ Using fallback location (center of Brazil)');
        const fallbackCoords: [number, number] = [-47.8919, -15.7975]; // Brasília
        flyTo(fallbackCoords, zoom, true);
        
        throw new Error('Não foi possível obter sua localização. Mostrando centro do Brasil.');
      }
      
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