import { useState, useCallback, useEffect } from 'react';
import { useMapInstance } from './useMapInstance';
import { supabase } from '@/integrations/supabase/client';
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

  // Load pins from Supabase
  const loadPins = useCallback(async () => {
    const { data, error } = await supabase
      .from('pins')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading pins:', error);
      return;
    }

    const loadedPins: MapPin[] = data.map(pin => ({
      id: pin.id,
      coordinates: pin.coordinates as [number, number],
      title: pin.title || undefined,
      description: pin.description || undefined,
      color: pin.color || '#3b82f6',
      type: (pin.pin_type as MapPin['type']) || 'default',
      createdAt: new Date(pin.created_at)
    }));

    setPins(loadedPins);
  }, []);

  // Add pin to map and save to Supabase
  const addPin = useCallback(async (pin: Omit<MapPin, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('pins')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        coordinates: pin.coordinates,
        title: pin.title,
        description: pin.description,
        color: pin.color || '#3b82f6',
        pin_type: pin.type || 'default'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving pin:', error);
      return null;
    }

    const newPin: MapPin = {
      id: data.id,
      coordinates: data.coordinates as [number, number],
      title: data.title || undefined,
      description: data.description || undefined,
      color: data.color || '#3b82f6',
      type: (data.pin_type as MapPin['type']) || 'default',
      createdAt: new Date(data.created_at)
    };

    setPins(prev => [...prev, newPin]);
    return newPin;
  }, []);

  // Remove pin and delete from Supabase
  const removePin = useCallback(async (pinId: string) => {
    const { error } = await supabase
      .from('pins')
      .delete()
      .eq('id', pinId);

    if (error) {
      console.error('Error deleting pin:', error);
      return;
    }

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

  // Update pin and save to Supabase
  const updatePin = useCallback(async (pinId: string, updates: Partial<MapPin>) => {
    const { error } = await supabase
      .from('pins')
      .update({
        title: updates.title,
        description: updates.description,
        color: updates.color,
        pin_type: updates.type,
        coordinates: updates.coordinates
      })
      .eq('id', pinId);

    if (error) {
      console.error('Error updating pin:', error);
      return;
    }

    setPins(prev => prev.map(pin => 
      pin.id === pinId ? { ...pin, ...updates } : pin
    ));
  }, []);

  // Clear all pins and delete from Supabase
  const clearAllPins = useCallback(async () => {
    const { error } = await supabase
      .from('pins')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all user's pins

    if (error) {
      console.error('Error clearing pins:', error);
      return;
    }

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

  // Load pins on initialization
  useEffect(() => {
    if (isReady) {
      loadPins();
    }
  }, [isReady, loadPins]);

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
    toggleAddingMode,
    loadPins
  };
};