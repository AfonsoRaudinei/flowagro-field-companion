import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMap } from './MapProvider';
import { getMapTilerToken, getStyleUrl, DEFAULT_MAP_CONFIG } from '@/services/mapService';
import { MapErrorBoundary } from './MapErrorBoundary';
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
  const mapContext = useMap();
  
  // Defensive check - render placeholder if context isn't available
  if (!mapContext) {
    return (
      <div 
        className={cn("w-full h-full bg-muted animate-pulse rounded-lg", className)}
        style={style}
      />
    );
  }
  
  const { 
    setMap, 
    setLoading, 
    setError, 
    token, 
    setToken, 
    currentStyle,
    isFullscreen 
  } = mapContext;

  // Initialize map
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current) return;

      try {
        setLoading(true);
        setError(null);
        console.log('Initializing map...');

        // Get MapTiler token with fallback
        let apiToken = token;
        if (!apiToken) {
          console.log('No token available, fetching from server...');
          apiToken = await getMapTilerToken();
          if (apiToken) {
            setToken(apiToken);
            console.log('MapTiler token obtained successfully');
          } else {
            console.warn('MapTiler token not available, will use fallback');
          }
        }

        // Initialize Mapbox GL with fallback handling
        const styleUrl = getStyleUrl(currentStyle, apiToken || undefined);
        console.log('Using style URL:', typeof styleUrl === 'string' ? 'MapTiler' : 'OpenStreetMap fallback');
        
        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: styleUrl,
          center,
          zoom,
          pitch: DEFAULT_MAP_CONFIG.pitch,
          bearing: DEFAULT_MAP_CONFIG.bearing,
          interactive,
          attributionControl: false,
          preserveDrawingBuffer: true, // Better for screenshots
          failIfMajorPerformanceCaveat: false // Allow fallback rendering
        });

        console.log('Mapbox instance created, waiting for load...');

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

        // Handle map events with detailed logging
        mapInstance.on('load', () => {
          console.log('Map loaded successfully!');
          console.log('Map style loaded:', mapInstance.getStyle().name || 'Unknown style');
        });

        mapInstance.on('error', (e) => {
          console.error('Map error:', e);
          setError(`Map error: ${e.error?.message || 'Unknown error'}`);
        });

        mapInstance.on('styledata', () => {
          console.log('Map style data loaded');
        });

        mapInstance.on('sourcedata', (e) => {
          if (e.isSourceLoaded && e.sourceId) {
            console.log(`Source loaded: ${e.sourceId}`);
          }
        });

      } catch (error) {
        console.error('Map initialization failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Map initialization failed';
        console.error('Full error details:', error);
        setError(errorMessage);
        setLoading(false);
        
        // Try to provide helpful error context
        if (errorMessage.includes('token')) {
          console.error('Token-related error - check MAPTILER_API_KEY configuration');
        } else if (errorMessage.includes('network')) {
          console.error('Network error - check internet connection');
        } else if (errorMessage.includes('WebGL')) {
          console.error('WebGL error - browser may not support map rendering');
        }
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

  const handleRetry = () => {
    setError(null);
    // Re-trigger initialization by clearing the map
    if (map.current) {
      map.current.remove();
      map.current = null;
      setMap(null);
    }
  };

  return (
    <MapErrorBoundary error={mapContext.error} isLoading={mapContext.isLoading} onRetry={handleRetry}>
      <div 
        ref={mapContainer} 
        className={cn(
          "w-full h-full rounded-lg overflow-hidden",
          isFullscreen && "rounded-none",
          className
        )}
        style={style}
      />
    </MapErrorBoundary>
  );
};