import { useState, useCallback, useEffect } from 'react';
import { useMapInstance } from './useMapInstance';
import mapboxgl from 'mapbox-gl';

export interface MapPin {
  id: string;
  coordinates: [number, number];
  title?: string;
  description?: string;
  color?: string;
  type?: 'default' | 'farm' | 'measurement' | 'custom';
  createdAt: Date;
}

export const useMapPins = () => {
  const { map, isReady } = useMapInstance();
  const [pins, setPins] = useState<MapPin[]>([]);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [markers, setMarkers] = useState<Map<string, mapboxgl.Marker>>(new Map());

  // Add pin to map
  const addPin = useCallback((pin: Omit<MapPin, 'id' | 'createdAt'>) => {
    const newPin: MapPin = {
      ...pin,
      id: `pin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    setPins(prev => [...prev, newPin]);
    return newPin;
  }, []);

  // Remove pin
  const removePin = useCallback((pinId: string) => {
    setPins(prev => prev.filter(pin => pin.id !== pinId));
    
    // Remove marker from map
    const marker = markers.get(pinId);
    if (marker) {
      marker.remove();
      setMarkers(prev => {
        const newMarkers = new Map(prev);
        newMarkers.delete(pinId);
        return newMarkers;
      });
    }
  }, [markers]);

  // Update pin
  const updatePin = useCallback((pinId: string, updates: Partial<MapPin>) => {
    setPins(prev => prev.map(pin => 
      pin.id === pinId ? { ...pin, ...updates } : pin
    ));
  }, []);

  // Clear all pins
  const clearAllPins = useCallback(() => {
    setPins([]);
    markers.forEach(marker => marker.remove());
    setMarkers(new Map());
  }, [markers]);

  // Toggle pin adding mode
  const toggleAddingMode = useCallback(() => {
    setIsAddingPin(prev => !prev);
    if (map) {
      map.getCanvas().style.cursor = isAddingPin ? 'default' : 'crosshair';
    }
  }, [map, isAddingPin]);

  // Handle map click to add pin
  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (isAddingPin) {
      const newPin = addPin({
        coordinates: [e.lngLat.lng, e.lngLat.lat],
        title: `Pin ${pins.length + 1}`,
        type: 'default'
      });
      setIsAddingPin(false);
      if (map) {
        map.getCanvas().style.cursor = 'default';
      }
    }
  }, [isAddingPin, addPin, pins.length, map]);

  // Create markers on map
  useEffect(() => {
    if (!map || !isReady) return;

    pins.forEach(pin => {
      if (!markers.has(pin.id)) {
        const el = document.createElement('div');
        el.className = 'map-pin-marker';
        el.style.cssText = `
          width: 24px;
          height: 24px;
          background: ${pin.color || '#3b82f6'};
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat(pin.coordinates)
          .addTo(map);

        // Add popup
        if (pin.title || pin.description) {
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                ${pin.title ? `<h3 class="font-semibold text-sm">${pin.title}</h3>` : ''}
                ${pin.description ? `<p class="text-xs text-gray-600 mt-1">${pin.description}</p>` : ''}
                <div class="text-xs text-gray-500 mt-2">
                  ${pin.coordinates[1].toFixed(6)}, ${pin.coordinates[0].toFixed(6)}
                </div>
              </div>
            `);
          
          marker.setPopup(popup);
        }

        setMarkers(prev => new Map(prev).set(pin.id, marker));
      }
    });

    // Remove markers for deleted pins
    markers.forEach((marker, pinId) => {
      if (!pins.find(pin => pin.id === pinId)) {
        marker.remove();
        setMarkers(prev => {
          const newMarkers = new Map(prev);
          newMarkers.delete(pinId);
          return newMarkers;
        });
      }
    });
  }, [pins, map, isReady, markers]);

  // Add click listener for pin adding
  useEffect(() => {
    if (!map || !isReady) return;

    if (isAddingPin) {
      map.on('click', handleMapClick);
    } else {
      map.off('click', handleMapClick);
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, isReady, isAddingPin, handleMapClick]);

  return {
    pins,
    isAddingPin,
    addPin,
    removePin,
    updatePin,
    clearAllPins,
    toggleAddingMode
  };
};