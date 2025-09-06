import React, { useEffect, useRef, useState } from 'react';
import * as mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface SimpleBaseMapProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  style?: React.CSSProperties;
  showNativeControls?: boolean;
  showUserMarker?: boolean;
}

export const SimpleBaseMap: React.FC<SimpleBaseMapProps> = ({
  className,
  center = [-15.7975, -47.8919], // Brasília
  zoom = 4,
  style,
  showNativeControls = true,
  showUserMarker = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initializeMap = async () => {
      if (!mapContainer.current || map.current) return;
      
      logger.info('SimpleBaseMap: Starting map configuration...');
      setIsLoading(true);
      setError(null);
      
      try {
        logger.debug('SimpleBaseMap: Fetching MapTiler token...');
        const { data, error: tokenError } = await supabase.functions.invoke('maptiler-token');
        
        if (!isMounted) return;
        
        let token = null;
        if (tokenError) {
          logger.warn('SimpleBaseMap: Error fetching token', { error: tokenError.message });
        } else if (data?.key) {
          token = data.key;
          logger.info('SimpleBaseMap: MapTiler token obtained successfully');
        } else {
          logger.info('SimpleBaseMap: Token not found, using OpenStreetMap');
        }
        
        logger.info('SimpleBaseMap: Creating Mapbox GL instance...');
        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: token ? 
            `https://api.maptiler.com/maps/satellite/style.json?key=${token}` : 
            JSON.stringify({
              version: 8,
              name: "OpenStreetMap",
              sources: {
                osm: {
                  type: "raster",
                  tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                  tileSize: 256,
                  attribution: "© OpenStreetMap contributors"
                }
              },
              layers: [
                {
                  id: "osm-layer",
                  type: "raster",
                  source: "osm"
                }
              ]
            }),
          center: center || [-15.7975, -47.8919],
          zoom: zoom || 4,
          accessToken: token || undefined,
        });
        
        logger.debug('SimpleBaseMap: Instance created, waiting for load...');
        
        // Add controls conditionally
        if (showNativeControls) {
          mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
          mapInstance.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
          }), 'top-right');
        }
        // Attribution is always required
        mapInstance.addControl(new mapboxgl.AttributionControl(), 'bottom-right');
        
        // Event listeners
        mapInstance.on('load', () => {
          if (!isMounted) return;
          logger.info('SimpleBaseMap: Map loaded completely');
          setIsLoading(false);
        });
        
        mapInstance.on('error', (e) => {
          if (!isMounted) return;
          logger.error('SimpleBaseMap: Map error occurred', { error: e });
          setError(`Erro ao carregar o mapa: ${e.error?.message || 'Erro desconhecido'}`);
          setIsLoading(false);
        });
        
        if (isMounted) {
          map.current = mapInstance;
        }
        
      } catch (err) {
        if (!isMounted) return;
        logger.error('SimpleBaseMap: Initialization error', { error: err });
        setError(`Erro na inicialização do mapa: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        setIsLoading(false);
      }
    };
    
    initializeMap();
    
    return () => {
      isMounted = false;
      if (map.current) {
        logger.debug('SimpleBaseMap: Cleaning up map instance');
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (map.current && center) {
      logger.debug('SimpleBaseMap: Updating map center', { center, zoom });
      map.current.flyTo({
        center: center,
        zoom: zoom,
        speed: 1.2,
        curve: 1.42,
        essential: true
      });
      
      // Add or update user marker if showUserMarker is true
      if (showUserMarker) {
        // Remove existing marker if any
        if (map.current.getSource('user-location')) {
          map.current.removeLayer('user-location-circle');
          map.current.removeLayer('user-location-dot');
          map.current.removeSource('user-location');
        }
        
        // Add new marker
        map.current.addSource('user-location', {
          type: 'geojson',
          data: {
            type: 'Point',
            coordinates: center
          }
        });
        
        // Add pulsing circle
        map.current.addLayer({
          id: 'user-location-circle',
          type: 'circle',
          source: 'user-location',
          paint: {
            'circle-radius': 20,
            'circle-color': '#3b82f6',
            'circle-opacity': 0.3,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#3b82f6',
            'circle-stroke-opacity': 0.8
          }
        });
        
        // Add center dot
        map.current.addLayer({
          id: 'user-location-dot',
          type: 'circle',
          source: 'user-location',
          paint: {
            'circle-radius': 6,
            'circle-color': '#3b82f6',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });
        
        logger.info('SimpleBaseMap: User location marker added', { center });
      }
    }
  }, [center, zoom, showUserMarker]);

  const handleRetry = () => {
    setError(null);
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    // Re-trigger initialization
    window.location.reload();
  };

  return (
    <div className={cn("relative w-full h-full", className)} style={style}>
      {/* Mapa */}
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden"
      />
      
      {/* Status overlay */}
      {(isLoading || error) && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md">
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                <span>Carregando mapa...</span>
              </div>
            )}
            
            {error && (
              <div className="text-center">
                <div className="text-destructive mb-3">❌ {error}</div>
                <button 
                  onClick={handleRetry}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};