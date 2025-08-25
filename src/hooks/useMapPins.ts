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

  // Get pin type icon
  const getPinTypeIcon = (type: string) => {
    switch (type) {
      case 'farm': return '🚜';
      case 'measurement': return '📏';
      case 'custom': return '⚙️';
      default: return '📍';
    }
  };

  // Create markers on map
  useEffect(() => {
    if (!map || !isReady) return;

    pins.forEach(pin => {
      if (!markers.has(pin.id)) {
        const el = document.createElement('div');
        el.className = 'map-pin-marker';
        
        // Create pin with icon and background
        const pinIcon = getPinTypeIcon(pin.type || 'default');
        el.innerHTML = `
          <div style="
            width: 32px;
            height: 32px;
            background: ${pin.color || '#0057FF'};
            border: 3px solid white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            position: relative;
            transition: all 0.2s ease;
          " class="pin-marker">
            ${pinIcon}
          </div>
        `;

        // Add hover effects
        el.addEventListener('mouseenter', () => {
          const pinEl = el.querySelector('.pin-marker') as HTMLElement;
          if (pinEl) {
            pinEl.style.transform = 'scale(1.1)';
            pinEl.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
          }
        });
        
        el.addEventListener('mouseleave', () => {
          const pinEl = el.querySelector('.pin-marker') as HTMLElement;
          if (pinEl) {
            pinEl.style.transform = 'scale(1)';
            pinEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
          }
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat(pin.coordinates)
          .addTo(map);

        // Add popup with enhanced styling
        const typeLabels = {
          farm: 'Fazenda',
          measurement: 'Medição', 
          custom: 'Personalizado',
          default: 'Pin'
        };
        
        const popup = new mapboxgl.Popup({ 
          offset: 35,
          className: 'pin-popup'
        }).setHTML(`
          <div style="padding: 12px; min-width: 180px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="
                width: 16px; 
                height: 16px; 
                background: ${pin.color || '#0057FF'};
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              "></div>
              <span style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
                ${typeLabels[pin.type as keyof typeof typeLabels] || 'Pin'}
              </span>
            </div>
            ${pin.title ? `<h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0; color: #1a1a1a;">${pin.title}</h3>` : ''}
            ${pin.description ? `<p style="font-size: 12px; color: #666; margin: 0 0 8px 0; line-height: 1.4;">${pin.description}</p>` : ''}
            <div style="font-size: 10px; color: #999; font-family: monospace;">
              ${pin.coordinates[1].toFixed(6)}, ${pin.coordinates[0].toFixed(6)}
            </div>
          </div>
        `);
        
        marker.setPopup(popup);
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