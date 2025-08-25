import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMap } from './MapProvider';
import { getMapTilerToken, getStyleUrl, DEFAULT_MAP_CONFIG } from '@/services/mapService';
import { cn } from '@/lib/utils';

interface BaseMapProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  style?: React.CSSProperties;
  showNavigation?: boolean;
  showFullscreen?: boolean;
  showGeolocate?: boolean;
  interactive?: boolean;
}

export const BaseMap: React.FC<BaseMapProps> = ({
  className,
  center = DEFAULT_MAP_CONFIG.center,
  zoom = DEFAULT_MAP_CONFIG.zoom,
  style,
  showNavigation = true,
  showFullscreen = true, 
  showGeolocate = true,
  interactive = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { 
    setMap, 
    setLoading, 
    setError, 
    token, 
    setToken, 
    currentStyle,
    isFullscreen 
  } = useMap();

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current) return;

      try {
        setLoading(true);
        setError(null);

        // Get MapTiler token
        let apiToken = token;
        if (!apiToken) {
          apiToken = await getMapTilerToken();
          if (!apiToken) {
            throw new Error('MapTiler token not available');
          }
          setToken(apiToken);
        }

        // Initialize Mapbox GL
        const styleUrl = getStyleUrl(currentStyle, apiToken);
        
        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: styleUrl,
          center,
          zoom,
          pitch: DEFAULT_MAP_CONFIG.pitch,
          bearing: DEFAULT_MAP_CONFIG.bearing,
          interactive,
          attributionControl: false
        });

        // Add navigation controls
        if (showNavigation) {
          const nav = new mapboxgl.NavigationControl({
            visualizePitch: true,
            showZoom: true,
            showCompass: true
          });
          mapInstance.addControl(nav, 'top-right');
        }

        // Add fullscreen control
        if (showFullscreen) {
          const fullscreen = new mapboxgl.FullscreenControl();
          mapInstance.addControl(fullscreen, 'top-right');
        }

        // Add geolocate control
        if (showGeolocate) {
          const geolocate = new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
          });
          mapInstance.addControl(geolocate, 'top-right');
        }

        // Add attribution
        mapInstance.addControl(new mapboxgl.AttributionControl({
          compact: true
        }), 'bottom-right');

        map.current = mapInstance;
        setMap(mapInstance);
        setLoading(false);

        // Handle map load
        mapInstance.on('load', () => {
          console.log('Map loaded successfully');
        });

        mapInstance.on('error', (e) => {
          console.error('Map error:', e);
          setError('Failed to load map');
        });

      } catch (error) {
        console.error('Map initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Map initialization failed');
        setLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMap(null);
      }
    };
  }, [center, zoom, interactive, showNavigation, showFullscreen, showGeolocate]);

  // Update map style when currentStyle changes
  useEffect(() => {
    if (map.current && token) {
      const styleUrl = getStyleUrl(currentStyle, token);
      map.current.setStyle(styleUrl);
    }
  }, [currentStyle, token]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={mapContainer} 
      className={cn(
        "w-full h-full rounded-lg overflow-hidden",
        isFullscreen && "rounded-none",
        className
      )}
      style={style}
    />
  );
};